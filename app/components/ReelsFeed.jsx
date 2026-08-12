'use client';
import AgreeDisagreeBar from './AgreeDisagreeBar';

export default function ReelsFeed({ videos }) {
  return (
    <div className="h-screen w-full overflow-y-scroll snap-y snap-mandatory bg-black text-white no-scrollbar">
      {videos.map((video) => (
        <div
          key={video.id}
          className="h-screen w-full snap-start relative flex flex-col justify-end p-6 border-b border-slate-900"
        >
          {/* Media Player */}
          {video.type === 'VIDEO' && video.videoUrl ? (
            <video
              src={video.videoUrl}
              loop
              autoPlay
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover z-0"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-black p-8 flex items-center justify-center text-center z-0">
              <p className="text-xl font-bold text-slate-100">{video.caption}</p>
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent z-10" />

          {/* User Info & Actions */}
          <div className="relative z-20 max-w-lg mb-12 w-full">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-xs font-bold">
                {video.user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="font-bold text-sm">@{video.user?.username || 'creator'}</span>
            </div>

            <p className="text-xs text-slate-200 mb-2">{video.caption}</p>

            {/* Voting Bar */}
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