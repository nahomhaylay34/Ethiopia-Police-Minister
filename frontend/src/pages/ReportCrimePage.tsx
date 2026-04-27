import React from 'react';
import { useNavigate } from 'react-router-dom';
import ReportForm from '../components/ReportForm';

const ReportCrimePage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    alert('Potential crime tip submitted successfully!');
    navigate('/dashboard/reports');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center gap-3 mb-8 border-b pb-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>
        </div>
        <h1 className="text-3xl font-black text-gray-800">Report Potential Crime</h1>
      </div>
      
      <div className="bg-white">
        <ReportForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
};

export default ReportCrimePage;
