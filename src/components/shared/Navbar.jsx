import React, { useState } from 'react';
import { LogOut, Bell, Shield, BookOpen, Smartphone, School, Building2, Key, FileText, ArrowLeft, Menu, X, Ticket, QrCode } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar({ user, onLogout, activeTab, setActiveTab, unreadCount = 0 }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const roleLower = (user?.role || '').toLowerCase();
  const isSuperAdmin = roleLower === 'superadmin';
  const isTeacher = roleLower.includes('teacher');
  const isAdmin = roleLower === 'admin' || roleLower === 'principal' || roleLower === 'vice_principal' || roleLower === 'staff' || roleLower === 'accountant';
  const isParent = roleLower === 'parent';
  const isStudent = roleLower === 'student';

  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 24px',
      height: '68px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* Brand & School Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <img
          src="/logo.jpg"
          alt="App Logo"
          style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
        />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
              Technula EduFlow
            </h1>
            <span className="pill pill-primary" style={{
              fontSize: '11px', textTransform: 'uppercase',
              background: isSuperAdmin ? '#1e1b4b' : undefined,
              color: isSuperAdmin ? '#a5b4fc' : undefined,
            }}>
              {isSuperAdmin ? 'SuperAdmin SaaS' : (isTeacher ? 'Teacher PWA' : (isAdmin ? 'Admin OS' : (isStudent ? 'Student Portal' : 'Parent Portal')))}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            {isSuperAdmin ? (
              <>
                <Shield size={13} color="#4338ca" />
                <span style={{ color: '#4338ca', fontWeight: '600' }}>Platform Master Control</span>
              </>
            ) : (
              <>
                <School size={13} color="var(--primary)" />
                <span>{user?.school_name || 'Academic Institution'}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Desktop) */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '3px', background: '#f8fafc', padding: '4px 6px', borderRadius: '12px', border: '1px solid #e2e8f0' }} className="desktop-nav">
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('superadmin_overview')}
            className={`nav-tab-item ${activeTab === 'superadmin_overview' ? 'active' : ''}`}
          >
            <Building2 size={15} /> SaaS Command Center
          </button>
        )}

        {isAdmin && !isSuperAdmin && (
          <>
            <button
              onClick={() => setActiveTab('admin_overview')}
              className={`nav-tab-item ${activeTab === 'admin_overview' ? 'active' : ''}`}
            >
              Admin Dashboard
            </button>
            <button
              onClick={() => setActiveTab('risk_cases')}
              className={`nav-tab-item ${activeTab === 'risk_cases' ? 'active' : ''}`}
            >
              Risk Center
            </button>
            <button
              onClick={() => setActiveTab('exam_sheets')}
              className={`nav-tab-item ${activeTab === 'exam_sheets' ? 'active' : ''}`}
            >
              Exam Sheets
            </button>
            <button
              onClick={() => setActiveTab('certificates')}
              className={`nav-tab-item ${activeTab === 'certificates' ? 'active' : ''}`}
            >
              Certificates & TC
            </button>
            <button
              onClick={() => setActiveTab('ptc_admin')}
              className={`nav-tab-item ${activeTab === 'ptc_admin' ? 'active' : ''}`}
            >
              PTC Meetings
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`nav-tab-item ${activeTab === 'tickets' ? 'active' : ''}`}
            >
              Support Tickets
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`nav-tab-item ${activeTab === 'announcements' ? 'active' : ''}`}
            >
              Notices
            </button>
            <button
              onClick={() => setActiveTab('gate_scanner')}
              className={`nav-tab-item ${activeTab === 'gate_scanner' ? 'active' : ''}`}
            >
              Gate Scanner
            </button>
          </>
        )}

        {['security', 'gatestaff'].includes(roleLower) && (
          <button
            onClick={() => setActiveTab('gate_scanner')}
            className={`nav-tab-item ${activeTab === 'gate_scanner' ? 'active' : ''}`}
          >
            <QrCode size={15} /> Gate Scanner
          </button>
        )}

        {isTeacher && (
          <>
            <button
              onClick={() => setActiveTab('teacher_attendance')}
              className={`nav-tab-item ${activeTab === 'teacher_attendance' ? 'active' : ''}`}
            >
              Daily Attendance
            </button>
            <button
              onClick={() => setActiveTab('teacher_marks')}
              className={`nav-tab-item ${activeTab === 'teacher_marks' ? 'active' : ''}`}
            >
              Marks & Feedback
            </button>
            <button
              onClick={() => setActiveTab('exam_sheets')}
              className={`nav-tab-item ${activeTab === 'exam_sheets' ? 'active' : ''}`}
            >
              Scan Sheets
            </button>
            <button
              onClick={() => setActiveTab('ptc_admin')}
              className={`nav-tab-item ${activeTab === 'ptc_admin' ? 'active' : ''}`}
            >
              PTC Schedule
            </button>
            <button
              onClick={() => setActiveTab('risk_cases')}
              className={`nav-tab-item ${activeTab === 'risk_cases' ? 'active' : ''}`}
            >
              Risk Cases
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`nav-tab-item ${activeTab === 'announcements' ? 'active' : ''}`}
            >
              Notices
            </button>
          </>
        )}

        {isParent && (
          <>
            <button
              onClick={() => setActiveTab('parent_portal')}
              className={`nav-tab-item ${activeTab === 'parent_portal' ? 'active' : ''}`}
            >
              Parent Portal
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`nav-tab-item ${activeTab === 'announcements' ? 'active' : ''}`}
            >
              School Notices
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`nav-tab-item ${activeTab === 'tickets' ? 'active' : ''}`}
            >
              <Ticket size={14} /> Helpdesk Tickets
            </button>
          </>
        )}

        {isStudent && (
          <>
            <button
              onClick={() => setActiveTab('student_portal')}
              className={`nav-tab-item ${activeTab === 'student_portal' ? 'active' : ''}`}
            >
              Student Portal
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`nav-tab-item ${activeTab === 'announcements' ? 'active' : ''}`}
            >
              Announcements
            </button>
          </>
        )}
      </nav>

      {/* User info & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Live Notification Dropdown Hub */}
        <NotificationDropdown user={user} onNavigate={setActiveTab} />

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {user?.full_name || 'Logged User'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {user?.email}
          </div>
        </div>

        <button
          onClick={onLogout}
          title="Sign Out"
          className="btn-secondary"
          style={{ padding: '8px', borderRadius: '8px', color: 'var(--accent-rose)', cursor: 'pointer' }}
        >
          <LogOut size={16} />
        </button>

        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="btn-secondary mobile-menu-toggle"
          style={{ padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
          title="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#ffffff', borderBottom: '2px solid var(--primary)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)', padding: '16px 24px',
          display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 1000
        }}>
          {isAdmin && !isSuperAdmin && (
            <>
              <button onClick={() => { setActiveTab('admin_overview'); setMobileMenuOpen(false); }} className={activeTab === 'admin_overview' ? 'btn-primary' : 'btn-secondary'} style={{ textAlign: 'left', padding: '10px' }}>Admin Dashboard</button>
              <button onClick={() => { setActiveTab('risk_cases'); setMobileMenuOpen(false); }} className={activeTab === 'risk_cases' ? 'btn-primary' : 'btn-secondary'} style={{ textAlign: 'left', padding: '10px' }}>Risk Center</button>
              <button onClick={() => { setActiveTab('exam_sheets'); setMobileMenuOpen(false); }} className={activeTab === 'exam_sheets' ? 'btn-primary' : 'btn-secondary'} style={{ textAlign: 'left', padding: '10px' }}>Exam Sheets</button>
              <button onClick={() => { setActiveTab('certificates'); setMobileMenuOpen(false); }} className={activeTab === 'certificates' ? 'btn-primary' : 'btn-secondary'} style={{ textAlign: 'left', padding: '10px' }}>Certificates & TC</button>
              <button onClick={() => { setActiveTab('ptc_admin'); setMobileMenuOpen(false); }} className={activeTab === 'ptc_admin' ? 'btn-primary' : 'btn-secondary'} style={{ textAlign: 'left', padding: '10px' }}>PTC Meetings</button>
              <button onClick={() => { setActiveTab('tickets'); setMobileMenuOpen(false); }} className={activeTab === 'tickets' ? 'btn-primary' : 'btn-secondary'} style={{ textAlign: 'left', padding: '10px' }}>Support Tickets</button>
              <button onClick={() => { setActiveTab('announcements'); setMobileMenuOpen(false); }} className={activeTab === 'announcements' ? 'btn-primary' : 'btn-secondary'} style={{ textAlign: 'left', padding: '10px' }}>Notices</button>
              <button onClick={() => { setActiveTab('gate_scanner'); setMobileMenuOpen(false); }} className={activeTab === 'gate_scanner' ? 'btn-primary' : 'btn-secondary'} style={{ textAlign: 'left', padding: '10px' }}>Gate Scanner</button>
            </>
          )}
          {isParent && (
            <>
              <button onClick={() => { setActiveTab('parent_portal'); setMobileMenuOpen(false); }} className={activeTab === 'parent_portal' ? 'btn-primary' : 'btn-secondary'} style={{ textAlign: 'left', padding: '10px' }}>Parent Portal</button>
              <button onClick={() => { setActiveTab('announcements'); setMobileMenuOpen(false); }} className={activeTab === 'announcements' ? 'btn-primary' : 'btn-secondary'} style={{ textAlign: 'left', padding: '10px' }}>School Notices</button>
              <button onClick={() => { setActiveTab('tickets'); setMobileMenuOpen(false); }} className={activeTab === 'tickets' ? 'btn-primary' : 'btn-secondary'} style={{ textAlign: 'left', padding: '10px' }}>Helpdesk Tickets</button>
            </>
          )}
          {isStudent && (
            <>
              <button onClick={() => { setActiveTab('student_portal'); setMobileMenuOpen(false); }} className={activeTab === 'student_portal' ? 'btn-primary' : 'btn-secondary'} style={{ textAlign: 'left', padding: '10px' }}>Student Portal</button>
              <button onClick={() => { setActiveTab('announcements'); setMobileMenuOpen(false); }} className={activeTab === 'announcements' ? 'btn-primary' : 'btn-secondary'} style={{ textAlign: 'left', padding: '10px' }}>Announcements</button>
            </>
          )}
          {isTeacher && (
            <>
              <button onClick={() => { setActiveTab('teacher_attendance'); setMobileMenuOpen(false); }} className={activeTab === 'teacher_attendance' ? 'btn-primary' : 'btn-secondary'} style={{ textAlign: 'left', padding: '10px' }}>Daily Attendance</button>
              <button onClick={() => { setActiveTab('teacher_marks'); setMobileMenuOpen(false); }} className={activeTab === 'teacher_marks' ? 'btn-primary' : 'btn-secondary'} style={{ textAlign: 'left', padding: '10px' }}>Marks & Feedback</button>
              <button onClick={() => { setActiveTab('announcements'); setMobileMenuOpen(false); }} className={activeTab === 'announcements' ? 'btn-primary' : 'btn-secondary'} style={{ textAlign: 'left', padding: '10px' }}>Notices</button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
