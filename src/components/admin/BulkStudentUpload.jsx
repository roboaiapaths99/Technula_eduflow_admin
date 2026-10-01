import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Users,
  KeyRound,
  Printer,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Shield,
  FileText,
  AlertTriangle,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { api } from '../../api';

export default function BulkStudentUpload({ schoolId, onSuccess = () => {} }) {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewRows, setPreviewRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const res = await api.getCurrentSubscription();
      setSubscription(res);
    } catch (e) {
      console.warn('Subscription fetch failed:', e);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (selectedFile) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please upload a standard CSV file (.csv format).');
      return;
    }
    setError(null);
    setResult(null);
    setFile(selectedFile);

    // Read and parse preview of first 5 rows
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        const parsedHeaders = lines[0].split(',').map((h) => h.trim());
        setHeaders(parsedHeaders);
        const rows = lines.slice(1, 6).map((line) => {
          const cells = line.split(',').map((c) => c.trim());
          const rowObj = {};
          parsedHeaders.forEach((h, idx) => {
            rowObj[h] = cells[idx] || '';
          });
          return rowObj;
        });
        setPreviewRows(rows);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleUploadSubmit = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await api.uploadStudentCsv(file);
      setResult(res);
      try {
        if (typeof onSuccess === 'function') {
          onSuccess();
        }
      } catch (cbErr) {
        console.warn('onSuccess callback non-fatal error:', cbErr);
      }
      await loadSubscription();
    } catch (err) {
      setError(err.message || 'Failed to process CSV upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent(
        'name,admission_no,grade,section,roll_no,gender,father_name,mother_name,parent_phone,parent_email,blood_group,address\n' +
          'Aarav Sharma,ADM-2026-001,10,A,1,Male,Rajesh Sharma,Sunita Sharma,9876543210,rajesh@example.com,B+,12 Park Street Delhi\n' +
          'Ananya Patel,ADM-2026-002,10,A,2,Female,Kiran Patel,Pooja Patel,9876543211,kiran@example.com,O+,44 Gandhi Road Ahmedabad\n' +
          'Rohan Gupta,ADM-2026-003,10,B,1,Male,Amit Gupta,Rekha Gupta,9876543212,amit@example.com,A+,77 Ring Road Bengaluru\n'
      );
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', 'school_students_upload_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handlePrintSlips = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          borderRadius: '16px',
          padding: '24px',
          color: '#fff',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UploadCloud size={28} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>
                Bulk Student Roster Ingestion & Parent Link Generator
              </h2>
              <span
                style={{
                  background: 'rgba(99, 102, 241, 0.25)',
                  border: '1px solid rgba(165, 180, 252, 0.4)',
                  color: '#c7d2fe',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '999px',
                }}
              >
                Instant Onboarding
              </span>
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#cbd5e1', maxWidth: '650px' }}>
              Upload entire class rosters in one click. The system automatically provisions student profiles,
              enforces student quota limits, and generates <strong>secure Parent Linking Codes</strong> so parents can immediately register and connect to their child.
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadTemplate}
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            color: '#fff',
            borderRadius: '10px',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
        >
          <Download size={16} />
          Download Sample CSV
        </button>
      </div>

      {/* Quota Status Card */}
      {subscription && (
        <div
          style={{
            background: '#fff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            fontSize: '13px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users size={20} color="#4f46e5" />
            <div>
              <span style={{ fontWeight: 600, color: '#1e293b' }}>
                Student Enrollment Quota:
              </span>{' '}
              <span style={{ color: '#475569' }}>
                {subscription.usage?.students ?? 0} active students of {subscription.quotas?.max_students ? Number(subscription.quotas.max_students).toLocaleString() : 'Unlimited'} capacity
              </span>
            </div>
          </div>
          <div style={{ color: '#64748b', fontSize: '12px' }}>
            Plan: <strong style={{ color: '#4f46e5', textTransform: 'capitalize' }}>{subscription.plan_tier || subscription.plan?.name || 'Enterprise'}</strong>{' '}
            {subscription.is_trial ? `(${subscription.trial_days_remaining ?? subscription.days_remaining ?? 0} days trial remaining)` : '(Active)'}
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '14px 18px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
          }}
        >
          <AlertCircle size={20} color="#dc2626" />
          <span>{error}</span>
        </div>
      )}

      {/* Drag & Drop Upload Area */}
      {!result && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: dragActive ? '#eef2ff' : '#fff',
            border: `2px dashed ${dragActive ? '#6366f1' : '#cbd5e1'}`,
            borderRadius: '16px',
            padding: '48px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#e0e7ff',
              color: '#4338ca',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <FileSpreadsheet size={32} />
          </div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
            {file ? file.name : 'Choose CSV file or drag & drop here'}
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            {file
              ? `${(file.size / 1024).toFixed(1)} KB — Click to change file`
              : 'Accepts standard CSV with columns: name, admission_no, grade, section, roll_no, parent_phone'}
          </p>
        </div>
      )}

      {/* Preview Table if File Selected and not yet submitted */}
      {file && !result && previewRows.length > 0 && (
        <div
          style={{
            background: '#fff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '14px 20px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                Previewing First {previewRows.length} Rows
              </h4>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Verify column headers align with expected student attributes.
              </span>
            </div>

            <button
              onClick={handleUploadSubmit}
              disabled={uploading}
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: uploading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
              }}
            >
              {uploading ? (
                <>
                  <RefreshCw size={16} className="spin" /> Importing Roster...
                </>
              ) : (
                <>
                  <UploadCloud size={16} /> Ingest & Generate Parent Codes
                </>
              )}
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>
                  {headers.map((h, i) => (
                    <th key={i} style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, rIdx) => (
                  <tr key={rIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    {headers.map((h, cIdx) => (
                      <td key={cIdx} style={{ padding: '10px 14px', color: '#334155' }}>
                        {row[h] || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Success & Generation Result Summary */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Summary Card */}
          <div
            style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '16px',
              padding: '20px 24px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: '#10b981',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#065f46' }}>
                  {result.message || 'Roster Ingestion Complete!'}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#047857' }}>
                  Successfully added {result.created_count || result.students?.length || 0} students with verified parent access codes.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={handlePrintSlips}
                style={{
                  background: '#fff',
                  border: '1px solid #a7f3d0',
                  color: '#065f46',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Printer size={15} /> Print Parent Slips
              </button>
              <button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  setPreviewRows([]);
                }}
                style={{
                  background: '#059669',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Upload Another File
              </button>
            </div>
          </div>

          {/* Table of Created Students with Parent Link Codes */}
          {result.students && result.students.length > 0 && (
            <div
              style={{
                background: '#fff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '14px 20px',
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                    Parent Linking Credentials Roster ({result.students.length} Students)
                  </h4>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Hand these codes or share them with parents to link their child profile on the Parent App.
                  </span>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>
                      <th style={{ padding: '10px 16px', textAlign: 'left' }}>Admission No</th>
                      <th style={{ padding: '10px 16px', textAlign: 'left' }}>Student Name</th>
                      <th style={{ padding: '10px 16px', textAlign: 'left' }}>Grade & Section</th>
                      <th style={{ padding: '10px 16px', textAlign: 'left' }}>Parent Phone</th>
                      <th style={{ padding: '10px 16px', textAlign: 'left' }}>Parent Link Code</th>
                      <th style={{ padding: '10px 16px', textAlign: 'right' }}>Copy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.students.map((st, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: 600, color: '#2563eb' }}>
                          {st.admission_no}
                        </td>
                        <td style={{ padding: '10px 16px', fontWeight: 600, color: '#1e293b' }}>
                          {st.name}
                        </td>
                        <td style={{ padding: '10px 16px', color: '#475569' }}>
                          Class {st.grade} - {st.section}
                        </td>
                        <td style={{ padding: '10px 16px', color: '#64748b' }}>
                          {st.parent_phone || '—'}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '12px',
                            }}
                          >
                            {st.parent_code || 'AUTOLINK-OK'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                          <button
                            onClick={() => copyToClipboard(st.parent_code, st.admission_no)}
                            style={{
                              border: '1px solid #e2e8f0',
                              background: '#fff',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              cursor: 'pointer',
                              color: copiedCode === st.admission_no ? '#059669' : '#64748b',
                            }}
                          >
                            {copiedCode === st.admission_no ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
