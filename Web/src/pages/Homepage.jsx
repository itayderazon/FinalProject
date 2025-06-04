import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Homepage.css';

const Homepage = () => {
  return (
    <div className="homepage">
      {/* Hero Section */}
      <div className="homepage-hero">
        <div className="homepage-container">
          <h1 className="homepage-title">
            Your Personal
            <span className="homepage-subtitle">Nutrition Assistant</span>
          </h1>
          <p className="homepage-description">
            Generate personalized meal plans, track your nutrition, and achieve your health goals 
            with AI-powered recommendations tailored just for you.
          </p>
          <div className="homepage-buttons">
            <Link to="/register" className="btn-primary">
              Get Started Free
              <span>→</span>
            </Link>
            <Link to="/login" className="btn-outline">
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="homepage-features">
        <div className="features-container">
          <h2 className="features-title">Why Choose NutritionApp?</h2>
          <p className="features-description">
            Our AI-powered platform makes healthy eating simple, personalized, and effective.
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon purple">📊</div>
              <h3 className="feature-title">Smart Analytics</h3>
              <p className="feature-description">
                Understand your eating patterns with comprehensive reports and personalized insights.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;