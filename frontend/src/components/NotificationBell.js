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
    earning_credited: '#22C55E',
    no_upcoming_class: '#F59E0B',
    leave_note_reminder: '#F59E0B',
    booking_cancelled: '#EF4444',
    new_registration: '#3B82F6',
    teacher_pending: '#8B5CF6'
  };
  
  return (
    <div 
      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: `${colorMap[type] || '#0F3D2E'}15` }}
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
      
      // Poll for new notifications every 60 seconds
      const interval = setInterval(() => {
        fetchNotifications();
      }, 60000);
      
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
      const response = await fetch(`${API}/notifications?user_id=${userId}&limit=20`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const generateNotifications = async () => {
    try {
      const endpoint = `${API}/notifications/generate/${userRole}/${userId}`;
      await fetch(endpoint, {
        method: 'POST',
        credentials: 'include'
      });
      // Refetch after generating
      setTimeout(fetchNotifications, 500);
    } catch (error) {
      console.error('Error generating notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${API}/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include'
      });
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.notification_id === notificationId ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/notifications/mark-all-read?user_id=${userId}`, {
        method: 'PUT',
        credentials: 'include'
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      toast.error('Failed to mark notifications as read');
    } finally {
      setLoading(false);
    }
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
        className="relative p-2 rounded-full hover:bg-gray-100 transition-all"
      >
        <Bell className="w-5 h-5" style={{ color: '#5A5A5A' }} />
        {unreadCount > 0 && (
          <span 
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium px-1"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-lg border z-50 overflow-hidden"
          style={{ borderColor: 'rgba(15, 61, 46, 0.1)' }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold" style={{ color: '#0F3D2E' }}>Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={loading}
                className="text-xs font-medium transition-opacity hover:opacity-70 flex items-center gap-1"
                style={{ color: '#0F3D2E' }}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-500">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'rgba(15, 61, 46, 0.05)' }}>
                {notifications.map((notification) => (
                  <div
                    key={notification.notification_id}
                    className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.is_read ? 'bg-[#0F3D2E]/[0.02]' : ''
                    }`}
                    onClick={() => {
                      if (!notification.is_read) {
                        markAsRead(notification.notification_id);
                      }
                    }}
                  >
                    <div className="flex gap-3">
                      <NotificationIcon type={notification.notification_type} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p 
                            className={`text-sm leading-snug ${!notification.is_read ? 'font-medium' : ''}`}
                            style={{ color: '#1F2933' }}
                          >
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <span className="w-2 h-2 rounded-full bg-[#0F3D2E] flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t bg-gray-50" style={{ borderColor: 'rgba(15, 61, 46, 0.08)' }}>
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Could navigate to a full notifications page here
                }}
                className="w-full text-center text-xs font-medium py-1 transition-opacity hover:opacity-70"
                style={{ color: '#0F3D2E' }}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
