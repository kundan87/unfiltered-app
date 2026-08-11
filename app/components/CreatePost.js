'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

const CATEGORIES = ['General', 'Tech', 'Sports', 'Entertainment', 'Politics'];

export default function CreatePost({ onPostSuccess }) {
  const { isSignedIn } = useUser();
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('General');
  const [media, setMedia] = useState(null);
  const [linkPreview, setLinkPreview] = useState(null);
  const [loadingLink, setLoadingLink] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const urlRegex = /((?:https?:\/\/|www\.)[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;
    const matches = caption.match(urlRegex);

    if (matches && matches.length > 0) {
      let rawUrl = matches[0].trim().replace(/[.,!]$/, '');
      if (rawUrl.includes('.') && rawUrl.length > 4) {
        let normalizedUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

        if (!linkPreview || linkPreview.url !== normalizedUrl) {
          setLoadingLink(true);
          fetch('/api/link-preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: normalizedUrl }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data && !data.error) setLinkPreview(data);
            })
            .catch(() => {})
            .finally(() => setLoadingLink(false));
        }
      }
    }
  }, [caption]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
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
    if (!isSignedIn) {
      alert('Please Sign In first!');
      return;
    }

    if (!caption.trim() && !media && !linkPreview) {
      alert('Please enter content to post!');
      return;
    }

    setIsUploading(true);

    let postType = 'TEXT';
    if (media) postType = media.type;
    else if (linkPreview) postType = 'LINK';

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: postType,
          category,
          caption,
          videoUrl: media?.type === 'VIDEO' ? media.url : null,
          imageUrls: media?.type === 'IMAGE' ? media.url : null,
          linkPreview,
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
    <div className="max-w-md mx-auto p-5 bg-gray-900 border border-gray-800 rounded-3xl mt-4 shadow-2xl">
      <h2 className="text-white font-black text-center text-lg mb-4">What's on your mind?</h2>

      <div className="space-y-4">
        {/* Category Selector */}
        <div>
          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Select Category</label>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap ${
                  category === cat
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Text Area */}
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a hot take or paste link..."
          className="w-full h-28 bg-gray-800 text-white text-sm p-4 rounded-2xl border border-gray-700 focus:outline-none focus:border-red-500 resize-none"
        />

        {loadingLink && (
          <div className="text-xs text-red-400 font-bold animate-pulse">🔗 Pulling website preview...</div>
        )}

        {linkPreview && (
          <div className="relative border border-gray-700 bg-gray-800/90 rounded-2xl p-3 flex gap-3 items-center">
            <button
              onClick={() => setLinkPreview(null)}
              className="absolute top-2 right-2 bg-black text-white rounded-full text-xs w-5 h-5 flex items-center justify-center font-bold"
            >
              ✕
            </button>
            {linkPreview.image ? (
              <img src={linkPreview.image} alt="Preview" className="w-14 h-14 object-cover rounded-xl flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 bg-gray-700 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🌐</div>
            )}
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-xs font-bold text-white truncate">{linkPreview.title || linkPreview.url}</p>
              <p className="text-[9px] text-red-400 mt-1 truncate">{linkPreview.url}</p>
            </div>
          </div>
        )}

        {media && (
          <div className="relative rounded-2xl overflow-hidden border border-gray-700 bg-black max-h-48 flex items-center justify-center">
            <button
              onClick={() => setMedia(null)}
              className="absolute top-2 right-2 bg-black text-white rounded-full text-xs w-6 h-6 flex items-center justify-center font-bold"
            >
              ✕
            </button>
            {media.type === 'IMAGE' ? (
              <img src={media.url} alt="Uploaded" className="max-h-48 object-contain" />
            ) : (
              <video src={media.url} controls className="max-h-48 w-full object-contain" />
            )}
          </div>
        )}

        <label className="flex items-center justify-center gap-2 w-full border border-gray-700 hover:border-red-500 rounded-2xl p-3 text-center cursor-pointer bg-gray-800/60 transition">
          <span className="text-xs text-gray-300 font-bold">📷 / 📹 Add Photo or Video</span>
          <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
        </label>

        <button
          onClick={handlePublish}
          disabled={isUploading}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-2xl text-sm transition active:scale-95"
        >
          {isUploading ? 'Publishing...' : '🔥 Post Take'}
        </button>
      </div>
    </div>
  );
}