import React, { useState, useEffect } from 'react';
import { api, API_BASE } from '../../api';
import {
  Image, X, ChevronLeft, ChevronRight, Download, Calendar, Layers
} from 'lucide-react';

export default function GalleryView({ user, studentId }) {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lightbox state
  const [activeAlbum, setActiveAlbum] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    if (studentId) loadAlbums();
  }, [studentId]);

  const loadAlbums = async () => {
    setLoading(true);
    try {
      const data = await api.getAlbums(studentId);
      setAlbums(data || []);
    } catch (err) {
      console.error('Failed to load gallery', err);
    } finally {
      setLoading(false);
    }
  };

  const openAlbumLightbox = async (albumId) => {
    try {
      const detail = await api.getAlbumDetail(albumId);
      setActiveAlbum(detail);
      if (detail.photos.length > 0) setLightboxIndex(0);
    } catch (err) {
      console.error('Failed to open album', err);
    }
  };

  const handleNext = () => {
    if (activeAlbum && lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % activeAlbum.photos.length);
    }
  };

  const handlePrev = () => {
    if (activeAlbum && lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + activeAlbum.photos.length) % activeAlbum.photos.length);
    }
  };

  if (loading) {
    return <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Loading photo albums...</div>;
  }

  if (albums.length === 0) {
    return (
      <div className="tech-card" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
        <Image size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
        <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: 'var(--text-primary)' }}>No Photo Albums</h4>
        <p style={{ margin: 0, fontSize: '13px' }}>The school has not published event photos for your child's class yet.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Campus Life & Event Highlights</h3>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
          High-resolution photo albums from annual functions, sports meets, exhibitions, and award ceremonies.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {albums.map((alb) => (
          <div
            key={alb.id}
            className="tech-card"
            style={{
              padding: 0,
              overflow: 'hidden',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s',
            }}
            onClick={() => openAlbumLightbox(alb.id)}
          >
            <div style={{ height: '180px', position: 'relative', overflow: 'hidden', background: '#f1f5f9' }}>
              {alb.cover_photo_url ? (
                <img
                  src={alb.cover_photo_url.startsWith('http') ? alb.cover_photo_url : `${API_BASE || 'http://localhost:8000'}${alb.cover_photo_url}`}
                  alt={alb.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                  <Image size={40} />
                </div>
              )}
              <span style={{
                position: 'absolute', bottom: '8px', right: '8px',
                background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '11px',
                fontWeight: 800, padding: '3px 8px', borderRadius: '6px'
              }}>
                {alb.photo_count} Photos
              </span>
            </div>

            <div style={{ padding: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {alb.title}
              </h4>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                {new Date(alb.event_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })} • Class {alb.target_grade}
              </div>
              {alb.description && (
                <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#475569', lineHeight: 1.4 }}>
                  {alb.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── FULL-SCREEN PHOTO LIGHTBOX ── */}
      {activeAlbum && lightboxIndex !== null && activeAlbum.photos[lightboxIndex] && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
          display: 'flex', flexDirection: 'column', zIndex: 2000, color: '#fff'
        }}>
          {/* Lightbox Top Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 24px', background: 'rgba(0,0,0,0.5)'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>{activeAlbum.title}</h3>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                Photo {lightboxIndex + 1} of {activeAlbum.photos.length}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <a
                href={activeAlbum.photos[lightboxIndex].image_url.startsWith('http') ? activeAlbum.photos[lightboxIndex].image_url : `${API_BASE || 'http://localhost:8000'}${activeAlbum.photos[lightboxIndex].image_url}`}
                target="_blank"
                download
                rel="noopener noreferrer"
                style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', textDecoration: 'none' }}
              >
                <Download size={16} /> Save Full Res
              </a>
              <button
                onClick={() => { setActiveAlbum(null); setLightboxIndex(null); }}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Main Photo Viewer */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', position: 'relative' }}>
            <button
              onClick={handlePrev}
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
                borderRadius: '50%', width: '48px', height: '48px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10
              }}
            >
              <ChevronLeft size={28} />
            </button>

            <div style={{ maxWidth: '85vw', maxHeight: '75vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img
                src={activeAlbum.photos[lightboxIndex].image_url.startsWith('http') ? activeAlbum.photos[lightboxIndex].image_url : `${API_BASE || 'http://localhost:8000'}${activeAlbum.photos[lightboxIndex].image_url}`}
                alt={activeAlbum.photos[lightboxIndex].caption || 'Photo'}
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px' }}
              />
              {activeAlbum.photos[lightboxIndex].caption && (
                <div style={{ marginTop: '12px', fontSize: '14px', background: 'rgba(0,0,0,0.6)', padding: '6px 14px', borderRadius: '6px' }}>
                  {activeAlbum.photos[lightboxIndex].caption}
                </div>
              )}
            </div>

            <button
              onClick={handleNext}
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
                borderRadius: '50%', width: '48px', height: '48px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10
              }}
            >
              <ChevronRight size={28} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
