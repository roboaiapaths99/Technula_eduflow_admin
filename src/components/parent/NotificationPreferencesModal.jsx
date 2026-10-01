import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import {
  Bell, MessageSquare, Mail, Smartphone, CheckCircle2,
  AlertCircle, ShieldCheck, X, Save
} from 'lucide-react';

export default function NotificationPreferencesModal({ isOpen, onClose, user }) {
  const [prefs, setPrefs] = useState({
    allow_whatsapp: true,
    allow_email: true,
    allow_sms: false,
    in_app_enabled: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) loadPreferences();
  }, [isOpen]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const data = await api.getNotificationPreferences();
      setPrefs(data);
    } catch (err) {
      console.error('Failed to load preferences', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await api.updateNotificationPreferences(prefs);
      setMessage(res.message);
      setTimeout(() => {
        setMessage(null);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        maxWidth: '460px',
        width: '100%',
        padding: '24px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--primary-light, #e0e7ff)', padding: '8px', borderRadius: '10px', color: 'var(--primary, #635bff)' }}>
              <Bell size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>Notification & Channel Permissions</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Select where you receive academic notices</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {message && (
          <div style={{ background: '#dcfce7', color: '#15803d', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <CheckCircle2 size={16} /> {message}
          </div>
        )}

        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, marginBottom: '14px' }}>
            {error}
          </div>
        )}

        <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: '0 0 16px 0' }}>
          Control which communication channels the school is authorized to use for homework updates, attendance alerts, and official notices.
        </p>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Channel 1: In-App */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bell size={18} color="var(--primary, #635bff)" />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>In-App Guardian Inbox</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Always active for security & receipts</div>
              </div>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '3px 8px', borderRadius: '6px' }}>
              ACTIVE
            </span>
          </div>

          {/* Channel 2: WhatsApp */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MessageSquare size={18} color="#16a34a" />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#14532d' }}>Meta WhatsApp Cloud Alerts</div>
                <div style={{ fontSize: '11px', color: '#15803d' }}>Instant fee receipts & gate passes via WhatsApp</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.allow_whatsapp}
              onChange={(e) => setPrefs({ ...prefs, allow_whatsapp: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#16a34a' }}
            />
          </div>

          {/* Channel 3: Email */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Mail size={18} color="#2563eb" />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e3a8a' }}>Official Email Reports</div>
                <div style={{ fontSize: '11px', color: '#1d4ed8' }}>Term report cards & academic circulars</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.allow_email}
              onChange={(e) => setPrefs({ ...prefs, allow_email: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2563eb' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Save size={15} /> {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
