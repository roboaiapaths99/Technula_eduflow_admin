import React, { useState, useEffect } from 'react';
import { api, API_BASE } from '../../api';
import {
  Palette, Upload, Save, CheckCircle2, AlertCircle, Cake,
  ShieldCheck, Sparkles, RefreshCw, Send
} from 'lucide-react';

export default function BrandingManager({ user, onBrandingUpdated }) {
  const [branding, setBranding] = useState({
    brand_color: '#635bff',
    powered_by_text: 'Powered by Technula-Gaj',
    logo_url: '',
    parent_profile_approval_required: false,
    birthday_template: 'Dear Parent, {school_name} extends warmest wishes to {student_name} (Class {grade}) on their Birthday! May this year bring happiness and success! 🎂🎉',
  });

  const [birthdaysToday, setBirthdaysToday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [triggeringBirthdays, setTriggeringBirthdays] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [brand, bdays] = await Promise.all([
        api.getSchoolBranding(),
        api.getTodayBirthdays().catch(() => null),
      ]);
      if (brand) {
        setBranding({
          brand_color: brand.brand_color || '#635bff',
          powered_by_text: brand.powered_by_text || 'Powered by Technula-Gaj',
          logo_url: brand.logo_url || '',
          parent_profile_approval_required: brand.parent_profile_approval_required || false,
          birthday_template: brand.birthday_template || 'Dear Parent, {school_name} extends warmest wishes to {student_name} (Class {grade}) on their Birthday! May this year bring happiness and success! 🎂🎉',
        });
      }
      setBirthdaysToday(bdays);
    } catch (err) {
      setError(err.message || 'Failed to load branding info');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const res = await api.uploadFile(file);
      setBranding(prev => ({ ...prev, logo_url: res.url }));
      setMessage('New crest / logo uploaded.');
    } catch (err) {
      setError(err.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.updateSchoolBranding(branding);
      setMessage('Branding and configuration preferences updated.');
      if (onBrandingUpdated) onBrandingUpdated(branding);
    } catch (err) {
      setError(err.message || 'Failed to update branding');
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerBirthdayWishes = async () => {
    setTriggeringBirthdays(true);
    setError(null);
    try {
      const res = await api.triggerBirthdayWishes();
      setMessage(res.message);
    } catch (err) {
      setError(err.message || 'Failed to trigger birthday wishes');
    } finally {
      setTriggeringBirthdays(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
      <div>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>White-Label School Identity & Automation</h3>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Configure institution theme colors, crest, parent profile workflow, and automated celebrations.
        </p>
      </div>

      {message && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '12px 16px', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} /> {message}
        </div>
      )}

      {error && (
        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSave} className="tech-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Brand Color & Logo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Primary Brand Theme Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
              <input
                type="color"
                value={branding.brand_color}
                onChange={(e) => setBranding({ ...branding, brand_color: e.target.value })}
                style={{ width: '42px', height: '42px', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: 0 }}
              />
              <input
                type="text"
                value={branding.brand_color}
                onChange={(e) => setBranding({ ...branding, brand_color: e.target.value })}
                style={{ width: '120px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 700 }}
              />
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
              Applies across headers, buttons, pills, and mobile PWA tint.
            </div>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Footer Platform Attribution</label>
            <input
              type="text"
              value={branding.powered_by_text}
              onChange={(e) => setBranding({ ...branding, powered_by_text: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '6px', fontSize: '13px', boxSizing: 'border-box' }}
            />
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
              Displayed on public login pages and student report cards.
            </div>
          </div>
        </div>

        {/* School Crest / Logo */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>School Crest / Logo</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
            {branding.logo_url ? (
              <img
                src={branding.logo_url.startsWith('http') ? branding.logo_url : `${API_BASE || 'http://localhost:8000'}${branding.logo_url}`}
                alt="Logo"
                style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #cbd5e1' }}
              />
            ) : (
              <div style={{ width: '56px', height: '56px', borderRadius: '10px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '20px', fontWeight: 800 }}>
                {user?.school_name?.[0] || 'S'}
              </div>
            )}
            <label style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Upload size={14} /> {uploadingLogo ? 'Uploading...' : 'Change Crest'}
              <input type="file" accept="image/*" onChange={handleUploadLogo} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {/* Parent Profile Approval Setting */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={branding.parent_profile_approval_required}
              onChange={(e) => setBranding({ ...branding, parent_profile_approval_required: e.target.checked })}
              style={{ marginTop: '3px' }}
            />
            <div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                Require Admin Approval for Parent Profile Changes
              </span>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                When enabled, changes to phone numbers, emergency contacts, and home addresses will wait in the Administrator Review Queue before updating official records.
              </p>
            </div>
          </label>
        </div>

        {/* Birthday Engine & Template */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px', marginTop: '4px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
            border: '1px solid #bbf7d0',
            borderRadius: '10px',
            padding: '14px 16px',
            marginBottom: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>⚡</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#166534' }}>
                  Automated Daily Birthday Dispatch: ACTIVE
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  background: '#22c55e',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  Auto-Runs at 07:00 AM
                </span>
              </div>
              {birthdaysToday && (
                <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 700, background: '#dcfce7', padding: '3px 10px', borderRadius: '8px' }}>
                  🎂 {birthdaysToday.count} student(s) celebrating today!
                </span>
              )}
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#15803d', lineHeight: '1.5' }}>
              <strong>Zero manual work required:</strong> The system automatically queries student dates of birth from the database every morning, dispatches personalized wishes to parents, and launches the celebratory boom animation inside the Parent App & Portal.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
              Customized Birthday Message Template
            </label>
          </div>
          <textarea
            rows={3}
            value={branding.birthday_template}
            onChange={(e) => setBranding({ ...branding, birthday_template: e.target.value })}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
          />
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Available tags: <code>{'{student_name}'}</code>, <code>{'{school_name}'}</code>, <code>{'{grade}'}</code>. Delivers in-app celebratory boom banner and multi-channel message.
          </div>

          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={handleTriggerBirthdayWishes}
              disabled={triggeringBirthdays}
              className="btn-secondary"
              style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px' }}
            >
              <Send size={14} /> {triggeringBirthdays ? 'Sending...' : "Test Instant Dispatch (Optional)"}
            </button>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              *Optional manual test trigger. The automated scheduler handles daily delivery automatically.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button type="submit" disabled={saving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
