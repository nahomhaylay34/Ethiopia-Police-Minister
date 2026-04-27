import React, { useEffect, useState, useCallback } from 'react';
import { 
  getDashboardStats, 
  getDashboardCrimeDistribution, 
  getDashboardOfficerLoad, 
  getDashboardAlerts,
  getAuditLogs,
  createUser
} from '../services/api';
import type { 
  DashboardStats, 
  CrimeDistributionItem, 
  OfficerLoadItem, 
  AlertItem,
  AuditLog,
  CreateUserForm,
  ApiError,
  User
} from '../types';
const ChartBarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>
);
const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
  </svg>
);
const ShieldCheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
  </svg>
);
const ExclamationTriangleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
  </svg>
);
const ArrowTrendingUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
  </svg>
);
const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);
const DocumentTextIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);
const ArrowPathIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);
type Role = User['role'];
type CSSVarStyle = React.CSSProperties & {
  '--value'?: number | string;
  '--size'?: number | string;
  '--thickness'?: number | string;
};

const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [crimeDistribution, setCrimeDistribution] = useState<CrimeDistributionItem[]>([]);
  const [officerLoad, setOfficerLoad] = useState<OfficerLoadItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('month');
  
  // User creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState<CreateUserForm>({
    email: '',
    password: '',
    full_name: '',
    role: 'citizen'
  });

  const loadData = useCallback(async (range: 'today' | 'week' | 'month' | 'year' = dateRange) => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled([
        getDashboardStats({ date_range: range }),
        getDashboardCrimeDistribution({ date_range: range }),
        getDashboardOfficerLoad({ date_range: range }),
        getDashboardAlerts({ limit: 12 }),
        getAuditLogs({ limit: 10 })
      ]);

      const [statsRes, crimeRes, officerRes, alertsRes, logsRes] = results;

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data.data);
      }
      if (crimeRes.status === 'fulfilled') {
        setCrimeDistribution(crimeRes.value.data.data.distribution || []);
      }
      if (officerRes.status === 'fulfilled') {
        setOfficerLoad(officerRes.value.data.data.officers || []);
      }
      if (alertsRes.status === 'fulfilled') {
        setAlerts(alertsRes.value.data.data.alerts || []);
      }
      if (logsRes.status === 'fulfilled') {
        setAuditLogs(logsRes.value.data.data.logs || []);
      }

      const failures = results.filter(r => r.status === 'rejected').length;
      if (failures > 0) {
        setError('Some dashboard sections failed to load. Please try again.');
      }
    } catch (err: unknown) {
      console.error('Failed to load dashboard data', err);
      const apiError = err as ApiError;
      setError(apiError.response?.data?.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadData(dateRange);
  }, [dateRange, loadData]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser(newUser);
      setShowCreateModal(false);
      setNewUser({ email: '', password: '', full_name: '', role: 'citizen' });
      loadData();
    } catch (err: unknown) {
      console.error('Failed to create user', err);
      const apiError = err as ApiError;
      setError(apiError.response?.data?.message || 'Failed to create user.');
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex justify-center items-center h-full min-h-screen bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-base-200 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Admin Dashboard</h1>
          <p className="text-base-content/60">System overview and management</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="join bg-base-100 shadow-sm">
            {(['today', 'week', 'month', 'year'] as const).map((range) => (
              <button
                key={range}
                className={`join-item btn btn-sm ${dateRange === range ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setDateRange(range)}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
          <button 
            className="btn btn-primary btn-sm shadow-sm"
            onClick={() => setShowCreateModal(true)}
          >
            <PlusIcon className="w-4 h-4 mr-1" />
            Add User
          </button>
          <button 
            className="btn btn-ghost btn-sm btn-square shadow-sm"
            onClick={() => loadData()}
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error shadow-lg">
          <ExclamationTriangleIcon className="w-6 h-6" />
          <span>{error}</span>
          <button className="btn btn-sm btn-ghost" onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Reports Card */}
        <div className="card bg-base-100 shadow-xl border-l-4 border-primary">
          <div className="card-body p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-base-content/60 uppercase">Reports</p>
                <h3 className="text-2xl font-bold">{stats?.reports?.total || 0}</h3>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <DocumentTextIcon className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <span className="badge badge-warning badge-xs"></span>
                <span className="text-base-content/70">Pending: {stats?.reports?.pending || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="badge badge-info badge-xs"></span>
                <span className="text-base-content/70">Active: {stats?.reports?.investigating || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cases Card */}
        <div className="card bg-base-100 shadow-xl border-l-4 border-secondary">
          <div className="card-body p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-base-content/60 uppercase">Cases</p>
                <h3 className="text-2xl font-bold">{stats?.cases?.total || 0}</h3>
              </div>
              <div className="p-2 bg-secondary/10 rounded-lg">
                <ShieldCheckIcon className="w-6 h-6 text-secondary" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <span className="badge badge-secondary badge-xs"></span>
                <span className="text-base-content/70">Open: {stats?.cases?.open || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="badge badge-success badge-xs"></span>
                <span className="text-base-content/70">Closed: {stats?.cases?.closed || 0}</span>
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs text-base-content/60">
              <ClockIcon className="w-3 h-3 mr-1" />
              Avg. Resolution: {stats?.cases?.average_resolution_days || 0} days
            </div>
          </div>
        </div>

        {/* Officers Card */}
        <div className="card bg-base-100 shadow-xl border-l-4 border-accent">
          <div className="card-body p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-base-content/60 uppercase">Officers</p>
                <h3 className="text-2xl font-bold">{stats?.officers?.total || 0}</h3>
              </div>
              <div className="p-2 bg-accent/10 rounded-lg">
                <UsersIcon className="w-6 h-6 text-accent" />
              </div>
            </div>
            <div className="mt-4 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-base-content/70">Active Force:</span>
                <span className="font-semibold">{stats?.officers?.active || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/70">Avg. Case Load:</span>
                <span className="font-semibold">{stats?.officers?.average_case_load?.toFixed(1) || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Card */}
        <div className="card bg-base-100 shadow-xl border-l-4 border-info">
          <div className="card-body p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-base-content/60 uppercase">Performance</p>
                <h3 className="text-2xl font-bold">{stats?.performance_metrics?.resolution_rate || 0}%</h3>
              </div>
              <div className="p-2 bg-info/10 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-info" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <progress 
                className="progress progress-info w-full" 
                value={stats?.performance_metrics?.resolution_rate || 0} 
                max="100"
              ></progress>
              <div className="flex justify-between text-xs">
                <span className="text-base-content/70">Resolution Rate</span>
                <span className="text-base-content/70">Goal: 85%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Crime Distribution */}
        <div className="card bg-base-100 shadow-xl lg:col-span-1">
          <div className="card-body">
            <h3 className="card-title text-lg flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5 text-primary" />
              Crime Distribution
            </h3>
            <div className="space-y-4 mt-4">
              {crimeDistribution.map((item) => (
                <div key={item.crime_type} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-base-content/60">{item.count} ({item.percentage}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <progress 
                      className="progress w-full" 
                      value={item.percentage} 
                      max="100"
                      style={{ color: item.color }}
                    ></progress>
                    <span className={`text-xs ${item.trend === 'up' ? 'text-error' : 'text-success'}`}>
                      {item.trend === 'up' ? '▲' : '▼'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts & Critical Issues */}
        <div className="card bg-base-100 shadow-xl lg:col-span-2">
          <div className="card-body">
            <h3 className="card-title text-lg flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-error" />
              System Alerts
            </h3>
            <div className="overflow-x-auto mt-4">
              <table className="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th>Severity</th>
                    <th>Type</th>
                    <th>Alert</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert) => (
                    <tr key={alert.id}>
                      <td>
                        <span className={`badge badge-xs ${
                          alert.severity === 'critical' ? 'badge-error' : 
                          alert.severity === 'high' ? 'badge-warning' : 
                          'badge-info'
                        }`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="font-medium">{alert.type}</td>
                      <td className="max-w-xs truncate">{alert.title}</td>
                      <td>
                        <span className={`text-xs ${
                          alert.status === 'active' ? 'text-error font-bold' : 'text-base-content/60'
                        }`}>
                          {alert.status}
                        </span>
                      </td>
                      <td className="text-xs text-base-content/60">
                        {new Date(alert.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {alerts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-base-content/40">No active alerts</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Urgency Breakdown */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title text-lg flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-warning" />
              Report Urgency Breakdown
            </h3>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {[
                { label: 'Emergency', value: stats?.urgency_breakdown?.emergency || 0, color: 'bg-error' },
                { label: 'High', value: stats?.urgency_breakdown?.high || 0, color: 'bg-warning' },
                { label: 'Medium', value: stats?.urgency_breakdown?.medium || 0, color: 'bg-info' },
                { label: 'Low', value: stats?.urgency_breakdown?.low || 0, color: 'bg-success' }
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-base-200/50">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <div>
                    <div className="text-xs text-base-content/60 font-medium">{item.label}</div>
                    <div className="text-xl font-bold">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title text-lg flex items-center gap-2">
              <ArrowTrendingUpIcon className="w-5 h-5 text-success" />
              Operational Performance
            </h3>
            <div className="space-y-6 mt-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Citizen Satisfaction</span>
                  <span className="text-base-content/60">{stats?.performance_metrics?.citizen_satisfaction || 0}%</span>
                </div>
                <progress className="progress progress-success w-full" value={stats?.performance_metrics?.citizen_satisfaction || 0} max="100"></progress>
              </div>
              <div className="flex justify-around py-2 border-t border-base-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats?.performance_metrics?.response_time_avg_hours || 0}h</div>
                  <div className="text-[10px] uppercase font-bold text-base-content/40">Avg. Response</div>
                </div>
                <div className="divider divider-horizontal"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">{stats?.performance_metrics?.resolution_rate || 0}%</div>
                  <div className="text-[10px] uppercase font-bold text-base-content/40">Resolution Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Officer Load & Performance */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title text-lg flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5 text-secondary" />
              Officer Load & Efficiency
            </h3>
            <div className="overflow-x-auto mt-4">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Officer</th>
                    <th>Active Cases</th>
                    <th>Efficiency</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {officerLoad.map((officer) => (
                    <tr key={officer.user_id}>
                      <td>
                        <div className="font-bold">{officer.name}</div>
                        <div className="text-xs opacity-50">{officer.badge_number || 'No Badge'}</div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span>{officer.active_cases}</span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: Math.min(officer.active_cases, 5) }).map((_, i) => (
                              <div key={i} className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="radial-progress text-primary" style={{ '--value': officer.efficiency_score, '--size': '2rem', '--thickness': '2px' } as CSSVarStyle}>
                          <span className="text-[8px]">{officer.efficiency_score}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-sm ${
                          officer.overload_status === 'overloaded' ? 'badge-error' : 
                          officer.overload_status === 'approaching_limit' ? 'badge-warning' : 
                          'badge-success'
                        }`}>
                          {officer.overload_status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Audit Logs */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title text-lg flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-accent" />
              System Activity
            </h3>
            <div className="space-y-4 mt-4">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex gap-4 items-start">
                  <div className="mt-1">
                    <div className={`w-2 h-2 rounded-full ${
                      log.action === 'LOGIN' ? 'bg-success' :
                      log.action === 'DELETE' ? 'bg-error' :
                      'bg-primary'
                    }`}></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-bold">{log.action}</span>
                      <span className="text-xs text-base-content/40">{new Date(log.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-base-content/70">
                      <span className="font-medium">{log.User?.full_name || 'System'}</span> {log.details}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Add New System User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Full Name</span></label>
                <input 
                  type="text" 
                  className="input input-bordered w-full" 
                  required
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Email Address</span></label>
                <input 
                  type="email" 
                  className="input input-bordered w-full" 
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Password</span></label>
                <input 
                  type="password" 
                  className="input input-bordered w-full" 
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">System Role</span></label>
                <select 
                  className="select select-bordered w-full"
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value as Role})}
                >
                  <option value="citizen">Citizen</option>
                  <option value="officer">Officer</option>
                  <option value="detective">Detective</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
