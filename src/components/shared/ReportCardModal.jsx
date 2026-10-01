import React from 'react';
import { X, Printer, Download, Share2, ExternalLink } from 'lucide-react';
import { api, API_BASE } from '../../api';

export default function ReportCardModal({ studentId, studentName, examId, onClose }) {
  const effectiveExamId = examId || 'latest';
  // Backend renders the printable HTML report card directly
  const htmlUrl = `${API_BASE}/report-cards/student/${studentId}/exam/${effectiveExamId}/html`;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(10, 37, 64, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px',
    }}>
      <div className="tech-card" style={{
        width: '95%',
        maxWidth: '900px',
        height: '92vh',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }}>
        {/* Modal Top Bar */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#ffffff',
        }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Official Academic Report Card
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Student: <strong>{studentName}</strong> • Term 2 Pre-Board Examination
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <a
              href={htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '6px 12px', gap: '6px' }}
            >
              <ExternalLink size={14} /> Full Screen
            </a>
            <button
              onClick={() => {
                const iframe = document.getElementById('report-frame');
                if (iframe) iframe.contentWindow.print();
              }}
              className="btn-primary"
              style={{ fontSize: '12px', padding: '6px 14px', gap: '6px' }}
            >
              <Printer size={14} /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '6px', borderRadius: '8px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Embedded Report Frame */}
        <div style={{ flex: 1, background: '#f8fafc', position: 'relative' }}>
          <iframe
            id="report-frame"
            src={htmlUrl}
            title="Student Report Card"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: '#ffffff',
            }}
          />
        </div>
      </div>
    </div>
  );
}
