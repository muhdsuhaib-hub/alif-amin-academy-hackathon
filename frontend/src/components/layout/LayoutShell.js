import React, { useState } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import NotificationBell from '../NotificationBell';

export function Avatar({ name = '', size = 'md' }) {
  const sizes = { sm: 'w-8 h-8 text-caption', md: 'w-10 h-10 text-small', lg: 'w-12 h-12 text-body' };
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-brand to-brand-light flex items-center justify-center text-white font-semibold`}>
      {name?.charAt(0) || '?'}
    </div>
  );
}

function Sidebar({ menuItems, activeTab, setActiveTab, isOpen, setIsOpen, user, userRole, onLogout, roleBadge }) {
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden animate-fade-in" onClick={() => setIsOpen(false)} />}

      <aside className={`
        fixed top-0 left-0 h-full z-50 transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
        w-[var(--sidebar-width)] lg:translate-x-0 flex flex-col
        bg-surface-card/80 backdrop-blur-xl border-r border-ink-faint/20
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-[var(--header-height)] flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="text-body font-semibold text-brand tracking-tight">Alif Amin</span>
            {roleBadge && (
              <span className="text-caption px-2 py-0.5 rounded-full bg-brand text-white font-semibold uppercase tracking-wide">
                {roleBadge}
              </span>
            )}
          </div>
          <button className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-subtle transition-colors" onClick={() => setIsOpen(false)}>
            <X className="w-4 h-4 text-ink-tertiary" />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-center gap-3">
            <Avatar name={user?.name} />
            <div className="min-w-0">
              <p className="text-small font-semibold text-ink truncate">{user?.name}</p>
              <p className="text-caption text-ink-tertiary capitalize">{userRole}</p>
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
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-small font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-brand/[0.07] text-brand'
                    : 'text-ink-secondary hover:bg-surface-subtle hover:text-ink'
                }`}
              >
                <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-brand' : 'text-ink-tertiary'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 mt-auto">
          <div className="h-px bg-surface-subtle mb-3" />
          <button
            onClick={onLogout}
            data-testid="sidebar-logout"
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-small font-medium text-ink-secondary hover:bg-danger/5 hover:text-danger transition-all duration-200"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-surface-card/80 backdrop-blur-xl border-t border-ink-faint/20">
        <div className="flex items-center justify-around h-[var(--bottom-bar-height)]">
          {menuItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-[44px] transition-colors ${
                  isActive ? 'text-brand' : 'text-ink-tertiary'
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

function Header({ title, user, onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 bg-surface-card/70 backdrop-blur-xl border-b border-ink-faint/20">
      <div className="h-[var(--header-height)] flex items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <button className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-subtle transition-colors" onClick={onMenuClick}>
            <Menu className="w-5 h-5 text-ink-secondary" />
          </button>
          <h1 className="text-body font-semibold text-ink">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell userId={user?.user_id} userRole={user?.role || 'student'} />
          <Avatar name={user?.name} size="sm" />
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
    <div className="min-h-screen bg-surface">
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
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="animate-fade-in-up">
          {children}
        </main>
      </div>
    </div>
  );
}
