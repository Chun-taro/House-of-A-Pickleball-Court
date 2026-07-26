import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Clock, ArrowRight } from 'lucide-react';
import courtImg from '../images/pickle ball court.jpg';

export default function FacilityCatalog() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/facilities')
      .then((res) => {
        if (res.data.success) {
          setFacilities(res.data.facilities);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 py-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Sports Facilities</h1>
        <p className="text-slate-600 mt-1">Explore House of A's Pickleball Court details and reserve online.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1].map((i) => (
            <div key={i} className="h-80 glass-card rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.map((fac) => (
            <div key={fac._id} className="glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col justify-between">
              <div>
                <div className="h-52 relative overflow-hidden bg-slate-100">
                  <img
                    src={fac.image_url && fac.image_url !== 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&auto=format&fit=crop&q=80' ? fac.image_url : courtImg}
                    alt={fac.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-emerald-700 shadow-xs border border-emerald-200">
                    ₱{fac.hourly_rate} / hr
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <h3 className="text-xl font-bold text-slate-900">{fac.name}</h3>
                  <p className="text-xs text-slate-600 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-emerald-600" /> {fac.location}
                  </p>
                  <p className="text-sm text-slate-600">{fac.description}</p>
                </div>
              </div>

              <div className="p-6 pt-0 border-t border-slate-100 mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-4 h-4 text-emerald-600" /> {fac.open_time} - {fac.close_time}
                </span>
                <Link
                  to={`/facilities/${fac._id}`}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center gap-1"
                >
                  Details <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
