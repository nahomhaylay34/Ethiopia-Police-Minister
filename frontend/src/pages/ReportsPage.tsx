import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getReports } from '../services/api';
import type { Report } from '../types';
import ReportForm from '../components/ReportForm';

const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showReportForm, setShowReportForm] = useState(false);

  const fetchReports = async () => {
    try {
      const { data } = await getReports({});
      setReports(data.data.reports);
    } catch (error) {
      console.error('Failed to fetch reports', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleReportSuccess = () => {
    setShowReportForm(false);
    fetchReports();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {user?.role === 'citizen' ? 'My Potential Crime Submissions' : 'Crime Reports'}
          </h1>
          <p className="text-gray-500 mt-1">
            {user?.role === 'citizen' ? 'Track the status of your submitted incidents' : 'Manage and track submitted incidents'}
          </p>
        </div>
        {user?.role !== 'citizen' && !showReportForm && (
          <button onClick={() => setShowReportForm(true)} className="btn btn-primary px-8">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Report New Crime
          </button>
        )}
      </div>

      {showReportForm && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-gray-900">New Incident Report</h2>
            <button onClick={() => setShowReportForm(false)} className="btn btn-sm btn-circle btn-ghost">✕</button>
          </div>
          <ReportForm onSuccess={handleReportSuccess} onCancel={() => setShowReportForm(false)} />
        </div>
      )}

      {reports.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg shadow-md">
          <p className="text-gray-400 text-lg">No reports found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report: Report) => (
            <div key={report.id} className="card bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="card-body">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="card-title text-gray-800 line-clamp-1">{report.title}</h2>
                  <span className={`badge ${
                    report.urgency_level === 'emergency' ? 'badge-error' :
                    report.urgency_level === 'high' ? 'badge-warning' :
                    'badge-ghost'
                  } badge-sm uppercase`}>
                    {report.urgency_level}
                  </span>
                </div>
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">{report.description}</p>
                <div className="flex flex-col space-y-2 text-xs text-gray-400 border-t pt-4">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    {report.location}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    {new Date(report.occurrence_date).toLocaleDateString()}
                  </div>
                </div>
                <div className="card-actions justify-end mt-4">
                  <Link to={`/dashboard/reports/${report.id}`} className="btn btn-sm btn-outline btn-primary">
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
