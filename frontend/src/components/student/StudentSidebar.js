import React from 'react';
import { Home, Calendar, CreditCard, User, X, LogOut } from 'lucide-react';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'schedule', label: 'My Schedule', icon: Calendar },
  { id: 'wallet', label: 'Wallet', icon: CreditCard },
  { id: 'account', label: 'Account', icon: User },
];

export default function StudentSidebar({ activeTab, setActiveTab, isOpen, setIsOpen, user, onLogout }) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full bg-white z-50 transition-transform duration-300 ease-in-out
        w-72 lg:translate-x-0 shadow-xl lg:shadow-none border-r
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `} >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b" >
          <span className="text-xl font-semibold" style={{ color: '#0F3D2E' }}>
            Alif Amin
          </span>
          <button 
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b" >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0F3D2E] flex items-center justify-center text-white font-medium">
              {user?.name?.charAt(0) || 'S'}
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: '#1D1D1F' }}>{user?.name}</p>
              <p className="text-xs text-gray-500">Student</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-[#0F3D2E]/10 text-[#0F3D2E]' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                data-testid={`sidebar-${item.id}`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#0F3D2E]' : 'text-gray-400'}`} />
                <span className={`font-medium ${isActive ? 'text-[#0F3D2E]' : ''}`}>{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0F3D2E]" />}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t" >
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
            data-testid="logout-btn"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
