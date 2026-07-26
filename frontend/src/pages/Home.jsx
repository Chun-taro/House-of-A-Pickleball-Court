import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Trophy, Calendar, Sparkles, Clock, MapPin, CheckCircle2, Heart, ArrowRight, Star } from 'lucide-react';
import CourtAvailabilityCalendar from '../components/CourtAvailabilityCalendar';

import logoImg from '../images/Logo.jpg';
import courtImg from '../images/pickle ball court.jpg';
import backgroundImg from '../images/background.jpg';

export default function Home() {
  const [facility, setFacility] = useState(null);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/facilities')
      .then((res) => {
        if (res.data.success && res.data.facilities.length > 0) {
          const fac = res.data.facilities[0];
          setFacility(fac);
          return axios.get(`/api/facilities/${fac._id}/courts`);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-12 py-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl p-8 sm:p-14 text-center text-white shadow-2xl border border-slate-800">
        {/* Background Image with Light Overlay for high visibility */}
        <div className="absolute inset-0 z-0">
          <img src={backgroundImg} alt="House of A's Venue Background" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/55 via-slate-950/35 to-slate-950/65"></div>
        </div>

        {/* Glow orbs */}
        <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none z-0"></div>
        <div className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] bg-teal-500/15 rounded-full blur-3xl pointer-events-none z-0"></div>

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="relative inline-block mb-1">
            <div className="absolute -inset-2 bg-emerald-500/30 rounded-3xl blur-md"></div>
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white p-2 border border-slate-700/80 shadow-2xl overflow-hidden mx-auto">
              <img src={logoImg} alt="House of A's Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/85 backdrop-blur-md text-emerald-300 text-xs font-extrabold uppercase tracking-wider border border-emerald-800/60 shadow-md">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-spin-slow" /> Malaybalay’s Premier Pickleball Venue
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight drop-shadow-md">
            House of A’s <span className="gradient-text-emerald">Pickleball Court</span>
          </h1>
          
          <p className="text-base sm:text-lg text-slate-100 max-w-2xl mx-auto font-semibold leading-relaxed drop-shadow-sm">
            Purok-1, Linabo, Malaybalay City, Bukidnon. Book our private single court for casual matches, family games, or competitive pickleball sessions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/booking/wizard"
              className="gradient-btn-primary w-full sm:w-auto px-8 py-4 rounded-2xl text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              <Calendar className="w-5 h-5 text-emerald-100" /> Reserve Court Slot (₱150/hr) <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Court Availability Calendar Section */}
      <CourtAvailabilityCalendar />

      {/* Facility Details Card */}
      {loading ? (
        <div className="h-80 glass-card rounded-3xl animate-pulse"></div>
      ) : facility ? (
        <section className="glass-card p-6 sm:p-10 rounded-3xl space-y-6 shadow-xl border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="h-80 rounded-2xl overflow-hidden relative border border-slate-200 shadow-md group">
              <img
                src={facility.image_url && facility.image_url !== 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&auto=format&fit=crop&q=80' ? facility.image_url : courtImg}
                alt="House of A's Court"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 right-4 bg-slate-950/90 backdrop-blur-md px-4 py-2 rounded-full text-xs font-black text-emerald-400 shadow-md border border-slate-800">
                ₱{facility.hourly_rate} / Hour
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <span className="text-xs font-black text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200">Linabo, Malaybalay City</span>
                <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mt-3 tracking-tight">{facility.name}</h2>
              </div>

              <p className="text-slate-600 text-sm leading-relaxed">{facility.description}</p>

              <div className="space-y-3 text-xs text-slate-700 pt-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span><strong>Location:</strong> {facility.location}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span><strong>Operating Hours:</strong> 5:00 AM - 11:00 PM (Daily)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <span><strong>Court Spec:</strong> Outdoor Covered Single Court (Capacity: 4 Players)</span>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  to="/booking/wizard"
                  className="gradient-btn-primary inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-extrabold text-white shadow-md transition-all cursor-pointer"
                >
                  <Calendar className="w-4 h-4" /> Check Time Slot Availability
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Feature Highlights */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card glass-card-hover p-7 rounded-3xl space-y-4 border border-slate-200">
          <div className="w-13 h-13 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900">Live Time Slots</h3>
          <p className="text-sm text-slate-600 leading-relaxed">Select your preferred time slots between 5:00 AM and 11:00 PM with real-time double-booking prevention.</p>
        </div>

        <div className="glass-card glass-card-hover p-7 rounded-3xl space-y-4 border border-slate-200">
          <div className="w-13 h-13 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 shadow-xs">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900">Family-Owned Atmosphere</h3>
          <p className="text-sm text-slate-600 leading-relaxed">Welcoming community venue designed specifically for pickleball enthusiasts in Malaybalay.</p>
        </div>

        <div className="glass-card glass-card-hover p-7 rounded-3xl space-y-4 border border-slate-200">
          <div className="w-13 h-13 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900">Instant Confirmation</h3>
          <p className="text-sm text-slate-600 leading-relaxed">Reserve cash or GCash online, get your digital booking code, and bring your paddles to play!</p>
        </div>
      </section>
    </div>
  );
}

