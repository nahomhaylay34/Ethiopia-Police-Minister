import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

type User = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_verified: boolean;
  is_locked: boolean;
  created_at: string;
};

const AdminUserManagementPage: React.FC = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    national_id: '',
    address: '',
    role: 'citizen',
    is_locked: false,
    is_verified: true
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/v1/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data.data.users);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleOpenModal = (mode: 'create' | 'edit', user?: User) => {
    setModalMode(mode);
    if (mode === 'edit' && user) {
      setSelectedUserId(user.id);
      setFormData({
        full_name: user.full_name,
        email: user.email,
        password: '', // blank by default
        phone: '', // not returned in list by default
        national_id: '',
        address: '',
        role: user.role,
        is_locked: user.is_locked,
        is_verified: user.is_verified
      });
    } else {
      setSelectedUserId(null);
      setFormData({
        full_name: '',
        email: '',
        password: '',
        phone: '',
        national_id: '',
        address: '',
        role: 'officer',
        is_locked: false,
        is_verified: true
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        await axios.post('http://localhost:5000/api/v1/admin/users', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        const updateData: any = { ...formData };
        if (!updateData.password) delete updateData.password;
        await axios.put(`http://localhost:5000/api/v1/admin/users/${selectedUserId}`, updateData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save user');
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (email === 'helpcenter@cms.com') {
      alert('Cannot delete the system Help Center account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to completely delete user ${email}? This action cannot be undone.`)) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/v1/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">User Administration</h1>
          <p className="text-gray-500 font-medium mt-1">Manage system accounts, officers, and access levels</p>
        </div>
        <button onClick={() => handleOpenModal('create')} className="btn btn-primary shadow-lg shadow-indigo-500/30">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Create User
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input 
            type="text" 
            placeholder="Search users by name or email..." 
            className="input input-bordered w-full md:max-w-md bg-gray-50 focus:bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select 
            className="select select-bordered w-full md:w-48 bg-gray-50 focus:bg-white"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="citizen">Citizens</option>
            <option value="officer">Officers</option>
            <option value="detective">Detectives</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="bg-gray-50 text-gray-700">
                <th>Name / Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8"><span className="loading loading-spinner text-indigo-600"></span></td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500 font-medium">No users found.</td></tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td>
                      <div className="font-bold text-gray-900">{user.full_name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </td>
                    <td>
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'detective' ? 'bg-orange-100 text-orange-700' :
                        user.role === 'officer' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        {user.is_locked ? (
                          <span className="badge badge-error badge-sm">Suspended</span>
                        ) : (
                          <span className="badge badge-success badge-sm">Active</span>
                        )}
                      </div>
                    </td>
                    <td className="text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <button onClick={() => handleOpenModal('edit', user)} className="btn btn-sm btn-ghost text-indigo-600 hover:bg-indigo-50 mr-2">Edit</button>
                      <button onClick={() => handleDelete(user.id, user.email)} className="btn btn-sm btn-ghost text-red-600 hover:bg-red-50">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-black text-2xl text-gray-900 mb-6">
              {modalMode === 'create' ? 'Create New Account' : 'Edit User Account'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label font-bold text-gray-700">Full Name</label>
                  <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required className="input input-bordered w-full bg-gray-50" />
                </div>
                <div className="form-control">
                  <label className="label font-bold text-gray-700">Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required className="input input-bordered w-full bg-gray-50" />
                </div>
                <div className="form-control">
                  <label className="label font-bold text-gray-700">
                    {modalMode === 'create' ? 'Password' : 'New Password (Leave blank to keep)'}
                  </label>
                  <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required={modalMode === 'create'} className="input input-bordered w-full bg-gray-50" />
                </div>
                <div className="form-control">
                  <label className="label font-bold text-gray-700">Role</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="select select-bordered w-full bg-gray-50">
                    <option value="citizen">Citizen</option>
                    <option value="officer">Officer</option>
                    <option value="detective">Detective</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {modalMode === 'create' && (
                  <>
                    <div className="form-control">
                      <label className="label font-bold text-gray-700">Phone</label>
                      <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required className="input input-bordered w-full bg-gray-50" />
                    </div>
                    <div className="form-control">
                      <label className="label font-bold text-gray-700">National ID</label>
                      <input type="text" value={formData.national_id} onChange={e => setFormData({...formData, national_id: e.target.value})} required className="input input-bordered w-full bg-gray-50" />
                    </div>
                    <div className="form-control md:col-span-2">
                      <label className="label font-bold text-gray-700">Address</label>
                      <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required className="input input-bordered w-full bg-gray-50" />
                    </div>
                  </>
                )}
              </div>
              
              {modalMode === 'edit' && (
                <div className="form-control bg-red-50 p-4 rounded-xl border border-red-100 mt-4">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input type="checkbox" checked={formData.is_locked} onChange={e => setFormData({...formData, is_locked: e.target.checked})} className="checkbox checkbox-error" />
                    <span className="label-text font-bold text-red-700">Suspend Account (Lock Access)</span>
                  </label>
                  <p className="text-xs text-red-600 mt-1 ml-10">Suspended users cannot log in or interact with the system.</p>
                </div>
              )}

              <div className="modal-action mt-8">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{modalMode === 'create' ? 'Create User' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagementPage;
