import React, { useState, useEffect } from 'react';
import { api, API_BASE } from '../../api';
import {
  Calendar, FileText, Download, Clock, MapPin, CheckCircle2, AlertCircle
} from 'lucide-react';

export default function DatesheetViewer({ user, studentId }) {
  const [datesheets, setDatesheets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      loadDatesheet();
    }
  }, [studentId]);

  const loadDatesheet = async () => {
    setLoading(true);
    try {
      const data = await api.getParentDatesheet(studentId);
      setDatesheets(data || []);
    } catch (err) {
      console.error('Failed to load datesheet', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Loading examination datesheet...</div>;
  }

  if (datesheets.length === 0) {
    return (
      <div className="tech-card" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
        <Calendar size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
        <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: 'var(--text-primary)' }}>No Active Examination Datesheets</h4>
        <p style={{ margin: 0, fontSize: '13px' }}>The school has not published an exam schedule for your child's class yet.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {datesheets.map((ds) => (
        <div key={ds.id} className="tech-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '16px' }}>
            <div>
              <span className="pill pill-primary">Official Examination Schedule</span>
              <h3 style={{ margin: '8px 0 4px 0', fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {ds.title}
              </h3>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Class: <strong>{ds.grade}-{ds.section}</strong> • Academic Session: <strong>{ds.academic_year}</strong>
              </div>
            </div>

            {ds.pdf_url && (
              <a
                href={ds.pdf_url.startsWith('http') ? ds.pdf_url : `${API_BASE || 'http://localhost:8000'}${ds.pdf_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
              >
                <Download size={15} /> Download Official PDF
              </a>
            )}
          </div>

          {/* Schedule Table */}
          <div style={{ marginTop: '16px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 16px' }}>Subject</th>
                  <th style={{ padding: '12px 16px' }}>Code</th>
                  <th style={{ padding: '12px 16px' }}>Date</th>
                  <th style={{ padding: '12px 16px' }}>Timing</th>
                  <th style={{ padding: '12px 16px' }}>Venue</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {ds.entries.map((e) => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {e.subject_name}
                      {e.syllabus_remarks && (
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 400, marginTop: '2px' }}>
                          Note: {e.syllabus_remarks}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>
                      {e.subject_code || '-'}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#334155' }}>
                      {new Date(e.exam_date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>
                      {e.start_time} - {e.end_time}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>
                      {e.venue || 'Classroom'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {e.days_left === 0 ? (
                        <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, background: '#fee2e2', color: '#b91c1c' }}>
                          TODAY
                        </span>
                      ) : e.days_left > 0 ? (
                        <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, background: '#e0e7ff', color: '#4338ca' }}>
                          in {e.days_left} day{e.days_left > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: '#f1f5f9', color: '#94a3b8' }}>
                          Completed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
