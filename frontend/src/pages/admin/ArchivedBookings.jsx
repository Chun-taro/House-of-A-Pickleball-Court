import React, { useEffect, useState } from 'react';
import axios from 'axios';
import StatusBadge from '../../components/StatusBadge';
import PdfReceiptModal from '../../components/PdfReceiptModal';
import { useConfirm } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';
import {
  Archive,
  Search,
  RotateCcw,
  Trash2,
  Eye,
  Calendar,
  Clock,
  User,
  CreditCard,
  Building2,
  FileImage,
  RefreshCw,
} from 'lucide-react';

export default function ArchivedBookings() {
  const confirm = useConfirm();
  const toast = useToast();
  const [archivedBookings, setArchivedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [receiptBooking, setReceiptBooking] = useState(null);

  const fetchArchivedBookings = () => {
    setLoading(true);
    axios
      .get('/api/bookings/admin/archived')
      .then((res) => {
        if (res.data.success) {
          setArchivedBookings(res.data.bookings || []);
        }
      })
      .catch((err) => {
        console.error('Error fetching archived bookings:', err);
        toast.error('Failed to load archived bookings.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchArchivedBookings();

    const handleAutoRefresh = () => fetchArchivedBookings();
    window.addEventListener('focus', handleAutoRefresh);
    window.addEventListener('app:data-updated', handleAutoRefresh);

    return () => {
      window.removeEventListener('focus', handleAutoRefresh);
      window.removeEventListener('app:data-updated', handleAutoRefresh);
    };
  }, []);

  const handleRestore = async (bookingId, bookingCode) => {
    const isConfirmed = await confirm({
      title: 'Restore Booking Reservation?',
      message: `Are you sure you want to restore booking "${bookingCode}" back to active bookings list?`,
      confirmText: 'Yes, Restore Booking',
      cancelText: 'Cancel',
      type: 'info',
    });

    if (!isConfirmed) return;

    try {
      const res = await axios.patch(`/api/bookings/admin/${bookingId}/restore`);
      if (res.data.success) {
        toast.success(res.data.message || `Booking ${bookingCode} restored successfully.`);
        fetchArchivedBookings();
        window.dispatchEvent(new Event('app:data-updated'));
      } else {
        toast.error(res.data.message || 'Failed to restore booking.');
      }
    } catch (err) {
      console.error('Restore error:', err);
      toast.error(err.response?.data?.message || 'Error restoring booking record.');
    }
  };

  const handlePermanentDelete = async (bookingId, bookingCode) => {
    const isConfirmed = await confirm({
      title: 'PERMANENTLY Delete Record?',
      message: `WARNING: Are you sure you want to PERMANENTLY remove reservation "${bookingCode}" and all related payments from the database? This action CANNOT be undone.`,
      confirmText: 'Permanently Wipe Record',
      cancelText: 'Cancel',
      type: 'danger',
    });

    if (!isConfirmed) return;

    try {
      const res = await axios.delete(`/api/bookings/admin/${bookingId}/permanent`);
      if (res.data.success) {
        toast.success(res.data.message || `Booking ${bookingCode} permanently purged.`);
        fetchArchivedBookings();
        window.dispatchEvent(new Event('app:data-updated'));
      } else {
        toast.error(res.data.message || 'Failed to permanently delete booking.');
      }
    } catch (err) {
      console.error('Permanent delete error:', err);
      toast.error(err.response?.data?.message || 'Error purging booking from database.');
    }
  };

  const filteredBookings = archivedBookings.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const code = (b.booking_code || '').toLowerCase();
    const name = (b.user_id?.name || '').toLowerCase();
    const email = (b.user_id?.email || '').toLowerCase();
    const court = (b.court_id?.name || '').toLowerCase();
    const facility = (b.facility_id?.name || '').toLowerCase();

    return code.includes(q) || name.includes(q) || email.includes(q) || court.includes(q) || facility.includes(q);
  });

  return (
    <div className="p-4 sm:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20">
              <Archive className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Archived Reservations</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Safely stored deleted bookings. You can restore reservations back to active status or purge them permanently.
          </p>
        </div>

        <button
          onClick={fetchArchivedBookings}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Archive
        </button>
      </div>

      {/* Search and Stats Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by code, customer name, email, or court..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            Total Archived: <span className="text-slate-900 font-extrabold">{archivedBookings.length}</span>
          </span>
        </div>
      </div>

      {/* Bookings List Content */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading archived bookings...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <Archive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Archived Bookings Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery ? 'No records match your search filter.' : 'When bookings are deleted, they will safely appear here.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Booking Code</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Facility & Court</th>
                  <th className="py-3.5 px-4">Schedule Date/Time</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Archived Info</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-extrabold text-emerald-700">
                      {b.booking_code}
                      <div className="mt-1">
                        <StatusBadge status={b.status} />
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{b.user_id?.name || 'Walk-in Guest'}</div>
                      <div className="text-[11px] text-slate-500">{b.user_id?.email}</div>
                      {b.user_id?.phone && <div className="text-[11px] text-slate-400">{b.user_id.phone}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{b.facility_id?.name || 'Facility'}</div>
                      <div className="text-[11px] text-slate-500">{b.court_id?.name || 'Court'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> {b.booking_date}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {b.start_time} - {b.end_time}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900">₱{b.total_amount?.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">{b.payment_type || 'full'} payment</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60 inline-block">
                        Archived: {b.archived_at ? new Date(b.archived_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Receipt / Proof */}
                        <button
                          onClick={() => setReceiptBooking(b)}
                          title="View PDF Receipt"
                          className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Restore Booking */}
                        <button
                          onClick={() => handleRestore(b._id, b.booking_code)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors cursor-pointer border border-emerald-200/60"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Restore
                        </button>

                        {/* Permanent Delete */}
                        <button
                          onClick={() => handlePermanentDelete(b._id, b.booking_code)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors cursor-pointer border border-rose-200/60"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Purge
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="lg:hidden divide-y divide-slate-100">
            {filteredBookings.map((b) => (
              <div key={b._id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono font-extrabold text-sm text-emerald-700 block">{b.booking_code}</span>
                    <span className="text-xs text-slate-500 font-medium">{b.user_id?.name || 'Walk-in Guest'}</span>
                  </div>
                  <StatusBadge status={b.status} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Facility & Court</span>
                    <span className="font-bold text-slate-800">{b.facility_id?.name}</span>
                    <span className="text-slate-500 block">{b.court_id?.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Schedule</span>
                    <span className="font-semibold text-slate-800">{b.booking_date}</span>
                    <span className="text-slate-500 block">{b.start_time} - {b.end_time}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Amount</span>
                      <span className="font-extrabold text-slate-900">₱{b.total_amount?.toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                        Archived {b.archived_at ? new Date(b.archived_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setReceiptBooking(b)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Receipt
                  </button>
                  <button
                    onClick={() => handleRestore(b._id, b.booking_code)}
                    className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-emerald-200/60 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Restore
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(b._id, b.booking_code)}
                    className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1 border border-rose-200/60 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Purge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PDF Receipt Modal */}
      {receiptBooking && (
        <PdfReceiptModal
          bookingId={receiptBooking._id}
          bookingCode={receiptBooking.booking_code}
          onClose={() => setReceiptBooking(null)}
        />
      )}
    </div>
  );
}
