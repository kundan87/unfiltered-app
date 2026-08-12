'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';

const CATEGORIES = ['General', 'Tech', 'Sports', 'Entertainment', 'Politics'];

export default function CreatePost({ onPostSuccess }) {
  const { isSignedIn, user } = useUser();
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('General');
  const [media, setMedia] = useState(null); // { url: string, type: 'IMAGE' | 'VIDEO' }
  const [mediaFile, setMediaFile] = useState(null); // The actual file object for upload
  const [linkPreview, setLinkPreview] = useState(null);
  const [loadingLink, setLoadingLink] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // References for hidden file inputs
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Automatically fetch link previews from text
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
  }, [caption, linkPreview]);

  // Handle generic media file change
  const handleMediaFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file); // Save the file object for the upload
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();
      reader.onloadend = () => {
        setMedia({
          url: reader.result, // base64 preview URL
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
          clerkUserId: user?.id, // Send Clerk ID for upsert/create user logic
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCaption('');
        setMedia(null);
        setMediaFile(null);
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
      <h2 className="text-white font-black text-center text-lg mb-4 select-none">Create Raw & Unfiltered Take 💣</h2>

      <div className="space-y-4">
        {/* Category Selector with a sleek border */}
        <div className="p-1 border border-gray-800 rounded-2xl bg-gray-800/20">
          <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1 pl-1">Select Topic</label>
          <div className="flex gap-1 overflow-x-auto no-scrollbar pb-0.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap active:scale-95 ${
                  category === cat
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Text Area with a larger, cleaner input */}
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Share your hot take, a direct link, or a raw thought..."
          className="w-full h-32 bg-gray-800 text-white text-sm p-4 rounded-2xl border border-gray-700 focus:outline-none focus:border-red-500 resize-none font-medium placeholder:text-gray-500"
        />

        {/* Link Preview loading & display */}
        {loadingLink && (
          <div className="text-xs text-red-400 font-bold animate-pulse px-1">🔗 Pulling website preview...</div>
        )}

        {linkPreview && (
          <div className="relative border border-gray-700 bg-gray-800/90 rounded-2xl p-3 flex gap-3 items-center group">
            <button
              onClick={() => setLinkPreview(null)}
              className="absolute top-1 right-1 bg-black text-white rounded-full text-xs w-5 h-5 flex items-center justify-center font-bold opacity-0 group-hover:opacity-100 transition"
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
              <p className="text-[9px] text-red-400 mt-0.5 truncate">{linkPreview.url}</p>
            </div>
          </div>
        )}

        {/* Media Preview for selected camera or gallery item */}
        {media && (
          <div className="relative rounded-2xl overflow-hidden border border-gray-700 bg-black max-h-48 flex items-center justify-center group">
            <button
              onClick={() => {
                setMedia(null);
                setMediaFile(null);
              }}
              className="absolute top-1 right-1 bg-black text-white rounded-full text-xs w-6 h-6 flex items-center justify-center font-bold opacity-0 group-hover:opacity-100 transition"
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

        {/* MULTI-MEDIA OPTIONS: Camera vs Gallery Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => cameraInputRef.current.click()}
            className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-700 hover:border-red-500 rounded-2xl p-4 text-center cursor-pointer bg-gray-800/40 hover:bg-gray-800/60 transition active:scale-95 group"
          >
            <span className="text-lg">📷</span>
            <span className="text-xs text-gray-300 group-hover:text-white font-bold whitespace-nowrap">Record Live Camera</span>
          </button>

          <button
            type="button"
            onClick={() => galleryInputRef.current.click()}
            className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-700 hover:border-red-500 rounded-2xl p-4 text-center cursor-pointer bg-gray-800/40 hover:bg-gray-800/60 transition active:scale-95 group"
          >
            <span className="text-lg">📁</span>
            <span className="text-xs text-gray-300 group-hover:text-white font-bold whitespace-nowrap">Choose from Gallery</span>
          </button>
        </div>

        {/* HIDDEN FILE INPUTS */}
        {/* Input for specific live camera capture */}
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*,video/*"
          capture="user" // This is the magic key for direct camera trigger
          className="hidden"
          onChange={handleMediaFileChange}
        />
        {/* Input for generic gallery file picking */}
        <input
          type="file"
          ref={galleryInputRef}
          accept="image/*,video/*"
          className="hidden"
          onChange={handleMediaFileChange}
        />

        {/* Submit button at the bottom */}
        <button
          onClick={handlePublish}
          disabled={isUploading}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-full text-sm transition active:scale-95 disabled:bg-gray-700 disabled:text-gray-400 select-none"
        >
          {isUploading ? 'Publishing...' : '🔥 Post Take'}
        </button>
      </div>
    </div>
  );
}