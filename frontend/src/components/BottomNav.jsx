import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiSearch, FiHeart, FiClock, FiShoppingBag, FiVideo, FiBell } from 'react-icons/fi';

const BottomNav = () => {
  const location = useLocation();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const handleFocus = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        setIsKeyboardOpen(true);
      }
    };
    const handleBlur = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        setIsKeyboardOpen(false);
      }
    };

    window.addEventListener('focusin', handleFocus);
    window.addEventListener('focusout', handleBlur);
    return () => {
      window.removeEventListener('focusin', handleFocus);
      window.removeEventListener('focusout', handleBlur);
    };
  }, []);

  const navItems = [
    { name: 'Home', path: '/user/home', icon: FiHome },
    { name: 'Search', path: '/user/astrologers', icon: FiSearch },
    { name: 'Video Call', path: '/user/video-call', icon: FiVideo },
    { name: 'History', path: '/user/history', icon: FiClock },
    { name: 'Store', path: '/user/store', icon: FiShoppingBag },
  ];

  if (isKeyboardOpen) return null;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">
      <div className="flex justify-around items-center px-2 pt-2 pb-1">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path.split('?')[0]);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={item.path}
              className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] relative"
            >
              {/* Active indicator dot */}
              {isActive && (
                <div className="absolute -top-2 w-1 h-1 rounded-full bg-orange-300" />
              )}

              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300
                  ${isActive
                    ? 'bg-orange-300 text-gray-900 shadow-md shadow-orange-300/40 scale-110'
                    : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                <Icon size={isActive ? 16 : 18} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span
                className={`text-[9px] leading-tight transition-all duration-200 mt-0.5
                  ${isActive ? 'font-bold text-gray-900' : 'font-medium text-gray-400'}`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
