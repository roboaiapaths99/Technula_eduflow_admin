import React, { useState, useEffect } from 'react';
import { api, API_BASE } from '../../api';
import {
  Image, Plus, Trash2, Upload, CheckCircle2, AlertCircle,
  Calendar, Layers, Eye, X, Edit3
} from 'lucide-react';

export default function GalleryManager({ user }) {
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAlbumId, setEditingAlbumId] = useState(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [savingAlbum, setSavingAlbum] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const [newAlbum, setNewAlbum] = useState({
    title: '',
    description: '',
    event_date: new Date().toISOString().split('T')[0],
    target_grade: 'ALL',
    cover_photo_url: '',
  });

  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    setLoading(true);
    try {
      const data = await api.getAlbums();
      setAlbums(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load albums');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAlbum = async (albumId) => {
    try {
      const detail = await api.getAlbumDetail(albumId);
      setSelectedAlbum(detail);
    } catch (err) {
      setError(err.message || 'Failed to load album photos');
    }
  };

  const handleOpenCreate = () => {
    setEditingAlbumId(null);
    setNewAlbum({
      title: '',
      description: '',
      event_date: new Date().toISOString().split('T')[0],
      target_grade: 'ALL',
      cover_photo_url: '',
    });
    setShowCreateModal(true);
  };

  const handleOpenEditAlbum = (e, a) => {
    e.stopPropagation();
    setEditingAlbumId(a.id);
    setNewAlbum({
      title: a.title,
      description: a.description || '',
      event_date: a.event_date,
      target_grade: a.target_grade || 'ALL',
      cover_photo_url: a.cover_photo_url || '',
    });
    setShowCreateModal(true);
  };

  const handleSaveAlbum = async (e) => {
    e.preventDefault();
    setSavingAlbum(true);
    try {
      if (editingAlbumId) {
        await api.updateAlbum(editingAlbumId, newAlbum);
        setMessage(`Album "${newAlbum.title}" updated.`);
      } else {
        await api.createAlbum(newAlbum);
        setMessage(`Album "${newAlbum.title}" created.`);
      }
      setShowCreateModal(false);
      setEditingAlbumId(null);
      setNewAlbum({
        title: '',
        description: '',
        event_date: new Date().toISOString().split('T')[0],
        target_grade: 'ALL',
        cover_photo_url: '',
      });
      loadAlbums();
    } catch (err) {
      setError(err.message || 'Failed to save album');
    } finally {
      setSavingAlbum(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!selectedAlbum) return;
    if (!window.confirm('Delete this photo from the album?')) return;
    try {
      await api.deletePhotoFromAlbum(selectedAlbum.id, photoId);
      setMessage('Photo deleted.');
      handleOpenAlbum(selectedAlbum.id);
      loadAlbums();
    } catch (err) {
      setError(err.message || 'Failed to delete photo');
    }
  };

  const handleUploadPhotos = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !selectedAlbum) return;
    setUploadingPhotos(true);
    setError(null);
    try {
      const uploaded = [];
      for (const f of files) {
        const res = await api.uploadFile(f);
        uploaded.push({ image_url: res.url, caption: f.name.replace(/\.[^/.]+$/, "") });
      }
      await api.addPhotosToAlbum(selectedAlbum.id, uploaded);
      setMessage(`${uploaded.length} photo(s) added to album.`);
      handleOpenAlbum(selectedAlbum.id);
      loadAlbums();
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleDeleteAlbum = async (id, title) => {
    if (!window.confirm(`Delete entire album "${title}" and all its photos?`)) return;
    try {
      await api.deleteAlbum(id);
      setMessage('Album deleted.');
      if (selectedAlbum?.id === id) setSelectedAlbum(null);
      loadAlbums();
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Photo Gallery & Event Showcases</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Curate photo albums of annual sports day, science fairs, celebrations, and excursions.
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> Create Album
        </button>
      </div>

      {message && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '12px 16px', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} /> {message}
        </div>
      )}

      {/* Main Albums Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {albums.length === 0 ? (
          <div className="tech-card" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', gridColumn: '1 / -1' }}>
            No albums in gallery yet. Click "Create Album" to start!
          </div>
        ) : (
          albums.map((a) => (
            <div
              key={a.id}
              className="tech-card"
              style={{
                padding: '0',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                border: selectedAlbum?.id === a.id ? '2px solid var(--primary, #635bff)' : '1px solid #e2e8f0',
              }}
              onClick={() => handleOpenAlbum(a.id)}
            >
              <div style={{ height: '160px', background: '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
                {a.cover_photo_url ? (
                  <img
                    src={a.cover_photo_url.startsWith('http') ? a.cover_photo_url : `${API_BASE || 'http://localhost:8000'}${a.cover_photo_url}`}
                    alt={a.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                    <Image size={36} />
                  </div>
                )}
                <span style={{
                  position: 'absolute', bottom: '8px', right: '8px',
                  background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: '11px',
                  fontWeight: 800, padding: '3px 8px', borderRadius: '6px'
                }}>
                  {a.photo_count} Photos
                </span>
              </div>

              <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>{a.title}</h4>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    {a.event_date} • Class {a.target_grade}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--primary, #635bff)', fontWeight: 700 }}>
                    Manage Photos →
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={(e) => handleOpenEditAlbum(e, a)}
                      title="Edit Album"
                      style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '2px' }}
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteAlbum(a.id, a.title); }}
                      title="Delete Album"
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

      {/* Selected Album Photo Drawer / View */}
      {selectedAlbum && (
        <div className="tech-card" style={{ padding: '24px', background: '#f8fafc', border: '2px solid var(--primary, #635bff)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <span className="pill pill-primary">Active Album Manager</span>
              <h3 style={{ margin: '6px 0 2px 0', fontSize: '20px', fontWeight: 800 }}>
                {selectedAlbum.title} ({selectedAlbum.photos.length} Photos)
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{selectedAlbum.description || 'No description provided.'}</p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <label style={{
                background: '#10b981', color: '#fff', padding: '8px 16px', borderRadius: '8px',
                fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                <Upload size={14} /> {uploadingPhotos ? 'Uploading...' : 'Add More Photos'}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleUploadPhotos}
                  disabled={uploadingPhotos}
                  style={{ display: 'none' }}
                />
              </label>

              <button
                onClick={() => setSelectedAlbum(null)}
                style={{ background: '#e2e8f0', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Photo Thumbnail Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
            {selectedAlbum.photos.map((p) => (
              <div key={p.id} style={{ position: 'relative', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                <img
                  src={p.image_url.startsWith('http') ? p.image_url : `${API_BASE || 'http://localhost:8000'}${p.image_url}`}
                  alt={p.caption || 'Photo'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(p.id)}
                  title="Delete Photo"
                  style={{
                    position: 'absolute', top: '5px', right: '5px',
                    background: 'rgba(239, 68, 68, 0.85)', color: '#fff',
                    border: 'none', borderRadius: '4px', padding: '3px 5px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center'
                  }}
                >
                  <Trash2 size={12} />
                </button>
                {p.caption && (
                  <span style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '10px',
                    padding: '2px 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {p.caption}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT ALBUM MODAL ── */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', maxWidth: '480px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                {editingAlbumId ? 'Edit Photo Album' : 'Create New Photo Album'}
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveAlbum} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Album Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Annual Sports Meet 2026"
                  value={newAlbum.title}
                  onChange={(e) => setNewAlbum({ ...newAlbum, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Event Date *</label>
                  <input
                    type="date"
                    required
                    value={newAlbum.event_date}
                    onChange={(e) => setNewAlbum({ ...newAlbum, event_date: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Target Class Scope</label>
                  <input
                    type="text"
                    placeholder="ALL or specific grade"
                    value={newAlbum.target_grade}
                    onChange={(e) => setNewAlbum({ ...newAlbum, target_grade: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of the celebration or event..."
                  value={newAlbum.description}
                  onChange={(e) => setNewAlbum({ ...newAlbum, description: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={savingAlbum} className="btn-primary">
                  {savingAlbum ? 'Saving...' : editingAlbumId ? 'Save Changes' : 'Create Album'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
