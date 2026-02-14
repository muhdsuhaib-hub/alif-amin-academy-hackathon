import React from 'react';
import { Menu } from 'lucide-react';
import NotificationBell from '../NotificationBell';

export default function StudentHeader({ title, user, onMenuClick }) {
  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-4 lg:px-8" >
      <div className="flex items-center gap-4">
        <button 
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          onClick={onMenuClick}
          data-testid="menu-toggle"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <p className="text-xs text-gray-400 hidden sm:block">Student Portal</p>
          <h1 className="text-lg font-semibold" style={{ color: '#0F3D2E' }}>{title}</h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <NotificationBell userId={user?.user_id} userRole="student" />
        <div className="w-9 h-9 rounded-full bg-[#0F3D2E] flex items-center justify-center text-white font-medium">
          {user?.name?.charAt(0) || 'S'}
        </div>
      </div>
    </header>
  );
}
