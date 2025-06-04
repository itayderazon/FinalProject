// ====================
// src/App.jsx - Fixed with Full Width Layout
// ====================
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Page imports
import Homepage from './pages/Homepage';
import LoggedInHomepage from './pages/LoggedInHomepage';
import MenuGenerator from './pages/MenuGenerator';
import ProductCatalog from './pages/ProductCatalog';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import NotFound from './pages/NotFound';

// Component imports
import Navigation from './components/navigation/Navigation';
import LoadingSpinner from './components/common/LoadingSpinner';

// Styles
import './styles/globals.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner fullScreen text="Loading your account..." />;
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner fullScreen text="Checking authentication..." />;
  }
  
  return !user ? children : <Navigate to="/dashboard" replace />;
};

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen text="Initializing app..." />;
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100%', 
      background: '#f9fafb',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Navigation />
      <main style={{ 
        flex: 1, 
        width: '100%',
        minHeight: 'calc(100vh - 64px)' // Subtract navigation height
      }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={
            <PublicRoute>
              <Homepage />
            </PublicRoute>
          } />
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <LoggedInHomepage />
            </ProtectedRoute>
          } />
          <Route path="/menu-generator" element={
            <ProtectedRoute>
              <MenuGenerator />
            </ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute>
              <ProductCatalog />
            </ProtectedRoute>
          } />
          
          {/* Catch all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      
      {/* Toast notifications container */}
      <div id="toast-container" style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000
      }}></div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div style={{ 
          width: '100%', 
          height: '100%',
          minHeight: '100vh' 
        }}>
          <AppContent />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;