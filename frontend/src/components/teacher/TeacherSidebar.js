import React from 'react';
import { BookOpen, Home, Wallet, Calendar, Book, Users, User, Menu, X } from 'lucide-react';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'wallet', label: 'Earnings', icon: Wallet },
  { id: 'availability', label: 'Availability', icon: Calendar },
  { id: 'classroom', label: 'Classroom', icon: Book },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function TeacherSidebar({ activeSection, setActiveSection, isCollapsed, setIsCollapsed }) {
  return (
    <>
      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden animate-fade-in" onClick={() => setIsCollapsed(true)} />
      )}

      <aside className={`
        fixed left-0 top-0 h-full z-50 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
        flex flex-col bg-white/80 backdrop-blur-xl border-r border-gray-200/60
        ${isCollapsed ? 'w-[68px]' : 'w-[260px]'}
        max-lg:${isCollapsed ? '-translate-x-full' : 'translate-x-0'}
      `}>
        <div className="h-16 flex items-center justify-between px-4">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0F3D2E] to-[#1a5c44] flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-[15px] font-semibold text-[#0F3D2E] tracking-tight">Alif Amin</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            {isCollapsed ? <Menu className="w-4 h-4 text-gray-500" /> : <X className="w-4 h-4 text-gray-400 lg:hidden" />}
            {!isCollapsed && <Menu className="w-4 h-4 text-gray-400 hidden lg:block" />}
          </button>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              data-testid={`sidebar-${item.id}`}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                activeSection === item.id
                  ? 'bg-[#0F3D2E]/[0.07] text-[#0F3D2E]'
                  : 'text-gray-500 hover:bg-gray-100/70 hover:text-gray-700'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${activeSection === item.id ? 'text-[#0F3D2E]' : 'text-gray-400'}`} />
              {!isCollapsed && <span className="text-[14px] font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/80 backdrop-blur-xl border-t border-gray-200/60">
        <div className="flex items-center justify-around h-14">
          {MENU_ITEMS.slice(0, 5).map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                  isActive ? 'text-[#0F3D2E]' : 'text-gray-400'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
