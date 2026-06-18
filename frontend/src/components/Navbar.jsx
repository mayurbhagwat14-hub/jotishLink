import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Navbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { appName, appLogo } = useSelector(state => { console.log("REDUX STATE SETTINGS:", state.settings); return state.settings; }) || { appName: 'JyotishLink', appLogo: '' };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white sticky top-0 z-50 shadow-sm border-b border-orange-50">
      <Link to="/" className="flex items-center gap-2">
        {appLogo ? (
          <img src={appLogo} alt={appName} className="h-12 object-contain mix-blend-multiply" />
        ) : (
          <>
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="3" />
                <circle cx="50" cy="50" r="8" fill="white" />
              </svg>
            </div>
            <span className="text-[20px] font-bold text-gray-900">{appName}</span>
          </>
        )}
      </Link>

      <button
        onClick={() => navigate('/user/login')}
        className="bg-orange-500 text-white font-bold text-[13px] px-5 py-2 rounded-full shadow-sm shadow-orange-200 hover:bg-orange-600 active:scale-95 transition-all"
      >
        Login
      </button>
    </div>
  );
};

export default Navbar;
