import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import {
  AlertTriangle, ShieldAlert, CheckCircle2, Clock, Sparkles,
  Filter, Check, TrendingDown, ArrowRight, User, BookOpen, AlertCircle
} from 'lucide-react';

export default function RiskCenter({ user }) {
  const schoolId = user?.school_id;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Intervention modal
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [interventionAction, setInterventionAction] = useState('');
  const [interventionType, setInterventionType] = useState('REMEDIAL_TUTORING');
  const [savingIntervention, setSavingIntervention] = useState(false);

  const loadRiskData = async () => {
    setLoading(true);
    try {
      const res = await api.getRiskPredictionSchool(schoolId);
      setData(res);
      if (res.students && res.students.length > 0) {
        setSelectedStudent(res.students[0]);
      }
    } catch (e) {
      console.error('Failed to load risk prediction data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolId) loadRiskData();
  }, [schoolId]);

  const loadStudentRiskDetails = async (stId) => {
    setLoadingDetails(true);
    try {
      const res = await api.getRiskPredictionStudent(stId);
      setStudentDetails(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (selectedStudent) {
      loadStudentRiskDetails(selectedStudent.student_id);
    }
  }, [selectedStudent]);

  const handleSaveIntervention = async () => {
    if (!selectedStudent || !interventionAction.trim()) return;
    setSavingIntervention(true);
    try {
      await api.logRiskIntervention({
        student_id: selectedStudent.student_id,
        intervention_type: interventionType,
        action_taken: interventionAction.trim(),
        notes: `Intervention initiated for ${selectedStudent.name}`,
      });
      alert('Intervention logged and student success team notified!');
      setShowInterventionModal(false);
      setInterventionAction('');
      loadRiskData();
    } catch (e) {
      alert(e.message || 'Failed to record intervention');
    } finally {
      setSavingIntervention(false);
    }
  };

  const studentsList = data?.students || [];
  const filteredStudents = studentsList.filter(
    (s) => filterSeverity === 'ALL' || s.severity === filterSeverity
  );
  const summary = data?.severity_summary || { CRITICAL: 0, HIGH: 0, MEDIUM: 0, SAFE: 0 };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="pill pill-rose">Student Progress & Health Engine</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Longitudinal Drop & Attendance Predictor</span>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 900, marginTop: '6px', color: 'var(--text-primary)' }}>
            Student Risk & Early Intervention Center
          </h2>
        </div>

        <button
          onClick={loadRiskData}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Sparkles size={16} color="var(--primary)" /> Refresh Health Analysis
        </button>
      </div>

      {/* KPI Heatmap Summary Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="tech-card" style={{ borderLeft: '4px solid var(--accent-rose)' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-rose)' }}>CRITICAL RISK</div>
          <div style={{ fontSize: '28px', fontWeight: 900, marginTop: '4px' }}>{summary.CRITICAL} Students</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Score &lt; 50% or Attendance &lt; 75%</div>
        </div>

        <div className="tech-card" style={{ borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#D97706' }}>HIGH VULNERABILITY</div>
          <div style={{ fontSize: '28px', fontWeight: 900, marginTop: '4px' }}>{summary.HIGH} Students</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Negative velocity &gt; 10% dip</div>
        </div>

        <div className="tech-card" style={{ borderLeft: '4px solid #3B82F6' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#2563EB' }}>MODERATE ATTENTION</div>
          <div style={{ fontSize: '28px', fontWeight: 900, marginTop: '4px' }}>{summary.MEDIUM} Students</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Single subject warning flags</div>
        </div>

        <div className="tech-card" style={{ borderLeft: '4px solid var(--accent-emerald)' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-emerald)' }}>ON TRACK / SAFE</div>
          <div style={{ fontSize: '28px', fontWeight: 900, marginTop: '4px' }}>{summary.SAFE} Students</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Consistent academic trajectory</div>
        </div>
      </div>

      {/* Main Grid: Student List on Left, AI Remediation Profile on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
        {/* Left Column: Filterable Student Matrix */}
        <div className="tech-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Students Requiring Support ({filteredStudents.length})
            </h3>

            {/* Severity Filter */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'SAFE'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterSeverity(lvl)}
                  style={{
                    border: '1px solid var(--border-color)',
                    background: filterSeverity === lvl ? 'var(--primary)' : '#ffffff',
                    color: filterSeverity === lvl ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '11px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '550px', overflowY: 'auto' }}>
            {filteredStudents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                No students match this severity level.
              </div>
            ) : (
              filteredStudents.map((st) => {
                const isSelected = selectedStudent?.student_id === st.student_id;
                let badgeClass = 'pill-emerald';
                if (st.severity === 'CRITICAL') badgeClass = 'pill-rose';
                else if (st.severity === 'HIGH') badgeClass = 'pill-amber';
                else if (st.severity === 'MEDIUM') badgeClass = 'pill-indigo';

                return (
                  <div
                    key={st.student_id}
                    onClick={() => setSelectedStudent(st)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      background: isSelected ? 'var(--primary-light)' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>
                        {st.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Class {st.grade}-{st.section} • {st.admission_no}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span className={`pill ${badgeClass}`} style={{ fontSize: '10px' }}>
                        {st.severity} ({st.risk_score} pts)
                      </span>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Att: {st.attendance_pct}% | Avg: {st.latest_academic_avg}%
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Deep-Dive AI Remediation & Intervention Plan */}
        <div className="tech-card" style={{ padding: '24px' }}>
          {selectedStudent ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {selectedStudent.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Class {selectedStudent.grade}-{selectedStudent.section} • Admission No: {selectedStudent.admission_no}
                  </div>
                </div>

                <button
                  onClick={() => setShowInterventionModal(true)}
                  className="btn-primary"
                  style={{ fontSize: '12px', padding: '8px 14px' }}
                >
                  + Log Action Plan
                </button>
              </div>

              {/* Trajectory KPI Strip */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>ATTENDANCE</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: selectedStudent.attendance_pct >= 75 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                    {selectedStudent.attendance_pct}%
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>LATEST AVERAGE</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--primary)' }}>
                    {selectedStudent.latest_academic_avg}%
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>EXAM VELOCITY</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: selectedStudent.trend_velocity >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                    {selectedStudent.trend_velocity > 0 ? `+${selectedStudent.trend_velocity}%` : `${selectedStudent.trend_velocity}%`}
                  </div>
                </div>
              </div>

              {/* Identified Risk Factors */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={15} color="var(--accent-rose)" /> Detected Warning Indicators
                </h4>
                {selectedStudent.risk_factors && selectedStudent.risk_factors.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedStudent.risk_factors.map((rf, idx) => (
                      <div key={idx} style={{ background: '#FFF1F2', borderLeft: '3px solid var(--accent-rose)', padding: '8px 12px', fontSize: '12px', color: '#9F1239', borderRadius: '4px' }}>
                        {rf}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--accent-emerald)', background: '#ECFDF5', padding: '8px 12px', borderRadius: '4px' }}>
                    ✓ No negative risk anomalies detected. Consistent performance.
                  </div>
                )}
              </div>

              {/* Weak Subjects Drilldown */}
              {selectedStudent.weak_subjects && selectedStudent.weak_subjects.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Subjects Requiring Focus
                  </h4>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {selectedStudent.weak_subjects.map((ws, idx) => (
                      <div key={idx} style={{ background: '#FEF3C7', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, color: '#92400E' }}>
                        {ws.subject}: {ws.average_score}% ({ws.severity})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pedagogical Remediation Recommendations */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={15} color="var(--primary)" /> Pedagogical Action Plan
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(selectedStudent.recommendations || []).map((rec, idx) => (
                    <div key={idx} style={{ background: 'var(--primary-light)', borderRadius: '6px', padding: '10px 14px', border: '1px solid var(--primary-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800, color: 'var(--primary)' }}>
                        <span>{rec.type.replace('_', ' ')}</span>
                        <span>{rec.timeline}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '4px', lineHeight: 1.5 }}>
                        {rec.action}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              Select a student to inspect progress analytics and recommended action plans.
            </div>
          )}
        </div>
      </div>

      {/* Log Action Plan Modal */}
      {showInterventionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '6px' }}>
              Log Intervention for {selectedStudent?.name}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Document teacher action or counseling scheduled to support this student.
            </p>

            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Intervention Category
            </label>
            <select
              value={interventionType}
              onChange={(e) => setInterventionType(e.target.value)}
              className="tech-input"
              style={{ width: '100%', marginBottom: '14px' }}
            >
              <option value="REMEDIAL_TUTORING">Remedial Concept Reinforcement</option>
              <option value="PARENT_COUNSELING">Parent-Teacher Meeting / Counseling</option>
              <option value="ATTENDANCE_WARNING">Formal Attendance Notice</option>
              <option value="PEER_STUDY_GROUP">Peer Study Buddy Assignment</option>
            </select>

            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Action Description & Schedule
            </label>
            <textarea
              value={interventionAction}
              onChange={(e) => setInterventionAction(e.target.value)}
              placeholder="e.g. Scheduled daily 30-min problem solving session in Mathematics after school..."
              className="tech-input"
              style={{ width: '100%', height: '90px', marginBottom: '20px', resize: 'vertical' }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowInterventionModal(false)}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveIntervention}
                disabled={savingIntervention}
                className="btn-primary"
                style={{ flex: 2 }}
              >
                {savingIntervention ? 'Saving...' : 'Record Action Plan →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
