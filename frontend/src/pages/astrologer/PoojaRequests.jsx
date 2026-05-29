import { GiFlowerPot } from 'react-icons/gi';
import { FiCheck, FiX, FiCalendar, FiClock } from 'react-icons/fi';

const PoojaRequests = () => {
  return (
    <div className="p-4 animate-fade-in mb-6 space-y-6">
      
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Pooja Requests</h1>
        <p className="text-sm text-gray-500 font-medium">Manage and review your pooja bookings</p>
      </div>

      {/* New Request Card */}
      <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-orange-100 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-xl"></div>
         
         <div className="flex items-start gap-4 mb-4 relative z-10">
           <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center shrink-0">
             <GiFlowerPot size={24} />
           </div>
           <div className="flex-1">
             <div className="flex justify-between items-start">
               <h3 className="font-bold text-gray-800 text-lg leading-tight">Navagraha Shanti</h3>
               <span className="bg-red-50 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">New</span>
             </div>
             <p className="text-gray-500 text-xs font-medium mt-1">Requested by <span className="text-gray-700 font-bold">Amit Kumar</span></p>
           </div>
         </div>

         <div className="bg-gray-50 rounded-xl p-3 mb-5 border border-gray-100 relative z-10">
           <div className="flex justify-between items-center mb-2">
             <span className="text-xs text-gray-500 font-bold flex items-center gap-1"><FiCalendar /> Proposed Date</span>
             <span className="text-xs text-gray-800 font-bold">12 Oct 2023</span>
           </div>
           <div className="flex justify-between items-center">
             <span className="text-xs text-gray-500 font-bold flex items-center gap-1"><FiClock /> Duration</span>
             <span className="text-xs text-gray-800 font-bold">2 Hours</span>
           </div>
         </div>

         <div className="flex gap-3 relative z-10">
           <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm">
             <FiX /> Decline
           </button>
           <button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-md shadow-orange-500/30 flex items-center justify-center gap-2 transition-colors text-sm">
             <FiCheck /> Accept Booking
           </button>
         </div>
      </div>

      {/* Confirmed Bookings */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 text-sm mb-4 border-b border-gray-50 pb-2">Upcoming Confirmed Poojas</h2>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-green-50 text-green-500 rounded-full flex items-center justify-center shrink-0">
              <GiFlowerPot size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-800 text-sm truncate">Maha Mrityunjaya Jaap</h4>
              <p className="text-xs text-gray-500 font-medium">Tomorrow, 08:00 AM</p>
            </div>
            <button className="text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1.5 rounded-lg">View Info</button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default PoojaRequests;
