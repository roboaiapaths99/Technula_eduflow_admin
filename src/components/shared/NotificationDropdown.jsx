import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, X, Volume2, Sparkles, ExternalLink } from 'lucide-react';
import { api } from '../../api';

// Gentle 2-tone chime using Web Audio API (no external file dependency)
function playNotificationChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12); // A5
    gain2.gain.setValueAtTime(0.18, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch (_) {
    // AudioContext blocked by browser autoplay policy before user interaction
  }
}

export default function NotificationDropdown({ user, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD'
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications(user?.id);
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err) {
      console.warn('[Notification Center] Failed to fetch:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000); // 25s live poll
    return () => clearInterval(interval);
  }, [user?.id]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const handleMarkRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      );
    } catch (err) {
      console.warn('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.read_at);
    for (const n of unread) {
      handleMarkRead(n.id);
    }
  };

  const getEventBadge = (type) => {
    const t = (type || '').toUpperCase();
    if (t.includes('HOMEWORK')) return { icon: '📚', color: '#3b82f6', bg: '#eff6ff', label: 'Homework' };
    if (t.includes('ATTENDANCE') || t.includes('ABSENCE')) return { icon: '🏫', color: '#10b981', bg: '#ecfdf5', label: 'Attendance' };
    if (t.includes('FEE')) return { icon: '💳', color: '#f59e0b', bg: '#fffbeb', label: 'Fee' };
    if (t.includes('GATE')) return { icon: '🎫', color: '#8b5cf6', bg: '#f5f3ff', label: 'Gate Pass' };
    if (t.includes('ANNOUNCEMENT') || t.includes('BROADCAST')) return { icon: '📢', color: '#ec4899', bg: '#fdf2f8', label: 'Notice' };
    return { icon: '⚡', color: '#64748b', bg: '#f8fafc', label: 'Notice' };
  };

  const filtered = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.read_at;
    return true;
  });

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        title="Notifications & Alerts"
        className="btn-secondary"
        style={{
          position: 'relative',
          padding: '8px',
          borderRadius: '8px',
          cursor: 'pointer',
          background: isOpen ? '#f1f5f9' : undefined,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Bell size={18} color={unreadCount > 0 ? '#4f46e5' : 'var(--text-secondary)'} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-3px',
            right: '-3px',
            background: '#ef4444',
            color: '#fff',
            fontSize: '10px',
            fontWeight: 800,
            minWidth: '16px',
            height: '16px',
            borderRadius: '999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Flyout Panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '380px',
          maxWidth: '92vw',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0,0,0,0.05)',
          zIndex: 1000,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '520px',
          animation: 'fadeIn 0.15s ease-out',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={16} color="#a5b4fc" />
              <span style={{ fontWeight: 800, fontSize: '14px', letterSpacing: '-0.01em' }}>
                Notifications & Alerts
              </span>
              {unreadCount > 0 && (
                <span style={{
                  background: 'rgba(239, 68, 68, 0.25)',
                  border: '1px solid #f87171',
                  color: '#fecaca',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '999px',
                }}>
                  {unreadCount} new
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: 'none',
                    color: '#e0e7ff',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Mark read
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Quick Action Test Bar */}
          <div style={{
            padding: '8px 16px',
            background: '#f8fafc',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
          }}>
            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setFilter('ALL')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: filter === 'ALL' ? '#4f46e5' : 'transparent',
                  color: filter === 'ALL' ? '#fff' : '#64748b',
                }}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('UNREAD')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: filter === 'UNREAD' ? '#4f46e5' : 'transparent',
                  color: filter === 'UNREAD' ? '#fff' : '#64748b',
                }}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '6px 0',
            maxHeight: '360px',
          }}>
            {filtered.length === 0 ? (
              <div style={{
                padding: '36px 20px',
                textAlign: 'center',
                color: '#94a3b8',
              }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎉</div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#475569' }}>All caught up!</div>
                <div style={{ fontSize: '11px', marginTop: '2px' }}>
                  {filter === 'UNREAD' ? 'No unread notifications' : 'No alerts posted yet'}
                </div>
              </div>
            ) : (
              filtered.map((item) => {
                const badge = getEventBadge(item.event_type);
                const isUnread = !item.read_at;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (isUnread) handleMarkRead(item.id);
                      if (onNavigate && item.event_type?.includes('ANNOUNCEMENT')) {
                        onNavigate('announcements');
                        setIsOpen(false);
                      }
                    }}
                    style={{
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      background: isUnread ? '#f8fafc' : '#ffffff',
                      borderBottom: '1px solid #f8fafc',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                  >
                    {/* Event Emoji Icon */}
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '10px',
                      background: badge.bg,
                      color: badge.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '15px',
                      flexShrink: 0,
                    }}>
                      {badge.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <span style={{
                          fontSize: '13px',
                          fontWeight: isUnread ? 800 : 600,
                          color: isUnread ? '#0f172a' : '#475569',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {item.title}
                        </span>
                        {isUnread && (
                          <span style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '999px',
                            background: '#4f46e5',
                            flexShrink: 0,
                          }} />
                        )}
                      </div>

                      <p style={{
                        margin: '2px 0 0 0',
                        fontSize: '12px',
                        color: '#64748b',
                        lineHeight: '1.4',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {item.message}
                      </p>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '4px',
                        fontSize: '10px',
                        color: '#94a3b8',
                      }}>
                        <span style={{
                          background: badge.bg,
                          color: badge.color,
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: '4px',
                        }}>
                          {badge.label}
                        </span>
                        <span>
                          {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '8px 14px',
            background: '#f8fafc',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#64748b',
          }}>
            <span>Live School Notification Hub</span>
            {onNavigate && (
              <button
                type="button"
                onClick={() => {
                  onNavigate('announcements');
                  setIsOpen(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4f46e5',
                  fontWeight: 700,
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <span>View All Notices</span>
                <ExternalLink size={10} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
