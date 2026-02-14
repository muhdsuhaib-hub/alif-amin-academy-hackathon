import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, Calendar, DollarSign, UserPlus, AlertCircle, BookOpen, Clock } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const NotificationIcon = ({ type }) => {
  const iconMap = {
    upcoming_class: Calendar,
    class_reminder: Clock,
    booking_confirmed: Check,
    booking_cancelled: X,
    no_upcoming_class: BookOpen,
    leave_note_reminder: AlertCircle,
    earning_credited: DollarSign,
    withdrawal_request: DollarSign,
    new_registration: UserPlus,
    class_reschedule: Calendar,
    teacher_approved: Check,
    teacher_pending: UserPlus,
    system: Bell
  };
  
  const IconComponent = iconMap[type] || Bell;
  
  const colorMap = {
    upcoming_class: '#0F3D2E',
    earning_credited: '#34C759',
    no_upcoming_class: '#FF9500',
    leave_note_reminder: '#FF9500',
    booking_cancelled: '#FF3B30',
    new_registration: '#007AFF',
    teacher_pending: '#AF52DE'
  };
  
  return (
    <div 
      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: `${colorMap[type] || '#0F3D2E'}10` }}
    >
      <IconComponent className="w-4 h-4" style={{ color: colorMap[type] || '#0F3D2E' }} />
    </div>
  );
};

export default function NotificationBell({ userId, userRole }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      generateNotifications();
      const interval = setInterval(() => { fetchNotifications(); }, 60000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API}/notifications?user_id=${userId}&limit=20`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) { console.error('Error fetching notifications:', error); }
  };

  const generateNotifications = async () => {
    try {
      await fetch(`${API}/notifications/generate/${userRole}/${userId}`, { method: 'POST', credentials: 'include' });
      setTimeout(fetchNotifications, 500);
    } catch (error) { console.error('Error generating notifications:', error); }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${API}/notifications/${notificationId}/read`, { method: 'PUT', credentials: 'include' });
      if (response.ok) {
        setNotifications(prev => prev.map(n => n.notification_id === notificationId ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) { console.error('Error marking notification as read:', error); }
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/notifications/mark-all-read?user_id=${userId}`, { method: 'PUT', credentials: 'include' });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (error) { toast.error('Failed to mark notifications as read'); }
    finally { setLoading(false); }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        data-testid="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-all duration-200"
      >
        <Bell className="w-[18px] h-[18px] text-gray-500" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-semibold px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[380px] glass rounded-2xl shadow-apple-lg border border-white/20 z-50 overflow-hidden animate-scale-in">
          <div className="px-5 py-4 border-b border-gray-100/80 flex items-center justify-between">
            <h3 className="font-semibold text-[15px] text-[#1D1D1F] tracking-tight">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <>
                  <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-500 text-[11px] font-medium">
                    {unreadCount} new
                  </span>
                  <button
                    onClick={markAllAsRead}
                    disabled={loading}
                    className="text-[12px] font-medium text-[#0F3D2E] hover:text-[#0F3D2E]/70 transition-colors flex items-center gap-1"
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
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-5 h-5 text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <div
                    key={notification.notification_id}
                    className={`px-5 py-3.5 hover:bg-gray-50/60 transition-colors cursor-pointer border-b border-gray-50 ${
                      !notification.is_read ? 'bg-[#0F3D2E]/[0.02]' : ''
                    }`}
                    onClick={() => { if (!notification.is_read) markAsRead(notification.notification_id); }}
                  >
                    <div className="flex gap-3">
                      <NotificationIcon type={notification.notification_type} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-[13px] leading-snug ${!notification.is_read ? 'font-semibold text-[#1D1D1F]' : 'text-gray-700'}`}>
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <span className="w-2 h-2 rounded-full bg-[#0F3D2E] flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-[12px] text-gray-400 mt-0.5 line-clamp-2">{notification.message}</p>
                        <p className="text-[11px] text-gray-300 mt-1">{formatTime(notification.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
