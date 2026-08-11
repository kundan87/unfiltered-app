'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';

export default function CreatePost({ onPostSuccess }) {
  const { isSignedIn } = useUser();
  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'image' | 'video'
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setMediaUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = async () => {
    if (!isSignedIn) {
      alert('Please Sign In first from top right corner!');
      return;
    }

    if (activeTab === 'text' && !caption.trim()) {
      alert('Please enter your text take!');
      return;
    }

    if ((activeTab === 'image' || activeTab === 'video') && !mediaUrl) {
      alert(`Please upload a ${activeTab} file!`);
      return;
    }

    setIsUploading(true);
    try {
      const payload = {
        type: activeTab.toUpperCase(),
        caption,
        videoUrl: activeTab === 'video' ? mediaUrl : null,
        imageUrls: activeTab === 'image' ? mediaUrl : null,
      };

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setCaption('');
        setMediaUrl(null);
        alert('Post published successfully! 🔥');
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
      <h2 className="text-white font-black text-center text-lg mb-4">Create Unfiltered Take</h2>

      {/* Type Selector Tabs */}
      <div className="flex bg-black p-1 rounded-2xl mb-5 border border-gray-800">
        <button
          onClick={() => { setActiveTab('text'); setMediaUrl(null); }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'text' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          📝 Text
        </button>
        <button
          onClick={() => { setActiveTab('image'); setMediaUrl(null); }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'image' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          🖼️ Image
        </button>
        <button
          onClick={() => { setActiveTab('video'); setMediaUrl(null); }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'video' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          📹 Video
        </button>
      </div>

      {/* Input Area */}
      <div className="space-y-4">
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder={
            activeTab === 'text'
              ? "Write your raw unfiltered hot take..."
              : "Add a caption..."
          }
          className="w-full h-28 bg-gray-800 text-white text-sm p-3 rounded-2xl border border-gray-700 focus:outline-none focus:border-red-500 resize-none"
        />

        {/* Media Upload (Image or Video) */}
        {activeTab !== 'text' && (
          <div>
            <label className="block w-full border-2 border-dashed border-gray-700 hover:border-red-500 rounded-2xl p-6 text-center cursor-pointer bg-gray-800/50 transition">
              <span className="text-xs text-gray-300 font-bold block">
                {mediaUrl ? `Change ${activeTab}` : `📸 Choose ${activeTab.toUpperCase()} File`}
              </span>
              <input
                type="file"
                accept={activeTab === 'image' ? 'image/*' : 'video/*'}
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* Media Preview */}
            {mediaUrl && (
              <div className="mt-3 rounded-2xl overflow-hidden border border-gray-700 max-h-52 bg-black flex items-center justify-center">
                {activeTab === 'image' ? (
                  <img src={mediaUrl} alt="Preview" className="max-h-52 object-contain" />
                ) : (
                  <video src={mediaUrl} controls className="max-h-52 w-full object-contain" />
                )}
              </div>
            )}
          </div>
        )}

        <button
          onClick={handlePublish}
          disabled={isUploading}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-sm transition active:scale-95"
        >
          {isUploading ? 'Publishing...' : '🔥 Publish Hot Take'}
        </button>
      </div>
    </div>
  );
}