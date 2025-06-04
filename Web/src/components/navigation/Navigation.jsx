import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Navigation.css';

const Navigation = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  if (!isAuthenticated) {
    return (
      <nav className="navigation">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <div className="nav-logo-icon">🍳</div>
            <span className="nav-logo-text">NutritionApp</span>
          </Link>
          <div className="nav-auth-buttons">
            <Link to="/login" className="nav-login">Login</Link>
            <Link to="/register" className="nav-signup">Sign Up</Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/dashboard" className="nav-logo">
          <div className="nav-logo-icon">🍳</div>
          <span className="nav-logo-text">NutritionApp</span>
        </Link>
        
        <div className="nav-links">
          <Link
            to="/dashboard"
            className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
          >
            🏠 Dashboard
          </Link>
          
          <Link
            to="/products"
            className={`nav-link ${isActive('/products') ? 'active' : ''}`}
          >
            🛒 Product Catalog
          </Link>
          
          <Link
            to="/menu-generator"
            className={`nav-link ${isActive('/menu-generator') ? 'active' : ''}`}
          >
            📋 Menu Generator
          </Link>
        </div>

        <div className="nav-user">
          <div className="nav-user-info">
            <span>👤</span>
            <span className="nav-user-name">
              {user?.display_name || user?.name}
            </span>
          </div>
          
          <button onClick={logout} className="nav-logout">
            🚪 Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;