import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { Megaphone, Send, MessageSquare, Mail, Bell, Pin, CheckCircle2, Edit2, Trash2, X, AlertCircle, Sparkles } from 'lucide-react';

export default function AnnouncementsCenter({ user }) {
  const schoolId = user?.school_id;
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState('ALL');
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [isPinned, setIsPinned] = useState(false);
  const [posting, setPosting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  // Feature 9: Bulk WhatsApp Broadcast State
  const [broadcastingAnn, setBroadcastingAnn] = useState(null);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState('ALL');
  const [broadcastResult, setBroadcastResult] = useState(null);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await api.getAnnouncements(schoolId);
      setAnnouncements(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, [schoolId]);

  const handleOpenCompose = () => {
    setEditingAnnouncement(null);
    setTitle('');
    setContent('');
    setTargetRole('ALL');
    setSendWhatsApp(true);
    setSendEmail(true);
    setIsPinned(false);
    setShowCompose(true);
  };

  const handleOpenEdit = (a) => {
    setEditingAnnouncement(a);
    setTitle(a.title || '');
    setContent(a.content || '');
    setTargetRole(a.target_role || 'ALL');
    setSendWhatsApp(false);
    setSendEmail(false);
    setIsPinned(a.is_pinned || false);
    setShowCompose(true);
  };

  const handleOpenBroadcast = (ann) => {
    setBroadcastingAnn(ann);
    setBroadcastTarget(ann.target_role || 'ALL');
    setBroadcastResult(null);
  };

  const handleExecuteBroadcast = async () => {
    if (!broadcastingAnn) return;
    setBroadcasting(true);
    setBroadcastResult(null);
    try {
      const res = await api.broadcastAnnouncementWhatsApp(broadcastingAnn.id, {
        target_role: broadcastTarget,
      });
      setBroadcastResult(res);
      setSuccessMsg(`WhatsApp broadcast completed! Dispatched to ${res.recipients_count || 0} parent phones.`);
      setTimeout(() => setSuccessMsg(null), 5000);
      loadAnnouncements();
    } catch (err) {
      alert('Broadcast failed: ' + (err.message || 'Network error'));
    } finally {
      setBroadcasting(false);
    }
  };

  const handleDelete = async (id, anTitle) => {
    if (!window.confirm(`Delete announcement "${anTitle}"?`)) return;
    try {
      await api.deleteAnnouncement(id);
      setSuccessMsg('Announcement deleted successfully.');
      loadAnnouncements();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (e) {
      alert('Failed to delete announcement');
    }
  };

  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    if (!title || !content) return;
    setPosting(true);
    setSuccessMsg(null);
    try {
      if (editingAnnouncement) {
        await api.updateAnnouncement(editingAnnouncement.id, {
          title,
          content,
          target_role: targetRole,
          is_pinned: isPinned,
        });
        setSuccessMsg('Announcement updated successfully!');
      } else {
        const res = await api.createAnnouncement({
          school_id: schoolId,
          author_id: user?.id,
          title,
          content,
          target_role: targetRole,
          send_whatsapp: sendWhatsApp,
          send_email: sendEmail,
          is_pinned: isPinned,
        });
        setSuccessMsg(res.message || 'Announcement broadcasted successfully!');
      }
      setTitle('');
      setContent('');
      setShowCompose(false);
      setEditingAnnouncement(null);
      loadAnnouncements();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e) {
      alert('Failed to save announcement');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="pill pill-primary">School Broadcast Network</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Multi-Channel Dispatch</span>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, marginTop: '6px', color: 'var(--text-primary)' }}>
            Official Notices & Announcements
          </h2>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              if (showCompose) {
                setShowCompose(false);
                setEditingAnnouncement(null);
              } else {
                handleOpenCompose();
              }
            }}
            className="btn-primary"
            style={{ fontSize: '14px' }}
          >
            <Megaphone size={16} />
            {showCompose ? 'Close Composer' : 'Broadcast Announcement'}
          </button>
        )}
      </div>

      {successMsg && (
        <div style={{
          background: 'var(--accent-emerald-light)',
          color: 'var(--accent-emerald)',
          padding: '12px 18px',
          borderRadius: '10px',
          marginBottom: '20px',
          fontSize: '14px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {/* Compose Form Modal/Accordion */}
      {showCompose && (
        <div className="tech-card" style={{ padding: '24px', marginBottom: '28px', background: '#ffffff', border: '1.5px solid var(--primary-border)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Draft Official Notice
          </h3>
          <form onSubmit={handleSaveAnnouncement}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Notice Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Parent-Teacher Meeting (PTM) Term 2"
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Target Audience</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="form-input"
                >
                  <option value="ALL">Entire School (All Parents & Faculty)</option>
                  <option value="PARENTS">Parents Only</option>
                  <option value="TEACHERS">Teachers Faculty Only</option>
                  <option value="GRADE_10">Grade 10 Only</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Notice Details</label>
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type complete details, guidelines, timing, and venue..."
                className="form-input"
                required
              />
            </div>

            {/* Delivery Channels */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', marginBottom: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={sendWhatsApp}
                  onChange={(e) => setSendWhatsApp(e.target.checked)}
                />
                <span style={{ color: '#047857' }}>💬 Send WhatsApp Alert</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                />
                <span style={{ color: '#4338ca' }}>✉️ Send Email Alert</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                />
                <span>📌 Pin to Top</span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => { setShowCompose(false); setEditingAnnouncement(null); }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={posting}
                className="btn-primary"
              >
                <Send size={15} />
                {posting ? 'Saving...' : (editingAnnouncement ? 'Update Announcement' : 'Publish Broadcast')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Announcements Stream */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {announcements.map((a) => (
          <div
            key={a.id}
            className="tech-card"
            style={{
              padding: '24px',
              borderLeft: a.is_pinned ? '4px solid var(--primary)' : '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {a.is_pinned && (
                  <span className="pill pill-primary" style={{ fontSize: '11px' }}>
                    <Pin size={11} /> PINNED NOTICE
                  </span>
                )}
                <span className="pill pill-emerald" style={{ fontSize: '11px' }}>
                  Audience: {a.target_role}
                </span>
                {a.send_whatsapp && (
                  <span style={{ fontSize: '12px', color: '#047857', fontWeight: 600 }}>
                    ● WhatsApp Sent
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {a.created_at ? new Date(a.created_at).toLocaleDateString() : 'Recent'}
                </span>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handleOpenEdit(a)}
                      className="btn-secondary"
                      style={{ padding: '4px 6px', color: 'var(--primary)' }}
                      title="Edit Announcement"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(a.id, a.title)}
                      className="btn-secondary"
                      style={{ padding: '4px 6px', color: '#ef4444' }}
                      title="Delete Announcement"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
              {a.title}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {a.content}
            </p>

            {/* Action Bar with Feature 9 WhatsApp Broadcast */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Audience: <strong>{a.target_role || 'ALL'}</strong>
                </span>
                {a.broadcast_sent_count > 0 && (
                  <span style={{ fontSize: '11px', color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                    Dispatched to {a.broadcast_sent_count} parents
                  </span>
                )}
              </div>
              {isAdmin && (
                <button
                  onClick={() => handleOpenBroadcast(a)}
                  className="btn-secondary"
                  style={{
                    padding: '6px 14px',
                    color: '#047857',
                    borderColor: '#a7f3d0',
                    background: '#ecfdf5',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                  title="Broadcast announcement directly to parent WhatsApp phones"
                >
                  <MessageSquare size={14} color="#047857" /> Broadcast via WhatsApp
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          FEATURE 9: BULK WHATSAPP BROADCAST MODAL
      ══════════════════════════════════════════ */}
      {broadcastingAnn && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 37, 64, 0.55)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}>
          <div className="tech-card" style={{
            maxWidth: '560px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            border: '1.5px solid #a7f3d0'
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
              padding: '20px 24px',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={20} color="#a7f3d0" />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                    WhatsApp Broadcast Dispatcher
                  </h3>
                  <p style={{ fontSize: '12px', margin: '2px 0 0', color: '#a7f3d0' }}>
                    Meta WhatsApp Cloud API Integration
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBroadcastingAnn(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ffffff' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {/* Announcement Preview */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px', marginBottom: '18px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Announcement Preview
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                  {broadcastingAnn.title}
                </div>
                <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, maxHeight: '100px', overflowY: 'auto', whiteSpace: 'pre-line' }}>
                  {broadcastingAnn.content}
                </div>
              </div>

              {/* Target Segment Picker */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Target Recipient Group
                </label>
                <select
                  value={broadcastTarget}
                  onChange={(e) => setBroadcastTarget(e.target.value)}
                  className="form-input"
                  style={{ height: '40px' }}
                >
                  <option value="ALL">All Enrolled Students' Guardians</option>
                  <option value="GRADE_10">Grade 10 Guardians Only</option>
                  <option value="GRADE_9">Grade 9 Guardians Only</option>
                  <option value="GRADE_8">Grade 8 Guardians Only</option>
                  <option value="GRADE_7">Grade 7 Guardians Only</option>
                  <option value="GRADE_6">Grade 6 Guardians Only</option>
                </select>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '6px 0 0' }}>
                  Recipients will be automatically deduplicated across siblings and primary contact numbers.
                </p>
              </div>

              {/* Broadcast Result Banner */}
              {broadcastResult && (
                <div style={{
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <CheckCircle2 size={20} color="#059669" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#065f46' }}>
                      Broadcast Sent Successfully!
                    </div>
                    <div style={{ fontSize: '12px', color: '#047857' }}>
                      Dispatched to {broadcastResult.recipients_count || 0} guardian phone numbers via WhatsApp Cloud API.
                    </div>
                  </div>
                </div>
              )}

              {/* Info Note */}
              <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '12px',
                color: '#1e40af',
                lineHeight: 1.4
              }}>
                ℹ️ WhatsApp template messages will be dispatched immediately. Real-time delivery receipts will update in the communication audit log.
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{
              padding: '16px 24px',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                type="button"
                onClick={() => setBroadcastingAnn(null)}
                className="btn-secondary"
              >
                Close
              </button>
              <button
                type="button"
                disabled={broadcasting}
                onClick={handleExecuteBroadcast}
                className="btn-primary"
                style={{
                  background: '#047857',
                  borderColor: '#047857',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {broadcasting ? (
                  <>
                    <div className="spinner" style={{ width: '14px', height: '14px' }} />
                    Dispatching to WhatsApp...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Confirm & Send WhatsApp Broadcast
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
