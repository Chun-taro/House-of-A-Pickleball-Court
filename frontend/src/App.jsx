import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { ConfirmProvider } from './components/ConfirmDialog';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';

// Public Pages
import Home from './pages/Home';
import FacilityCatalog from './pages/FacilityCatalog';
import FacilityDetails from './pages/FacilityDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// Customer Pages
import BookingWizard from './pages/customer/BookingWizard';
import MyBookings from './pages/customer/MyBookings';
import BookingDetails from './pages/customer/BookingDetails';
import Profile from './pages/customer/Profile';

// Admin / Staff Pages
import Dashboard from './pages/admin/Dashboard';
import BookingsList from './pages/admin/BookingsList';
import CalendarView from './pages/admin/CalendarView';
import FacilitiesAdmin from './pages/admin/FacilitiesAdmin';
import CourtsAdmin from './pages/admin/CourtsAdmin';
import SchedulesAdmin from './pages/admin/SchedulesAdmin';
import PaymentsAdmin from './pages/admin/PaymentsAdmin';
import ReportsAdmin from './pages/admin/ReportsAdmin';
import UsersAdmin from './pages/admin/UsersAdmin';

// Protected Route Component
const ProtectedRoute = ({ roles = [] }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles.length > 0 && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
};

// Admin Layout Component with Sidebar
const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] relative">
      {/* Mobile Management Portal Header Toggle */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-black text-white uppercase tracking-wider">Management Portal</span>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
        >
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          Nav Menu
        </button>
      </div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 bg-slate-100/60 overflow-y-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};

// Public/Customer Layout Component
const CustomerLayout = () => {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 w-full">
      <Outlet />
    </main>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AuthProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-['Plus_Jakarta_Sans',sans-serif]">
          <Navbar />
          
          <Routes>
            {/* Public & Customer Routes */}
            <Route element={<CustomerLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/facilities" element={<FacilityCatalog />} />
              <Route path="/facilities/:id" element={<FacilityDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Customer Only Protected Routes */}
              <Route element={<ProtectedRoute roles={['customer']} />}>
                <Route path="/booking/wizard" element={<BookingWizard />} />
                <Route path="/my-bookings" element={<MyBookings />} />
                <Route path="/my-bookings/:id" element={<BookingDetails />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Route>

            {/* Admin & Staff Management Protected Routes */}
            <Route element={<ProtectedRoute roles={['admin', 'staff']} />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<Dashboard />} />
                <Route path="/admin/bookings" element={<BookingsList />} />
                <Route path="/admin/calendar" element={<CalendarView />} />
                <Route path="/admin/facilities" element={<FacilitiesAdmin />} />
                <Route path="/admin/courts" element={<CourtsAdmin />} />
                <Route path="/admin/schedules" element={<SchedulesAdmin />} />
                <Route path="/admin/payments" element={<PaymentsAdmin />} />
                <Route path="/admin/reports" element={<ReportsAdmin />} />

                {/* Admin Only */}
                <Route element={<ProtectedRoute roles={['admin']} />}>
                  <Route path="/admin/users" element={<UsersAdmin />} />
                </Route>
              </Route>
            </Route>
          </Routes>

          <Footer />
        </div>
          </Router>
        </AuthProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}
