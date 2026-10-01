import React, { useState, useEffect, useRef } from 'react';
import { api, API_BASE } from '../../api';
import {
  MessageSquare, Send, Paperclip, Mic, X, Image, FileText,
  Play, Pause, ArrowLeft, CheckCheck, Check, Video, Phone
} from 'lucide-react';

export default function ChatDrawer({ user, onClose }) {
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollRef = useRef(null);

  const schoolId = user?.school_id;
  const userId = user?.id;

  useEffect(() => {
    loadContacts();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const res = await api.getChatContacts(userId, schoolId);
      setContacts(res || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openConversation = async (contact) => {
    setActiveContact(contact);
    const convId = [userId, contact.user_id].sort().join('_');
    try {
      const msgs = await api.getChatMessages(convId);
      setMessages(msgs || []);
      await api.markChatRead(convId, userId).catch(() => {});
      // Update contact unread count
      setContacts(prev => prev.map(c => c.user_id === contact.user_id ? {...c, unread_count: 0} : c));
    } catch (e) { console.error(e); }
    // Poll for new messages
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const msgs = await api.getChatMessages(convId);
        setMessages(msgs || []);
        await api.markChatRead(convId, userId).catch(() => {});
      } catch (e) {}
    }, 4000);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !activeContact) return;
    setSending(true);
    try {
      await api.sendChatMessage({
        school_id: schoolId,
        sender_user_id: userId,
        receiver_user_id: activeContact.user_id,
        message_type: 'TEXT',
        content: newMessage.trim(),
      });
      setNewMessage('');
      const convId = [userId, activeContact.user_id].sort().join('_');
      const msgs = await api.getChatMessages(convId);
      setMessages(msgs || []);
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeContact) return;
    setUploading(true);
    try {
      const uploadRes = await api.uploadFile(file);
      const type = file.type.startsWith('image/') ? 'IMAGE'
        : file.type.startsWith('video/') ? 'VIDEO'
        : file.type.startsWith('audio/') ? 'VOICE' : 'FILE';
      await api.sendChatMessage({
        school_id: schoolId,
        sender_user_id: userId,
        receiver_user_id: activeContact.user_id,
        message_type: type,
        media_url: uploadRes.url,
        media_filename: uploadRes.filename,
        content: `Sent ${type.toLowerCase()}: ${uploadRes.filename}`,
      });
      const convId = [userId, activeContact.user_id].sort().join('_');
      const msgs = await api.getChatMessages(convId);
      setMessages(msgs || []);
    } catch (e) { alert(e.message); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        setUploading(true);
        try {
          const uploadRes = await api.uploadFile(file);
          await api.sendChatMessage({
            school_id: schoolId,
            sender_user_id: userId,
            receiver_user_id: activeContact.user_id,
            message_type: 'VOICE',
            media_url: uploadRes.url,
            media_filename: uploadRes.filename,
            content: 'Voice note',
          });
          const convId = [userId, activeContact.user_id].sort().join('_');
          const msgs = await api.getChatMessages(convId);
          setMessages(msgs || []);
        } catch (e) { alert(e.message); }
        finally { setUploading(false); }
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch (e) { alert('Microphone access denied'); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const renderMessage = (msg) => {
    const isMine = msg.sender_user_id === userId;
    const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <div key={msg.id} style={{
        display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start',
        marginBottom: '8px', padding: '0 12px',
      }}>
        <div style={{
          maxWidth: '75%', padding: '10px 14px', borderRadius: '16px',
          background: isMine ? 'var(--primary)' : '#f1f5f9',
          color: isMine ? '#fff' : 'var(--text-primary)',
          borderBottomRightRadius: isMine ? '4px' : '16px',
          borderBottomLeftRadius: isMine ? '16px' : '4px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          {msg.message_type === 'TEXT' && (
            <div style={{ fontSize: '14px', lineHeight: '1.5', wordBreak: 'break-word' }}>{msg.content}</div>
          )}
          {msg.message_type === 'IMAGE' && (
            <div>
              <img src={`${API_BASE}${msg.media_url}`} alt="shared" style={{
                maxWidth: '260px', borderRadius: '10px', cursor: 'pointer',
              }} onClick={() => window.open(`${API_BASE}${msg.media_url}`, '_blank')} />
            </div>
          )}
          {msg.message_type === 'VOICE' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mic size={16} />
              <audio controls src={`${API_BASE}${msg.media_url}`} style={{ height: '32px', maxWidth: '200px' }} />
            </div>
          )}
          {msg.message_type === 'VIDEO' && (
            <video controls src={`${API_BASE}${msg.media_url}`} style={{
              maxWidth: '260px', borderRadius: '10px',
            }} />
          )}
          {msg.message_type === 'FILE' && (
            <a href={`${API_BASE}${msg.media_url}`} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isMine ? '#fff' : 'var(--primary)', textDecoration: 'none' }}>
              <FileText size={16} /> {msg.media_filename || 'Download File'}
            </a>
          )}
          <div style={{
            fontSize: '10px', opacity: 0.7, textAlign: 'right', marginTop: '4px',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px',
          }}>
            {time}
            {isMine && (msg.is_read ? <CheckCheck size={12} /> : <Check size={12} />)}
          </div>
        </div>
      </div>
    );
  };

  // ── Contact List View ──
  if (!activeContact) {
    return (
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: '380px',
        background: '#fff', boxShadow: '-4px 0 20px rgba(0,0,0,0.12)',
        zIndex: 2000, display: 'flex', flexDirection: 'column',
        borderLeft: '1px solid var(--border-color)',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquare size={20} color="#fff" />
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>Messages</span>
          </div>
          <button onClick={onClose} style={{
            border: 'none', background: 'rgba(255,255,255,0.2)', borderRadius: '8px',
            padding: '6px', cursor: 'pointer', color: '#fff',
          }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading contacts...</div>
          ) : contacts.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <MessageSquare size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <div style={{ fontSize: '14px', fontWeight: 600 }}>No conversations yet</div>
              <div style={{ fontSize: '12px', marginTop: '6px' }}>
                {user?.role?.toLowerCase() === 'parent'
                  ? "Your child's teachers will appear here"
                  : 'Parents of your class students will appear here'}
              </div>
            </div>
          ) : contacts.map(c => (
            <div key={c.user_id} onClick={() => openConversation(c)} style={{
              padding: '14px 20px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
              display: 'flex', alignItems: 'center', gap: '12px',
              background: c.unread_count > 0 ? 'rgba(99,91,255,0.04)' : 'transparent',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = c.unread_count > 0 ? 'rgba(99,91,255,0.04)' : 'transparent'}
            >
              <div style={{
                width: '42px', height: '42px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: '16px', flexShrink: 0,
              }}>
                {(c.full_name || '?')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {c.full_name}
                  </span>
                  {c.last_message_time && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(c.last_message_time).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                  <span style={{
                    fontSize: '12px', color: 'var(--text-secondary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px',
                  }}>
                    {c.student_name ? `Parent of ${c.student_name}` : c.role}
                    {c.last_message ? ` • ${c.last_message_type === 'TEXT' ? c.last_message.slice(0, 30) : `📎 ${c.last_message_type}`}` : ''}
                  </span>
                  {c.unread_count > 0 && (
                    <span style={{
                      background: 'var(--primary)', color: '#fff', borderRadius: '10px',
                      padding: '2px 8px', fontSize: '11px', fontWeight: 700, minWidth: '20px', textAlign: 'center',
                    }}>
                      {c.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Chat Thread View ──
  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, bottom: 0, width: '380px',
      background: '#fff', boxShadow: '-4px 0 20px rgba(0,0,0,0.12)',
      zIndex: 2000, display: 'flex', flexDirection: 'column',
      borderLeft: '1px solid var(--border-color)',
    }}>
      {/* Chat Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', gap: '12px',
        background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
      }}>
        <button onClick={() => { setActiveContact(null); if (pollRef.current) clearInterval(pollRef.current); loadContacts(); }}
          style={{ border: 'none', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#fff' }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 800, fontSize: '14px',
        }}>
          {(activeContact.full_name || '?')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{activeContact.full_name}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
            {activeContact.student_name ? `Parent of ${activeContact.student_name}` : activeContact.role}
          </div>
        </div>
        <button onClick={onClose} style={{
          border: 'none', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#fff',
        }}>
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '12px 0',
        background: '#f8fafc',
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(99,91,255,0.03) 0%, transparent 50%)',
      }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <MessageSquare size={36} style={{ opacity: 0.3, marginBottom: '8px' }} />
            <div style={{ fontSize: '13px' }}>Start the conversation!</div>
          </div>
        ) : messages.map(renderMessage)}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div style={{
        padding: '10px 14px', borderTop: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', gap: '8px', background: '#fff',
      }}>
        <input ref={fileInputRef} type="file" hidden
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
          onChange={handleFileUpload}
        />
        <button onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            border: 'none', background: '#f1f5f9', borderRadius: '8px',
            padding: '8px', cursor: 'pointer', color: 'var(--text-secondary)',
          }}
          title="Attach file"
        >
          <Paperclip size={18} />
        </button>
        <button
          onClick={recording ? stopRecording : startRecording}
          style={{
            border: 'none', background: recording ? '#ef4444' : '#f1f5f9', borderRadius: '8px',
            padding: '8px', cursor: 'pointer', color: recording ? '#fff' : 'var(--text-secondary)',
            animation: recording ? 'pulse 1s infinite' : 'none',
          }}
          title={recording ? "Stop recording" : "Record voice note"}
        >
          <Mic size={18} />
        </button>
        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Type a message..."
          style={{
            flex: 1, border: '1px solid #e2e8f0', borderRadius: '20px',
            padding: '8px 16px', fontSize: '14px', outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--primary)'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
        />
        <button onClick={handleSend}
          disabled={sending || !newMessage.trim()}
          style={{
            border: 'none', background: 'var(--primary)', borderRadius: '50%',
            width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#fff', opacity: !newMessage.trim() ? 0.5 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          <Send size={16} />
        </button>
      </div>
      {uploading && (
        <div style={{
          position: 'absolute', bottom: '60px', left: 0, right: 0,
          padding: '8px', textAlign: 'center', background: 'rgba(99,91,255,0.1)',
          fontSize: '12px', fontWeight: 600, color: 'var(--primary)',
        }}>
          Uploading media...
        </div>
      )}
    </div>
  );
}
