import { FiX, FiHome, FiHeadphones, FiCreditCard, FiGift, FiClock, FiShoppingBag, FiBookOpen, FiMessageCircle, FiUserCheck, FiGrid, FiStar, FiSettings, FiEdit2 } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={onClose}
        ></div>
      )}

      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 left-0 w-[85%] max-w-sm bg-white z-[60] transform transition-transform duration-300 ease-in-out flex flex-col overflow-hidden shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-100">
          <div className="flex gap-3 items-center">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-sm">
               <div className="w-8 h-8 rounded-full border border-black/80 flex items-center justify-center relative">
                  <div className="w-5 h-5 rounded-full border border-black/80 flex items-center justify-center relative">
                     <div className="w-2 h-2 bg-black rounded-full" style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'}}></div>
                  </div>
               </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-gray-900 text-lg">Mayur</h2>
                <FiEdit2 className="text-gray-500 cursor-pointer" size={14} />
              </div>
              <p className="text-gray-500 text-xs">+91-876xxxx836</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 p-1">
            <FiX size={24} />
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-2">
          <MenuLink icon={<FiHome size={20} />} text="Home" to="/" onClick={onClose} />
          <MenuLink 
            icon={<div className="w-[20px] h-[20px] flex items-center justify-center"><span className="text-gray-600 text-[18px]">🏺</span></div>} 
            text="Book a Pooja" 
            to="/" 
            onClick={onClose} 
            tag="New"
          />
          <MenuLink icon={<FiHeadphones size={20} />} text="Customer Support Chat" to="/" onClick={onClose} />
          <MenuLink icon={<FiCreditCard size={20} />} text="Wallet Transactions" to="/" onClick={onClose} />
          <MenuLink icon={<FiGift size={20} />} text="Redeem Gift Card" to="/" onClick={onClose} />
          <MenuLink icon={<FiClock size={20} />} text="Order History" to="/user/profile" onClick={onClose} />
          <MenuLink icon={<FiShoppingBag size={20} />} text="AstroRemedy" to="/user/store" onClick={onClose} />
          <MenuLink icon={<FiBookOpen size={20} />} text="Astrology Blog" to="/" onClick={onClose} />
          <MenuLink icon={<FiMessageCircle size={20} />} text="Chat with Astrologers" to="/user/astrologers" onClick={onClose} />
          <MenuLink icon={<FiUserCheck size={20} />} text="My Following" to="/" onClick={onClose} />
          <MenuLink icon={<FiGrid size={20} />} text="My Kundli" to="/user/kundli" onClick={onClose} />
          <MenuLink icon={<FiStar size={20} />} text="Free Services" to="/" onClick={onClose} />
          <MenuLink icon={<FiSettings size={20} />} text="Settings" to="/user/profile" onClick={onClose} />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-600 mb-3">Also available on</p>
          <div className="flex gap-3 mb-4">
             {/* Simple black circles simulating social icons */}
             <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-white text-xs font-bold">A</div>
             <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">W</div>
             <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">Y</div>
             <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">f</div>
             <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold">I</div>
             <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">in</div>
          </div>
          <p className="text-center text-green-600 text-sm font-medium">Version 1.1.491</p>
        </div>

      </div>
    </>
  );
};

const MenuLink = ({ icon, text, to, onClick, tag }) => (
  <Link 
    to={to} 
    onClick={onClick}
    className="flex items-center gap-4 px-6 py-3.5 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition group"
  >
    <div className="text-gray-500 group-hover:text-orange-500">
      {icon}
    </div>
    <span className="text-[15px] font-medium">{text}</span>
    {tag && (
      <span className="ml-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
        {tag}
      </span>
    )}
  </Link>
);

export default Sidebar;
