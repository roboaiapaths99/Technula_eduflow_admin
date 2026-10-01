import React, { useState, useEffect } from 'react';
import { api, API_BASE } from '../../api';
import {
  Activity, Plus, Trash2, Calendar, Upload, CheckCircle2,
  AlertCircle, Tag, Image, X, Edit3
} from 'lucide-react';

export default function ActivityManager({ user }) {
  const [activities, setActivities] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    event_date: new Date().toISOString().split('T')[0],
    target_grade: 'ALL',
    category: 'cultural',
    cover_image_url: '',
    linked_album_id: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [feed, albumList] = await Promise.all([
        api.getActivityFeed(),
        api.getAlbums().catch(() => []),
      ]);
      setActivities(feed || []);
      setAlbums(albumList || []);
    } catch (err) {
      setError(err.message || 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingActivityId(null);
    setForm({
      title: '',
      description: '',
      event_date: new Date().toISOString().split('T')[0],
      target_grade: 'ALL',
      category: 'cultural',
      cover_image_url: '',
      linked_album_id: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (act) => {
    setEditingActivityId(act.id);
    setForm({
      title: act.title,
      description: act.description || '',
      event_date: act.event_date,
      target_grade: act.target_grade || 'ALL',
      category: act.category || 'cultural',
      cover_image_url: act.cover_image_url || '',
      linked_album_id: act.linked_album_id || '',
    });
    setShowModal(true);
  };

  const handleUploadCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const res = await api.uploadFile(file);
      setForm(prev => ({ ...prev, cover_image_url: res.url }));
      setMessage('Cover image uploaded.');
    } catch (err) {
      setError(err.message || 'Image upload failed');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        linked_album_id: form.linked_album_id || undefined,
      };
      if (editingActivityId) {
        await api.updateActivity(editingActivityId, payload);
        setMessage(`Activity "${form.title}" updated successfully.`);
      } else {
        await api.createActivity(payload);
        setMessage(`Activity "${form.title}" published to school feed.`);
      }
      setShowModal(false);
      setForm({
        title: '',
        description: '',
        event_date: new Date().toISOString().split('T')[0],
        target_grade: 'ALL',
        category: 'cultural',
        cover_image_url: '',
        linked_album_id: '',
      });
      setEditingActivityId(null);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save activity');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete activity "${title}" from timeline?`)) return;
    try {
      await api.deleteActivity(id);
      setMessage('Activity deleted.');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete activity');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Campus Activity & Events Timeline</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Publish visual timeline cards of school achievements, assemblies, sports events, and parent-teacher meets.
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> Post New Activity
        </button>
      </div>

      {message && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '12px 16px', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} /> {message}
        </div>
      )}

      {/* Activities Timeline Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {activities.length === 0 ? (
          <div className="tech-card" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', gridColumn: '1 / -1' }}>
            No activities posted yet. Click "Post New Activity" above!
          </div>
        ) : (
          activities.map((act) => (
            <div key={act.id} className="tech-card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {act.cover_image_url && (
                <div style={{ height: '140px', overflow: 'hidden' }}>
                  <img
                    src={act.cover_image_url.startsWith('http') ? act.cover_image_url : `${API_BASE || 'http://localhost:8000'}${act.cover_image_url}`}
                    alt={act.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}

              <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
                      background:
                        act.category === 'sports' ? '#fed7aa' :
                        act.category === 'cultural' ? '#e0e7ff' :
                        act.category === 'competition' ? '#fef3c7' : '#dcfce7',
                      color:
                        act.category === 'sports' ? '#c2410c' :
                        act.category === 'cultural' ? '#4338ca' :
                        act.category === 'competition' ? '#b45309' : '#15803d',
                    }}>
                      {act.category}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{act.event_date}</span>
                  </div>

                  <h4 style={{ margin: '10px 0 4px 0', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {act.title}
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                    {act.description}
                  </p>

                  {act.album_title && (
                    <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--primary, #635bff)', fontWeight: 700 }}>
                      📸 Linked Album: {act.album_title}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Class {act.target_grade}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleOpenEdit(act)}
                      title="Edit Activity"
                      style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '2px' }}
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(act.id, act.title)}
                      title="Delete Activity"
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── CREATE / EDIT ACTIVITY MODAL ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', maxWidth: '480px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                {editingActivityId ? 'Edit Campus Event' : 'Publish Campus Event'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Event / Activity Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Inter-House Debate Competition"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
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
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  >
                    <option value="sports">Sports</option>
                    <option value="cultural">Cultural</option>
                    <option value="workshop">Workshop</option>
                    <option value="competition">Competition</option>
                    <option value="celebration">Celebration</option>
                    <option value="ptm">Parent-Teacher Meet</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Details of the event, winners, student participation..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Link to Photo Gallery Album (Optional)</label>
                <select
                  value={form.linked_album_id}
                  onChange={(e) => setForm({ ...form, linked_album_id: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                >
                  <option value="">-- No linked album --</option>
                  {albums.map((alb) => (
                    <option key={alb.id} value={alb.id}>{alb.title} ({alb.event_date})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Cover Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadCover}
                  style={{ display: 'block', marginTop: '4px', fontSize: '13px' }}
                />
                {uploadingCover && <span style={{ fontSize: '11px', color: '#635bff' }}>Uploading...</span>}
                {form.cover_image_url && <span style={{ fontSize: '11px', color: '#16a34a' }}>✓ Image Attached</span>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving || uploadingCover} className="btn-primary">
                  {saving ? 'Saving...' : editingActivityId ? 'Save Changes' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
