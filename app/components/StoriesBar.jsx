'use client';
import { useState, useEffect } from 'react';

export default function StoriesBar({ userId }) {
  const [stories, setStories] = useState([]);
  const [activeStory, setActiveStory] = useState(null);

  useEffect(() => {
    fetch('/api/stories')
      .then((res) => res.json())
      .then((data) => setStories(data.stories || []));
  }, []);

  return (
    <div className="w-full overflow-x-auto py-3 px-2 flex items-center gap-4 border-b border-slate-800 no-scrollbar">
      {/* Upload Button */}
      <label className="flex flex-col items-center gap-1 cursor-pointer min-w-[65px]">
        <div className="w-14 h-14 rounded-full border-2 border-dashed border-red-500 flex items-center justify-center bg-slate-900 hover:bg-slate-800">
          <span className="text-xl text-red-500 font-bold">+</span>
        </div>
        <span className="text-[11px] text-slate-300 font-medium">Your Story</span>
        <input
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', userId);
            await fetch('/api/stories', { method: 'POST', body: formData });
            window.location.reload();
          }}
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
              src={story.user?.image || 'https://via.placeholder.com/150'}
              alt={story.user?.username}
              className="w-full h-full rounded-full object-cover border-2 border-black"
            />
          </div>
          <span className="text-[11px] text-slate-300 truncate w-14 text-center">
            @{story.user?.username || 'user'}
          </span>
        </div>
      ))}

      {/* Story Popup View */}
      {activeStory && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <button onClick={() => setActiveStory(null)} className="absolute top-4 right-4 text-white text-2xl font-bold">
            ✕
          </button>
          <div className="max-w-sm w-full bg-slate-900 rounded-xl overflow-hidden">
            {activeStory.mediaType === 'VIDEO' ? (
              <video src={activeStory.mediaUrl} autoPlay controls className="w-full h-[500px] object-cover" />
            ) : (
              <img src={activeStory.mediaUrl} alt="Story" className="w-full h-[500px] object-cover" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}