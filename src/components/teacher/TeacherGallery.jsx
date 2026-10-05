import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import {
  Image as ImageIcon, Plus, Trash2, CheckCircle2, AlertCircle,
  Eye, ArrowLeft, Upload, X, Calendar
} from 'lucide-react';

export default function TeacherGallery({ user, grade, section }) {
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [albumForm, setAlbumForm] = useState({
    title: '',
    description: '',
    event_date: new Date().toISOString().split('T')[0],
    target_grade: grade || 'All',
    cover_photo_url: '',
    photos: []
  });

  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');

  useEffect(() => {
    loadAlbums();
  }, [grade]);

  const loadAlbums = async () => {
    setLoading(true);
    try {
      const data = await api.getAlbums();
      // Filter for teacher's grade
      const filtered = (data || []).filter(
        a => a.target_grade === 'ALL' || a.target_grade === grade
      );
      setAlbums(filtered);
    } catch (err) {
      setError(err.message || 'Failed to load albums');
    } finally {
      setLoading(false);
    }
  };

  const loadAlbumDetail = async (albumId) => {
    try {
      const data = await api.getAlbumDetail(albumId);
      setSelectedAlbum(data);
    } catch (err) {
      setError(err.message || 'Failed to load album photos');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.uploadFile(file);
      setAlbumForm(prev => ({
        ...prev,
        cover_photo_url: prev.cover_photo_url || res.file_url,
        photos: [...prev.photos, { image_url: res.file_url, caption: file.name }]
      }));
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    if (!albumForm.title.trim()) {
      alert('Album title is required');
      return;
    }
    setSaving(true);
    try {
      await api.createAlbum(albumForm);
      setMessage(`Album "${albumForm.title}" created successfully!`);
      setShowModal(false);
      setAlbumForm({
        title: '',
        description: '',
        event_date: new Date().toISOString().split('T')[0],
        target_grade: grade || '10',
        cover_photo_url: '',
        photos: []
      });
      loadAlbums();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to create album');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPhotoToAlbum = async (e) => {
    e.preventDefault();
    if (!selectedAlbum || !newPhotoUrl.trim()) return;
    setSaving(true);
    try {
      await api.addPhotosToAlbum(selectedAlbum.id, [{ image_url: newPhotoUrl.trim(), caption: newPhotoCaption.trim() }]);
      setMessage('Photo added to album.');
      setShowAddPhotoModal(false);
      setNewPhotoUrl('');
      setNewPhotoCaption('');
      loadAlbumDetail(selectedAlbum.id);
      loadAlbums();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to add photo');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAlbum = async (id, title) => {
    if (!window.confirm(`Delete album "${title}"?`)) return;
    try {
      await api.deleteAlbum(id);
      setMessage('Album deleted.');
      if (selectedAlbum?.id === id) setSelectedAlbum(null);
      loadAlbums();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!selectedAlbum) return;
    try {
      await api.deletePhotoFromAlbum?.(selectedAlbum.id, photoId) ||
        fetch(`${api.API_BASE || 'http://localhost:8000'}/gallery/albums/${selectedAlbum.id}/photos/${photoId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('technulaeduflow_token')}` }
        });
      loadAlbumDetail(selectedAlbum.id);
    } catch (err) {
      alert('Failed to delete photo');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Bar */}
      <div className="tech-card" style={{
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {selectedAlbum && (
            <button
              onClick={() => setSelectedAlbum(null)}
              className="btn-secondary"
              style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
            >
              <ArrowLeft size={14} /> Back to Albums
            </button>
          )}
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {selectedAlbum ? selectedAlbum.title : 'Class Photo Gallery & Event Albums'}
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              {selectedAlbum ? `${selectedAlbum.photos?.length || 0} photos in this collection` : `Photo showcases for Class ${grade}-${section} students.`}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {selectedAlbum ? (
            <button
              onClick={() => setShowAddPhotoModal(true)}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={16} /> Add Photo
            </button>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={16} /> Create Class Album
            </button>
          )}
        </div>
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

      {/* Album Detail Photo Viewer */}
      {selectedAlbum ? (
        <div>
          {selectedAlbum.photos?.length === 0 ? (
            <div className="tech-card" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              No photos uploaded to this album yet. Click "Add Photo" above.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
              {selectedAlbum.photos.map(p => (
                <div key={p.id} className="tech-card" style={{ padding: '10px', position: 'relative' }}>
                  <div style={{ height: '180px', borderRadius: '8px', overflow: 'hidden', background: '#f1f5f9' }}>
                    <img src={p.image_url} alt={p.caption || 'Album Photo'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  {p.caption && (
                    <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '6px', fontWeight: 600 }}>
                      {p.caption}
                    </div>
                  )}
                  <button
                    onClick={() => handleDeletePhoto(p.id)}
                    style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(239, 68, 68, 0.85)', border: 'none', borderRadius: '6px', color: '#fff', padding: '4px', cursor: 'pointer' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Albums Grid */
        <div>
          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Loading photo albums...</div>
          ) : albums.length === 0 ? (
            <div className="tech-card" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              <ImageIcon size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
              <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: 'var(--text-primary)' }}>No Class Photo Albums Created</h4>
              <p style={{ margin: 0, fontSize: '13px' }}>Create an album to share Annual Day, sports, science fair, or assembly photos with parents.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {albums.map((album) => (
                <div key={album.id} className="tech-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div
                      onClick={() => loadAlbumDetail(album.id)}
                      style={{ height: '160px', borderRadius: '8px', overflow: 'hidden', background: '#f1f5f9', cursor: 'pointer', position: 'relative' }}
                    >
                      {album.cover_photo_url ? (
                        <img src={album.cover_photo_url} alt={album.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                          <ImageIcon size={36} />
                        </div>
                      )}
                      <span style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                        {album.photo_count} photos
                      </span>
                    </div>

                    <h4
                      onClick={() => loadAlbumDetail(album.id)}
                      style={{ margin: '12px 0 4px 0', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', cursor: 'pointer' }}
                    >
                      {album.title}
                    </h4>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {album.event_date} • Class {album.target_grade}
                    </div>
                  </div>

                  <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      onClick={() => loadAlbumDetail(album.id)}
                      className="btn-secondary"
                      style={{ fontSize: '11.5px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Eye size={13} /> Open Album
                    </button>
                    <button
                      onClick={() => handleDeleteAlbum(album.id, album.title)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CREATE ALBUM MODAL ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '520px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Create Photo Album</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateAlbum} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Album Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Sports Day 2026"
                  value={albumForm.title}
                  onChange={(e) => setAlbumForm({ ...albumForm, title: e.target.value })}
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
                    value={albumForm.event_date}
                    onChange={(e) => setAlbumForm({ ...albumForm, event_date: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Class Scope</label>
                  <select
                    value={albumForm.target_grade}
                    onChange={(e) => setAlbumForm({ ...albumForm, target_grade: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', marginTop: '4px' }}
                  >
                    <option value="ALL">Whole School (All Classes)</option>
                    {['6', '7', '8', '9', '10', '11', '12'].map(g => (
                      <option key={g} value={g}>Class {g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Upload Initial Photos</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ fontSize: '12px' }} />
                  {uploading && <span style={{ fontSize: '12px', color: 'var(--primary)' }}>Uploading...</span>}
                  {albumForm.photos.length > 0 && (
                    <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 700 }}>
                      ✓ {albumForm.photos.length} photo(s) selected
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ fontSize: '13px' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary" style={{ fontSize: '13px' }}>
                  {saving ? 'Creating...' : 'Create Album'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD PHOTO MODAL ── */}
      {showAddPhotoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '460px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Add Photo to Album</h3>
              <button onClick={() => setShowAddPhotoModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleAddPhotoToAlbum} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Select Photo File</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(true);
                    try {
                      const res = await api.uploadFile(file);
                      setNewPhotoUrl(res.file_url);
                      if (!newPhotoCaption) setNewPhotoCaption(file.name);
                    } catch (err) {
                      alert('Upload failed: ' + err.message);
                    } finally {
                      setUploading(false);
                    }
                  }}
                  style={{ fontSize: '12px', marginTop: '4px' }}
                />
                {newPhotoUrl && <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 700, display: 'block', marginTop: '4px' }}>✓ File Uploaded</span>}
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Photo Caption</label>
                <input
                  type="text"
                  placeholder="e.g. Prize Distribution Ceremony"
                  value={newPhotoCaption}
                  onChange={(e) => setNewPhotoCaption(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddPhotoModal(false)} className="btn-secondary" style={{ fontSize: '13px' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving || !newPhotoUrl} className="btn-primary" style={{ fontSize: '13px' }}>
                  {saving ? 'Adding...' : 'Add Photo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
