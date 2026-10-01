import React, { useState } from 'react';
import { api } from '../../api';
import {
  Megaphone, MessageSquare, Mail, Send, CheckCircle2,
  AlertCircle, X, ShieldCheck, Check, Users
} from 'lucide-react';

export default function NotificationBroadcastModal({ isOpen, onClose, user }) {
  const [form, setForm] = useState({
    title: '',
    message: '',
    target_audience: 'ALL_PARENTS',
    grade: '10',
    section: 'A',
    channels: ['in_app', 'whatsapp', 'email'],
  });

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleChannelToggle = (ch) => {
    if (ch === 'in_app') return; // In-app is always enabled
    setForm(prev => {
      const exists = prev.channels.includes(ch);
      const updated = exists ? prev.channels.filter(c => c !== ch) : [...prev.channels, ch];
      return { ...prev, channels: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.sendBroadcast(form);
      setResult(res);
    } catch (err) {
      setError(err.message || 'Failed to dispatch broadcast');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '16px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        maxWidth: '560px',
        width: '100%',
        padding: '24px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--primary-light, #e0e7ff)', padding: '8px', borderRadius: '10px', color: 'var(--primary, #635bff)' }}>
              <Megaphone size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Parent Broadcast Dispatch</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Multi-channel delivery with parent opt-in compliance</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {result ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
              <CheckCircle2 size={28} />
            </div>
            <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#15803d' }}>
              Broadcast Successfully Sent!
            </h4>
            <p style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>{result.message}</p>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', marginTop: '16px', textAlign: 'left', fontSize: '13px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, marginBottom: '8px', color: '#0f172a' }}>Delivery Summary:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>Total Recipients: <strong>{result.summary.total_recipients}</strong></div>
                <div>In-App Delivered: <strong>{result.summary.in_app_delivered}</strong> (100%)</div>
                <div style={{ color: '#15803d' }}>WhatsApp Sent: <strong>{result.summary.whatsapp_delivered}</strong></div>
                <div style={{ color: '#b45309' }}>WhatsApp Opted-Out: <strong>{result.summary.whatsapp_opted_out}</strong></div>
                <div style={{ color: '#2563eb' }}>Email Sent: <strong>{result.summary.email_delivered}</strong></div>
                <div style={{ color: '#b45309' }}>Email Opted-Out: <strong>{result.summary.email_opted_out}</strong></div>
              </div>
            </div>

            <button onClick={onClose} className="btn-primary" style={{ marginTop: '20px', width: '100%' }}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {error && (
              <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Target Audience</label>
              <select
                value={form.target_audience}
                onChange={(e) => setForm({ ...form, target_audience: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
              >
                <option value="ALL_PARENTS">All School Parents (Campus-Wide)</option>
                <option value="GRADE">Specific Grade / Class Only</option>
                <option value="SECTION">Specific Class & Section</option>
              </select>
            </div>

            {form.target_audience !== 'ALL_PARENTS' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Grade</label>
                  <input
                    type="text"
                    placeholder="e.g. 10"
                    value={form.grade}
                    onChange={(e) => setForm({ ...form, grade: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
                {form.target_audience === 'SECTION' && (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Section</label>
                    <input
                      type="text"
                      placeholder="e.g. A"
                      value={form.section}
                      onChange={(e) => setForm({ ...form, section: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                    />
                  </div>
                )}
              </div>
            )}

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Announcement Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Important Notice: Early Dismissal Tomorrow"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Message Content *</label>
              <textarea
                required
                rows={4}
                placeholder="Compose announcement message..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
              />
            </div>

            {/* Channels & Opt-in info */}
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                Delivery Channels:
              </div>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'not-allowed', color: '#1e293b' }}>
                  <input type="checkbox" checked disabled />
                  <span>In-App Inbox (Always Active)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: '#16a34a', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={form.channels.includes('whatsapp')}
                    onChange={() => handleChannelToggle('whatsapp')}
                  />
                  <span>WhatsApp Cloud API</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: '#2563eb', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={form.channels.includes('email')}
                    onChange={() => handleChannelToggle('email')}
                  />
                  <span>Email (Resend API)</span>
                </label>
              </div>

              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={14} color="#635bff" />
                <span>Parent Permission System: Channels will only be reached if the guardian opted in.</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={sending} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={15} /> {sending ? 'Dispatching...' : 'Dispatch Broadcast'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
