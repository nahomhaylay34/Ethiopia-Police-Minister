import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getReports } from '../services/api';
import type { Report } from '../types';
import { Link, Navigate } from 'react-router-dom';

const DashboardPage = () => {
  const { user } = useAuth();
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  // no direct report form on citizen dashboard (request: remove report page from citizen dashboard)

  const fetchDashboardData = async () => {
    if (!user || user.role !== 'citizen') {
      setLoading(false);
      return;
    }

    try {
      const { data: reportData } = await getReports({ user_id: user.id, limit: 5 });
      setRecentReports(reportData.data.reports);
    } catch (error) {
      console.error('Error fetching dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/dashboard/admin" replace />;
  }

  if (user.role !== 'citizen') {
    return <Navigate to="/dashboard/officer" replace />;
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Welcome back, {user?.full_name}!</h1>
          <p className="text-gray-500 font-medium mt-1 uppercase tracking-wider text-xs">
            Role: <span className="text-indigo-600 font-bold">{user?.role}</span> • Ethiopia Crime Management System
          </p>
        </div>
      </div>

      {/* Citizen report creation removed from dashboard as requested */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Reports Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center">
            <h2 className="text-xl font-black text-gray-900">Recent Reports</h2>
            <Link to="/dashboard/reports" className="text-indigo-600 font-bold text-sm hover:underline">View All</Link>
          </div>
          <div className="p-0">
            {recentReports.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {recentReports.map((report) => (
                  <div key={report.id} className="px-8 py-5 hover:bg-gray-50 transition-colors flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">{report.title}</p>
                      <p className="text-sm text-gray-500">{report.location} • {new Date(report.occurrence_date).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                      report.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      report.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-400 font-medium">No recent reports found.</div>
            )}
          </div>
        </div>

        {/* Assigned Cases or Information Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center">
            <h2 className="text-xl font-black text-gray-900">
              {user?.role === 'citizen' ? 'System Guidelines' : 'Active Cases'}
            </h2>
            {user?.role !== 'citizen' && <Link to="/dashboard/cases" className="text-indigo-600 font-bold text-sm hover:underline">View All</Link>}
          </div>
          <div className="p-8 space-y-6">
            <GuidelineItem title="Be Detailed" text="When reporting, provide as much information as possible including photos and videos." />
            <GuidelineItem title="Stay Safe" text="Do not put yourself in danger to gather evidence. Your safety is the priority." />
            <GuidelineItem title="Monitor Updates" text="Check your notifications regularly for updates from assigned officers." />
          </div>
        </div>
      </div>
    </div>
  );
};

const GuidelineItem = ({ title, text }: { title: string, text: string }) => (
  <div className="flex space-x-4">
    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    </div>
    <div>
      <p className="font-bold text-gray-900">{title}</p>
      <p className="text-sm text-gray-500 leading-relaxed">{text}</p>
    </div>
  </div>
);

export default DashboardPage;
