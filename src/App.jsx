import React, { useState, useEffect } from 'react';
import { getUser, getToken, logout } from './api';
import Navbar from './components/shared/Navbar';
import LoginModal from './components/shared/LoginModal';
import ForceResetPasswordScreen from './components/shared/ForceResetPasswordScreen';
import AdminDashboard from './components/admin/AdminDashboard';
import SuperAdminDashboard from './components/superadmin/SuperAdminDashboard';
import TeacherPWA from './components/teacher/TeacherPWA';
import RiskCenter from './components/shared/RiskCenter';
import TicketsCenter from './components/communication/TicketsCenter';
import AnnouncementsCenter from './components/communication/AnnouncementsCenter';
import ReportCardModal from './components/shared/ReportCardModal';
import ParentPortal from './components/parent/ParentPortal';
import StudentPortal from './components/student/StudentPortal';
import ExamSheetManager from './components/admin/ExamSheetManager';
import CertificatesManager from './components/admin/CertificatesManager';
import PTCManager from './components/admin/PTCManager';
import GateSecurityScanner from './components/security/GateSecurityScanner';
import { Calendar, CheckSquare, AlertTriangle, MessageSquare, Megaphone, Smartphone, ArrowLeft } from 'lucide-react';

import PublicPrivacyPolicy from './components/public/PublicPrivacyPolicy';

