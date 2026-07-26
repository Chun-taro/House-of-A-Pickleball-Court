import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';

// Public Pages
import Home from './pages/Home';
import FacilityCatalog from './pages/FacilityCatalog';
import FacilityDetails from './pages/FacilityDetails';
import Login from './pages/Login';
import Register from './pages/Register';

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
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar />
      <main className="flex-1 bg-slate-100/60 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

// Public/Customer Layout Component
const CustomerLayout = () => {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1">
      <Outlet />
    </main>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
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
  );
}
