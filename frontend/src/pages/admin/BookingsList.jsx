import React, { useEffect, useState } from 'react';
import axios from 'axios';
import StatusBadge from '../../components/StatusBadge';
import ManualBookingModal from '../../components/ManualBookingModal';
import { Filter, Check, X, LogIn, Plus, CalendarCheck, User, Download, Eye, FileImage, Clock, ShieldAlert } from 'lucide-react';

export default function BookingsList() {
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [selectedProof, setSelectedProof] = useState(null);
  const [proofImgError, setProofImgError] = useState(false);

  const fetchBookings = () => {
    let url = '/api/bookings/admin/all';
    if (statusFilter) url += `?status=${statusFilter}`;

    axios.get(url)
      .then((res) => {
        if (res.data.success) {
          setBookings(res.data.bookings);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleUpdateStatus = (id, newStatus) => {
    axios.patch(`/api/bookings/admin/${id}/status`, { status: newStatus })
      .then((res) => {
        if (res.data.success) {
          fetchBookings();
        }
      })
      .catch((err) => console.error(err));
  };

  const handleManualSuccess = (msg) => {
    setAlertMessage(msg || 'Schedule occupied successfully!');
    fetchBookings();
    setTimeout(() => setAlertMessage(''), 5000);
  };

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Reservations Management</h1>
          <p className="text-xs sm:text-sm text-slate-600">View customer schedules, filter reservations, and manage court slots</p>
        </div>

        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3 w-full sm:w-auto">
          {/* Create Manual Schedule / Occupy Slot Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Manually Occupy Time Slot
          </button>

          {/* Filter Dropdown */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-300 rounded-xl">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-900 focus:outline-none font-semibold cursor-pointer py-1"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="checked_in">Checked In</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {alertMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{alertMessage}</span>
        </div>
      )}

      <div className="glass-card p-4 sm:p-6 rounded-3xl space-y-4">
        {loading ? (
          <div className="py-8 text-center text-slate-500">Loading bookings list...</div>
        ) : bookings.length === 0 ? (
          <div className="py-8 text-center text-slate-500">No bookings match the filter criteria.</div>
        ) : (
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
              <thead className="bg-slate-100/80 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">Code</th>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Court</th>
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">Notes / Purpose</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-emerald-800">{b.booking_code}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {b.user_id?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-sm">{b.user_id?.name || 'Walk-in Customer'}</div>
                          {b.user_id?.email && <div className="text-[10px] text-slate-500">{b.user_id.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{b.court_id?.name || 'Main Court'}</td>
                    <td className="p-3 font-mono">{b.booking_date} ({b.start_time}-{b.end_time})</td>
                    <td className="p-3 text-slate-600 max-w-xs truncate">{b.notes || '-'}</td>
                    <td className="p-3 font-bold text-slate-900">₱{b.total_amount?.toFixed(2)}</td>
                    <td className="p-3"><StatusBadge status={b.status} /></td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {b.payment?.proof_of_payment_url && (
                          <button
                            onClick={() => {
                              setProofImgError(false);
                              setSelectedProof(b);
                            }}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-extrabold rounded-lg text-[10px] flex items-center gap-1 transition-colors"
                            title="View GCash Proof Screenshot"
                          >
                            <Eye className="w-3 h-3 text-blue-600" /> Proof
                          </button>
                        )}

                        <a
                          href={`/api/bookings/${b._id}/receipt?token=${localStorage.getItem('sc_token') || localStorage.getItem('token') || ''}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-colors"
                          title="Download PDF Receipt"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>

                        {b.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(b._id, 'approved')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] flex items-center gap-1"
                              title="Approve"
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(b._id, 'rejected')}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-[10px] flex items-center gap-1"
                              title="Reject"
                            >
                              <X className="w-3 h-3" /> Reject
                            </button>
                          </>
                        )}
                        {b.status === 'approved' && (
                          <button
                            onClick={() => handleUpdateStatus(b._id, 'checked_in')}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[10px] flex items-center gap-1"
                          >
                            <LogIn className="w-3 h-3" /> Check In
                          </button>
                        )}
                        {b.status === 'checked_in' && (
                          <button
                            onClick={() => handleUpdateStatus(b._id, 'completed')}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-[10px]"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Proof Viewer Modal */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-card p-6 rounded-3xl max-w-lg w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedProof(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <FileImage className="w-5 h-5 text-blue-600" /> GCash Proof of Payment
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Booking: <strong className="font-mono text-emerald-800">{selectedProof.booking_code}</strong> • Ref: <strong className="text-slate-800">{selectedProof.payment?.reference_number || 'N/A'}</strong>
              </p>
            </div>

            {/* Image Preview Container */}
            <div className="rounded-2xl border border-slate-200 bg-slate-950/90 overflow-hidden max-h-[60vh] flex items-center justify-center p-2 min-h-[160px]">
              {proofImgError ? (
                <div className="py-8 text-center text-slate-400 space-y-2">
                  <ShieldAlert className="w-8 h-8 mx-auto text-amber-500/90 mb-1" />
                  <p className="font-semibold text-xs text-slate-200">Proof Screenshot Unavailable</p>
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto">This image file has either expired (purged after 72 hours) or is unavailable.</p>
                </div>
              ) : (
                <img
                  src={selectedProof.payment?.proof_of_payment_url}
                  alt="GCash Proof Screenshot"
                  onError={() => setProofImgError(true)}
                  className="max-h-[55vh] w-auto object-contain rounded-xl"
                />
              )}
            </div>

            {/* Retention Notice */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2 font-medium">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Uploaded screenshot will be automatically purged after 2–3 days to conserve storage space.</span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              {selectedProof.status === 'pending' && (
                <button
                  onClick={() => {
                    handleUpdateStatus(selectedProof._id, 'approved');
                    setSelectedProof(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Verify & Approve Booking
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Booking Modal */}
      <ManualBookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleManualSuccess}
      />
    </div>
  );
}