export default function App() {
  const getDefaultTabForRole = (role) => {
    const r = (role || '').toLowerCase();
    if (r === 'superadmin') return 'superadmin_overview';
    if (r.includes('teacher')) return 'teacher_attendance';
    if (r === 'admin' || r === 'principal' || r === 'vice_principal' || r === 'staff' || r === 'accountant') return 'admin_overview';
    if (r === 'parent') return 'parent_portal';
    if (r === 'student') return 'student_portal';
    if (['security', 'gatestaff'].includes(r)) return 'gate_scanner';
    return 'announcements';
  };

  const getValidTabsForRole = (role) => {
    const r = (role || '').toLowerCase();
    if (r === 'superadmin') return ['superadmin_overview'];
    if (r.includes('teacher')) return ['teacher_attendance', 'teacher_marks', 'exam_sheets', 'ptc_admin', 'risk_cases', 'announcements'];
    if (r === 'admin' || r === 'principal' || r === 'vice_principal' || r === 'staff' || r === 'accountant') {
      return ['admin_overview', 'risk_cases', 'exam_sheets', 'certificates', 'ptc_admin', 'tickets', 'announcements', 'gate_scanner'];
    }
    if (r === 'parent') return ['parent_portal', 'announcements', 'tickets'];
    if (r === 'student') return ['student_portal', 'announcements'];
    if (['security', 'gatestaff'].includes(r)) return ['gate_scanner'];
    return ['announcements'];
  };

  const [activeTab, setActiveTabRaw] = useState(() => {
    const hash = (window.location.hash || '').replace('#', '').trim();
    const saved = localStorage.getItem('eduflow_active_tab');
    return hash || saved || 'default';
  });

  const setActiveTab = (tab) => {
    setActiveTabRaw(tab);
    try {
      localStorage.setItem('eduflow_active_tab', tab);
      window.history.replaceState(null, '', `#${tab}`);
    } catch (e) {}
  };

  const [selectedReportCard, setSelectedReportCard] = useState(null);
  const [originalSuperAdmin, setOriginalSuperAdmin] = useState(null);

  // Public Privacy & Data Deletion Route (Google Play Store verification compliance)
  const [viewingPrivacy, setViewingPrivacy] = useState(() => {
    const p = (window.location.pathname || '').toLowerCase();
    const s = (window.location.search || '').toLowerCase();
    const h = (window.location.hash || '').toLowerCase();
    return p.includes('privacy') || p.includes('data-deletion') || s.includes('privacy') || h.includes('privacy');
  });

  if (viewingPrivacy) {
    return (
      <PublicPrivacyPolicy
        onBack={() => {
          setViewingPrivacy(false);
          window.history.pushState({}, '', '/');
        }}
      />
    );
  }

  // Restore and validate active tab based on role and stored session
  useEffect(() => {
    if (!user) return;
    const role = (user.role || '').toLowerCase();
    const defaultTab = getDefaultTabForRole(role);
    const validTabs = getValidTabsForRole(role);

    const hash = (window.location.hash || '').replace('#', '').trim();
    const saved = localStorage.getItem('eduflow_active_tab');
    const candidate = hash || saved || activeTab;

    if (candidate && validTabs.includes(candidate)) {
      setActiveTabRaw(candidate);
      try {
        localStorage.setItem('eduflow_active_tab', candidate);
        window.history.replaceState(null, '', `#${candidate}`);
      } catch (e) {}
    } else {
      setActiveTab(defaultTab);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    try {
      localStorage.removeItem('eduflow_active_tab');
      localStorage.removeItem('eduflow_admin_tab');
      localStorage.removeItem('eduflow_fees_subtab');
      window.history.replaceState(null, '', window.location.pathname);
    } catch (e) {}
    setUser(null);
    setOriginalSuperAdmin(null);
  };

  const handleOpenReportCard = (studentId, studentName, examId) => {
    setSelectedReportCard({ studentId, studentName, examId });
  };

  const handleImpersonateSuccess = (impersonatedUser) => {
    setOriginalSuperAdmin(user);
    setUser(impersonatedUser);
  };

  const handleExitImpersonation = () => {
    if (originalSuperAdmin) {
      setUser(originalSuperAdmin);
      setOriginalSuperAdmin(null);
      setActiveTab('superadmin_overview');
    } else {
      window.location.reload();
    }
  };

  if (!user || !getToken()) {
    return <LoginModal onLoginSuccess={(u) => setUser(u)} onOpenPrivacy={() => setViewingPrivacy(true)} />;
  }

  if (user && user.must_reset_password) {
    return (
      <ForceResetPasswordScreen
        user={user}
        onPasswordChanged={(updatedUser) => setUser(updatedUser)}
        onLogout={handleLogout}
      />
    );
  }

  const isSuperAdmin = (user.role || '').toLowerCase() === 'superadmin';
  const isTeacher = (user.role || '').toLowerCase().includes('teacher');
  const isAdmin = ['admin', 'principal', 'vice_principal', 'staff', 'accountant'].includes((user.role || '').toLowerCase());
  const isParent = (user.role || '').toLowerCase() === 'parent';
  const isStudent = (user.role || '').toLowerCase() === 'student';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>
      {/* Impersonation Alert Banner */}
      {originalSuperAdmin && (
        <div style={{
          background: '#f59e0b', color: '#78350f', padding: '10px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontWeight: '700', fontSize: '13px', zIndex: 1000
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
            <span>Active Impersonation: You are currently viewing <strong>{user.school_name || 'School'}</strong> as Administrator ({user.full_name}).</span>
          </div>
          <button
            onClick={handleExitImpersonation}
            style={{
              padding: '6px 14px', background: '#78350f', color: '#fff',
              border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700',
              display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px'
            }}
          >
            <ArrowLeft size={14} /> Exit Impersonation & Return to SaaS Platform
          </button>
        </div>
      )}

      <Navbar
        user={user}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main style={{ flex: 1 }}>

        {/* SuperAdmin Master SaaS View */}
        {(isSuperAdmin || activeTab === 'superadmin_overview') && (
          <SuperAdminDashboard
            user={user}
            onImpersonateSuccess={handleImpersonateSuccess}
          />
        )}

        {/* Tab Views */}
        {activeTab === 'admin_overview' && !isSuperAdmin && (
          <AdminDashboard user={user} onOpenReportCard={handleOpenReportCard} />
        )}

        {activeTab === 'teacher_attendance' && (
          <TeacherPWA user={user} onOpenReportCard={handleOpenReportCard} initialSubTab="attendance" />
        )}

        {activeTab === 'teacher_marks' && (
          <TeacherPWA user={user} onOpenReportCard={handleOpenReportCard} initialSubTab="marks" />
        )}

        {activeTab === 'parent_portal' && (
          <ParentPortal user={user} onOpenReportCard={handleOpenReportCard} />
        )}

        {activeTab === 'student_portal' && (
          <StudentPortal user={user} onOpenReportCard={handleOpenReportCard} />
        )}

        {activeTab === 'risk_cases' && (
          <RiskCenter user={user} />
        )}

        {activeTab === 'exam_sheets' && (
          <ExamSheetManager user={user} />
        )}

        {activeTab === 'certificates' && (
          <CertificatesManager user={user} />
        )}

        {activeTab === 'ptc_admin' && (
          <PTCManager user={user} />
        )}

        {activeTab === 'tickets' && (
          <TicketsCenter user={user} />
        )}

        {activeTab === 'announcements' && (
          <AnnouncementsCenter user={user} />
        )}

        {activeTab === 'gate_scanner' && (
          <GateSecurityScanner user={user} onLogout={handleLogout} />
        )}
      </main>

      {/* Report Card Viewer Modal */}
      {selectedReportCard && (
        <ReportCardModal
          studentId={selectedReportCard.studentId}
          studentName={selectedReportCard.studentName}
          examId={selectedReportCard.examId}
          onClose={() => setSelectedReportCard(null)}
        />
      )}

      {/* PWA Bottom Navigation on Mobile */}
      {isTeacher && (
        <div className="pwa-bottom-bar">
          <button
            onClick={() => setActiveTab('teacher_attendance')}
            style={{
              border: 'none',
              background: 'transparent',
              color: activeTab === 'teacher_attendance' ? 'var(--primary)' : 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            <CheckSquare size={20} />
            <span>Attendance</span>
          </button>

          <button
            onClick={() => setActiveTab('teacher_marks')}
            style={{
              border: 'none',
              background: 'transparent',
              color: activeTab === 'teacher_marks' ? 'var(--primary)' : 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            <Calendar size={20} />
            <span>Marks</span>
          </button>

          <button
            onClick={() => setActiveTab('risk_cases')}
            style={{
              border: 'none',
              background: 'transparent',
              color: activeTab === 'risk_cases' ? 'var(--primary)' : 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            <AlertTriangle size={20} />
            <span>Risks</span>
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            style={{
              border: 'none',
              background: 'transparent',
              color: activeTab === 'announcements' ? 'var(--primary)' : 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            <Megaphone size={20} />
            <span>Notices</span>
          </button>
        </div>
      )}
    </div>
  );
}
