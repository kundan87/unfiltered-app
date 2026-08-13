'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

const CATEGORIES = ['General', 'Tech', 'Sports', 'Entertainment', 'Politics'];

export default function CreateTake({ onPostCreated }) {
  const { user } = useUser();
  const [caption, setCaption] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [loading, setLoading] = useState(false);
  const [linkPreview, setLinkPreview] = useState(null);
  const [fetchingPreview, setFetchingPreview] = useState(false);

  // Detect URL in caption and fetch Link Preview
  useEffect(() => {
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
    const match = caption.match(urlRegex);

    if (match && match[0]) {
      const url = match[0];
      if (linkPreview?.url !== url) {
        setFetchingPreview(true);
        fetch(`/api/og-preview?url=${encodeURIComponent(url)}`)
          .then((res) => res.json())
          .then((data) => {
            setLinkPreview(data);
            setFetchingPreview(false);
          })
          .catch(() => setFetchingPreview(false));
      }
    } else {
      setLinkPreview(null);
    }
  }, [caption]);

  const handleSubmit = async () => {
    if (!caption.trim()) return alert('Please enter something!');
    if (!user) return alert('Please Sign In first!');

    setLoading(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: user.id,
          caption: caption,
          category: selectedCategory,
          type: linkPreview ? 'LINK' : 'TEXT',
          linkPreview: linkPreview,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCaption('');
        setLinkPreview(null);
        alert('Published successfully! 🔥');
        if (onPostCreated) onPostCreated(); // Auto Refresh Feed
      } else {
        alert(data.error || 'Failed to publish take');
      }
    } catch (err) {
      alert('Error publishing post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 p-5 rounded-3xl max-w-lg mx-auto my-4 shadow-xl">
      <h3 className="text-white font-black text-center mb-4 text-base">Create Unfiltered Take 💣</h3>

      {/* Category Selection */}
      <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition ${
              selectedCategory === cat ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400'
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
        placeholder="What's on your mind? Paste a link or type..."
        className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-3 text-white text-sm focus:outline-none focus:border-red-600 resize-none h-28"
      />

      {/* LINK PREVIEW SNIPPET BOX */}
      {fetchingPreview && (
        <p className="text-xs text-yellow-500 font-bold mt-2 animate-pulse">Fetching link preview snippet...</p>
      )}

      {linkPreview && (
        <div className="mt-3 bg-gray-950 border border-gray-800 rounded-xl overflow-hidden p-3 flex gap-3 items-center">
          {linkPreview.image && (
            <img src={linkPreview.image} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
          )}
          <div className="overflow-hidden">
            <h4 className="text-xs font-bold text-white truncate">{linkPreview.title}</h4>
            <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5">{linkPreview.description}</p>
            <span className="text-[10px] text-red-500 font-medium block mt-1 truncate">{linkPreview.url}</span>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-full text-sm mt-4 transition active:scale-95 disabled:bg-gray-800"
      >
        {loading ? 'Publishing Take...' : '🔥 Post Take'}
      </button>
    </div>
  );
}