'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export default function StoriesBar() {
  const { user } = useUser();
  const [stories, setStories] = useState([]);
  const [activeStory, setActiveStory] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchStories = async () => {
    try {
      const res = await fetch('/api/stories');
      const data = await res.json();
      setStories(data.stories || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleStoryUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!user) {
      alert('Please Sign In first to post stories!');
      return;
    }

    setUploading(true);
    try {
      // Compress Image to avoid Vercel 413 Payload Error
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let width = img.width;
          let height = img.height;

          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);

          const res = await fetch('/api/stories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              mediaUrl: compressedBase64,
              mediaType: 'IMAGE',
            }),
          });

          const data = await res.json();
          if (res.ok && data.success) {
            await fetchStories();
          } else {
            alert(data.error || 'Failed to post story');
          }
          setUploading(false);
        };
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert('Error uploading story');
      setUploading(false);
    }
  };

  return (
    <div className="w-full overflow-x-auto py-2 flex items-center gap-4 border-b border-slate-800 no-scrollbar">
      {/* Upload Story */}
      <label className="flex flex-col items-center gap-1 cursor-pointer min-w-[65px]">
        <div className="w-14 h-14 rounded-full border-2 border-dashed border-red-500 flex items-center justify-center bg-slate-900 hover:bg-slate-800 transition">
          <span className="text-xl text-red-500 font-bold">
            {uploading ? '⌛' : '+'}
          </span>
        </div>
        <span className="text-[11px] text-slate-300 font-medium">Your Story</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleStoryUpload}
        />
      </label>

      {/* Stories List */}
      {stories.map((story) => (
        <div
          key={story.id}
          onClick={() => setActiveStory(story)}
          className="flex flex-col items-center gap-1 cursor-pointer min-w-[65px]"
        >
          <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600">
            <img
              src={story.mediaUrl}
              alt="Story"
              className="w-full h-full rounded-full object-cover border-2 border-black"
            />
          </div>
          <span className="text-[11px] text-slate-300 truncate w-14 text-center">
            @{story.user?.username || 'user'}
          </span>
        </div>
      ))}

      {/* Story View Modal */}
      {activeStory && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setActiveStory(null)}
            className="absolute top-4 right-4 text-white text-xl font-bold bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
          <div className="max-w-sm w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
            <img
              src={activeStory.mediaUrl}
              alt="Story View"
              className="w-full h-[450px] object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
}