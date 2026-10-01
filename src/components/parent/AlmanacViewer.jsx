import React, { useState, useEffect } from 'react';
import { api, API_BASE } from '../../api';
import {
  BookOpen, FileText, Download, Filter, Search, Calendar
} from 'lucide-react';

export default function AlmanacViewer({ user, studentId }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    if (studentId) loadDocs();
  }, [studentId, categoryFilter]);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const data = await api.getParentAlmanac(studentId, categoryFilter !== 'ALL' ? categoryFilter : undefined);
      setDocs(data || []);
    } catch (err) {
      console.error('Failed to load almanac documents', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>School Almanac & Official Documents</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Access verified school handbooks, syllabus guidelines, and official circulars for this academic term.
          </p>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All Documents' },
            { id: 'rules', label: 'Rules & Code' },
            { id: 'syllabus', label: 'Curriculum & Syllabus' },
            { id: 'holiday_list', label: 'Holidays' },
            { id: 'general', label: 'Circulars' },
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                background: categoryFilter === c.id ? 'var(--primary, #635bff)' : '#fff',
                color: categoryFilter === c.id ? '#fff' : '#475569',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Loading documents...</div>
      ) : docs.length === 0 ? (
        <div className="tech-card" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
          <BookOpen size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
          <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: 'var(--text-primary)' }}>No Documents in this Category</h4>
          <p style={{ margin: 0, fontSize: '13px' }}>There are currently no active almanac documents matching the filter.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {docs.map((doc) => (
            <div key={doc.id} className="tech-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="pill" style={{ background: '#e0e7ff', color: '#4338ca', fontSize: '11px', textTransform: 'capitalize' }}>
                    {doc.category.replace('_', ' ')}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>v{doc.version}</span>
                </div>

                <h4 style={{ margin: '12px 0 6px 0', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {doc.title}
                </h4>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Academic Session: <strong>{doc.academic_year}</strong>
                </div>

                <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '10px', background: '#f0fdf4', padding: '6px 10px', borderRadius: '6px', fontWeight: 600 }}>
                  ✓ Active & Valid until {doc.valid_to}
                </div>
              </div>

              <div style={{ marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                <a
                  href={doc.file_url.startsWith('http') ? doc.file_url : `${API_BASE || 'http://localhost:8000'}${doc.file_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                >
                  <Download size={15} /> Download Document
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
