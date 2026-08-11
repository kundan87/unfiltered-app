'use client';

import { SignInButton, UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';

export default function Header() {
  const { user, isSignedIn, isLoaded } = useUser();

  return (
    <header className="flex justify-between items-center p-4 border-b border-gray-800 bg-black/80 backdrop-blur-md sticky top-0 z-50">
      <Link href="/">
        <h1 className="text-xl font-black text-red-600 tracking-wider cursor-pointer">UNFILTERED</h1>
      </Link>
      <div className="flex items-center gap-3">
        {!isLoaded ? (
          <div className="w-20 h-8 bg-gray-800 animate-pulse rounded-xl" />
        ) : !isSignedIn ? (
          <SignInButton mode="modal">
            <button className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition">
              Sign In
            </button>
          </SignInButton>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href={`/profile/${user.id}`}
              className="text-xs font-bold bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-xl border border-gray-700"
            >
              My Profile
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        )}
      </div>
    </header>
  );
}