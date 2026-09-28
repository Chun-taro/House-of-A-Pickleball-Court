import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  Clock,
  Plus,
  Trash2,
  CalendarX,
  Calendar,
  Check,
  AlertCircle,
  Repeat,
  Building2,
  Save,
  Search,
  ArrowRight,
  ShieldCheck,
  Edit2,
  X,
  RotateCcw,
} from 'lucide-react';

const DAYS_OF_WEEK = [
  { index: 0, label: 'Sunday' },
  { index: 1, label: 'Monday' },
  { index: 2, label: 'Tuesday' },
  { index: 3, label: 'Wednesday' },
  { index: 4, label: 'Thursday' },
  { index: 5, label: 'Friday' },
  { index: 6, label: 'Saturday' },
];

export default function SchedulesAdmin() {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [operatingHours, setOperatingHours] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  // Operating Hours form state: array of 7 day objects
  const [hoursState, setHoursState] = useState(
    DAYS_OF_WEEK.map((d) => ({
      day_of_week: d.index,
      open_time: '05:00',
      close_time: '23:00',
      is_closed: false,
    }))
  );
  const [savingHours, setSavingHours] = useState(false);
  const [hoursSuccess, setHoursSuccess] = useState('');

  // Add Holiday Blackout form state
  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [holidayFacilityId, setHolidayFacilityId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [description, setDescription] = useState('');
  const [addingHoliday, setAddingHoliday] = useState(false);
  const [holidayError, setHolidayError] = useState('');
  const [holidaySuccess, setHolidaySuccess] = useState('');

  // Edit Holiday state
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [updatingHoliday, setUpdatingHoliday] = useState(false);

  // Search filter for holidays
  const [searchQuery, setSearchQuery] = useState('');

  // Delete confirm state
  const [deletingId, setDeletingId] = useState(null);

  const fetchSchedules = () => {
    setLoading(true);
    axios
      .get('/api/schedules')
      .then((res) => {
        if (res.data.success) {
          const facs = res.data.facilities || [];
          setFacilities(facs);
          setHolidays(res.data.holidays || []);
          setOperatingHours(res.data.operatingHours || []);

          if (facs.length > 0) {
            setSelectedFacilityId((prev) => prev || facs[0]._id);
          }
        }
      })
      .catch((err) => console.error('Error fetching schedules:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // When selected facility changes or operating hours load, populate hoursState
  useEffect(() => {
    if (!selectedFacilityId || operatingHours.length === 0) return;

    const facHours = operatingHours.filter(
      (h) => h.facility_id && (h.facility_id._id === selectedFacilityId || h.facility_id === selectedFacilityId)
    );

    const newHoursState = DAYS_OF_WEEK.map((day) => {
      const match = facHours.find((h) => h.day_of_week === day.index);
      if (match) {
        return {
          day_of_week: day.index,
          open_time: match.open_time || '05:00',
          close_time: match.close_time || '23:00',
          is_closed: !!match.is_closed,
        };
      }
      return {
        day_of_week: day.index,
        open_time: '05:00',
        close_time: '23:00',
        is_closed: false,
      };
    });

    setHoursState(newHoursState);
  }, [selectedFacilityId, operatingHours]);

  // Handle single day change in hoursState
  const handleDayChange = (dayIndex, field, value) => {
    setHoursState((prev) =>
      prev.map((item) => (item.day_of_week === dayIndex ? { ...item, [field]: value } : item))
    );
  };

  // Quick preset actions
  const applyPreset = (openTime, closeTime) => {
    setHoursState((prev) =>
      prev.map((item) => ({
        ...item,
        open_time: openTime,
        close_time: closeTime,
        is_closed: false,
      }))
    );
  };

  // Save Operating Hours
  const handleSaveOperatingHours = (e) => {
    e.preventDefault();
    if (!selectedFacilityId) return;

    setSavingHours(true);
    setHoursSuccess('');

    axios
      .put('/api/schedules/operating-hours', {
        facility_id: selectedFacilityId,
        hours: hoursState,
      })
      .then((res) => {
        if (res.data.success) {
          setHoursSuccess('Operating hours saved and broadcast successfully!');
          fetchSchedules();
          setTimeout(() => setHoursSuccess(''), 5000);
        }
      })
      .catch((err) => {
        console.error('Error saving operating hours:', err);
        alert(err.response?.data?.message || 'Failed to update operating hours.');
      })
      .finally(() => setSavingHours(false));
  };

  // Add Holiday Blackout
  const handleAddHoliday = (e) => {
    e.preventDefault();
    if (!holidayName.trim() || !holidayDate) {
      setHolidayError('Please enter a holiday name and date.');
      return;
    }

    if (endDate && endDate < holidayDate) {
      setHolidayError('End date cannot be earlier than start date.');
      return;
    }

    setAddingHoliday(true);
    setHolidayError('');
    setHolidaySuccess('');

    axios
      .post('/api/schedules/holidays', {
        facility_id: holidayFacilityId || null,
        name: holidayName.trim(),
        holiday_date: holidayDate,
        end_date: endDate || null,
        description: description.trim(),
        is_recurring: isRecurring,
      })
      .then((res) => {
        if (res.data.success) {
          setHolidayName('');
          setHolidayDate('');
          setEndDate('');
          setDescription('');
          setIsRecurring(false);
          setHolidayFacilityId('');
          setHolidaySuccess('Holiday blackout date added and broadcast successfully!');
          fetchSchedules();
          setTimeout(() => setHolidaySuccess(''), 5000);
        } else {
          setHolidayError(res.data.message || 'Failed to add holiday.');
        }
      })
      .catch((err) => {
        setHolidayError(err.response?.data?.message || 'Failed to add holiday blackout.');
      })
      .finally(() => setAddingHoliday(false));
  };

  // Update Holiday Blackout
  const handleUpdateHoliday = (e) => {
    e.preventDefault();
    if (!editingHoliday) return;

    if (!editingHoliday.name.trim() || !editingHoliday.holiday_date) {
      alert('Holiday name and date are required.');
      return;
    }

    if (editingHoliday.end_date && editingHoliday.end_date < editingHoliday.holiday_date) {
      alert('End date cannot be earlier than start date.');
      return;
    }

    setUpdatingHoliday(true);
    axios
      .put(`/api/schedules/holidays/${editingHoliday._id}`, {
        name: editingHoliday.name.trim(),
        holiday_date: editingHoliday.holiday_date,
        end_date: editingHoliday.end_date || null,
        description: editingHoliday.description || '',
        is_recurring: !!editingHoliday.is_recurring,
        facility_id: editingHoliday.facility_id || null,
      })
      .then((res) => {
        if (res.data.success) {
          setEditingHoliday(null);
          fetchSchedules();
        }
      })
      .catch((err) => alert(err.response?.data?.message || 'Failed to update holiday blackout.'))
      .finally(() => setUpdatingHoliday(false));
  };

  // Delete Holiday
  const handleDeleteHoliday = (id) => {
    axios
      .delete(`/api/schedules/holidays/${id}`)
      .then((res) => {
        if (res.data.success) {
          setDeletingId(null);
          fetchSchedules();
        }
      })
      .catch((err) => console.error('Delete holiday error:', err));
  };

  // Filter holidays
  const filteredHolidays = useMemo(() => {
    return holidays.filter((h) => {
      const q = searchQuery.toLowerCase();
      const matchName = h.name.toLowerCase().includes(q);
      const matchDate = h.holiday_date.includes(q);
      const matchDesc = h.description ? h.description.toLowerCase().includes(q) : false;
      return matchName || matchDate || matchDesc;
    });
  }, [holidays, searchQuery]);

  // Summary statistics
  const daysOpenCount = hoursState.filter((h) => !h.is_closed).length;
  const currentFacility = facilities.find((f) => f._id === selectedFacilityId);

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-200">
            <Clock className="w-3.5 h-3.5 text-emerald-600" /> Facility Scheduling Controls
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Schedules & Holiday Blackouts
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Configure weekly operating hours, closed days, and holiday blackout periods to safeguard court booking availability.
          </p>
        </div>

        <a
          href="/admin/calendar"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all hover:scale-105"
        >
          <Calendar className="w-4 h-4 text-emerald-400" />
          View Court Calendar <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Summary Stats Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl flex items-center gap-3.5 border border-slate-200 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Weekly Schedule</p>
            <p className="text-base font-extrabold text-slate-900">
              {daysOpenCount} of 7 Days Open
            </p>
            <p className="text-[11px] text-emerald-700 font-bold">
              {daysOpenCount === 7 ? 'Full 7-day operations' : `${7 - daysOpenCount} day(s) closed`}
            </p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl flex items-center gap-3.5 border border-slate-200 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-rose-100/80 text-rose-700 flex items-center justify-center shrink-0">
            <CalendarX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Holiday Blackouts</p>
            <p className="text-base font-extrabold text-slate-900">
              {holidays.length} Active Blackout{holidays.length === 1 ? '' : 's'}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              {holidays.filter((h) => h.is_recurring).length} recurring annually
            </p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl flex items-center gap-3.5 border border-slate-200 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Protection Status</p>
            <p className="text-base font-extrabold text-slate-900">Live Double-Check</p>
            <p className="text-[11px] text-blue-700 font-bold">Enforced on all bookings</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Operating Hours & Holiday Blackouts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Weekly Operating Hours (7 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass-card p-5 sm:p-7 rounded-3xl space-y-5 border border-slate-200 shadow-sm bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Weekly Operating Hours</h2>
                  <p className="text-xs text-slate-500">Set open & close hours or mark full-day closures</p>
                </div>
              </div>

              {facilities.length > 1 && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <select
                    value={selectedFacilityId}
                    onChange={(e) => setSelectedFacilityId(e.target.value)}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                  >
                    {facilities.map((fac) => (
                      <option key={fac._id} value={fac._id}>
                        {fac.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {currentFacility && (
              <div className="flex items-center justify-between bg-slate-50 px-3.5 py-2 rounded-xl text-xs border border-slate-200">
                <span className="font-semibold text-slate-600">Managing Venue:</span>
                <span className="font-extrabold text-slate-900">{currentFacility.name}</span>
              </div>
            )}

            {hoursSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{hoursSuccess}</span>
              </div>
            )}

            {/* Quick Action Preset Bar */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Quick Presets:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('05:00', '23:00')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  05:00 AM - 11:00 PM (Default)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('06:00', '22:00')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  06:00 AM - 10:00 PM
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('07:00', '21:00')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  07:00 AM - 09:00 PM
                </button>
              </div>
            </div>

            {/* Day of Week Editor Rows */}
            <form onSubmit={handleSaveOperatingHours} className="space-y-3">
              <div className="space-y-2">
                {DAYS_OF_WEEK.map((day) => {
                  const stateItem = hoursState.find((h) => h.day_of_week === day.index) || {
                    open_time: '05:00',
                    close_time: '23:00',
                    is_closed: false,
                  };

                  return (
                    <div
                      key={day.index}
                      className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        stateItem.is_closed
                          ? 'bg-rose-50/50 border-rose-200 text-rose-900'
                          : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between sm:justify-start gap-3 min-w-[130px]">
                        <span className="font-extrabold text-sm">{day.label}</span>
                        {stateItem.is_closed ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-rose-200/80 text-rose-800">
                            Closed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                            Open
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600 select-none">
                          <input
                            type="checkbox"
                            checked={stateItem.is_closed}
                            onChange={(e) => handleDayChange(day.index, 'is_closed', e.target.checked)}
                            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                          />
                          <span>Closed All Day</span>
                        </label>

                        {!stateItem.is_closed ? (
                          <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
                            <input
                              type="time"
                              value={stateItem.open_time}
                              onChange={(e) => handleDayChange(day.index, 'open_time', e.target.value)}
                              className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-500"
                            />
                            <span className="text-slate-400">to</span>
                            <input
                              type="time"
                              value={stateItem.close_time}
                              onChange={(e) => handleDayChange(day.index, 'close_time', e.target.value)}
                              className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-rose-600 italic">No bookings accepted</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="submit"
                disabled={savingHours || loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                {savingHours ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Weekly Operating Hours
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Holiday & Emergency Blackout Dates (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass-card p-5 sm:p-7 rounded-3xl space-y-5 border border-slate-200 shadow-sm bg-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                  <CalendarX className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Holiday Blackout Dates</h2>
                  <p className="text-xs text-slate-500">Block reservations for holidays, events, or maintenance</p>
                </div>
              </div>
            </div>

            {holidayError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">{holidayError}</span>
              </div>
            )}

            {holidaySuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{holidaySuccess}</span>
              </div>
            )}

            {/* Add Blackout Date Form */}
            <form
              onSubmit={handleAddHoliday}
              className="space-y-3.5 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200"
            >
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-rose-600" /> Schedule New Blackout
              </h3>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Blackout Title / Holiday Name *</label>
                <input
                  type="text"
                  required
                  value={holidayName}
                  onChange={(e) => setHolidayName(e.target.value)}
                  placeholder="e.g. Christmas Day, New Year's Day, Court Resurfacing"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={holidayDate}
                    onChange={(e) => setHolidayDate(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">End Date (Optional Range)</label>
                  <input
                    type="date"
                    min={holidayDate || undefined}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="Same day if blank"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Facility Scope</label>
                  <select
                    value={holidayFacilityId}
                    onChange={(e) => setHolidayFacilityId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-rose-500 font-medium"
                  >
                    <option value="">All Facilities & Courts (Universal)</option>
                    {facilities.map((fac) => (
                      <option key={fac._id} value={fac._id}>
                        {fac.name} Only
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Description / Notes</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Scheduled annual venue maintenance"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                  />
                  <span className="flex items-center gap-1">
                    <Repeat className="w-3.5 h-3.5 text-rose-600" />
                    <strong>Recurring Annually:</strong> Repeat this closure every year on the same date
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={addingHoliday}
                className="w-full py-2.5 font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                {addingHoliday ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Add Holiday Blackout
              </button>
            </form>

            {/* Search Filter for Blackouts */}
            <div className="flex items-center justify-between gap-2 pt-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search blackout dates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-rose-500"
                />
              </div>
              <span className="text-xs text-slate-500 font-bold whitespace-nowrap">
                {filteredHolidays.length} listed
              </span>
            </div>

            {/* Blackout Dates List */}
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {filteredHolidays.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 space-y-2">
                  <CalendarX className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="text-xs font-bold">No holiday blackout dates scheduled</p>
                  <p className="text-[11px] text-slate-400">
                    Use the form above to block court dates for public holidays or maintenance closures.
                  </p>
                </div>
              ) : (
                filteredHolidays.map((h) => {
                  const isMultiDay = h.end_date && h.end_date !== h.holiday_date;
                  return (
                    <div
                      key={h._id}
                      className="p-3.5 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 transition-all shadow-2xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-extrabold text-slate-900 text-sm">{h.name}</span>
                            {h.is_recurring && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-200">
                                <Repeat className="w-2.5 h-2.5" /> Annual
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                              {h.facility_id ? h.facility_id.name : 'All Facilities'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-xs font-mono text-slate-600 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-rose-500" />
                            <span>
                              {h.holiday_date}
                              {isMultiDay ? ` to ${h.end_date}` : ''}
                            </span>
                          </div>

                          {h.description && (
                            <p className="text-[11px] text-slate-500 mt-1 italic">{h.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setEditingHoliday(h)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="Edit Blackout"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {deletingId === h._id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDeleteHoliday(h._id)}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingId(null)}
                                className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeletingId(h._id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors cursor-pointer"
                              title="Delete Blackout"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Holiday Modal */}
      {editingHoliday && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl relative">
            <button
              onClick={() => setEditingHoliday(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-rose-600" /> Edit Holiday Blackout
              </h3>
              <p className="text-xs text-slate-500">Update blackout details and dates</p>
            </div>

            <form onSubmit={handleUpdateHoliday} className="space-y-3.5 text-xs pt-2">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Holiday / Blackout Name *</label>
                <input
                  type="text"
                  required
                  value={editingHoliday.name}
                  onChange={(e) => setEditingHoliday({ ...editingHoliday, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={editingHoliday.holiday_date}
                    onChange={(e) =>
                      setEditingHoliday({ ...editingHoliday, holiday_date: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">End Date</label>
                  <input
                    type="date"
                    min={editingHoliday.holiday_date}
                    value={editingHoliday.end_date || ''}
                    onChange={(e) =>
                      setEditingHoliday({ ...editingHoliday, end_date: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Description / Reason</label>
                <input
                  type="text"
                  value={editingHoliday.description || ''}
                  onChange={(e) =>
                    setEditingHoliday({ ...editingHoliday, description: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!editingHoliday.is_recurring}
                    onChange={(e) =>
                      setEditingHoliday({ ...editingHoliday, is_recurring: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                  />
                  <span>Recurring Annually (Repeat every year on this month & day)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingHoliday(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingHoliday}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {updatingHoliday ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
