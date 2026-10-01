import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import {
  FileText, Upload, ShieldCheck, AlertTriangle, Eye,
  CheckCircle2, Search, Lock, RefreshCw, X
} from 'lucide-react';

export default function ExamSheetManager({ user }) {
  const schoolId = user?.school_id;
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [subjectName, setSubjectName] = useState('Mathematics');
  const [examName, setExamName] = useState('Pre-Board Examination');
  const [marksAwarded, setMarksAwarded] = useState('91');
  const [maxMarks, setMaxMarks] = useState('100');
  const [teacherNotes, setTeacherNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Mismatch warning state
  const [mismatchWarning, setMismatchWarning] = useState(null);

  // Archived sheets list
  const [sheets, setSheets] = useState([]);
  const [loadingSheets, setLoadingSheets] = useState(false);

  // Preview decrypted sheet modal
  const [previewSheet, setPreviewSheet] = useState(null);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const res = await api.adminListStudents().catch(() => api.getStudents().catch(() => []));
        const list = Array.isArray(res) ? res : (res?.items || []);
        setStudents(list);
        if (list && list.length > 0) {
          setSelectedStudentId(list[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadStudents();
  }, [schoolId]);

  const loadStudentSheets = async (stId) => {
    if (!stId) return;
    setLoadingSheets(true);
    try {
      const res = await api.getStudentExamSheets(stId);
      setSheets(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSheets(false);
    }
  };

  useEffect(() => {
    if (selectedStudentId) {
      loadStudentSheets(selectedStudentId);
    }
  }, [selectedStudentId]);

  const handleUpload = async (forceOverride = false) => {
    if (!selectedFile || !selectedStudentId) {
      alert('Please select both a student and an exam paper file.');
      return;
    }

    setUploading(true);
    setMismatchWarning(null);

    const formData = new FormData();
    formData.append('school_id', schoolId);
    formData.append('student_id', selectedStudentId);
    formData.append('subject_name', subjectName);
    formData.append('exam_name', examName);
    formData.append('marks_awarded', marksAwarded || '0');
    formData.append('max_marks', maxMarks || '100');
    formData.append('teacher_notes', teacherNotes);
    formData.append('force_override_mismatch', forceOverride ? 'true' : 'false');
    formData.append('file', selectedFile);

    try {
      const res = await api.uploadExamSheet(formData);

      if (res.status === 'MISMATCH_WARNING') {
        // Teacher mistake prevention blocker
        setMismatchWarning(res);
        return;
      }

      alert('✓ Answer sheet securely uploaded and archived!');
      setSelectedFile(null);
      setTeacherNotes('');
      loadStudentSheets(selectedStudentId);
    } catch (e) {
      alert(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="pill pill-indigo">Cryptographic Document Guard</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>AES-256 & OCR Mismatch Protection</span>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 900, marginTop: '6px', color: 'var(--text-primary)' }}>
            Student Exam Sheet Archive & Scanner
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '8px 14px', borderRadius: '8px' }}>
          <Lock size={16} color="var(--accent-emerald)" />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#065F46' }}>
            Encrypted At Rest on Server
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
        {/* Upload Form */}
        <div className="tech-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)' }}>
            Upload & Encrypt Answer Sheet
          </h3>

          {/* Student Selector */}
          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            Select Student *
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="tech-input"
            style={{ width: '100%', marginBottom: '14px' }}
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.admission_no || `Roll ${s.roll_no}`}) — Class {s.grade}-{s.section}
              </option>
            ))}
          </select>

          {/* Exam & Subject */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Subject *
              </label>
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                className="tech-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Examination *
              </label>
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                className="tech-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Marks Awarded */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Marks Awarded
              </label>
              <input
                type="number"
                value={marksAwarded}
                onChange={(e) => setMarksAwarded(e.target.value)}
                className="tech-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Max Marks
              </label>
              <input
                type="number"
                value={maxMarks}
                onChange={(e) => setMaxMarks(e.target.value)}
                className="tech-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Teacher Notes */}
          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            Teacher Feedback on Answer Sheet
          </label>
          <input
            type="text"
            value={teacherNotes}
            onChange={(e) => setTeacherNotes(e.target.value)}
            placeholder="e.g. Excellent presentation in Q3-Q5; practice step-marking in calculus..."
            className="tech-input"
            style={{ width: '100%', marginBottom: '16px' }}
          />

          {/* File Picker */}
          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            Scanned Paper File (JPG, PNG, PDF) *
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            style={{ marginBottom: '16px', fontSize: '13px' }}
          />

          <button
            onClick={() => handleUpload(false)}
            disabled={uploading || !selectedFile}
            className="btn-primary"
            style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {uploading ? (
              'Scanning OCR & Encrypting...'
            ) : (
              <>
                <ShieldCheck size={18} /> Encrypt & Archive Answer Sheet →
              </>
            )}
          </button>
        </div>

        {/* Archived Sheets for Selected Student */}
        <div className="tech-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Verified Papers for {selectedStudent?.name || 'Selected Student'}
            </h3>
            <button onClick={() => loadStudentSheets(selectedStudentId)} className="btn-secondary" style={{ padding: '6px 10px' }}>
              <RefreshCw size={14} />
            </button>
          </div>

          {loadingSheets ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Loading archived exam papers...
            </div>
          ) : sheets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
              <FileText size={36} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                No Exam Sheets Uploaded Yet
              </p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>
                Upload an answer sheet on the left to securely archive it.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '550px', overflowY: 'auto' }}>
              {sheets.map((sheet) => (
                <div
                  key={sheet.id}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: '#ffffff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>
                        {sheet.subject_name}
                      </span>
                      <span className="pill pill-emerald" style={{ fontSize: '10px' }}>
                        🔒 {sheet.encryption_algorithm}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {sheet.exam_name} • Marks: <strong>{sheet.marks_awarded}/{sheet.max_marks}</strong>
                    </div>

                    {sheet.detected_admission_no && (
                      <div style={{ fontSize: '11px', color: 'var(--accent-emerald)', marginTop: '2px', fontWeight: 700 }}>
                        ✓ OCR Verified Match: {sheet.detected_admission_no}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setPreviewSheet(sheet)}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
                  >
                    <Eye size={14} /> Decrypt & View
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Teacher Mistake Prevention Warning Blocker Modal */}
      {mismatchWarning && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '520px', padding: '26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-rose)', marginBottom: '14px' }}>
              <AlertTriangle size={28} />
              <h3 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>
                Student Mismatch Prevention Blocker
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '16px' }}>
              {mismatchWarning.message}
            </p>

            <div style={{ background: '#FFF1F2', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '12px', color: '#9F1239' }}>
              <div>● Selected in Dropdown: <strong>{mismatchWarning.selected_student_name} ({mismatchWarning.selected_student_adm})</strong></div>
              <div style={{ marginTop: '4px' }}>● OCR Extracted from Paper Header: <strong>{mismatchWarning.detected_admission_no}</strong></div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setMismatchWarning(null)}
                className="btn-primary"
                style={{ flex: 1, padding: '10px' }}
              >
                Cancel & Correct Student Selection
              </button>

              <button
                onClick={() => handleUpload(true)}
                className="btn-secondary"
                style={{ color: 'var(--accent-rose)', borderColor: 'var(--accent-rose)', fontSize: '12px', padding: '10px' }}
              >
                Force Override & Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decrypted Stream Preview Modal */}
      {previewSheet && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '780px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-primary)' }}>
                  {previewSheet.subject_name} — {previewSheet.exam_name}
                </h3>
                <span className="pill pill-emerald" style={{ fontSize: '10px', marginTop: '4px' }}>
                  ✓ In-Memory Decrypted Stream (Protected)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <a
                  href={api.viewExamSheetUrl(previewSheet.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '4px 10px', textDecoration: 'none' }}
                >
                  Open in New Tab
                </a>
                <button onClick={() => setPreviewSheet(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} color="var(--text-secondary)" />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, minHeight: '600px', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
              {previewSheet.original_filename?.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={api.viewExamSheetUrl(previewSheet.id)}
                  title="Decrypted Student Exam Paper PDF"
                  style={{ width: '100%', height: '72vh', border: 'none' }}
                />
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', overflowY: 'auto', flex: 1 }}>
                  <img
                    src={api.viewExamSheetUrl(previewSheet.id)}
                    alt="Decrypted Student Exam Paper"
                    style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px', boxShadow: 'var(--shadow-md)', objectFit: 'contain' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
