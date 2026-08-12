'use client';

import { useState, useEffect } from 'react';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';
import VideoFeed from './components/VideoFeed';
import CreatePost from './components/CreatePost';
import NotificationsBell from './components/NotificationsBell';
import StoriesBar from './components/StoriesBar';
import ReelsFeed from './components/ReelsFeed';

export default function Home() {
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'reels' | 'create'
  const [mounted, setMounted] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-screen bg-black text-white selection:bg-red-500">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-gray-800 px-4 py-3">
        <div className="max-w-xl mx-auto flex justify-between items-center">
          <h1
            className="text-xl font-black tracking-wider text-red-600 cursor-pointer select-none"
            onClick={() => setActiveTab('feed')}
          >
            UNFILTERED
          </h1>

          <div className="flex items-center gap-3">
            {mounted ? (
              <AuthSection />
            ) : (
              <div className="bg-gray-800 text-gray-400 text-xs px-3 py-1.5 rounded-full">
                ...
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-xl mx-auto px-2 pt-2 pb-12">
        {/* 24-Hour Expiring Stories Bar */}
        {mounted && (
          <div className="mb-3">
            <StoriesBar userId={user?.id || 'guest'} />
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-800 mb-3 sticky top-[57px] bg-black/95 z-40 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setActiveTab('feed')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1 border-b-2 cursor-pointer ${
              activeTab === 'feed'
                ? 'border-red-600 text-red-500'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            🔥 Hot Takes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reels')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1 border-b-2 cursor-pointer ${
              activeTab === 'reels'
                ? 'border-red-600 text-red-500'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            📱 Reels
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1 border-b-2 cursor-pointer ${
              activeTab === 'create'
                ? 'border-red-600 text-red-500'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            ➕ Create Take
          </button>
        </div>

        {/* Tab View */}
        {activeTab === 'feed' && <VideoFeed />}
        {activeTab === 'reels' && <ReelsFeed videos={[]} />}
        {activeTab === 'create' && (
          <CreatePost onPostSuccess={() => setActiveTab('feed')} />
        )}
      </div>
    </main>
  );
}

function AuthSection() {
  const { isSignedIn, isLoaded } = useUser();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoaded) setTimedOut(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [isLoaded]);

  if (!isLoaded && !timedOut) {
    return (
      <div className="bg-gray-800 text-gray-400 text-xs px-3 py-1.5 rounded-full animate-pulse">
        ...
      </div>
    );
  }

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-3">
        <NotificationsBell />
        <UserButton />
      </div>
    );
  }

  return (
    <SignInButton mode="modal">
      <button
        type="button"
        className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-full transition cursor-pointer"
      >
        Sign In
      </button>
    </SignInButton>
  );
}