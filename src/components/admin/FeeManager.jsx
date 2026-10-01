import React, { useState, useEffect, useMemo } from 'react';
import { api, API_BASE } from '../../api';
import {
  CreditCard, DollarSign, Receipt, Settings, CheckCircle2,
  AlertCircle, Search, Printer, Plus, Trash2, Edit2, ArrowUpRight, ShieldCheck, QrCode,
  Lock, Eye, EyeOff, Activity, ExternalLink, Calendar, Sparkles, Filter, Layers, Check, RefreshCw, Upload
} from 'lucide-react';

const STANDARD_FEE_HEADS = [
  { name: 'Tuition Fee', icon: '🏫', desc: 'Core academic instruction fee' },
  { name: 'Computer & IT Lab Fee', icon: '💻', desc: 'Computer labs, smart classes & coding' },
  { name: 'Composite Science Lab Fee', icon: '🔬', desc: 'Physics, Chemistry, Biology practicals' },
  { name: 'Library & Reading Room', icon: '📚', desc: 'Library book circulation & journals' },
  { name: 'Sports & Games Fee', icon: '⚽', desc: 'Sports equipment, grounds & coaches' },
  { name: 'Transport / Bus Fee', icon: '🚌', desc: 'School bus pick & drop facility' },
  { name: 'Examination & Assessment', icon: '📝', desc: 'Term exam papers & report cards' },
  { name: 'Annual & Development Charges', icon: '🏛️', desc: 'Campus maintenance & events' },
  { name: 'Admission / Registration Fee', icon: '📋', desc: 'One-time admission charge' },
];

