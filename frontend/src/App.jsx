import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import NavBar from './components/NavBar.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ReservationFlow from './pages/ReservationFlow.jsx';
import CustomerDashboard from './pages/CustomerDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import KitchenPrep from './pages/KitchenPrep.jsx';
import DietaryAssistant from './pages/DietaryAssistant.jsx';
import AiConciergeDrawer from './components/AiConciergeDrawer.jsx';

import './styles/global.css';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-dark)' }}>
        <div style={{ fontSize: '1.25rem', color: 'var(--primary)', fontFamily: 'var(--font-display)', fontWeight: '600' }}>
          Loading Chatori Gali...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <NavBar />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Customer & Booking Routes */}
              <Route
                path="/book/:restaurantId"
                element={
                  <ProtectedRoute allowedRoles={['customer', 'admin']}>
                    <ReservationFlow />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute allowedRoles={['customer', 'admin']}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dietary-assistant"
                element={
                  <ProtectedRoute allowedRoles={['customer', 'admin', 'staff']}>
                    <DietaryAssistant />
                  </ProtectedRoute>
                }
              />

              {/* Kitchen / Staff Routes */}
              <Route
                path="/kitchen"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <KitchenPrep />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <AiConciergeDrawer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
