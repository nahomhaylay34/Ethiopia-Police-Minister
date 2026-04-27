export interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  national_id: string;
  address: string;
  role: 'citizen' | 'officer' | 'detective' | 'admin';
  is_verified: boolean;
}

export interface Evidence {
  id: string;
  file_url: string;
  file_type: string;
  file_size: number;
  description?: string;
  uploaded_by?: string;
  report_id?: string;
  case_id?: string;
  EvidenceCustodies?: EvidenceCustody[];
}

export interface EvidenceCustody {
  id: string;
  evidence_id: string;
  user_id?: string;
  action: string;
  notes?: string;
  from_location?: string;
  to_location?: string;
  created_at: string;
  User?: Partial<User>;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  crime_type: string;
  location: string;
  urgency_level: string;
  status: string;
  occurrence_date: string;
  created_at: string;
  Evidences: Evidence[];
  User?: Partial<User>;
}

export interface Suspect {
  id: string;
  full_name: string;
  national_id?: string;
  photo_url?: string;
  phone?: string;
  address?: string;
  criminal_status: 'unknown' | 'suspected' | 'arrested' | 'convicted' | 'released';
}

export interface Case {
  id: string;
  case_number: string;
  title: string;
  description: string;
  status: 'open' | 'under_investigation' | 'awaiting_court' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  crime_type?: string;
  incident_date?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  crime_details?: string;
  opened_at: string;
  closed_at?: string;
  created_at: string;
  Officer?: Partial<User>;
  Suspects?: Suspect[];
  Evidences?: Evidence[];
  Reports?: Report[];
}

export interface CaseQuery {
  case_number?: string;
  national_id?: string;
  full_name?: string;
  assigned_to?: string;
  limit?: number;
}

export interface CaseTimelineItem {
  id: string;
  notes: string;
  update_type: string;
  created_at: string;
  User: {
    full_name: string;
  };
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  content: string;
  Sender: {
    id: string;
    full_name: string;
  };
  Receiver: {
    id: string;
    full_name: string;
  };
}

export interface AuditLog {
  id: number;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  details: string | null;
  User?: {
    full_name: string;
  };
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface DashboardStats {
  totalReports: number;
  totalCases: number;
  totalUsers: number;
  resolutionRate: number;
  reports?: {
    total: number;
    pending: number;
    investigating: number;
    resolved: number;
    closed: number;
    percentage_change: {
      total: number;
      pending: number;
      investigating: number;
      resolved: number;
      closed: number;
    };
  };
  cases?: {
    total: number;
    open: number;
    investigation: number;
    awaiting_approval: number;
    closed: number;
    average_resolution_days: number;
    percentage_change: {
      total: number;
      open: number;
      closed: number;
    };
  };
  officers?: {
    total: number;
    active: number;
    on_leave: number;
    average_case_load: number;
    most_productive: {
      user_id: string | null;
      name: string | null;
      resolved_cases: number;
    };
  };
  citizens?: {
    total: number;
    active: number;
    new_this_period: number;
    verified: number;
    anonymous_reports: number;
  };
  urgency_breakdown?: {
    low: number;
    medium: number;
    high: number;
    emergency: number;
  };
  performance_metrics?: {
    response_time_avg_hours: number;
    resolution_rate: number;
    citizen_satisfaction: number;
  };
  time_period?: {
    start: string;
    end: string;
    label: string;
  };
}

export interface StatusDistributionItem {
  status: string;
  label: string;
  count: number;
  percentage: number;
  average_duration_days: number;
  color: string;
}

export interface OfficerLoadItem {
  user_id: string;
  name: string;
  badge_number: string | null;
  role: string;
  department: string | null;
  active_cases: number;
  total_assigned: number;
  resolved_this_month: number;
  pending_reports: number;
  average_resolution_days: number;
  efficiency_score: number;
  overload_status: string;
  cases_by_priority: {
    low: number;
    medium: number;
    high: number;
    emergency: number;
  };
}

type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface AlertItem {
  id: number;
  rule_id: number | null;
  type: string;
  title: string;
  description: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: AlertStatus;
  metadata: Record<string, unknown>;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrimeDistributionItem {
  crime_type: string;
  label: string;
  count: number;
  percentage: number;
  trend: string;
  color: string;
}

export interface TrendItem {
  date: string;
  count: number;
  year?: number;
  month?: number;
}

export interface LoginForm {
  email?: string;
  password?: string;
}

export interface RegisterForm {
  email?: string;
  password?: string;
  full_name?: string;
  phone?: string;
  national_id?: string;
  address?: string;
}

export interface ReportParams {
  status?: string;
  crime_type?: string;
  date_range?: string;
  limit?: number;
  user_id?: string;
}

export interface ReportForm {
  title?: string;
  description?: string;
  crime_type?: string;
  location?: string;
  date_of_incident?: string;
}

export interface CaseForm {
  title?: string;
  description?: string;
  crime_type?: string;
  location?: string;
  date_of_incident?: string;
}

export interface CaseUpdateForm {
  status?: string;
  assigned_to?: string;
  priority?: string;
  suspect_name?: string;
  suspect_national_id?: string;
  suspect_phone?: string;
  suspect_address?: string;
  suspect_photo_url?: string;
  crime_details?: string;
  other_charges?: string;
}

export interface MergeCasesForm {
  caseIds?: string[];
  primaryCaseId?: string;
}

export interface SendMessageForm {
  recipient_id?: string;
  receiver_id?: string;
  content?: string;
}

export interface UserSearchParams {
  q?: string;
  email?: string;
}

export interface DashboardParams {
  date_range?: string;
  limit?: number;
  year?: number;
}

export interface AuditLogParams {
  limit?: number;
}

export interface UserParams {
  limit?: number;
}

export interface CreateUserForm {
  email?: string;
  password?: string;
  full_name?: string;
  phone?: string;
  national_id?: string;
  address?: string;
  role?: 'citizen' | 'officer' | 'detective' | 'admin';
}

export interface UpdateUserForm {
  email?: string;
  full_name?: string;
  phone?: string;
  national_id?: string;
  address?: string;
  role?: 'citizen' | 'officer' | 'detective' | 'admin';
}
