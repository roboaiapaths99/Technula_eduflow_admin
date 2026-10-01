import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { LifeBuoy, CheckCircle2, Clock, MessageSquare, AlertCircle, ArrowUpRight, Plus, X } from 'lucide-react';

export default function TicketsCenter({ user }) {
  const schoolId = user?.school_id;
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);
  const [statusVal, setStatusVal] = useState('IN_PROGRESS');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // New ticket state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({
    subject: '',
    category: 'ACADEMIC',
    priority: 'NORMAL',
    description: '',
    student_id: '',
    student_name: '',
  });

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await api.getTickets(schoolId);
      setTickets(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [schoolId]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const ticketPayload = {
        school_id: schoolId,
        parent_user_id: user?.id,
        parent_name: user?.name || user?.full_name || 'Parent',
        parent_email: user?.email || '',
        subject: newTicketForm.subject.trim(),
        category: newTicketForm.category,
        priority: newTicketForm.priority,
        description: newTicketForm.description.trim(),
        student_id: newTicketForm.student_id?.trim() || null,
        student_name: newTicketForm.student_name?.trim() || null,
      };
      await api.createTicket(ticketPayload);
      setShowCreateModal(false);
      setNewTicketForm({
        subject: '',
        category: 'ACADEMIC',
        priority: 'NORMAL',
        description: '',
        student_id: '',
        student_name: '',
      });
      loadTickets();
    } catch (err) {
      alert(err.message || 'Failed to create ticket');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!activeTicket) return;
    setSaving(true);
    try {
      await api.updateTicket(activeTicket.id, {
        status: statusVal,
        resolution_notes: resolutionNotes,
      });
      setActiveTicket(null);
      setResolutionNotes('');
      loadTickets();
    } catch (e) {
      alert('Failed to update ticket');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="pill pill-amber">Parent Service Tickets</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>24-Hour Resolution SLA</span>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, marginTop: '6px', color: 'var(--text-primary)' }}>
            Parent Queries & Service Requests
          </h2>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
        >
          <Plus size={16} /> Raise Support Ticket
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {tickets.map((t) => {
          const isResolved = t.status === 'RESOLVED' || t.status === 'CLOSED';
          const isHigh = t.priority === 'HIGH' || t.priority === 'URGENT';

          return (
            <div key={t.id} className="tech-card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span className={`pill ${isHigh ? 'pill-rose' : 'pill-amber'}`}>
                      {t.priority}
                    </span>
                    <span className="pill pill-primary">
                      {t.category}
                    </span>
                    <span className={`pill ${isResolved ? 'pill-emerald' : 'pill-primary'}`}>
                      {t.status}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {t.subject}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    {t.description}
                  </p>

                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Parent: <strong>{t.parent_name}</strong> ({t.parent_email || 'Verified Parent'}) • Child: <strong>{t.student_name}</strong>
                  </div>
                </div>

                <div>
                  {!isResolved ? (
                    <button
                      onClick={() => {
                        setActiveTicket(t);
                        setStatusVal(t.status === 'OPEN' ? 'IN_PROGRESS' : 'RESOLVED');
                        setResolutionNotes(t.resolution_notes || '');
                      }}
                      className="btn-secondary"
                      style={{ fontSize: '13px' }}
                    >
                      Update SLA Status
                    </button>
                  ) : (
                    <span className="pill pill-emerald" style={{ fontSize: '12px' }}>
                      ✓ Case Closed
                    </span>
                  )}
                </div>
              </div>

              {t.resolution_notes && (
                <div style={{ marginTop: '12px', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <strong>Resolution:</strong> {t.resolution_notes}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Ticket Update Modal */}
      {activeTicket && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(10, 37, 64, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div className="tech-card" style={{ maxWidth: '500px', width: '100%', padding: '28px', background: '#ffffff' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Update Parent Ticket
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Subject: {activeTicket.subject}
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Status
              </label>
              <select
                value={statusVal}
                onChange={(e) => setStatusVal(e.target.value)}
                className="form-input"
              >
                <option value="IN_PROGRESS">In Progress (Department Assigned)</option>
                <option value="RESOLVED">Resolved (Parent Notified via WhatsApp/Email)</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Resolution Response to Parent
              </label>
              <textarea
                rows={4}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Type response sent to parent..."
                className="form-input"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setActiveTicket(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? 'Updating...' : 'Save Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Raise Ticket Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(10, 37, 64, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div className="tech-card" style={{ maxWidth: '520px', width: '100%', padding: '28px', background: '#ffffff', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Raise Support Ticket
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Category
                </label>
                <select
                  value={newTicketForm.category}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, category: e.target.value })}
                  className="form-input"
                  required
                >
                  <option value="ACADEMIC">Academic & Progress</option>
                  <option value="FEE">Fee & Accounts</option>
                  <option value="TRANSPORT">Transport & Bus Route</option>
                  <option value="GENERAL">General Administration</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Priority
                </label>
                <select
                  value={newTicketForm.priority}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, priority: e.target.value })}
                  className="form-input"
                >
                  <option value="NORMAL">Normal SLA (24h)</option>
                  <option value="HIGH">High (Urgent Attention)</option>
                  <option value="URGENT">Critical</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Student Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Student Name"
                  value={newTicketForm.student_name}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, student_name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Brief summary of your query or issue..."
                  value={newTicketForm.subject}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Detailed Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Please describe your query with relevant details..."
                  value={newTicketForm.description}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, description: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary"
                >
                  {creating ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
