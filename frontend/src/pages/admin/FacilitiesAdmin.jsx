import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Building2, Edit, Trash2, Plus, AlertCircle } from 'lucide-react';
import courtImg from '../../images/pickle ball court.jpg';

export default function FacilitiesAdmin() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFac, setEditingFac] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    hourly_rate: 150,
    image_url: '/court.jpg',
    open_time: '06:00',
    close_time: '22:00',
  });

  const [error, setError] = useState('');

  const fetchFacilities = () => {
    axios.get('/api/facilities/admin/all')
      .then((res) => {
        if (res.data.success) {
          setFacilities(res.data.facilities);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const handleOpenCreate = () => {
    setEditingFac(null);
    setFormData({
      name: "House of A's Pickleball Court",
      description: 'Family-owned single court pickleball venue in Linabo, Malaybalay City.',
      location: 'Purok-1, Linabo, Malaybalay City, Bukidnon',
      hourly_rate: 150,
      image_url: '/court.jpg',
      open_time: '06:00',
      close_time: '22:00',
    });
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (fac) => {
    setEditingFac(fac);
    setFormData({
      name: fac.name,
      description: fac.description || '',
      location: fac.location || '',
      hourly_rate: fac.hourly_rate,
      image_url: fac.image_url || '',
      open_time: fac.open_time || '06:00',
      close_time: fac.close_time || '22:00',
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const request = editingFac
      ? axios.put(`/api/facilities/${editingFac._id}`, formData)
      : axios.post('/api/facilities', formData);

    request
      .then((res) => {
        if (res.data.success) {
          setShowModal(false);
          fetchFacilities();
        } else {
          setError(res.data.message);
        }
      })
      .catch((err) => setError(err.response?.data?.message || 'Action failed'));
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this facility?')) return;
    axios.delete(`/api/facilities/${id}`)
      .then((res) => {
        if (res.data.success) fetchFacilities();
      })
      .catch((err) => console.error(err));
  };

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Facility Settings</h1>
          <p className="text-xs sm:text-sm text-slate-600">Manage venue details, operating hours, and standard pricing</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Facility
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {facilities.map((fac) => (
          <div key={fac._id} className="glass-card p-4 sm:p-6 rounded-3xl space-y-4">
            <div className="h-44 rounded-2xl overflow-hidden bg-slate-100 relative">
              <img src={fac.image_url && fac.image_url !== 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&auto=format&fit=crop&q=80' ? fac.image_url : courtImg} alt={fac.name} className="w-full h-full object-cover" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">{fac.name}</h3>
                <span className="font-extrabold text-emerald-700 text-base shrink-0">₱{fac.hourly_rate}/hr</span>
              </div>
              <p className="text-xs text-slate-600">{fac.location}</p>
              <p className="text-xs text-slate-500 line-clamp-2">{fac.description}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => handleOpenEdit(fac)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1"
              >
                <Edit className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                onClick={() => handleDelete(fac._id)}
                className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Facility Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="glass-card p-5 sm:p-6 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">{editingFac ? 'Edit Facility' : 'Create Facility'}</h3>

            {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Facility Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 mt-1"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Hourly Rate (₱)</label>
                  <input
                    type="number"
                    required
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Image URL</label>
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 mt-1 h-20"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 font-bold text-slate-600">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl">
                  Save Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
