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

  // Live Camera Modal State
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Open Live Camera Modal (PC Webcam or Mobile Camera)
  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('Camera access denied or not supported');
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64Image = canvas.toDataURL('image/jpeg', 0.7); // Compressed
    setMedia({ url: base64Image, type: 'IMAGE' });
    stopCamera();
  };

  const handleGalleryChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();
      reader.onloadend = () => {
        setMedia({
          url: reader.result,
          type: isVideo ? 'VIDEO' : 'IMAGE',
        });
      };
      reader.readAsDataURL(file);
    }
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
      if (data.success) {
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

  return (
    <div className="max-w-md mx-auto p-5 bg-gray-900 border border-gray-800 rounded-3xl mt-4 shadow-2xl relative">
      <h2 className="text-white font-black text-center text-lg mb-4 select-none">Create Unfiltered Take 💣</h2>

      <div className="space-y-4">
        {/* Category Pills */}
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

        {/* Text Area */}
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Share your hot take or thought..."
          className="w-full h-28 bg-gray-800 text-white text-sm p-4 rounded-2xl border border-gray-700 focus:outline-none focus:border-red-500 resize-none"
        />

        {/* Selected Media Preview */}
        {media && (
          <div className="relative rounded-2xl overflow-hidden border border-gray-700 bg-black max-h-48 flex items-center justify-center">
            <button
              onClick={() => setMedia(null)}
              className="absolute top-2 right-2 bg-black/80 text-white rounded-full text-xs w-6 h-6 flex items-center justify-center font-bold"
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

        {/* Camera / Gallery Selectors */}
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
          className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3.5 rounded-full text-sm transition"
        >
          {isUploading ? 'Publishing...' : '🔥 Post Take'}
        </button>
      </div>

      {/* LIVE CAMERA MODAL POPUP */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-sm bg-gray-900 rounded-2xl overflow-hidden border border-gray-800">
            <video ref={videoRef} autoPlay playsInline className="w-full h-80 object-cover bg-black" />
            <div className="p-4 flex justify-between items-center bg-gray-900">
              <button
                type="button"
                onClick={stopCamera}
                className="text-xs text-gray-400 font-bold px-4 py-2 rounded-full bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                className="w-12 h-12 rounded-full bg-red-600 border-4 border-white flex items-center justify-center shadow-lg"
              >
                📸
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}