const GRADE_OPTIONS = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export default function FeeManager({ schoolId, students = [] }) {
  const [subTab, setSubTab] = useState('overview'); // 'overview' | 'collect' | 'structures' | 'config'
  const [overview, setOverview] = useState(null);
  const [structures, setStructures] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cashier Collection State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentDues, setStudentDues] = useState(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [selectedStructureId, setSelectedStructureId] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [transactionRef, setTransactionRef] = useState('');
  const [discountWaiver, setDiscountWaiver] = useState(0);
  const [cashierRemarks, setCashierRemarks] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [printedReceipt, setPrintedReceipt] = useState(null);

  // Structure & Scheduling Form State
  const [showAddStructure, setShowAddStructure] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);
  const [scheduleMode, setScheduleMode] = useState('quarterly'); // 'monthly' | 'quarterly' | 'half_yearly' | 'annual' | 'custom'
  const [gradeTarget, setGradeTarget] = useState('single'); // 'single' | 'all_1_to_12' | 'primary' | 'middle' | 'secondary' | 'sr_secondary'
  const [scheduleDueDay, setScheduleDueDay] = useState(10);
  const [academicYear, setAcademicYear] = useState('2025-26');
  const [customFeeHead, setCustomFeeHead] = useState('');
  const [isCustomHead, setIsCustomHead] = useState(false);
  const [filterGrade, setFilterGrade] = useState('ALL');
  const [filterHead, setFilterHead] = useState('ALL');

  const [structForm, setStructForm] = useState({
    grade: '10',
    fee_head: 'Tuition Fee',
    total_amount: 7500,
    installment_name: 'Quarter 1',
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    grace_period_days: 7,
    late_fine_per_day: 50,
    is_optional: false,
  });

  // Gateway & School Bank/QR Config Form
  const [configForm, setConfigForm] = useState({
    gateway_provider: 'MANUAL',
    merchant_key: '',
    merchant_secret: '',
    upi_vpa: 'school@hdfcbank',
    upi_account_name: 'Greenwood High School Fees',
    bank_name: '',
    bank_account_no: '',
    bank_ifsc: '',
    bank_account_holder: '',
    qr_code_url: '',
    payment_instructions: '',
    receipt_prefix: 'RCP',
    receipt_template_url: '',
    receipt_template_html: '',
    has_secret: false,
  });

  const [uploadingReceiptTemplate, setUploadingReceiptTemplate] = useState(false);
  const [uploadingQrCode, setUploadingQrCode] = useState(false);
  const [testingGateway, setTestingGateway] = useState(false);
  const [gatewayTestResult, setGatewayTestResult] = useState(null);
  const [showSecret, setShowSecret] = useState(false);

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ovRes, strRes, cfgRes] = await Promise.all([
        api.getFeeOverview(schoolId).catch(() => null),
        api.getFeeStructures(schoolId).catch(() => []),
        api.getFeeConfig(schoolId).catch(() => null),
      ]);
      setOverview(ovRes);
      setStructures(strRes || []);
      if (cfgRes) {
        setConfig(cfgRes);
        setConfigForm(cfgRes);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolId) loadData();
  }, [schoolId]);

  // Load student dues when selected in cashier desk
  useEffect(() => {
    if (!selectedStudentId) {
      setStudentDues(null);
      return;
    }
    api.getStudentFeeDues(selectedStudentId)
      .then((res) => {
        setStudentDues(res);
        if (res.breakdown && res.breakdown.length > 0) {
          const firstDue = res.breakdown.find((b) => b.net_due > 0) || res.breakdown[0];
          setSelectedStructureId(firstDue.structure_id);
          setCollectAmount(firstDue.net_due > 0 ? firstDue.net_due : firstDue.base_amount);
        }
      })
      .catch((err) => console.error(err));
  }, [selectedStudentId]);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !collectAmount || Number(collectAmount) <= 0) {
      setError('Please select a student and enter a valid payment amount.');
      return;
    }
    setProcessingPayment(true);
    setError(null);
    try {
      const res = await api.collectFeeCounter({
        school_id: schoolId,
        student_id: selectedStudentId,
        amount: Number(collectAmount),
        fee_structure_id: selectedStructureId,
        payment_mode: paymentMode,
        transaction_ref: transactionRef,
        discount_waiver: Number(discountWaiver) || 0,
        remarks: cashierRemarks,
      });

      setMessage(res.message);
      // Fetch full receipt for print
      const receiptData = await api.getFeeReceipt(res.receipt_no);
      setPrintedReceipt(receiptData);

      // Refresh dues
      const updatedDues = await api.getStudentFeeDues(selectedStudentId);
      setStudentDues(updatedDues);
      loadData();
    } catch (err) {
      setError(err.message || 'Payment collection failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  const getTargetGrades = () => {
    if (editingStructure || gradeTarget === 'single') return [structForm.grade || (selectedGradeTab !== 'ALL' ? selectedGradeTab : '1')];
    if (gradeTarget === 'all_1_to_12') return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    if (gradeTarget === 'pre_primary') return ['Nursery', 'LKG', 'UKG'];
    if (gradeTarget === 'primary') return ['1', '2', '3', '4', '5'];
    if (gradeTarget === 'middle') return ['6', '7', '8'];
    if (gradeTarget === 'secondary') return ['9', '10'];
    if (gradeTarget === 'sr_secondary') return ['11', '12'];
    return [structForm.grade || (selectedGradeTab !== 'ALL' ? selectedGradeTab : '1')];
  };

  const getGeneratedPreview = () => {
    const head = isCustomHead ? (customFeeHead.trim() || 'Custom Fee') : structForm.fee_head;
    const amount = Number(structForm.total_amount) || 0;
    if (editingStructure || scheduleMode === 'custom') {
      return [{
        installment_name: structForm.installment_name || 'Term 1',
        total_amount: amount,
        due_date: structForm.due_date,
      }];
    }

    const parts = (academicYear || '2025-26').split('-');
    const startYear = parseInt(parts[0], 10) || 2025;
    const endYear = parts[1]?.length === 2 ? Math.floor(startYear / 100) * 100 + parseInt(parts[1], 10) : startYear + 1;
    const pad = (n) => String(n).padStart(2, '0');
    const day = pad(Math.min(Math.max(1, scheduleDueDay), 28));

    if (scheduleMode === 'monthly') {
      const months = [
        { name: 'April', y: startYear, m: 4 },
        { name: 'May', y: startYear, m: 5 },
        { name: 'June', y: startYear, m: 6 },
        { name: 'July', y: startYear, m: 7 },
        { name: 'August', y: startYear, m: 8 },
        { name: 'September', y: startYear, m: 9 },
        { name: 'October', y: startYear, m: 10 },
        { name: 'November', y: startYear, m: 11 },
        { name: 'December', y: startYear, m: 12 },
        { name: 'January', y: endYear, m: 1 },
        { name: 'February', y: endYear, m: 2 },
        { name: 'March', y: endYear, m: 3 },
      ];
      return months.map(mo => ({
        installment_name: `${mo.name} ${mo.y}`,
        total_amount: amount,
        due_date: `${mo.y}-${pad(mo.m)}-${day}`,
      }));
    }

    if (scheduleMode === 'quarterly') {
      return [
        { installment_name: `Quarter 1 (Apr – Jun ${startYear})`, total_amount: amount, due_date: `${startYear}-04-${day}` },
        { installment_name: `Quarter 2 (Jul – Sep ${startYear})`, total_amount: amount, due_date: `${startYear}-07-${day}` },
        { installment_name: `Quarter 3 (Oct – Dec ${startYear})`, total_amount: amount, due_date: `${startYear}-10-${day}` },
        { installment_name: `Quarter 4 (Jan – Mar ${endYear})`, total_amount: amount, due_date: `${endYear}-01-${day}` },
      ];
    }

    if (scheduleMode === 'half_yearly') {
      return [
        { installment_name: `Term 1 / Half-Yearly (Apr – Sep ${startYear})`, total_amount: amount, due_date: `${startYear}-04-15` },
        { installment_name: `Term 2 / Half-Yearly (Oct – Mar ${endYear})`, total_amount: amount, due_date: `${startYear}-10-15` },
      ];
    }

    if (scheduleMode === 'annual') {
      return [
        { installment_name: `Annual Session (${academicYear})`, total_amount: amount, due_date: `${startYear}-04-15` },
      ];
    }

    return [];
  };

  const handleOpenAddStructure = () => {
    setEditingStructure(null);
    setStructForm({
      grade: selectedGradeTab !== 'ALL' ? selectedGradeTab : '1',
      fee_head: 'Tuition Fee',
      total_amount: 7500,
      installment_name: 'Quarter 1',
      due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      grace_period_days: 7,
      late_fine_per_day: 50,
      is_optional: false,
    });
    setScheduleMode('quarterly');
    setGradeTarget('single');
    setIsCustomHead(false);
    setCustomFeeHead('');
    setShowAddStructure(true);
  };

  const handleOpenEditStructure = (s) => {
    setEditingStructure(s);
    setStructForm({
      grade: s.grade || (selectedGradeTab !== 'ALL' ? selectedGradeTab : '1'),
      fee_head: s.fee_head || 'Tuition Fee',
      total_amount: s.total_amount || 0,
      installment_name: s.installment_name || 'Term 1',
      due_date: s.due_date || '',
      grace_period_days: s.grace_period_days ?? 7,
      late_fine_per_day: s.late_fine_per_day ?? 50,
      is_optional: s.is_optional || false,
    });
    setScheduleMode('custom');
    const isStandard = STANDARD_FEE_HEADS.some(h => h.name === s.fee_head);
    setIsCustomHead(!isStandard);
    setCustomFeeHead(s.fee_head);
    setShowAddStructure(true);
  };

  const handleSaveStructure = async (e) => {
    e.preventDefault();
    try {
      const effectiveHead = isCustomHead ? (customFeeHead.trim() || 'Custom Fee') : structForm.fee_head;

      if (editingStructure) {
        await api.updateFeeStructure(editingStructure.id, {
          ...structForm,
          fee_head: effectiveHead,
          amount: structForm.total_amount,
        });
        setMessage(`Fee category "${effectiveHead}" updated successfully!`);
      } else if (scheduleMode === 'custom') {
        await api.createFeeStructure({
          school_id: schoolId,
          ...structForm,
          fee_head: effectiveHead,
          academic_year: academicYear,
        });
        setMessage(`Fee installment "${effectiveHead}" added successfully!`);
      } else {
        const preview = getGeneratedPreview();
        const targetGrades = getTargetGrades();
        const batchItems = [];

        for (const gr of targetGrades) {
          for (const item of preview) {
            batchItems.push({
              grade: String(gr),
              fee_head: effectiveHead,
              total_amount: Number(item.total_amount),
              installment_name: item.installment_name,
              due_date: item.due_date,
              grace_period_days: Number(structForm.grace_period_days || 7),
              late_fine_per_day: Number(structForm.late_fine_per_day || 50),
              is_optional: Boolean(structForm.is_optional),
              academic_year: academicYear,
            });
          }
        }

        if (batchItems.length === 0) {
          setError('No valid installments generated. Please check amount.');
          return;
        }

        await api.createFeeStructuresBatch({ items: batchItems });
        setMessage(`Successfully generated ${batchItems.length} fee installments for "${effectiveHead}" across ${targetGrades.length} class(es)!`);
      }

      setShowAddStructure(false);
      setEditingStructure(null);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save fee structure');
    }
  };

  // Filtered fee structures for table display
  const filteredStructures = useMemo(() => {
    return structures.filter(s => {
      const matchGrade = filterGrade === 'ALL' || String(s.grade) === String(filterGrade);
      const matchHead = filterHead === 'ALL' || s.fee_head === filterHead;
      return matchGrade && matchHead;
    });
  }, [structures, filterGrade, filterHead]);

  // Distinct fee heads in DB
  const distinctHeads = useMemo(() => {
    const set = new Set(structures.map(s => s.fee_head));
    return Array.from(set);
  }, [structures]);

  // Class annual fee calculation summary
  const classSummary = useMemo(() => {
    if (filterGrade === 'ALL') return null;
    const classItems = structures.filter(s => String(s.grade) === String(filterGrade));
    const totalAnnual = classItems.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
    const byHead = {};
    classItems.forEach(item => {
      byHead[item.fee_head] = (byHead[item.fee_head] || 0) + (Number(item.total_amount) || 0);
    });
    return {
      grade: filterGrade,
      totalAnnual,
      monthlyAvg: Math.round(totalAnnual / 12),
      itemCount: classItems.length,
      byHead,
    };
  }, [structures, filterGrade]);

  const handleDeleteStructure = async (id) => {
    if (!window.confirm('Deactivate this fee category?')) return;
    try {
      await api.deleteFeeStructure(id);
      loadData();
    } catch (err) {
      setError('Failed to delete fee structure');
    }
  };

  const handleReceiptTemplateUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReceiptTemplate(true);
    setError(null);
    try {
      const res = await api.uploadFile(file);
      setConfigForm(prev => ({
        ...prev,
        receipt_template_url: res.url
      }));
      setMessage('School receipt letterhead image uploaded successfully! Click "Save Gateway & UPI Settings" to apply.');
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      setError('Failed to upload receipt letterhead: ' + err.message);
    } finally {
      setUploadingReceiptTemplate(false);
    }
  };

  const handleQrCodeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingQrCode(true);
    setError(null);
    try {
      const res = await api.uploadFile(file);
      setConfigForm(prev => ({
        ...prev,
        qr_code_url: res.url
      }));
      setMessage('School payment QR code image uploaded successfully! Click "Save Gateway & UPI Settings" to apply.');
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      setError('Failed to upload QR code image: ' + err.message);
    } finally {
      setUploadingQrCode(false);
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      await api.saveFeeConfig({
        school_id: schoolId,
        ...configForm,
      });
      setMessage('Payment gateway and UPI VPA settings saved successfully!');
      loadData();
    } catch (err) {
      setError('Failed to update config');
    }
  };

  const handleTestGateway = async () => {
    setTestingGateway(true);
    setGatewayTestResult(null);
    try {
      const res = await api.testSchoolPaymentConfig({
        gateway_provider: configForm.gateway_provider,
        merchant_key: configForm.merchant_key,
        merchant_secret: configForm.merchant_secret,
        upi_vpa: configForm.upi_vpa,
      });
      setGatewayTestResult(res);
      if (res.status === 'success') {
        setMessage(res.message);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setGatewayTestResult({ status: 'error', message: err.message });
      setError(err.message);
    } finally {
      setTestingGateway(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Sub-tab Navigation */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', flexWrap: 'wrap' }}>
        {[
          { id: 'overview', label: 'Financial Overview & Receipts', icon: <DollarSign size={15} /> },
          { id: 'collect', label: 'Cashier POS Counter Desk', icon: <Receipt size={15} /> },
          { id: 'structures', label: `Fee Structures (${structures.length})`, icon: <CreditCard size={15} /> },
          { id: 'config', label: 'Gateway & School UPI Config', icon: <Settings size={15} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setSubTab(tab.id); setMessage(null); setError(null); }}
            className={subTab === tab.id ? 'btn-primary' : 'btn-secondary'}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 14px' }}
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

      {/* ── SUB-TAB 1: FINANCIAL OVERVIEW ── */}
      {subTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="tech-card" style={{ padding: '20px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Total Fees Collected</span>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#16a34a', marginTop: '6px' }}>
                ₹{Number(overview?.total_collected || 0).toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: '11px', color: '#16a34a' }}>Live verified payments</span>
            </div>

            <div className="tech-card" style={{ padding: '20px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Total Expected (Annual)</span>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
                ₹{Number(overview?.total_expected || 0).toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Across enrolled students</span>
            </div>

            <div className="tech-card" style={{ padding: '20px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Outstanding Balance Due</span>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#dc2626', marginTop: '6px' }}>
                ₹{Number(overview?.total_outstanding || 0).toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: '11px', color: '#dc2626' }}>Pending collection</span>
            </div>
          </div>

          {/* Recent Counter Receipts */}
          <div className="tech-card" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '14px', color: 'var(--text-primary)' }}>
              Recent Verified Receipts
            </h4>

            {overview?.recent_payments && overview.recent_payments.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px' }}>Receipt #</th>
                      <th style={{ padding: '10px' }}>Student Name</th>
                      <th style={{ padding: '10px' }}>Class</th>
                      <th style={{ padding: '10px' }}>Amount Paid</th>
                      <th style={{ padding: '10px' }}>Mode</th>
                      <th style={{ padding: '10px' }}>Date</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.recent_payments.map((p) => (
                      <tr key={p.receipt_no} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '10px', fontWeight: 700, color: 'var(--primary)' }}>{p.receipt_no}</td>
                        <td style={{ padding: '10px', fontWeight: 600 }}>{p.student_name}</td>
                        <td style={{ padding: '10px' }}>Grade {p.grade}-{p.section}</td>
                        <td style={{ padding: '10px', fontWeight: 700, color: '#16a34a' }}>₹{p.amount.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '10px' }}>
                          <span className="pill pill-primary" style={{ fontSize: '10px' }}>{p.mode}</span>
                        </td>
                        <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{p.date}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>
                          <button
                            onClick={async () => {
                              const r = await api.getFeeReceipt(p.receipt_no);
                              setPrintedReceipt(r);
                            }}
                            className="btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Printer size={12} /> Print
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No receipts recorded yet. Use the Cashier Counter Desk tab to record a payment.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SUB-TAB 2: CASHIER COUNTER DESK ── */}
      {subTab === 'collect' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          {/* Collection Form */}
          <div className="tech-card" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)' }}>
              Cashier POS Fee Collection
            </h4>

            <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Select Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', marginTop: '4px' }}
                  required
                >
                  <option value="">-- Search & Select Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.admission_no}) • Grade {s.grade}-{s.section}
                    </option>
                  ))}
                </select>
              </div>

              {studentDues && (
                <>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Fee Head / Installment</label>
                    <select
                      value={selectedStructureId}
                      onChange={(e) => {
                        setSelectedStructureId(e.target.value);
                        const match = studentDues.breakdown.find((b) => b.structure_id === e.target.value);
                        if (match) setCollectAmount(match.net_due > 0 ? match.net_due : match.base_amount);
                      }}
                      className="input-field"
                      style={{ width: '100%', marginTop: '4px' }}
                    >
                      {studentDues.breakdown.map((b) => (
                        <option key={b.structure_id} value={b.structure_id}>
                          {b.fee_head} ({b.installment_name}) — Due: ₹{b.net_due} {b.late_fine > 0 ? `(Includes ₹${b.late_fine} late fine)` : ''} [{b.status}]
                        </option>
                      ))}
                      <option value="ad_hoc">Other / Ad-hoc Payment</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Amount Being Paid (₹)</label>
                      <input
                        type="number"
                        value={collectAmount}
                        onChange={(e) => setCollectAmount(e.target.value)}
                        className="input-field"
                        style={{ width: '100%', marginTop: '4px', fontWeight: 700 }}
                        required
                        min="1"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Payment Mode</label>
                      <select
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value)}
                        className="input-field"
                        style={{ width: '100%', marginTop: '4px' }}
                      >
                        <option value="CASH">Cash at Counter</option>
                        <option value="UPI_COUNTER">Counter Dynamic UPI QR</option>
                        <option value="CARD">POS Debit/Credit Card</option>
                        <option value="CHEQUE">Bank Cheque / DD</option>
                        <option value="NEFT">Direct Bank Transfer / NEFT</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Transaction Ref / Cheque #</label>
                      <input
                        type="text"
                        placeholder="e.g. UPI Ref / Cheque # / POS Auth"
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        className="input-field"
                        style={{ width: '100%', marginTop: '4px' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Scholarship / Fine Waiver (₹)</label>
                      <input
                        type="number"
                        value={discountWaiver}
                        onChange={(e) => setDiscountWaiver(e.target.value)}
                        className="input-field"
                        style={{ width: '100%', marginTop: '4px' }}
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Receipt Remarks / Notes</label>
                    <input
                      type="text"
                      placeholder="Optional notes printed on receipt"
                      value={cashierRemarks}
                      onChange={(e) => setCashierRemarks(e.target.value)}
                      className="input-field"
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={processingPayment}
                    className="btn-primary"
                    style={{ marginTop: '8px', padding: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <Printer size={16} />
                    {processingPayment ? 'Processing & Generating Receipt...' : `Collect ₹${collectAmount} & Print Official Receipt`}
                  </button>
                </>
              )}
            </form>
          </div>

          {/* Student Live Statement Sidebar */}
          <div className="tech-card" style={{ padding: '24px', background: '#fafafa' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '14px', color: 'var(--text-primary)' }}>
              Student Dues Ledger Statement
            </h4>

            {studentDues ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 800, fontSize: '14px' }}>{studentDues.student.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Adm No: {studentDues.student.admission_no} • Class {studentDues.student.grade}-{studentDues.student.section}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '13px' }}>
                    <span>Total Fee: <strong>₹{studentDues.summary.total_fee_expected}</strong></span>
                    <span style={{ color: '#16a34a' }}>Paid: <strong>₹{studentDues.summary.total_fee_paid}</strong></span>
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '14px', fontWeight: 800, color: studentDues.summary.total_balance_outstanding > 0 ? '#dc2626' : '#16a34a' }}>
                    Net Outstanding: ₹{studentDues.summary.total_balance_outstanding}
                  </div>
                </div>

                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Itemized Installment Breakdown:</div>
                {studentDues.breakdown.map((item) => (
                  <div key={item.structure_id} style={{ padding: '10px', background: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                      <span>{item.fee_head} ({item.installment_name})</span>
                      <span style={{ color: item.status === 'PAID' ? '#16a34a' : (item.status === 'OVERDUE' ? '#dc2626' : '#f59e0b') }}>
                        {item.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', color: 'var(--text-muted)' }}>
                      <span>Base: ₹{item.base_amount}</span>
                      <span>Paid: ₹{item.amount_paid}</span>
                      <span>Due: ₹{item.net_due}</span>
                    </div>
                    {item.late_fine > 0 && (
                      <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '2px' }}>
                        Includes ₹{item.late_fine} late penalty
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Select a student on the left to inspect their live fee statement and record a payment.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SUB-TAB 3: FEE STRUCTURES & SCHEDULE WIZARD ── */}
      {subTab === 'structures' && (
        <div className="tech-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Grade-wise Fee Structure & Installment Schedules
                </h4>
                <span className="pill pill-primary" style={{ fontSize: '11px', fontWeight: 700 }}>
                  CBSE / State Board Standard
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Configure multi-component fee heads (Tuition, Computer Lab, Science Lab, Transport) with automated Monthly (12M) or Quarterly (4Q) billing.
              </p>
            </div>
            <button
              onClick={() => {
                if (showAddStructure) {
                  setShowAddStructure(false);
                } else {
                  handleOpenAddStructure();
                }
              }}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', fontWeight: 700 }}
            >
              {showAddStructure ? 'Close Setup' : <><Plus size={16} /> Create Fee Schedule</>}
            </button>
          </div>

          {/* ── EXPANDABLE FEE SETUP & AUTOMATION WIZARD ── */}
          {showAddStructure && (
            <div style={{
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1.5px solid #cbd5e1',
              padding: '22px',
              marginBottom: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}>
              <form onSubmit={handleSaveStructure}>
                {/* STEP 1: Fee Head Preset Selector */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    1. Select Fee Head Component:
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {STANDARD_FEE_HEADS.map(head => {
                      const isSelected = !isCustomHead && structForm.fee_head === head.name;
                      return (
                        <button
                          type="button"
                          key={head.name}
                          onClick={() => {
                            setIsCustomHead(false);
                            setStructForm({ ...structForm, fee_head: head.name });
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '7px 12px',
                            borderRadius: '8px',
                            border: isSelected ? '1.5px solid var(--primary)' : '1px solid #cbd5e1',
                            background: isSelected ? '#eff6ff' : '#ffffff',
                            color: isSelected ? 'var(--primary)' : '#334155',
                            fontWeight: isSelected ? 700 : 500,
                            fontSize: '12.5px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>{head.icon}</span>
                          <span>{head.name}</span>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setIsCustomHead(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 12px',
                        borderRadius: '8px',
                        border: isCustomHead ? '1.5px solid var(--primary)' : '1px solid #cbd5e1',
                        background: isCustomHead ? '#eff6ff' : '#ffffff',
                        color: isCustomHead ? 'var(--primary)' : '#334155',
                        fontWeight: isCustomHead ? 700 : 500,
                        fontSize: '12.5px',
                        cursor: 'pointer',
                      }}
                    >
                      <span>➕</span>
                      <span>Custom Head...</span>
                    </button>
                  </div>

                  {isCustomHead && (
                    <div style={{ marginTop: '10px', maxWidth: '380px' }}>
                      <input
                        type="text"
                        placeholder="Enter custom fee head name (e.g. Robotics Lab Fee)"
                        value={customFeeHead}
                        onChange={(e) => setCustomFeeHead(e.target.value)}
                        className="form-input"
                        required
                        autoFocus
                      />
                    </div>
                  )}
                </div>

                {/* STEP 2: Billing Schedule Frequency (Indian School standard) */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    2. Billing Frequency / Payment Term Schedule:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                    {[
                      { id: 'monthly', title: 'Monthly (12M)', subtitle: '12 Installments: Apr to Mar', icon: '📅' },
                      { id: 'quarterly', title: 'Quarterly (4Q)', subtitle: '4 Terms: Q1, Q2, Q3, Q4', icon: '📊' },
                      { id: 'half_yearly', title: 'Half-Yearly (2T)', subtitle: '2 Terms: Term 1 & Term 2', icon: '🌓' },
                      { id: 'annual', title: 'Annual Session', subtitle: '1 Lump Sum Payment', icon: '📆' },
                      { id: 'custom', title: 'Single Custom', subtitle: 'Single specific installment', icon: '✏️' },
                    ].map(mode => {
                      const isModeActive = scheduleMode === mode.id;
                      return (
                        <button
                          type="button"
                          key={mode.id}
                          onClick={() => setScheduleMode(mode.id)}
                          style={{
                            padding: '10px 12px',
                            textAlign: 'left',
                            borderRadius: '8px',
                            border: isModeActive ? '2px solid var(--primary)' : '1px solid #cbd5e1',
                            background: isModeActive ? '#ffffff' : '#f1f5f9',
                            boxShadow: isModeActive ? '0 2px 6px rgba(2,132,199,0.12)' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ fontSize: '13px', fontWeight: 700, color: isModeActive ? 'var(--primary)' : '#1e293b' }}>
                            {mode.icon} {mode.title}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                            {mode.subtitle}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* STEP 3: Class Applicability & Amount Configuration */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '18px' }}>
                  {!editingStructure && (
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Class Applicability
                      </label>
                      <select
                        value={gradeTarget}
                        onChange={(e) => setGradeTarget(e.target.value)}
                        className="form-input"
                      >
                        <option value="single">Single Specific Class</option>
                        <option value="all_1_to_12">All Classes (Class 1 to 12)</option>
                        <option value="primary">Primary Wing (Class 1 to 5)</option>
                        <option value="middle">Middle Wing (Class 6 to 8)</option>
                        <option value="secondary">Secondary Wing (Class 9 & 10)</option>
                        <option value="sr_secondary">Senior Secondary (Class 11 & 12)</option>
                        <option value="pre_primary">Pre-Primary (Nursery, LKG, UKG)</option>
                      </select>
                    </div>
                  )}

                  {(gradeTarget === 'single' || editingStructure) && (
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Target Grade / Class
                      </label>
                      <select
                        value={structForm.grade}
                        onChange={(e) => setStructForm({ ...structForm, grade: e.target.value })}
                        className="form-input"
                        required
                      >
                        {GRADE_OPTIONS.map(g => (
                          <option key={g} value={g}>Class {g}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      {scheduleMode === 'monthly' ? 'Amount (₹ per Month)' : (scheduleMode === 'quarterly' ? 'Amount (₹ per Quarter)' : 'Amount (₹ per Installment)')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="e.g. 2500"
                      value={structForm.total_amount}
                      onChange={(e) => setStructForm({ ...structForm, total_amount: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>

                  {scheduleMode !== 'custom' && !editingStructure ? (
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Due Day of Period Month (1 - 28)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="28"
                        value={scheduleDueDay}
                        onChange={(e) => setScheduleDueDay(Math.min(28, Math.max(1, parseInt(e.target.value, 10) || 10)))}
                        className="form-input"
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                          Installment Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Term 1 or April 2025"
                          value={structForm.installment_name}
                          onChange={(e) => setStructForm({ ...structForm, installment_name: e.target.value })}
                          className="form-input"
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={structForm.due_date}
                          onChange={(e) => setStructForm({ ...structForm, due_date: e.target.value })}
                          className="form-input"
                          required
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Grace Days & Late Fine
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <input
                        type="number"
                        placeholder="Grace Days"
                        value={structForm.grace_period_days}
                        onChange={(e) => setStructForm({ ...structForm, grace_period_days: e.target.value })}
                        className="form-input"
                        title="Grace Period Days"
                      />
                      <input
                        type="number"
                        placeholder="₹/day"
                        value={structForm.late_fine_per_day}
                        onChange={(e) => setStructForm({ ...structForm, late_fine_per_day: e.target.value })}
                        className="form-input"
                        title="Late Fine per day"
                      />
                    </div>
                  </div>
                </div>

                {/* STEP 4: Live Dynamic Schedule Calculation Preview */}
                {(() => {
                  const preview = getGeneratedPreview();
                  const targetGrades = getTargetGrades();
                  const totalAnnualPerStudent = preview.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
                  const effectiveHead = isCustomHead ? (customFeeHead.trim() || 'Custom Fee') : structForm.fee_head;

                  return (
                    <div style={{
                      background: '#ffffff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '10px',
                      padding: '16px',
                      marginBottom: '18px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Sparkles size={16} color="var(--primary)" />
                          <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                            Generated Schedule Preview: {effectiveHead}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px' }}>
                          <span>Target: <strong>{targetGrades.length === 1 ? `Class ${targetGrades[0]}` : `${targetGrades.length} Classes (${targetGrades.join(', ')})`}</strong></span>
                          <span>•</span>
                          <span style={{ color: 'var(--primary)', fontWeight: 800 }}>
                            Annual per Student: ₹{totalAnnualPerStudent.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '140px', overflowY: 'auto' }}>
                        {preview.map((inst, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              fontSize: '11.5px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <Calendar size={12} color="#64748b" />
                            <strong>{inst.installment_name}</strong>
                            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>₹{inst.total_amount?.toLocaleString('en-IN')}</span>
                            <span style={{ color: '#94a3b8', fontSize: '10.5px' }}>(Due: {inst.due_date})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Wizard Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => { setShowAddStructure(false); setEditingStructure(null); }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ padding: '10px 22px', fontWeight: 700 }}>
                    {editingStructure ? 'Update Fee Entry' : `Generate & Save Schedule (${getGeneratedPreview().length * getTargetGrades().length} Entries)`}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── FILTER & SUMMARY BAR ── */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px',
            background: '#f8fafc',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Filter size={14} color="#64748b" />
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Filter Grade:</label>
                <select
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                  className="form-input"
                  style={{ padding: '4px 10px', fontSize: '12px', width: 'auto' }}
                >
                  <option value="ALL">All Grades (Full School)</option>
                  {GRADE_OPTIONS.map(g => (
                    <option key={g} value={g}>Class {g}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Fee Head:</label>
                <select
                  value={filterHead}
                  onChange={(e) => setFilterHead(e.target.value)}
                  className="form-input"
                  style={{ padding: '4px 10px', fontSize: '12px', width: 'auto' }}
                >
                  <option value="ALL">All Fee Heads ({distinctHeads.length})</option>
                  {distinctHeads.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ fontSize: '12.5px', color: '#64748b' }}>
              Showing <strong>{filteredStructures.length}</strong> active installments
            </div>
          </div>

          {/* ── REAL ANNUAL ACADEMIC FEE SUMMARY (WHEN CLASS FILTERED) ── */}
          {classSummary && (
            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '10px',
              padding: '14px 18px',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e3a8a' }}>
                  Class {classSummary.grade} Annual Fee Commitment
                </div>
                <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '2px' }}>
                  Total {classSummary.itemCount} installments scheduled across the academic session.
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  {Object.entries(classSummary.byHead).map(([head, sum]) => (
                    <span key={head} style={{ background: '#ffffff', padding: '3px 8px', borderRadius: '4px', border: '1px solid #bfdbfe', fontSize: '11px', color: '#1e40af', fontWeight: 600 }}>
                      {head}: <strong>₹{sum.toLocaleString('en-IN')}</strong> ({classSummary.totalAnnual > 0 ? Math.round(sum / classSummary.totalAnnual * 100) : 0}%)
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#1d4ed8' }}>
                  ₹{classSummary.totalAnnual.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>
                  ≈ ₹{classSummary.monthlyAvg.toLocaleString('en-IN')} / month
                </div>
              </div>
            </div>
          )}

          {/* ── FEE STRUCTURES ROSTER TABLE ── */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px' }}>Grade</th>
                <th style={{ padding: '10px' }}>Fee Head Component</th>
                <th style={{ padding: '10px' }}>Installment Term</th>
                <th style={{ padding: '10px' }}>Amount</th>
                <th style={{ padding: '10px' }}>Due Date</th>
                <th style={{ padding: '10px' }}>Late Penalty Rule</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStructures.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px', fontWeight: 700 }}>Class {s.grade}</td>
                  <td style={{ padding: '10px', fontWeight: 600, color: '#0f172a' }}>
                    <span style={{ marginRight: '6px' }}>
                      {STANDARD_FEE_HEADS.find(h => h.name === s.fee_head)?.icon || '📌'}
                    </span>
                    {s.fee_head}
                  </td>
                  <td style={{ padding: '10px', color: '#334155' }}>{s.installment_name}</td>
                  <td style={{ padding: '10px', fontWeight: 700, color: 'var(--primary)' }}>
                    ₹{s.total_amount?.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{s.due_date}</td>
                  <td style={{ padding: '10px', fontSize: '11.5px', color: '#64748b' }}>
                    ₹{s.late_fine_per_day}/day after {s.grace_period_days}d
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button onClick={() => handleOpenEditStructure(s)} className="btn-secondary" style={{ padding: '4px 8px', color: 'var(--primary)' }} title="Edit Structure">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => handleDeleteStructure(s.id)} className="btn-secondary" style={{ padding: '4px 8px', color: '#ef4444' }} title="Delete Structure">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStructures.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No fee structures found. Click <strong>"Create Fee Schedule"</strong> to generate Monthly, Quarterly, or Annual schedules.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── SUB-TAB 4: GATEWAY CONFIG ── */}
      {subTab === 'config' && (
        <div className="tech-card" style={{ padding: '24px', maxWidth: '750px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Multi-Tenant Payment Gateway & School UPI Configuration
            </h4>
            <span className="pill pill-emerald" style={{ fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Lock size={11} /> AES-256 Vault Encrypted
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Configure merchant keys for online fee collection and parent PWA checkout. Secrets are encrypted at rest.
          </p>

          <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600 }}>Payment Gateway Provider</label>
              <select
                value={configForm.gateway_provider}
                onChange={(e) => setConfigForm({ ...configForm, gateway_provider: e.target.value })}
                className="input-field"
                style={{ width: '100%', marginTop: '4px' }}
              >
                <option value="MANUAL">Manual Offline / Counter Cashier</option>
                <option value="RAZORPAY">Razorpay (India UPI, Cards, NetBanking)</option>
                <option value="STRIPE">Stripe Payments (Global Cards & Wallets)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>School Official UPI VPA</label>
                <input
                  type="text"
                  placeholder="e.g. greenwood@hdfcbank"
                  value={configForm.upi_vpa}
                  onChange={(e) => setConfigForm({ ...configForm, upi_vpa: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', marginTop: '4px' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>UPI Beneficiary Account Name</label>
                <input
                  type="text"
                  placeholder="e.g. Greenwood High Fee Account"
                  value={configForm.upi_account_name}
                  onChange={(e) => setConfigForm({ ...configForm, upi_account_name: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', marginTop: '4px' }}
                  required
                />
              </div>
            </div>

            {/* School Bank Account & QR Code (Shown in Parent App) */}
            <div style={{ padding: '14px', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#166534', marginBottom: '4px' }}>
                🏦 School Bank Account & Payment QR (Direct Transfer / Offline Deposit)
              </div>
              <p style={{ fontSize: '11.5px', color: '#15803d', margin: '0 0 12px 0' }}>
                These details are displayed directly in the Parent Portal & Mobile App so parents can pay via NEFT/IMPS or scan your school's QR code.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#166534' }}>Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. State Bank of India, HDFC"
                    value={configForm.bank_name || ''}
                    onChange={(e) => setConfigForm({ ...configForm, bank_name: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', marginTop: '4px', background: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#166534' }}>Account Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 50200012345678"
                    value={configForm.bank_account_no || ''}
                    onChange={(e) => setConfigForm({ ...configForm, bank_account_no: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', marginTop: '4px', background: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#166534' }}>IFSC Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SBIN0001234"
                    value={configForm.bank_ifsc || ''}
                    onChange={(e) => setConfigForm({ ...configForm, bank_ifsc: e.target.value.toUpperCase() })}
                    className="input-field"
                    style={{ width: '100%', marginTop: '4px', background: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#166534' }}>Beneficiary / Account Holder Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Greenwood High Educational Trust"
                    value={configForm.bank_account_holder || ''}
                    onChange={(e) => setConfigForm({ ...configForm, bank_account_holder: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', marginTop: '4px', background: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px', background: '#f0fdf4', padding: '12px 14px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#166534' }}>School Payment UPI QR Code Image</label>
                  {configForm.qr_code_url && (
                    <span className="pill pill-emerald" style={{ fontSize: '10px', fontWeight: 700 }}>
                      ✓ QR Code Image Attached
                    </span>
                  )}
                </div>

                <div style={{
                  background: '#ffffff',
                  border: configForm.qr_code_url ? '1.5px solid #86efac' : '2px dashed #86efac',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {configForm.qr_code_url ? (
                      <div style={{ width: '64px', height: '64px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #cbd5e1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img
                          src={configForm.qr_code_url.startsWith('http') ? configForm.qr_code_url : `${API_BASE}${configForm.qr_code_url}`}
                          alt="School Payment QR"
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    ) : (
                      <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                        <Upload size={20} />
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#166534' }}>
                        {configForm.qr_code_url ? 'Official Payment QR Active' : 'Upload School UPI QR Image'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        PNG, JPG, or WebP format (Rendered inside Parent App for instant UPI scanning)
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label
                      className="btn-primary"
                      style={{
                        fontSize: '11.5px',
                        padding: '7px 12px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        margin: 0
                      }}
                    >
                      <Upload size={13} />
                      {uploadingQrCode ? 'Uploading...' : (configForm.qr_code_url ? 'Change QR Image' : 'Upload QR Image')}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleQrCodeUpload}
                        disabled={uploadingQrCode}
                      />
                    </label>

                    {configForm.qr_code_url && (
                      <button
                        type="button"
                        onClick={() => setConfigForm({ ...configForm, qr_code_url: '' })}
                        className="btn-secondary"
                        style={{ fontSize: '11px', padding: '7px 10px', color: '#dc2626' }}
                        title="Remove uploaded QR code"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#166534' }}>Payment Instructions for Parents</label>
                <textarea
                  placeholder="e.g. Please mention Student Admission Number in transfer remarks and submit UTR to school office."
                  value={configForm.payment_instructions || ''}
                  onChange={(e) => setConfigForm({ ...configForm, payment_instructions: e.target.value })}
                  className="input-field"
                  rows={2}
                  style={{ width: '100%', marginTop: '4px', background: '#fff', resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Merchant API Key / Key ID</label>
                <input
                  type="text"
                  placeholder="rzp_live_... or pk_live_..."
                  value={configForm.merchant_key || ''}
                  onChange={(e) => setConfigForm({ ...configForm, merchant_key: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Receipt Serial Prefix</label>
                <input
                  type="text"
                  placeholder="e.g. RCP or GWH"
                  value={configForm.receipt_prefix || 'RCP'}
                  onChange={(e) => setConfigForm({ ...configForm, receipt_prefix: e.target.value.toUpperCase() })}
                  className="input-field"
                  style={{ width: '100%', marginTop: '4px' }}
                  required
                />
              </div>
            </div>

            {/* School Fee Receipt Format & Custom Letterhead Uploader */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  School Fee Receipt Format & Official Letterhead
                </div>
                {configForm.receipt_template_url && (
                  <span className="pill pill-emerald" style={{ fontSize: '11px', fontWeight: 700 }}>
                    ✓ Custom Letterhead Active
                  </span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Upload your school's official letterhead or printed receipt format image. The system will automatically place this authentic header onto all fee receipts and render student particulars, dues, and transaction details.
              </p>

              <div style={{
                background: '#ffffff',
                border: configForm.receipt_template_url ? '1.5px solid #bbf7d0' : '2px dashed #cbd5e1',
                borderRadius: '8px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {configForm.receipt_template_url ? (
                    <div style={{ width: '100px', height: '60px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src={configForm.receipt_template_url.startsWith('http') ? configForm.receipt_template_url : `${API_BASE}${configForm.receipt_template_url}`}
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
                      {configForm.receipt_template_url ? 'Official Letterhead / Format Image Attached' : 'Upload School Receipt Letterhead Image'}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                      {configForm.receipt_template_url ? 'Affixed to all cashier POS receipts & downloadable PDF statements' : 'PNG, JPG, or WebP format (School letterhead header banner or full page)'}
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
                    {uploadingReceiptTemplate ? 'Uploading...' : (configForm.receipt_template_url ? 'Change Letterhead Image' : 'Upload Letterhead Image')}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleReceiptTemplateUpload}
                      disabled={uploadingReceiptTemplate}
                    />
                  </label>

                  {configForm.receipt_template_url && (
                    <button
                      type="button"
                      onClick={() => setConfigForm({ ...configForm, receipt_template_url: '' })}
                      className="btn-secondary"
                      style={{ fontSize: '12px', padding: '8px 12px', color: '#dc2626' }}
                      title="Revert to standard verified CBSE template"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Optional Advanced HTML Format */}
              <details style={{ marginTop: '10px' }}>
                <summary style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', cursor: 'pointer', userSelect: 'none' }}>
                  Advanced: Custom HTML Receipt Format Code (Optional)
                </summary>
                <div style={{ marginTop: '8px' }}>
                  <textarea
                    rows={2}
                    placeholder="Leave blank for automatic standardized board fee receipt, or paste school HTML receipt template."
                    value={configForm.receipt_template_html || ''}
                    onChange={(e) => setConfigForm({ ...configForm, receipt_template_html: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', fontFamily: 'monospace', fontSize: '11.5px' }}
                  />
                </div>
              </details>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Merchant Secret Key / Private API Key</label>
                {configForm.has_secret && (
                  <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>
                    ✓ Encrypted in Vault
                  </span>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showSecret ? 'text' : 'password'}
                  placeholder={configForm.has_secret ? '•••••••••••••••• (Leave blank to keep existing secret)' : 'Enter gateway secret key'}
                  value={configForm.merchant_secret || ''}
                  onChange={(e) => setConfigForm({ ...configForm, merchant_secret: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', paddingRight: '40px' }}
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
            </div>

            {/* Live Gateway Connection Diagnostic */}
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
                    Live Gateway Diagnostic
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    Test merchant authentication against {configForm.gateway_provider} servers in real-time.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleTestGateway}
                  disabled={testingGateway || configForm.gateway_provider === 'MANUAL'}
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Activity size={14} className={testingGateway ? 'spin' : ''} />
                  {testingGateway ? 'Testing...' : 'Test Gateway Connection'}
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
                  {gatewayTestResult.status === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{gatewayTestResult.message}</span>
                </div>
              )}
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '10px', padding: '12px', fontWeight: 700 }}>
              Save Gateway & UPI Settings
            </button>
          </form>
        </div>
      )}

      {/* ── PRINTABLE OFFICIAL RECEIPT MODAL ── */}
      {printedReceipt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '520px',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* School Letterhead */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '14px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>{printedReceipt.school.name}</h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0' }}>
                Affiliated to {printedReceipt.school.board} • {printedReceipt.school.city}, {printedReceipt.school.state}
              </p>
              <div style={{ marginTop: '8px', display: 'inline-block', background: '#f1f5f9', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                OFFICIAL FEE RECEIPT
              </div>
            </div>

            {/* Receipt Metadata */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <div>
                <span style={{ color: '#64748b' }}>Receipt No: </span>
                <strong>{printedReceipt.receipt_no}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Date: </span>
                <strong>{printedReceipt.payment_date}</strong>
              </div>
            </div>

            {/* Student Info Box */}
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Student: <strong>{printedReceipt.student.name}</strong></span>
                <span>Class: <strong>{printedReceipt.student.grade}-{printedReceipt.student.section}</strong></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', color: '#64748b' }}>
                <span>Admission No: {printedReceipt.student.admission_no}</span>
                <span>Father: {printedReceipt.student.father_name || 'Guardian'}</span>
              </div>
            </div>

            {/* Particulars Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #cbd5e1', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '8px 0' }}>Particulars / Head</th>
                  <th style={{ padding: '8px 0', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 0' }}>{printedReceipt.fee_head} ({printedReceipt.installment_name})</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>₹{printedReceipt.base_amount}</td>
                </tr>
                {printedReceipt.fine_amount > 0 && (
                  <tr>
                    <td style={{ padding: '8px 0', color: '#dc2626' }}>Late Fine Surcharge</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', color: '#dc2626' }}>+₹{printedReceipt.fine_amount}</td>
                  </tr>
                )}
                {printedReceipt.discount_waiver > 0 && (
                  <tr>
                    <td style={{ padding: '8px 0', color: '#16a34a' }}>Authorized Concession Waiver</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', color: '#16a34a' }}>-₹{printedReceipt.discount_waiver}</td>
                  </tr>
                )}
                <tr style={{ borderTop: '2px solid #0f172a', fontWeight: 800, fontSize: '15px' }}>
                  <td style={{ padding: '10px 0' }}>Total Paid ({printedReceipt.payment_mode})</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', color: '#16a34a' }}>₹{printedReceipt.total_paid}</td>
                </tr>
              </tbody>
            </table>

            {/* Cashier Footer with Official Round Stamp & Signature */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {printedReceipt.school?.stamp_url && (
                  <img
                    src={printedReceipt.school.stamp_url.startsWith('http') ? printedReceipt.school.stamp_url : `${API_BASE}${printedReceipt.school.stamp_url}`}
                    alt="School Official Stamp"
                    style={{ width: '64px', height: '64px', objectFit: 'contain', opacity: 0.9 }}
                  />
                )}
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Mode: <strong>{printedReceipt.payment_mode}</strong></div>
                  {printedReceipt.transaction_ref && <div style={{ fontSize: '10.5px', color: '#64748b' }}>Ref: {printedReceipt.transaction_ref}</div>}
                  <div style={{ color: '#16a34a', fontWeight: 700, fontSize: '11px', marginTop: '2px' }}>✓ Payment Verified & Authorized</div>
                </div>
              </div>

              <div style={{ textAlign: 'center', minWidth: '130px' }}>
                {printedReceipt.school?.signature_url ? (
                  <img
                    src={printedReceipt.school.signature_url.startsWith('http') ? printedReceipt.school.signature_url : `${API_BASE}${printedReceipt.school.signature_url}`}
                    alt="Principal Signature"
                    style={{ height: '38px', maxWidth: '120px', objectFit: 'contain', marginBottom: '2px' }}
                  />
                ) : (
                  <div style={{ height: '28px' }} />
                )}
                <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '4px', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                  {printedReceipt.school?.principal_name ? `Principal / ${printedReceipt.school.principal_name}` : 'Accounts Officer'}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <a
                href={api.getFeeReceiptHtmlUrl(printedReceipt.receipt_no)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{
                  flex: 1,
                  padding: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                  backgroundColor: '#0284c7'
                }}
              >
                <ExternalLink size={15} /> Official Printable / PDF
              </a>
              <button
                onClick={() => window.print()}
                className="btn-secondary"
                style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Printer size={15} /> Quick Print
              </button>
              <button
                onClick={() => setPrintedReceipt(null)}
                className="btn-secondary"
                style={{ padding: '10px 18px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
