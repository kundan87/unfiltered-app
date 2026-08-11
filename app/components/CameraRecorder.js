'use client';

import { useState, useRef, useEffect } from 'react';

export default function CameraRecorder() {
  const [recording, setRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [videoBlob, setVideoBlob] = useState(null);
  const [caption, setCaption] = useState('');
  const [publishing, setPublishing] = useState(false);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // Live Camera Stream Setup
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 720, height: 1280, facingMode: 'user' },
          audio: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        alert('Camera & Mic permission required!');
      }
    }
    startCamera();
  }, []);

  // 60-Second Timer
  useEffect(() => {
    let timer;
    if (recording && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && recording) {
      stopRecording();
    }
    return () => clearInterval(timer);
  }, [recording, timeLeft]);

  const startRecording = () => {
    chunksRef.current = [];
    const stream = videoRef.current.srcObject;
    mediaRecorderRef.current = new MediaRecorder(stream);

    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/mp4' });
      setVideoBlob(blob);
    };

    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // Upload Recorded Video to Backend API
  const handlePublish = async () => {
    if (!videoBlob) return;
    setPublishing(true);

    try {
      const formData = new FormData();
      formData.append('video', videoBlob, 'recording.mp4');
      formData.append('caption', caption || 'Unfiltered Raw Take');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error status: ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        alert('🔥 Hot Take Published Successfully!');
        window.location.reload(); // Refresh to see in feed
      } else {
        alert('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Publish Error:', err);
      alert('Publish Error: ' + err.message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] bg-black text-white p-4">
      <div className="relative w-full max-w-sm aspect-[9/16] bg-gray-900 rounded-3xl overflow-hidden border-2 border-red-600 shadow-2xl">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        
        {/* Live Timer Badge */}
        <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-md">
          00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
        </div>
      </div>

      {/* Control Actions & Inputs */}
      <div className="mt-6 flex flex-col items-center gap-4 w-full max-w-sm">
        {!recording && !videoBlob && (
          <button 
            onClick={startRecording}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg w-full transition active:scale-95"
          >
            🔴 Start 1-Min Take
          </button>
        )}

        {recording && (
          <button 
            onClick={stopRecording}
            className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-full font-bold text-lg w-full transition active:scale-95"
          >
            ⏹ Stop Recording
          </button>
        )}

        {videoBlob && (
          <div className="flex flex-col gap-3 w-full">
            <input 
              type="text" 
              placeholder="Write a 1-line hot take..." 
              value={caption} 
              onChange={(e) => setCaption(e.target.value)}
              className="bg-gray-800 text-white p-3 rounded-xl border border-gray-700 outline-none text-center focus:border-red-500"
            />
            <button 
              onClick={handlePublish}
              disabled={publishing}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg disabled:opacity-50 transition active:scale-95"
            >
              {publishing ? 'Publishing...' : '🔥 Spill It (Publish)'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}