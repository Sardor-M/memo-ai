import { useState, useEffect, useRef, useCallback } from 'react';

type UseAssemblyAIOptions = {
  apiKey: string;
  onTranscript?: (text: string) => void;
  onError?: (error: string) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export function useAssemblyAI(options: UseAssemblyAIOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const finalTranscriptRef = useRef('');
  const partialTranscriptRef = useRef('');

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const CONNECTION_PARAMS = {
    token: options.apiKey,
    sampleRate: 16000,
    formatTurns: true,
    endOfTurnConfidenceThreshold: 0.7,
    minEndOfTurnSilenceWhenConfident: 160,
    maxTurnSilence: 2400,
    language: 'en',
  };

  const API_ENDPOINT = `wss://streaming.assemblyai.com/v3/ws?${new URLSearchParams(
    Object.entries(CONNECTION_PARAMS).map(([k, v]) => [k, String(v)])
  ).toString()}`;

  const connect = useCallback(async () => {
    return new Promise<void>((resolve, reject) => {
      finalTranscriptRef.current = '';
      partialTranscriptRef.current = '';
      setTranscript('');

      console.log('🔌 Starting AssemblyAI connection...');
      console.log('📍 API Endpoint:', API_ENDPOINT);
      
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          console.log('✅ Microphone access granted');
          streamRef.current = stream;
          
          // Create WebSocket connection
          wsRef.current = new WebSocket(API_ENDPOINT);
          wsRef.current.binaryType = 'arraybuffer';

          wsRef.current.onopen = () => {
            console.log('✅ AssemblyAI WebSocket OPEN');
            console.log('📊 WebSocket State:', wsRef.current?.readyState);
            setIsConnected(true);
            options.onConnectionChange?.(true);

            // Setup audio processing with PCM16 encoding
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
              sampleRate: 16000,
            });
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);

            source.connect(processor);
            processor.connect(audioContext.destination);

            processor.onaudioprocess = (event) => {
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                const audioData = event.inputBuffer.getChannelData(0);
                // Convert float32 to PCM16
                const pcm16Data = new Int16Array(audioData.length);
                for (let i = 0; i < audioData.length; i++) {
                  const s = Math.max(-1, Math.min(1, audioData[i]));
                  pcm16Data[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
                }
                console.log('📤 Sending audio chunk:', pcm16Data.buffer.byteLength, 'bytes');
                wsRef.current.send(pcm16Data.buffer);
              } else {
                console.log('⚠️ WebSocket not ready. State:', wsRef.current?.readyState);
              }
            };

            setIsRecording(true);
            resolve();
          };

          wsRef.current.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);

              if (data.type === 'PartialTranscript') {
                const partialTextRaw = data.text || '';
                const partialText = partialTextRaw.replace(/\s+/g, ' ').trim();
                // keeps only the delta beyond the saved history
                if (partialText) {
                  const finalSanitized = finalTranscriptRef.current.replace(/\s+/g, ' ').trim();
                  let newPartial = partialText;
                  if (
                    finalSanitized &&
                    partialText.toLowerCase().startsWith(finalSanitized.toLowerCase()) &&
                    partialText.length >= finalSanitized.length
                  ) {
                    newPartial = partialText.slice(finalSanitized.length).replace(/\s+/g, ' ').trim();
                  }
                  partialTranscriptRef.current = newPartial;
                  const combined = [finalTranscriptRef.current, partialTranscriptRef.current]
                    .filter(Boolean)
                    .join(' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                  setTranscript(combined);
                }
                return;
              }

              if (data.type === 'Turn') {
                const transcriptTextRaw = data.transcript || '';
                const transcriptText = transcriptTextRaw.replace(/\s+/g, ' ').trim();
                if (!transcriptText) {
                  return;
                }
                if (data.turn_is_formatted) {
                  const currentFinal = finalTranscriptRef.current.replace(/\s+/g, ' ').trim();
                  let newFinal = transcriptText;
                  if (currentFinal) {
                    const currentLower = currentFinal.toLowerCase();
                    const textLower = transcriptText.toLowerCase();
                    if (textLower.startsWith(currentLower) && transcriptText.length >= currentFinal.length) {
                      newFinal = transcriptText;
                    } else if (!currentLower.includes(textLower)) {
                      newFinal = [currentFinal, transcriptText].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
                    } else {
                      newFinal = currentFinal;
                    }
                  }
                  finalTranscriptRef.current = newFinal;
                  partialTranscriptRef.current = '';
                  setTranscript(newFinal);
                  options.onTranscript?.(transcriptText);
                } else {
                  const currentFinal = finalTranscriptRef.current.replace(/\s+/g, ' ').trim();
                  let newPartial = transcriptText;
                  if (
                    currentFinal &&
                    transcriptText.toLowerCase().startsWith(currentFinal.toLowerCase()) &&
                    transcriptText.length >= currentFinal.length
                  ) {
                    newPartial = transcriptText.slice(currentFinal.length).replace(/\s+/g, ' ').trim();
                  }
                  partialTranscriptRef.current = newPartial;
                  const combined = [finalTranscriptRef.current, partialTranscriptRef.current]
                    .filter(Boolean)
                    .join(' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                  setTranscript(combined);
                }
              }
            } catch (err) {
              console.error('❌ Error parsing message:', err);
            }
          };

          wsRef.current.onerror = (event) => {
            const errorMsg = `WebSocket error: ${event}`;
            setError(errorMsg);
            options.onError?.(errorMsg);
            reject(new Error(errorMsg));
          };

          wsRef.current.onclose = () => {
            setIsConnected(false);
            options.onConnectionChange?.(false);
          };
        })
        .catch((err) => {
          const errorMsg = `Microphone error: ${err.message}`;
          setError(errorMsg);
          options.onError?.(errorMsg);
          reject(err);
        });
    });
  }, [options, API_ENDPOINT]);

  const disconnect = useCallback(() => {
    // Stop media recorder
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (err) {
        // Ignore close errors
      }
      wsRef.current = null;
    }

    // Stop audio stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Stop audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsConnected(false);
    setIsRecording(false);
  }, []);

  const clearTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    partialTranscriptRef.current = '';
    setTranscript('');
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isRecording,
    transcript,
    error,
    connect,
    disconnect,
    clearTranscript,
    clearError,
  };
}


