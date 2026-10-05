/**
 * Technula EduFlow — Unified API Service Client.
 */
export const API_BASE = (() => {
  if (import.meta.env.VITE_API_BASE && import.meta.env.VITE_API_BASE.trim() !== '') {
    return import.meta.env.VITE_API_BASE.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8087';
    }
    // In production, when served behind Nginx reverse proxy on https://eduflow.technula.com
    return `${window.location.protocol}//${window.location.host}/api`;
  }
  return 'http://localhost:8087';
})();

export function getToken() {
  return localStorage.getItem('technulaeduflow_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('technulaeduflow_token', token);
  else localStorage.removeItem('technulaeduflow_token');
}

export function getUser() {
  const u = localStorage.getItem('technulaeduflow_user');
  return u ? JSON.parse(u) : null;
}

export function setUser(user) {
  if (user) localStorage.setItem('technulaeduflow_user', JSON.stringify(user));
  else localStorage.removeItem('technulaeduflow_user');
}

export function logout() {
  localStorage.removeItem('technulaeduflow_token');
  localStorage.removeItem('technulaeduflow_user');
}

/**
 * Sanitizes and formats errors into friendly, professional user messages
 */
export function formatUserError(err, fallback = 'Unable to complete request. Please try again.') {
  if (!err) return fallback;
  let msg = typeof err === 'string' ? err : (err.message || err.detail || fallback);
  if (Array.isArray(msg)) {
    msg = msg.map(m => m.msg || m.message || JSON.stringify(m)).join(', ');
  }
  if (typeof msg !== 'string') return fallback;

  const lower = msg.toLowerCase();

  // 1. Missing fields / validation errors
  if (lower.includes('field required') || lower.includes('missing') || lower.includes('value_error') || lower.includes('input should be') || lower.includes('unprocessable entity')) {
    return 'Please check that all required fields are filled out correctly.';
  }

  // 2. Database & backend crash errors
  if (
    lower.includes('sqlalchemy') || lower.includes('traceback') || lower.includes('internal server error') ||
    lower.includes('operationalerror') || lower.includes('integrityerror') || lower.includes('foreignkey') ||
    lower.includes('psycopg2') || lower.includes('sqlite3') || lower.includes('database locked') ||
    lower.includes('syntaxerror') || lower.includes('null value') || lower.includes('pydantic')
  ) {
    return 'The school server is temporarily busy. Please try again in a few moments.';
  }

  // 3. Network & connection errors
  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network request failed') || lower.includes('econnrefused')) {
    return 'Unable to reach the school server. Please verify your internet connection.';
  }

  // 4. Session & Permission errors
  if (lower.includes('not authenticated') || lower.includes('session expired') || lower.includes('token expired')) {
    return 'Your session has expired. Please sign in again.';
  }
  if (lower.includes('forbidden') || lower.includes('access denied') || lower.includes('permission denied')) {
    return 'You do not have permission to perform this action.';
  }

  // 5. JSON parsing & serialization errors
  if (lower.includes('json.parse') || lower.includes('unexpected token') || lower.includes('[object object]')) {
    return 'Received an unexpected response from the server. Please try again.';
  }

  return msg;
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch (networkErr) {
    throw new Error('Unable to reach the school server. Please check your internet connection.');
  }

  if (res.status === 401) {
    const hadToken = !!getToken();
    logout();
    if (hadToken && typeof window !== 'undefined' && window.location.pathname !== '/' && window.location.pathname !== '') {
      window.location.href = window.location.origin;
    }
    throw new Error('Your session has expired. Please sign in again.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText || 'Request failed' }));
    let rawDetail = err.detail;
    if (Array.isArray(rawDetail)) {
      rawDetail = rawDetail.map(d => d.msg || d.message).join(', ');
    } else if (typeof rawDetail === 'object' && rawDetail !== null) {
      rawDetail = rawDetail.msg || rawDetail.message || JSON.stringify(rawDetail);
    } else if (!rawDetail) {
      rawDetail = res.statusText || `Request failed (${res.status})`;
    }
    const friendlyMessage = formatUserError(rawDetail);
    throw new Error(friendlyMessage);
  }

  return res.json();
}

export const api = {
  // ── Auth & Onboarding ──────────────────
  login: (email, password, school_id = null) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, ...(school_id ? { school_id } : {}) })
    }),
  superadminSendOtp: (phone) => request('/auth/superadmin/send-otp', { method: 'POST', body: JSON.stringify({ phone }) }),
  superadminVerifyOtp: (phone, otp) => request('/auth/superadmin/verify-otp', { method: 'POST', body: JSON.stringify({ phone, otp }) }),
  getMe: () => request('/auth/me'),
  registerParent: (data) => request('/auth/register-parent', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (data) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  forceChangePassword: (newPassword) => request('/auth/force-change-password', { method: 'POST', body: JSON.stringify({ new_password: newPassword }) }),
  getParentChildren: (parentUserId) => request(`/parent/children/${parentUserId}`),
  linkParentChild: (data) => request('/parent/link-child', { method: 'POST', body: JSON.stringify(data) }),
  getParentStudentOverview: (studentId) => request(`/parent/student-overview/${studentId}`),

  // ── Schools ────────────────────────────
  searchSchools: (query) => request(`/schools/search?query=${encodeURIComponent(query || '')}`),
  listAllSchools: () => request('/schools/all'),
  getSchool: (id) => request(`/schools/${id}`),
  updateSchool: (id, data) => request(`/schools/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  registerSchool: (data) => request('/schools/register', { method: 'POST', body: JSON.stringify(data) }),
  getSchoolPaymentConfig: (schoolId) => request(`/fees/config?school_id=${schoolId}`),
  saveSchoolPaymentConfig: (data) => request('/fees/config', { method: 'POST', body: JSON.stringify(data) }),
  testSchoolPaymentConfig: (data) => request('/fees/config/test', { method: 'POST', body: JSON.stringify(data) }),



  // ── Admin Command Center & KPIs ─────────
  getAdminStats: (schoolId) => request(`/admin-stats/overview?school_id=${schoolId}`),

  adminListUsers: (role, page, limit, search) => {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);
    return request(`/admin/users${params.toString() ? `?${params.toString()}` : ''}`);
  },
  adminCreateUser: (data) => request('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateUser: (userId, data) => request(`/admin/users/${userId}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateAdminUser: (userId, data) => request(`/admin/users/${userId}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminResetUserPassword: (userId, password) => request(`/admin/users/${userId}/reset-password`, { method: 'POST', body: JSON.stringify({ password }) }),
  adminSendCredentials: (userId, password) => request(`/admin/users/${userId}/send-credentials`, { method: 'POST', body: JSON.stringify({ password }) }),

  // ── Admin Student CRUD ─────────────────
  adminListStudents: (grade, section, page, limit, search) => {
    const params = new URLSearchParams();
    if (grade) params.append('grade', grade);
    if (section) params.append('section', section);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);
    return request(`/admin/students${params.toString() ? `?${params.toString()}` : ''}`);
  },
  adminGetStudentDetail: (id) => request(`/admin/students/${id}`),
  adminCreateStudent: (data) => request('/admin/students', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateStudent: (id, data) => request(`/admin/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeleteStudent: (id) => request(`/admin/students/${id}`, { method: 'DELETE' }),

  // ── Attendance Operations & Edits ──────
  updateAttendanceRecord: (attendanceId, data) =>
    request(`/attendance/${attendanceId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAttendanceRecord: (attendanceId) =>
    request(`/attendance/${attendanceId}`, { method: 'DELETE' }),

  // ── Admin Exams & Subjects CRUD ────────
  adminListExams: () => request('/admin/exams'),
  adminCreateExam: (data) => request('/admin/exams', { method: 'POST', body: JSON.stringify(data) }),
  adminListSubjects: () => request('/admin/subjects'),
  adminCreateSubject: (data) => request('/admin/subjects', { method: 'POST', body: JSON.stringify(data) }),

  // ── Admin Teacher Class Assignments ────
  adminListTeacherAssignments: () => request('/admin/mappings/teacher-assignments'),
  adminAssignTeacher: (data) => request('/admin/mappings/teacher-assignments', { method: 'POST', body: JSON.stringify(data) }),

  // ── Attendance ─────────────────────────
  getClassAttendance: (schoolId, grade, section, date) =>
    request(`/attendance/class-session?school_id=${schoolId}&grade=${grade}&section=${section}&date=${date}`),
  markBatchAttendance: (data) => request('/attendance/batch', { method: 'POST', body: JSON.stringify(data) }),
  getStudentAttendance: (studentId) => request(`/attendance/student/${studentId}`),

  // ── Student Success Risk Engine ────────
  getRiskCases: (schoolId, filters = {}) => {
    const params = new URLSearchParams({ school_id: schoolId, ...filters });
    return request(`/risk-cases/?${params.toString()}`);
  },
  triggerRiskScan: (schoolId) => request(`/risk-cases/scan?school_id=${schoolId}`, { method: 'POST' }),
  updateRiskCase: (caseId, data) => request(`/risk-cases/${caseId}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // ── Parent Service Tickets ─────────────
  getTickets: (schoolId, filters = {}) => {
    const cleanFilters = Object.fromEntries(
      Object.entries({ ...(schoolId ? { school_id: schoolId } : {}), ...filters }).filter(([_, v]) => v != null && v !== '')
    );
    const params = new URLSearchParams(cleanFilters);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`/tickets${query}`);
  },
  createTicket: (data) => request('/tickets', { method: 'POST', body: JSON.stringify(data) }),
  updateTicket: (ticketId, data) => request(`/tickets/${ticketId}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // ── Announcements Broadcast ────────────
  getAnnouncements: (schoolId, targetRole) =>
    request(`/announcements/?school_id=${schoolId || ''}${targetRole ? `&target_role=${targetRole}` : ''}`),
  listAnnouncements: (schoolId, targetRole) =>
    request(`/announcements/?school_id=${schoolId || ''}${targetRole ? `&target_role=${targetRole}` : ''}`),
  createAnnouncement: (data) => request('/announcements/', { method: 'POST', body: JSON.stringify(data) }),

  // ── Timetable & Homework ────────────────
  getTimetableToday: (grade = '10', section = 'A') =>
    request(`/timetable/today?grade=${grade}&section=${section}`),
  getClassTimetable: (grade = '10', section = 'A') =>
    request(`/timetable/class?grade=${grade}&section=${section}`),
  listStudentHomework: (studentId) =>
    request(`/homework/student/${studentId}`),
  getStudentHomework: (studentId) =>
    request(`/homework/student/${studentId}`),

  // ── Notifications ──────────────────────
  getNotifications: (userId, unreadOnly = false) => request(`/notifications/${unreadOnly ? '?unread_only=true' : ''}`),
  markNotificationRead: (id) => request(`/notifications/${id}/mark-read`, { method: 'POST' }),
  testPushNotification: () => request('/notifications/test-push', { method: 'POST' }),

  // ── Legacy / Direct Students Roster ────
  getStudents: () => request('/students/'),
  getStudentDetail: (id) => request(`/dashboard/${id}`),

  // ── Report Card API ────────────────────
  getReportCard: (studentId, examId = 'latest') => request(`/report-cards/student/${studentId}/exam/${examId}`),
  getReportCardHtmlUrl: (studentId, examId = 'latest') => `${API_BASE}/report-cards/student/${studentId}/exam/${examId}/html`,
  getBatchClassReportCardsHtmlUrl: (grade, section = 'A', examId = '') =>
    `${API_BASE}/report-cards/batch/class/html?grade=${grade}&section=${section}${examId ? `&exam_id=${examId}` : ''}`,

  // ── Marks & Gradebook ──────────────────
  getMarksMatrix: (schoolId, examId, grade = '10', section = 'A') =>
    request(`/marks/matrix?school_id=${schoolId}&exam_id=${examId}&grade=${grade}&section=${section}`),
  saveBatchMarks: (data) => request('/marks/batch', { method: 'POST', body: JSON.stringify(data) }),

  // ── Teacher Feedback & AI Remarks ──────
  generateAiFeedback: (data) => request('/marks/ai-generate-feedback', { method: 'POST', body: JSON.stringify(data) }),
  saveFeedback: (data) => request('/marks/feedback', { method: 'POST', body: JSON.stringify(data) }),
  getFeedback: (studentId, examId) => request(`/marks/feedback/${studentId}/${examId}`),

  // ── Live SQL Analytics ───────────────────
  getSubjectAverages: (schoolId, examId, grade, section) => {
    const p = new URLSearchParams({ school_id: schoolId });
    if (examId) p.append('exam_id', examId);
    if (grade) p.append('grade', grade);
    if (section) p.append('section', section);
    return request(`/analytics/subject-averages?${p.toString()}`);
  },
  getGradeDistribution: (schoolId, examId, grade, section) => {
    const p = new URLSearchParams({ school_id: schoolId });
    if (examId) p.append('exam_id', examId);
    if (grade) p.append('grade', grade);
    if (section) p.append('section', section);
    return request(`/analytics/grade-distribution?${p.toString()}`);
  },
  getAttendanceTrend: (schoolId, grade, section, days = 14) => {
    const p = new URLSearchParams({ school_id: schoolId, days });
    if (grade) p.append('grade', grade);
    if (section) p.append('section', section);
    return request(`/analytics/attendance-trend?${p.toString()}`);
  },
  getPerformanceTiers: (schoolId, examId, grade, section) => {
    const p = new URLSearchParams({ school_id: schoolId });
    if (examId) p.append('exam_id', examId);
    if (grade) p.append('grade', grade);
    if (section) p.append('section', section);
    return request(`/analytics/performance-tiers?${p.toString()}`);
  },
  getToppers: (schoolId, examId, grade, limit = 5) => {
    const p = new URLSearchParams({ school_id: schoolId, limit });
    if (examId) p.append('exam_id', examId);
    if (grade) p.append('grade', grade);
    return request(`/analytics/toppers?${p.toString()}`);
  },
  getStudentTrend: (studentId) => request(`/analytics/student-trend/${studentId}`),

  // ── Multi-Tenant Fee Management ─────────
  getFeeConfig: (schoolId) => request(`/fees/config?school_id=${schoolId}`),
  saveFeeConfig: (data) => request('/fees/config', { method: 'POST', body: JSON.stringify(data) }),
  getFeeStructures: (schoolId, grade) => {
    const p = new URLSearchParams({ school_id: schoolId });
    if (grade) p.append('grade', grade);
    return request(`/fees/structures?${p.toString()}`);
  },
  createFeeStructure: (data) => request('/fees/structures', { method: 'POST', body: JSON.stringify(data) }),
  createFeeStructuresBatch: (data) => request('/fees/structures/batch', { method: 'POST', body: JSON.stringify(data) }),
  deleteFeeStructure: (id) => request(`/fees/structures/${id}`, { method: 'DELETE' }),
  getStudentFeeDues: (studentId) => request(`/fees/student/${studentId}/dues`),
  collectFeeCounter: (data) => request('/fees/collect', { method: 'POST', body: JSON.stringify(data) }),
  createOnlineFeeOrder: (data) => request('/fees/orders/create', { method: 'POST', body: JSON.stringify(data) }),
  verifyOnlineFeePayment: (data) => request('/fees/orders/verify', { method: 'POST', body: JSON.stringify(data) }),
  getFeeReceipt: (receiptNo) => request(`/fees/receipts/${receiptNo}`),
  getFeeReceiptHtmlUrl: (receiptNo) => `${API_BASE}/fees/receipts/${encodeURIComponent(receiptNo)}/html`,
  getFeeOverview: (schoolId) => request(`/fees/overview?school_id=${schoolId}`),

  // ── Class Timetable ──────────────────────
  getClassTimetable: (schoolId, grade = '10', section = 'A') =>
    request(`/timetable/class?school_id=${schoolId}&grade=${grade}&section=${section}`),
  saveTimetableSlot: (data) => request('/timetable/slots', { method: 'POST', body: JSON.stringify(data) }),
  updateTimetableSlot: (slotId, data) => request(`/timetable/slots/${slotId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTimetableSlot: (slotId) => request(`/timetable/slots/${slotId}`, { method: 'DELETE' }),
  getTodaySchedule: (schoolId, grade = '10', section = 'A') =>
    request(`/timetable/today?school_id=${schoolId}&grade=${grade}&section=${section}`),
  getMyTeacherLectures: () => request('/timetable/my-lectures'),
  aiParseTimetableDocument: (formData) => {
    const token = getToken();
    return fetch(`${API_BASE}/timetable/ai-parse-document`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'AI timetable parsing failed');
      return data;
    });
  },
  bulkApplyTimetableSlots: (data) => request('/timetable/bulk-apply-slots', { method: 'POST', body: JSON.stringify(data) }),

  // ── Bulk Faculty & Staff Ingestion ────────
  downloadFacultyCsvTemplate: () => `${API_BASE}/admin/faculty/csv-template`,
  previewFacultyBulk: (data) => request('/admin/faculty/bulk-preview', { method: 'POST', body: JSON.stringify(data) }),
  commitFacultyBulk: (data) => request('/admin/faculty/bulk-commit', { method: 'POST', body: JSON.stringify(data) }),


  // ── Academic Calendar & Holidays ─────────
  getCalendarEvents: (schoolId, year, month) => {
    const p = new URLSearchParams({ school_id: schoolId });
    if (year) p.append('year', year);
    if (month) p.append('month', month);
    return request(`/calendar/events?${p.toString()}`);
  },
  createCalendarEvent: (data) => request('/calendar/events', { method: 'POST', body: JSON.stringify(data) }),
  deleteCalendarEvent: (id) => request(`/calendar/events/${id}`, { method: 'DELETE' }),
  getWorkingDays: (schoolId, fromDate, toDate) =>
    request(`/calendar/working-days?school_id=${schoolId}&from_date=${fromDate}&to_date=${toDate}`),

  // ── Digital Leave Management ─────────────
  applyLeave: (data) => request('/leaves/apply', { method: 'POST', body: JSON.stringify(data) }),
  getPendingLeaves: (schoolId) => request(`/leaves/pending?school_id=${schoolId}`),
  getStudentLeaves: (studentId) => request(`/leaves/student/${studentId}`),
  reviewLeave: (leaveId, data) => request(`/leaves/${leaveId}/review`, { method: 'PATCH', body: JSON.stringify(data) }),

  // ── Homework Diary ───────────────────────
  createHomework: (data) => request('/homework/', { method: 'POST', body: JSON.stringify(data) }),
  getClassHomework: (schoolId, grade = '10', section = 'A') =>
    request(`/homework/class?school_id=${schoolId}&grade=${grade}&section=${section}`),
  getStudentHomework: (studentId) => request(`/homework/student/${studentId}`),
  updateHomeworkSubmissions: (hwId, data) => request(`/homework/${hwId}/submissions`, { method: 'POST', body: JSON.stringify(data) }),

  // ── 2-Stage Bulk Student Import ──────────
  validateBulkStudents: (data) => request('/admin/students/bulk-validate', { method: 'POST', body: JSON.stringify(data) }),
  commitBulkStudents: (data) => request('/admin/students/bulk-commit', { method: 'POST', body: JSON.stringify(data) }),

  // ── Admin Edit/Delete Extensions ─────────
  adminUpdateUser: (userId, data) => request(`/admin/users/${userId}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeleteUser: (userId) => request(`/admin/users/${userId}`, { method: 'DELETE' }),
  adminUpdateExam: (examId, data) => request(`/admin/exams/${examId}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeleteExam: (examId) => request(`/admin/exams/${examId}`, { method: 'DELETE' }),
  adminUpdateSubject: (subjectId, data) => request(`/admin/subjects/${subjectId}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeleteSubject: (subjectId) => request(`/admin/subjects/${subjectId}`, { method: 'DELETE' }),
  adminDeleteTeacherAssignment: (assignmentId) => request(`/admin/mappings/teacher-assignments/${assignmentId}`, { method: 'DELETE' }),

  // ── Homework Edit/Delete ─────────────────
  updateHomework: (hwId, data) => request(`/homework/${hwId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteHomework: (hwId) => request(`/homework/${hwId}`, { method: 'DELETE' }),

  // ── Calendar Edit ────────────────────────
  updateCalendarEvent: (eventId, data) => request(`/calendar/events/${eventId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // ── Fee Structure Edit ───────────────────
  updateFeeStructure: (structureId, data) => request(`/fees/structures/${structureId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // ── Timetable Edit/Delete ────────────────
  updateTimetableSlot: (slotId, data) => request(`/timetable/slots/${slotId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTimetableSlot: (slotId) => request(`/timetable/slots/${slotId}`, { method: 'DELETE' }),

  // ── Announcement Edit/Delete ─────────────
  updateAnnouncement: (id, data) => request(`/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAnnouncement: (id) => request(`/announcements/${id}`, { method: 'DELETE' }),

  // ── File Upload ──────────────────────────
  uploadFile: async (file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload/file`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  // ── Chat System ──────────────────────────
  getChatContacts: (userId, schoolId) => request(`/chat/contacts?user_id=${userId}&school_id=${schoolId}`),
  getChatMessages: (conversationId, limit = 50) => request(`/chat/messages?conversation_id=${conversationId}&limit=${limit}`),
  sendChatMessage: (data) => request('/chat/send', { method: 'POST', body: JSON.stringify(data) }),
  markChatRead: (conversationId, userId) => request(`/chat/mark-read/${conversationId}?user_id=${userId}`, { method: 'PATCH' }),

  // ── Phase 2: AI Risk Prediction ──────────
  getRiskPredictionSchool: (schoolId, grade) => request(`/risk/predict/school/${schoolId}${grade ? `?grade=${grade}` : ''}`),
  getRiskPredictionStudent: (studentId) => request(`/risk/predict/student/${studentId}`),
  logRiskIntervention: (data) => request('/risk/interventions/log', { method: 'POST', body: JSON.stringify(data) }),

  // ── Phase 2: Encrypted Exam Sheets & OCR ─
  uploadExamSheet: async (formData) => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/exam-sheets/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },
  getStudentExamSheets: (studentId, requesterUserId) =>
    request(`/exam-sheets/student/${studentId}${requesterUserId ? `?requester_user_id=${requesterUserId}` : ''}`),
  viewExamSheetUrl: (sheetId) => {
    const token = getToken();
    return `${API_BASE}/exam-sheets/view/${sheetId}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },

  // ── Phase 2: Certificates & TC ───────────
  getSchoolAssets: (schoolId) => request(`/certificates/assets/${schoolId}`),
  uploadSchoolAsset: async (formData) => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/certificates/assets/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Asset upload failed' }));
      throw new Error(err.detail || 'Asset upload failed');
    }
    return res.json();
  },
  applyCertificate: (data) => request('/certificates/apply', { method: 'POST', body: JSON.stringify(data) }),
  listCertificateRequests: (schoolId, status) =>
    request(`/certificates/requests?school_id=${schoolId}${status ? `&status=${status}` : ''}`),
  approveCertificateRequest: (requestId, data) =>
    request(`/certificates/requests/${requestId}/approve`, { method: 'POST', body: JSON.stringify(data || {}) }),
  rejectCertificateRequest: (requestId, data) =>
    request(`/certificates/requests/${requestId}/reject`, { method: 'POST', body: JSON.stringify(data) }),
  getStudentCertificates: (studentId) => request(`/certificates/student/${studentId}`),
  getCertificateViewUrl: (certNumber) => `${API_BASE}/certificates/view/${encodeURIComponent(certNumber)}/html`,
  verifyCertificatePublic: (certNumber) => request(`/certificates/verify/${encodeURIComponent(certNumber)}`),

  // ── Phase 2: Parent-Teacher Conferences ──
  createPTCEvent: (data) => request('/ptc/events', { method: 'POST', body: JSON.stringify(data) }),
  listPTCEvents: (schoolId) => request(`/ptc/events?school_id=${schoolId}`),
  getPTCSlots: (eventId, teacherId) =>
    request(`/ptc/slots?event_id=${eventId}${teacherId ? `&teacher_id=${teacherId}` : ''}`),
  bookPTCSlot: (data) => request('/ptc/book', { method: 'POST', body: JSON.stringify(data) }),
  getParentPTCAppointments: (parentUserId) => request(`/ptc/parent/${parentUserId}`),

  // ── Phase 2: Counter Cash & Verified Receipts ──
  collectCounterFee: (data) => request('/fees/counter/collect', { method: 'POST', body: JSON.stringify(data) }),
  verifyReceipt: (receiptNo) => request(`/fees/verify-receipt/${encodeURIComponent(receiptNo)}`),

  // ── 10 Core Features Suite ──
  getPreviousSessionAttendance: (schoolId, grade, section, beforeDate) =>
    request(`/attendance/previous-session?school_id=${schoolId}&grade=${grade}&section=${section}${beforeDate ? `&before_date=${beforeDate}` : ''}`),
  sendAbsenteeAlert: (studentId) =>
    request(`/attendance/student/${studentId}/send-warning`, { method: 'POST' }),
  getAttendanceSummary: (schoolId, periodDays = 30, grade = '') =>
    request(`/analytics/attendance-summary?school_id=${schoolId}&period_days=${periodDays}${grade ? `&grade=${grade}` : ''}`),
  getProgressLetterHtmlUrl: (studentId, examId = '') =>
    `${API_BASE}/report-cards/student/${studentId}/progress-letter/html${examId ? `?exam_id=${examId}` : ''}`,
  getDailyDigest: (studentId) =>
    request(`/parent/daily-digest/${studentId}`),
  createDiaryEntry: (data) =>
    request('/diary/', { method: 'POST', body: JSON.stringify(data) }),
  getStudentDiary: (studentId) =>
    request(`/diary/student/${studentId}`),
  getClassDiaryEntries: (schoolId, grade, section, date = '') =>
    request(`/diary/class?school_id=${schoolId}&grade=${grade}&section=${section}${date ? `&date=${date}` : ''}`),
  acknowledgeDiaryEntry: (entryId) =>
    request(`/diary/${entryId}/acknowledge`, { method: 'PATCH' }),
  deleteDiaryEntry: (entryId) =>
    request(`/diary/${entryId}`, { method: 'DELETE' }),
  getTeacherClassInsights: (schoolId, grade, section, examId = '') =>
    request(`/analytics/teacher-class-insights?school_id=${schoolId}&grade=${grade}&section=${section}${examId ? `&exam_id=${examId}` : ''}`),
  broadcastAnnouncementWhatsApp: (announcementId, payload = {}) =>
    request(`/announcements/${announcementId}/broadcast`, { method: 'POST', body: JSON.stringify(payload) }),
  getWeeklyExecutiveReport: (schoolId) =>
    request(`/admin-stats/weekly-report?school_id=${schoolId}`),

  // ── Multi-Tenant SuperAdmin SaaS Platform ──
  getSuperAdminStats: () => request('/superadmin/stats'),
  listSuperAdminSchools: (params = {}) => {
    const queryStr = new URLSearchParams(params).toString();
    return request(`/superadmin/schools${queryStr ? `?${queryStr}` : ''}`);
  },
  getSuperAdminSchoolDetail: (schoolId) => request(`/superadmin/schools/${schoolId}`),
  updateSuperAdminSchool: (schoolId, data) => request(`/superadmin/schools/${schoolId}`, { method: 'PUT', body: JSON.stringify(data) }),
  suspendSchool: (schoolId, reason) => request(`/superadmin/schools/${schoolId}/suspend`, { method: 'POST', body: JSON.stringify({ reason }) }),
  activateSchool: (schoolId) => request(`/superadmin/schools/${schoolId}/activate`, { method: 'POST' }),
  deleteSchoolPermanent: (schoolId) => request(`/superadmin/schools/${schoolId}`, { method: 'DELETE' }),
  impersonateSchool: (schoolId) => request(`/superadmin/schools/${schoolId}/impersonate`, { method: 'POST' }),
  getSuperAdminAuditLogs: (params = {}) => {
    const queryStr = new URLSearchParams(params).toString();
    return request(`/superadmin/audit-logs${queryStr ? `?${queryStr}` : ''}`);
  },

  // ── Parent Link Codes & Security Verification ──
  generateParentCode: (studentId, expiresDays = 30) =>
    request('/parent-codes/generate', { method: 'POST', body: JSON.stringify({ student_id: studentId, expires_days: expiresDays }) }),
  getStudentParentCodes: (studentId) => request(`/parent-codes/student/${studentId}`),
  verifyParentCode: (code, parentUserId) => request('/parent-codes/verify', { method: 'POST', body: JSON.stringify({ code, parent_user_id: parentUserId }) }),
  getPendingLinkRequests: () => request('/parent-codes/requests/pending'),
  approveParentLinkRequest: (requestId) => request(`/parent-codes/requests/${requestId}/approve`, { method: 'POST' }),
  rejectParentLinkRequest: (requestId, reason = '') => request(`/parent-codes/requests/${requestId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  searchAndLinkChild: (data) => request('/parent-codes/search-and-link', { method: 'POST', body: JSON.stringify(data) }),
  listParentCodes: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/parent-codes/list${query ? `?${query}` : ''}`);
  },
  generateClassParentCodes: (payload) =>
    request('/parent-codes/generate-class', { method: 'POST', body: JSON.stringify(payload) }),

  // ── Staff & Custom Roles Management ────
  getAvailableRoles: () => request('/admin/roles'),
  updateAdminUser: (userId, data) => request(`/admin/users/${userId}`, { method: 'PUT', body: JSON.stringify(data) }),
  resetUserPassword: (userId, password) => request(`/admin/users/${userId}/reset-password`, { method: 'POST', body: JSON.stringify({ password }) }),
  deleteAdminUser: (userId) => request(`/admin/users/${userId}`, { method: 'DELETE' }),

  // ── Bulk Student CSV Upload ────────────
  downloadStudentCsvTemplateUrl: () => `${API_BASE}/admin/students/csv-template`,
  uploadStudentCsv: async (file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/admin/students/upload-csv`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'CSV upload failed' }));
      throw new Error(err.detail || 'CSV upload failed');
    }
    return res.json();
  },

  // ── Subscription & PayU Payment Gateway ──
  getSubscriptionPlans: () => request('/subscription/plans'),
  getCurrentSubscription: () => request('/subscription/current'),
  getSubscriptionStatus: () => request('/subscription/current'),
  selectStarterPlan: (data = { plan_tier: 'starter' }) => request('/subscription/select', { method: 'POST', body: JSON.stringify(data) }),
  createFreeTrialSubscription: (billing_cycle = 'monthly') => request('/subscription/select', { method: 'POST', body: JSON.stringify({ plan_tier: 'starter', billing_cycle }) }),
  initPayUPayment: (data) => request('/subscription/payu-init', { method: 'POST', body: JSON.stringify(data) }),
  initiatePayUPayment: (data) => request('/subscription/payu-init', { method: 'POST', body: JSON.stringify(data) }),
  verifyPayUPayment: (data) => request('/subscription/payu-verify', { method: 'POST', body: JSON.stringify(data) }),
  getSuperAdminSubscriptions: () => request('/subscription/admin/all'),
  overrideSchoolPlan: (schoolId, data) => request(`/subscription/admin/schools/${schoolId}/plan`, { method: 'PUT', body: JSON.stringify(data) }),

  // ── Gate Pass Lifecycle (#1) ───────────
  requestGatePass: (data) => request('/gate-passes/request', { method: 'POST', body: JSON.stringify(data) }),
  getParentGatePasses: (studentId) => request(`/gate-passes/parent${studentId ? `?student_id=${studentId}` : ''}`),
  cancelGatePass: (passId) => request(`/gate-passes/${passId}/cancel`, { method: 'POST' }),
  getAdminGatePassQueue: (params = {}) => {
    const q = new URLSearchParams();
    if (params.status) q.append('status', params.status);
    if (params.search) q.append('search', params.search);
    return request(`/gate-passes/admin/queue?${q.toString()}`);
  },
  approveGatePass: (passId) => request(`/gate-passes/${passId}/approve`, { method: 'POST' }),
  rejectGatePass: (passId, reason) => request(`/gate-passes/${passId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  verifyGatePassQr: (token) => request('/gate-passes/verify-qr', { method: 'POST', body: JSON.stringify({ token }) }),
  gateScanOut: (passId, gateName = 'Main Gate') => request(`/gate-passes/${passId}/scan-out`, { method: 'POST', body: JSON.stringify({ gate_name: gateName }) }),
  gateScanIn: (passId, gateName = 'Main Gate') => request(`/gate-passes/${passId}/scan-in`, { method: 'POST', body: JSON.stringify({ gate_name: gateName }) }),

  // ── Visitor Logs (#12) ─────────────────
  logVisitor: (data) => request('/visitors/', { method: 'POST', body: JSON.stringify(data) }),
  getVisitorLogs: (params = {}) => {
    const q = new URLSearchParams();
    if (params.status) q.append('status', params.status);
    if (params.search) q.append('search', params.search);
    return request(`/visitors/?${q.toString()}`);
  },
  checkoutVisitor: (id) => request(`/visitors/${id}/checkout`, { method: 'POST' }),
  getVisitorStats: () => request('/visitors/stats'),

  // ── Datesheets (#2) ────────────────────
  createDatesheet: (data) => request('/datesheets/', { method: 'POST', body: JSON.stringify(data) }),
  updateDatesheet: (id, data) => request(`/datesheets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  togglePublishDatesheet: (id) => request(`/datesheets/${id}/publish`, { method: 'POST' }),
  deleteDatesheet: (id) => request(`/datesheets/${id}`, { method: 'DELETE' }),
  getAdminDatesheets: () => request('/datesheets/admin'),
  getParentDatesheet: (studentId) => request(`/datesheets/parent?student_id=${studentId}`),
  aiParseDatesheetDocument: async (file, grade = '10', academic_year = '2025-26', auto_create = false) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('grade', grade);
    formData.append('academic_year', academic_year);
    formData.append('auto_create', auto_create);
    const res = await fetch(`${API_BASE}/datesheets/ai-parse-document`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Datesheet parsing failed' }));
      throw new Error(err.detail || 'Datesheet parsing failed');
    }
    return res.json();
  },

  // ── Almanac (#3) ───────────────────────
  createAlmanacDoc: (data) => request('/almanac/', { method: 'POST', body: JSON.stringify(data) }),
  updateAlmanacDoc: (id, data) => request(`/almanac/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAlmanacDoc: (id) => request(`/almanac/${id}`, { method: 'DELETE' }),
  getAdminAlmanac: () => request('/almanac/admin'),
  getParentAlmanac: (studentId, category) => {
    const q = new URLSearchParams();
    if (studentId) q.append('student_id', studentId);
    if (category) q.append('category', category);
    return request(`/almanac/parent?${q.toString()}`);
  },

  // ── Holiday Calendar (#4) ──────────────
  createHoliday: (data) => request('/holidays/', { method: 'POST', body: JSON.stringify(data) }),
  getHolidays: () => request('/holidays/'),
  getUpcomingHoliday: () => request('/holidays/upcoming'),
  updateHoliday: (id, data) => request(`/holidays/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteHoliday: (id) => request(`/holidays/${id}`, { method: 'DELETE' }),

  // ── Gallery (#5) ───────────────────────
  createAlbum: (data) => request('/gallery/albums', { method: 'POST', body: JSON.stringify(data) }),
  updateAlbum: (albumId, data) => request(`/gallery/albums/${albumId}`, { method: 'PUT', body: JSON.stringify(data) }),
  addPhotosToAlbum: (albumId, photos) => request(`/gallery/albums/${albumId}/photos`, { method: 'POST', body: JSON.stringify({ photos }) }),
  deletePhotoFromAlbum: (albumId, photoId) => request(`/gallery/albums/${albumId}/photos/${photoId}`, { method: 'DELETE' }),
  getAlbums: (studentId) => request(`/gallery/albums${studentId ? `?student_id=${studentId}` : ''}`),
  getAlbumDetail: (albumId) => request(`/gallery/albums/${albumId}`),
  deleteAlbum: (albumId) => request(`/gallery/albums/${albumId}`, { method: 'DELETE' }),

  // ── Activities & Feed (#6) ─────────────
  createActivity: (data) => request('/activities/', { method: 'POST', body: JSON.stringify(data) }),
  updateActivity: (id, data) => request(`/activities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getActivityFeed: (studentId, category) => {
    const q = new URLSearchParams();
    if (studentId) q.append('student_id', studentId);
    if (category) q.append('category', category);
    return request(`/activities/feed?${q.toString()}`);
  },
  deleteActivity: (id) => request(`/activities/${id}`, { method: 'DELETE' }),

  // ── Parent Profile, Preferences & Scoped Teachers (#7, #8, #10) ──
  getParentProfile: (studentId) => request(`/parent-profile/${studentId}`),
  updateParentProfile: (studentId, data) => request(`/parent-profile/${studentId}`, { method: 'PUT', body: JSON.stringify(data) }),
  getNotificationPreferences: () => request('/parent-profile/preferences/channels'),
  updateNotificationPreferences: (data) => request('/parent-profile/preferences/channels', { method: 'PUT', body: JSON.stringify(data) }),
  getScopedClassTeachers: (studentId) => request(`/parent-profile/teachers/${studentId}`),
  getMonthlyAttendanceSummary: (studentId, year, month) => {
    const q = new URLSearchParams();
    if (year) q.append('year', year);
    if (month) q.append('month', month);
    return request(`/parent-profile/attendance/${studentId}/monthly-summary?${q.toString()}`);
  },
  getAdminProfileChangeRequests: () => request('/parent-profile/admin/profile-change-requests'),
  approveProfileChange: (reqId) => request(`/parent-profile/admin/profile-change-requests/${reqId}/approve`, { method: 'POST' }),
  rejectProfileChange: (reqId, reason) => request(`/parent-profile/admin/profile-change-requests/${reqId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // ── School Branding & White-Label (#11) ─
  getPublicBranding: (schoolId) => request(`/branding/public/${schoolId}`),
  getSchoolBranding: () => request('/branding/'),
  updateSchoolBranding: (data) => request('/branding/', { method: 'PUT', body: JSON.stringify(data) }),

  // ── Birthday Engine (#9) ───────────────
  getTodayBirthdays: () => request('/birthdays/today'),
  triggerBirthdayWishes: () => request('/birthdays/trigger-wishes', { method: 'POST', body: JSON.stringify({}) }),

  // ── Broadcast Dispatch with Permissions ─
  sendBroadcast: (data) => request('/broadcast/send', { method: 'POST', body: JSON.stringify(data) }),
};

