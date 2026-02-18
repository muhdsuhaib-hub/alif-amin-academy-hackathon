import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Check, CheckCheck, Calendar, DollarSign, UserPlus, AlertCircle, BookOpen, Clock } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ICON_MAP = {
  upcoming_class: { icon: Calendar, color: '#059669' },
  class_reminder: { icon: Clock, color: '#059669' },
  booking_confirmed: { icon: Check, color: '#059669' },
  booking_cancelled: { icon: X, color: '#DC2626' },
  no_upcoming_class: { icon: BookOpen, color: '#D97706' },
  leave_note_reminder: { icon: AlertCircle, color: '#D97706' },
  earning_credited: { icon: DollarSign, color: '#059669' },
  withdrawal_request: { icon: DollarSign, color: '#D97706' },
  new_registration: { icon: UserPlus, color: '#2563EB' },
  class_reschedule: { icon: Calendar, color: '#D97706' },
  teacher_approved: { icon: Check, color: '#059669' },
  teacher_pending: { icon: UserPlus, color: '#7C3AED' },
  system: { icon: Bell, color: '#64748B' },
};

function NotificationIcon({ type }) {
  const config = ICON_MAP[type] || ICON_MAP.system;
  const IconComponent = config.icon;
  return (
    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${config.color}10` }}>
      <IconComponent className="w-4 h-4" style={{ color: config.color }} />
    </div>
  );
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationBell({ userId, userRole }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      generateNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API}/notifications?user_id=${userId}&limit=20`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err) { console.error('Notification fetch error:', err); }
  };

  const generateNotifications = async () => {
    try {
      await fetch(`${API}/notifications/generate/${userRole}/${userId}`, { method: 'POST', credentials: 'include' });
      setTimeout(fetchNotifications, 500);
    } catch (err) { console.error('Notification generate error:', err); }
  };

  const markAsRead = async (notificationId) => {
    try {
      const res = await fetch(`${API}/notifications/${notificationId}/read`, { method: 'PUT', credentials: 'include' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.notification_id === notificationId ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) { console.error('Mark read error:', err); }
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/notifications/mark-all-read?user_id=${userId}`, { method: 'PUT', credentials: 'include' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (err) { toast.error('Failed to update'); }
    finally { setLoading(false); }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) markAsRead(notification.notification_id);
    // Navigate to linked page if available
    if (notification.link) {
      setIsOpen(false);
      navigate(notification.link);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        data-testid="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors duration-200"
      >
        <Bell className="w-[18px] h-[18px] text-slate-500" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-semibold px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[380px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 z-50 overflow-hidden animate-scale-in">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-slate-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <>
                  <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-500 text-[11px] font-medium">
                    {unreadCount} new
                  </span>
                  <button
                    onClick={markAllAsRead}
                    disabled={loading}
                    data-testid="mark-all-read-btn"
                    className="text-xs font-medium text-emerald-700 hover:text-emerald-600 transition-colors flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Read all
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-sm text-slate-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.notification_id}
                  data-testid={`notification-item-${n.notification_id}`}
                  className={`px-5 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 ${
                    !n.is_read ? 'bg-emerald-50/30' : ''
                  }`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="flex gap-3">
                    <NotificationIcon type={n.notification_type} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-[13px] leading-snug ${!n.is_read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                          {n.title}
                        </p>
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-emerald-600 flex-shrink-0 mt-1.5" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[11px] text-slate-400">{formatTime(n.created_at)}</p>
                        {n.link && n.action_required && (
                          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                            Action needed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
