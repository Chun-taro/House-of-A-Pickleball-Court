import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Clock, Plus, Trash2, CalendarX } from 'lucide-react';

export default function SchedulesAdmin() {
  const [holidays, setHolidays] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [error, setError] = useState('');

  const fetchSchedules = () => {
    axios.get('/api/schedules')
      .then((res) => {
        if (res.data.success) {
          setFacilities(res.data.facilities);
          setHolidays(res.data.holidays);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleAddHoliday = (e) => {
    e.preventDefault();
    if (!holidayName || !holidayDate) return;

    axios.post('/api/schedules/holidays', {
      name: holidayName,
      holiday_date: holidayDate,
      is_recurring: isRecurring,
    })
      .then((res) => {
        if (res.data.success) {
          setHolidayName('');
          setHolidayDate('');
          setIsRecurring(false);
          fetchSchedules();
        } else {
          setError(res.data.message);
        }
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed'));
  };

  const handleDeleteHoliday = (id) => {
    axios.delete(`/api/schedules/holidays/${id}`)
      .then((res) => {
        if (res.data.success) fetchSchedules();
      })
      .catch((err) => console.error(err));
  };

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Schedules & Holiday Blackouts</h1>
        <p className="text-xs sm:text-sm text-slate-600">Configure court operating hours and block dates for holidays</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operating Hours Box */}
        <div className="glass-card p-4 sm:p-6 rounded-3xl space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" /> Standard Operating Hours
          </h2>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2">
            <div className="flex justify-between font-bold text-slate-900 border-b pb-2">
              <span>Day of Week</span>
              <span>Open - Close</span>
            </div>
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
              <div key={day} className="flex justify-between">
                <span>{day}</span>
                <span className="font-mono text-emerald-700 font-bold">05:00 AM - 11:00 PM</span>
              </div>
            ))}
          </div>
        </div>

        {/* Holidays Box */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CalendarX className="w-5 h-5 text-rose-600" /> Holiday Blackout Dates
          </h2>

          {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

          <form onSubmit={handleAddHoliday} className="space-y-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="font-bold text-slate-700">Holiday Name</label>
              <input
                type="text"
                required
                value={holidayName}
                onChange={(e) => setHolidayName(e.target.value)}
                placeholder="e.g. Christmas Day"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 mt-1"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Holiday Date</label>
              <input
                type="date"
                required
                value={holidayDate}
                onChange={(e) => setHolidayDate(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 mt-1"
              />
            </div>

            <button type="submit" className="w-full py-2.5 font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl flex items-center justify-center gap-1">
              <Plus className="w-4 h-4" /> Add Blackout Date
            </button>
          </form>

          {/* Holiday List */}
          <div className="space-y-2">
            {holidays.map((h) => (
              <div key={h._id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">{h.name}</p>
                  <p className="text-slate-500 font-mono">{h.holiday_date}</p>
                </div>
                <button onClick={() => handleDeleteHoliday(h._id)} className="p-1.5 bg-rose-50 text-rose-700 rounded-md">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
