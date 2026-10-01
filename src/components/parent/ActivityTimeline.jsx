import React, { useState, useEffect } from 'react';
import { api, API_BASE } from '../../api';
import {
  Activity, Calendar, Tag, Image, ArrowRight
} from 'lucide-react';

export default function ActivityTimeline({ user, studentId, onOpenAlbum }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) loadActivities();
  }, [studentId]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await api.getActivityFeed(studentId);
      setActivities(data || []);
    } catch (err) {
      console.error('Failed to load activity feed', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Loading campus activity feed...</div>;
  }

  if (activities.length === 0) {
    return (
      <div className="tech-card" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
        <Activity size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
        <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: 'var(--text-primary)' }}>No Campus Events Recorded</h4>
        <p style={{ margin: 0, fontSize: '13px' }}>Activities and assemblies will appear here as they are published.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Campus Events & Activities Timeline</h3>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Stay connected with classroom workshops, academic competitions, and sports meets.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
        {activities.map((act) => (
          <div key={act.id} className="tech-card" style={{ padding: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {act.cover_image_url && (
              <div style={{ width: '160px', height: '120px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                <img
                  src={act.cover_image_url.startsWith('http') ? act.cover_image_url : `${API_BASE || 'http://localhost:8000'}${act.cover_image_url}`}
                  alt={act.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}

            <div style={{ flex: 1, minWidth: '240px' }}>
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
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  {new Date(act.event_date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>

              <h4 style={{ margin: '10px 0 6px 0', fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {act.title}
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                {act.description}
              </p>

              {act.linked_album_id && (
                <div style={{ marginTop: '12px' }}>
                  <button
                    onClick={() => onOpenAlbum && onOpenAlbum(act.linked_album_id)}
                    style={{
                      background: 'var(--primary-light, #e0e7ff)',
                      color: 'var(--primary, #635bff)',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Image size={14} /> View Event Photo Album ({act.album_title})
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
