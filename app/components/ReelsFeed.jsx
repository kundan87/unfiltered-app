'use client';

import { useState, useEffect } from 'react';
import AgreeDisagreeBar from './AgreeDisagreeBar';

export default function ReelsFeed() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/posts')
      .then((res) => res.json())
      .then((data) => {
        const videoList = (data.posts || []).filter(
          (p) => p.type === 'VIDEO' || p.videoUrl || p.imageUrls
        );
        setVideos(videoList);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
        Loading Reels... 🎬
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-center p-6 bg-slate-900/50 rounded-xl border border-slate-800 my-4">
        <span className="text-4xl mb-3">📱</span>
        <h3 className="text-lg font-bold text-white mb-1">No Reels Yet</h3>
        <p className="text-xs text-slate-400">
          Be the first creator to upload a short video take!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 py-2">
      {videos.map((video) => (
        <div
          key={video.id}
          className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
        >
          {/* User Info Header */}
          <div className="p-3 flex items-center gap-2 border-b border-slate-800/80">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center font-bold text-xs text-white">
              {video.user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="font-bold text-xs text-slate-200">
              @{video.user?.username || 'unfiltered_user'}
            </span>
          </div>

          {/* Video Player / Media */}
          <div className="relative bg-black max-h-[500px] flex items-center justify-center">
            {video.type === 'VIDEO' || video.videoUrl ? (
              <video
                src={video.videoUrl || video.imageUrls}
                controls
                autoPlay
                muted
                loop
                playsInline
                className="w-full max-h-[480px] object-contain"
              />
            ) : (
              <img
                src={video.imageUrls}
                alt="Reel"
                className="w-full max-h-[480px] object-cover"
              />
            )}
          </div>

          {/* Caption & Voting */}
          <div className="p-3">
            <p className="text-xs text-slate-200 mb-2">{video.caption}</p>
            <AgreeDisagreeBar
              videoId={video.id}
              initialAgree={video.agreeCount}
              initialCap={video.capCount}
            />
          </div>
        </div>
      ))}
    </div>
  );
}