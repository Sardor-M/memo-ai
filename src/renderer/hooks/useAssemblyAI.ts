import { useState, useEffect, useRef, useCallback } from 'react';

const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim();

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
  const formattedTurnsRef = useRef<Array<{ id: string | number | null; text: string }>>([]);
  const currentTurnIdRef = useRef<string | number | null>(null);

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
      formattedTurnsRef.current = [];
      finalTranscriptRef.current = '';
      partialTranscriptRef.current = '';
      currentTurnIdRef.current = null;
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
                const partialTextRaw = data.text ?? data.transcript ?? '';
                const partialText = normalizeText(partialTextRaw);

                if (!partialText) {
                  partialTranscriptRef.current = '';
                  setTranscript(finalTranscriptRef.current);
                  return;
                }

                const turnIdentifier =
                  data.turn_id ??
                  data.turnId ??
                  data.id ??
                  data.turn_order ??
                  data.turnOrder ??
                  currentTurnIdRef.current ??
                  `turn-${formattedTurnsRef.current.length}`;

                currentTurnIdRef.current = turnIdentifier;

                const historyText = normalizeText(
                  formattedTurnsRef.current.map((turn) => turn.text).join(' ')
                );
                finalTranscriptRef.current = historyText;

                if (
                  historyText &&
                  historyText.length >= partialText.length &&
                  historyText.toLowerCase().startsWith(partialText.toLowerCase())
                ) {
                  partialTranscriptRef.current = '';
                  setTranscript(historyText);
                  return;
                }

                if (
                  historyText &&
                  partialText.toLowerCase().startsWith(historyText.toLowerCase())
                ) {
                  partialTranscriptRef.current = normalizeText(
                    partialText.slice(historyText.length)
                  );
                } else {
                  partialTranscriptRef.current = partialText;
                }

                const combined = normalizeText(
                  [historyText, partialTranscriptRef.current].filter(Boolean).join(' ')
                );
                setTranscript(combined);
                return;
              }

              if (data.type === 'Turn') {
                const formattedRaw = data.transcript ?? '';
                const formattedText = normalizeText(formattedRaw);

                if (!formattedText) {
                  return;
                }

                const turnIdentifier =
                  data.turn_id ??
                  data.turnId ??
                  data.id ??
                  data.turn_order ??
                  data.turnOrder ??
                  currentTurnIdRef.current ??
                  `turn-${formattedTurnsRef.current.length}`;

                const turns = formattedTurnsRef.current;
                const lastIndex = turns.length - 1;
                let targetIndex = turns.findIndex((turn) => turn.id === turnIdentifier);

                if (targetIndex === -1 && lastIndex >= 0) {
                  const lastText = turns[lastIndex].text;
                  if (formattedText.toLowerCase().startsWith(lastText.toLowerCase())) {
                    targetIndex = lastIndex;
                  }
                }

                if (targetIndex >= 0) {
                  turns[targetIndex] = {
                    id: turns[targetIndex].id ?? turnIdentifier,
                    text: formattedText,
                  };
                } else {
                  turns.push({
                    id: turnIdentifier,
                    text: formattedText,
                  });
                }

                currentTurnIdRef.current = null;
                partialTranscriptRef.current = '';

                finalTranscriptRef.current = normalizeText(
                  turns.map((turn) => turn.text).join(' ')
                );
                setTranscript(finalTranscriptRef.current);
                options.onTranscript?.(formattedText);
                return;
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
    formattedTurnsRef.current = [];
    currentTurnIdRef.current = null;
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


