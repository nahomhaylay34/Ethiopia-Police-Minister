import React from 'react';
import { useAuth } from '../hooks/useAuth';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b-4 border-indigo-600">
      <div className="flex items-center">
        <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
      </div>
      <div className="flex items-center">
        <span className="mr-4">Welcome, {user?.full_name}</span>
        <button onClick={logout} className="text-gray-500 hover:text-gray-700">Logout</button>
      </div>
    </header>
  );
};

export default Header;
