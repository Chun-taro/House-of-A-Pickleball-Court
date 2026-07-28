import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trophy, Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmDialog';


export default function CourtsAdmin() {
  const toast = useToast();
  const confirm = useConfirm();

  const [facilities, setFacilities] = useState([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourt, setEditingCourt] = useState(null);

  const [formData, setFormData] = useState({
    name: "House of A's Main Court",
    court_type: 'Pickleball',
    capacity: 4,
    hourly_rate_override: '',
  });

  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/api/facilities')
      .then((res) => {
        if (res.data.success && res.data.facilities.length > 0) {
          setFacilities(res.data.facilities);
          setSelectedFacilityId(res.data.facilities[0]._id);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const fetchCourts = () => {
    if (!selectedFacilityId) return;
    axios.get(`/api/facilities/${selectedFacilityId}/courts`)
      .then((res) => {
        if (res.data.success) setCourts(res.data.courts);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchCourts();
  }, [selectedFacilityId]);

  const handleOpenCreate = () => {
    setEditingCourt(null);
    setFormData({
      name: "House of A's Main Court",
      court_type: 'Pickleball',
      capacity: 4,
      hourly_rate_override: '',
    });
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (court) => {
    setEditingCourt(court);
    setFormData({
      name: court.name,
      court_type: court.court_type || 'Pickleball',
      capacity: court.capacity || 4,
      hourly_rate_override: court.hourly_rate_override || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const payload = { ...formData, facility_id: selectedFacilityId };

    const request = editingCourt
      ? axios.put(`/api/facilities/courts/${editingCourt._id}`, payload)
      : axios.post('/api/facilities/courts', payload);

    request
      .then((res) => {
        if (res.data.success) {
          setShowModal(false);
          fetchCourts();
        } else {
          setError(res.data.message);
        }
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed action'));
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: 'Delete Court',
      message: 'This will permanently delete the court. This action cannot be undone.',
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!confirmed) return;
    axios.delete(`/api/facilities/courts/${id}`)
      .then((res) => {
        if (res.data.success) {
          fetchCourts();
          toast.success('Court deleted successfully.');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to delete court.'));
  };

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Courts Management</h1>
          <p className="text-xs sm:text-sm text-slate-600">Configure Pickleball court details and capacity</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Court
        </button>
      </div>

      <div className="glass-card p-4 sm:p-6 rounded-3xl space-y-4">
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-left text-xs text-slate-700 min-w-[500px]">
            <thead className="bg-slate-100/80 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3 rounded-l-xl">Court Name</th>
                <th className="p-3">Type</th>
                <th className="p-3">Capacity</th>
                <th className="p-3">Rate Override</th>
                <th className="p-3 rounded-r-xl text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courts.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-bold text-slate-900">{c.name}</td>
                  <td className="p-3">{c.court_type}</td>
                  <td className="p-3">{c.capacity} Persons</td>
                  <td className="p-3 font-semibold text-emerald-700">{c.hourly_rate_override ? `₱${c.hourly_rate_override}` : 'Default (₱150)'}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleOpenEdit(c)} className="p-1.5 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(c._id)} className="p-1.5 bg-rose-50 text-rose-700 rounded-md hover:bg-rose-100">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="glass-card p-5 sm:p-6 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">{editingCourt ? 'Edit Court' : 'Create Court'}</h3>

            {error && (
              <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl px-4 py-3">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-xs font-semibold leading-relaxed">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Court Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 mt-1"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Court Type</label>
                <input
                  type="text"
                  value={formData.court_type}
                  onChange={(e) => setFormData({ ...formData, court_type: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 mt-1"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Capacity (Players)</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 mt-1"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 font-bold text-slate-600">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl">
                  Save Court
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
