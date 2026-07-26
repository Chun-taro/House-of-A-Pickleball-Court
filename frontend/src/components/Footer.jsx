import React from 'react';
import { Heart, MapPin } from 'lucide-react';
import logoImg from '../images/Logo.jpg';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 text-slate-400 py-10 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-700/80 flex items-center justify-center p-0.5 shadow-sm shrink-0 overflow-hidden">
            <img src={logoImg} alt="House of A's Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="font-extrabold text-white block text-base">House of A's Pickleball Court</span>
            <span className="text-xs text-slate-400">Purok-1, Linabo, Malaybalay City, Bukidnon</span>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-emerald-400" /> Malaybalay City</span>
          <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> Community Owned</span>
          <span className="text-slate-400">© 2026 All Rights Reserved</span>
        </div>
      </div>
    </footer>
  );
}

