'use client';

import { useState, useEffect } from 'react';

export default function StoriesBar({ userId }) {
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

    setUploading(true);
    try {
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          mediaUrl: base64,
          mediaType: file.type.startsWith('video') ? 'VIDEO' : 'IMAGE',
        }),
      });

      if (res.ok) {
        await fetchStories(); // Refresh Stories Bar
      } else {
        alert('Failed to post story');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading story');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full overflow-x-auto py-2 flex items-center gap-4 border-b border-slate-800 no-scrollbar">
      {/* Upload Story Plus Icon */}
      <label className="flex flex-col items-center gap-1 cursor-pointer min-w-[65px]">
        <div className="w-14 h-14 rounded-full border-2 border-dashed border-red-500 flex items-center justify-center bg-slate-900 hover:bg-slate-800 transition">
          <span className="text-xl text-red-500 font-bold">
            {uploading ? '⌛' : '+'}
          </span>
        </div>
        <span className="text-[11px] text-slate-300 font-medium">Your Story</span>
        <input
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleStoryUpload}
        />
      </label>

      {/* Render Stories List */}
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
            @{story.user?.username || 'creator'}
          </span>
        </div>
      ))}

      {/* Active Story View Modal */}
      {activeStory && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setActiveStory(null)}
            className="absolute top-4 right-4 text-white text-2xl font-bold bg-slate-800 rounded-full w-10 h-10 flex items-center justify-center"
          >
            ✕
          </button>
          <div className="max-w-sm w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
            {activeStory.mediaType === 'VIDEO' ? (
              <video
                src={activeStory.mediaUrl}
                autoPlay
                controls
                className="w-full h-[450px] object-cover"
              />
            ) : (
              <img
                src={activeStory.mediaUrl}
                alt="Story"
                className="w-full h-[450px] object-cover"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}