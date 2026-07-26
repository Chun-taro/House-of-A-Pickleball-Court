import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Clock, Trophy, Calendar, Users } from 'lucide-react';
import courtImg from '../images/pickle ball court.jpg';

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

          <div className="flex flex-wrap gap-6 pt-2 text-sm text-slate-200">
            <div className="flex items-center gap-2 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-700">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Hours: {facility.open_time} - {facility.close_time}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-700">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span>Rate: ₱{facility.hourly_rate} / hr</span>
            </div>
          </div>
        </div>
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
                    Rate: <strong className="text-emerald-700 font-bold">₱{court.hourly_rate_override || facility.hourly_rate} / hr</strong>
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
