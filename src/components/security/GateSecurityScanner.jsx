import React, { useState, useEffect } from 'react';
import { api, API_BASE } from '../../api';
import {
  ShieldCheck, QrCode, Search, CheckCircle2, AlertCircle, ArrowUpRight,
  ArrowDownLeft, Clock, User, Phone, MapPin, Camera, LogOut, Check,
  Users, Filter, Plus, RefreshCw, X, Eye, FileText
} from 'lucide-react';

export default function GateSecurityScanner({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('scanner'); // 'scanner' | 'visitors'
  const [codeInput, setCodeInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifiedPass, setVerifiedPass] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [gateName, setGateName] = useState('Main Gate');

  // Visitor Log state
  const [visitors, setVisitors] = useState([]);
  const [visitorStats, setVisitorStats] = useState(null);
  const [visitorFilter, setVisitorFilter] = useState('checked_in');
  const [loadingVisitors, setLoadingVisitors] = useState(false);
  const [showLogVisitorModal, setShowLogVisitorModal] = useState(false);
  const [loggingVisitor, setLoggingVisitor] = useState(false);
  const [newVisitor, setNewVisitor] = useState({
    visitor_name: '',
    visitor_phone: '',
    purpose: 'guest_meeting',
    person_to_meet: '',
    id_proof_type: 'Aadhaar',
    id_proof_number: '',
    gate_name: 'Main Gate',
    notes: '',
  });

  useEffect(() => {
    if (activeTab === 'visitors') {
      loadVisitorLogs();
    }
  }, [activeTab, visitorFilter]);

  const loadVisitorLogs = async () => {
    setLoadingVisitors(true);
    try {
      const [logs, stats] = await Promise.all([
        api.getVisitorLogs({ status: visitorFilter }),
        api.getVisitorStats().catch(() => null),
      ]);
      setVisitors(logs || []);
      setVisitorStats(stats);
    } catch (err) {
      setError(err.message || 'Failed to load visitor logs.');
    } finally {
      setLoadingVisitors(false);
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (!codeInput.trim()) return;
    setVerifying(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.verifyGatePassQr(codeInput.trim());
      setVerifiedPass(res);
    } catch (err) {
      setError(err.message || 'Pass not found or invalid token.');
      setVerifiedPass(null);
    } finally {
      setVerifying(false);
    }
  };

  const handleScanOut = async () => {
    if (!verifiedPass) return;
    try {
      const res = await api.gateScanOut(verifiedPass.gate_pass_id, gateName);
      setSuccessMsg(res.message);
      // Refresh verification
      const updated = await api.verifyGatePassQr(verifiedPass.pass_code);
      setVerifiedPass(updated);
    } catch (err) {
      setError(err.message || 'Failed to mark departure.');
    }
  };

  const handleScanIn = async () => {
    if (!verifiedPass) return;
    try {
      const res = await api.gateScanIn(verifiedPass.gate_pass_id, gateName);
      setSuccessMsg(res.message);
      const updated = await api.verifyGatePassQr(verifiedPass.pass_code);
      setVerifiedPass(updated);
    } catch (err) {
      setError(err.message || 'Failed to mark return.');
    }
  };

  const handleCheckoutVisitor = async (id, name) => {
    try {
      const res = await api.checkoutVisitor(id);
      setSuccessMsg(`Visitor ${name} marked as checked out.`);
      loadVisitorLogs();
    } catch (err) {
      setError(err.message || 'Failed to check out visitor.');
    }
  };

  const handleCreateVisitor = async (e) => {
    e.preventDefault();
    setLoggingVisitor(true);
    setError(null);
    try {
      await api.logVisitor({ ...newVisitor, gate_name: gateName });
      setSuccessMsg(`Visitor ${newVisitor.visitor_name} checked in successfully.`);
      setShowLogVisitorModal(false);
      setNewVisitor({
        visitor_name: '',
        visitor_phone: '',
        purpose: 'guest_meeting',
        person_to_meet: '',
        id_proof_type: 'Aadhaar',
        id_proof_number: '',
        gate_name: gateName,
        notes: '',
      });
      loadVisitorLogs();
    } catch (err) {
      setError(err.message || 'Failed to log visitor.');
    } finally {
      setLoggingVisitor(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a2540', color: '#f8fafc', padding: '16px' }}>
      {/* Top Security Header */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto 20px auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255,255,255,0.06)',
        padding: '16px 20px',
        borderRadius: '14px',
        border: '1px solid rgba(255,255,255,0.12)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            padding: '10px',
            borderRadius: '10px',
            color: '#fff',
            display: 'flex'
          }}>
            <ShieldCheck size={26} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>
              Campus Security & Access Control
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#fff' }}>
              {user?.school_name || 'Technula EduFlow'} Gate Station
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            value={gateName}
            onChange={(e) => setGateName(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <option value="Main Gate" style={{ color: '#000' }}>Gate 1 (Main Gate)</option>
            <option value="North Gate" style={{ color: '#000' }}>Gate 2 (North Gate)</option>
            <option value="Junior Wing Gate" style={{ color: '#000' }}>Gate 3 (Junior Wing)</option>
            <option value="Bus Parking Gate" style={{ color: '#000' }}>Gate 4 (Bus Bay)</option>
          </select>

          {onLogout && (
            <button
              onClick={onLogout}
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px'
              }}
            >
              <LogOut size={14} /> Exit Station
            </button>
          )}
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto 20px auto',
        display: 'flex',
        gap: '10px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: '8px',
      }}>
        <button
          onClick={() => { setActiveTab('scanner'); setError(null); setSuccessMsg(null); }}
          style={{
            background: activeTab === 'scanner' ? 'var(--primary, #635bff)' : 'rgba(255,255,255,0.06)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <QrCode size={16} /> QR Gate Pass Scanner
        </button>

        <button
          onClick={() => { setActiveTab('visitors'); setError(null); setSuccessMsg(null); }}
          style={{
            background: activeTab === 'visitors' ? 'var(--primary, #635bff)' : 'rgba(255,255,255,0.06)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Users size={16} /> Campus Visitor Log
          {visitorStats?.currently_on_campus > 0 && (
            <span style={{
              background: '#ef4444',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '10px',
            }}>
              {visitorStats.currently_on_campus}
            </span>
          )}
        </button>
      </div>

      {/* Global Banner Messages */}
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid #10b981',
            color: '#34d399',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: 600
          }}>
            <CheckCircle2 size={18} /> {successMsg}
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid #ef4444',
            color: '#f87171',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: 600
          }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          TAB 1: GATE PASS SCANNER
      ══════════════════════════════════════════ */}
      {activeTab === 'scanner' && (
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Code Input Form */}
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '14px',
            padding: '20px',
            border: '1px solid rgba(255,255,255,0.12)'
          }}>
            <form onSubmit={handleVerify} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Scan QR token or type Pass Code (e.g. GP-20260918-XXXX)"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid rgba(255,255,255,0.2)',
                    background: 'rgba(0,0,0,0.3)',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={verifying}
                style={{
                  background: 'var(--primary, #635bff)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '14px 24px',
                  fontWeight: 800,
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {verifying ? <RefreshCw size={18} className="animate-spin" /> : <Search size={18} />}
                Verify Pass
              </button>
            </form>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
              Tip: Compatible with barcode & 2D QR camera scanners configured in keyboard wedge mode.
            </div>
          </div>

          {/* Verification Result Card */}
          {verifiedPass && (
            <div style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '16px',
              padding: '24px',
              border: '2px solid rgba(255,255,255,0.18)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              {/* Status Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    background:
                      verifiedPass.status === 'approved' ? '#10b981' :
                      verifiedPass.status === 'out' ? '#f59e0b' :
                      verifiedPass.status === 'returned' ? '#635bff' :
                      verifiedPass.status === 'rejected' ? '#ef4444' : '#64748b',
                    color: '#fff',
                    display: 'inline-block'
                  }}>
                    {verifiedPass.status === 'approved' ? 'AUTHORIZED FOR EXIT' : verifiedPass.status}
                  </span>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '8px 0 0 0', color: '#fff' }}>
                    Pass Code: {verifiedPass.pass_code}
                  </h2>
                </div>

                {/* Quick Scan Action Buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  {verifiedPass.can_scan_out && (
                    <button
                      onClick={handleScanOut}
                      style={{
                        background: '#10b981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '12px 20px',
                        fontSize: '14px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <ArrowUpRight size={18} /> Confirm Departure (Scan Out)
                    </button>
                  )}

                  {verifiedPass.can_scan_in && (
                    <button
                      onClick={handleScanIn}
                      style={{
                        background: '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '12px 20px',
                        fontSize: '14px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <ArrowDownLeft size={18} /> Confirm Return (Scan In)
                    </button>
                  )}
                </div>
              </div>

              {/* Two-Column Details Grid: Student vs Guardian/Visitor */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {/* Student Card */}
                <div style={{
                  background: 'rgba(0,0,0,0.25)',
                  borderRadius: '12px',
                  padding: '18px',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
                    Student Identification
                  </div>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    {verifiedPass.student.photo_url ? (
                      <img
                        src={verifiedPass.student.photo_url.startsWith('http') ? verifiedPass.student.photo_url : `${API_BASE || 'http://localhost:8000'}${verifiedPass.student.photo_url}`}
                        alt={verifiedPass.student.name}
                        style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover', border: '2px solid #fff' }}
                      />
                    ) : (
                      <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: 'var(--primary, #635bff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '24px' }}>
                        {verifiedPass.student.name[0]}
                      </div>
                    )}
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{verifiedPass.student.name}</h3>
                      <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '3px' }}>
                        Class {verifiedPass.student.grade}-{verifiedPass.student.section} • Adm #{verifiedPass.student.admission_no}
                      </div>
                      {verifiedPass.student.blood_group && (
                        <span style={{ fontSize: '11px', background: 'rgba(239,68,68,0.3)', color: '#fca5a5', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, marginTop: '4px', display: 'inline-block' }}>
                          Blood: {verifiedPass.student.blood_group}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Accompanied By Card */}
                <div style={{
                  background: 'rgba(0,0,0,0.25)',
                  borderRadius: '12px',
                  padding: '18px',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
                    Accompanied By / Authorized Guardian
                  </div>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    {verifiedPass.visitor_photo_url ? (
                      <img
                        src={verifiedPass.visitor_photo_url.startsWith('http') ? verifiedPass.visitor_photo_url : `${API_BASE || 'http://localhost:8000'}${verifiedPass.visitor_photo_url}`}
                        alt={verifiedPass.accompanied_by_name}
                        style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover', border: '2px solid #f59e0b' }}
                      />
                    ) : (
                      <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: '#f59e0b', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '24px' }}>
                        <User size={28} />
                      </div>
                    )}
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{verifiedPass.accompanied_by_name}</h3>
                      <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '3px' }}>
                        Relation: <strong>{verifiedPass.accompanied_by_relation}</strong>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
                        Parent: {verifiedPass.parent.name} ({verifiedPass.parent.phone || 'Phone on file'})
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pass Justification & Expected Timestamps */}
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#93c5fd', marginBottom: '6px' }}>
                  Stated Purpose / Reason:
                </div>
                <div style={{ fontSize: '14px', color: '#e2e8f0', lineHeight: 1.5 }}>
                  {verifiedPass.reason}
                </div>
                <div style={{ display: 'flex', gap: '20px', marginTop: '12px', flexWrap: 'wrap', fontSize: '13px', color: '#cbd5e1' }}>
                  <div>
                    Expected Departure: <strong>{new Date(verifiedPass.expected_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                  </div>
                  {verifiedPass.expected_return_time && (
                    <div>
                      Expected Return: <strong>{new Date(verifiedPass.expected_return_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                    </div>
                  )}
                  {verifiedPass.actual_out_time && (
                    <div style={{ color: '#f59e0b' }}>
                      Actual Departed: <strong>{new Date(verifiedPass.actual_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                    </div>
                  )}
                  {verifiedPass.actual_return_time && (
                    <div style={{ color: '#10b981' }}>
                      Actual Returned: <strong>{new Date(verifiedPass.actual_return_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB 2: CAMPUS VISITOR LOG
      ══════════════════════════════════════════ */}
      {activeTab === 'visitors' && (
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Actions & KPI Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setVisitorFilter('checked_in')}
                style={{
                  background: visitorFilter === 'checked_in' ? '#10b981' : 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Currently On Campus ({visitorStats?.currently_on_campus || 0})
              </button>
              <button
                onClick={() => setVisitorFilter('all')}
                style={{
                  background: visitorFilter === 'all' ? '#635bff' : 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                All Visitors Today
              </button>
            </div>

            <button
              onClick={() => setShowLogVisitorModal(true)}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 18px',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Plus size={16} /> Log New Walk-In Visitor
            </button>
          </div>

          {/* Visitor Logs Table */}
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.12)',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '12px 16px' }}>Visitor Name</th>
                  <th style={{ padding: '12px 16px' }}>Phone</th>
                  <th style={{ padding: '12px 16px' }}>Purpose</th>
                  <th style={{ padding: '12px 16px' }}>Meeting With</th>
                  <th style={{ padding: '12px 16px' }}>Check-In</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {visitors.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                      No visitor records found.
                    </td>
                  </tr>
                ) : (
                  visitors.map((v) => (
                    <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#fff' }}>
                        {v.visitor_name}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>
                        {v.visitor_phone}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: 'rgba(99, 91, 255, 0.2)',
                          color: '#a5b4fc',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700
                        }}>
                          {v.purpose.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>
                        {v.person_to_meet || (v.student_name ? `Student: ${v.student_name}` : '-')}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#94a3b8' }}>
                        {new Date(v.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 800,
                          background: v.status === 'checked_in' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                          color: v.status === 'checked_in' ? '#34d399' : '#94a3b8'
                        }}>
                          {v.status === 'checked_in' ? 'ON CAMPUS' : 'DEPARTED'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {v.status === 'checked_in' && (
                          <button
                            onClick={() => handleCheckoutVisitor(v.id, v.visitor_name)}
                            style={{
                              background: '#f59e0b',
                              color: '#000',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '5px 10px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Check-Out
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL: LOG NEW WALK-IN VISITOR ── */}
      {showLogVisitorModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px'
        }}>
          <div style={{
            background: '#0a2540',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '24px',
            maxWidth: '500px',
            width: '100%',
            color: '#fff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Log Campus Visitor</h3>
              <button
                onClick={() => setShowLogVisitorModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateVisitor} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>Visitor Full Name *</label>
                <input
                  type="text"
                  required
                  value={newVisitor.visitor_name}
                  onChange={(e) => setNewVisitor({ ...newVisitor, visitor_name: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={newVisitor.visitor_phone}
                  onChange={(e) => setNewVisitor({ ...newVisitor, visitor_phone: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>Purpose</label>
                  <select
                    value={newVisitor.purpose}
                    onChange={(e) => setNewVisitor({ ...newVisitor, purpose: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: '#0a2540', color: '#fff', marginTop: '4px' }}
                  >
                    <option value="parent_pickup">Early Student Pickup</option>
                    <option value="guest_meeting">Parent / Teacher Meet</option>
                    <option value="admissions">Admission Inquiry</option>
                    <option value="vendor_delivery">Vendor / Delivery</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="other">Official Guest</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>Person to Meet</label>
                  <input
                    type="text"
                    placeholder="Principal, Teacher, etc."
                    value={newVisitor.person_to_meet}
                    onChange={(e) => setNewVisitor({ ...newVisitor, person_to_meet: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>ID Proof Type</label>
                  <select
                    value={newVisitor.id_proof_type}
                    onChange={(e) => setNewVisitor({ ...newVisitor, id_proof_type: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: '#0a2540', color: '#fff', marginTop: '4px' }}
                  >
                    <option value="Aadhaar">Aadhaar Card</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="Company ID">Company ID</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>ID Number</label>
                  <input
                    type="text"
                    value={newVisitor.id_proof_number}
                    onChange={(e) => setNewVisitor({ ...newVisitor, id_proof_number: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loggingVisitor}
                style={{
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                {loggingVisitor ? 'Saving...' : 'Register Check-In'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
