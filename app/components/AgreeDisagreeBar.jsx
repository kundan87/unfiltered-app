'use client';
import { useState } from 'react';

export default function AgreeDisagreeBar({ videoId, initialAgree = 0, initialCap = 0 }) {
  const [agree, setAgree] = useState(initialAgree);
  const [cap, setCap] = useState(initialCap);
  const [voted, setVoted] = useState(null);

  const total = agree + cap;
  const agreePercent = total > 0 ? Math.round((agree / total) * 100) : 50;
  const capPercent = total > 0 ? 100 - agreePercent : 50;

  const handleVote = async (type) => {
    if (voted) return;
    if (type === 'AGREE') setAgree((prev) => prev + 1);
    if (type === 'CAP') setCap((prev) => prev + 1);
    setVoted(type);

    await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, type }),
    });
  };

  return (
    <div className="w-full mt-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800 backdrop-blur-md">
      <div className="flex justify-between gap-2 mb-2">
        <button
          onClick={() => handleVote('AGREE')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition ${
            voted === 'AGREE' ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-emerald-600/20 text-emerald-400'
          }`}
        >
          🔥 AGREE ({agreePercent}%)
        </button>
        <button
          onClick={() => handleVote('CAP')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition ${
            voted === 'CAP' ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-red-600/20 text-red-400'
          }`}
        >
          🧢 CAP ({capPercent}%)
        </button>
      </div>

      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
        <div style={{ width: `${agreePercent}%` }} className="h-full bg-emerald-500 transition-all duration-500" />
        <div style={{ width: `${capPercent}%` }} className="h-full bg-red-500 transition-all duration-500" />
      </div>
      <p className="text-[10px] text-slate-400 text-center mt-1.5">{total} total votes</p>
    </div>
  );
}