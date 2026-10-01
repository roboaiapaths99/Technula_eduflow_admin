import React, { useState, useEffect } from 'react';
import { api, API_BASE } from '../../api';
import BarChart from '../analytics/BarChart';
import TrendLine from '../analytics/TrendLine';
import DonutChart from '../analytics/DonutChart';
import FeeManager from './FeeManager';
import TimetableManager from './TimetableManager';
import CalendarManager from './CalendarManager';
import BulkStudentModal from './BulkStudentModal';
import StaffManager from './StaffManager';
import BulkStudentUpload from './BulkStudentUpload';
import BulkFacultyUpload from './BulkFacultyUpload';
import PlanSelector from '../subscription/PlanSelector';
import GatePassQueue from './GatePassQueue';
import VisitorLogManager from './VisitorLogManager';
import DatesheetManager from './DatesheetManager';
import AlmanacManager from './AlmanacManager';
import HolidayManager from './HolidayManager';
import GalleryManager from './GalleryManager';
import ActivityManager from './ActivityManager';
import NotificationBroadcastModal from './NotificationBroadcastModal';
import BrandingManager from './BrandingManager';
import PendingProfileQueue from './PendingProfileQueue';
import {
  Users, GraduationCap, Calendar, AlertTriangle, LifeBuoy,
  TrendingUp, Search, FileText, CheckCircle2, ArrowUpRight,
  Shield, ShieldCheck, RefreshCw, Sparkles, Plus, Edit2, Trash2,
  BookOpen, Award, Layers, X, Save, CreditCard, CalendarDays,
  FileCheck, Upload, Printer, Building, Globe, Phone, Mail,
  MapPin, Eye, EyeOff, Lock, Activity, HeartPulse, Sliders, Check, ExternalLink, Zap,
  Megaphone, Image as ImageIcon, Flag, KeyRound, MessageCircle, Copy
} from 'lucide-react';

