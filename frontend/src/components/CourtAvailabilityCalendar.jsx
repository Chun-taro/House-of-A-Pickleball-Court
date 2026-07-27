import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar as CalendarIcon, Clock, ArrowRight, ShieldCheck } from 'lucide-react';

export default function CourtAvailabilityCalendar() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPublicEvents = () => {
    setLoading(true);
    axios.get('/api/bookings/public-calendar-events')
      .then((res) => {
        if (res.data.success) {
          const formattedEvents = res.data.events.map((e) => ({
            id: String(e.id),
            title: 'Reserved',
            start: e.start,
            end: e.end,
            backgroundColor: '#e11d48', // rose-600 for reserved slots
            borderColor: '#be123c',
            textColor: '#ffffff',
          }));
          setEvents(formattedEvents);
        }
      })
      .catch((err) => {
        console.error('Failed to load public schedule:', err);
        setError('Could not load court schedule.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPublicEvents();
  }, []);

  const handleDateClick = (arg) => {
    const selectedDate = arg.dateStr.split('T')[0];
    navigate(`/booking/wizard?date=${selectedDate}`);
  };

  return (
    <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Clock className="w-3.5 h-3.5" /> Live Schedule
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-emerald-600" />
            Court Availability Calendar
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Check real-time court availability (5:00 AM - 11:00 PM). Click on any date or available time slot to start your booking.
          </p>
        </div>

        <button
          onClick={() => navigate('/booking/wizard')}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer"
        >
          Book Court Now <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Legend & Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-600"></span> Reserved / Booked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600"></span> Available Slots
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-100/80 text-emerald-900 font-extrabold text-[11px] border border-emerald-300">
            5am-5pm: ₱150/hr • 5pm-11pm: ₱200/hr
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Real-time Double-Booking Protection
        </div>
      </div>

      {/* FullCalendar Widget */}
      <div className="calendar-container">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-slate-500 font-semibold">Fetching court availability...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-600 font-semibold">{error}</div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={typeof window !== 'undefined' && window.innerWidth < 640 ? 'timeGridDay' : 'timeGridWeek'}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'timeGridWeek,timeGridDay,dayGridMonth',
            }}
            buttonText={{
              today: 'Today',
              month: 'Month',
              week: 'Week',
              day: 'Day',
            }}
            dayHeaderFormat={{ weekday: 'short', month: 'numeric', day: 'numeric', omitCommas: true }}
            events={events}
            slotMinTime="05:00:00"
            slotMaxTime="23:00:00"
            slotDuration="01:00:00"
            allDaySlot={false}
            height="auto"
            contentHeight="auto"
            dateClick={handleDateClick}
            eventClick={(info) => {
              const eventDate = info.event.startStr.split('T')[0];
              navigate(`/booking/wizard?date=${eventDate}`);
            }}
          />
        )}
      </div>
    </div>
  );
}
