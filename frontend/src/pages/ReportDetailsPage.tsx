import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReport } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { Report, Evidence } from '../types';

const ReportDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;
      try {
        const { data } = await getReport(id);
        setReport(data.data.report);
      } catch (error) {
        console.error('Failed to fetch report', error);
      }
    };
    fetchReport();
  }, [id]);

  const handleConvertToCase = () => {
    if (!report) return;
    const params = new URLSearchParams({
      title: report.title,
      description: report.description,
      crime_type: report.crime_type,
      location: report.location,
      date: report.occurrence_date.split('T')[0],
      report_id: report.id
    });
    navigate(`/dashboard/criminals/process?${params.toString()}`);
  };

  if (!report) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="flex justify-between items-start mb-6 border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{report.title}</h1>
            <p className="text-gray-500 mt-2">Reported on {new Date(report.occurrence_date).toLocaleString()}</p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase ${
              report.status === 'resolved' ? 'bg-green-100 text-green-800' :
              report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {report.status.replace('_', ' ')}
            </span>
            {(user?.role === 'officer' || user?.role === 'detective' || user?.role === 'admin') && report.status === 'pending' && (
              <button 
                onClick={handleConvertToCase}
                className="btn btn-primary btn-sm shadow-lg shadow-indigo-100"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                Verify & Create Case
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold text-gray-700 mb-4">Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase">Crime Type</p>
                <p className="text-lg text-gray-800 capitalize">{report.crime_type}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase">Location</p>
                <p className="text-lg text-gray-800">{report.location}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase">Urgency</p>
                <p className={`text-lg font-bold capitalize ${
                  report.urgency_level === 'emergency' ? 'text-red-600' :
                  report.urgency_level === 'high' ? 'text-orange-600' :
                  'text-gray-800'
                }`}>{report.urgency_level}</p>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-700 mb-4">Description</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{report.description}</p>
          </div>
        </div>
      </div>

      {report.Evidences && report.Evidences.length > 0 && (
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Evidence Gallery</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {report.Evidences.map((evidence: Evidence) => (
              <div key={evidence.id} className="group relative rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300">
                {evidence.file_type.startsWith('image/') ? (
                  <img
                    src={`http://localhost:5000${evidence.file_url}`}
                    alt="Evidence"
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-48 flex items-center justify-center bg-gray-50 text-gray-400">
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                      </svg>
                      <p className="text-sm">{evidence.file_type}</p>
                    </div>
                  </div>
                )}
                <div className="p-3 bg-white border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs text-gray-400">{(evidence.file_size / 1024).toFixed(1)} KB</span>
                  <a
                    href={`http://localhost:5000${evidence.file_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 font-bold hover:underline"
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDetailsPage;
