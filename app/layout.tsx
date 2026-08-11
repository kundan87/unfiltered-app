import { ClerkProvider } from '@clerk/nextjs';
import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Unfiltered - Raw Takes Feed',
  description: 'Share and vote on hot takes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-black antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}