import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/api';
import type { ApiError } from '../types';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    national_id: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // All registrations from this page are citizens by default in backend
      await register(formData);
      alert('Account created successfully! You can now log in.');
      navigate('/login');
    } catch (err: unknown) {
      console.error('Registration failed', err);
      const apiError = err as ApiError;
      setError(apiError.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create Citizen Account</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join the platform to help secure Ethiopia
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-gray-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                <input type="text" name="full_name" placeholder="Abebe Bikila" onChange={handleChange} className="w-full input input-bordered rounded-xl" required />
              </div>
              <div className="form-control">
                <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                <input type="email" name="email" placeholder="abebe@example.com" onChange={handleChange} className="w-full input input-bordered rounded-xl" required />
              </div>
              <div className="form-control">
                <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                <input type="password" name="password" placeholder="••••••••" onChange={handleChange} className="w-full input input-bordered rounded-xl" required />
              </div>
              <div className="form-control">
                <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                <input type="text" name="phone" placeholder="+251 ..." onChange={handleChange} className="w-full input input-bordered rounded-xl" required />
              </div>
              <div className="form-control">
                <label className="block text-sm font-bold text-gray-700 mb-1">National ID</label>
                <input type="text" name="national_id" placeholder="ID-123456" onChange={handleChange} className="w-full input input-bordered rounded-xl" required />
              </div>
              <div className="form-control">
                <label className="block text-sm font-bold text-gray-700 mb-1">Address</label>
                <input type="text" name="address" placeholder="Addis Ababa, Ethiopia" onChange={handleChange} className="w-full input input-bordered rounded-xl" required />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ${
                  loading ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Creating Account...' : 'Register as Citizen'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-500">
                Login here
              </Link>
            </p>
          </div>
        </div>
        
        <div className="mt-8 flex justify-center space-x-4">
          <Link to="/" className="text-sm font-medium text-gray-500 hover:text-gray-700 transition duration-150">
            &larr; Back to Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
