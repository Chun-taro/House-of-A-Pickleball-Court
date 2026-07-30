import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  CheckCircle2,
  Clock,
  X,
  Download,
  FileText,
  CheckCheck,
  Calendar,
  CreditCard,
  AlertTriangle,
  UserCheck,
  Info,
  Award,
  Sparkles,
} from 'lucide-react';
import PdfReceiptModal from './PdfReceiptModal';

export default function NotificationDropdown() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [receiptBooking, setReceiptBooking] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const dropdownRef = useRef(null);

  const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';

  const fetchNotifications = () => {
    axios
      .get('/api/notifications')
      .then((res) => {
        if (res.data.success) {
          setNotifications(res.data.notifications || []);
          setUnreadCount(res.data.unread_count || 0);
        }
      })
      .catch((err) => console.error('Notifications fetch error:', err));
  };

  useEffect(() => {
    fetchNotifications();

    // Poll every 25 seconds for real-time updates
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    axios
      .put('/api/notifications/read-all/read')
      .then(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
      })
      .catch((err) => console.error(err));
  };

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) {
      axios
        .put(`/api/notifications/${notif._id}/read`)
        .then(() => {
          setNotifications((prev) => prev.map((n) => (n._id === notif._id ? { ...n, is_read: true } : n)));
          setUnreadCount((count) => Math.max(0, count - 1));
        })
        .catch((err) => console.error(err));
    }

    if (isAdminOrStaff) {
      setIsOpen(false);
      if (['proof_submitted', 'payment_verified', 'payment_rejected'].includes(notif.type)) {
        navigate('/admin/payments');
      } else if (['facility_alert', 'holiday_alert'].includes(notif.type)) {
        navigate('/admin/schedules');
      } else {
        navigate('/admin/bookings');
      }
    } else if (notif.booking_id) {
      setReceiptBooking(notif.booking_id);
    }
  };

  const renderIcon = (type) => {
    switch (type) {
      case 'proof_submitted':
        return <CreditCard className="w-4 h-4 text-blue-500 shrink-0" />;
      case 'payment_verified':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'payment_rejected':
        return <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'new_booking':
        return <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'booking_approved':
        return <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'booking_checked_in':
        return <UserCheck className="w-4 h-4 text-blue-500 shrink-0" />;
      case 'booking_completed':
        return <Award className="w-4 h-4 text-purple-500 shrink-0" />;
      case 'booking_cancelled':
      case 'booking_rejected':
        return <X className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'user_account_updated':
        return <FileText className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'facility_alert':
      case 'holiday_alert':
        return <Clock className="w-4 h-4 text-indigo-500 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.is_read;
    if (activeTab === 'bookings')
      return [
        'new_booking',
        'booking_approved',
        'booking_cancelled',
        'booking_checked_in',
        'booking_completed',
        'booking_rejected',
      ].includes(n.type);
    if (activeTab === 'payments')
      return ['proof_submitted', 'payment_verified', 'payment_rejected'].includes(n.type);
    if (activeTab === 'system')
      return ['user_account_updated', 'facility_alert', 'holiday_alert', 'general'].includes(n.type);
    return true;
  });

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors cursor-pointer"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-rose-600 text-white font-extrabold text-[10px] min-w-[18px] text-center shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="fixed sm:absolute top-16 sm:top-full right-3 sm:right-0 left-3 sm:left-auto mt-2 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 overflow-hidden text-slate-900 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-600" />
              <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                {isAdminOrStaff ? 'System Alerts & Activity' : 'Notifications'}
              </h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 px-3 py-2 bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold overflow-x-auto scrollbar-none">
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: `Unread (${unreadCount})` },
              { id: 'bookings', label: 'Bookings' },
              { id: 'payments', label: 'Payments' },
              { id: 'system', label: 'System' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white font-extrabold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="p-6 text-center text-slate-400 space-y-1">
                <Bell className="w-6 h-6 mx-auto text-slate-300 mb-1" />
                <p className="text-xs font-semibold">No notifications in this tab</p>
                <p className="text-[10px]">
                  {isAdminOrStaff
                    ? 'Customer reservations, payments, and system updates will appear here.'
                    : "You'll get notified here when your booking, payment, or schedule status updates."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const token = localStorage.getItem('sc_token') || localStorage.getItem('token') || '';
                const bookingCode = notif.booking_id?.booking_code;
                const bookingId = notif.booking_id?._id || notif.booking_id;

                return (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 transition-colors cursor-pointer hover:bg-slate-50 relative ${
                      !notif.is_read ? 'bg-emerald-50/40' : ''
                    }`}
                  >
                    {!notif.is_read && (
                      <span className="absolute top-4 left-2 w-2 h-2 rounded-full bg-emerald-600"></span>
                    )}

                    <div className="pl-2 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5 leading-snug">
                          {renderIcon(notif.type)}
                          {notif.title}
                        </span>
                        <span className="text-[9px] font-medium text-slate-400 shrink-0">
                          {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-snug">{notif.message}</p>

                      {/* Quick Action Buttons */}
                      {isAdminOrStaff ? (
                        <div className="pt-1.5 flex items-center gap-2">
                          {['proof_submitted', 'payment_verified', 'payment_rejected'].includes(notif.type) ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                                navigate('/admin/payments');
                              }}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10px] rounded-lg inline-flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                            >
                              <CreditCard className="w-3 h-3" /> Review Payments
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                                navigate('/admin/bookings');
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] rounded-lg inline-flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                            >
                              <Calendar className="w-3 h-3" /> Manage Bookings
                            </button>
                          )}
                        </div>
                      ) : (
                        bookingId &&
                        notif.receipt_available && (
                          <div className="pt-1.5 flex items-center gap-2">
                            <a
                              href={`/api/bookings/${bookingId}/receipt?token=${token}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] rounded-lg inline-flex items-center gap-1 shadow-xs transition-colors"
                            >
                              <Download className="w-3 h-3" /> Download PDF Receipt ({bookingCode || 'Ready'})
                            </a>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Pdf Receipt Preview Modal */}
      {receiptBooking && (
        <PdfReceiptModal
          booking={receiptBooking}
          isOpen={!!receiptBooking}
          onClose={() => setReceiptBooking(null)}
        />
      )}
    </div>
  );
}
