import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Trophy, Calendar, Clock, MapPin, CheckCircle2, Heart, ArrowRight, Star, Volume2, ShieldAlert, Wifi, CloudRain, Gamepad2, FileText, Car, Bath, ShoppingBag, KeyRound, Tag, Banknote, Users, ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import CourtAvailabilityCalendar from '../components/CourtAvailabilityCalendar';

import logoImg from '../images/Logo.jpg';
import backgroundImg from '../images/background.jpg';
import heroImg from '../images/IMG_6453.jpg';

// House of A's Court Gallery Images
import galleryImg1 from '../images/IMG_5322.jpg';
import galleryImg2 from '../images/IMG_5325.png';
import galleryImg3 from '../images/IMG_5328.png';
import galleryImg4 from '../images/img.jpeg';

export default function Home() {
  const [facility, setFacility] = useState(null);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gallery state
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const galleryPhotos = [
    {
      src: '/images/IMG_5322.jpg',
      fallback: galleryImg1,
      title: "Main Indoor Court View",
      tag: "Court View",
      description: "Official indoor pickleball court setup with high-grade non-slip court surface and net."
    },
    {
      src: '/images/IMG_5325.png',
      fallback: galleryImg2,
      title: "Pickleball Net & Sidelines",
      tag: "Surface & Net",
      description: "Clean boundary lines and court layout designed for fast-paced pickleball games."
    },
    {
      src: '/images/IMG_5328.png',
      fallback: galleryImg3,
      title: "Indoor Facility & Lighting",
      tag: "Lighting & Venue",
      description: "Bright overhead LED illumination providing clear visibility day and night."
    },
    {
      src: '/images/img.jpeg',
      fallback: galleryImg4,
      title: "Inside House of A's Court",
      tag: "Interior & Lounge",
      description: "Spacious court and seating area for players and spectators in Linabo, Malaybalay City."
    }
  ];

  const nextPhoto = () => {
    setActivePhotoIndex((prev) => (prev + 1) % galleryPhotos.length);
  };

  const prevPhoto = () => {
    setActivePhotoIndex((prev) => (prev - 1 + galleryPhotos.length) % galleryPhotos.length);
  };

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
      <section className="relative overflow-hidden rounded-3xl p-5 sm:p-14 text-center text-white shadow-2xl border border-slate-800">
        {/* Background Image with Light Overlay for high visibility */}
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt="House of A's Venue Background" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/55 via-slate-950/35 to-slate-950/65"></div>
        </div>

        {/* Glow orbs */}
        <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none z-0"></div>
        <div className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] bg-teal-500/15 rounded-full blur-3xl pointer-events-none z-0"></div>

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="relative inline-block mb-1">
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-white p-2 border border-slate-700/60 shadow-xl overflow-hidden mx-auto">
              <img src={logoImg} alt="House of A's Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-slate-900/90 backdrop-blur-md text-emerald-300 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider border border-emerald-500/50 shadow-md">
              <span className="px-2 py-0.5 rounded-full bg-lime-400 text-slate-950 font-black text-[9px]">PICKLEBALL</span> Malaybalay’s Premier Pickleball Venue
            </div>
          </div>
          
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight drop-shadow-md">
            House of A’s <span className="gradient-text-emerald">Pickleball Court</span>
          </h1>
          
          <p className="text-sm sm:text-lg text-slate-100 max-w-2xl mx-auto font-semibold leading-relaxed drop-shadow-sm">
            Purok-1, Linabo, Malaybalay City, Bukidnon. Book our private single court for casual matches, dink sessions, family games, or competitive pickleball matches.
          </p>

          {/* Court Rates Banner in Hero */}
          <div className="inline-flex flex-wrap items-center justify-center gap-3 p-3 px-5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-lime-400/40 shadow-xl text-xs sm:text-sm">
            <span className="font-extrabold text-lime-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-lime-400" /> Court Rates:
            </span>
            <span className="bg-slate-800 text-slate-100 font-bold px-3 py-1 rounded-xl border border-slate-700">
              5:00 AM - 5:00 PM: <span className="text-lime-400 font-extrabold">₱150/hr</span>
            </span>
            <span className="bg-slate-800 text-slate-100 font-bold px-3 py-1 rounded-xl border border-slate-700">
              5:00 PM - 11:00 PM: <span className="text-emerald-400 font-extrabold">₱200/hr</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/booking/wizard"
              className="gradient-btn-primary w-full sm:w-auto px-8 py-4 rounded-2xl text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              <Calendar className="w-5 h-5 text-emerald-100" /> Reserve Court Slot <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Court Availability Calendar Section */}
      <CourtAvailabilityCalendar />

      {/* OPEN COURT FREE PLAY PROMO SHOWCASE */}
      <section className="relative rounded-3xl p-6 sm:p-10 space-y-8 shadow-[0_0_50px_rgba(16,185,129,0.18)] border-2 border-emerald-500/40 bg-gradient-to-br from-slate-950 via-emerald-950/70 to-slate-950 text-white overflow-hidden">
        {/* Glow ambient background elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Header Banner */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-slate-800/90 pb-8 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-widest border border-emerald-400/40 shadow-xs backdrop-blur-md">
              <Clock className="w-4 h-4 text-emerald-400" /> Morning Community Open Play
            </div>
            
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-none">
              OPEN COURT <span className="gradient-text-emerald">FREE PLAY</span>
            </h2>
            
            <p className="text-sm sm:text-base text-slate-200 font-medium leading-relaxed">
              Enjoy up to <strong className="text-emerald-300">8 hours of morning play</strong> for just <strong className="text-emerald-300 font-mono text-lg">₱70 per person</strong>! Play with your own group or join other pickleball players on court.
            </p>
          </div>

          {/* Hero Price Tag Card */}
          <div className="relative group shrink-0 w-full lg:w-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-2xl blur-sm opacity-50 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative bg-slate-900/95 backdrop-blur-xl p-6 rounded-2xl border border-emerald-500/50 text-center lg:text-right shadow-2xl space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/90 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-800">
                <Clock className="w-4 h-4 text-emerald-400" /> 5:00 AM – 1:00 PM
              </div>
              <div className="text-4xl sm:text-5xl font-black text-emerald-300 font-mono tracking-tight drop-shadow-md">
                ₱70 <span className="text-xs text-slate-300 font-sans font-extrabold uppercase">/ person</span>
              </div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Morning Open Play • Onsite Payment (Cash / GCash)</p>
            </div>
          </div>
        </div>

        {/* 4 Guideline Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10 text-xs">
          {/* 1. Capacity */}
          <div className="p-5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800 space-y-3 hover:border-emerald-400/60 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-black text-white text-base">16 Players Max</h3>
            <p className="text-slate-300 leading-relaxed font-medium">
              Limited to <strong>16 players only</strong> per morning session to ensure everyone gets maximum court play time.
            </p>
          </div>

          {/* 2. Group or Join */}
          <div className="p-5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800 space-y-3 hover:border-teal-400/60 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
            <div className="w-11 h-11 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold shadow-xs">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="font-black text-white text-base">Group or Solo</h3>
            <p className="text-slate-300 leading-relaxed font-medium">
              Play with your own group or join other players who are at the court that morning.
            </p>
          </div>

          {/* 3. Check Live Calendar */}
          <div className="p-5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800 space-y-3 hover:border-emerald-400/60 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shadow-xs">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-black text-white text-base">Check Live Website</h3>
            <p className="text-slate-300 leading-relaxed font-medium">
              Before coming, kindly check our live website calendar to verify no exclusive court bookings are scheduled.
            </p>
          </div>

          {/* 4. Onsite Payment Only */}
          <div className="p-5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800 space-y-3 hover:border-teal-400/60 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
            <div className="w-11 h-11 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold shadow-xs">
              <Banknote className="w-6 h-6" />
            </div>
            <h3 className="font-black text-white text-base">Onsite Payment Only</h3>
            <p className="text-slate-300 leading-relaxed font-medium">
              No need to pay in advance. Your payment is after your game via <strong>Cash</strong> or <strong>GCash</strong>.
            </p>
          </div>
        </div>

        {/* Footer Option Banner */}
        <div className="p-5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800/90 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs relative z-10 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-lg">💡</span>
            <p className="text-slate-200 font-semibold leading-relaxed">
              <strong>Prefer Private Court Access?</strong> Book an exclusive court reservation for your private group online.
            </p>
          </div>
          
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-emerald-300 font-extrabold text-sm italic font-serif hidden md:inline-block">See you on court! ♡</span>
            <Link
              to="/booking/wizard"
              className="gradient-btn-primary px-6 py-3 rounded-xl font-extrabold text-white shrink-0 shadow-md flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              Book Exclusive Court <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Photo Gallery Section */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider border border-emerald-200">
              <Trophy className="w-3.5 h-3.5" /> Venue Gallery
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Inside House of A's Court</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              Photo {activePhotoIndex + 1} of {galleryPhotos.length}
            </span>
            <p className="text-xs text-slate-500 max-w-xs text-right hidden lg:block">Real photos from our Pickleball Court in Linabo, Malaybalay City.</p>
          </div>
        </div>

        {/* Featured Large Active Photo Card */}
        <div className="h-80 sm:h-[32rem] rounded-3xl overflow-hidden relative group shadow-2xl border border-slate-200 bg-slate-950">
          <img
            src={galleryPhotos[activePhotoIndex].src}
            alt={galleryPhotos[activePhotoIndex].title}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = galleryPhotos[activePhotoIndex].fallback;
            }}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-102"
          />

          {/* Dark Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

          {/* Left Arrow Navigation */}
          <button
            type="button"
            onClick={prevPhoto}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white backdrop-blur-md flex items-center justify-center border border-slate-700/80 shadow-lg transition-all opacity-80 group-hover:opacity-100 cursor-pointer hover:scale-110"
            title="Previous Photo"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Right Arrow Navigation */}
          <button
            type="button"
            onClick={nextPhoto}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white backdrop-blur-md flex items-center justify-center border border-slate-700/80 shadow-lg transition-all opacity-80 group-hover:opacity-100 cursor-pointer hover:scale-110"
            title="Next Photo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Bottom Info & Fullscreen Button */}
          <div className="absolute bottom-5 left-5 right-5 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="space-y-1.5 max-w-xl text-white">
              <div className="inline-block bg-emerald-500/90 text-slate-950 font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-md shadow-sm">
                {galleryPhotos[activePhotoIndex].tag}
              </div>
              <h3 className="text-xl sm:text-2xl font-black drop-shadow-md">
                {galleryPhotos[activePhotoIndex].title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 font-medium drop-shadow-xs">
                {galleryPhotos[activePhotoIndex].description}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="bg-slate-900/90 hover:bg-emerald-500 hover:text-slate-950 backdrop-blur-md text-white text-xs font-black px-4 py-2.5 rounded-xl border border-slate-700 shadow-xl flex items-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <Maximize2 className="w-4 h-4" /> Fullscreen View
            </button>
          </div>
        </div>

        {/* 4 Interactive Gallery Thumbnails */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {galleryPhotos.map((photo, index) => {
            const isActive = index === activePhotoIndex;
            return (
              <button
                key={index}
                type="button"
                onClick={() => setActivePhotoIndex(index)}
                className={`relative h-28 sm:h-36 rounded-2xl overflow-hidden border-2 transition-all duration-300 group cursor-pointer text-left ${
                  isActive
                    ? 'border-emerald-500 ring-4 ring-emerald-500/20 shadow-lg scale-[1.02]'
                    : 'border-slate-200 hover:border-emerald-300 opacity-75 hover:opacity-100'
                }`}
              >
                <img
                  src={photo.src}
                  alt={photo.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = photo.fallback;
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className={`absolute inset-0 transition-opacity ${isActive ? 'bg-gradient-to-t from-slate-950/80 via-transparent to-transparent' : 'bg-slate-950/20 group-hover:bg-transparent'}`} />
                <div className="absolute bottom-2 left-2 right-2">
                  <span className={`text-[11px] font-bold block truncate px-2 py-1 rounded-md backdrop-blur-md ${isActive ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-950/70 text-white'}`}>
                    {photo.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Fullscreen Lightbox Modal */}
        {lightboxOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 animate-fadeIn">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-slate-900/90 hover:bg-rose-500 text-white flex items-center justify-center border border-slate-700 shadow-2xl transition-all cursor-pointer z-50"
              title="Close Fullscreen"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Lightbox Navigation Left */}
            <button
              type="button"
              onClick={prevPhoto}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-slate-900/90 hover:bg-emerald-500 hover:text-slate-950 text-white flex items-center justify-center border border-slate-700 shadow-2xl transition-all cursor-pointer z-50"
              title="Previous Photo"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>

            {/* Lightbox Navigation Right */}
            <button
              type="button"
              onClick={nextPhoto}
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-slate-900/90 hover:bg-emerald-500 hover:text-slate-950 text-white flex items-center justify-center border border-slate-700 shadow-2xl transition-all cursor-pointer z-50"
              title="Next Photo"
            >
              <ChevronRight className="w-7 h-7" />
            </button>

            {/* Lightbox Main Image & Details */}
            <div className="max-w-5xl w-full max-h-[85vh] flex flex-col items-center space-y-4">
              <div className="w-full h-[65vh] rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-black relative flex items-center justify-center">
                <img
                  src={galleryPhotos[activePhotoIndex].src}
                  alt={galleryPhotos[activePhotoIndex].title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = galleryPhotos[activePhotoIndex].fallback;
                  }}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              <div className="text-center text-white space-y-1 max-w-xl">
                <div className="inline-block bg-emerald-500 text-slate-950 font-black text-xs uppercase px-3 py-0.5 rounded-full mb-1">
                  {galleryPhotos[activePhotoIndex].tag} ({activePhotoIndex + 1} / {galleryPhotos.length})
                </div>
                <h3 className="text-xl sm:text-2xl font-black">
                  {galleryPhotos[activePhotoIndex].title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  {galleryPhotos[activePhotoIndex].description}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Facility Details Card */}
      {loading ? (
        <div className="h-80 glass-card rounded-3xl animate-pulse"></div>
      ) : facility ? (
        <section className="glass-card p-6 sm:p-10 rounded-3xl space-y-6 shadow-xl border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="h-80 rounded-2xl overflow-hidden relative border border-slate-200 shadow-md group">
              <img
                src={facility.image_url && facility.image_url !== 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&auto=format&fit=crop&q=80' ? facility.image_url : galleryImg1}
                alt="House of A's Court"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 right-4 bg-slate-950/90 backdrop-blur-md px-4 py-2 rounded-full text-xs font-black text-emerald-400 shadow-md border border-slate-800 flex items-center gap-1.5">
                <span>5am-5pm: ₱150/hr</span>
                <span className="text-slate-500">•</span>
                <span>5pm-11pm: ₱200/hr</span>
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
                    <Tag className="w-4 h-4" />
                  </div>
                  <span><strong>Court Rates:</strong> 5:00 AM - 5:00 PM: <strong>₱150/hr</strong> | 5:00 PM - 11:00 PM: <strong>₱200/hr</strong></span>
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
          <p className="text-sm text-slate-600 leading-relaxed">Reserve online via GCash, get your digital booking code, and bring your paddles to play!</p>
        </div>
      </section>

      {/* Venue Amenities Section */}
      <section className="glass-card p-8 sm:p-10 rounded-3xl space-y-8 shadow-xl border border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> Convenience & Services
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Venue Amenities & Gear
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-sm">
            Everything you need for a comfortable and enjoyable pickleball session at House of A's.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Road Parking */}
          <div className="p-6 rounded-2xl bg-slate-50/90 border border-slate-200 space-y-3 hover:border-emerald-400 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 font-bold">
              <Car className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Road Parking</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Convenient roadside parking spaces right outside the venue for vehicles and motorcycles.
            </p>
          </div>

          {/* Restroom */}
          <div className="p-6 rounded-2xl bg-slate-50/90 border border-slate-200 space-y-3 hover:border-teal-400 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 font-bold">
              <Bath className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Restroom</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Clean and private restroom facilities available on-site for all players and guests.
            </p>
          </div>

          {/* Paddle & Balls */}
          <div className="p-6 rounded-2xl bg-slate-50/90 border border-slate-200 space-y-3 hover:border-amber-400 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 font-bold">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Paddle & Balls</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pickleball paddles and balls available for rent or for sale at the court desk.
            </p>
          </div>

          {/* Keychains */}
          <div className="p-6 rounded-2xl bg-slate-50/90 border border-slate-200 space-y-3 hover:border-indigo-400 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 font-bold">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Keychains for Sale</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Exclusive House of A's souvenir keychains available for purchase.
            </p>
          </div>
        </div>
      </section>

      {/* Rules & Guidelines Section */}
      <section className="glass-card p-8 sm:p-10 rounded-3xl space-y-8 shadow-xl border border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider border border-emerald-200">
              <FileText className="w-3.5 h-3.5" /> Policy & Guidelines
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Pickleball Court Rules & Guidelines
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-sm">
            Please read our court guidelines to ensure a pleasant and enjoyable experience for all players and neighbors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Rule 1: Speaker Use */}
          <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3 hover:border-emerald-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 font-bold">
              <Volume2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black">1</span>
              Speaker Use
            </h3>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
              <li>Speakers may only be used from <strong className="text-slate-800 font-bold">10:00 AM to 9:00 PM</strong>.</li>
              <li>Please keep the volume at a reasonable level to avoid disturbing our neighbors.</li>
            </ul>
          </div>

          {/* Rule 2: Payments */}
          <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3 hover:border-amber-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-black">2</span>
              Payments
            </h3>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
              <li>All payments are <strong className="text-slate-800 font-bold">non-refundable</strong>, except in cases stated under the weather policy.</li>
            </ul>
          </div>

          {/* Rule 3: Amenities */}
          <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3 hover:border-teal-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 font-bold">
              <Wifi className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-black">3</span>
              Amenities & Equipment
            </h3>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
              <li><strong className="text-slate-800 font-bold">Road Parking & Restroom</strong> available on site.</li>
              <li><strong className="text-slate-800 font-bold">Paddle & Balls</strong> for rent or for sale.</li>
              <li><strong className="text-slate-800 font-bold">Keychains</strong> for sale at counter.</li>
              <li><strong className="text-slate-800 font-bold">Free Wi-Fi</strong> for all court guests.</li>
            </ul>
          </div>

          {/* Rule 4: Weather Policy */}
          <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3 md:col-span-2 lg:col-span-2 hover:border-blue-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 font-bold">
              <CloudRain className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-black">4</span>
              Weather Policy
            </h3>
            <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>During heavy rain accompanied by strong winds, some rainwater may enter the court.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>You may continue playing while our staff immediately wipes and dries the court.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <div>
                  <span>If your game is interrupted by rain, you may:</span>
                  <ul className="pl-4 pt-1 space-y-1 list-circle">
                    <li><strong className="text-slate-800 font-bold">Extend your playing time at no additional cost</strong> for the duration of the interruption, <em>provided there is no booking after your schedule</em>; or</li>
                    <li><strong className="text-slate-800 font-bold">Receive a refund</strong> if an extension is not possible.</li>
                  </ul>
                </div>
              </li>
            </ul>
          </div>

          {/* Rule 5: Board Games */}
          <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3 hover:border-indigo-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 font-bold">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-black">5</span>
              Board Games
            </h3>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
              <li>Board games are available for guests to enjoy while waiting for their court reservation.</li>
              <li>Children are also welcome to play the board games while waiting.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}


