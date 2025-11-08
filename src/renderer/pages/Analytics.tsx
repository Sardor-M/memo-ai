import React, { useState, useRef, useEffect } from "react";
import RecordRTC, { StereoAudioRecorder } from "recordrtc";
import { Buffer } from "buffer";


interface TranscriptEntry {
  text: string;
  timestamp: number;
}

const AudioRecorder: React.FC = () => {
  const [recording, setRecording] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const recorderRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (recording) {
      intervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setElapsedTime(0);
    }
  }, [recording]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new RecordRTC(stream, {
      type: "audio",
      mimeType: "audio/wav",
      recorderType: StereoAudioRecorder,
      timeSlice: 2000, // every 2 seconds
      desiredSampRate: 16000,
      ondataavailable: async (blob: Blob) => {
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log("Sending audio chunk to Whisper...");
        const result = await window.electronAPI?.transcribeBuffer(buffer);

        console.log("Result: ", result)

        if (result?.segments?.length) {
          result.segments.forEach((seg: { text: any; }) =>
            setTranscripts((prev) => [
              ...prev,
              { text: seg.text, timestamp: Date.now() },
            ])
          );
        } else if (result?.text) {
          setTranscripts((prev) => [
            ...prev,
            { text: result.text, timestamp: Date.now() },
          ]);
        }
      },
    });

    recorder.startRecording();
    recorderRef.current = recorder;
    setRecording(true);
  };

  const stopRecording = async () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    recorder.stopRecording(() => {
      setRecording(false);
    });
  };

  return (
    <div style={{ padding: 20, maxWidth: 600 }}>
      <h2>🎙️ Whisper Live Transcription</h2>

      <button
        onClick={recording ? stopRecording : startRecording}
        style={{
          padding: "10px 20px",
          backgroundColor: recording ? "#e74c3c" : "#2ecc71",
          color: "#fff",
          border: "none",
          borderRadius: 5,
          cursor: "pointer",
          marginBottom: 10,
        }}
      >
        {recording ? "Stop Recording" : "Start Recording"}
      </button>

      {recording && <p>Recording... Elapsed: {elapsedTime}s</p>}

      <div
        style={{
          maxHeight: 300,
          overflowY: "auto",
          backgroundColor: "#f4f4f4",
          padding: 10,
          borderRadius: 5,
        }}
      >
        {transcripts.map((t, i) => (
          <div key={i}>
            <strong>[{new Date(t.timestamp).toLocaleTimeString()}]</strong> {t.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AudioRecorder;
