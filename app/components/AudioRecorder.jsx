'use client';
import { useState, useRef } from 'react';

export default function AudioRecorder({ onAudioReady }) {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunksRef.current.push(event.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      if (onAudioReady) onAudioReady(audioBlob);
    };

    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex flex-col items-center gap-2 w-full">
      {!recording ? (
        <button
          type="button"
          onClick={startRecording}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition"
        >
          🎙️ Record Audio Take
        </button>
      ) : (
        <button
          type="button"
          onClick={stopRecording}
          className="bg-slate-800 border border-red-500 text-red-400 px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 animate-pulse"
        >
          ⏹️ Recording... Stop
        </button>
      )}

      {audioUrl && (
        <div className="w-full mt-1">
          <audio src={audioUrl} controls className="w-full h-8 rounded-lg" />
        </div>
      )}
    </div>
  );
}