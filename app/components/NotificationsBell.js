'use client';

import { useState, useEffect } from 'react';

export default function NotificationsBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await fetch('/api/notifications');
        const data = await res.json();
        if (data.notifications) setNotifications(data.notifications);
      } catch (err) {}
    }
    loadNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleOpen = async () => {
    setOpen(!open);
    if (unreadCount > 0) {
      await fetch('/api/notifications', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  return (
    <div className="relative">
      <button onClick={handleOpen} className="relative p-2 text-white text-lg">
        🔔
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-64 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-3 z-50 text-xs">
          <h4 className="font-bold text-white mb-2 pb-1 border-b border-gray-800">Notifications</h4>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-[11px] text-center">No notifications yet!</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-2 bg-gray-800 rounded-xl text-gray-300">
                  <span className="font-bold text-white">@{n.actorName}</span>{' '}
                  {n.type === 'VOTE_HOT' ? 'voted 🔥 Agree on your take' : 'voted 🧢 Cap on your take'}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}