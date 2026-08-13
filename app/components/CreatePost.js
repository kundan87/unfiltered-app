'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';

const CATEGORIES = ['General', 'Tech', 'Sports', 'Entertainment', 'Politics'];

export default function CreatePost({ onPostSuccess }) {
  const { isSignedIn, user } = useUser();
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('General');
  const [media, setMedia] = useState(null);
  const [linkPreview, setLinkPreview] = useState(null);
  const [loadingLink, setLoadingLink] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Live Camera & Video Recording States (60 Seconds Max)
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState('PHOTO'); // 'PHOTO' | 'VIDEO'
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Auto Link Detection in Textarea
  useEffect(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const foundUrls = caption.match(urlRegex);

    if (foundUrls && foundUrls.length > 0) {
      const urlToFetch = foundUrls[0];
      if (!linkPreview || linkPreview.url !== urlToFetch) {
        fetchLinkPreview(urlToFetch);
      }
    }
  }, [caption]);

  const fetchLinkPreview = async (targetUrl) => {
    setLoadingLink(true);
    try {
      const res = await fetch('/api/link-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = await res.json();
      if (res.ok && data.title) {
        setLinkPreview(data);
      }
    } catch (err) {
      console.error('Link preview failed', err);
    } finally {
      setLoadingLink(false);
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    setCameraMode('PHOTO');
    setIsRecording(false);
    setRecordTime(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (e) {
        alert('Camera access denied');
        setShowCamera(false);
      }
    }
  };

  const stopCamera = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setShowCamera(false);
    setIsRecording(false);
    setRecordTime(0);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
    setMedia({ url: compressedBase64, type: 'IMAGE' });
    stopCamera();
  };

  // 60-Second Compressed Video Recording
  const startRecording = () => {
    recordedChunksRef.current = [];
    const stream = streamRef.current;
    if (!stream) return;

    // 300 Kbps bitrate keeps 1 min video under ~2.2MB
    const options = { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 300000 };

    try {
      const mediaRecorder = new MediaRecorder(
        stream,
        MediaRecorder.isTypeSupported(options.mimeType) ? options : {}
      );
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setMedia({ url: reader.result, type: 'VIDEO' });
          stopCamera();
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start(200);
      setIsRecording(true);

      setRecordTime(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordTime((prev) => {
          if (prev >= 59) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      alert('Video recording error');
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleGalleryChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');

    if (isVideo && file.size > 12 * 1024 * 1024) {
      return alert('Video file is too large! Please choose a video under 12MB.');
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (!isVideo) {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let w = img.width;
          let h = img.height;
          if (w > h && w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          setMedia({ url: canvas.toDataURL('image/jpeg', 0.6), type: 'IMAGE' });
        };
      } else {
        setMedia({ url: reader.result, type: 'VIDEO' });
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePublish = async () => {
    if (!isSignedIn) return alert('Please Sign In first!');
    if (!caption.trim() && !media && !linkPreview) return alert('Please enter content!');

    setIsUploading(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: media ? media.type : linkPreview ? 'LINK' : 'TEXT',
          category,
          caption,
          videoUrl: media?.type === 'VIDEO' ? media.url : null,
          imageUrls: media?.type === 'IMAGE' ? media.url : null,
          linkPreview,
          clerkUserId: user?.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCaption('');
        setMedia(null);
        setLinkPreview(null);
        alert('Published successfully! 🔥');
        if (onPostSuccess) onPostSuccess();
      } else {
        alert(data.error || 'Failed to post');
      }
    } catch (err) {
      alert('Error publishing post');
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-md mx-auto p-5 bg-gray-900 border border-gray-800 rounded-3xl mt-4 shadow-2xl relative">
      <h2 className="text-white font-black text-center text-lg mb-4 select-none">Create Unfiltered Take 💣</h2>

      <div className="space-y-4">
        {/* Category Selector */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                category === cat ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Caption Textarea */}
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Share your hot take or paste website link..."
          className="w-full h-28 bg-gray-800 text-white text-sm p-4 rounded-2xl border border-gray-700 focus:outline-none focus:border-red-500 resize-none"
        />

        {/* Link Snippet Preview */}
        {loadingLink && (
          <div className="p-3 bg-gray-800 rounded-2xl text-xs text-gray-400 font-bold animate-pulse">
            Fetching link snippet preview... 🔗
          </div>
        )}

        {linkPreview && (
          <div className="relative border border-gray-700 bg-gray-800/80 rounded-2xl p-3 flex gap-3 items-center">
            <button
              onClick={() => setLinkPreview(null)}
              className="absolute top-2 right-2 bg-black/80 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center font-bold"
            >
              ✕
            </button>
            {linkPreview.image && (
              <img src={linkPreview.image} alt="Preview" className="w-16 h-16 object-cover rounded-xl" />
            )}
            <div className="flex-1 pr-4 overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{linkPreview.title}</p>
              <p className="text-[10px] text-gray-400 line-clamp-2">{linkPreview.description}</p>
              <p className="text-[9px] text-red-400 truncate mt-1">{linkPreview.url}</p>
            </div>
          </div>
        )}

        {/* Media Preview (Photo / Video) */}
        {media && (
          <div className="relative rounded-2xl overflow-hidden border border-gray-700 bg-black max-h-48 flex items-center justify-center">
            <button
              onClick={() => setMedia(null)}
              className="absolute top-2 right-2 bg-black/80 text-white rounded-full text-xs w-6 h-6 flex items-center justify-center font-bold z-10"
            >
              ✕
            </button>
            {media.type === 'IMAGE' ? (
              <img src={media.url} alt="Preview" className="max-h-48 object-contain" />
            ) : (
              <video src={media.url} controls className="max-h-48 w-full object-contain" />
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={startCamera}
            className="flex items-center justify-center gap-2 border border-gray-700 hover:border-red-500 rounded-2xl p-3 bg-gray-800/40 hover:bg-gray-800 transition"
          >
            <span className="text-base">📷</span>
            <span className="text-xs text-gray-300 font-bold">Record Camera</span>
          </button>

          <button
            type="button"
            onClick={() => galleryInputRef.current.click()}
            className="flex items-center justify-center gap-2 border border-gray-700 hover:border-red-500 rounded-2xl p-3 bg-gray-800/40 hover:bg-gray-800 transition"
          >
            <span className="text-base">📁</span>
            <span className="text-xs text-gray-300 font-bold">Choose Gallery</span>
          </button>
        </div>

        <input
          type="file"
          ref={galleryInputRef}
          accept="image/*,video/*"
          className="hidden"
          onChange={handleGalleryChange}
        />

        <button
          onClick={handlePublish}
          disabled={isUploading}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3.5 rounded-full text-sm transition active:scale-95 disabled:bg-gray-700"
        >
          {isUploading ? 'Publishing Take...' : '🔥 Post Take'}
        </button>
      </div>

      {/* Live Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-sm bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 shadow-2xl">
            {!isRecording && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex bg-black/60 backdrop-blur-md rounded-full p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => setCameraMode('PHOTO')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                    cameraMode === 'PHOTO' ? 'bg-red-600 text-white' : 'text-gray-400'
                  }`}
                >
                  📷 Photo
                </button>
                <button
                  type="button"
                  onClick={() => setCameraMode('VIDEO')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                    cameraMode === 'VIDEO' ? 'bg-red-600 text-white' : 'text-gray-400'
                  }`}
                >
                  📹 Video (1 min)
                </button>
              </div>
            )}

            {isRecording && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white"></span>
                <span>REC {formatTime(recordTime)} / 01:00</span>
              </div>
            )}

            <video ref={videoRef} autoPlay playsInline muted={isRecording} className="w-full h-80 object-cover bg-black" />

            <div className="p-4 flex justify-between items-center bg-gray-900 border-t border-gray-800">
              <button
                type="button"
                onClick={stopCamera}
                disabled={isRecording}
                className="text-xs text-gray-400 font-bold px-4 py-2 rounded-full bg-gray-800"
              >
                Cancel
              </button>

              {cameraMode === 'PHOTO' ? (
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="w-14 h-14 rounded-full bg-red-600 border-4 border-white flex items-center justify-center text-xl shadow-lg active:scale-95 transition"
                >
                  📸
                </button>
              ) : !isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="w-14 h-14 rounded-full bg-red-600 border-4 border-white flex items-center justify-center text-xl shadow-lg active:scale-95 transition"
                >
                  🔴
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="w-14 h-14 rounded-full bg-white border-4 border-red-600 flex items-center justify-center shadow-lg active:scale-95 transition"
                >
                  <span className="w-5 h-5 bg-red-600 rounded-sm"></span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}