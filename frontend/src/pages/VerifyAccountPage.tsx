import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import type { ApiError } from '../types';

const VerifyAccountPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token');
      if (!token) {
        setStatus('failed');
        setMessage('No verification token provided.');
        return;
      }

      try {
        const res = await axios.get(`http://localhost:5000/api/v1/auth/verify?token=${token}`);
        setStatus('success');
        setMessage(res.data.message || 'Your account has been verified.');
      } catch (error: unknown) {
        setStatus('failed');
        const apiError = error as ApiError;
        setMessage(apiError.response?.data?.message || 'Verification failed.');
      }
    };

    verifyToken();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-16">
      <div className="max-w-xl w-full bg-white p-10 rounded-2xl shadow-lg border border-gray-200 text-center">
        <h1 className="text-3xl font-bold mb-4">Email Verification</h1>
        {status === 'verifying' ? (
          <p className="text-gray-500">Verifying your account...</p>
        ) : (
          <p className={status === 'success' ? 'text-green-600' : 'text-red-600'}>{message}</p>
        )}
        <div className="mt-6">
          <Link to="/login" className="btn btn-primary">Go to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyAccountPage;
