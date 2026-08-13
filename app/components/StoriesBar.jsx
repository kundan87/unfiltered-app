'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';

const BG_COLORS = ['#dc2626', '#2563eb', '#16a34a', '#9333ea', '#000000'];

// Helper function to compress images before uploading
const compressImage = (file, maxWidth = 800, quality = 0.5) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    };
  });
};

export default function StoriesBar() {
  const { user } = useUser();
  const [stories, setStories] = useState([]);
  const [activeStory, setActiveStory] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [storyType, setStoryType] = useState('TEXT');
  const [textInput, setTextInput] = useState('');
  const [selectedBgColor, setSelectedBgColor] = useState(BG_COLORS[0]);
  const [selectedMedia, setSelectedMedia] = useState(null);

  const fileInputRef = useRef(null);

  const fetchStories = async () => {
    try {
      const res = await fetch('/api/stories');
      const data = await res.json();
      setStories(data.stories || []);
    } catch (err) {
      console.error('Error fetching stories:', err);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const generateTextImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = selectedBgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 42px sans-serif';
    ctx.textAlign = 'center';

    const words = textInput.split(' ');
    let line = '';
    const lines = [];
    const maxWidth = 500;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    const lineHeight = 55;
    const startY = (canvas.height - lines.length * lineHeight) / 2;

    lines.forEach((l, index) => {
      ctx.fillText(l.trim(), canvas.width / 2, startY + index * lineHeight);
    });

    return canvas.toDataURL('image/jpeg', 0.6);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');

    if (isVideo) {
      if (file.size > 10 * 1024 * 1024) {
        return alert('Video is too large! Please choose a video under 10MB.');
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedMedia({ url: event.target.result, type: 'VIDEO' });
      };
      reader.readAsDataURL(file);
    } else {
      // Compress Image aggressively for fast uploads
      const compressedDataUrl = await compressImage(file, 800, 0.5);
      setSelectedMedia({ url: compressedDataUrl, type: 'IMAGE' });
    }
  };

  const handlePublishStory = async () => {
    if (!user) return alert('Please Sign In first!');

    let finalMediaUrl = '';
    let finalType = storyType;

    if (storyType === 'TEXT') {
      if (!textInput.trim()) return alert('Type something for your story!');
      finalMediaUrl = generateTextImage();
      finalType = 'IMAGE';
    } else {
      if (!selectedMedia) return alert('Please select photo or video!');
      finalMediaUrl = selectedMedia.url;
      finalType = selectedMedia.type;
    }

    setUploading(true);
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          mediaUrl: finalMediaUrl,
          mediaType: finalType,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowCreateModal(false);
        setTextInput('');
        setSelectedMedia(null);
        await fetchStories();
        alert('Story uploaded successfully! 🔥');
      } else {
        alert(data.error || 'Failed to post story');
      }
    } catch (err) {
      alert('Error uploading story');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full overflow-x-auto py-3 flex items-center gap-4 border-b border-gray-800 no-scrollbar">
      {/* YOUR STORY BUTTON */}
      <div
        onClick={() => setShowCreateModal(true)}
        className="flex flex-col items-center gap-1 cursor-pointer min-w-[65px]"
      >
        <div className="relative w-14 h-14 rounded-full p-[2px] border-2 border-dashed border-red-500 flex items-center justify-center bg-gray-900">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt="User" className="w-full h-full rounded-full object-cover" />
          ) : (
            <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-white font-bold text-lg">
              👤
            </div>
          )}
          <span className="absolute bottom-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-black border-2 border-black">
            +
          </span>
        </div>
        <span className="text-[11px] text-gray-300 font-medium">Your Story</span>
      </div>

      {/* ALL STORIES LIST */}
      {stories.map((story) => (
        <div
          key={story.id}
          onClick={() => setActiveStory(story)}
          className="flex flex-col items-center gap-1 cursor-pointer min-w-[65px]"
        >
          <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600">
            <img
              src={story.user?.imageUrl || story.mediaUrl}
              alt="Story"
              className="w-full h-full rounded-full object-cover border-2 border-black"
            />
          </div>
          <span className="text-[11px] text-gray-300 truncate w-14 text-center">
            {story.user?.username || 'User'}
          </span>
        </div>
      ))}

      {/* CREATE STORY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-3xl p-5 shadow-2xl relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 bg-gray-800 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs"
            >
              ✕
            </button>

            <h3 className="text-white font-black text-center text-base mb-4">Add to Story 📸</h3>

            <div className="flex bg-gray-800 p-1 rounded-full mb-4">
              <button
                type="button"
                onClick={() => setStoryType('TEXT')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-full transition ${
                  storyType === 'TEXT' ? 'bg-red-600 text-white' : 'text-gray-400'
                }`}
              >
                ✏️ Text
              </button>
              <button
                type="button"
                onClick={() => setStoryType('PHOTO')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-full transition ${
                  storyType === 'PHOTO' ? 'bg-red-600 text-white' : 'text-gray-400'
                }`}
              >
                🖼️ Photo
              </button>
              <button
                type="button"
                onClick={() => setStoryType('VIDEO')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-full transition ${
                  storyType === 'VIDEO' ? 'bg-red-600 text-white' : 'text-gray-400'
                }`}
              >
                🎥 Video
              </button>
            </div>

            {storyType === 'TEXT' && (
              <div className="space-y-3">
                <div
                  className="w-full h-56 rounded-2xl p-4 flex items-center justify-center"
                  style={{ backgroundColor: selectedBgColor }}
                >
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type your story status..."
                    className="w-full bg-transparent text-white text-center font-bold text-lg focus:outline-none resize-none placeholder:text-white/60"
                  />
                </div>
                <div className="flex justify-center gap-2">
                  {BG_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedBgColor(color)}
                      className={`w-7 h-7 rounded-full border-2 ${
                        selectedBgColor === color ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            {(storyType === 'PHOTO' || storyType === 'VIDEO') && (
              <div className="space-y-3">
                <div
                  onClick={() => fileInputRef.current.click()}
                  className="w-full h-56 rounded-2xl border-2 border-dashed border-gray-700 bg-gray-800 flex flex-col items-center justify-center cursor-pointer overflow-hidden"
                >
                  {selectedMedia ? (
                    selectedMedia.type === 'IMAGE' ? (
                      <img src={selectedMedia.url} alt="Selected" className="w-full h-full object-cover" />
                    ) : (
                      <video src={selectedMedia.url} controls className="w-full h-full object-cover" />
                    )
                  ) : (
                    <div className="text-center p-4">
                      <span className="text-3xl block mb-1">{storyType === 'PHOTO' ? '📷' : '📹'}</span>
                      <span className="text-xs text-gray-400 font-bold">
                        Click to select {storyType.toLowerCase()} from gallery
                      </span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept={storyType === 'PHOTO' ? 'image/*' : 'video/*'}
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            )}

            <button
              onClick={handlePublishStory}
              disabled={uploading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-full text-sm mt-4 transition active:scale-95 disabled:bg-gray-700"
            >
              {uploading ? 'Posting Story...' : '🔥 Post Status'}
            </button>
          </div>
        </div>
      )}

      {/* STORY VIEWER */}
      {activeStory && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setActiveStory(null)}
            className="absolute top-4 right-4 text-white text-xl font-bold bg-gray-800 rounded-full w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
          <div className="max-w-sm w-full bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
            <div className="p-3 bg-gray-800/80 flex items-center gap-2">
              <img
                src={activeStory.user?.imageUrl || activeStory.mediaUrl}
                alt="User"
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="text-xs font-bold text-white">@{activeStory.user?.username || 'User'}</span>
            </div>
            {activeStory.mediaType === 'VIDEO' ? (
              <video src={activeStory.mediaUrl} autoPlay controls className="w-full h-[450px] object-cover" />
            ) : (
              <img src={activeStory.mediaUrl} alt="Story View" className="w-full h-[450px] object-cover" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}