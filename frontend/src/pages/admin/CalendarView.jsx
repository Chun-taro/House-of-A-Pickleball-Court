import React, { useEffect, useState } from 'react';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ManualBookingModal from '../../components/ManualBookingModal';
import StatusBadge from '../../components/StatusBadge';
import { Plus, CalendarCheck, Clock, Calendar as CalendarIcon } from 'lucide-react';

export default function CalendarView() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

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
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
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
          <div className="py-12 text-center text-slate-500">Loading calendar events...</div>
        ) : (
          <div className="calendar-container">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              events={events}
              slotMinTime="05:00:00"
              slotMaxTime="23:00:00"
              allDaySlot={false}
              height="auto"
            />
          </div>
        )}
      </div>

      {/* Manual Booking Modal */}
      <ManualBookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleManualSuccess}
      />
    </div>
  );
}
