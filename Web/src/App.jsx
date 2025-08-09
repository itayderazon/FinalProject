/**
 * Main App Component
 * Central application component with routing and authentication
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TOAST, LAYOUT } from './constants/ui';

// Page imports
import Homepage from './pages/Homepage';
import MenuGenerator from './pages/MenuGenerator';
import DailyMenuPlanner from './pages/DailyMenuPlanner';
import ProductCatalog from './pages/ProductCatalog';
import ShoppingCart from './pages/ShoppingCart';
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
  
  return !user ? children : <Navigate to="/menu-generator" replace />;
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
        minHeight: `calc(100vh - ${LAYOUT.HEADER_HEIGHT})` // Subtract navigation height
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
          <Route path="/menu-generator" element={
            <ProtectedRoute>
              <MenuGenerator />
            </ProtectedRoute>
          } />
          <Route path="/daily-menu-planner" element={
            <ProtectedRoute>
              <DailyMenuPlanner />
            </ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute>
              <ProductCatalog />
            </ProtectedRoute>
          } />
          <Route path="/cart" element={
            <ProtectedRoute>
              <ShoppingCart />
            </ProtectedRoute>
          } />
          
          {/* Catch all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      
      {/* Toast notifications */}
      <Toaster
        position={TOAST.POSITION}
        toastOptions={{
          duration: TOAST.DURATION.INFO,
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            duration: TOAST.DURATION.SUCCESS,
            style: {
              background: '#4caf50',
            },
          },
          error: {
            duration: TOAST.DURATION.ERROR,
            style: {
              background: '#f44336',
            },
          },
        }}
      />
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