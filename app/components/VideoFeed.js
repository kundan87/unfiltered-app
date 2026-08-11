'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const CATEGORIES = ['All', 'Tech', 'Sports', 'Entertainment', 'Politics', 'General'];

function decodeHTML(html) {
  if (!html) return '';
  return html
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function CommentsModal({ videoId, onClose }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadComments() {
      try {
        const res = await fetch(`/api/comments?videoId=${videoId}`);
        const data = await res.json();
        if (data?.comments) setComments(data.comments);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadComments();
  }, [videoId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, text }),
      });

      const data = await res.json();
      if (data.comment) {
        setComments([data.comment, ...comments]);
        setText('');
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      alert('Failed to post comment');
    }
  };

  return (
    <div className="absolute inset-0 bg-black/95 z-40 rounded-3xl p-4 flex flex-col justify-between backdrop-blur-md">
      <div className="flex justify-between items-center border-b border-gray-800 pb-2">
        <h3 className="font-bold text-white text-sm">Comments ({comments.length})</h3>
        <button onClick={onClose} className="text-gray-400 font-bold px-2 cursor-pointer">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto py-3 space-y-3 no-scrollbar">
        {loading ? (
          <p className="text-gray-500 text-xs text-center">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-gray-500 text-xs text-center">No comments yet. Be the first!</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="text-xs bg-gray-900 p-2.5 rounded-xl border border-gray-800">
              <p className="text-red-400 font-bold">@{c.user?.username || 'user'}</p>
              <p className="text-gray-200 mt-0.5">{c.text}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 pt-2 border-t border-gray-800">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 bg-gray-800 text-white text-xs px-3 py-2 rounded-xl focus:outline-none border border-gray-700"
        />
        <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-xs cursor-pointer">
          Post
        </button>
      </form>
    </div>
  );
}

function VideoCard({ video, handleVote }) {
  const videoRef = useRef(null);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (video.type === 'VIDEO') {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) videoRef.current?.play().catch(() => {});
          else videoRef.current?.pause();
        },
        { threshold: 0.6 }
      );
      if (videoRef.current) observer.observe(videoRef.current);
      return () => observer.disconnect();
    }
  }, [video.type]);

  const handleShare = () => {
    const shareData = {
      title: 'Hot Take on Unfiltered',
      text: `Check out this Hot Take by @${video.user?.username || 'user'}: "${video.caption}"`,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${shareData.text} - ${shareData.url}`);
      alert('Link copied to clipboard! 🚀');
    }
  };

  const agreeCount = video.agreeCount || 0;
  const capCount = video.capCount || 0;
  const totalVotes = agreeCount + capCount;
  const agreePercent = totalVotes > 0 ? Math.round((agreeCount / totalVotes) * 100) : 50;
  const capPercent = 100 - agreePercent;

  const captionLength = video.caption?.trim().length || 0;
  const dynamicFontSize = captionLength > 0 && captionLength <= 25 ? '20pt' : '12pt';

  return (
    <div className="w-full h-[78vh] snap-start snap-always flex items-center justify-center py-2 relative">
      <div className="relative w-full max-w-md h-full bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 shadow-2xl flex flex-col justify-between">
        
        {/* Category Tag */}
        <div className="absolute top-3 left-3 z-20 bg-black/70 backdrop-blur-md text-red-400 font-bold text-[10px] px-2.5 py-1 rounded-full border border-gray-800">
          #{video.category || 'General'}
        </div>

        {/* Content Box */}
        <div className="relative flex-1 w-full flex flex-col items-center justify-center bg-black p-4 text-center overflow-hidden">
          {video.type === 'IMAGE' && video.imageUrls ? (
            <img src={video.imageUrls} alt="Media" className="w-full h-full object-cover rounded-2xl" />
          ) : video.type === 'VIDEO' && video.videoUrl ? (
            <video ref={videoRef} src={video.videoUrl} loop muted playsInline className="w-full h-full object-cover rounded-2xl" />
          ) : (
            <div className="space-y-4 max-w-xs">
              {video.caption && (
                <p style={{ fontSize: dynamicFontSize }} className="font-extrabold text-white leading-snug break-words">
                  "{decodeHTML(video.caption)}"
                </p>
              )}

              {video.linkUrl && (
                <a href={video.linkUrl} target="_blank" rel="noreferrer" className="block bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden text-left hover:border-red-500 transition">
                  {video.linkImage && <img src={video.linkImage} alt="Preview" className="w-full h-28 object-cover" />}
                  <div className="p-2.5">
                    <p className="text-xs font-bold text-white line-clamp-1">{decodeHTML(video.linkTitle) || video.linkUrl}</p>
                    {video.linkDescription && <p className="text-[10px] text-gray-400 line-clamp-2 mt-0.5">{decodeHTML(video.linkDescription)}</p>}
                  </div>
                </a>
              )}
            </div>
          )}
        </div>

        {showComments && <CommentsModal videoId={video.id} onClose={() => setShowComments(false)} />}

        {/* Bottom Actions */}
        <div className="p-4 bg-gradient-to-t from-black via-black/90 to-transparent">
          <div className="flex justify-between items-center">
            <Link href={`/profile/${video.userId}`} className="text-red-500 font-bold text-sm hover:underline">
              @{video.user?.username || 'anonymous'}
            </Link>

            <div className="flex gap-2">
              <button onClick={handleShare} className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-2.5 py-1.5 rounded-full font-bold border border-gray-700 cursor-pointer">
                🚀 Share
              </button>
              <button
                onClick={() => setShowComments(true)}
                className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-3 py-1.5 rounded-full font-bold border border-gray-700 cursor-pointer"
              >
                💬 Comments
              </button>
            </div>
          </div>

          <div className="mt-3 w-full bg-gray-700 h-2.5 rounded-full overflow-hidden flex">
            <div style={{ width: `${agreePercent}%` }} className="bg-red-600 h-full transition-all duration-300" />
            <div style={{ width: `${capPercent}%` }} className="bg-blue-600 h-full transition-all duration-300" />
          </div>

          <div className="flex justify-between text-[10px] font-bold mt-1 text-gray-300">
            <span>🔥 {agreePercent}% Agree ({agreeCount})</span>
            <span>🧢 {capPercent}% Cap ({capCount})</span>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handleVote(video.id, 'HOT')}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl font-bold text-xs active:scale-95 transition cursor-pointer"
            >
              🔥 Agree
            </button>
            <button
              onClick={() => handleVote(video.id, 'CAP')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-bold text-xs active:scale-95 transition cursor-pointer"
            >
              🧢 Cap
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VideoFeed() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortByLeaderboard, setSortByLeaderboard] = useState(false);

  useEffect(() => {
    async function fetchVideos() {
      setLoading(true);
      try {
        let url = `/api/upload?category=${selectedCategory}`;
        if (sortByLeaderboard) url += '&sort=hot';

        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch feed');
        const data = await res.json();
        if (data?.videos) setVideos(data.videos);
      } catch (err) {
        console.error("Feed Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchVideos();
  }, [selectedCategory, sortByLeaderboard]);

  const handleVote = async (videoId, type) => {
    setVideos((prev) =>
      prev.map((v) => {
        if (v.id === videoId) {
          return {
            ...v,
            agreeCount: type === 'HOT' ? (v.agreeCount || 0) + 1 : v.agreeCount,
            capCount: type === 'CAP' ? (v.capCount || 0) + 1 : v.capCount,
          };
        }
        return v;
      })
    );

    try {
      await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, type }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full">
      {/* Categories & Top Filter */}
      <div className="flex items-center justify-between gap-2 py-2 bg-black border-b border-gray-800">
        <div className="flex gap-1 overflow-x-auto no-scrollbar flex-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSortByLeaderboard(!sortByLeaderboard)}
          className={`px-3 py-1 rounded-full text-[11px] font-bold border transition flex-shrink-0 cursor-pointer ${
            sortByLeaderboard
              ? 'bg-yellow-500 text-black border-yellow-400 font-black'
              : 'bg-gray-900 text-yellow-500 border-gray-700'
          }`}
        >
          🏆 Top
        </button>
      </div>

      {/* Main Feed Section */}
      {loading ? (
        <div className="text-white text-center py-20 font-bold text-sm">Loading Unfiltered Feed...</div>
      ) : videos.length === 0 ? (
        <div className="text-gray-500 text-center py-20 font-bold text-xs">No posts found in this category!</div>
      ) : (
        <div className="h-[78vh] overflow-y-scroll snap-y snap-mandatory no-scrollbar">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} handleVote={handleVote} />
          ))}
        </div>
      )}
    </div>
  );
}