import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, HelpCircle, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import NotificationBell from '../NotificationBell';

export function Avatar({ name = '', picture, size = 'md' }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };
  if (picture) {
    return <img src={picture} alt={name} className={`${sizes[size]} rounded-full object-cover`} />;
  }
  return (
    <div className={`${sizes[size]} rounded-full bg-emerald-700 flex items-center justify-center text-white font-semibold`}>
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
}

function ProfileDropdown({ user, userRole, onLogout, onNavigateTab, onOpenSupport }) {

  const roleLabels = { student: 'Student', teacher: 'Teacher', admin: 'Admin' };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          data-testid="profile-dropdown-trigger"
          className="flex items-center gap-2 px-2 py-1.5 rounded-2xl hover:bg-slate-100 transition-colors duration-200 outline-none"
        >
          <Avatar name={user?.name} picture={user?.picture} size="sm" />
          <span className="hidden md:block text-sm font-medium text-slate-700 max-w-[120px] truncate">
            {user?.name?.split(' ')[0]}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5 shadow-lg border border-slate-200/60 bg-white/95 backdrop-blur-xl">
        <div className="px-3 py-2.5">
          <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
            {roleLabels[userRole] || userRole}
          </span>
        </div>
        <DropdownMenuSeparator className="bg-slate-100" />
        <DropdownMenuItem
          data-testid="profile-dropdown-account"
          className="rounded-xl cursor-pointer text-sm text-slate-700 hover:bg-slate-50 focus:bg-slate-50 py-2"
          onClick={() => onNavigateTab?.('account')}
        >
          <User className="w-4 h-4 mr-2.5 text-slate-400" />
          My Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          data-testid="profile-dropdown-support"
          className="rounded-xl cursor-pointer text-sm text-slate-700 hover:bg-slate-50 focus:bg-slate-50 py-2"
          onClick={() => onOpenSupport?.()}
        >
          <HelpCircle className="w-4 h-4 mr-2.5 text-slate-400" />
          Support
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-slate-100" />
        <DropdownMenuItem
          data-testid="profile-dropdown-logout"
          className="rounded-xl cursor-pointer text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 py-2"
          onClick={onLogout}
        >
          <LogOut className="w-4 h-4 mr-2.5" />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Sidebar({ menuItems, activeTab, setActiveTab, isOpen, setIsOpen, user, userRole, onLogout, roleBadge }) {
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden animate-fade-in" onClick={() => setIsOpen(false)} />}

      <aside className={`
        fixed top-0 left-0 h-full z-50 transition-transform duration-300
        w-[var(--sidebar-width)] lg:translate-x-0 flex flex-col
        bg-white/80 backdrop-blur-xl border-r border-slate-200/50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-[var(--header-height)] flex items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-700 flex items-center justify-center">
              <span className="text-white text-xs font-bold">AA</span>
            </div>
            <span className="text-sm font-semibold text-slate-900 tracking-tight">Alif Amin</span>
            {roleBadge && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold uppercase tracking-wide">
                {roleBadge}
              </span>
            )}
          </div>
          <button className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors" onClick={() => setIsOpen(false)}>
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-center gap-3">
            <Avatar name={user?.name} picture={user?.picture} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{userRole}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsOpen(false); }}
                data-testid={`sidebar-${item.id}`}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 mt-auto">
          <div className="h-px bg-slate-100 mb-3" />
          <button
            onClick={onLogout}
            data-testid="sidebar-logout"
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/80 backdrop-blur-xl border-t border-slate-200/50">
        <div className="flex items-center justify-around h-[var(--bottom-bar-height)]">
          {menuItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-[44px] transition-colors ${
                  isActive ? 'text-emerald-700' : 'text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

function Header({ title, user, userRole, onMenuClick, onLogout, onNavigateTab, onOpenSupport }) {
  return (
    <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-slate-200/50">
      <div className="h-[var(--header-height)] flex items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
            onClick={onMenuClick}
            data-testid="header-menu-toggle"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-base font-semibold text-slate-900">{title}</h1>
        </div>
        <div className="flex items-center gap-1.5">
          <NotificationBell userId={user?.user_id} userRole={user?.role || userRole} />
          <ProfileDropdown user={user} userRole={userRole} onLogout={onLogout} onNavigateTab={onNavigateTab} onOpenSupport={onOpenSupport} />
        </div>
      </div>
    </header>
  );
}

export default function LayoutShell({
  menuItems, activeTab, setActiveTab, tabTitles = {},
  user, userRole = 'student', roleBadge, onLogout, children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        menuItems={menuItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        user={user}
        userRole={userRole}
        onLogout={onLogout}
        roleBadge={roleBadge}
      />
      <div className="lg:ml-[var(--sidebar-width)] pb-20 lg:pb-0">
        <Header
          title={tabTitles[activeTab] || 'Dashboard'}
          user={user}
          userRole={userRole}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={onLogout}
          onNavigateTab={setActiveTab}
        />
        <main className="animate-fade-in-up">
          {children}
        </main>
      </div>
    </div>
  );
}
