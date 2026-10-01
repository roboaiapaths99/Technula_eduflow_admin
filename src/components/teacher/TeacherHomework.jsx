import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { BookOpen, Plus, CheckCircle2, Clock, AlertCircle, Check, X, Edit2, Trash2, Paperclip } from 'lucide-react';

export default function TeacherHomework({ schoolId, user, grade = '10', section = 'A' }) {
  const [homeworkList, setHomeworkList] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [attachmentName, setAttachmentName] = useState('');

  // Form State
  const [hwForm, setHwForm] = useState({
    title: '',
    subject_id: '',
    description: '',
    due_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    priority: 'MEDIUM',
    attachment_url: '',
  });

  // Edit State
  const [editingHw, setEditingHw] = useState(null);
  const [editHwForm, setEditHwForm] = useState({
    title: '',
    subject_id: '',
    description: '',
    due_date: '',
    priority: 'MEDIUM',
  });

  // Selected Assignment Submissions Modal
  const [selectedHw, setSelectedHw] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentStatuses, setStudentStatuses] = useState({});
  const [savingSubmissions, setSavingSubmissions] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [hw, subs, stList] = await Promise.all([
        api.getClassHomework(schoolId, grade, section),
        api.adminListSubjects().catch(() => []),
        api.adminListStudents().catch(() => []),
      ]);
      setHomeworkList(hw || []);
      setSubjects(subs || []);
      setStudents(stList.filter((s) => s.grade === grade && s.section === section));
      if (subs && subs.length > 0 && !hwForm.subject_id) {
        setHwForm((prev) => ({ ...prev, subject_id: subs[0].id }));
      }
    } catch (e) {
      console.error(e);
      setError('Failed to load homework');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolId) loadData();
  }, [schoolId, grade, section]);

  const handleCreateHomework = async (e) => {
    e.preventDefault();
    try {
      await api.createHomework({
        school_id: schoolId,
        grade,
        section,
        posted_by: user?.id,
        ...hwForm,
      });
      setMessage('New assignment posted to class diary!');
      setShowCreateModal(false);
      setHwForm({
        title: '',
        subject_id: subjects[0]?.id || '',
        description: '',
        due_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
        priority: 'MEDIUM',
        attachment_url: '',
      });
      setAttachmentName('');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to post homework');
    }
  };

  const handleUpdateHomework = async (e) => {
    e.preventDefault();
    if (!editingHw) return;
    try {
      await api.updateHomework(editingHw.id, editHwForm);
      setMessage(`Assignment "${editHwForm.title}" updated successfully!`);
      setEditingHw(null);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to update homework');
    }
  };

  const handleDeleteHomework = async (hwId, title) => {
    if (!window.confirm(`Are you sure you want to delete assignment "${title}"?`)) return;
    try {
      await api.deleteHomework(hwId);
      setMessage(`Assignment "${title}" removed from class diary.`);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete homework');
    }
  };

  const handleOpenSubmissions = (hw) => {
    setSelectedHw(hw);
    // Initialize all to SUBMITTED or NOT_SUBMITTED
    const init = {};
    students.forEach((s) => {
      init[s.id] = 'SUBMITTED';
    });
    setStudentStatuses(init);
  };

  const handleSaveSubmissions = async () => {
    if (!selectedHw) return;
    setSavingSubmissions(true);
    try {
      const submissionList = Object.entries(studentStatuses).map(([stId, status]) => ({
        student_id: stId,
        status,
      }));
      await api.updateHomeworkSubmissions(selectedHw.id, { submissions: submissionList });
      setMessage(`Updated homework status for ${submissionList.length} students.`);
      setSelectedHw(null);
      loadData();
    } catch (err) {
      setError('Failed to record submissions');
    } finally {
      setSavingSubmissions(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#fff',
        padding: '16px 20px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Homework & Assignment Diary (Class {grade}-{section})
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Post assignments with due dates and track completion rates across the class.
          </p>
        </div>

        <button onClick={() => setShowCreateModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> Post New Assignment
        </button>
      </div>

      {message && (
        <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={16} /> {message}
        </div>
      )}

      {/* Homework List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {homeworkList.map((hw) => (
          <div key={hw.id} className="tech-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="pill pill-primary" style={{ fontSize: '11px' }}>{hw.subject_name}</span>
                  <span style={{ fontSize: '11px', color: hw.is_overdue ? '#dc2626' : '#d97706', fontWeight: 700 }}>
                    Due: {hw.due_date} {hw.is_overdue ? '(Overdue)' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => {
                      setEditingHw(hw);
                      setEditHwForm({
                        title: hw.title || '',
                        subject_id: hw.subject_id || (subjects[0]?.id || ''),
                        description: hw.description || '',
                        due_date: hw.due_date || '',
                        priority: hw.priority || 'MEDIUM',
                      });
                    }}
                    className="btn-secondary"
                    style={{ padding: '4px 6px', color: 'var(--primary)' }}
                    title="Edit Assignment"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={() => handleDeleteHomework(hw.id, hw.title)}
                    className="btn-secondary"
                    style={{ padding: '4px 6px', color: '#ef4444' }}
                    title="Delete Assignment"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {hw.title}
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '8px' }}>
                {hw.description || 'Complete exercises and submit notebooks.'}
              </p>
              {hw.attachment_url && (
                <div style={{ marginBottom: '14px' }}>
                  <a
                    href={hw.attachment_url.startsWith('http') ? hw.attachment_url : `http://localhost:8000${hw.attachment_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '12px',
                      color: '#2563eb',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      textDecoration: 'underline'
                    }}
                  >
                    <Paperclip size={13} /> View Attached File
                  </a>
                </div>
              )}
            </div>

            <div>
              {/* Submission Progress Bar */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', fontWeight: 600 }}>
                  <span>Turned In</span>
                  <span>{hw.submitted_count} / {hw.total_students} ({hw.completion_rate}%)</span>
                </div>
                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${hw.completion_rate}%`, background: '#10b981', borderRadius: '4px', transition: 'width 0.8s ease' }} />
                </div>
              </div>

              <button
                onClick={() => handleOpenSubmissions(hw)}
                className="btn-secondary"
                style={{ width: '100%', padding: '8px', fontSize: '12px', fontWeight: 700 }}
              >
                Mark Class Submissions ({hw.submitted_count}/{hw.total_students})
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Post Homework Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 800 }}>Assign Homework for Class {grade}-{section}</h4>

            <form onSubmit={handleCreateHomework} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Subject</label>
                <select
                  value={hwForm.subject_id}
                  onChange={(e) => setHwForm({ ...hwForm, subject_id: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', marginTop: '4px' }}
                  required
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Assignment Title</label>
                <input
                  type="text"
                  placeholder="e.g. Chapter 4: Quadratic Equations - Exercise 4.2"
                  value={hwForm.title}
                  onChange={(e) => setHwForm({ ...hwForm, title: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', marginTop: '4px' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Due Date</label>
                <input
                  type="date"
                  value={hwForm.due_date}
                  onChange={(e) => setHwForm({ ...hwForm, due_date: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', marginTop: '4px' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Instructions / Description</label>
                <textarea
                  placeholder="Detailed instructions for students and parents..."
                  value={hwForm.description}
                  onChange={(e) => setHwForm({ ...hwForm, description: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', minHeight: '80px', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Attach Worksheet / Image / PDF (Optional)</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                  <input
                    type="file"
                    id="teacher-hw-file"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setUploadingAttachment(true);
                      try {
                        const res = await api.uploadFile(f);
                        setHwForm(prev => ({ ...prev, attachment_url: res.url }));
                        setAttachmentName(f.name);
                      } catch (err) {
                        setError(err.message || 'File upload failed');
                      } finally {
                        setUploadingAttachment(false);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('teacher-hw-file')?.click()}
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    disabled={uploadingAttachment}
                  >
                    <Paperclip size={14} /> {uploadingAttachment ? 'Uploading...' : 'Choose File'}
                  </button>
                  {attachmentName && (
                    <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                      ✓ {attachmentName}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '10px' }} disabled={uploadingAttachment}>
                  Post to Student Diaries
                </button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary" style={{ padding: '10px 16px' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Roster Submission Checklist Modal */}
      {selectedHw && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '520px', maxHeight: '85vh', overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 800 }}>
              Submission Checklist: {selectedHw.title}
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Check off students who have submitted their homework:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {students.map((st) => {
                const isSub = studentStatuses[st.id] === 'SUBMITTED';
                return (
                  <div
                    key={st.id}
                    onClick={() => setStudentStatuses((prev) => ({
                      ...prev,
                      [st.id]: isSub ? 'NOT_SUBMITTED' : 'SUBMITTED'
                    }))}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: `1px solid ${isSub ? '#bbf7d0' : '#e2e8f0'}`,
                      background: isSub ? '#f0fdf4' : '#fff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '13px' }}>{st.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>Roll #{st.roll_no || '-'}</span>
                    </div>

                    <span className={isSub ? 'pill pill-success' : 'pill'} style={{ fontSize: '11px' }}>
                      {isSub ? '✓ Submitted' : 'Pending'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button
                onClick={handleSaveSubmissions}
                disabled={savingSubmissions}
                className="btn-primary"
                style={{ flex: 1, padding: '10px', fontWeight: 700 }}
              >
                {savingSubmissions ? 'Saving Records...' : 'Save Submissions'}
              </button>
              <button onClick={() => setSelectedHw(null)} className="btn-secondary" style={{ padding: '10px 16px' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Homework Modal */}
      {editingHw && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 800 }}>Edit Assignment</h4>
              <button onClick={() => setEditingHw(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateHomework} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Subject</label>
                <select
                  value={editHwForm.subject_id}
                  onChange={(e) => setEditHwForm({ ...editHwForm, subject_id: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', marginTop: '4px' }}
                  required
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Assignment Title</label>
                <input
                  type="text"
                  value={editHwForm.title}
                  onChange={(e) => setEditHwForm({ ...editHwForm, title: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', marginTop: '4px' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Due Date</label>
                <input
                  type="date"
                  value={editHwForm.due_date}
                  onChange={(e) => setEditHwForm({ ...editHwForm, due_date: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', marginTop: '4px' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Instructions / Description</label>
                <textarea
                  value={editHwForm.description}
                  onChange={(e) => setEditHwForm({ ...editHwForm, description: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', minHeight: '80px', marginTop: '4px' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Priority</label>
                <select
                  value={editHwForm.priority}
                  onChange={(e) => setEditHwForm({ ...editHwForm, priority: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', marginTop: '4px' }}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High Urgent</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '10px' }}>
                  Update Assignment
                </button>
                <button type="button" onClick={() => setEditingHw(null)} className="btn-secondary" style={{ padding: '10px 16px' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
