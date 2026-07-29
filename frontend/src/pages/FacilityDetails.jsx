import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Clock, Trophy, Calendar, Users, Car, Bath, ShoppingBag, KeyRound, Tag } from 'lucide-react';
import courtImg from '../images/bb02c1f8c38d725d863a91c3f74a3cc9.jpeg';

export default function FacilityDetails() {
  const { id } = useParams();
  const [facility, setFacility] = useState(null);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/facilities/${id}`)
      .then((res) => {
        if (res.data.success) {
          setFacility(res.data.facility);
          setCourts(res.data.courts);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="py-12 text-center text-slate-500">Loading facility details...</div>;
  }

  if (!facility) {
    return <div className="py-12 text-center text-rose-600 font-semibold">Facility not found.</div>;
  }

  return (
    <div className="space-y-8 py-6">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-card">
        <div className="h-72 w-full relative">
          <img
            src={facility.image_url && facility.image_url !== 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&auto=format&fit=crop&q=80' ? facility.image_url : courtImg}
            alt={facility.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
        </div>

        <div className="p-8 relative -mt-24 space-y-4 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white">{facility.name}</h1>
              <p className="text-sm text-emerald-200 flex items-center gap-1.5 mt-1 font-medium">
                <MapPin className="w-4 h-4 text-emerald-300" /> {facility.location}
              </p>
            </div>

            <Link
              to={`/booking/wizard?facility_id=${facility._id}`}
              className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold shadow-lg flex items-center gap-2"
            >
              <Calendar className="w-5 h-5 text-slate-950" /> Book Court Slot
            </Link>
          </div>

          <p className="text-slate-200 max-w-3xl leading-relaxed text-sm">{facility.description}</p>

          <div className="flex flex-wrap gap-4 pt-2 text-sm text-slate-200">
            <div className="flex items-center gap-2 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-700">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Operating Hours: 5:00 AM - 11:00 PM</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-700">
              <Tag className="w-4 h-4 text-emerald-400" />
              <span>Court Rates: 5am-5pm <strong>₱150/hr</strong> | 5pm-11pm <strong>₱200/hr</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Amenities Grid */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-emerald-600" /> Venue Amenities
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Road Parking</h3>
              <p className="text-[11px] text-slate-500">Accessible parking</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <Bath className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Restroom</h3>
              <p className="text-[11px] text-slate-500">Clean & private</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Paddle & Balls</h3>
              <p className="text-[11px] text-slate-500">For rent or sale</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Keychains</h3>
              <p className="text-[11px] text-slate-500">For sale at desk</p>
            </div>
          </div>
        </div>
      </div>

      {/* OPEN COURT FREE PLAY PROMO BANNER */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-4 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white border-2 border-emerald-500/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              Morning Open Session Promo
            </span>
            <h3 className="text-2xl font-black text-white mt-1">OPEN COURT FREE PLAY (5:00 AM – 1:00 PM)</h3>
            <p className="text-xs text-slate-300">Enjoy up to 8 hours of play for just <strong>₱70 / person</strong>. Limited to 16 players. Payment is cash only at house.</p>
          </div>
          <div className="bg-slate-900 px-4 py-2 rounded-xl border border-emerald-500/40 text-center shrink-0">
            <span className="text-xl font-black text-emerald-300 font-mono">₱70</span>
            <span className="text-[10px] text-slate-400 block font-bold">per person</span>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          During Open Court Free Play, you may play with your own group or join other players at the court. Please check our live website calendar before coming to ensure no exclusive court reservations are scheduled.
        </p>
      </div>

      {/* Courts List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-emerald-600" /> Available Courts ({courts.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courts.map((court) => (
            <div key={court._id} className="glass-card p-5 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{court.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Type: {court.court_type}</p>
                <div className="flex items-center gap-4 text-xs text-slate-600 mt-3">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-emerald-600" /> Capacity: {court.capacity} Persons
                  </span>
                  <span>
                    Rate: <strong className="text-emerald-700 font-bold">5am-5pm ₱150/hr • 5pm-11pm ₱200/hr</strong>
                  </span>
                </div>
              </div>

              <Link
                to={`/booking/wizard?facility_id=${facility._id}&court_id=${court._id}`}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
              >
                Select Slot
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
