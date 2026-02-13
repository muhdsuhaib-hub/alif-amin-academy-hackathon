import React from 'react';
import { BookOpen, Home, Wallet, Calendar, Book, Users, User, Menu } from 'lucide-react';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'wallet', label: 'Earnings Wallet', icon: Wallet },
  { id: 'availability', label: 'Availability', icon: Calendar },
  { id: 'classroom', label: 'Classroom Tools', icon: Book },
  { id: 'students', label: 'Student Management', icon: Users },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function TeacherSidebar({ activeSection, setActiveSection, isCollapsed, setIsCollapsed }) {
  return (
    <aside 
      className={`fixed left-0 top-0 h-full bg-white border-r z-50 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}
      style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}
    >
      {/* Logo */}
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0F3D2E' }}>
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm" style={{ color: '#0F3D2E' }}>Alif Amin</span>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-all"
        >
          <Menu className="w-5 h-5" style={{ color: '#5A5A5A' }} />
        </button>
      </div>

      {/* Menu Items */}
      <nav className="p-2 space-y-1">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              activeSection === item.id ? 'bg-[#0F3D2E] text-white' : 'hover:bg-gray-50 text-gray-600'
            }`}
            data-testid={`sidebar-${item.id}`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}
