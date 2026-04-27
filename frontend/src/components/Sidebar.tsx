import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import { getWebauthnRegistrationOptions, verifyWebauthnRegistration } from '../services/api';
import { startRegistration } from '@simplewebauthn/browser';

const Sidebar = () => {
  const { user } = useAuth();
  const [setupLoading, setSetupLoading] = useState(false);
  
  const handleSetupBiometrics = async () => {
    setSetupLoading(true);
    try {
      const optionsRes = await getWebauthnRegistrationOptions();
      const asseResp = await startRegistration(optionsRes.data);
      const verifyRes = await verifyWebauthnRegistration(asseResp);
      if (verifyRes.data.success) {
        alert('Biometric login set up successfully!');
      } else {
        alert('Failed to set up biometric login.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error setting up biometrics: ' + (err.response?.data?.message || err.message));
    } finally {
      setSetupLoading(false);
    }
  };
  
  const navItems = [
    { to: user?.role === 'admin' ? '/dashboard/analytics' : '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', roles: ['citizen', 'officer', 'detective', 'admin'] },
    { to: '/dashboard/reports', label: 'Reports', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', roles: ['citizen', 'officer', 'detective', 'admin'] },
    { to: '/dashboard/reports/new', label: 'Report Crime', icon: 'M12 9v3m0 0v3m0-3h3m-3 0h-3m-9 14h10M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', roles: ['citizen'] },
    { to: '/dashboard/cases', label: 'Cases', icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3', roles: ['officer', 'detective', 'admin'] },
    { to: '/dashboard/messages', label: 'Messages', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', roles: ['citizen', 'officer', 'detective', 'admin'] },
    { to: '/dashboard/criminals/process', label: 'Process Criminals', icon: 'M12 10c0-1.105.895-2 2-2s2 .895 2 2-.895 2-2 2-2-.895-2-2z', roles: ['officer', 'detective'] },
    { to: '/dashboard/alerts/board', label: 'Alert Board', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', roles: ['officer', 'detective', 'admin'] },
    { to: '/dashboard/notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', roles: ['citizen', 'officer', 'detective', 'admin'] },
    { to: '/dashboard/admin', label: 'Administration', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', roles: ['admin'] },
  ];

  return (
    <div className="w-72 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
      <div className="px-8 py-10 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">C</div>
          <span className="text-2xl font-black tracking-tight">CMS Ethiopia</span>
        </div>
        <div className="mt-4 flex items-center space-x-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{user?.role} Portal</span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems
          .filter(item => item.roles.includes(user?.role || ''))
          .map((item) => {
            let label = item.label;
            if (user?.role === 'citizen') {
              if (item.label === 'Reports') label = 'My Submissions';
              if (item.label === 'Report Crime') label = 'Report Potential Crime';
            }
            return (
              <NavLink 
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard' || item.to === '/dashboard/analytics' || item.to === '/dashboard/reports'}
                className={({ isActive }) => 
                  `flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all duration-200 group ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 font-bold' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span className="tracking-wide">{label}</span>
              </NavLink>
            );
          })}
      </nav>

      <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex flex-col gap-3">
        <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-800/50">
          <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white shadow-inner">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{user?.full_name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        
        <button
          onClick={handleSetupBiometrics}
          disabled={setupLoading}
          className={`w-full py-2 px-3 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-xl text-xs font-bold transition-colors flex items-center justify-center ${setupLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
          </svg>
          {setupLoading ? 'Setting up...' : 'Setup Biometric Login'}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
