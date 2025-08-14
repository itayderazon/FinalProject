
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, ChefHat } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24 min-h-[60vh] flex items-center">
        <div className="w-full text-center">
          <div className="mb-8">
            <p className="text-8xl md:text-[10rem] font-bold text-green-600/20 select-none">404</p>
            <div className="mx-auto mt-4 w-fit rounded-full bg-white p-5 shadow-md">
              <ChefHat className="h-14 w-14 text-green-600" />
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-3">Page not found</h1>
            <p className="text-base md:text-lg text-gray-600 max-w-md mx-auto">
              The page you’re looking for doesn’t exist or was moved. Try going back or head to the homepage.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/"
              aria-label="Go to homepage"
              className="inline-flex items-center justify-center rounded-lg bg-green-600 px-6 py-3 text-white font-semibold shadow-sm transition-colors hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
            >
              <Home className="h-5 w-5 mr-2" />
              Home
            </Link>
            <button
              onClick={goBack}
              aria-label="Go back to previous page"
              className="inline-flex items-center justify-center rounded-lg border-2 border-green-600 px-6 py-3 font-semibold text-green-700 transition-colors hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Go back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;