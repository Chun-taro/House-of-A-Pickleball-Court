import React, { useEffect, useState } from 'react';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ManualBookingModal from '../../components/ManualBookingModal';
import StatusBadge from '../../components/StatusBadge';
import { Plus, CalendarCheck, Clock, User, Phone, Mail, MapPin, X, FileText, CreditCard } from 'lucide-react';

export default function CalendarView() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchEvents = () => {
    axios.get('/api/bookings/admin/calendar-events')
      .then((res) => {
        if (res.data.success) {
          const colorMap = {
            approved: '#10b981',
            pending: '#f59e0b',
            checked_in: '#6366f1',
            completed: '#64748b',
          };

          const mapped = res.data.events.map((e) => ({
            id: e.id,
            title: e.title,
            start: e.start,
            end: e.end,
            backgroundColor: colorMap[e.status] || '#10b981',
            borderColor: colorMap[e.status] || '#10b981',
            textColor: '#ffffff',
            extendedProps: {
              status: e.status,
              booking_code: e.booking_code,
              customer_name: e.customer_name,
              customer_email: e.customer_email,
              customer_phone: e.customer_phone,
              court_name: e.court_name,
              facility_name: e.facility_name,
              booking_date: e.booking_date,
              start_time: e.start_time,
              end_time: e.end_time,
              payment_type: e.payment_type,
              total_amount: e.total_amount,
              paid_amount: e.paid_amount,
              notes: e.notes,
            },
          }));

          setEvents(mapped);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleManualSuccess = (msg) => {
    setAlertMessage(msg || 'Schedule occupied successfully!');
    fetchEvents();
    setTimeout(() => setAlertMessage(''), 5000);
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Court Schedule Calendar</h1>
          <p className="text-sm text-slate-600">Visual timetable of booked slots and manual reservations (5:00 AM - 11:00 PM)</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Manually Occupy Time Slot
        </button>
      </div>

      {alertMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-emerald-600" />
          <span>{alertMessage}</span>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-600 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Approved / Manual Block</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Pending Approval</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-indigo-500"></span> Checked In</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-500"></span> Completed</span>
      </div>

      <div className="glass-card p-6 rounded-3xl space-y-4">
        {loading ? (
          <div className="py-12 text-center text-slate-500 font-semibold">Loading calendar events...</div>
        ) : (
          <div className="calendar-container">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={typeof window !== 'undefined' && window.innerWidth < 640 ? 'timeGridDay' : 'timeGridWeek'}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              buttonText={{
                today: 'Today',
                month: 'Month',
                week: 'Week',
                day: 'Day',
              }}
              dayHeaderFormat={{ weekday: 'short', month: 'numeric', day: 'numeric', omitCommas: true }}
              displayEventTime={false}
              events={events}
              slotMinTime="05:00:00"
              slotMaxTime="23:00:00"
              slotDuration="01:00:00"
              allDaySlot={false}
              height="auto"
              contentHeight="auto"
              eventClick={(info) => {
                setSelectedEvent(info.event.extendedProps);
              }}
            />
          </div>
        )}
      </div>

      {/* Selected Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-card p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl relative bg-white border border-slate-200">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {selectedEvent.booking_code || 'RESERVATION'}
                </span>
                <StatusBadge status={selectedEvent.status} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 pt-1">
                <User className="w-5 h-5 text-emerald-600" />
                {selectedEvent.customer_name}
              </h3>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>Date & Time:</strong> {selectedEvent.booking_date} • {selectedEvent.start_time} - {selectedEvent.end_time}
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <span>
                  <strong>Court:</strong> {selectedEvent.court_name} {selectedEvent.facility_name ? `(${selectedEvent.facility_name})` : ''}
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Phone:</strong> {selectedEvent.customer_phone}
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  <strong>Email:</strong> {selectedEvent.customer_email}
                </span>
              </div>

              {selectedEvent.total_amount !== undefined && (
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Payment:</strong> ₱{selectedEvent.total_amount?.toFixed(2)} ({selectedEvent.payment_type === 'partial' ? 'Partial Deposit' : 'Full Payment'})
                  </span>
                </div>
              )}

              {selectedEvent.notes && (
                <div className="flex items-start gap-2 text-slate-700 font-medium pt-1">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Notes:</strong> {selectedEvent.notes}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                Close
              </button>
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
