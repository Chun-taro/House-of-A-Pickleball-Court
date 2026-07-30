import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar as CalendarIcon, Clock, ArrowRight, ShieldCheck, User, MapPin, X, CalendarCheck } from 'lucide-react';

export default function CourtAvailabilityCalendar() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchPublicEvents = () => {
    setLoading(true);
    axios.get('/api/bookings/public-calendar-events')
      .then((res) => {
        if (res.data.success) {
          const formattedEvents = res.data.events.map((e) => ({
            id: String(e.id),
            title: `Reserved: ${e.customer_name}`,
            start: e.start,
            end: e.end,
            backgroundColor: '#e11d48', // rose-600 for reserved slots
            borderColor: '#be123c',
            textColor: '#ffffff',
            extendedProps: {
              customer_name: e.customer_name,
              court_name: e.court_name,
              booking_date: e.booking_date,
              start_time: e.start_time,
              end_time: e.end_time,
              status: e.status,
            },
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
            Check real-time court availability (5:00 AM - 11:00 PM). Click on any booked slot to view who reserved it or click an available slot to book.
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
            displayEventTime={false}
            events={events}
            slotMinTime="05:00:00"
            slotMaxTime="23:00:00"
            slotDuration="01:00:00"
            slotLabelContent={(arg) => {
              const startHour = arg.date.getHours();
              const endHour = (startHour + 1) % 24;
              const formatHour = (h) => {
                const ampm = h >= 12 ? 'pm' : 'am';
                const h12 = h % 12 || 12;
                return `${h12}${ampm}`;
              };
              return `${formatHour(startHour)}-${formatHour(endHour)}`;
            }}
            allDaySlot={false}
            height="auto"
            contentHeight="auto"
            dateClick={handleDateClick}
            eventClick={(info) => {
              setSelectedEvent(info.event.extendedProps);
            }}
          />
        )}
      </div>

      {/* Public Event Reservation Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-card p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl relative bg-white border border-slate-200">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-extrabold border border-rose-200">
                <CalendarCheck className="w-3.5 h-3.5" /> Slot Reserved
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
                  <strong>Court:</strong> {selectedEvent.court_name}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  const targetDate = selectedEvent.booking_date;
                  setSelectedEvent(null);
                  navigate(`/booking/wizard?date=${targetDate}`);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                Book Other Slots on {selectedEvent.booking_date} <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
