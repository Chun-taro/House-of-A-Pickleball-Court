import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Plus, Trash2, Shield, UserCheck, AlertCircle } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmDialog';

export default function UsersAdmin() {
  const toast = useToast();
  const confirm = useConfirm();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'staff',
  });
  const [error, setError] = useState('');

  const fetchUsers = () => {
    axios.get('/api/users')
      .then((res) => {
        if (res.data.success) setUsers(res.data.users);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = (e) => {
    e.preventDefault();
    setError('');

    axios.post('/api/users', formData)
      .then((res) => {
        if (res.data.success) {
          setShowModal(false);
          setFormData({ name: '', email: '', password: '', phone: '', role: 'staff' });
          fetchUsers();
          toast.success('User account created successfully.');
        } else {
          setError(res.data.message);
        }
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to create user.'));
  };

  const handleRoleChange = (id, newRole) => {
    axios.put(`/api/users/${id}`, { role: newRole })
      .then((res) => {
        if (res.data.success) {
          fetchUsers();
          toast.success('Role updated successfully.');
        } else {
          toast.warning(res.data.message || 'Action blocked.');
          fetchUsers();
        }
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to update role.');
        fetchUsers();
      });
  };

  const handleDeleteUser = async (id) => {
    const confirmed = await confirm({
      title: 'Delete User Account',
      message: 'This will permanently delete the user account and all associated data. This cannot be undone.',
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!confirmed) return;

    axios.delete(`/api/users/${id}`)
      .then((res) => {
        if (res.data.success) {
          fetchUsers();
          toast.success('User account deleted.');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to delete user.'));
  };

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">User &amp; Role Management</h1>
          <p className="text-xs sm:text-sm text-slate-600">Exclusive Admin portal to assign roles (Customer, Staff, Admin)</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" /> Create User Account
        </button>
      </div>

      <div className="glass-card p-4 sm:p-6 rounded-3xl space-y-4 shadow-md border border-slate-200">
        {loading ? (
          <div className="py-8 text-center text-slate-500">Loading users...</div>
        ) : (
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-left text-xs text-slate-700 min-w-[550px]">
              <thead className="bg-slate-100/80 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Change Account Role</th>
                  <th className="p-3 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{u.name}</td>
                    <td className="p-3 text-slate-600">{u.email}</td>
                    <td className="p-3 text-slate-600">{u.phone || '-'}</td>
                    <td className="p-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase outline-none cursor-pointer border shadow-xs transition-all ${
                          u.role === 'admin' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                          u.role === 'staff' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                          'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <option value="customer">Customer</option>
                        <option value="staff">Staff Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => handleDeleteUser(u._id)} className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg cursor-pointer transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="glass-card p-5 sm:p-6 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Create New Account</h3>

            {error && (
              <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl px-4 py-3">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-xs font-semibold leading-relaxed">{error}</p>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 mt-1"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 mt-1"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 mt-1"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 mt-1"
                >
                  <option value="customer">Customer</option>
                  <option value="staff">Staff Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 font-bold text-slate-600 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl cursor-pointer">
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
