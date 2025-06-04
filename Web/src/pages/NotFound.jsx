
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, ChefHat, Search, MapPin } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col justify-center items-center px-4">
      <div className="text-center max-w-2xl mx-auto">
        {/* 404 Animation */}
        <div className="relative mb-8">
          <div className="text-9xl md:text-[12rem] font-bold text-green-600 opacity-20 select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white p-6 rounded-full shadow-lg animate-bounce">
              <ChefHat className="h-16 w-16 text-green-600" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Oops! Page Not Found
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Looks like this recipe went missing from our cookbook! 🍳
          </p>
          <p className="text-gray-500 max-w-md mx-auto">
            The page you're looking for might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        {/* Suggestions */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8 text-left">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Search className="h-5 w-5 mr-2 text-green-600" />
            What you can try:
          </h3>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              Check the URL for typos or spelling errors
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              Go back to the previous page
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              Visit our homepage to start fresh
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              Use the navigation menu to find what you're looking for
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link
            to="/"
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center justify-center transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Home className="h-5 w-5 mr-2" />
            Go to Homepage
          </Link>
          
          <button
            onClick={goBack}
            className="border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white px-8 py-3 rounded-lg font-semibold flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Go Back
          </button>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <Link
            to="/login"
            className="p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow text-center group"
          >
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-200 transition-colors">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900">Sign In</h4>
            <p className="text-sm text-gray-500">Access your account</p>
          </Link>

          <Link
            to="/register"
            className="p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow text-center group"
          >
            <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-purple-200 transition-colors">
              <ChefHat className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="font-medium text-gray-900">Join Us</h4>
            <p className="text-sm text-gray-500">Create an account</p>
          </Link>

          <div className="p-4 bg-white rounded-lg shadow-sm border text-center">
            <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Search className="h-6 w-6 text-orange-600" />
            </div>
            <h4 className="font-medium text-gray-900">Need Help?</h4>
            <p className="text-sm text-gray-500">Contact support</p>
          </div>
        </div>

        {/* Fun Message */}
        <div className="mt-12 p-4 bg-green-100 rounded-lg">
          <p className="text-green-800 text-sm">
            💡 <strong>Fun fact:</strong> Even professional chefs sometimes lose their recipes! 
            Don't worry, we'll help you find what you're looking for.
          </p>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 text-green-200 opacity-50 animate-pulse">
        <ChefHat className="h-8 w-8" />
      </div>
      <div className="absolute bottom-20 right-10 text-blue-200 opacity-50 animate-pulse delay-1000">
        <Search className="h-6 w-6" />
      </div>
      <div className="absolute top-40 right-20 text-purple-200 opacity-50 animate-pulse delay-500">
        <Home className="h-7 w-7" />
      </div>
    </div>
  );
};

export default NotFound;