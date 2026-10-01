import React, { useState, useEffect } from 'react';
import { api, API_BASE } from '../../api';
import {
  Award, FileText, CheckCircle2, XCircle, Clock, Upload,
  Printer, ShieldCheck, Search, Filter, AlertCircle, RefreshCw
} from 'lucide-react';

export default function CertificatesManager({ user }) {
  const schoolId = user?.school_id;
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Asset upload states
  const [stampFile, setStampFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [principalName, setPrincipalName] = useState('Dr. Alok Verma');
  const [principalDesignation, setPrincipalDesignation] = useState('Principal & Head of Institution');
  const [affiliationCode, setAffiliationCode] = useState('CBSE/AFF/2730198');
  const [savingAsset, setSavingAsset] = useState(false);

  // Rejection modal
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqList, assetData] = await Promise.all([
        api.listCertificateRequests(schoolId),
        api.getSchoolAssets(schoolId).catch(() => null),
      ]);
      setRequests(reqList || []);
      if (assetData) {
        setAssets(assetData);
        if (assetData.principal_name) setPrincipalName(assetData.principal_name);
        if (assetData.principal_designation) setPrincipalDesignation(assetData.principal_designation);
        if (assetData.affiliation_code) setAffiliationCode(assetData.affiliation_code);
      }
    } catch (e) {
      console.error('Error loading certificate data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolId) loadData();
  }, [schoolId]);

  const handleUploadAsset = async (assetType, file) => {
    if (!file) return;
    setSavingAsset(true);
    const formData = new FormData();
    formData.append('school_id', schoolId);
    formData.append('asset_type', assetType);
    formData.append('principal_name', principalName);
    formData.append('principal_designation', principalDesignation);
    formData.append('affiliation_code', affiliationCode);
    formData.append('file', file);

    try {
      await api.uploadSchoolAsset(formData);
      alert(`✓ School ${assetType} updated successfully!`);
      loadData();
    } catch (e) {
      alert(e.message || 'Asset upload failed');
    } finally {
      setSavingAsset(false);
    }
  };

  const handleApprove = async (reqId) => {
    if (!window.confirm('Approve and issue official certificate with digital stamp and signature?')) return;
    try {
      const res = await api.approveCertificateRequest(reqId, {
        approved_by: `${principalName} (${principalDesignation})`,
      });
      alert(`✓ Certificate #${res.certificate_number} issued with digital verification seal!`);
      loadData();
    } catch (e) {
      alert(e.message || 'Approval failed');
    }
  };

  const handleReject = async () => {
    if (!rejectingRequest || !rejectionReason.trim()) return;
    try {
      await api.rejectCertificateRequest(rejectingRequest.id, {
        rejection_reason: rejectionReason.trim(),
      });
      alert('Certificate request marked as rejected.');
      setRejectingRequest(null);
      setRejectionReason('');
      loadData();
    } catch (e) {
      alert(e.message || 'Rejection failed');
    }
  };

  const filtered = requests.filter(
    (r) => filterStatus === 'ALL' || r.status === filterStatus
  );

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="pill pill-indigo">Official Document Issuance</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Digital Stamp, Signature & QR</span>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 900, marginTop: '6px', color: 'var(--text-primary)' }}>
            Transfer Certificate (TC) & Bonafide Portal
          </h2>
        </div>

        <button onClick={loadData} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={15} /> Refresh Requests
        </button>
      </div>

      {/* School Seal & Digital Signature Configuration Card */}
      <div className="tech-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} color="var(--primary)" /> Official School Seal & Signatures
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
          {/* Stamp Uploader */}
          <div style={{ border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '16px', textAlign: 'center', background: '#F8FAFC' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Institutional Stamp Seal
            </div>
            {assets?.stamp_image_url ? (
              <div style={{ marginBottom: '10px' }}>
                <img src={`${API_BASE}${assets.stamp_image_url}`} alt="Stamp" style={{ maxHeight: '70px', borderRadius: '4px' }} />
                <div style={{ fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: 700, marginTop: '4px' }}>✓ Stamp Configured</div>
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                No circular seal uploaded yet
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              id="stampUpload"
              style={{ display: 'none' }}
              onChange={(e) => handleUploadAsset('STAMP', e.target.files[0])}
            />
            <label htmlFor="stampUpload" className="btn-secondary" style={{ fontSize: '12px', padding: '6px 14px', cursor: 'pointer', display: 'inline-block' }}>
              <Upload size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Upload Stamp
            </label>
          </div>

          {/* Principal Signature Uploader */}
          <div style={{ border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '16px', textAlign: 'center', background: '#F8FAFC' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Principal Digital Signature
            </div>
            {assets?.signature_image_url ? (
              <div style={{ marginBottom: '10px' }}>
                <img src={`${API_BASE}${assets.signature_image_url}`} alt="Signature" style={{ maxHeight: '45px' }} />
                <div style={{ fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: 700, marginTop: '4px' }}>✓ Signature Configured</div>
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                No transparent signature uploaded yet
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              id="signUpload"
              style={{ display: 'none' }}
              onChange={(e) => handleUploadAsset('SIGNATURE', e.target.files[0])}
            />
            <label htmlFor="signUpload" className="btn-secondary" style={{ fontSize: '12px', padding: '6px 14px', cursor: 'pointer', display: 'inline-block' }}>
              <Upload size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Upload Signature
            </label>
          </div>

          {/* Principal Name & Affiliation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>Principal Name</label>
              <input
                type="text"
                value={principalName}
                onChange={(e) => setPrincipalName(e.target.value)}
                className="tech-input"
                style={{ width: '100%', fontSize: '12px', padding: '6px 10px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>CBSE Affiliation Code</label>
              <input
                type="text"
                value={affiliationCode}
                onChange={(e) => setAffiliationCode(e.target.value)}
                className="tech-input"
                style={{ width: '100%', fontSize: '12px', padding: '6px 10px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Requests Table Header & Filter */}
      <div className="tech-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Applications Queue ({filtered.length})
          </h3>

          <div style={{ display: 'flex', gap: '6px' }}>
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                style={{
                  border: '1px solid var(--border-color)',
                  background: filterStatus === st ? 'var(--primary)' : '#ffffff',
                  color: filterStatus === st ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Loading certificate requests...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            <FileText size={36} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>No Certificate Requests</p>
            <p style={{ fontSize: '12px', marginTop: '2px' }}>When parents apply from the mobile app, requests will appear here for review.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '10px' }}>Student</th>
                  <th style={{ padding: '10px' }}>Certificate Type</th>
                  <th style={{ padding: '10px' }}>Delivery Mode</th>
                  <th style={{ padding: '10px' }}>Reason</th>
                  <th style={{ padding: '10px' }}>Status</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const isApproved = r.status === 'APPROVED';
                  const isPending = r.status === 'PENDING';
                  const isRejected = r.status === 'REJECTED';

                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{r.student_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Class {r.grade}-{r.section} • {r.admission_no}
                        </div>
                      </td>

                      <td style={{ padding: '12px 10px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {r.certificate_type.replace('_', ' ').title ? r.certificate_type.replace('_', ' ').title() : r.certificate_type.replace('_', ' ')}
                        </span>
                        {r.certificate_number && (
                          <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 800 }}>
                            #{r.certificate_number}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 10px' }}>
                        <span className="pill pill-indigo" style={{ fontSize: '10px' }}>
                          {r.delivery_mode === 'ONLINE_APP' ? '📱 Mobile Download' : '🏫 School Counter'}
                        </span>
                      </td>

                      <td style={{ padding: '12px 10px', maxWidth: '240px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          "{r.purpose_reason}"
                        </div>
                        {r.rejection_reason && (
                          <div style={{ fontSize: '11px', color: 'var(--accent-rose)', marginTop: '2px' }}>
                            Rejection: {r.rejection_reason}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 10px' }}>
                        <span
                          className={`pill ${isApproved ? 'pill-emerald' : isPending ? 'pill-amber' : 'pill-rose'}`}
                          style={{ fontSize: '11px' }}
                        >
                          {r.status}
                        </span>
                      </td>

                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApprove(r.id)}
                                className="btn-primary"
                                style={{ fontSize: '11px', padding: '6px 12px' }}
                              >
                                ✓ Approve & Seal
                              </button>
                              <button
                                onClick={() => setRejectingRequest(r)}
                                className="btn-secondary"
                                style={{ fontSize: '11px', padding: '6px 10px', color: 'var(--accent-rose)' }}
                              >
                                ✕
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <a
                              href={api.getCertificateViewUrl(r.certificate_number)}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-secondary"
                              style={{ fontSize: '11px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                            >
                              <Printer size={13} /> Print Certificate
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {rejectingRequest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '440px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '8px', color: 'var(--accent-rose)' }}>
              Reject Certificate Request
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Specify the clearance deficiency or reason for rejecting {rejectingRequest.student_name}'s application.
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Outstanding library books or Term 2 laboratory fee clearance pending..."
              className="tech-input"
              style={{ width: '100%', height: '80px', marginBottom: '16px' }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setRejectingRequest(null)} className="btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button onClick={handleReject} className="btn-primary" style={{ flex: 2, background: 'var(--accent-rose)' }}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
