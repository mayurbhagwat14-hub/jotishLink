import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiMessageCircle, FiBell } from 'react-icons/fi';

const DesktopNavbar = () => {
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Chat with Astrologer', path: '/user/login' },
    { name: 'Call with Astrologer', path: '/user/login' },
    { name: 'Horoscope', path: '/user/login' },
    { name: 'Free Kundli', path: '/user/login' },
    { name: 'Kundli Matching', path: '/user/login' },
    { name: 'JyotishLink Services', path: '/user/login' },
  ];

  return (
    <div className="hidden lg:flex items-center justify-between px-8 py-3 bg-white sticky top-0 z-50 shadow-sm border-b border-orange-50">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 shrink-0">
        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-sm">
          <svg width="22" height="22" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="3" />
            <circle cx="50" cy="50" r="8" fill="white" />
          </svg>
        </div>
        <span className="text-[22px] font-bold text-gray-900">JyotishLink</span>
      </Link>

      {/* Nav Links */}
      <div className="flex items-center gap-1">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            className="px-3 py-2 text-[13px] font-medium text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors whitespace-nowrap"
          >
            {link.name}
          </Link>
        ))}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <button onClick={() => navigate('/user/notifications')} className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center hover:bg-orange-100 transition-colors">
          <FiBell size={18} className="text-orange-500" />
        </button>
        <button className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center hover:bg-orange-100 transition-colors">
          <FiSearch size={18} className="text-orange-500" />
        </button>
        <button
          onClick={() => navigate('/user/login')}
          className="bg-orange-500 text-white font-bold text-[13px] px-6 py-2.5 rounded-full shadow-sm shadow-orange-200 hover:bg-orange-600 active:scale-95 transition-all flex items-center gap-2"
        >
          <FiMessageCircle size={16} /> Sign In
        </button>
      </div>
    </div>
  );
};

export default DesktopNavbar;
