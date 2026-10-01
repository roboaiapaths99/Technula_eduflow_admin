import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import {
  Activity, Plus, Trash2, CheckCircle2, AlertCircle, Sparkles,
  Calendar, Image as ImageIcon, X, Upload
} from 'lucide-react';

export default function TeacherActivities({ user, grade, section }) {
  const [activities, setActivities] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    event_date: new Date().toISOString().split('T')[0],
    target_grade: grade || 'All',
    category: 'cultural',
    cover_image_url: '',
    linked_album_id: '',
  });

  useEffect(() => {
    setForm(prev => ({ ...prev, target_grade: grade || 'All' }));
    loadData();
  }, [grade]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [acts, albs] = await Promise.all([
        api.getActivityFeed(null, 'all'),
        api.getAlbums().catch(() => []),
      ]);
      setActivities(acts || []);
      setAlbums(albs || []);
    } catch (err) {
      setError(err.message || 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const res = await api.uploadFile(file);
      setForm(prev => ({ ...prev, cover_image_url: res.file_url }));
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      alert('Title and description are required');
      return;
    }
    setSaving(true);
    try {
      await api.createActivity({
        ...form,
        target_grade: form.target_grade || grade,
        linked_album_id: form.linked_album_id || undefined,
      });
      setMessage(`Activity "${form.title}" published to school timeline and parents!`);
      setShowModal(false);
      setForm({
        title: '',
        description: '',
        event_date: new Date().toISOString().split('T')[0],
        target_grade: grade || '10',
        category: 'cultural',
        cover_image_url: '',
        linked_album_id: '',
      });
      loadData();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to publish activity');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Remove activity "${title}"?`)) return;
    try {
      await api.deleteActivity(id);
      setMessage('Activity removed.');
      loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to remove');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div className="tech-card" style={{
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Class Activities & Events Timeline
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Share classroom milestones, student workshops, competitions, and celebration highlights.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={16} /> Post New Activity
        </button>
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

      {/* Feed List */}
      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Loading activities feed...</div>
      ) : activities.length === 0 ? (
        <div className="tech-card" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
          <Activity size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
          <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: 'var(--text-primary)' }}>No Activities Posted Yet</h4>
          <p style={{ margin: 0, fontSize: '13px' }}>Click "Post New Activity" to share student achievements and classroom events.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {activities.map((act) => (
            <div key={act.id} className="tech-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                {act.cover_image_url && (
                  <div style={{ height: '160px', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px', background: '#f1f5f9' }}>
                    <img src={act.cover_image_url} alt={act.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span className="pill pill-primary" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                    {act.category}
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                    Class {act.target_grade} • {act.event_date}
                  </span>
                </div>

                <h4 style={{ margin: '6px 0', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {act.title}
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {act.description}
                </p>
                {act.album_title && (
                  <div style={{ marginTop: '10px', fontSize: '11.5px', color: 'var(--primary)', fontWeight: 700 }}>
                    📸 Linked to Album: {act.album_title}
                  </div>
                )}
              </div>

              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => handleDelete(act.id, act.title)}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── POST ACTIVITY MODAL ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '520px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Post Classroom Activity</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Activity Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Exhibition & Model Presentation"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Event Date *</label>
                  <input
                    type="date"
                    required
                    value={form.event_date}
                    onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', marginTop: '4px' }}
                  >
                    <option value="cultural">Cultural</option>
                    <option value="sports">Sports</option>
                    <option value="workshop">Workshop</option>
                    <option value="competition">Competition</option>
                    <option value="celebration">Celebration</option>
                    <option value="academic">Academic</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the activity, student achievements, and key highlights..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Event Photo</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ fontSize: '12px' }} />
                  {uploadingPhoto && <span style={{ fontSize: '12px', color: 'var(--primary)' }}>Uploading...</span>}
                  {form.cover_image_url && <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 700 }}>✓ Attached</span>}
                </div>
              </div>

              {albums.length > 0 && (
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Link Photo Album (Optional)</label>
                  <select
                    value={form.linked_album_id}
                    onChange={(e) => setForm({ ...form, linked_album_id: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', marginTop: '4px' }}
                  >
                    <option value="">No linked album</option>
                    {albums.map(a => (
                      <option key={a.id} value={a.id}>{a.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ fontSize: '13px' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary" style={{ fontSize: '13px' }}>
                  {saving ? 'Publishing...' : 'Publish Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
