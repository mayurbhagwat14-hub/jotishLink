import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUser, FiStar, FiShield } from 'react-icons/fi';
import Home from './Home';

const MainLanding = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) {
    return <Home />;
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 bg-gray-50">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-serif font-bold text-gray-900 mb-4">
          Welcome to <span className="text-orange-500">JyotishLink</span>
        </h1>
        <p className="text-lg text-gray-600">Select your portal to continue</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        {/* User Portal */}
        <Link to="/user-app" className="group bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:border-orange-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <FiUser size={36} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">User Portal</h2>
          <p className="text-gray-600">Chat with astrologers, get your kundli, and explore daily horoscopes.</p>
        </Link>

        {/* Astrologer Portal */}
        <Link to="/astrologer/dashboard" className="group bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-indigo-100 text-indigo-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <FiStar size={36} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Astrologer Portal</h2>
          <p className="text-gray-600">Manage your consultations, view earnings, and connect with clients.</p>
        </Link>

        {/* Admin Portal */}
        <Link to="/admin/dashboard" className="group bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <FiShield size={36} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Admin Portal</h2>
          <p className="text-gray-600">Overview platform statistics, manage users, and configure settings.</p>
        </Link>
      </div>
    </div>
  );
};

export default MainLanding;
