'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';

const BG_COLORS = ['#dc2626', '#2563eb', '#16a34a', '#9333ea', '#000000'];

export default function StoriesBar() {
  const { user } = useUser();
  const [stories, setStories] = useState([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeStoryGroup, setActiveStoryGroup] = useState(null);

  const [storyType, setStoryType] = useState('TEXT');
  const [textContent, setTextContent] = useState('');
  const [bgColor, setBgColor] = useState(BG_COLORS[0]);
  const [mediaUrl, setMediaUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  const canvasRef = useRef(null);

  const fetchStories = async () => {
    try {
      const res = await fetch('/api/stories');
      const data = await res.json();
      if (res.ok && data.stories) {
        setStories(data.stories);
      }
    } catch (err) {
      console.error('Failed to fetch stories:', err);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  // Text Canvas Drawer
  useEffect(() => {
    if (storyType === 'TEXT' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const words = (textContent || 'Type your story...').split(' ');
      let line = '';
      let lines = [];
      const maxWidth = canvas.width - 60;
      const lineHeight = 36;

      for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          lines.push(line);
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line);

      const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;
      lines.forEach((l, idx) => {
        ctx.fillText(l.trim(), canvas.width / 2, startY + idx * lineHeight);
      });
    }
  }, [textContent, bgColor, storyType, isCreateOpen]);

  // Client-Side Image Compression (Fixes Payload Too Large Issue)
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1080;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (storyType === 'PHOTO') {
      const compressedBase64 = await compressImage(file);
      setMediaUrl(compressedBase64);
    } else {
      const reader = new FileReader();
      reader.onloadend = () => setMediaUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handlePublishStory = async () => {
    if (!user) return alert('Please Sign In to post a story!');

    setUploading(true);
    let finalMediaUrl = mediaUrl;

    if (storyType === 'TEXT') {
      if (!textContent.trim()) {
        setUploading(false);
        return alert('Please type some text!');
      }
      if (canvasRef.current) {
        finalMediaUrl = canvasRef.current.toDataURL('image/jpeg', 0.5);
      }
    }

    if (!finalMediaUrl) {
      setUploading(false);
      return alert('Please select a media file or write text!');
    }

    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          mediaUrl: finalMediaUrl,
          mediaType: storyType === 'VIDEO' ? 'VIDEO' : 'IMAGE',
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert('Story Published Successfully! 🎉');
        setIsCreateOpen(false);
        setTextContent('');
        setMediaUrl(null);
        fetchStories();
      } else {
        alert(data.error || 'Failed to upload story');
      }
    } catch (err) {
      alert('Error uploading story payload!');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 overflow-x-auto py-4 px-2 no-scrollbar">
      <div className="flex flex-col items-center flex-shrink-0 cursor-pointer">
        <div
          onClick={() => setIsCreateOpen(true)}
          className="relative w-16 h-16 rounded-full border-2 border-dashed border-red-600 flex items-center justify-center bg-gray-900 hover:scale-105 transition"
        >
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt="User" className="w-14 h-14 rounded-full object-cover opacity-80" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold">
              +
            </div>
          )}
          <div className="absolute bottom-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border border-black">
            +
          </div>
        </div>
        <span className="text-[11px] text-gray-300 font-medium mt-1 truncate w-16 text-center">
          Your Story
        </span>
      </div>

      {stories.map((story) => (
        <div
          key={story.id}
          onClick={() => setActiveStoryGroup(story)}
          className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
        >
          <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-500 via-red-600 to-purple-600 group-hover:scale-105 transition">
            <div className="w-full h-full rounded-full bg-black p-[2px] overflow-hidden">
              <img
                src={story.user?.imageUrl || story.mediaUrl}
                alt="Story"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>
          <span className="text-[11px] text-gray-300 font-medium mt-1 truncate w-16 text-center">
            {story.user?.username || 'User'}
          </span>
        </div>
      ))}

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-sm w-full p-5 relative shadow-2xl">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white font-bold text-lg"
            >
              ✕
            </button>

            <h3 className="text-white font-black text-center text-base mb-4">Add to Story 📸</h3>

            <div className="flex justify-between bg-gray-950 p-1 rounded-2xl mb-4 border border-gray-800">
              <button
                type="button"
                onClick={() => {
                  setStoryType('TEXT');
                  setMediaUrl(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition ${
                  storyType === 'TEXT' ? 'bg-red-600 text-white' : 'text-gray-400'
                }`}
              >
                ✏️ Text
              </button>
              <button
                type="button"
                onClick={() => {
                  setStoryType('PHOTO');
                  setMediaUrl(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition ${
                  storyType === 'PHOTO' ? 'bg-red-600 text-white' : 'text-gray-400'
                }`}
              >
                🖼️ Photo
              </button>
              <button
                type="button"
                onClick={() => {
                  setStoryType('VIDEO');
                  setMediaUrl(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition ${
                  storyType === 'VIDEO' ? 'bg-red-600 text-white' : 'text-gray-400'
                }`}
              >
                📹 Video
              </button>
            </div>

            <div className="relative w-full h-80 rounded-2xl overflow-hidden bg-black flex items-center justify-center mb-4 border border-gray-800">
              {storyType === 'TEXT' && (
                <>
                  <canvas ref={canvasRef} width={360} height={480} className="hidden" />
                  <div
                    style={{ backgroundColor: bgColor }}
                    className="w-full h-full flex items-center justify-center p-6 text-center text-white font-bold text-xl break-words"
                  >
                    {textContent || 'Type your story below...'}
                  </div>
                </>
              )}

              {storyType === 'PHOTO' && (
                mediaUrl ? (
                  <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <p className="text-xs text-gray-500">Choose a photo file below</p>
                )
              )}

              {storyType === 'VIDEO' && (
                mediaUrl ? (
                  <video src={mediaUrl} controls className="w-full h-full object-cover" />
                ) : (
                  <p className="text-xs text-gray-500">Choose a video file below</p>
                )
              )}
            </div>

            {storyType === 'TEXT' && (
              <>
                <input
                  type="text"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Write status text..."
                  maxLength={100}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white text-xs mb-3 focus:outline-none focus:border-red-600"
                />
                <div className="flex justify-center gap-3 mb-4">
                  {BG_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setBgColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-7 h-7 rounded-full border-2 ${
                        bgColor === c ? 'border-white scale-110' : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {(storyType === 'PHOTO' || storyType === 'VIDEO') && (
              <input
                type="file"
                accept={storyType === 'PHOTO' ? 'image/*' : 'video/*'}
                onChange={handleFileChange}
                className="w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gray-800 file:text-white hover:file:bg-gray-700 mb-4 cursor-pointer"
              />
            )}

            <button
              onClick={handlePublishStory}
              disabled={uploading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-full text-sm transition active:scale-95 disabled:bg-gray-800"
            >
              {uploading ? 'Posting Story...' : '🚀 Share Story'}
            </button>
          </div>
        </div>
      )}

      {activeStoryGroup && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative max-w-sm w-full h-[80vh] bg-black rounded-3xl overflow-hidden border border-gray-800 flex items-center justify-center">
            <button
              onClick={() => setActiveStoryGroup(null)}
              className="absolute top-4 right-4 z-10 text-white font-bold bg-gray-900/80 w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>

            {activeStoryGroup.mediaType === 'VIDEO' ? (
              <video src={activeStoryGroup.mediaUrl} autoPlay controls className="w-full h-full object-cover" />
            ) : (
              <img src={activeStoryGroup.mediaUrl} alt="Story" className="w-full h-full object-cover" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}