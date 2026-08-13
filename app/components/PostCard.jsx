'use client';

export default function PostCard({ post }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center font-bold text-white text-sm">
          {post.user?.username ? post.user.username[0].toUpperCase() : 'U'}
        </div>
        <div>
          <h4 className="text-xs font-bold text-white">@{post.user?.username || 'user'}</h4>
          <span className="text-[10px] text-gray-500">{post.category || 'General'}</span>
        </div>
      </div>

      {/* Text / Caption */}
      <p className="text-sm text-gray-200 mb-3 whitespace-pre-wrap">{post.caption}</p>

      {/* Link Snippet Box */}
      {post.linkUrl && (
        <a
          href={post.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-gray-950 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition"
        >
          {post.linkImage && (
            <img src={post.linkImage} alt="Snippet" className="w-full h-40 object-cover" />
          )}
          <div className="p-3">
            <h5 className="text-xs font-bold text-white truncate">{post.linkTitle || post.linkUrl}</h5>
            {post.linkDescription && (
              <p className="text-[11px] text-gray-400 line-clamp-2 mt-1">{post.linkDescription}</p>
            )}
            <span className="text-[10px] text-red-500 font-medium block mt-1">{post.linkUrl}</span>
          </div>
        </a>
      )}

      {/* Image Post */}
      {post.imageUrls && !post.linkUrl && (
        <img src={post.imageUrls} alt="Post content" className="w-full rounded-xl object-cover max-h-96 mt-2" />
      )}

      {/* Video / Reel Post */}
      {post.videoUrl && (
        <video src={post.videoUrl} controls className="w-full rounded-xl max-h-96 mt-2" />
      )}
    </div>
  );
}