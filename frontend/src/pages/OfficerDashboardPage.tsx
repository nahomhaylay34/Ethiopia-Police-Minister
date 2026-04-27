import React, { useEffect, useState } from 'react';
import { getCases, getReports, updateReportStatus } from '../services/api';
import type { Report, Case, CaseQuery, ReportParams } from '../types';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const OfficerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;
    const fetchData = async () => {
      try {
        const casesParams: CaseQuery = { assigned_to: user.id, limit: 10 };
        const reportsParams: ReportParams = { limit: 10 };
        const [casesRes, reportsRes] = await Promise.all([
          getCases(casesParams),
          getReports(reportsParams)
        ]);

        if (!mounted) return;
        setCases(casesRes.data.data.cases);
        setReports(reportsRes.data.data.reports);
      } catch (error) {
        console.error('Failed to fetch officer dashboard data', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 15000); // refresh latest reports and case assignments
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user?.id]);

  const handleReportStatus = async (reportId: string, status: string) => {
    try {
      await updateReportStatus(reportId, status);
      const reportsParams: ReportParams = { limit: 10 };
      const reportsRes = await getReports(reportsParams);
      setReports(reportsRes.data.data.reports);
    } catch (error) {
      console.error('Failed to update report status', error);
      alert('Error updating report status. Please try again.');
    }
  };

  const handleCreateCase = (report: Report) => {
    const params = new URLSearchParams({
      title: report.title,
      description: report.description,
      crime_type: report.crime_type,
      priority: 'medium',
      incident_date: new Date(report.occurrence_date).toISOString().split('T')[0],
      location: report.location,
      report_id: report.id
    });
    navigate(`/dashboard/criminals/process?${params.toString()}`);
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'officer' && user.role !== 'detective') {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-black text-gray-900">Officer Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back, {user.full_name}. You are logged in as {user.role}.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black">Recent Assigned Cases</h2>
            <div className="flex items-center gap-2">
              <Link to={`/dashboard/cases?assigned_to=${user?.id}`} className="text-indigo-600 font-bold text-sm hover:underline">View Assigned</Link>
              <Link to="/dashboard/criminals/process" className="text-white bg-indigo-600 px-3 py-1 text-xs rounded-lg hover:bg-indigo-700">Process New Criminal</Link>
            </div>
          </div>
          {cases.length === 0 ? (
            <p className="text-gray-500">No cases found yet.</p>
          ) : (
            <div className="space-y-3">
              {cases.map((caseItem) => (
                <div key={caseItem.id} className="p-4 rounded-xl bg-gray-50">
                  <h3 className="font-semibold">{caseItem.title}</h3>
                  <p className="text-sm text-gray-500">Status: {caseItem.status} • Priority: {caseItem.priority}</p>
                  <Link to={`/dashboard/cases/${caseItem.id}`} className="text-indigo-600 text-sm font-bold hover:underline">View details</Link>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black">Latest Reports</h2>
            <Link to="/dashboard/reports" className="text-indigo-600 font-bold text-sm hover:underline">Inspect Reports</Link>
          </div>
          {reports.length === 0 ? (
            <p className="text-gray-500">No reports available.</p>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="p-4 rounded-xl bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{report.title}</h3>
                    <span className={`text-xs uppercase font-bold ${
                      report.status === 'resolved' ? 'text-green-600' :
                      report.status === 'pending' ? 'text-yellow-600' :
                      'text-indigo-600'
                    }`}>{report.status}</span>
                  </div>
                  <p className="text-sm text-gray-500">{report.location} • {new Date(report.occurrence_date).toLocaleDateString()}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleReportStatus(report.id, 'under_review')}
                      className="btn btn-xs btn-outline btn-warning"
                    >
                      Mark Under Review
                    </button>
                    <button
                      onClick={() => handleReportStatus(report.id, 'closed')}
                      className="btn btn-xs btn-outline btn-error"
                    >
                      Reject Report
                    </button>
                    <button
                      onClick={() => handleCreateCase(report)}
                      className="btn btn-xs btn-outline btn-primary"
                    >
                      Create Case
                    </button>
                    <Link to={`/dashboard/reports/${report.id}`} className="btn btn-xs btn-outline btn-info">
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default OfficerDashboardPage;
