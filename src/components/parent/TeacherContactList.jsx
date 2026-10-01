import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import {
  Users, Mail, Phone, MessageSquare, Award, BookOpen
} from 'lucide-react';

export default function TeacherContactList({ user, studentId, studentInfo, onOpenChat }) {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) loadTeachers();
  }, [studentId]);

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const data = await api.getScopedClassTeachers(studentId);
      setTeachers(data || []);
    } catch (err) {
      console.error('Failed to load class teachers', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Loading faculty directory...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Class & Subject Teachers</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Verified educators directly assigned to Class {studentInfo?.grade}-{studentInfo?.section}.
          </p>
        </div>

        <span className="pill pill-primary">
          Class {studentInfo?.grade || '-'}-{studentInfo?.section || '-'} Faculty
        </span>
      </div>

      {teachers.length === 0 ? (
        <div className="tech-card" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
          <Users size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
          <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: 'var(--text-primary)' }}>No Faculty Assigned Yet</h4>
          <p style={{ margin: 0, fontSize: '13px' }}>The administration has not finalized class lead assignments for this section.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {teachers.map((t) => (
            <div key={t.teacher_id} className="tech-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="pill" style={{
                    background: t.role_type === 'Class Teacher' ? '#dcfce7' : '#e0e7ff',
                    color: t.role_type === 'Class Teacher' ? '#15803d' : '#4338ca',
                    fontWeight: 700,
                    fontSize: '11px'
                  }}>
                    {t.role_type}
                  </span>
                  <BookOpen size={16} color="var(--primary, #635bff)" />
                </div>

                <h4 style={{ margin: '12px 0 2px 0', fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {t.name}
                </h4>
                <div style={{ fontSize: '13px', color: 'var(--primary, #635bff)', fontWeight: 600 }}>
                  {t.subject}
                </div>

                <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#475569' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={13} color="#94a3b8" /> {t.email}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={13} color="#94a3b8" /> {t.phone}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                <button
                  onClick={() => onOpenChat && onOpenChat(t.teacher_id)}
                  className="btn-primary"
                  style={{ width: '100%', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <MessageSquare size={14} /> Send Direct Message
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
