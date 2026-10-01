import React, { useState, useEffect } from 'react';
import { api, API_BASE } from '../../api';
import TrendLine from '../analytics/TrendLine';
import ChatDrawer from '../communication/ChatDrawer';
import GatePassCenter from './GatePassCenter';
import DatesheetViewer from './DatesheetViewer';
import AlmanacViewer from './AlmanacViewer';
import HolidayCalendarView from './HolidayCalendarView';
import GalleryView from './GalleryView';
import ActivityTimeline from './ActivityTimeline';
import TeacherContactList from './TeacherContactList';
import AttendanceCalendarView from './AttendanceCalendarView';
import ParentProfileEdit from './ParentProfileEdit';
import NotificationPreferencesModal from './NotificationPreferencesModal';
import BirthdayCelebrationModal from './BirthdayCelebrationModal';
import {
  CreditCard, Calendar, BookOpen, FileCheck, Award,
  CheckCircle2, AlertCircle, Clock, QrCode, ArrowUpRight,
  FileText, Plus, ShieldCheck, Printer, Download, MessageSquare, Paperclip, Upload,
  TrendingUp, Users, RefreshCw, X, Check, Eye, Bell, UserCheck,
  PartyPopper, Cake, Sparkles
} from 'lucide-react';

export default function ParentPortal({ user, onOpenReportCard }) {
  const [activeTab, setActiveTab] = useState('fees'); // 'fees' | 'homework' | 'ptc' | 'certificates' | 'diary' | 'leaves' | 'schedule' | 'academic' | 'chat' | 'gatepass' | 'attendance_view' | 'datesheet' | 'almanac' | 'holidays' | 'gallery' | 'activities' | 'teachers' | 'profile'
  const [studentId, setStudentId] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Fee state
  const [feeDues, setFeeDues] = useState(null);
  const [onlineOrder, setOnlineOrder] = useState(null);
  const [payingOnline, setPayingOnline] = useState(false);
  const [printedReceipt, setPrintedReceipt] = useState(null);

  // Homework state
  const [homeworkList, setHomeworkList] = useState([]);

  // Leave state
  const [leavesList, setLeavesList] = useState([]);
  const [showApplyLeave, setShowApplyLeave] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [proofFileName, setProofFileName] = useState('');

  // Link Child with Access Code State
  const [linkCode, setLinkCode] = useState('');
  const [linkingChild, setLinkingChild] = useState(false);
  const [linkError, setLinkError] = useState(null);
  const [leaveForm, setLeaveForm] = useState({
    from_date: new Date().toISOString().split('T')[0],
    to_date: new Date().toISOString().split('T')[0],
    leave_type: 'SICK',
    reason: '',
    attachment_url: '',
  });

  // PTC State
  const [ptcEvents, setPtcEvents] = useState([]);
  const [ptcBookings, setPtcBookings] = useState([]);
  const [selectedPtcEvent, setSelectedPtcEvent] = useState(null);
  const [ptcSlots, setPtcSlots] = useState([]);
  const [selectedPtcSlot, setSelectedPtcSlot] = useState(null);
  const [ptcAgenda, setPtcAgenda] = useState('');
  const [bookingPtc, setBookingPtc] = useState(false);
  const [loadingPtcSlots, setLoadingPtcSlots] = useState(false);

  // Certificates State
  const [certificatesList, setCertificatesList] = useState([]);
  const [showApplyCert, setShowApplyCert] = useState(false);
  const [applyingCert, setApplyingCert] = useState(false);
  const [certForm, setCertForm] = useState({
    cert_type: 'BONAFIDE',
    purpose_reason: '',
    delivery_mode: 'ONLINE_APP',
  });

  // Student Diary State
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [diaryFilter, setDiaryFilter] = useState('ALL');
  const [acknowledgingDiaryId, setAcknowledgingDiaryId] = useState(null);

  // Chat Drawer state
  const [showChatDrawer, setShowChatDrawer] = useState(false);

  // Schedule state
  const [todaySchedule, setTodaySchedule] = useState(null);

  // Trend
  const [performanceTrend, setPerformanceTrend] = useState(null);

  const [children, setChildren] = useState([]);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Birthday Celebration State
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [celebratedIds, setCelebratedIds] = useState(new Set());

  // Check if current scholar has birthday today
  const isBirthdayToday = Boolean(
    studentInfo?.is_birthday_today ||
    (studentInfo?.dob && (() => {
      try {
        const today = new Date();
        const parts = String(studentInfo.dob).split('-');
        if (parts.length >= 3) {
          return parseInt(parts[1], 10) === (today.getMonth() + 1) && parseInt(parts[2], 10) === today.getDate();
        }
        const d = new Date(studentInfo.dob);
        return d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
      } catch (err) {
        return false;
      }
    })())
  );

  useEffect(() => {
    if (isBirthdayToday && studentInfo?.student_id && !celebratedIds.has(studentInfo.student_id)) {
      setShowBirthdayModal(true);
      setCelebratedIds(prev => new Set(prev).add(studentInfo.student_id));
    }
  }, [isBirthdayToday, studentInfo?.student_id]);

  const schoolId = user?.school_id;

  // Load student linked to this parent
  useEffect(() => {
    const fetchLinkedStudent = async () => {
      setLoading(true);
      try {
        if (user?.id) {
          const kids = await api.getParentChildren(user.id).catch(() => []);
          if (kids && kids.length > 0) {
            setChildren(kids);
            const first = kids[0];
            setStudentId(first.student_id || first.id);
            setStudentInfo(first);
            return;
          }
        }
        setChildren([]);
        setStudentId(null);
        setStudentInfo(null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLinkedStudent();
  }, [user]);

  // Load child data
  const loadChildData = async () => {
    if (!studentId) return;
    try {
      const [dues, hw, leaves, sched, tr, ptcEvs, ptcBks, certs, diary] = await Promise.all([
        api.getStudentFeeDues(studentId).catch(() => null),
        api.getStudentHomework(studentId).catch(() => []),
        (studentInfo?.grade && studentInfo?.section)
          ? api.getTodaySchedule(schoolId, studentInfo.grade, studentInfo.section).catch(() => null)
          : Promise.resolve(null),
        schoolId ? api.listPTCEvents(schoolId).catch(() => []) : [],
        user?.id ? api.getParentPTCAppointments(user.id).catch(() => []) : [],
        api.getStudentCertificates(studentId).catch(() => []),
        api.getStudentDiary(studentId).catch(() => []),
      ]);
      setFeeDues(dues);
      setHomeworkList(hw || []);
      setLeavesList(leaves || []);
      setTodaySchedule(sched);
      setPtcEvents(ptcEvs || []);
      if (ptcEvs && ptcEvs.length > 0 && !selectedPtcEvent) {
        setSelectedPtcEvent(ptcEvs[0]);
      }
      setPtcBookings(ptcBks || []);
      setCertificatesList(certs || []);
      setDiaryEntries(diary?.entries || diary || []);
      if (tr?.trend) {
        setPerformanceTrend(tr.trend.map((t) => ({ label: t.exam_name, value: t.percentage })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (studentId) loadChildData();
  }, [studentId]);

  useEffect(() => {
    if (selectedPtcEvent?.id) {
      setLoadingPtcSlots(true);
      api.getPTCSlots(selectedPtcEvent.id)
        .then(res => setPtcSlots(res || []))
        .catch(console.error)
        .finally(() => setLoadingPtcSlots(false));
    }
  }, [selectedPtcEvent]);

  // Online Fee Checkout
  const handleInitiateOnlinePay = async (item) => {
    setPayingOnline(true);
    setError(null);
    try {
      const res = await api.createOnlineFeeOrder({
        school_id: schoolId,
        student_id: studentId,
        amount: item.net_due,
        fee_structure_id: item.structure_id,
      });
      setOnlineOrder({ ...res, structure_id: item.structure_id, item_name: item.fee_head });
    } catch (err) {
      setError(err.message || 'Payment initiation failed');
    } finally {
      setPayingOnline(false);
    }
  };

  const handleConfirmOnlineUpiPay = async () => {
    if (!onlineOrder) return;
    try {
      const res = await api.verifyOnlineFeePayment({
        school_id: schoolId,
        student_id: studentId,
        amount: onlineOrder.amount,
        order_ref: onlineOrder.order_ref,
        fee_structure_id: onlineOrder.structure_id,
        utr_ref: `UPI-UTR-${Date.now().toString().slice(-6)}`,
      });
      setMessage(res.message);
      setOnlineOrder(null);
      // Load receipt
      const receiptData = await api.getFeeReceipt(res.receipt_no);
      setPrintedReceipt(receiptData);
      loadChildData();
    } catch (err) {
      setError(err.message || 'Payment confirmation failed');
    }
  };

  // Book PTC Slot
  const handleBookPTC = async (e) => {
    e.preventDefault();
    if (!selectedPtcSlot || !studentId || !user?.id) return;
    setBookingPtc(true);
    setError(null);
    try {
      await api.bookPTCSlot({
        slot_id: selectedPtcSlot.slot_id,
        student_id: studentId,
        parent_user_id: user.id,
        agenda_topic: ptcAgenda.trim() || 'General Academic Progress Review',
      });
      setMessage(`Appointment confirmed with ${selectedPtcSlot.teacher_name} for ${selectedPtcSlot.start_time}`);
      setSelectedPtcSlot(null);
      setPtcAgenda('');
      const bks = await api.getParentPTCAppointments(user.id).catch(() => []);
      setPtcBookings(bks || []);
      if (selectedPtcEvent?.id) {
        const sls = await api.getPTCSlots(selectedPtcEvent.id).catch(() => []);
        setPtcSlots(sls || []);
      }
    } catch (err) {
      setError(err.message || 'PTC Slot booking failed');
    } finally {
      setBookingPtc(false);
    }
  };

  const handleCancelPTC = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this conference appointment?')) return;
    try {
      const res = await fetch(`${api.API_BASE || 'http://localhost:8000'}/ptc/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).then(r => r.json());
      setMessage('Appointment cancelled and slot released.');
      const bks = await api.getParentPTCAppointments(user.id).catch(() => []);
      setPtcBookings(bks || []);
      if (selectedPtcEvent?.id) {
        const sls = await api.getPTCSlots(selectedPtcEvent.id).catch(() => []);
        setPtcSlots(sls || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to cancel appointment');
    }
  };

  // Apply for certificate
  const handleApplyCertificate = async (e) => {
    e.preventDefault();
    if (!studentId) return;
    if (!certForm.purpose_reason.trim()) {
      setError('Please provide a reason / purpose for this certificate request');
      return;
    }
    setApplyingCert(true);
    setError(null);
    try {
      await api.applyCertificate({
        student_id: studentId,
        parent_user_id: user.id,
        certificate_type: certForm.cert_type,
        purpose_reason: certForm.purpose_reason.trim(),
        delivery_mode: certForm.delivery_mode,
      });
      setMessage('Certificate application submitted to the Principal\'s Office.');
      setShowApplyCert(false);
      setCertForm({ cert_type: 'BONAFIDE', purpose_reason: '', delivery_mode: 'ONLINE_APP' });
      const certs = await api.getStudentCertificates(studentId).catch(() => []);
      setCertificatesList(certs || []);
    } catch (err) {
      setError(err.message || 'Failed to apply for certificate');
    } finally {
      setApplyingCert(false);
    }
  };

  // Acknowledge Diary
  const handleAcknowledgeDiary = async (entryId) => {
    setAcknowledgingDiaryId(entryId);
    try {
      await api.acknowledgeDiaryEntry(entryId);
      setDiaryEntries(prev => prev.map(e => e.id === entryId ? { ...e, parent_acknowledged: true, acknowledged_at: new Date().toISOString() } : e));
      setMessage('Teacher remark acknowledged successfully.');
    } catch (err) {
      setError(err.message || 'Failed to acknowledge remark');
    } finally {
      setAcknowledgingDiaryId(null);
    }
  };

  // Submit Leave
  const handleUploadProof = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Proof file must be smaller than 5MB');
      return;
    }
    setUploadingProof(true);
    setError(null);
    try {
      const res = await api.uploadFile(file);
      setLeaveForm((prev) => ({ ...prev, attachment_url: res.url }));
      setProofFileName(file.name);
      setMessage('Medical note / document attached successfully');
    } catch (err) {
      setError(err.message || 'File upload failed');
    } finally {
      setUploadingProof(false);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!studentId) return;
    try {
      const res = await api.applyLeave({
        school_id: schoolId,
        student_id: studentId,
        user_id: user?.id || 'parent-user-id',
        ...leaveForm,
      });
      setMessage(res.message);
      setShowApplyLeave(false);
      setLeaveForm({
        from_date: new Date().toISOString().split('T')[0],
        to_date: new Date().toISOString().split('T')[0],
        leave_type: 'SICK',
        reason: '',
        attachment_url: '',
      });
      setProofFileName('');
      loadChildData();
    } catch (err) {
      setError(err.message || 'Failed to apply leave');
    }
  };

  const handleLinkWithCode = async (e) => {
    if (e) e.preventDefault();
    if (!linkCode.trim()) {
      setLinkError('Please enter the 6-character Parent Access Code');
      return;
    }
    setLinkingChild(true);
    setLinkError(null);
    try {
      const res = await api.verifyParentCode(linkCode.trim(), user.id);
      if (res.verified) {
        setMessage(res.message || 'Student linked successfully!');
        setLinkCode('');
        const kids = await api.getParentChildren(user.id);
        if (kids && kids.length > 0) {
          setChildren(kids);
          setStudentId(kids[0].student_id || kids[0].id);
          setStudentInfo(kids[0]);
        }
      } else {
        setLinkError(res.message || 'Invalid or already used access code. Please contact school.');
      }
    } catch (err) {
      setLinkError(err.message || 'Failed to link student. Please check with school admin.');
    } finally {
      setLinkingChild(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '15px', fontWeight: 600 }}>Loading student records...</div>
      </div>
    );
  }

  if (!loading && (!studentId || children.length === 0)) {
    return (
      <div style={{ maxWidth: '680px', margin: '40px auto', padding: '0 20px' }}>
        <div className="tech-card" style={{ padding: '36px', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(99, 91, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 18px auto',
            color: 'var(--primary)'
          }}>
            <GraduationCap size={32} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            No Student Linked to Your Account
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
            To view attendance, report cards, fee dues, and timetable, please enter the unique 6-character Parent Access Code provided by your school administration.
          </p>

          {linkError && (
            <div style={{
              background: 'var(--accent-rose-light)',
              color: 'var(--accent-rose)',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '18px',
              textAlign: 'left'
            }}>
              {linkError}
            </div>
          )}

          {message && (
            <div style={{
              background: 'var(--accent-emerald-light)',
              color: 'var(--accent-emerald)',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '18px'
            }}>
              {message}
            </div>
          )}

          <form onSubmit={handleLinkWithCode} style={{ display: 'flex', gap: '10px', maxWidth: '420px', margin: '0 auto' }}>
            <input
              type="text"
              maxLength={12}
              value={linkCode}
              onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
              placeholder="e.g. STU-A3X7"
              className="form-input"
              style={{
                textTransform: 'uppercase',
                letterSpacing: '2px',
                fontWeight: 700,
                fontSize: '15px',
                textAlign: 'center'
              }}
            />
            <button
              type="submit"
              disabled={linkingChild || !linkCode.trim()}
              className="btn-primary"
              style={{ whiteSpace: 'nowrap', padding: '10px 20px' }}
            >
              {linkingChild ? 'Linking...' : 'Link Child'}
            </button>
          </form>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '20px' }}>
            Don't have an access code? Contact your school's administrative office to issue your student verification code.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '24px auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── 🎂 BOOM CELEBRATION MODAL ── */}
      {showBirthdayModal && (
        <BirthdayCelebrationModal
          student={studentInfo}
          schoolName={studentInfo?.school_name}
          birthdayMessage={studentInfo?.birthday_message}
          onClose={() => setShowBirthdayModal(false)}
        />
      )}

      {/* ── 🎂 CELEBRATION TOP BANNER ── */}
      {isBirthdayToday && (
        <div style={{
          background: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 50%, #8b5cf6 100%)',
          borderRadius: '16px',
          padding: '16px 22px',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: '0 8px 24px rgba(244, 63, 94, 0.35)',
          border: '2px solid rgba(255, 255, 255, 0.35)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '32px' }}>🎂</span>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>
                Special Day Celebration
              </div>
              <div style={{ fontSize: '18px', fontWeight: 900 }}>
                Happy Birthday, {studentInfo?.name || 'Student'}! 🎉🎈
              </div>
              <div style={{ fontSize: '13px', opacity: 0.95, marginTop: '2px' }}>
                {studentInfo?.school_name || 'School'} extends warmest wishes for happiness and growth!
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowBirthdayModal(true)}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              border: 'none',
              background: '#ffffff',
              color: '#e11d48',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            <PartyPopper size={16} /> Replay Celebration 💥
          </button>
        </div>
      )}

      {/* Scholar Profile Card */}
      <div className="tech-card" style={{
        padding: '24px',
        background: 'linear-gradient(135deg, #0A2540 0%, #1e3a8a 100%)',
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {studentInfo?.photo_url ? (
            <img
              src={studentInfo.photo_url.startsWith('http') ? studentInfo.photo_url : `http://localhost:8000${studentInfo.photo_url}`}
              alt={studentInfo.name}
              style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.4)', background: '#fff' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              fontWeight: 800,
              border: '2px solid rgba(255,255,255,0.3)',
              color: '#fff'
            }}>
              {(studentInfo?.name || 'S').charAt(0)}
            </div>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="pill" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '11px' }}>
                Verified Guardian Portal
              </span>
              {children.length > 1 && (
                <select
                  value={studentId}
                  onChange={(e) => {
                    const chosen = children.find(c => (c.student_id || c.id) === e.target.value);
                    if (chosen) {
                      setStudentId(chosen.student_id || chosen.id);
                      setStudentInfo(chosen);
                    }
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.25)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.4)',
                    borderRadius: '6px',
                    padding: '2px 8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  {children.map(c => (
                    <option key={c.student_id || c.id} value={c.student_id || c.id} style={{ color: '#000' }}>
                      Switch to: {c.name} ({c.grade}-{c.section})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '6px' }}>
              {studentInfo?.name || 'Child'}
            </h2>
            <div style={{ fontSize: '13px', opacity: 0.85, marginTop: '4px' }}>
              Admission No: <strong>{studentInfo?.admission_no || 'N/A'}</strong> • Class {studentInfo?.grade || '-'}-{studentInfo?.section || '-'} • Roll #{studentInfo?.roll_no || '1'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setShowNotificationModal(true)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Bell size={15} /> Channel Permissions
            </button>
            <button
              type="button"
              onClick={() => setShowChatDrawer(true)}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <MessageSquare size={15} /> Chat with Teachers
            </button>
            <button
              onClick={() => onOpenReportCard && onOpenReportCard(studentId, studentInfo?.name)}
              className="btn-primary"
              style={{ background: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FileText size={15} /> Term Report Card
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border-color)', paddingBottom: '2px', overflowX: 'auto' }}>
          {[
            { id: 'fees', label: 'Fees & Dues', icon: <CreditCard size={15} /> },
            { id: 'gatepass', label: 'Gate Pass', icon: <ShieldCheck size={15} /> },
            { id: 'attendance_view', label: 'Attendance & Trends', icon: <CheckCircle2 size={15} /> },
            { id: 'datesheet', label: 'Exam Datesheet', icon: <Calendar size={15} /> },
            { id: 'almanac', label: 'Almanac & Docs', icon: <BookOpen size={15} /> },
            { id: 'holidays', label: 'Holiday List', icon: <Calendar size={15} /> },
            { id: 'gallery', label: 'Photo Gallery', icon: <Award size={15} /> },
            { id: 'activities', label: 'Campus Feed', icon: <TrendingUp size={15} /> },
            { id: 'teachers', label: 'Class Teachers', icon: <Users size={15} /> },
            { id: 'homework', label: `Homework (${homeworkList.length})`, icon: <BookOpen size={15} /> },
            { id: 'ptc', label: `PTC Meetings (${ptcBookings.length})`, icon: <Calendar size={15} /> },
            { id: 'certificates', label: `Certificates (${certificatesList.length})`, icon: <Award size={15} /> },
            { id: 'diary', label: `Teacher Diary (${diaryEntries.length})`, icon: <FileText size={15} /> },
            { id: 'leaves', label: `Leave (${leavesList.length})`, icon: <FileCheck size={15} /> },
            { id: 'schedule', label: "Today's Periods", icon: <Clock size={15} /> },
            { id: 'profile', label: 'Student Dossier & Contacts', icon: <UserCheck size={15} /> },
          ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setMessage(null); setError(null); }}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              fontWeight: 700,
              fontSize: '13px',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {message && (
        <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} /> {message}
        </div>
      )}
      {error && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* ── TAB 1: FEES & ONLINE PAYMENT ── */}
      {activeTab === 'fees' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Summary Dues Banner */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="tech-card" style={{ padding: '20px', borderLeft: '4px solid #16a34a' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Total Fee Paid</span>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>
                ₹{Number(feeDues?.summary?.total_fee_paid || 0).toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: '11px', color: '#16a34a' }}>Cleared installments</span>
            </div>

            <div className="tech-card" style={{ padding: '20px', borderLeft: '4px solid #dc2626' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Outstanding Balance Due</span>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>
                ₹{Number(feeDues?.summary?.total_balance_outstanding || 0).toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: '11px', color: '#dc2626' }}>Payable online</span>
            </div>
          </div>

          {/* School Official Bank & QR Payment Details */}
          {(feeDues?.school_payment_info?.bank_account_no || feeDues?.school_payment_info?.upi_vpa || feeDues?.school_payment_info?.qr_code_url) && (
            <div className="tech-card" style={{ padding: '20px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#166534' }}>
                    🏦 School Official Bank & QR Payment Details
                  </h4>
                  <p style={{ fontSize: '12px', color: '#15803d', margin: '2px 0 0 0' }}>
                    You can pay fees directly via UPI QR or NEFT/IMPS bank transfer to the school's account.
                  </p>
                </div>
                <span className="pill pill-emerald" style={{ fontSize: '11px', fontWeight: 700 }}>
                  Verified School Account
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                {feeDues.school_payment_info.bank_name && (
                  <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                    <div style={{ fontSize: '11px', color: '#166534', fontWeight: 600 }}>Bank Name</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#14532d' }}>{feeDues.school_payment_info.bank_name}</div>
                  </div>
                )}
                {feeDues.school_payment_info.bank_account_no && (
                  <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                    <div style={{ fontSize: '11px', color: '#166534', fontWeight: 600 }}>Account Number</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#14532d', fontFamily: 'monospace' }}>{feeDues.school_payment_info.bank_account_no}</div>
                  </div>
                )}
                {feeDues.school_payment_info.bank_ifsc && (
                  <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                    <div style={{ fontSize: '11px', color: '#166534', fontWeight: 600 }}>IFSC Code</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#14532d', fontFamily: 'monospace' }}>{feeDues.school_payment_info.bank_ifsc}</div>
                  </div>
                )}
                {feeDues.school_payment_info.bank_account_holder && (
                  <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                    <div style={{ fontSize: '11px', color: '#166534', fontWeight: 600 }}>Beneficiary Name</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#14532d' }}>{feeDues.school_payment_info.bank_account_holder}</div>
                  </div>
                )}
                {feeDues.school_payment_info.upi_vpa && (
                  <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                    <div style={{ fontSize: '11px', color: '#166534', fontWeight: 600 }}>Official UPI ID</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#14532d', fontFamily: 'monospace' }}>{feeDues.school_payment_info.upi_vpa}</div>
                  </div>
                )}
              </div>

              {feeDues.school_payment_info.qr_code_url && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #dcfce7', marginBottom: '10px' }}>
                  <img src={feeDues.school_payment_info.qr_code_url} alt="School Payment QR" style={{ width: '100px', height: '100px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#166534' }}>Scan & Pay via any UPI App</div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>GPay, PhonePe, Paytm, or BHIM</div>
                  </div>
                </div>
              )}

              {feeDues.school_payment_info.payment_instructions && (
                <div style={{ fontSize: '11.5px', color: '#166534', background: '#dcfce7', padding: '8px 12px', borderRadius: '6px' }}>
                  💡 <strong>Instructions:</strong> {feeDues.school_payment_info.payment_instructions}
                </div>
              )}
            </div>
          )}

          {/* Itemized Installment Cards */}
          <div className="tech-card" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)' }}>
              Applicable Fee Installments
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {feeDues?.breakdown?.map((item) => {
                const isPaid = item.status === 'PAID';
                return (
                  <div
                    key={item.structure_id}
                    style={{
                      padding: '16px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      background: isPaid ? '#f8fafc' : '#fff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '14px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '15px' }}>{item.fee_head}</span>
                        <span className="pill pill-primary" style={{ fontSize: '11px' }}>{item.installment_name}</span>
                        <span className={isPaid ? 'pill pill-success' : 'pill pill-warning'} style={{ fontSize: '11px' }}>
                          {item.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Due Date: <strong>{item.due_date}</strong> • Base Fee: ₹{item.base_amount} • Paid: ₹{item.amount_paid}
                      </div>
                      {item.late_fine > 0 && (
                        <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '2px' }}>
                          Includes ₹{item.late_fine} late payment penalty
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: isPaid ? '#16a34a' : '#dc2626' }}>
                          ₹{item.net_due}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Net Due</div>
                      </div>

                      {!isPaid && (
                        <button
                          onClick={() => handleInitiateOnlinePay(item)}
                          disabled={payingOnline}
                          className="btn-primary"
                          style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <QrCode size={15} /> Pay Now Online
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Receipts History */}
          <div className="tech-card" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '14px', color: 'var(--text-primary)' }}>
              Verified Payment Receipts & Statements
            </h4>

            {feeDues?.history && feeDues.history.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: '#64748b' }}>
                      <th style={{ padding: '10px' }}>Receipt No</th>
                      <th style={{ padding: '10px' }}>Date</th>
                      <th style={{ padding: '10px' }}>Amount</th>
                      <th style={{ padding: '10px' }}>Payment Mode</th>
                      <th style={{ padding: '10px' }}>Transaction Ref</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeDues.history.map((h) => (
                      <tr key={h.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '10px', fontWeight: 700, color: 'var(--primary)' }}>{h.receipt_no}</td>
                        <td style={{ padding: '10px' }}>{h.payment_date}</td>
                        <td style={{ padding: '10px', fontWeight: 700, color: '#16a34a' }}>₹{h.total_paid}</td>
                        <td style={{ padding: '10px' }}><span className="pill pill-primary">{h.payment_mode}</span></td>
                        <td style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '12px' }}>{h.transaction_ref || 'Counter'}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>
                          <button
                            onClick={async () => {
                              const r = await api.getFeeReceipt(h.receipt_no);
                              setPrintedReceipt(r);
                            }}
                            className="btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Printer size={12} /> View Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No payment receipts on record yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: HOMEWORK DIARY ── */}
      {activeTab === 'homework' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {homeworkList.map((hw) => (
            <div key={hw.id} className="tech-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="pill pill-primary" style={{ fontSize: '11px' }}>{hw.subject_name}</span>
                  <span style={{ fontSize: '11px', color: hw.status === 'OVERDUE' ? '#dc2626' : (hw.status === 'SUBMITTED' ? '#16a34a' : '#d97706'), fontWeight: 700 }}>
                    {hw.status === 'SUBMITTED' ? '✓ Completed' : `Due: ${hw.due_date}`}
                  </span>
                </div>

                <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {hw.title}
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {hw.description || 'Complete exercises and submit notebook.'}
                </p>

                {hw.attachment_url && (
                  <div style={{ marginTop: '10px' }}>
                    <a
                      href={hw.attachment_url.startsWith('http') ? hw.attachment_url : `http://localhost:8000${hw.attachment_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '12px',
                        color: '#2563eb',
                        fontWeight: 600,
                        textDecoration: 'underline',
                        cursor: 'pointer'
                      }}
                    >
                      <Paperclip size={13} /> View Attached Worksheet / Document
                    </a>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <span className={hw.status === 'SUBMITTED' ? 'pill pill-success' : (hw.status === 'OVERDUE' ? 'pill pill-warning' : 'pill')} style={{ fontSize: '11px' }}>
                  {hw.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 3: LEAVE APPLICATIONS ── */}
      {activeTab === 'leaves' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 800 }}>Digital Leave Requests</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Apply for medical or planned leaves with doctor prescription proof.</p>
            </div>
            <button onClick={() => setShowApplyLeave(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> Apply for Leave
            </button>
          </div>

          <div className="tech-card" style={{ padding: '20px' }}>
            {leavesList.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {leavesList.map((l) => (
                  <div key={l.id} style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '14px' }}>{l.from_date} to {l.to_date}</span>
                        <span className="pill pill-primary" style={{ fontSize: '11px' }}>{l.leave_type}</span>
                        <span className={l.status === 'APPROVED' ? 'pill pill-success' : (l.status === 'REJECTED' ? 'pill pill-warning' : 'pill')} style={{ fontSize: '11px' }}>
                          {l.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Reason: "{l.reason}"
                      </div>
                      {l.admin_remarks && (
                        <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px' }}>
                          Teacher Remark: {l.admin_remarks}
                        </div>
                      )}
                      {l.attachment_url && (
                        <div style={{ marginTop: '6px' }}>
                          <a
                            href={l.attachment_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <FileText size={13} /> View Attached Medical Note / Document
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No prior leave applications for this academic session.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: TODAY'S SCHEDULE ── */}
      {activeTab === 'schedule' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
          {todaySchedule?.periods?.map((p) => (
            <div key={p.period} className="tech-card" style={{ padding: '16px', borderLeft: `4px solid ${p.type === 'CLASS' ? 'var(--primary)' : '#94a3b8'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span>Period {p.period}</span>
                <span>{p.time}</span>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '4px' }}>{p.subject}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>{p.teacher} • {p.room}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 5: ACADEMIC TRAJECTORY ── */}
      {activeTab === 'academic' && (
        <div className="tech-card" style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '4px' }}>Exam Aggregate Performance Trend</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Scholastic score trajectory across periodic evaluations</p>
          {performanceTrend && performanceTrend.length > 0 ? (
            <TrendLine data={performanceTrend} height={200} color="#6366f1" ySuffix="%" />
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No exam trends recorded yet.
            </div>
          )}
        </div>
      )}

      {/* ── ONLINE UPI CHECKOUT MODAL ── */}
      {onlineOrder && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '440px', padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '50%', color: 'var(--primary)', margin: '0 auto' }}>
              <QrCode size={36} />
            </div>

            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 900 }}>Scan & Pay School Fees</h3>
              <p style={{ fontSize: '13px', color: '#64748b' }}>
                {onlineOrder.item_name} for {onlineOrder.student_name}
              </p>
              <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--primary)', margin: '10px 0' }}>
                ₹{onlineOrder.amount.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '12px', textAlign: 'left' }}>
              <div>UPI ID: <strong>{onlineOrder.upi_vpa}</strong></div>
              <div>Beneficiary: <strong>{onlineOrder.account_name}</strong></div>
              <div>Order Ref: <code>{onlineOrder.order_ref}</code></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={handleConfirmOnlineUpiPay}
                className="btn-primary"
                style={{ padding: '12px', fontWeight: 800, background: '#16a34a' }}
              >
                Approve & Pay via UPI Gateway
              </button>
              <button onClick={() => setOnlineOrder(null)} className="btn-secondary" style={{ padding: '10px' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── APPLY LEAVE MODAL ── */}
      {showApplyLeave && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '440px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 800 }}>Apply for Student Leave</h4>

            <form onSubmit={handleApplyLeave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>From Date</label>
                  <input
                    type="date"
                    value={leaveForm.from_date}
                    onChange={(e) => setLeaveForm({ ...leaveForm, from_date: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', marginTop: '4px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>To Date</label>
                  <input
                    type="date"
                    value={leaveForm.to_date}
                    onChange={(e) => setLeaveForm({ ...leaveForm, to_date: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', marginTop: '4px' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Leave Category</label>
                <select
                  value={leaveForm.leave_type}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', marginTop: '4px' }}
                >
                  <option value="SICK">Medical / Fever / Illness</option>
                  <option value="FAMILY">Family Function / Travel</option>
                  <option value="EMERGENCY">Emergency Leave</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Reason / Doctor Notes</label>
                <textarea
                  placeholder="Explain reason for child's absence..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', minHeight: '80px', marginTop: '4px' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Medical Certificate / Proof (Optional)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', fontSize: '12px' }}>
                    <Paperclip size={14} />
                    {uploadingProof ? 'Uploading...' : (proofFileName ? 'Replace Document' : 'Attach Medical Slip / PDF')}
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={handleUploadProof}
                      disabled={uploadingProof}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {proofFileName && (
                    <span style={{ fontSize: '12px', color: '#047857', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} /> {proofFileName}
                      <button
                        type="button"
                        onClick={() => { setLeaveForm(prev => ({ ...prev, attachment_url: '' })); setProofFileName(''); }}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', padding: '0 4px' }}
                      >
                        ✕
                      </button>
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Supported formats: PDF, PNG, JPG (Max 5MB).
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '10px' }}>
                  Submit Leave Request
                </button>
                <button type="button" onClick={() => setShowApplyLeave(false)} className="btn-secondary" style={{ padding: '10px 16px' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PRINTABLE OFFICIAL RECEIPT MODAL ── */}
      {printedReceipt && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {printedReceipt.school?.logo_url && (
                <img
                  src={printedReceipt.school.logo_url.startsWith('http') ? printedReceipt.school.logo_url : `${API_BASE}${printedReceipt.school.logo_url}`}
                  alt="School Crest"
                  style={{ height: '48px', objectFit: 'contain', marginBottom: '8px' }}
                />
              )}
              <h3 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>{printedReceipt.school.name}</h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>OFFICIAL TAX / FEE RECEIPT</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>Receipt: <strong>{printedReceipt.receipt_no}</strong></span>
              <span>Date: <strong>{printedReceipt.payment_date}</strong></span>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
              <div>Student: <strong>{printedReceipt.student.name}</strong> (Class {printedReceipt.student.grade}-{printedReceipt.student.section})</div>
              <div style={{ color: '#64748b', marginTop: '2px' }}>Adm No: {printedReceipt.student.admission_no}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid #cbd5e1', borderBottom: '2px solid #0f172a', fontWeight: 800, fontSize: '15px' }}>
              <span>Total Paid ({printedReceipt.payment_mode})</span>
              <span style={{ color: '#16a34a' }}>₹{printedReceipt.total_paid}</span>
            </div>

            {/* Official Stamp & Authorized Signature Endorsement */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '8px', borderTop: '1px dashed #cbd5e1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {printedReceipt.school?.stamp_url && (
                  <img
                    src={printedReceipt.school.stamp_url.startsWith('http') ? printedReceipt.school.stamp_url : `${API_BASE}${printedReceipt.school.stamp_url}`}
                    alt="School Seal"
                    style={{ width: '56px', height: '56px', objectFit: 'contain', opacity: 0.9 }}
                  />
                )}
                <div>
                  <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>✓ Verified & Digitally Recorded</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Authorized Academic Copy</div>
                </div>
              </div>

              <div style={{ textAlign: 'center', minWidth: '110px' }}>
                {printedReceipt.school?.signature_url ? (
                  <img
                    src={printedReceipt.school.signature_url.startsWith('http') ? printedReceipt.school.signature_url : `${API_BASE}${printedReceipt.school.signature_url}`}
                    alt="Principal Signature"
                    style={{ height: '34px', maxWidth: '100px', objectFit: 'contain', marginBottom: '2px' }}
                  />
                ) : (
                  <div style={{ height: '24px' }} />
                )}
                <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '2px', fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>
                  {printedReceipt.school?.principal_name ? `Principal / ${printedReceipt.school.principal_name}` : 'Accounts Officer'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={() => window.print()} className="btn-primary" style={{ flex: 1, padding: '10px' }}>
                <Printer size={15} /> Print / Save PDF
              </button>
              <button onClick={() => setPrintedReceipt(null)} className="btn-secondary" style={{ padding: '10px 16px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: PTC MEETING BOOKING ── */}
      {activeTab === 'ptc' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="tech-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>🤝 Parent-Teacher Conferences (PTC)</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Reserve a dedicated 15-minute 1-on-1 discussion slot with your child's teachers.
                </p>
              </div>
              {ptcEvents.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Event:</span>
                  <select
                    value={selectedPtcEvent?.id || ''}
                    onChange={(e) => {
                      const ev = ptcEvents.find(x => x.id === e.target.value);
                      if (ev) setSelectedPtcEvent(ev);
                    }}
                    className="form-input"
                    style={{ fontSize: '13px', padding: '6px 10px' }}
                  >
                    {ptcEvents.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.title} ({ev.event_date})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {selectedPtcEvent && (
              <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedPtcEvent.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    📅 {selectedPtcEvent.event_date} • ⏰ {selectedPtcEvent.start_time} - {selectedPtcEvent.end_time} • {selectedPtcEvent.grade}
                  </div>
                </div>
                <span className="pill pill-primary" style={{ fontSize: '12px' }}>
                  15-Min 1-on-1 Slots
                </span>
              </div>
            )}

            {/* Sub-tab: Slots Grid */}
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px' }}>
              Available Consultation Slots
            </h4>

            {loadingPtcSlots ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading appointment slots...</div>
            ) : ptcSlots.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                No slots currently generated for this conference event. Check back shortly.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {ptcSlots.map((slot) => {
                  const isBooked = slot.is_booked;
                  const isSelected = selectedPtcSlot?.slot_id === slot.slot_id;
                  return (
                    <div
                      key={slot.slot_id}
                      onClick={() => { if (!isBooked) setSelectedPtcSlot(slot); }}
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        border: `1.5px solid ${isSelected ? 'var(--primary)' : (isBooked ? '#e2e8f0' : '#bbf7d0')}`,
                        background: isSelected ? 'rgba(99, 102, 241, 0.06)' : (isBooked ? '#f1f5f9' : '#f0fdf4'),
                        cursor: isBooked ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: isBooked ? '#94a3b8' : 'var(--text-primary)' }}>
                          ⏰ {slot.start_time} - {slot.end_time}
                        </span>
                        <span className={`pill ${isBooked ? 'pill-rose' : 'pill-emerald'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                          {isBooked ? 'Booked' : 'Available'}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: isBooked ? '#94a3b8' : 'var(--text-primary)' }}>
                        {slot.teacher_name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        📍 {slot.room_or_link || 'Room 102'}
                      </div>
                      {!isBooked && (
                        <div style={{ marginTop: '8px', fontSize: '11px', fontWeight: 700, color: 'var(--primary)', textAlign: 'right' }}>
                          {isSelected ? '✓ Selected' : 'Tap to Select ›'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Selected Slot Booking Form */}
            {selectedPtcSlot && (
              <form onSubmit={handleBookPTC} style={{ background: '#f8fafc', border: '1.5px solid var(--primary)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)' }}>
                    Confirm Appointment: {selectedPtcSlot.start_time} - {selectedPtcSlot.end_time} with {selectedPtcSlot.teacher_name}
                  </div>
                  <button type="button" onClick={() => setSelectedPtcSlot(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>✕ Cancel</button>
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    CONSULTATION AGENDA / DISCUSSION TOPIC *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Board exam prep, Mathematics numericals practice, and classroom attentiveness"
                    value={ptcAgenda}
                    onChange={(e) => setPtcAgenda(e.target.value)}
                    className="form-input"
                    style={{ width: '100%', padding: '10px 12px', fontSize: '13px' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" disabled={bookingPtc} className="btn-primary" style={{ padding: '10px 20px', fontWeight: 700 }}>
                    {bookingPtc ? 'Locking Appointment...' : '🤝 Confirm 1-on-1 Booking'}
                  </button>
                  <button type="button" onClick={() => setSelectedPtcSlot(null)} className="btn-secondary" style={{ padding: '10px 16px' }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* My Confirmed Appointments */}
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px', marginTop: '16px' }}>
              My Reserved Appointments ({ptcBookings.length})
            </h4>

            {ptcBookings.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                You have no active conference bookings. Select an open slot above to reserve your session.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                {ptcBookings.map((b) => (
                  <div key={b.booking_id || b.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>{b.event_title}</span>
                      <span className="pill pill-emerald" style={{ fontSize: '11px' }}>✓ Confirmed</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#334155', marginBottom: '4px' }}>
                      <strong>Time:</strong> {b.time_slot || `${b.start_time} - ${b.end_time}`} on {b.event_date}
                    </div>
                    <div style={{ fontSize: '13px', color: '#334155', marginBottom: '4px' }}>
                      <strong>Teacher:</strong> {b.teacher_name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                      <strong>Venue:</strong> {b.room_or_link}
                    </div>
                    {b.agenda_topic && (
                      <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', color: '#475569', fontStyle: 'italic', marginBottom: '12px', borderLeft: '3px solid var(--primary)' }}>
                        "{b.agenda_topic}"
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCancelPTC(b.booking_id || b.id)}
                      className="btn-secondary"
                      style={{ width: '100%', borderColor: '#fecaca', color: '#dc2626', fontSize: '12px', padding: '6px 12px', fontWeight: 700 }}
                    >
                      Cancel Appointment
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: DIGITAL CERTIFICATES ── */}
      {activeTab === 'certificates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="tech-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>📜 Digital Certificates & Bonafide</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Official digitally sealed certificates with public QR cryptographic verification.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyCert(true)}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
              >
                <Plus size={15} /> Request New Certificate
              </button>
            </div>

            {certificatesList.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                <Award size={40} color="var(--primary)" style={{ margin: '0 auto 12px', opacity: 0.7 }} />
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>No Certificates Issued Yet</div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px', margin: '6px auto 16px' }}>
                  Need a Bonafide, Transfer, or Character certificate for visa, passport, or competitive exams? Submit an official request below.
                </p>
                <button type="button" onClick={() => setShowApplyCert(true)} className="btn-primary" style={{ margin: '0 auto' }}>
                  Request Certificate
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {certificatesList.map((cert) => {
                  const isApproved = cert.status === 'APPROVED';
                  const isPending = cert.status === 'PENDING';
                  return (
                    <div key={cert.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span className="pill pill-primary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                          {cert.certificate_type}
                        </span>
                        <span className={`pill ${isApproved ? 'pill-emerald' : isPending ? 'pill-amber' : 'pill-rose'}`} style={{ fontSize: '11px' }}>
                          ● {cert.status}
                        </span>
                      </div>

                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {cert.title || `${cert.certificate_type} Certificate`}
                      </div>

                      {cert.certificate_number && (
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                          Doc No: <code style={{ fontWeight: 700 }}>{cert.certificate_number}</code>
                        </div>
                      )}

                      <div style={{ fontSize: '12px', color: '#475569', marginBottom: '12px', background: '#f8fafc', padding: '8px 10px', borderRadius: '6px' }}>
                        <strong>Purpose:</strong> {cert.purpose_reason || 'General Academic Verification'}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          Applied: {cert.created_at ? new Date(cert.created_at).toLocaleDateString() : 'Recent'}
                        </span>
                        {isApproved && cert.certificate_number ? (
                          <a
                            href={api.getCertificateViewUrl(cert.certificate_number)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary"
                            style={{ fontSize: '12px', padding: '6px 12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Eye size={13} /> View Sealed Certificate
                          </a>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#d97706', fontWeight: 600 }}>
                            {isPending ? '⏳ Awaiting Principal Seal' : 'Rejected'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Apply Certificate Modal */}
          {showApplyCert && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
              <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: 'var(--shadow-xl)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Apply for Digital Certificate</h3>
                  <button onClick={() => setShowApplyCert(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>✕</button>
                </div>

                <form onSubmit={handleApplyCertificate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>CERTIFICATE TYPE</label>
                    <select
                      value={certForm.cert_type}
                      onChange={(e) => setCertForm({ ...certForm, cert_type: e.target.value })}
                      className="form-input"
                      style={{ width: '100%' }}
                    >
                      <option value="BONAFIDE">Bonafide Certificate (Student Status)</option>
                      <option value="TRANSFER">Transfer Certificate (TC / School Leaving)</option>
                      <option value="CHARACTER">Character & Conduct Certificate</option>
                      <option value="FEE_PAID">Fee Payment Verification Certificate</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>PURPOSE / REASON *</label>
                    <textarea
                      required
                      placeholder="e.g. For Passport Application / Visa / Regional Olympiad Verification..."
                      value={certForm.purpose_reason}
                      onChange={(e) => setCertForm({ ...certForm, purpose_reason: e.target.value })}
                      className="form-input"
                      style={{ width: '100%', height: '80px', resize: 'vertical' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>DELIVERY FORMAT</label>
                    <select
                      value={certForm.delivery_mode}
                      onChange={(e) => setCertForm({ ...certForm, delivery_mode: e.target.value })}
                      className="form-input"
                      style={{ width: '100%' }}
                    >
                      <option value="ONLINE_APP">Instant Online Digital Seal & PDF Download</option>
                      <option value="PHYSICAL_COPY">Physical Hard Copy (Collect from School Office)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button type="submit" disabled={applyingCert} className="btn-primary" style={{ flex: 1, padding: '10px' }}>
                      {applyingCert ? 'Submitting...' : 'Submit to Principal →'}
                    </button>
                    <button type="button" onClick={() => setShowApplyCert(false)} className="btn-secondary" style={{ padding: '10px 16px' }}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: STUDENT REMARKS DIARY ── */}
      {activeTab === 'diary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="tech-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>📖 Student Remarks Diary</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Direct observations, appreciations, and academic notes written by subject and class teachers.
                </p>
              </div>

              {/* Category Filter Pills */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['ALL', 'APPRECIATION', 'ACADEMIC', 'DISCIPLINE', 'HOMEWORK', 'GENERAL'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setDiaryFilter(cat)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '16px',
                      border: diaryFilter === cat ? '1.5px solid var(--primary)' : '1px solid #e2e8f0',
                      background: diaryFilter === cat ? 'var(--primary-light)' : '#ffffff',
                      color: diaryFilter === cat ? 'var(--primary)' : 'var(--text-secondary)',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {(() => {
              const filtered = diaryEntries.filter(e => diaryFilter === 'ALL' || (e.category || '').toUpperCase() === diaryFilter);
              if (filtered.length === 0) {
                return (
                  <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📝</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>No Diary Remarks Recorded</div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Teacher observations and classroom feedback will appear here in chronological order.
                    </p>
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {filtered.map((entry) => {
                    const isAck = entry.parent_acknowledged;
                    const isAppreciation = entry.category === 'APPRECIATION';
                    const isDiscipline = entry.category === 'DISCIPLINE';

                    return (
                      <div
                        key={entry.id}
                        style={{
                          background: '#ffffff',
                          borderRadius: '12px',
                          border: `1.5px solid ${isAck ? '#e2e8f0' : (isDiscipline ? '#fecaca' : isAppreciation ? '#a7f3d0' : '#e2e8f0')}`,
                          padding: '18px 20px',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className={`pill ${isAppreciation ? 'pill-emerald' : isDiscipline ? 'pill-rose' : 'pill-primary'}`} style={{ fontSize: '11px', fontWeight: 700 }}>
                              {entry.category || 'OBSERVATION'}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {entry.teacher_name || 'Class Teacher'}
                            </span>
                          </div>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            {entry.date ? new Date(entry.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Today'}
                          </span>
                        </div>

                        {entry.title && (
                          <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
                            {entry.title}
                          </div>
                        )}

                        <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.5, margin: '0 0 14px 0' }}>
                          "{entry.remarks || entry.content}"
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
                          {entry.action_required && (
                            <span className="pill pill-rose" style={{ fontSize: '11px' }}>
                              ⚠️ Action Requested by Teacher
                            </span>
                          )}
                          <div style={{ marginLeft: 'auto' }}>
                            {isAck ? (
                              <span className="pill pill-emerald" style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Check size={12} /> Acknowledged by Parent
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAcknowledgeDiary(entry.id)}
                                disabled={acknowledgingDiaryId === entry.id}
                                className="btn-primary"
                                style={{ fontSize: '12px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#059669', borderColor: '#059669' }}
                              >
                                <Check size={13} /> {acknowledgingDiaryId === entry.id ? 'Saving...' : 'Acknowledge Remark'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── CHAT TAB CONTENT ── */}
      {activeTab === 'chat' && (
        <div className="tech-card" style={{ padding: '32px', textAlign: 'center' }}>
          <MessageSquare size={44} color="var(--primary)" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            In-App Educator Communication
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 16px' }}>
            Chat with {studentInfo?.name ? `${studentInfo.name}'s` : "your child's"} class teacher. Exchange text messages, medical notes, homework clarifications, and voice notes.
          </p>
          <button
            onClick={() => setShowChatDrawer(true)}
            className="btn-primary"
            style={{ margin: '0 auto' }}
          >
            <MessageSquare size={16} /> Open Chat Window
          </button>
        </div>
      )}

      {/* ── GATE PASS TAB ── */}
      {activeTab === 'gatepass' && (
        <GatePassCenter user={user} studentId={studentId} studentInfo={studentInfo} />
      )}

      {/* ── ATTENDANCE & TRENDS TAB ── */}
      {activeTab === 'attendance_view' && (
        <AttendanceCalendarView user={user} studentId={studentId} studentInfo={studentInfo} />
      )}

      {/* ── DATESHEET TAB ── */}
      {activeTab === 'datesheet' && (
        <DatesheetViewer user={user} studentId={studentId} />
      )}

      {/* ── ALMANAC TAB ── */}
      {activeTab === 'almanac' && (
        <AlmanacViewer user={user} studentId={studentId} />
      )}

      {/* ── HOLIDAYS TAB ── */}
      {activeTab === 'holidays' && (
        <HolidayCalendarView user={user} />
      )}

      {/* ── GALLERY TAB ── */}
      {activeTab === 'gallery' && (
        <GalleryView user={user} studentId={studentId} />
      )}

      {/* ── ACTIVITIES FEED TAB ── */}
      {activeTab === 'activities' && (
        <ActivityTimeline user={user} studentId={studentId} onOpenAlbum={() => setActiveTab('gallery')} />
      )}

      {/* ── SCOPED CLASS TEACHERS TAB ── */}
      {activeTab === 'teachers' && (
        <TeacherContactList user={user} studentId={studentId} studentInfo={studentInfo} onOpenChat={() => setShowChatDrawer(true)} />
      )}

      {/* ── STUDENT DOSSIER & PROFILE EDIT TAB ── */}
      {activeTab === 'profile' && (
        <ParentProfileEdit user={user} studentId={studentId} studentInfo={studentInfo} onProfileUpdated={() => loadChildData()} />
      )}

      {/* Notification Preferences Modal */}
      <NotificationPreferencesModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        user={user}
      />

      {/* Slide-out Chat Drawer */}
      {(showChatDrawer || activeTab === 'chat') && (
        <ChatDrawer
          user={user}
          onClose={() => {
            setShowChatDrawer(false);
            if (activeTab === 'chat') setActiveTab('fees');
          }}
        />
      )}
    </div>
  );
}
