import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import {
  Check, CheckCircle2, AlertCircle, Loader2, Sparkles,
  Zap, Crown, Shield, ArrowRight, CreditCard, Users, GraduationCap
} from 'lucide-react';

const planIcons = {
  starter: <Shield style={{ width: 22, height: 22, color: '#38bdf8' }} />,
  growth: <Zap style={{ width: 22, height: 22, color: '#818cf8' }} />,
  enterprise: <Crown style={{ width: 22, height: 22, color: '#f59e0b' }} />,
};

const planHeaderColors = {
  starter: { border: '#0284c7', bg: 'linear-gradient(135deg, #0369a1 0%, #0c4a6e 100%)', badge: '#0284c7' },
  growth: { border: '#6366f1', bg: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)', badge: '#6366f1' },
  enterprise: { border: '#d97706', bg: 'linear-gradient(135deg, #b45309 0%, #78350f 100%)', badge: '#d97706' },
};

export default function PlanSelector({ schoolId, isModal = false, onPlanUpdated }) {
  const [plans, setPlans] = useState([]);
  const [activeTier, setActiveTier] = useState('starter');
  const [billingCycle, setBillingCycle] = useState('yearly'); // 'monthly' | 'yearly'
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [checkoutModal, setCheckoutModal] = useState(null);
  const [subStatus, setSubStatus] = useState(null);

  useEffect(() => {
    loadPlans();
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('payment') === 'success') {
        const txnid = urlParams.get('txnid') || '';
        setFeedback({
          type: 'success',
          message: `PayU payment successful! ${txnid ? `(Ref: ${txnid})` : ''} Your SaaS subscription has been activated.`,
        });
      } else if (urlParams.get('payment') === 'failed') {
        setFeedback({
          type: 'error',
          message: 'PayU payment failed or was cancelled. Please try again.',
        });
      }
    } catch (_) {}
  }, [schoolId]);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const [plansData, statusData] = await Promise.all([
        api.getSubscriptionPlans(),
        api.getSubscriptionStatus(),
      ]);
      setPlans(plansData?.plans || []);
      setActiveTier(statusData?.tier || statusData?.plan_tier || 'starter');
      setSubStatus(statusData);
    } catch (err) {
      console.error('Failed to load subscription info', err);
      setFeedback({ type: 'error', message: 'Failed to load subscription tiers.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (tier) => {
    if (tier === activeTier) return;
    setProcessing(true);
    setFeedback(null);

    try {
      if (tier === 'starter') {
        const res = await api.createFreeTrialSubscription(billingCycle);
        setFeedback({ type: 'success', message: res.message || 'Trial started successfully!' });
        setActiveTier('starter');
        if (onPlanUpdated) onPlanUpdated('starter');
      } else {
        const initRes = await api.initiatePayUPayment({
          plan_tier: tier,
          billing_cycle: billingCycle,
        });

        if (initRes?.payu_payload) {
          setCheckoutModal(initRes.payu_payload);
        }
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to initiate plan upgrade.',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handlePayUVerify = async (isSuccess = true) => {
    if (!checkoutModal) return;
    setProcessing(true);
    try {
      const verifyRes = await api.verifyPayUPayment({
        txnid: checkoutModal.txnid,
        status: isSuccess ? 'success' : 'failure',
        hash: checkoutModal.hash,
        payu_hash: checkoutModal.hash,
        tier: checkoutModal.plan_tier,
        plan_tier: checkoutModal.plan_tier,
        billing_cycle: checkoutModal.billing_cycle,
      });

      if (verifyRes.success) {
        setFeedback({
          type: 'success',
          message: `Congratulations! Your school is now upgraded to ${checkoutModal.plan_tier.toUpperCase()}!`,
        });
        setActiveTier(checkoutModal.plan_tier);
        setCheckoutModal(null);
        if (onPlanUpdated) onPlanUpdated(checkoutModal.plan_tier);
      } else {
        setFeedback({
          type: 'error',
          message: verifyRes.message || 'Payment verification failed.',
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Payment verification error.',
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: isModal ? '100%' : '1140px', margin: '0 auto', padding: isModal ? '8px' : '16px 0' }}>
      {/* Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '9999px',
          background: 'rgba(99, 91, 255, 0.08)',
          border: '1px solid rgba(99, 91, 255, 0.25)',
          color: 'var(--primary, #635bff)',
          fontSize: '12px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          marginBottom: '12px'
        }}>
          <Sparkles size={14} />
          Multi-Tenant SchoolOS Subscription
        </div>

        <h2 style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-primary, #0a2540)', letterSpacing: '-0.5px', margin: '0 0 8px 0' }}>
          Flexible Plans for Every School
        </h2>
        <p style={{ color: 'var(--text-secondary, #475569)', fontSize: '14px', maxWidth: '600px', margin: '0 auto' }}>
          Start with our 10-day full access trial. Upgrade seamlessly with PayU as your institution expands.
        </p>

        {/* Billing Cycle Switcher */}
        <div style={{
          marginTop: '20px',
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px',
          background: '#e2e8f0',
          borderRadius: '12px',
          gap: '4px'
        }}>
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: billingCycle === 'monthly' ? '#ffffff' : 'transparent',
              color: billingCycle === 'monthly' ? 'var(--primary, #635bff)' : '#64748b',
              boxShadow: billingCycle === 'monthly' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('yearly')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: billingCycle === 'yearly' ? '#ffffff' : 'transparent',
              color: billingCycle === 'yearly' ? 'var(--primary, #635bff)' : '#64748b',
              boxShadow: billingCycle === 'yearly' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <span>Yearly Billing</span>
            <span style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#059669',
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '4px',
              textTransform: 'uppercase'
            }}>
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Real-time Trial / Plan Status Banner */}
      {subStatus && (
        <div style={{
          maxWidth: '750px',
          margin: '0 auto 24px auto',
          padding: '16px 20px',
          borderRadius: '14px',
          background: subStatus.is_expired
            ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
            : subStatus.is_trial
              ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
              : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          border: `1px solid ${
            subStatus.is_expired ? '#f87171' : subStatus.is_trial ? '#86efac' : '#cbd5e1'
          }`,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {subStatus.is_expired ? (
              <AlertCircle size={24} color="#dc2626" />
            ) : subStatus.is_trial ? (
              <Sparkles size={24} color="#16a34a" />
            ) : (
              <Crown size={24} color="#4f46e5" />
            )}
            <div>
              <div style={{ fontWeight: 800, fontSize: '15px', color: subStatus.is_expired ? '#991b1b' : '#0f172a' }}>
                {subStatus.is_expired
                  ? 'Trial Expired — Action Required'
                  : subStatus.is_trial
                    ? `10-Day Free Trial Active (${subStatus.trial_days_remaining ?? 0} days remaining)`
                    : `Active Plan: ${(subStatus.plan_tier || 'Starter').toUpperCase()}`}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                {subStatus.is_expired
                  ? 'Your 10-day trial period has ended. Locked features can be restored instantly by upgrading below.'
                  : subStatus.is_trial
                    ? `Trial ends on ${subStatus.trial_ends_at ? new Date(subStatus.trial_ends_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'in 10 days'}. Enjoy unlimited access before deciding.`
                    : `Next billing renewal: ${subStatus.expires_at ? new Date(subStatus.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Active'}`}
              </div>
            </div>
          </div>
          <div style={{
            fontSize: '12px',
            fontWeight: 700,
            padding: '6px 12px',
            borderRadius: '8px',
            background: subStatus.is_expired ? '#dc2626' : subStatus.is_trial ? '#16a34a' : '#4f46e5',
            color: '#ffffff',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {subStatus.is_expired ? 'Expired' : subStatus.is_trial ? 'Trial' : 'Active'}
          </div>
        </div>
      )}

      {feedback && (
        <div style={{
          marginBottom: '24px',
          padding: '14px 18px',
          borderRadius: '12px',
          border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
          background: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
          color: feedback.type === 'success' ? '#065f46' : '#991b1b',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px',
          fontWeight: 600,
          maxWidth: '650px',
          margin: '0 auto 24px auto'
        }}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} color="#10b981" /> : <AlertCircle size={18} color="#ef4444" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px' }}>
          <Loader2 style={{ width: 32, height: 32, color: 'var(--primary, #635bff)', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: '14px', color: '#64748b' }}>Loading available plans...</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          alignItems: 'stretch'
        }}>
          {plans.map((p) => {
            const isCurrent = activeTier === p.tier;
            const price =
              p.tier === 'starter'
                ? 0
                : billingCycle === 'yearly'
                ? p.pricing?.yearly
                : p.pricing?.monthly;
            const period = p.tier === 'starter' ? '10-day trial' : billingCycle === 'yearly' ? '/year' : '/month';

            const headerStyle = planHeaderColors[p.tier] || { border: '#6366f1', bg: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)' };

            return (
              <div
                key={p.tier}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '20px',
                  background: '#ffffff',
                  border: isCurrent ? '2px solid #10b981' : p.is_popular ? '2px solid #635bff' : '1px solid #e2e8f0',
                  boxShadow: p.is_popular ? '0 12px 30px rgba(99, 91, 255, 0.12)' : '0 4px 14px rgba(0,0,0,0.04)',
                  padding: '24px',
                  boxSizing: 'border-box',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                {/* Popular / Active Badge */}
                {p.is_popular && !isCurrent && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(90deg, #635bff, #8b5cf6)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    padding: '4px 14px',
                    borderRadius: '9999px',
                    boxShadow: '0 4px 10px rgba(99, 91, 255, 0.3)'
                  }}>
                    {p.badge || 'Most Popular'}
                  </div>
                )}

                {isCurrent && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#10b981',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    padding: '4px 14px',
                    borderRadius: '9999px',
                    boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)'
                  }}>
                    ✓ Current Plan
                  </div>
                )}

                {/* Plan Info */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{
                      padding: '10px',
                      borderRadius: '12px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex'
                    }}>
                      {planIcons[p.tier] || <Shield size={22} color="#64748b" />}
                    </div>

                    {p.tier === 'starter' && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        background: '#e0f2fe',
                        color: '#0284c7',
                        border: '1px solid #bae6fd'
                      }}>
                        10 Days Free
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0a2540', margin: '0 0 4px 0' }}>{p.name}</h3>
                  <p style={{ fontSize: '13px', color: '#64748b', minHeight: '36px', margin: '0 0 16px 0', lineHeight: 1.4 }}>{p.tagline}</p>

                  {/* Price */}
                  <div style={{ paddingBottom: '16px', borderBottom: '1px solid #f1f5f9', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span style={{ fontSize: '32px', fontWeight: 900, color: '#0a2540' }}>
                        {p.tier === 'starter' ? 'Free' : `₹${price?.toLocaleString('en-IN')}`}
                      </span>
                      <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>{period}</span>
                    </div>
                    {billingCycle === 'yearly' && p.tier !== 'starter' && (
                      <p style={{ fontSize: '12px', color: '#059669', fontWeight: 700, margin: '4px 0 0 0' }}>
                        ₹{Math.round(price / 12).toLocaleString('en-IN')}/mo billed annually
                      </p>
                    )}
                  </div>

                  {/* Quota Highlights */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    border: '1px solid #f1f5f9',
                    fontSize: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                      <GraduationCap size={15} color="var(--primary, #635bff)" />
                      <span>
                        <strong style={{ color: '#0a2540' }}>
                          {p.quotas?.max_students === 99999 ? 'Unlimited' : p.quotas?.max_students}
                        </strong>{' '}
                        Students
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                      <Users size={15} color="var(--primary, #635bff)" />
                      <span>
                        <strong style={{ color: '#0a2540' }}>
                          {p.quotas?.max_staff === 99999 ? 'Unlimited' : p.quotas?.max_staff}
                        </strong>{' '}
                        Staff
                      </span>
                    </div>
                  </div>

                  {/* Features List */}
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', margin: '0 0 10px 0' }}>
                      Included Capabilities:
                    </p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {p.features?.map((feat) => {
                        const featLabels = {
                          attendance: 'Daily & Session Attendance',
                          marks: 'Exam Marks & Gradebooks',
                          report_cards: 'Automated CBSE Report Cards',
                          announcements: 'Noticeboard & Circulars',
                          basic_analytics: 'Basic Performance Analytics',
                          fee_management: 'Fee Gateways & Counter Cash Receipts',
                          certificates: 'Transfer & Bonafide Certificates',
                          ptc: 'Parent-Teacher Conference (PTC) Slots',
                          chat_diary: '1:1 Parent-Teacher Chat & Daily Diary',
                          homework: 'Homework Assignments & Tracking',
                          timetable: 'Class & Teacher Timetable Engine',
                          calendar: 'School Academic Calendar',
                          leave_management: 'Online Leave Requests & Workflow',
                          bulk_csv_upload: 'Bulk Student CSV Upload with Link Codes',
                          advanced_analytics: 'Comparative Batch Analytics',
                          ai_risk: 'Student Progress & Risk Early Warning',
                          exam_ocr: 'Digital Exam Sheet Scanning',
                          risk_prediction: 'Student Academic Support Radar',
                          full_analytics: 'Multi-Section Longitudinal Trends',
                          counter_cash: 'Counter POS & Reconciliation',
                          whatsapp_broadcast: 'Automated WhatsApp Notifications',
                        };
                        return (
                          <li key={feat} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155' }}>
                            <div style={{ background: '#ecfdf5', borderRadius: '50%', padding: '2px', display: 'flex' }}>
                              <Check size={12} color="#10b981" />
                            </div>
                            <span>{featLabels[feat] || feat.replace(/_/g, ' ')}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                {/* Action CTA */}
                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                  <button
                    type="button"
                    disabled={processing || isCurrent}
                    onClick={() => handleSelectPlan(p.tier)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: isCurrent ? 'default' : 'pointer',
                      border: 'none',
                      background: isCurrent
                        ? '#f1f5f9'
                        : p.is_popular
                        ? 'linear-gradient(135deg, #635bff 0%, #4f46e5 100%)'
                        : '#0a2540',
                      color: isCurrent ? '#64748b' : '#ffffff',
                      boxShadow: isCurrent ? 'none' : '0 4px 12px rgba(10, 37, 64, 0.15)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isCurrent ? (
                      <>
                        <CheckCircle2 size={16} color="#10b981" />
                        Current Active Plan
                      </>
                    ) : p.tier === 'starter' ? (
                      <>
                        Start 10-Day Free Trial
                        <ArrowRight size={16} />
                      </>
                    ) : (
                      <>
                        <CreditCard size={16} />
                        Upgrade with PayU
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PayU Checkout Modal */}
      {checkoutModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(10, 37, 64, 0.7)',
          backdropFilter: 'blur(4px)',
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: '#eef2ff', color: '#4f46e5' }}>
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0a2540', margin: 0 }}>PayU Payment Gateway</h3>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Secure 256-bit Encrypted Checkout</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#64748b', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <div style={{ margin: '18px 0', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>Plan Upgrade:</span>
                <span style={{ fontWeight: 800, color: '#0a2540', textTransform: 'uppercase' }}>{checkoutModal.plan_tier} Plan</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>Billing Period:</span>
                <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{checkoutModal.billing_cycle}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>Transaction ID:</span>
                <code style={{ color: '#4f46e5', fontWeight: 'bold', fontFamily: 'monospace' }}>{checkoutModal.txnid}</code>
              </div>
              <div style={{ paddingTop: '10px', marginTop: '6px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 800, color: '#0a2540' }}>Total Payable:</span>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#059669' }}>
                  ₹{parseFloat(checkoutModal.amount).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <form
              method="POST"
              action={checkoutModal.payu_action_url}
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              <input type="hidden" name="key" value={checkoutModal.key} />
              <input type="hidden" name="txnid" value={checkoutModal.txnid} />
              <input type="hidden" name="amount" value={checkoutModal.amount} />
              <input type="hidden" name="productinfo" value={checkoutModal.productinfo} />
              <input type="hidden" name="firstname" value={checkoutModal.firstname} />
              <input type="hidden" name="email" value={checkoutModal.email} />
              <input type="hidden" name="phone" value={checkoutModal.phone} />
              <input type="hidden" name="surl" value={checkoutModal.surl} />
              <input type="hidden" name="furl" value={checkoutModal.furl} />
              <input type="hidden" name="hash" value={checkoutModal.hash} />
              <input type="hidden" name="udf1" value={checkoutModal.udf1 || ''} />
              <input type="hidden" name="udf2" value={checkoutModal.udf2 || ''} />
              <input type="hidden" name="udf3" value={checkoutModal.udf3 || ''} />
              <input type="hidden" name="udf4" value={checkoutModal.udf4 || ''} />
              <input type="hidden" name="udf5" value={checkoutModal.udf5 || ''} />

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
                }}
              >
                <CreditCard size={18} />
                Proceed to Pay ₹{parseFloat(checkoutModal.amount).toLocaleString('en-IN')} with PayU →
              </button>

              <p style={{ fontSize: '11px', textAlign: 'center', color: '#64748b', margin: 0 }}>
                🔒 Secure 256-bit redirection to PayU India • Live Merchant Key: <code>{checkoutModal.key}</code>
              </p>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
