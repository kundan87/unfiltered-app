'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function ProfilePage({ params }) {
  const resolvedParams = use(params);
  const userId = resolvedParams.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/user/${userId}`);
        const result = await res.json();
        if (result.user) setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [userId]);

  if (loading) return <div className="text-white text-center py-20 font-bold">Loading Profile...</div>;
  if (!data) return <div className="text-white text-center py-20 font-bold">User Not Found</div>;

  const { user, stats } = data;

  return (
    <div className="min-h-screen bg-black text-white p-4 max-w-md mx-auto pb-20">
      {/* Header Back Button */}
      <div className="mb-4">
        <Link href="/" className="text-red-500 text-xs font-bold bg-gray-900 px-3 py-1.5 rounded-full border border-gray-800">
          ← Back to Feed
        </Link>
      </div>

      {/* User Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5 text-center shadow-2xl relative overflow-hidden">
        <div className="w-20 h-20 bg-gradient-to-tr from-red-600 to-orange-500 rounded-full mx-auto flex items-center justify-center text-3xl font-black shadow-lg">
          {user.username?.[0]?.toUpperCase() || 'U'}
        </div>

        <h1 className="text-xl font-black mt-3">@{user.username}</h1>
        <span className="inline-block bg-red-600/20 text-red-400 border border-red-500/30 text-[11px] font-bold px-3 py-0.5 rounded-full mt-1">
          {stats.badge}
        </span>
        <p className="text-xs text-gray-400 mt-2">{user.bio}</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-5 bg-black/50 p-3 rounded-2xl border border-gray-800">
          <div>
            <p className="text-lg font-black text-white">{stats.totalPosts}</p>
            <p className="text-[10px] text-gray-400 font-bold">Takes</p>
          </div>
          <div>
            <p className="text-lg font-black text-red-500">{stats.totalAgrees}</p>
            <p className="text-[10px] text-gray-400 font-bold">🔥 Agrees</p>
          </div>
          <div>
            <p className="text-lg font-black text-blue-500">{stats.totalCaps}</p>
            <p className="text-[10px] text-gray-400 font-bold">🧢 Caps</p>
          </div>
        </div>

        {/* Agree Ratio Bar */}
        <div className="mt-4 text-left">
          <div className="flex justify-between text-[11px] font-bold mb-1">
            <span className="text-red-400">Credibility Rate</span>
            <span className="text-white">{stats.agreeRatio}% 🔥</span>
          </div>
          <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden flex">
            <div style={{ width: `${stats.agreeRatio}%` }} className="bg-red-600 h-full" />
            <div style={{ width: `${100 - stats.agreeRatio}%` }} className="bg-blue-600 h-full" />
          </div>
        </div>
      </div>

      {/* User Posts List */}
      <h2 className="text-sm font-bold mt-6 mb-3 text-gray-400 uppercase tracking-wider">Posts by @{user.username}</h2>
      <div className="space-y-3">
        {user.videos.map((post) => (
          <div key={post.id} className="bg-gray-900 border border-gray-800 p-4 rounded-2xl space-y-2">
            <span className="text-[10px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded-md font-bold">
              {post.category}
            </span>
            <p className="text-sm font-bold text-white">{post.caption}</p>
            <div className="flex justify-between text-[10px] text-gray-400 font-bold pt-1 border-t border-gray-800/80">
              <span>🔥 {post.agreeCount} Agree</span>
              <span>🧢 {post.capCount} Cap</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}