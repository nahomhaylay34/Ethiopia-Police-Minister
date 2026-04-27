import axios from 'axios';
import type {
  LoginForm,
  RegisterForm,
  ReportParams,
  ReportForm,
  CaseQuery,
  CaseForm,
  CaseUpdateForm,
  MergeCasesForm,
  SendMessageForm,
  UserSearchParams,
  DashboardParams,
  AuditLogParams,
  UserParams,
  CreateUserForm,
  UpdateUserForm
} from '../types';

const API = axios.create({ 
  baseURL: 'http://localhost:5000/api/v1',
  withCredentials: true 
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const path = error?.config?.url;
    // Don't redirect to login if we're already trying to login or it's a specific auth check
    if ((status === 401 || status === 403) && !path?.includes('/auth/login') && !path?.includes('/auth/me')) {
      localStorage.removeItem('token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (formData: LoginForm) => API.post('/auth/login', formData);
export const register = (formData: RegisterForm) => API.post('/auth/register', formData);
export const getMe = () => API.get('/auth/me');

// WebAuthn
export const getWebauthnRegistrationOptions = () => API.get('/auth/webauthn/register-options');
export const verifyWebauthnRegistration = (response: any) => API.post('/auth/webauthn/register-verify', response);
export const getWebauthnLoginOptions = (email: string) => API.post('/auth/webauthn/login-options', { email });
export const verifyWebauthnLogin = (email: string, response: any) => API.post('/auth/webauthn/login-verify', { email, response });

// Reports
export const getReports = (params: ReportParams) => API.get('/reports', { params });
export const getReport = (id: string) => API.get(`/reports/${id}`);
export const submitReport = (formData: ReportForm) => API.post('/reports', formData);
export const updateReportStatus = (id: string, status: string) => API.put(`/reports/${id}/status`, { status });
export const deleteReport = (id: string) => API.delete(`/reports/${id}`);

// Evidence
export const uploadEvidence = (formData: FormData) => API.post('/evidence/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// Cases
export const getCases = (params: CaseQuery) => API.get('/cases', { params });
export const getCase = (id: string) => API.get(`/cases/${id}`);
export const createCase = (formData: CaseForm) => API.post('/cases', formData);
export const updateCase = (id: string, formData: CaseUpdateForm) => API.put(`/cases/${id}`, formData);
export const addCaseCharge = (id: string, additional_charge: string) => API.post(`/cases/${id}/charges`, { additional_charge });
export const assignCase = (id: string, userId: string) => API.post(`/cases/${id}/assign`, { user_id: userId });
export const addCaseNote = (id: string, note: string) => API.post(`/cases/${id}/notes`, { note });
export const mergeCases = (data: MergeCasesForm) => API.post('/cases/merge', data);
export const getCaseTimeline = (id: string) => API.get(`/cases/${id}/timeline`);

// Messages
export const sendMessage = (data: SendMessageForm) => API.post('/messages/send', data);
export const getConversations = () => API.get('/messages/conversations');
export const getConversation = (userId: string) => API.get(`/messages/conversations/${userId}`);
export const searchUsers = (params: UserSearchParams) => API.get('/messages/users', { params });
export const markMessageRead = (id: string) => API.put(`/messages/${id}/read`);

// Notifications
export const getNotifications = () => API.get('/notifications');
export const getUnreadNotificationCount = () => API.get('/notifications/unread-count');
export const markNotificationRead = (id: string) => API.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => API.put('/notifications/read-all');

// Admin
export const getDashboardStats = (params?: DashboardParams) => API.get('/admin/dashboard/stats', { params });
export const getDashboardTrends = (params?: DashboardParams) => API.get('/admin/dashboard/trends', { params });
export const getDashboardCrimeDistribution = (params: DashboardParams) => API.get('/admin/dashboard/crime-distribution', { params });
export const getDashboardStatusDistribution = (params: DashboardParams) => API.get('/admin/dashboard/status-distribution', { params });
export const getDashboardOfficerLoad = (params: DashboardParams) => API.get('/admin/dashboard/officer-load', { params });
export const getDashboardAlerts = (params: DashboardParams) => API.get('/admin/dashboard/alerts', { params });
export const exportReportData = () => API.post('/admin/export', {}, { responseType: 'blob' });
export const getAuditLogs = (params: AuditLogParams) => API.get('/admin/audit-logs', { params });
export const getUsers = (params: UserParams) => API.get('/admin/users', { params });
export const createUser = (data: CreateUserForm) => API.post('/admin/users', data);
export const updateUser = (id: string, data: UpdateUserForm) => API.put(`/admin/users/${id}`, data);
export const createAnnouncement = (data: { title: string, content: string, target_role?: string }) => API.post('/admin/announcements', data);

// Public – Missing Persons
export const getMissingPersons = (params?: { status?: string }) => API.get('/public/missing-persons', { params });
export const getMissingPerson = (id: string) => API.get(`/public/missing-persons/${id}`);
export const createMissingPerson = (data: any) => API.post('/public/missing-persons', data);
export const updateMissingPerson = (id: string, data: any) => API.put(`/public/missing-persons/${id}`, data);
export const deleteMissingPerson = (id: string) => API.delete(`/public/missing-persons/${id}`);

// Public – Fugitives
export const getFugitives = (params?: { status?: string }) => API.get('/public/fugitives', { params });
export const getFugitive = (id: string) => API.get(`/public/fugitives/${id}`);
export const createFugitive = (data: any) => API.post('/public/fugitives', data);
export const updateFugitive = (id: string, data: any) => API.put(`/public/fugitives/${id}`, data);
export const deleteFugitive = (id: string) => API.delete(`/public/fugitives/${id}`);