export default function AdminDashboard({ user, onOpenReportCard }) {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'students' | 'faculty' | 'academics' | 'settings'
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState(null);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  // School Profile & Settings State
  const [schoolProfile, setSchoolProfile] = useState(null);
  const [schoolForm, setSchoolForm] = useState({
    code: '',
    name: '',
    board: 'CBSE',
    affiliation_no: '',
    principal_name: '',
    website: '',
    academic_year: '2025-26',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    logo_url: '',
    stamp_url: '',
    signature_url: '',
  });
  const [paymentConfig, setPaymentConfig] = useState({
    gateway_provider: 'MANUAL',
    merchant_key: '',
    merchant_secret: '',
    upi_vpa: 'school@upi',
    upi_account_name: 'School Administration',
    receipt_prefix: 'RCP',
    receipt_template_url: '',
    receipt_template_html: '',
    is_active: true,
    has_secret: false,
  });
  const [savingSchool, setSavingSchool] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingStamp, setUploadingStamp] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [uploadingReceiptTemplate, setUploadingReceiptTemplate] = useState(false);
  const [testingGateway, setTestingGateway] = useState(false);
  const [gatewayTestResult, setGatewayTestResult] = useState(null);
  const [showSecret, setShowSecret] = useState(false);
  const [uploadingStudentPhoto, setUploadingStudentPhoto] = useState(false);
  const [allSchools, setAllSchools] = useState([]);
  const [showRegisterSchoolModal, setShowRegisterSchoolModal] = useState(false);
  const [registerSchoolForm, setRegisterSchoolForm] = useState({
    name: '',
    board: 'CBSE',
    email: '',
    phone: '',
    city: '',
    state: '',
    address: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
  });
  const [registeringSchool, setRegisteringSchool] = useState(false);

  // Student Dossier Modal State
  const [dossierStudent, setDossierStudent] = useState(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [showDossierModal, setShowDossierModal] = useState(false);

  // Student Form & Modals state
  const initialStudentForm = {
    name: '',
    admission_no: '',
    grade: '10',
    section: 'A',
    roll_no: '',
    gender: 'Male',
    dob: '',
    photo_url: '',
    father_name: '',
    father_phone: '',
    mother_name: '',
    mother_phone: '',
    blood_group: 'O+',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    address: '',
    medical_notes: '',
    previous_school: '',
    is_active: true,
  };

  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentForm, setStudentForm] = useState(initialStudentForm);

  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [showBulkFacultyUpload, setShowBulkFacultyUpload] = useState(false);
  const [teacherForm, setTeacherForm] = useState({ full_name: '', email: '', phone: '', password: '', role: 'Teacher' });

  const [showAssignTeacher, setShowAssignTeacher] = useState(false);
  const [assignForm, setAssignForm] = useState({ teacher_user_id: '', grade: '10', section: 'A', role_type: 'ClassTeacher' });

  const [showAddExam, setShowAddExam] = useState(false);
  const [examForm, setExamForm] = useState({ name: '', term: 'Term 2', grade: '10', date: new Date().toISOString().split('T')[0], total_marks: 100, exam_type: 'Term Exam' });

  const [showAddSubject, setShowAddSubject] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', sort_order: 1 });

  // Edit states for faculty, exams, and subjects
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editTeacherForm, setEditTeacherForm] = useState({ full_name: '', email: '', phone: '', role: 'Teacher' });

  const [editingExam, setEditingExam] = useState(null);
  const [editExamForm, setEditExamForm] = useState({ name: '', term: 'Term 2', grade: '10', date: '', total_marks: 100, exam_type: 'Term Exam' });

  const [editingSubject, setEditingSubject] = useState(null);
  const [editSubjectForm, setEditSubjectForm] = useState({ name: '', code: '', sort_order: 1 });

  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const schoolId = user?.school_id;

  // ── Live Real Analytics State ──
  const [analyticsExam, setAnalyticsExam] = useState('');
  const [subjectAverages, setSubjectAverages] = useState([]);
  const [performanceTiers, setPerformanceTiers] = useState(null);
  const [attendanceTrend, setAttendanceTrend] = useState([]);
  const [toppers, setToppers] = useState([]);

  // Feature 5 & 10: Attendance Analytics & Weekly Executive AI Report
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [attPeriod, setAttPeriod] = useState(30);
  const [loadingAttSummary, setLoadingAttSummary] = useState(false);
  const [warningSuccess, setWarningSuccess] = useState(null);

  const [showWeeklyReportModal, setShowWeeklyReportModal] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [loadingWeeklyReport, setLoadingWeeklyReport] = useState(false);

  const loadAttendanceSummary = async (days = attPeriod) => {
    setLoadingAttSummary(true);
    try {
      const data = await api.getAttendanceSummary(schoolId, days);
      setAttendanceSummary(data || null);
    } catch (err) {
      console.error('Failed to load attendance summary', err);
    } finally {
      setLoadingAttSummary(false);
    }
  };

  const handleSendAbsenteeWarning = async (studentId, studentName) => {
    try {
      await api.sendAbsenteeAlert(studentId);
      setWarningSuccess(`Urgent WhatsApp & in-app attendance warning dispatched to ${studentName}'s parents.`);
      setTimeout(() => setWarningSuccess(null), 4000);
    } catch (err) {
      alert('Failed to send attendance warning');
    }
  };

  const handleOpenWeeklyReport = async () => {
    setShowWeeklyReportModal(true);
    setLoadingWeeklyReport(true);
    try {
      const data = await api.getWeeklyExecutiveReport(schoolId);
      setWeeklyReport(data || null);
    } catch (err) {
      console.error('Failed to load weekly executive report', err);
    } finally {
      setLoadingWeeklyReport(false);
    }
  };

  const handleScan = async () => {
    if (!schoolId) return;
    setScanning(true);
    setScanMessage('Scanning attendance & academic indicators across all classes...');
    try {
      const res = await api.triggerRiskScan(schoolId);
      setScanMessage(res.message || 'Risk scan completed successfully!');
      setTimeout(() => setScanMessage(null), 5000);
      loadAllData();
    } catch (err) {
      setScanMessage('Error running risk scan: ' + (err.message || 'Server error'));
      setTimeout(() => setScanMessage(null), 5000);
    } finally {
      setScanning(false);
    }
  };

  const loadAnalytics = async (studentsList = students) => {
    try {
      const distinctGrades = Array.from(new Set(studentsList.map((s) => s.grade).filter(Boolean))).sort();
      const distinctSections = Array.from(new Set(studentsList.map((s) => s.section).filter(Boolean))).sort();
      const activeGrade = selectedGrade !== 'ALL' ? selectedGrade : (distinctGrades[0] || '10');
      const activeSection = selectedSection !== 'ALL' ? selectedSection : (distinctSections[0] || 'A');

      const [subRes, tiersRes, attRes, topRes] = await Promise.all([
        api.getSubjectAverages(schoolId, analyticsExam || undefined, activeGrade, activeSection).catch(() => null),
        api.getPerformanceTiers(schoolId, analyticsExam || undefined, activeGrade, activeSection).catch(() => null),
        api.getAttendanceTrend(schoolId, activeGrade, activeSection, 14).catch(() => null),
        api.getToppers(schoolId, analyticsExam || undefined, activeGrade, 5).catch(() => null),
      ]);

      if (subRes?.averages) {
        setSubjectAverages(subRes.averages.map(a => ({
          label: a.subject_name,
          value: a.percentage,
          maxValue: 100,
        })));
        if (!analyticsExam && subRes.exam_id) {
          setAnalyticsExam(subRes.exam_id);
        }
      }

      if (tiersRes?.tiers) {
        setPerformanceTiers(tiersRes.tiers);
      }

      if (attRes?.trend) {
        setAttendanceTrend(attRes.trend.map(t => ({
          label: t.label,
          value: t.percentage,
        })));
      }

      if (topRes?.toppers) {
        setToppers(topRes.toppers);
      }
    } catch (e) {
      console.error('Failed to load analytics:', e);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsData, studentsData, teachersData, assignData, examsData, subjectsData, schoolData, payData] = await Promise.all([
        api.getAdminStats(schoolId).catch(() => null),
        api.adminListStudents().catch(() => api.getStudents().catch(() => [])),
        api.adminListUsers('Teacher').catch(() => []),
        api.adminListTeacherAssignments().catch(() => []),
        api.adminListExams().catch(() => []),
        api.adminListSubjects().catch(() => []),
        schoolId ? api.getSchool(schoolId).catch(() => null) : Promise.resolve(null),
        schoolId ? api.getSchoolPaymentConfig(schoolId).catch(() => null) : Promise.resolve(null),
      ]);
      const rawStudents = Array.isArray(studentsData) ? studentsData : (studentsData?.items || []);
      const rawTeachers = Array.isArray(teachersData) ? teachersData : (teachersData?.items || []);
      setStats(statsData);
      setStudents(rawStudents);
      setTeachers(rawTeachers);
      setAssignments(Array.isArray(assignData) ? assignData : (assignData?.items || []));
      setExams(Array.isArray(examsData) ? examsData : (examsData?.items || []));
      setSubjects(Array.isArray(subjectsData) ? subjectsData : (subjectsData?.items || []));

      if (schoolData) {
        setSchoolProfile(schoolData);
        setSchoolForm({
          code: schoolData.code || '',
          name: schoolData.name || '',
          board: schoolData.board || 'CBSE',
          affiliation_no: schoolData.affiliation_no || '',
          principal_name: schoolData.principal_name || '',
          website: schoolData.website || '',
          academic_year: schoolData.academic_year || '2025-26',
          address: schoolData.address || '',
          city: schoolData.city || '',
          state: schoolData.state || '',
          phone: schoolData.phone || '',
          email: schoolData.email || '',
          logo_url: schoolData.logo_url || '',
          stamp_url: schoolData.stamp_url || '',
          signature_url: schoolData.signature_url || '',
        });
      }

      if (payData) {
        setPaymentConfig({
          gateway_provider: payData.gateway_provider || 'MANUAL',
          merchant_key: payData.merchant_key || '',
          merchant_secret: payData.merchant_secret || '',
          upi_vpa: payData.upi_vpa || 'school@upi',
          upi_account_name: payData.upi_account_name || 'School Administration',
          receipt_prefix: payData.receipt_prefix || 'RCP',
          receipt_template_url: payData.receipt_template_url || '',
          receipt_template_html: payData.receipt_template_html || '',
          is_active: payData.is_active !== undefined ? payData.is_active : true,
          has_secret: payData.has_secret || false,
        });
      }


      await loadAnalytics(rawStudents);
      await loadAttendanceSummary(attPeriod);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Auto-load all live real data on initial mount or when school changes
  useEffect(() => {
    loadAllData();
  }, [schoolId]);

  // Dynamically reload live analytics when filters change
  useEffect(() => {
    if (students.length > 0) {
      loadAnalytics(students);
    }
  }, [selectedGrade, selectedSection, analyticsExam]);

  // Clean up any open modals when navigating between tabs
  useEffect(() => {
    setShowAddStudent(false);
    setShowBulkUpload(false);
    setShowAddTeacher(false);
    setShowBulkFacultyUpload(false);
    setShowAssignTeacher(false);
    setShowAddExam(false);
    setShowAddSubject(false);
  }, [activeTab]);

  // ── School Settings & Gateway Handlers ──
  const handleSaveSchoolSettings = async (e) => {
    if (e) e.preventDefault();
    setSavingSchool(true);
    setActionError(null);
    try {
      const res = await api.updateSchool(schoolId, schoolForm);
      await api.saveSchoolPaymentConfig({
        school_id: schoolId,
        ...paymentConfig,
      });
      setSchoolProfile(res.school);
      setActionSuccess('Institution Profile & Payment Gateway settings saved successfully!');
      const currentUser = api.getUser ? api.getUser() : null;
      if (currentUser) {
        api.setUser({
          ...currentUser,
          school_name: res.school.name,
        });
      }
      loadAllData();
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err) {
      setActionError(err.message || 'Failed to save school settings');
    } finally {
      setSavingSchool(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setActionError(null);
    try {
      const res = await api.uploadFile(file);
      setSchoolForm(prev => ({ ...prev, logo_url: res.url }));
      setActionSuccess('Official crest uploaded! Click "Save Settings" to apply.');
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err) {
      setActionError('Failed to upload logo: ' + err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleStampUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingStamp(true);
    setActionError(null);
    try {
      const res = await api.uploadFile(file);
      setSchoolForm(prev => ({ ...prev, stamp_url: res.url }));
      setActionSuccess('Official school round stamp uploaded! Click "Save Settings" to apply.');
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err) {
      setActionError('Failed to upload official stamp: ' + err.message);
    } finally {
      setUploadingStamp(false);
    }
  };

  const handleSignatureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSignature(true);
    setActionError(null);
    try {
      const res = await api.uploadFile(file);
      setSchoolForm(prev => ({ ...prev, signature_url: res.url }));
      setActionSuccess('Authorized principal signature uploaded! Click "Save Settings" to apply.');
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err) {
      setActionError('Failed to upload signature: ' + err.message);
    } finally {
      setUploadingSignature(false);
    }
  };

  const handleReceiptTemplateUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReceiptTemplate(true);
    setActionError(null);
    try {
      const res = await api.uploadFile(file);
      setPaymentConfig(prev => ({ ...prev, receipt_template_url: res.url }));
      setActionSuccess('Official school receipt letterhead uploaded! Click "Save Profile & Gateway Settings" to apply.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setActionError('Failed to upload receipt letterhead: ' + err.message);
    } finally {
      setUploadingReceiptTemplate(false);
    }
  };

  const handleTestGatewayConnection = async () => {
    setTestingGateway(true);
    setGatewayTestResult(null);
    try {
      const res = await api.testSchoolPaymentConfig({
        gateway_provider: paymentConfig.gateway_provider,
        merchant_key: paymentConfig.merchant_key,
        merchant_secret: paymentConfig.merchant_secret,
        upi_vpa: paymentConfig.upi_vpa,
      });
      setGatewayTestResult(res);
      if (res.status === 'success') {
        setActionSuccess(res.message || 'Payment gateway connection verified successfully!');
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        setActionError(res.message || 'Payment gateway connection check failed.');
      }
    } catch (err) {
      setGatewayTestResult({ status: 'error', message: err.message || 'Handshake failed' });
      setActionError(err.message || 'Payment gateway connection check failed.');
    } finally {
      setTestingGateway(false);
    }
  };

  const handleOpenStudentDossier = async (student) => {
    setDossierStudent(student);
    setShowDossierModal(true);
    setLoadingDossier(true);
    try {
      const detail = await api.adminGetStudentDetail(student.id);
      setDossierStudent(detail);
    } catch (err) {
      console.error('Failed to load full dossier', err);
    } finally {
      setLoadingDossier(false);
    }
  };

  const handleRegisterNewBranch = async (e) => {
    e.preventDefault();
    setRegisteringSchool(true);
    setActionError(null);
    try {
      const generatedPassword = registerSchoolForm.admin_password || `Admin#${Math.floor(100000 + Math.random() * 900000)}`;
      const payload = { ...registerSchoolForm, admin_password: generatedPassword };
      const res = await api.registerSchool(payload);
      setActionSuccess(`New school "${res.school?.name || registerSchoolForm.name}" registered successfully! Admin login: ${registerSchoolForm.admin_email} | Password: ${generatedPassword}`);
      setShowRegisterSchoolModal(false);
      setRegisterSchoolForm({
        name: '', board: 'CBSE', email: '', phone: '', city: '', state: '', address: '',
        admin_name: '', admin_email: '', admin_password: ''
      });
      loadAllData();
      setTimeout(() => setActionSuccess(null), 8000);
    } catch (err) {
      setActionError(err.message || 'Failed to register school');
    } finally {
      setRegisteringSchool(false);
    }
  };

  // ── Student CRUD Handlers ──
  const handleSaveStudent = async (e) => {
    e.preventDefault();
    setActionError(null);
    try {
      if (editingStudent) {
        await api.adminUpdateStudent(editingStudent.id, studentForm);
        setActionSuccess('Student record updated successfully!');
      } else {
        await api.adminCreateStudent(studentForm);
        setActionSuccess('Student enrolled and registered successfully!');
      }
      setShowAddStudent(false);
      setEditingStudent(null);
      setStudentForm(initialStudentForm);
      loadAllData();
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err) {
      setActionError(err.message || 'Failed to save student');
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to remove student "${studentName}"?`)) return;
    try {
      await api.adminDeleteStudent(studentId);
      setActionSuccess(`Student ${studentName} removed.`);
      loadAllData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      alert(err.message || 'Failed to delete student');
    }
  };

  // ── Teacher CRUD Handlers ──
  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    setActionError(null);
    try {
      const generatedPassword = teacherForm.password || `Teach#${Math.floor(100000 + Math.random() * 900000)}`;
      await api.adminCreateUser({ ...teacherForm, password: generatedPassword });
      setActionSuccess(`Faculty account created for ${teacherForm.full_name}! Login email: ${teacherForm.email} | Temporary Password: ${generatedPassword}`);
      setShowAddTeacher(false);
      setTeacherForm({ full_name: '', email: '', phone: '', password: '', role: 'Teacher' });
      loadAllData();
      setTimeout(() => setActionSuccess(null), 8000);
    } catch (err) {
      setActionError(err.message || 'Failed to create teacher account');
    }
  };

  const handleAssignTeacher = async (e) => {
    e.preventDefault();
    setActionError(null);
    try {
      await api.adminAssignTeacher(assignForm);
      setActionSuccess('Teacher assigned to class successfully!');
      setShowAssignTeacher(false);
      loadAllData();
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err) {
      setActionError(err.message || 'Failed to assign teacher');
    }
  };

  // ── Exam & Subject Handlers ──
  const handleCreateExam = async (e) => {
    e.preventDefault();
    setActionError(null);
    try {
      await api.adminCreateExam(examForm);
      setActionSuccess(`Exam "${examForm.name}" scheduled successfully!`);
      setShowAddExam(false);
      setExamForm({ name: '', term: 'Term 2', grade: '10', date: new Date().toISOString().split('T')[0], total_marks: 100, exam_type: 'Term Exam' });
      loadAllData();
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err) {
      setActionError(err.message || 'Failed to create exam');
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    setActionError(null);
    try {
      await api.adminCreateSubject(subjectForm);
      setActionSuccess(`Subject "${subjectForm.name}" added to curriculum!`);
      setShowAddSubject(false);
      setSubjectForm({ name: '', code: '', sort_order: 1 });
      loadAllData();
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err) {
      setActionError(err.message || 'Failed to add subject');
    }
  };

  // ── Faculty Edit & Delete Handlers ──
  const handleUpdateTeacher = async (e) => {
    e.preventDefault();
    if (!editingTeacher) return;
    setActionError(null);
    try {
      await api.adminUpdateUser(editingTeacher.id, editTeacherForm);
      setActionSuccess(`Faculty member "${editTeacherForm.full_name}" updated successfully!`);
      setEditingTeacher(null);
      loadAllData();
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err) {
      setActionError(err.message || 'Failed to update faculty member');
    }
  };

  const handleDeleteTeacher = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove faculty member "${name}"?`)) return;
    setActionError(null);
    try {
      await api.adminDeleteUser(id);
      setActionSuccess(`Faculty member "${name}" removed.`);
      loadAllData();
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err) {
      setActionError(err.message || 'Failed to remove faculty member');
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Are you sure you want to remove this class lead assignment?')) return;
    setActionError(null);
    try {
      await api.adminDeleteTeacherAssignment(id);
      setActionSuccess('Class lead assignment removed.');
      loadAllData();
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err) {
      setActionError(err.message || 'Failed to remove assignment');
    }
  };

  // ── Exam Edit & Delete Handlers ──
  const handleUpdateExam = async (e) => {
    e.preventDefault();
    if (!editingExam) return;
    setActionError(null);
    try {
      await api.adminUpdateExam(editingExam.id, editExamForm);
      setActionSuccess(`Exam "${editExamForm.name}" updated successfully!`);
      setEditingExam(null);
      loadAllData();
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err) {
      setActionError(err.message || 'Failed to update exam');
    }
  };

  const handleDeleteExam = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete exam "${name}"?`)) return;
    setActionError(null);
    try {
      await api.adminDeleteExam(id);
      setActionSuccess(`Exam "${name}" deleted.`);
      loadAllData();
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err) {
      setActionError(err.message || 'Failed to delete exam');
    }
  };

  // ── Subject Edit & Delete Handlers ──
  const handleUpdateSubject = async (e) => {
    e.preventDefault();
    if (!editingSubject) return;
    setActionError(null);
    try {
      await api.adminUpdateSubject(editingSubject.id, editSubjectForm);
      setActionSuccess(`Subject "${editSubjectForm.name}" updated!`);
      setEditingSubject(null);
      loadAllData();
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err) {
      setActionError(err.message || 'Failed to update subject');
    }
  };

  const handleDeleteSubject = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete subject "${name}"?`)) return;
    setActionError(null);
    try {
      await api.adminDeleteSubject(id);
      setActionSuccess(`Subject "${name}" deleted.`);
      loadAllData();
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err) {
      setActionError(err.message || 'Failed to delete subject');
    }
  };

  const availableGrades = Array.from(new Set(students.map(s => s.grade).filter(Boolean))).sort((a, b) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return String(a).localeCompare(String(b));
  });
  const availableSections = Array.from(new Set(students.map(s => (s.section || '').toUpperCase()).filter(Boolean))).sort();

  const filteredStudents = students.filter(s => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q ||
      (s.name || '').toLowerCase().includes(q) ||
      (s.admission_no && s.admission_no.toLowerCase().includes(q)) ||
      (s.roll_no && s.roll_no.toString().includes(q)) ||
      (s.father_name && s.father_name.toLowerCase().includes(q)) ||
      (s.father_phone && s.father_phone.includes(q)) ||
      (s.mother_name && s.mother_name.toLowerCase().includes(q)) ||
      (s.emergency_contact_phone && s.emergency_contact_phone.includes(q));
    const matchesGrade = selectedGrade === 'ALL' || (s.grade && s.grade.toString() === selectedGrade);
    const matchesSection = selectedSection === 'ALL' || (s.section && s.section.toUpperCase() === selectedSection.toUpperCase());
    return matchesSearch && matchesGrade && matchesSection;
  });

  const kpi = stats?.kpis || {};

  return (
    <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {schoolProfile?.logo_url ? (
            <img
              src={schoolProfile.logo_url.startsWith('http') ? schoolProfile.logo_url : `${API_BASE || 'http://localhost:8000'}${schoolProfile.logo_url}`}
              alt="School Crest"
              style={{ width: '54px', height: '54px', borderRadius: '12px', objectFit: 'cover', border: '1.5px solid #cbd5e1', background: '#ffffff', padding: '2px' }}
            />
          ) : (
            <div style={{
              width: '54px', height: '54px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '22px'
            }}>
              {(schoolProfile?.name || user?.school_name || 'S')[0].toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="pill pill-primary">School OS Command Center</span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Academic Year {schoolProfile?.academic_year || '2025-26'}
              </span>
              {schoolProfile?.board && (
                <span className="pill" style={{ background: '#f8fafc', color: 'var(--text-secondary)', border: '1px solid #e2e8f0', fontSize: '11px' }}>
                  {schoolProfile.board} Affiliated
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
              {schoolProfile?.name || user?.school_name || 'School Administration'}
            </h2>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleOpenWeeklyReport}
            className="btn-primary"
            style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={15} /> Weekly Executive Summary Report
          </button>
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="btn-primary"
            style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#B45309', borderColor: '#B45309' }}
          >
            <Megaphone size={15} /> Broadcast Parent Alert
          </button>
          <button
            onClick={handleScan}
            disabled={scanning}
            className="btn-secondary"
            style={{ borderColor: 'var(--primary-border)', color: 'var(--primary)', fontWeight: 700 }}
          >
            <RefreshCw size={15} className={scanning ? 'animate-spin' : ''} />
            {scanning ? 'Updating Analytics...' : 'Refresh Analytics'}
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {actionSuccess && (
        <div style={{
          background: 'var(--accent-emerald-light)',
          color: 'var(--accent-emerald)',
          padding: '12px 18px',
          borderRadius: '10px',
          marginBottom: '20px',
          fontSize: '14px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <CheckCircle2 size={18} /> {actionSuccess}
        </div>
      )}

      {scanMessage && (
        <div style={{
          background: 'var(--primary-light)',
          border: '1px solid var(--primary-border)',
          color: 'var(--primary)',
          padding: '12px 16px',
          borderRadius: '10px',
          marginBottom: '20px',
          fontSize: '14px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <Sparkles size={16} /> {scanMessage}
        </div>
      )}

      {/* ── Categorized School Management Navigation ── */}
      {(() => {
        const categories = [
          {
            id: 'overview',
            label: 'Overview',
            icon: <ShieldCheck size={16} />,
            tabs: [
              { id: 'home', label: 'Executive Dashboard', icon: <ShieldCheck size={14} /> }
            ]
          },
          {
            id: 'students',
            label: 'Students',
            badge: students.length,
            icon: <GraduationCap size={16} />,
            tabs: [
              { id: 'students', label: `Student Directory (${students.length})`, icon: <GraduationCap size={14} /> },
              { id: 'bulk_upload', label: 'Bulk Student Upload', icon: <Upload size={14} /> },
              { id: 'profile_reviews', label: 'Parent Links & Verification', icon: <CheckCircle2 size={14} /> },
            ]
          },
          {
            id: 'faculty',
            label: 'Faculty & Staff',
            badge: teachers.length,
            icon: <Users size={16} />,
            tabs: [
              { id: 'faculty', label: `Faculty Directory (${teachers.length})`, icon: <Users size={14} /> },
              { id: 'staff', label: 'Staff & Feature Permissions', icon: <Shield size={14} /> },
            ]
          },
          {
            id: 'academics',
            label: 'Academics',
            badge: exams.length,
            icon: <BookOpen size={16} />,
            tabs: [
              { id: 'academics', label: `Exams & Marks (${exams.length})`, icon: <BookOpen size={14} /> },
              { id: 'datesheets', label: 'Exam Datesheets', icon: <Calendar size={14} /> },
              { id: 'timetable', label: 'Class Timetable', icon: <Calendar size={14} /> },
              { id: 'almanac', label: 'School Almanac & Handbooks', icon: <BookOpen size={14} /> },
              { id: 'holidays', label: 'Holiday Calendar', icon: <CalendarDays size={14} /> },
            ]
          },
          {
            id: 'fees',
            label: 'Fee Counter',
            icon: <CreditCard size={16} />,
            tabs: [
              { id: 'fees', label: 'Fee Counter Desk & Invoices', icon: <CreditCard size={14} /> },
            ]
          },
          {
            id: 'operations',
            label: 'Operations',
            icon: <KeyRound size={16} />,
            tabs: [
              { id: 'gate_passes', label: 'Gate Pass Approvals', icon: <KeyRound size={14} /> },
              { id: 'visitors', label: 'Campus Visitor Log', icon: <Users size={14} /> },
              { id: 'calendar', label: 'School Calendar', icon: <CalendarDays size={14} /> },
              { id: 'activities', label: 'Campus Activities', icon: <Flag size={14} /> },
              { id: 'gallery', label: 'Photo Gallery', icon: <ImageIcon size={14} /> },
            ]
          },
          {
            id: 'settings',
            label: 'School Settings',
            icon: <Building size={16} />,
            tabs: [
              { id: 'settings', label: 'School Profile & Affiliation', icon: <Building size={14} /> },
              { id: 'branding', label: 'White-Label Branding', icon: <Sliders size={14} /> },
              { id: 'subscription', label: 'SaaS Plan & Billing', icon: <Zap size={14} /> },
            ]
          }
        ];

        const currentCat = categories.find(cat => cat.tabs.some(t => t.id === activeTab)) || categories[0];

        return (
          <div style={{ marginBottom: '24px' }}>
            {/* Primary Category Bar */}
            <div style={{
              display: 'flex',
              gap: '6px',
              background: '#f8fafc',
              padding: '6px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              overflowX: 'auto',
            }}>
              {categories.map((cat) => {
                const isCatActive = currentCat.id === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      if (!isCatActive) {
                        setActiveTab(cat.tabs[0].id);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      border: 'none',
                      background: isCatActive ? '#ffffff' : 'transparent',
                      color: isCatActive ? 'var(--primary)' : '#475569',
                      fontWeight: isCatActive ? 800 : 600,
                      fontSize: '13.5px',
                      cursor: 'pointer',
                      boxShadow: isCatActive ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cat.icon}
                    <span>{cat.label}</span>
                    {cat.badge !== undefined && (
                      <span style={{
                        fontSize: '11px',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        background: isCatActive ? 'var(--primary-light)' : '#e2e8f0',
                        color: isCatActive ? 'var(--primary)' : '#64748b',
                        fontWeight: 700
                      }}>
                        {cat.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Secondary Sub-tabs Pills */}
            {currentCat.tabs.length > 1 && (
              <div style={{
                display: 'flex',
                gap: '8px',
                marginTop: '12px',
                paddingLeft: '4px',
                overflowX: 'auto',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Section:
                </span>
                {currentCat.tabs.map((tab) => {
                  const isSubActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: isSubActive ? '1px solid var(--primary)' : '1px solid #cbd5e1',
                        background: isSubActive ? 'var(--primary)' : '#ffffff',
                        color: isSubActive ? '#ffffff' : '#334155',
                        fontWeight: isSubActive ? 700 : 500,
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════
          TAB 1: EXECUTIVE OVERVIEW & CHARTS
      ══════════════════════════════════════════ */}
      {activeTab === 'home' && (
        <>
          {/* KPI Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '28px',
          }}>
            <div className="tech-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>Active Students</span>
                <div style={{ background: 'var(--primary-light)', padding: '8px', borderRadius: '8px', color: 'var(--primary)' }}>
                  <GraduationCap size={20} />
                </div>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>
                {kpi.total_students ?? students.length}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--accent-emerald)', marginTop: '4px', fontWeight: 600 }}>
                ● 100% Enrolled & Verified
              </div>
            </div>

            <div className="tech-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>Teaching Faculty</span>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '8px', color: 'var(--accent-emerald)' }}>
                  <Users size={20} />
                </div>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>
                {kpi.total_teachers ?? teachers.length}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Class & Subject Leads
              </div>
            </div>


            <div className="tech-card" style={{ padding: '20px', borderLeft: '4px solid var(--accent-rose)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>Risk Engine Cases</span>
                <div style={{ background: 'var(--accent-rose-light)', padding: '8px', borderRadius: '8px', color: 'var(--accent-rose)' }}>
                  <AlertTriangle size={20} />
                </div>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px', color: 'var(--accent-rose)' }}>
                {kpi.active_risk_cases ?? 0}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--accent-rose)', marginTop: '4px', fontWeight: 600 }}>
                {kpi.critical_risks ?? 0} Critical, {kpi.high_risks ?? 0} High
              </div>
            </div>

            <div className="tech-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>Open Tickets</span>
                <div style={{ background: 'var(--accent-amber-light)', padding: '8px', borderRadius: '8px', color: 'var(--accent-amber)' }}>
                  <LifeBuoy size={20} />
                </div>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>
                {kpi.open_tickets ?? 0}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Within 24h SLA response
              </div>
            </div>
          </div>

          {/* Real Live Dynamic Analytics & Performance Visualizers */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Academic Performance
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Class averages and student scores from exam records.
              </p>
            </div>

            {/* Exam Selector */}
            {exams.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Exam:</span>
                <select
                  value={analyticsExam}
                  onChange={(e) => setAnalyticsExam(e.target.value)}
                  className="input-field"
                  style={{ padding: '6px 12px', fontSize: '13px', minWidth: '180px' }}
                >
                  {exams.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.name} ({ex.term})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '20px', marginBottom: '24px' }}>
            {/* Subject Mastery Performance Bar Chart */}
            <div className="tech-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Subject Mastery & Class Averages
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Live average scores per subject across enrolled students
                  </p>
                </div>
                <span className="pill pill-primary">75% Benchmark</span>
              </div>

              {subjectAverages.length > 0 ? (
                <BarChart data={subjectAverages} benchmark={75} />
              ) : (
                <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No marks entered for this exam yet. Enter marks in Faculty / Teacher portal to view live mastery bars.
                </div>
              )}
            </div>

            {/* Student Performance Tiers Donut Chart */}
            <div className="tech-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Student Performance Tiers
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Categorization by overall score percentage
                </p>

                {performanceTiers ? (
                  <DonutChart
                    data={[
                      { label: 'Distinction (≥80%)', value: performanceTiers.distinction?.count || 0, color: '#10b981' },
                      { label: 'Commendable (60-79%)', value: performanceTiers.commendable?.count || 0, color: '#3b82f6' },
                      { label: 'Intervention (<60%)', value: performanceTiers.intervention?.count || 0, color: '#ef4444' },
                    ]}
                    size={160}
                    centerLabel="Students"
                    centerValue={performanceTiers.distinction?.count + performanceTiers.commendable?.count + performanceTiers.intervention?.count}
                  />
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading tier analysis...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Academic Achievers */}
          <div className="tech-card" style={{ padding: '24px', marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Top Achievers
              </h4>
              <Award size={18} color="#f59e0b" />
            </div>

            {toppers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {toppers.map((top, idx) => (
                  <div
                    key={top.student_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: idx === 0 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(99, 102, 241, 0.04)',
                      borderRadius: '8px',
                      border: idx === 0 ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(99, 102, 241, 0.1)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: idx === 0 ? '#f59e0b' : (idx === 1 ? '#94a3b8' : (idx === 2 ? '#b45309' : '#6366f1')),
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {top.rank}
                      </span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {top.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {top.admission_no} • {top.grade}-{top.section}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary)' }}>
                        {top.percentage}%
                      </span>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {top.total_obtained}/{top.total_max}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No toppers computed yet for this exam.
              </div>
            )}
          </div>

        </>
      )}

      {/* ══════════════════════════════════════════
          TAB 2: STUDENT DIRECTORY & CRUD
      ══════════════════════════════════════════ */}
      {activeTab === 'students' && (
        <div className="tech-card" style={{ padding: '24px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '14px',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Enrolled Students Directory
                </h3>
                <span className="pill pill-primary" style={{ fontSize: '12px', fontWeight: 700 }}>
                  {filteredStudents.length} of {students.length} Students
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                Complete student registry: academic records, attendance history, and parent contact details.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                <input
                  type="text"
                  placeholder="Search students, parent name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
                />
              </div>

              {/* Class Filter */}
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="form-input"
                style={{ height: '38px', fontSize: '13px', width: '130px', fontWeight: 600 }}
              >
                <option value="ALL">All Grades</option>
                {availableGrades.map(g => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>

              {/* Section Filter */}
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="form-input"
                style={{ height: '38px', fontSize: '13px', width: '125px', fontWeight: 600 }}
              >
                <option value="ALL">All Sections</option>
                {availableSections.map(s => (
                  <option key={s} value={s}>Section {s}</option>
                ))}
              </select>

              {(selectedGrade !== 'ALL' || selectedSection !== 'ALL' || search) && (
                <button
                  type="button"
                  onClick={() => { setSelectedGrade('ALL'); setSelectedSection('ALL'); setSearch(''); }}
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '8px 12px' }}
                  title="Clear all filters"
                >
                  Reset
                </button>
              )}

              <button
                onClick={() => setShowBulkUpload(true)}
                className="btn-secondary"
                style={{ fontSize: '13px', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Upload size={15} /> Bulk CSV
              </button>

              <button
                onClick={() => {
                  setEditingStudent(null);
                  setStudentForm({
                    ...initialStudentForm,
                    admission_no: `ADM-2026-${Math.floor(100 + Math.random() * 900)}`,
                    roll_no: (students.length + 1).toString(),
                  });
                  setShowAddStudent(true);
                }}
                className="btn-primary"
                style={{ fontSize: '13px', padding: '9px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={15} /> Enroll Student
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '5%' }}>Roll</th>
                  <th style={{ width: '22%' }}>Student Profile</th>
                  <th style={{ width: '13%' }}>Admission No</th>
                  <th style={{ width: '11%' }}>Class & Sec</th>
                  <th style={{ width: '18%' }}>Guardian & Contact</th>
                  <th style={{ width: '8%' }}>Blood</th>
                  <th style={{ width: '8%' }}>Status</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((st, idx) => (
                  <tr key={st.id || idx}>
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>
                      #{st.roll_no || idx + 1}
                    </td>
                    <td>
                      <div
                        onClick={() => handleOpenStudentDossier(st)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                        title="Click to view complete student dossier"
                      >
                        <div style={{
                          width: '34px', height: '34px', borderRadius: '17px',
                          backgroundColor: '#EEF2FF', border: '1px solid #C7D2FE',
                          overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {st.photo_url ? (
                            <img src={st.photo_url.startsWith('http') ? st.photo_url : `${API_BASE || 'http://localhost:8000'}${st.photo_url}`} alt={st.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary)' }}>
                              {(st.name || 'S')[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13.5px' }}>
                            {st.name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {st.gender || 'Student'}{st.dob ? ` • DOB: ${st.dob}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="pill" style={{ background: '#f1f5f9', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '12px' }}>
                        {st.admission_no}
                      </span>
                    </td>
                    <td>
                      <span className="pill pill-primary" style={{ fontSize: '12px' }}>
                        Grade {st.grade}-{st.section}
                      </span>
                    </td>
                    <td style={{ fontSize: '12.5px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {st.father_name || st.mother_name || 'Guardian'}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                        {st.father_phone || st.mother_phone || st.emergency_contact_phone || 'No phone recorded'}
                      </div>
                    </td>
                    <td>
                      <span className="pill" style={{ fontSize: '11px', background: '#fef2f2', color: '#b91c1c', fontWeight: 700 }}>
                        {st.blood_group || '—'}
                      </span>
                    </td>
                    <td>
                      {st.is_active !== false ? (
                        <span className="pill pill-emerald" style={{ fontSize: '11px' }}>
                          ● Active
                        </span>
                      ) : (
                        <span className="pill pill-rose" style={{ fontSize: '11px' }}>
                          ○ Inactive
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '5px' }}>
                        <button
                          onClick={() => handleOpenStudentDossier(st)}
                          className="btn-secondary"
                          title="Inspect Complete Student Dossier"
                          style={{ padding: '6px 9px', fontSize: '11.5px', gap: '4px', color: '#4338ca', borderColor: '#c7d2fe', background: '#eef2ff', fontWeight: 700 }}
                        >
                          <Eye size={13} /> Dossier
                        </button>
                        <button
                          onClick={() => onOpenReportCard(st.id, st.name)}
                          className="btn-secondary"
                          title="Generate Comprehensive Report Card"
                          style={{ padding: '6px 8px', fontSize: '11.5px', gap: '3px', color: 'var(--primary)' }}
                        >
                          <FileText size={13} /> Card
                        </button>
                        <button
                          onClick={() => window.open(api.getProgressLetterHtmlUrl(st.id), '_blank')}
                          className="btn-secondary"
                          title="View & Print Official Mid-Term Progress Letter (HTML/PDF)"
                          style={{ padding: '6px 8px', fontSize: '11.5px', gap: '3px', color: '#059669', borderColor: '#a7f3d0', background: '#ecfdf5' }}
                        >
                          <FileText size={13} /> Letter
                        </button>
                        <button
                          onClick={() => {
                            setEditingStudent(st);
                            setStudentForm({
                              name: st.name || '',
                              admission_no: st.admission_no || '',
                              grade: st.grade || '',
                              section: st.section || '',
                              roll_no: st.roll_no || '',
                              gender: st.gender || 'Male',
                              dob: st.dob || '',
                              photo_url: st.photo_url || '',
                              father_name: st.father_name || '',
                              father_phone: st.father_phone || '',
                              mother_name: st.mother_name || '',
                              mother_phone: st.mother_phone || '',
                              blood_group: st.blood_group || 'O+',
                              emergency_contact_name: st.emergency_contact_name || '',
                              emergency_contact_phone: st.emergency_contact_phone || '',
                              address: st.address || '',
                              medical_notes: st.medical_notes || '',
                              previous_school: st.previous_school || '',
                              is_active: st.is_active !== undefined ? st.is_active : true,
                            });
                            setShowAddStudent(true);
                          }}
                          className="btn-secondary"
                          title="Edit Student Profile"
                          style={{ padding: '6px 8px' }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(st.id, st.name)}
                          className="btn-secondary"
                          title="Delete Student"
                          style={{ padding: '6px 8px', color: 'var(--accent-rose)' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB 3: FACULTY & CLASS ASSIGNMENTS
      ══════════════════════════════════════════ */}
      {activeTab === 'faculty' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Faculty Members List */}
          <div className="tech-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Teaching Faculty Roster
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Registered educators with teacher PWA access</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowBulkFacultyUpload(true)}
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Upload size={14} /> Bulk Ingest
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTeacher(true)}
                  className="btn-primary"
                  style={{ fontSize: '12px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={14} /> Add Faculty
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {teachers.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    background: '#ffffff',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(99,91,255,0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                      {t.full_name?.charAt(0) || 'T'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                        {t.full_name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {t.email} {t.phone && `• ${t.phone}`}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="pill pill-primary" style={{ fontSize: '11px' }}>
                      {t.role}
                    </span>
                    <button
                      onClick={() => {
                        setEditingTeacher(t);
                        setEditTeacherForm({
                          full_name: t.full_name || '',
                          email: t.email || '',
                          phone: t.phone || '',
                          role: t.role || 'Teacher',
                        });
                      }}
                      className="btn-secondary"
                      style={{ padding: '5px 8px', color: 'var(--primary)' }}
                      title="Edit Faculty"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteTeacher(t.id, t.full_name)}
                      className="btn-secondary"
                      style={{ padding: '5px 8px', color: '#ef4444' }}
                      title="Remove Faculty"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Class Assignments */}
          <div className="tech-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Class & Section Leads
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Class teacher authorizations for attendance & marks</p>
              </div>
              <button
                onClick={() => {
                  if (teachers.length > 0) setAssignForm({ ...assignForm, teacher_user_id: teachers[0].id });
                  setShowAssignTeacher(true);
                }}
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '8px 14px' }}
              >
                <Plus size={14} /> Assign Class
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {assignments.length > 0 ? (
                assignments.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 14px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      background: '#ffffff',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                        Grade {a.grade}-{a.section}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Lead: {a.teacher_name}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="pill pill-emerald" style={{ fontSize: '11px' }}>
                        {a.role_type}
                      </span>
                      <button
                        onClick={() => handleDeleteAssignment(a.id)}
                        className="btn-secondary"
                        style={{ padding: '5px 8px', color: '#ef4444' }}
                        title="Delete Assignment"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{
                  padding: '24px 16px',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '10px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '13px'
                }}>
                  No faculty class assignments created yet. Click "+ Assign Teacher" above to map an educator to a class.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB 4: ACADEMICS & EXAMS
      ══════════════════════════════════════════ */}
      {activeTab === 'academics' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Scheduled Exams */}
          <div className="tech-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Academic Term Examinations
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Configured evaluation cycles for grade calculations</p>
              </div>
              <button
                onClick={() => setShowAddExam(true)}
                className="btn-primary"
                style={{ fontSize: '12px', padding: '8px 14px' }}
              >
                <Plus size={14} /> Add Exam
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {exams.map((ex) => (
                <div
                  key={ex.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    background: '#ffffff',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                      {ex.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {ex.term} • Date: {ex.date} • Total: {ex.total_marks} pts
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="pill pill-primary" style={{ fontSize: '11px' }}>
                      {ex.exam_type || 'Term Exam'}
                    </span>
                    <button
                      onClick={() => {
                        setEditingExam(ex);
                        setEditExamForm({
                          name: ex.name || '',
                          term: ex.term || 'Term 2',
                          grade: ex.grade || '',
                          date: ex.date || '',
                          total_marks: ex.total_marks || 100,
                          exam_type: ex.exam_type || 'Term Exam',
                        });
                      }}
                      className="btn-secondary"
                      style={{ padding: '5px 8px', color: 'var(--primary)' }}
                      title="Edit Exam"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteExam(ex.id, ex.name)}
                      className="btn-secondary"
                      style={{ padding: '5px 8px', color: '#ef4444' }}
                      title="Delete Exam"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subjects */}
          <div className="tech-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Curriculum Subjects
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Board standardized subject codes & courses</p>
              </div>
              <button
                onClick={() => setShowAddSubject(true)}
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '8px 14px' }}
              >
                <Plus size={14} /> Add Subject
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {subjects.map((sub) => (
                <div
                  key={sub.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    background: '#ffffff',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                      {sub.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      Code: {sub.code || 'N/A'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="pill" style={{ background: '#f1f5f9', color: 'var(--text-secondary)', fontSize: '11px' }}>
                      Priority #{sub.sort_order || 1}
                    </span>
                    <button
                      onClick={() => {
                        setEditingSubject(sub);
                        setEditSubjectForm({
                          name: sub.name || '',
                          code: sub.code || '',
                          sort_order: sub.sort_order || 1,
                        });
                      }}
                      className="btn-secondary"
                      style={{ padding: '5px 8px', color: 'var(--primary)' }}
                      title="Edit Subject"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(sub.id, sub.name)}
                      className="btn-secondary"
                      style={{ padding: '5px 8px', color: '#ef4444' }}
                      title="Delete Subject"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB 5: MULTI-TENANT FEE MANAGEMENT
      ══════════════════════════════════════════ */}
      {activeTab === 'fees' && (
        <FeeManager schoolId={schoolId} students={students} />
      )}

      {/* ══════════════════════════════════════════
          TAB 6: CLASS TIMETABLE BUILDER
      ══════════════════════════════════════════ */}
      {activeTab === 'timetable' && (
        <TimetableManager schoolId={schoolId} teachers={teachers} subjects={subjects} />
      )}

      {/* ══════════════════════════════════════════
          TAB 7: ACADEMIC CALENDAR & HOLIDAYS
      ══════════════════════════════════════════ */}
      {activeTab === 'calendar' && (
        <CalendarManager schoolId={schoolId} />
      )}


      {/* ══════════════════════════════════════════
          TAB 9: SCHOOL SETTINGS & INSTITUTION PROFILE
      ══════════════════════════════════════════ */}
      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Institutional Header & Summary Card */}
          <div className="tech-card" style={{ padding: '24px', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <div style={{
                  width: '72px', height: '72px', borderRadius: '16px',
                  backgroundColor: '#ffffff', border: '2px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {schoolForm.logo_url ? (
                    <img
                      src={schoolForm.logo_url.startsWith('http') ? schoolForm.logo_url : `${API_BASE || 'http://localhost:8000'}${schoolForm.logo_url}`}
                      alt="Crest"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <Building size={34} color="var(--primary)" />
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="pill pill-primary" style={{ fontSize: '11px', fontWeight: 700 }}>School Administration</span>
                    <span className="pill pill-emerald" style={{ fontSize: '11px' }}>● Active Institution</span>
                    {schoolForm.board && (
                      <span className="pill" style={{ background: '#e0e7ff', color: '#4338ca', fontSize: '11px', fontWeight: 700 }}>
                        {schoolForm.board} Board
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
                    {schoolForm.name || 'School Profile & Accreditation'}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
                    Affiliation No: <strong>{schoolForm.affiliation_no || 'CBSE/AFF/2130045'}</strong> • Principal: <strong>{schoolForm.principal_name || 'Not specified'}</strong> • Term: <strong>{schoolForm.academic_year || '2025-26'}</strong>
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowRegisterSchoolModal(true)}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '10px 16px' }}
                >
                  <Plus size={15} /> Register Campus
                </button>
                <button
                  type="button"
                  onClick={handleSaveSchoolSettings}
                  disabled={savingSchool}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '10px 18px', fontWeight: 700 }}
                >
                  <Save size={15} /> {savingSchool ? 'Saving Settings...' : 'Save All Settings'}
                </button>
              </div>
            </div>
          </div>

          {/* School Code Sharing Card for Parents */}
          <div style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            border: '1.5px solid #bfdbfe',
            borderRadius: '16px',
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ background: '#3b82f6', color: '#fff', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                  Parent Mobile App Onboarding
                </span>
                <span style={{ fontSize: '13px', color: '#1e40af', fontWeight: 600 }}>Direct Parent Phone Login</span>
              </div>
              <h4 style={{ margin: '4px 0', fontSize: '16px', fontWeight: 800, color: '#1e3a8a' }}>
                Official Institutional School Code
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#2563eb' }}>
                Share this 6-character code with parents. They type it once in the mobile app to connect directly to your campus.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                background: '#ffffff',
                border: '2px dashed #3b82f6',
                borderRadius: '12px',
                padding: '8px 20px',
                fontSize: '22px',
                fontWeight: 900,
                letterSpacing: '2px',
                color: '#1d4ed8',
                fontFamily: 'monospace',
              }}>
                {schoolForm.code || schoolProfile?.code || user?.school_code || '—'}
              </div>
              <button
                type="button"
                onClick={() => {
                  const activeCode = schoolForm.code || schoolProfile?.code || user?.school_code || '';
                  if (activeCode) {
                    navigator.clipboard.writeText(activeCode);
                    alert(`School Code "${activeCode}" copied to clipboard! Share this with parents.`);
                  }
                }}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', fontWeight: 700 }}
              >
                <Copy size={16} /> Copy Code
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveSchoolSettings} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
            {/* CARD 1: Core Institutional Identity */}
            <div className="tech-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                <Building size={18} color="var(--primary)" />
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Institutional Identity & Accreditation
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Full Registered School Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={schoolForm.name}
                    onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                    placeholder="e.g. Delhi Public International School"
                    className="form-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    School Access Code (6-char code for Mobile App parent login)
                  </label>
                  <input
                    type="text"
                    value={schoolForm.code || ''}
                    onChange={(e) => setSchoolForm({ ...schoolForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. DELH01 or DPS-DEL"
                    className="form-input"
                    style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '1px' }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Parents type this code in the mobile app to quickly connect without browsing.
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Education Board
                    </label>
                    <select
                      value={schoolForm.board || 'CBSE'}
                      onChange={(e) => setSchoolForm({ ...schoolForm, board: e.target.value })}
                      className="form-input"
                    >
                      <option value="CBSE">CBSE (Central Board)</option>
                      <option value="ICSE">ICSE / CISCE</option>
                      <option value="Cambridge">Cambridge International (IGCSE)</option>
                      <option value="IB">IB World School</option>
                      <option value="State Board">State Secondary Board</option>
                      <option value="Matriculation">Matriculation Board</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Affiliation / Reg Code
                    </label>
                    <input
                      type="text"
                      value={schoolForm.affiliation_no || ''}
                      onChange={(e) => setSchoolForm({ ...schoolForm, affiliation_no: e.target.value })}
                      placeholder="e.g. CBSE/AFF/2130045"
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Principal / Head of School
                    </label>
                    <input
                      type="text"
                      value={schoolForm.principal_name || ''}
                      onChange={(e) => setSchoolForm({ ...schoolForm, principal_name: e.target.value })}
                      placeholder="e.g. Dr. Sunita Mehra, Ph.D."
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Academic Year Term
                    </label>
                    <select
                      value={schoolForm.academic_year || '2025-26'}
                      onChange={(e) => setSchoolForm({ ...schoolForm, academic_year: e.target.value })}
                      className="form-input"
                    >
                      <option value="2024-25">2024-25</option>
                      <option value="2025-26">2025-26 (Current Active)</option>
                      <option value="2026-27">2026-27 (Upcoming)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Institutional Website
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Globe size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                    <input
                      type="url"
                      value={schoolForm.website || ''}
                      onChange={(e) => setSchoolForm({ ...schoolForm, website: e.target.value })}
                      placeholder="https://www.delhipublicschool.edu.in"
                      className="form-input"
                      style={{ paddingLeft: '36px' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: Campus Geolocation & Direct Contacts */}
            <div className="tech-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                <MapPin size={18} color="var(--primary)" />
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Campus Location & Communication Channels
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Campus Postal Address
                  </label>
                  <textarea
                    rows={2}
                    value={schoolForm.address || ''}
                    onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
                    placeholder="Sector 14, Institutional Area, Knowledge Park"
                    className="form-input"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      City / District
                    </label>
                    <input
                      type="text"
                      value={schoolForm.city || ''}
                      onChange={(e) => setSchoolForm({ ...schoolForm, city: e.target.value })}
                      placeholder="e.g. New Delhi"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      State / Province
                    </label>
                    <input
                      type="text"
                      value={schoolForm.state || ''}
                      onChange={(e) => setSchoolForm({ ...schoolForm, state: e.target.value })}
                      placeholder="e.g. Delhi NCR"
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Official Admin Email *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                      <input
                        type="email"
                        required
                        value={schoolForm.email || ''}
                        onChange={(e) => setSchoolForm({ ...schoolForm, email: e.target.value })}
                        placeholder="admin@school.edu"
                        className="form-input"
                        style={{ paddingLeft: '36px' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Helpline / Phone
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                      <input
                        type="text"
                        value={schoolForm.phone || ''}
                        onChange={(e) => setSchoolForm({ ...schoolForm, phone: e.target.value })}
                        placeholder="+91 11 2789 0000"
                        className="form-input"
                        style={{ paddingLeft: '36px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 3: School Crest, Official Round Stamp & Authorized Signature */}
            <div className="tech-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                <Award size={18} color="var(--primary)" />
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  School Crest, Official Stamp & Signatures
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 1. Official Crest */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    1. Official School Crest / Emblem
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '72px', height: '72px', borderRadius: '12px',
                      border: '2px dashed var(--primary-border)', backgroundColor: '#F8FAFC',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', flexShrink: 0
                    }}>
                      {schoolForm.logo_url ? (
                        <img
                          src={schoolForm.logo_url.startsWith('http') ? schoolForm.logo_url : `${API_BASE || 'http://localhost:8000'}${schoolForm.logo_url}`}
                          alt="Crest Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      ) : (
                        <Building size={28} color="var(--text-muted)" />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Upload size={13} /> {uploadingLogo ? 'Uploading...' : 'Upload Crest PNG'}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                        />
                      </label>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: 0 }}>
                        Rendered on Student IDs, report cards & portal headers.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Official Round Stamp */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    2. Official Institutional Round Stamp / Seal
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '72px', height: '72px', borderRadius: '50%',
                      border: '2px dashed #93c5fd', backgroundColor: '#f0f9ff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', flexShrink: 0
                    }}>
                      {schoolForm.stamp_url ? (
                        <img
                          src={schoolForm.stamp_url.startsWith('http') ? schoolForm.stamp_url : `${API_BASE || 'http://localhost:8000'}${schoolForm.stamp_url}`}
                          alt="Stamp Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      ) : (
                        <FileCheck size={28} color="#0284c7" />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Upload size={13} /> {uploadingStamp ? 'Uploading...' : 'Upload Official Seal'}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleStampUpload}
                          disabled={uploadingStamp}
                        />
                      </label>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: 0 }}>
                        Watermarked on Fee Receipts, Transfer Certificates & Marksheets.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Authorized Principal Signature */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    3. Authorized Principal / Controller Signature
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '120px', height: '56px', borderRadius: '8px',
                      border: '2px dashed #cbd5e1', backgroundColor: '#ffffff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', flexShrink: 0
                    }}>
                      {schoolForm.signature_url ? (
                        <img
                          src={schoolForm.signature_url.startsWith('http') ? schoolForm.signature_url : `${API_BASE || 'http://localhost:8000'}${schoolForm.signature_url}`}
                          alt="Signature Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No Signature</span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Upload size={13} /> {uploadingSignature ? 'Uploading...' : 'Upload Signature PNG'}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleSignatureUpload}
                          disabled={uploadingSignature}
                        />
                      </label>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: 0 }}>
                        Digitally affixed to fee statements and formal certificates.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 4: Integrated Fee Gateway & Direct UPI Settings */}
            <div className="tech-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={18} color="var(--primary)" />
                  <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Payment Gateway & UPI Direct Collection
                  </h4>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="pill pill-emerald" style={{ fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={11} /> AES-256 Encrypted
                  </span>
                  <span className="pill pill-primary" style={{ fontSize: '11px', fontWeight: 700 }}>
                    {paymentConfig.gateway_provider || 'MANUAL'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Gateway Provider
                    </label>
                    <select
                      value={paymentConfig.gateway_provider || 'MANUAL'}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, gateway_provider: e.target.value })}
                      className="form-input"
                    >
                      <option value="MANUAL">Offline Counter / Manual Cash</option>
                      <option value="RAZORPAY">Razorpay Gateway (India UPI, Cards, NetBanking)</option>
                      <option value="STRIPE">Stripe Checkout (Global Cards & Wallets)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Receipt Number Prefix
                    </label>
                    <input
                      type="text"
                      value={paymentConfig.receipt_prefix || 'RCP'}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, receipt_prefix: e.target.value.toUpperCase() })}
                      placeholder="e.g. DPS-RCP"
                      className="form-input"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Merchant API Key / Client ID
                  </label>
                  <input
                    type="text"
                    value={paymentConfig.merchant_key || ''}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, merchant_key: e.target.value })}
                    placeholder={paymentConfig.gateway_provider === 'STRIPE' ? 'pk_live_...' : 'rzp_live_... or rzp_test_...'}
                    className="form-input"
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', margin: 0 }}>
                      Merchant Secret Key / Private Secret
                    </label>
                    {paymentConfig.has_secret && (
                      <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>
                        ✓ Stored & Encrypted in Vault
                      </span>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showSecret ? 'text' : 'password'}
                      value={paymentConfig.merchant_secret || ''}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, merchant_secret: e.target.value })}
                      placeholder={paymentConfig.has_secret ? '•••••••••••••••• (Leave blank to keep current secret)' : 'Enter gateway secret key'}
                      className="form-input"
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      style={{
                        position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                        background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                        padding: '4px', display: 'flex', alignItems: 'center'
                      }}
                      title={showSecret ? 'Hide secret' : 'Show secret'}
                    >
                      {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: 0 }}>
                    Encrypted with AES-256 at rest before storage. Never transmitted in plaintext over client logs.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Official UPI VPA ID (Virtual Payment Address)
                    </label>
                    <input
                      type="text"
                      value={paymentConfig.upi_vpa || ''}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, upi_vpa: e.target.value })}
                      placeholder="schoolfees@hdfcbank"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      UPI Account Beneficiary Name
                    </label>
                    <input
                      type="text"
                      value={paymentConfig.upi_account_name || ''}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, upi_account_name: e.target.value })}
                      placeholder="Greenwood High Fee Account"
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Live Test Gateway Connection Section */}
                <div style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  marginTop: '4px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Live Gateway Connection Diagnostic
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        Perform a live handshake with {paymentConfig.gateway_provider || 'MANUAL'} servers to verify credentials.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleTestGatewayConnection}
                      disabled={testingGateway || paymentConfig.gateway_provider === 'MANUAL'}
                      className="btn-secondary"
                      style={{ fontSize: '12px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Activity size={14} className={testingGateway ? 'spin' : ''} />
                      {testingGateway ? 'Testing Connection...' : 'Test Gateway Connection'}
                    </button>
                  </div>

                  {gatewayTestResult && (
                    <div style={{
                      marginTop: '12px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: gatewayTestResult.status === 'success' ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${gatewayTestResult.status === 'success' ? '#bbf7d0' : '#fecaca'}`,
                      color: gatewayTestResult.status === 'success' ? '#166534' : '#991b1b'
                    }}>
                      {gatewayTestResult.status === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                      <span>{gatewayTestResult.message}</span>
                    </div>
                  )}
                </div>

                {paymentConfig.upi_vpa && (
                  <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '12px', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} /> QR Direct Pay: <strong>{paymentConfig.upi_vpa} ({paymentConfig.upi_account_name || 'School'})</strong>
                  </div>
                )}

                {/* School Fee Receipt Format & Custom Letterhead Uploader */}
                <div style={{ marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Fee Receipt Format & Official School Letterhead
                    </div>
                    {paymentConfig.receipt_template_url && (
                      <span className="pill pill-emerald" style={{ fontSize: '11px', fontWeight: 700 }}>
                        ✓ Custom Letterhead Active
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Upload your school's official letterhead or printed receipt format image. The system will automatically place this authentic header onto all fee receipts and render live student, dues, and transaction details.
                  </p>

                  <div style={{
                    background: '#f8fafc',
                    border: paymentConfig.receipt_template_url ? '1.5px solid #bbf7d0' : '2px dashed #cbd5e1',
                    borderRadius: '8px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '14px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      {paymentConfig.receipt_template_url ? (
                        <div style={{ width: '100px', height: '60px', background: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img
                            src={paymentConfig.receipt_template_url.startsWith('http') ? paymentConfig.receipt_template_url : `${API_BASE}${paymentConfig.receipt_template_url}`}
                            alt="Uploaded School Letterhead"
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                          />
                        </div>
                      ) : (
                        <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                          <Upload size={22} />
                        </div>
                      )}

                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {paymentConfig.receipt_template_url ? 'Official Letterhead / Format Image Attached' : 'Upload School Receipt Letterhead Image'}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                          {paymentConfig.receipt_template_url ? 'Affixed to all cashier POS receipts & downloadable PDF statements' : 'PNG, JPG, or WebP format (School letterhead header banner or full page)'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label
                        className="btn-primary"
                        style={{
                          fontSize: '12px',
                          padding: '8px 14px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          margin: 0
                        }}
                      >
                        <Upload size={14} />
                        {uploadingReceiptTemplate ? 'Uploading...' : (paymentConfig.receipt_template_url ? 'Change Letterhead Image' : 'Upload Letterhead Image')}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleReceiptTemplateUpload}
                          disabled={uploadingReceiptTemplate}
                        />
                      </label>

                      {paymentConfig.receipt_template_url && (
                        <button
                          type="button"
                          onClick={() => setPaymentConfig({ ...paymentConfig, receipt_template_url: '' })}
                          className="btn-secondary"
                          style={{ fontSize: '12px', padding: '8px 12px', color: '#dc2626' }}
                          title="Revert to standard verified CBSE template"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Optional Advanced HTML Structure */}
                  <details style={{ marginTop: '10px' }}>
                    <summary style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', cursor: 'pointer', userSelect: 'none' }}>
                      Advanced: Custom Receipt HTML Structure (Optional)
                    </summary>
                    <div style={{ marginTop: '8px' }}>
                      <textarea
                        rows={2}
                        value={paymentConfig.receipt_template_html || ''}
                        onChange={(e) => setPaymentConfig({ ...paymentConfig, receipt_template_html: e.target.value })}
                        placeholder="Leave blank for automatic standardized board fee receipt, or enter custom school HTML structure."
                        className="form-input"
                        style={{ fontFamily: 'monospace', fontSize: '11.5px' }}
                      />
                    </div>
                  </details>
                </div>
              </div>
            </div>



            {/* Bottom Save Bar */}
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button
                type="submit"
                disabled={savingSchool}
                className="btn-primary"
                style={{ padding: '12px 28px', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Save size={16} /> {savingSchool ? 'Saving Changes...' : 'Save All Settings & Gateway Config'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB 10: STAFF & CUSTOM ROLE MANAGEMENT
      ══════════════════════════════════════════ */}
      {activeTab === 'staff' && (
        <StaffManager
          schoolId={schoolId}
          onUpgradeClick={() => setActiveTab('subscription')}
        />
      )}

      {/* ══════════════════════════════════════════
          TAB 11: BULK STUDENT ROSTER UPLOAD
      ══════════════════════════════════════════ */}
      {activeTab === 'bulk_upload' && (
        <BulkStudentUpload
          schoolId={schoolId}
          onSuccess={() => {
            loadAllData();
          }}
        />
      )}

      {/* ══════════════════════════════════════════
          TAB 12: SAAS SUBSCRIPTION & PAYU BILLING
      ══════════════════════════════════════════ */}
      {activeTab === 'subscription' && (
        <PlanSelector
          currentPlan={schoolProfile?.subscription_plan || 'starter'}
          onPlanSelected={() => {
            loadSchoolProfile();
            loadStats();
          }}
        />
      )}

      {/* ══════════════════════════════════════════
          12-MODULE REAL-WORLD EXPANSION TABS
      ══════════════════════════════════════════ */}
      {activeTab === 'gate_passes' && (
        <GatePassQueue user={user} />
      )}

      {activeTab === 'visitors' && (
        <VisitorLogManager user={user} />
      )}

      {activeTab === 'datesheets' && (
        <DatesheetManager user={user} />
      )}

      {activeTab === 'almanac' && (
        <AlmanacManager user={user} />
      )}

      {activeTab === 'holidays' && (
        <HolidayManager user={user} />
      )}

      {activeTab === 'gallery' && (
        <GalleryManager user={user} />
      )}

      {activeTab === 'activities' && (
        <ActivityManager user={user} />
      )}

      {activeTab === 'profile_reviews' && (
        <PendingProfileQueue user={user} />
      )}

      {activeTab === 'branding' && (
        <BrandingManager user={user} />
      )}

      {/* MULTI-CHANNEL BROADCAST MODAL */}
      <NotificationBroadcastModal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
        user={user}
      />

      {/* ══════════════════════════════════════════
          MODAL 1: ADD / EDIT STUDENT (FULL REAL-WORLD)
      ══════════════════════════════════════════ */}
      {showAddStudent && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 37, 64, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}>
          <div className="tech-card" style={{ maxWidth: '720px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {editingStudent ? `Edit Student: ${editingStudent.name}` : 'Enroll New Student'}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Complete student documentation with family contacts, medical cards, and enrollment history.
                </p>
              </div>
              <button onClick={() => setShowAddStudent(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>

            {actionError && (
              <div style={{ background: 'var(--accent-rose-light)', color: 'var(--accent-rose)', padding: '10px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>
                {actionError}
              </div>
            )}

            <form onSubmit={handleSaveStudent}>
              {/* Photo & Identity Banner */}
              <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '32px',
                  backgroundColor: '#EEF2FF', border: '2px solid #C7D2FE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', flexShrink: 0
                }}>
                  {studentForm.photo_url ? (
                    <img
                      src={studentForm.photo_url.startsWith('http') ? studentForm.photo_url : `${API_BASE || 'http://localhost:8000'}${studentForm.photo_url}`}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <GraduationCap size={28} color="var(--primary)" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Student Photograph
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label className="btn-secondary" style={{ fontSize: '11px', padding: '6px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Upload size={13} /> {uploadingStudentPhoto ? 'Uploading...' : 'Upload Student Photo'}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingStudentPhoto(true);
                          try {
                            const res = await api.uploadFile(file);
                            setStudentForm(prev => ({ ...prev, photo_url: res.url }));
                          } catch (err) {
                            setActionError('Photo upload failed: ' + err.message);
                          } finally {
                            setUploadingStudentPhoto(false);
                          }
                        }}
                      />
                    </label>
                    {studentForm.photo_url && (
                      <button
                        type="button"
                        onClick={() => setStudentForm(prev => ({ ...prev, photo_url: '' }))}
                        className="btn-secondary"
                        style={{ fontSize: '11px', padding: '6px 10px', color: '#ef4444' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 1: Academic & Demographic Identity */}
              <div style={{ marginBottom: '18px' }}>
                <h5 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <GraduationCap size={15} /> 1. Academic & Demographic Identity
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Full Student Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={studentForm.name}
                      onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                      placeholder="e.g. Diya Sharma"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Admission No *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!!editingStudent}
                      value={studentForm.admission_no}
                      onChange={(e) => setStudentForm({ ...studentForm, admission_no: e.target.value })}
                      placeholder="ADM-2026-109"
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Grade / Class *
                    </label>
                    <input
                      type="text"
                      required
                      value={studentForm.grade}
                      onChange={(e) => setStudentForm({ ...studentForm, grade: e.target.value })}
                      placeholder="10"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Section *
                    </label>
                    <input
                      type="text"
                      required
                      value={studentForm.section}
                      onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value.toUpperCase() })}
                      placeholder="A"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Roll No
                    </label>
                    <input
                      type="text"
                      value={studentForm.roll_no || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, roll_no: e.target.value })}
                      placeholder="12"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Gender
                    </label>
                    <select
                      value={studentForm.gender || 'Male'}
                      onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}
                      className="form-input"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Date of Birth (DOB)
                    </label>
                    <input
                      type="date"
                      value={studentForm.dob ? studentForm.dob.split('T')[0] : ''}
                      onChange={(e) => setStudentForm({ ...studentForm, dob: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Enrollment Status
                    </label>
                    <select
                      value={studentForm.is_active !== false ? 'true' : 'false'}
                      onChange={(e) => setStudentForm({ ...studentForm, is_active: e.target.value === 'true' })}
                      className="form-input"
                    >
                      <option value="true">Active Student</option>
                      <option value="false">Inactive / Transferred</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Family & Guardian Directory */}
              <div style={{ marginBottom: '18px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                <h5 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={15} /> 2. Family & Guardian Directory (Auto Parent Provisioning)
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Father / Guardian Name
                    </label>
                    <input
                      type="text"
                      value={studentForm.father_name || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, father_name: e.target.value })}
                      placeholder="e.g. Rajesh Sharma"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Father Phone (Links Parent Mobile App)
                    </label>
                    <input
                      type="text"
                      value={studentForm.father_phone || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, father_phone: e.target.value })}
                      placeholder="10-digit mobile number"
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Mother Name
                    </label>
                    <input
                      type="text"
                      value={studentForm.mother_name || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, mother_name: e.target.value })}
                      placeholder="e.g. Meenakshi Sharma"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Mother Phone
                    </label>
                    <input
                      type="text"
                      value={studentForm.mother_phone || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, mother_phone: e.target.value })}
                      placeholder="10-digit mobile number"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Emergency Contacts & Health Card */}
              <div style={{ marginBottom: '18px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                <h5 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HeartPulse size={15} /> 3. Emergency Contacts & Health Card
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Blood Group
                    </label>
                    <select
                      value={studentForm.blood_group || 'O+'}
                      onChange={(e) => setStudentForm({ ...studentForm, blood_group: e.target.value })}
                      className="form-input"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Emergency Contact Person
                    </label>
                    <input
                      type="text"
                      value={studentForm.emergency_contact_name || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, emergency_contact_name: e.target.value })}
                      placeholder="e.g. Uncle / Doctor"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Emergency Phone
                    </label>
                    <input
                      type="text"
                      value={studentForm.emergency_contact_phone || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, emergency_contact_phone: e.target.value })}
                      placeholder="Emergency contact phone"
                      className="form-input"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Medical Notes / Allergies / Health Advisories
                  </label>
                  <input
                    type="text"
                    value={studentForm.medical_notes || ''}
                    onChange={(e) => setStudentForm({ ...studentForm, medical_notes: e.target.value })}
                    placeholder="e.g. Asthma inhaler kept in infirmary, peanut allergy, wears corrective lenses"
                    className="form-input"
                  />
                </div>
              </div>

              {/* SECTION 4: Residential & Transfer History */}
              <div style={{ marginBottom: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                <h5 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={15} /> 4. Address & Prior Academic Records
                </h5>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Residential Street Address
                  </label>
                  <textarea
                    rows={2}
                    value={studentForm.address || ''}
                    onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
                    placeholder="House No, Street, Landmark, Pin Code"
                    className="form-input"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Previous School Attended / Transfer Certificate (TC) Details
                  </label>
                  <input
                    type="text"
                    value={studentForm.previous_school || ''}
                    onChange={(e) => setStudentForm({ ...studentForm, previous_school: e.target.value })}
                    placeholder="e.g. St. Xavier's High School (TC No. 49021 issued June 2024)"
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button type="button" onClick={() => setShowAddStudent(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 24px', fontWeight: 700 }}>
                  {editingStudent ? 'Update Student Record' : 'Save Student Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL: STUDENT DOSSIER INSPECTION DRAWER
      ══════════════════════════════════════════ */}
      {showDossierModal && dossierStudent && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 37, 64, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}>
          <div className="tech-card" style={{ maxWidth: '760px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '0', background: '#ffffff', borderRadius: '16px', overflow: 'hidden' }}>
            {/* Dossier Header Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
              padding: '24px 28px',
              color: '#ffffff',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <div style={{
                  width: '76px', height: '76px', borderRadius: '38px',
                  backgroundColor: '#ffffff', border: '3px solid rgba(255,255,255,0.85)',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', flexShrink: 0
                }}>
                  {dossierStudent.photo_url ? (
                    <img
                      src={dossierStudent.photo_url.startsWith('http') ? dossierStudent.photo_url : `${API_BASE || 'http://localhost:8000'}${dossierStudent.photo_url}`}
                      alt={dossierStudent.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary)' }}>
                      {(dossierStudent.name || 'S')[0].toUpperCase()}
                    </span>
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="pill" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '11px', fontWeight: 700 }}>
                      Grade {dossierStudent.grade}-{dossierStudent.section}
                    </span>
                    <span className="pill" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}>
                      Roll #{dossierStudent.roll_no || '—'}
                    </span>
                    {dossierStudent.is_active !== false ? (
                      <span className="pill" style={{ background: '#10b981', color: '#fff', fontSize: '11px', fontWeight: 700 }}>
                        ● Active Student
                      </span>
                    ) : (
                      <span className="pill" style={{ background: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: 700 }}>
                        ○ Inactive
                      </span>
                    )}
                  </div>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0 2px 0', color: '#ffffff' }}>
                    {dossierStudent.name}
                  </h2>
                  <div style={{ fontSize: '13px', opacity: 0.85 }}>
                    Admission ID: <strong>{dossierStudent.admission_no}</strong> • Gender: <strong>{dossierStudent.gender || 'Not specified'}</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowDossierModal(false)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Dossier Body Content */}
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {loadingDossier && (
                <div style={{ padding: '8px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Loading student details...
                </div>
              )}

              {/* 4-Box Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {/* 1. Personal Demographic Profile */}
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '13.5px', color: 'var(--text-primary)', marginBottom: '12px' }}>
                    <GraduationCap size={16} color="var(--primary)" /> Student Demographic Profile
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Date of Birth (DOB):</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{dossierStudent.dob || 'Not recorded'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Assigned Class & Sec:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>Grade {dossierStudent.grade} - Section {dossierStudent.section}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Residential Address:</span>
                      <span style={{ textAlign: 'right', maxWidth: '180px', color: 'var(--text-primary)' }}>{dossierStudent.address || 'Address on file'}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Family & Guardian Directory */}
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '13.5px', color: 'var(--text-primary)', marginBottom: '12px' }}>
                    <Users size={16} color="var(--primary)" /> Family & Guardian Directory
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Father / Guardian:</span>
                      <div>
                        <strong>{dossierStudent.father_name || '—'}</strong>
                        {dossierStudent.father_phone && (
                          <a href={`tel:${dossierStudent.father_phone}`} style={{ marginLeft: '6px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                            ({dossierStudent.father_phone})
                          </a>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Mother:</span>
                      <div>
                        <strong>{dossierStudent.mother_name || '—'}</strong>
                        {dossierStudent.mother_phone && (
                          <a href={`tel:${dossierStudent.mother_phone}`} style={{ marginLeft: '6px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                            ({dossierStudent.mother_phone})
                          </a>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Emergency Contact:</span>
                      <strong style={{ color: '#b91c1c' }}>
                        {dossierStudent.emergency_contact_name || 'Guardian'}: {dossierStudent.emergency_contact_phone || '—'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 3. Health & Medical Notes */}
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '13.5px', color: 'var(--text-primary)', marginBottom: '12px' }}>
                    <HeartPulse size={16} color="#ef4444" /> Health & Medical Card
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Blood Group:</span>
                      <span className="pill" style={{ background: '#fef2f2', color: '#b91c1c', fontWeight: 800 }}>
                        {dossierStudent.blood_group || 'O+'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Medical Notes / Allergies:</span>
                      <div style={{ padding: '8px 10px', background: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        {dossierStudent.medical_notes || 'No chronic health conditions or dietary allergies reported.'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Prior Academic & Transfer Record */}
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '13.5px', color: 'var(--text-primary)', marginBottom: '12px' }}>
                    <Award size={16} color="#f59e0b" /> Academic Transfer & History
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Previous School Attended:</span>
                      <div style={{ padding: '8px 10px', background: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        {dossierStudent.previous_school || 'First-time institutional enrollment.'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Enrollment Record Created:</span>
                      <span style={{ color: 'var(--text-primary)', fontSize: '12px' }}>{dossierStudent.created_at ? new Date(dossierStudent.created_at).toLocaleDateString() : 'Active Term'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dossier Bottom Action Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setShowDossierModal(false);
                      onOpenReportCard(dossierStudent.id, dossierStudent.name);
                    }}
                    className="btn-secondary"
                    style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)' }}
                  >
                    <FileText size={14} /> Report Card
                  </button>
                  <button
                    onClick={() => window.open(api.getProgressLetterHtmlUrl(dossierStudent.id), '_blank')}
                    className="btn-secondary"
                    style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px', color: '#059669' }}
                  >
                    <Printer size={14} /> Progress Letter (A4)
                  </button>
                  <button
                    onClick={() => {
                      const rawPhone = (dossierStudent.father_phone || dossierStudent.mother_phone || dossierStudent.emergency_contact_phone || '').replace(/[^0-9]/g, '');
                      const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
                      if (!cleanPhone) {
                        alert(`No contact phone number recorded for ${dossierStudent.name}'s parents. Please edit student record to add a phone number.`);
                        return;
                      }
                      const letterUrl = api.getProgressLetterHtmlUrl(dossierStudent.id);
                      const text = encodeURIComponent(
                        `Dear Parent, greetings from school administration. Here is the academic progress report for your ward ${dossierStudent.name} (Class ${dossierStudent.grade}-${dossierStudent.section}, Roll No: ${dossierStudent.roll_no || '-'}). Official Progress Letter: ${letterUrl}`
                      );
                      window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
                    }}
                    className="btn-secondary"
                    style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', borderColor: '#bbf7d0', background: '#f0fdf4' }}
                    title="Send official student report card directly to parent on WhatsApp"
                  >
                    <MessageCircle size={14} /> Send WhatsApp to Parent
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setShowDossierModal(false);
                      setEditingStudent(dossierStudent);
                      setStudentForm({
                        name: dossierStudent.name || '',
                        admission_no: dossierStudent.admission_no || '',
                        grade: dossierStudent.grade || '',
                        section: dossierStudent.section || '',
                        roll_no: dossierStudent.roll_no || '',
                        gender: dossierStudent.gender || 'Male',
                        dob: dossierStudent.dob || '',
                        photo_url: dossierStudent.photo_url || '',
                        father_name: dossierStudent.father_name || '',
                        father_phone: dossierStudent.father_phone || '',
                        mother_name: dossierStudent.mother_name || '',
                        mother_phone: dossierStudent.mother_phone || '',
                        blood_group: dossierStudent.blood_group || 'O+',
                        emergency_contact_name: dossierStudent.emergency_contact_name || '',
                        emergency_contact_phone: dossierStudent.emergency_contact_phone || '',
                        address: dossierStudent.address || '',
                        medical_notes: dossierStudent.medical_notes || '',
                        previous_school: dossierStudent.previous_school || '',
                        is_active: dossierStudent.is_active !== undefined ? dossierStudent.is_active : true,
                      });
                      setShowAddStudent(true);
                    }}
                    className="btn-secondary"
                    style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Edit2 size={14} /> Edit Student
                  </button>
                  <button
                    onClick={() => setShowDossierModal(false)}
                    className="btn-primary"
                    style={{ fontSize: '12.5px' }}
                  >
                    Close Dossier
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL: REGISTER NEW SCHOOL / BRANCH
      ══════════════════════════════════════════ */}
      {showRegisterSchoolModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 37, 64, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}>
          <div className="tech-card" style={{ maxWidth: '520px', width: '100%', padding: '28px', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Register Branch Campus
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Register a new school campus or branch.
                </p>
              </div>
              <button onClick={() => setShowRegisterSchoolModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>

            <form onSubmit={handleRegisterNewBranch}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Branch / Institution Name *
                </label>
                <input
                  type="text"
                  required
                  value={registerSchoolForm.name}
                  onChange={(e) => setRegisterSchoolForm({ ...registerSchoolForm, name: e.target.value })}
                  placeholder="e.g. Delhi Public School (South Campus)"
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Affiliation Board
                  </label>
                  <select
                    value={registerSchoolForm.board}
                    onChange={(e) => setRegisterSchoolForm({ ...registerSchoolForm, board: e.target.value })}
                    className="form-input"
                  >
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                    <option value="Cambridge">Cambridge</option>
                    <option value="IB">IB</option>
                    <option value="State Board">State Board</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Official School Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={registerSchoolForm.email}
                    onChange={(e) => setRegisterSchoolForm({ ...registerSchoolForm, email: e.target.value })}
                    placeholder="southcampus@school.edu"
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    City
                  </label>
                  <input
                    type="text"
                    value={registerSchoolForm.city}
                    onChange={(e) => setRegisterSchoolForm({ ...registerSchoolForm, city: e.target.value })}
                    placeholder="New Delhi"
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Helpline Phone
                  </label>
                  <input
                    type="text"
                    value={registerSchoolForm.phone}
                    onChange={(e) => setRegisterSchoolForm({ ...registerSchoolForm, phone: e.target.value })}
                    placeholder="+91 11 4500 0000"
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary)' }}>Initial Campus Administrator Account:</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '8px' }}>
                  <input
                    type="text"
                    required
                    value={registerSchoolForm.admin_name}
                    onChange={(e) => setRegisterSchoolForm({ ...registerSchoolForm, admin_name: e.target.value })}
                    placeholder="Admin Full Name"
                    className="form-input"
                  />
                  <input
                    type="email"
                    required
                    value={registerSchoolForm.admin_email}
                    onChange={(e) => setRegisterSchoolForm({ ...registerSchoolForm, admin_email: e.target.value })}
                    placeholder="Admin Login Email"
                    className="form-input"
                  />
                  <input
                    type="password"
                    value={registerSchoolForm.admin_password}
                    onChange={(e) => setRegisterSchoolForm({ ...registerSchoolForm, admin_password: e.target.value })}
                    placeholder="Password (blank=auto)"
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowRegisterSchoolModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={registeringSchool} className="btn-primary">
                  {registeringSchool ? 'Provisioning...' : 'Provision Branch Campus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL 1B: 2-STAGE BULK STUDENT IMPORT
      ══════════════════════════════════════════ */}
      {showBulkUpload && (
        <BulkStudentModal
          schoolId={schoolId}
          onClose={() => setShowBulkUpload(false)}
          onSuccess={(msg) => {
            setActionSuccess(msg);
            loadAllData();
          }}
        />
      )}

      {/* ══════════════════════════════════════════
          MODAL 2: ADD TEACHER
      ══════════════════════════════════════════ */}
      {showAddTeacher && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 37, 64, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}>
          <div className="tech-card" style={{ maxWidth: '440px', width: '100%', padding: '28px', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Add Teaching Faculty Member
              </h3>
              <button onClick={() => setShowAddTeacher(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>

            <form onSubmit={handleCreateTeacher}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={teacherForm.full_name}
                  onChange={(e) => setTeacherForm({ ...teacherForm, full_name: e.target.value })}
                  placeholder="e.g., Anjali Verma"
                  className="form-input"
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Work Email *
                </label>
                <input
                  type="email"
                  required
                  value={teacherForm.email}
                  onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                  placeholder="anjali.verma@dpis.edu"
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={teacherForm.phone}
                    onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Initial Password
                  </label>
                  <input
                    type="text"
                    value={teacherForm.password}
                    onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                    placeholder="Leave blank to auto-generate password"
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowAddTeacher(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL 2B: BULK FACULTY UPLOAD
      ══════════════════════════════════════════ */}
      {showBulkFacultyUpload && activeTab === 'faculty' && (
        <BulkFacultyUpload
          schoolId={schoolId}
          onClose={() => setShowBulkFacultyUpload(false)}
          onSuccess={() => {
            loadAllData();
            setShowBulkFacultyUpload(false);
          }}
        />
      )}

      {/* ══════════════════════════════════════════
          MODAL 3: ASSIGN TEACHER TO CLASS
      ══════════════════════════════════════════ */}
      {showAssignTeacher && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 37, 64, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}>
          <div className="tech-card" style={{ maxWidth: '440px', width: '100%', padding: '28px', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Assign Teacher to Class
              </h3>
              <button onClick={() => setShowAssignTeacher(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>

            <form onSubmit={handleAssignTeacher}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Select Faculty Member *
                </label>
                <select
                  required
                  value={assignForm.teacher_user_id}
                  onChange={(e) => setAssignForm({ ...assignForm, teacher_user_id: e.target.value })}
                  className="form-input"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name} ({t.email})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Grade
                  </label>
                  <input
                    type="text"
                    value={assignForm.grade}
                    onChange={(e) => setAssignForm({ ...assignForm, grade: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Section
                  </label>
                  <input
                    type="text"
                    value={assignForm.section}
                    onChange={(e) => setAssignForm({ ...assignForm, section: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowAssignTeacher(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL 4: CREATE EXAM
      ══════════════════════════════════════════ */}
      {showAddExam && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 37, 64, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}>
          <div className="tech-card" style={{ maxWidth: '440px', width: '100%', padding: '28px', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Schedule Examination Cycle
              </h3>
              <button onClick={() => setShowAddExam(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>

            <form onSubmit={handleCreateExam}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Exam Title *
                </label>
                <input
                  type="text"
                  required
                  value={examForm.name}
                  onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                  placeholder="e.g. Final Board Mock 2026"
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Academic Term
                  </label>
                  <input
                    type="text"
                    value={examForm.term}
                    onChange={(e) => setExamForm({ ...examForm, term: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Exam Date
                  </label>
                  <input
                    type="date"
                    value={examForm.date}
                    onChange={(e) => setExamForm({ ...examForm, date: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Target Grade
                  </label>
                  <input
                    type="text"
                    value={examForm.grade}
                    onChange={(e) => setExamForm({ ...examForm, grade: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Total Marks
                  </label>
                  <input
                    type="number"
                    value={examForm.total_marks}
                    onChange={(e) => setExamForm({ ...examForm, total_marks: parseFloat(e.target.value) || 100 })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowAddExam(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Publish Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL 5: ADD SUBJECT
      ══════════════════════════════════════════ */}
      {showAddSubject && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 37, 64, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}>
          <div className="tech-card" style={{ maxWidth: '400px', width: '100%', padding: '28px', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Add Curriculum Subject
              </h3>
              <button onClick={() => setShowAddSubject(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  placeholder="e.g. Artificial Intelligence"
                  className="form-input"
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Curriculum Code
                </label>
                <input
                  type="text"
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                  placeholder="e.g. AI-417"
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowAddSubject(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ══════════════════════════════════════════
          MODAL 6: EDIT FACULTY
      ══════════════════════════════════════════ */}
      {editingTeacher && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 37, 64, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}>
          <div className="tech-card" style={{ maxWidth: '440px', width: '100%', padding: '28px', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Edit Faculty Member
              </h3>
              <button onClick={() => setEditingTeacher(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>

            <form onSubmit={handleUpdateTeacher}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editTeacherForm.full_name}
                  onChange={(e) => setEditTeacherForm({ ...editTeacherForm, full_name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={editTeacherForm.email}
                  onChange={(e) => setEditTeacherForm({ ...editTeacherForm, email: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editTeacherForm.phone}
                    onChange={(e) => setEditTeacherForm({ ...editTeacherForm, phone: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Role
                  </label>
                  <select
                    value={editTeacherForm.role}
                    onChange={(e) => setEditTeacherForm({ ...editTeacherForm, role: e.target.value })}
                    className="form-input"
                  >
                    <option value="Teacher">Teacher</option>
                    <option value="Admin">Admin</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setEditingTeacher(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL 7: EDIT EXAM
      ══════════════════════════════════════════ */}
      {editingExam && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 37, 64, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}>
          <div className="tech-card" style={{ maxWidth: '440px', width: '100%', padding: '28px', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Edit Exam Cycle
              </h3>
              <button onClick={() => setEditingExam(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>

            <form onSubmit={handleUpdateExam}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Exam Title *
                </label>
                <input
                  type="text"
                  required
                  value={editExamForm.name}
                  onChange={(e) => setEditExamForm({ ...editExamForm, name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Academic Term
                  </label>
                  <input
                    type="text"
                    value={editExamForm.term}
                    onChange={(e) => setEditExamForm({ ...editExamForm, term: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Exam Date
                  </label>
                  <input
                    type="date"
                    value={editExamForm.date}
                    onChange={(e) => setEditExamForm({ ...editExamForm, date: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Target Grade
                  </label>
                  <input
                    type="text"
                    value={editExamForm.grade}
                    onChange={(e) => setEditExamForm({ ...editExamForm, grade: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Total Marks
                  </label>
                  <input
                    type="number"
                    value={editExamForm.total_marks}
                    onChange={(e) => setEditExamForm({ ...editExamForm, total_marks: parseFloat(e.target.value) || 100 })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setEditingExam(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL 8: EDIT SUBJECT
      ══════════════════════════════════════════ */}
      {editingSubject && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 37, 64, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}>
          <div className="tech-card" style={{ maxWidth: '400px', width: '100%', padding: '28px', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Edit Curriculum Subject
              </h3>
              <button onClick={() => setEditingSubject(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubject}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  value={editSubjectForm.name}
                  onChange={(e) => setEditSubjectForm({ ...editSubjectForm, name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Curriculum Code
                </label>
                <input
                  type="text"
                  value={editSubjectForm.code}
                  onChange={(e) => setEditSubjectForm({ ...editSubjectForm, code: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setEditingSubject(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL: PRINCIPAL'S WEEKLY EXECUTIVE AI REPORT (FEATURE 10)
      ══════════════════════════════════════════ */}
      {showWeeklyReportModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 37, 64, 0.55)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}>
          <div className="tech-card" style={{
            maxWidth: '920px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #c7d2fe',
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
              padding: '24px 28px',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background: 'rgba(255, 255, 255, 0.18)',
                    color: '#e0e7ff',
                    border: '1px solid rgba(255, 255, 255, 0.25)'
                  }}>
                    <Sparkles size={13} color="#fbbf24" /> Principal's Intelligence Briefing
                  </span>
                  {weeklyReport?.health_score && (
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 800,
                      background: 'rgba(16, 185, 129, 0.25)',
                      color: '#6ee7b7',
                      border: '1px solid rgba(110, 231, 183, 0.4)'
                    }}>
                      Health Score: {weeklyReport.health_score}/100
                    </span>
                  )}
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#ffffff' }}>
                  Weekly School Performance Brief
                </h2>
                <p style={{ fontSize: '13px', margin: '4px 0 0 0', color: '#c7d2fe' }}>
                  {weeklyReport ? `${weeklyReport.school?.name} • 7-Day Cycle ending ${weeklyReport.period?.end_date}` : 'Preparing weekly executive summary...'}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => window.print()}
                  className="btn-secondary"
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    borderColor: 'rgba(255, 255, 255, 0.25)',
                    color: '#ffffff',
                    fontSize: '13px',
                    padding: '8px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Print or Save PDF"
                >
                  <Printer size={15} /> Print Brief
                </button>
                <button
                  onClick={() => setShowWeeklyReportModal(false)}
                  style={{
                    border: 'none',
                    background: 'rgba(255, 255, 255, 0.12)',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    padding: '8px',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '28px', overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
              {loadingWeeklyReport ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div className="spinner" style={{ margin: '0 auto 16px', width: '36px', height: '36px' }} />
                  <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '14px' }}>
                    Compiling attendance, fee collection, and academic performance metrics...
                  </p>
                </div>
              ) : weeklyReport ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                  {/* KPI metric strip */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '14px'
                  }}>
                    <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Weekly Attendance
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: weeklyReport.kpis?.attendance_rate >= 85 ? '#059669' : '#d97706' }}>
                        {weeklyReport.kpis?.attendance_rate}%
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                        7-day average rate
                      </div>
                    </div>

                    <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Fee Receipts (7D)
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: '#2563eb' }}>
                        ₹{Number(weeklyReport.kpis?.weekly_collected_amount || 0).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                        ₹{Number(weeklyReport.kpis?.total_pending_amount || 0).toLocaleString('en-IN')} term pending
                      </div>
                    </div>

                    <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Intervention Cases
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: weeklyReport.kpis?.critical_risks > 0 ? '#dc2626' : '#059669' }}>
                        {weeklyReport.kpis?.critical_risks + weeklyReport.kpis?.high_risks}
                      </div>
                      <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600, marginTop: '4px' }}>
                        {weeklyReport.kpis?.critical_risks} Critical • {weeklyReport.kpis?.high_risks} High
                      </div>
                    </div>

                    <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Inquiry Velocity
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: '#4f46e5' }}>
                        {weeklyReport.kpis?.resolved_tickets}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                        {weeklyReport.kpis?.open_tickets} pending inquiries
                      </div>
                    </div>
                  </div>

                  {/* 7-Day Attendance Pulse Strip */}
                  {weeklyReport.attendance_pulse && weeklyReport.attendance_pulse.length > 0 && (
                    <div style={{ background: '#ffffff', padding: '18px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingUp size={16} color="#4f46e5" /> 7-Day Student Attendance Pulse
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${weeklyReport.attendance_pulse.length}, 1fr)`, gap: '10px' }}>
                        {weeklyReport.attendance_pulse.map((day, idx) => (
                          <div key={idx} style={{ textAlign: 'center', padding: '10px 6px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>{day.day_name}</div>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: day.rate >= 90 ? '#059669' : day.rate >= 75 ? '#d97706' : '#dc2626', margin: '4px 0' }}>
                              {day.rate}%
                            </div>
                            <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.min(100, day.rate)}%`, background: day.rate >= 90 ? '#10b981' : '#f59e0b', borderRadius: '2px' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Gemini Executive Summary */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)',
                    border: '1.5px solid #c7d2fe',
                    borderRadius: '14px',
                    padding: '22px',
                    position: 'relative',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <Sparkles size={18} color="#4f46e5" />
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#312e81', letterSpacing: '-0.01em' }}>
                        Executive Strategic Synthesis
                      </span>
                    </div>
                    <p style={{
                      fontSize: '14px',
                      lineHeight: '1.65',
                      color: '#1e293b',
                      margin: 0,
                      whiteSpace: 'pre-line'
                    }}>
                      {weeklyReport.ai_briefing?.executive_summary}
                    </p>
                  </div>

                  {/* Highlights & Action Items 2-Column */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
                    {/* Key Highlights */}
                    <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#047857', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={16} color="#059669" /> Notable Highlights
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(weeklyReport.ai_briefing?.key_highlights || []).map((h, i) => (
                          <li key={i} style={{ fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Items for Leadership */}
                    <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #fed7aa' }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#c2410c', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangle size={16} color="#ea580c" /> Strategic Action Items
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(weeklyReport.ai_briefing?.action_items || []).map((a, i) => (
                          <li key={i} style={{ fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                  Unable to load weekly executive report.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              background: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Technula EduFlow Enterprise Analytics • Confidential Leadership Document
              </span>
              <button
                type="button"
                onClick={() => setShowWeeklyReportModal(false)}
                className="btn-secondary"
                style={{ padding: '8px 20px' }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
