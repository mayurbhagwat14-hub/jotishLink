import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { GiFlowerPot } from 'react-icons/gi';
import { FiCheck, FiX, FiCalendar, FiClock, FiVideo } from 'react-icons/fi';
import { fetchAstrologerPoojaRequestsThunk, updatePoojaStatusThunk } from '../../store/slices/astrologerSlice';

const PoojaRequests = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { poojaRequests, loading } = useSelector((state) => state.astrologer);

  useEffect(() => {
    dispatch(fetchAstrologerPoojaRequestsThunk());
  }, [dispatch]);

  const handleStatusChange = async (id, status) => {
    await dispatch(updatePoojaStatusThunk({ id, status }));
  };

  const pendingRequests = poojaRequests.filter(req => req.status === 'pending');
  const confirmedRequests = poojaRequests.filter(req => req.status === 'confirmed');

  return (
    <div className="p-4 animate-fade-in mb-6 space-y-6">
      
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Pooja Requests</h1>
        <p className="text-sm text-gray-500 font-medium">Manage and review your pooja bookings</p>
      </div>

      {/* New Request Cards */}
      {pendingRequests.length === 0 && !loading && (
        <p className="text-gray-500 text-sm">No new pooja requests.</p>
      )}
      
      {pendingRequests.map(req => (
        <div key={req._id} className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-orange-100 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-xl"></div>
           
           <div className="flex items-start gap-4 mb-4 relative z-10">
             <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center shrink-0">
               <GiFlowerPot size={24} />
             </div>
             <div className="flex-1">
               <div className="flex justify-between items-start">
                 <h3 className="font-bold text-gray-800 text-lg leading-tight">{req.poojaName}</h3>
                 <span className="bg-red-50 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">New</span>
               </div>
               <p className="text-gray-500 text-xs font-medium mt-1">Requested by <span className="text-gray-700 font-bold">{req.userId?.name || 'User'}</span></p>
             </div>
           </div>

           <div className="bg-gray-50 rounded-xl p-3 mb-5 border border-gray-100 relative z-10">
             <div className="flex justify-between items-center mb-2">
               <span className="text-xs text-gray-500 font-bold flex items-center gap-1"><FiCalendar /> Proposed Date</span>
               <span className="text-xs text-gray-800 font-bold">{req.date}</span>
             </div>
             <div className="flex justify-between items-center mb-2">
               <span className="text-xs text-gray-500 font-bold flex items-center gap-1"><FiClock /> Time</span>
               <span className="text-xs text-gray-800 font-bold">{req.time}</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-xs text-gray-500 font-bold flex items-center gap-1">Mode</span>
               <span className={`text-xs font-bold ${req.mode === 'online' ? 'text-purple-600' : 'text-orange-600'}`}>
                 {req.mode === 'online' ? 'Live Stream' : 'In-Person'}
               </span>
             </div>
           </div>

           <div className="flex gap-3 relative z-10">
             <button 
               onClick={() => handleStatusChange(req._id, 'cancelled')}
               className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
             >
               <FiX /> Decline
             </button>
             <button 
               onClick={() => handleStatusChange(req._id, 'confirmed')}
               className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-md shadow-orange-500/30 flex items-center justify-center gap-2 transition-colors text-sm"
             >
               <FiCheck /> Accept Booking
             </button>
           </div>
        </div>
      ))}

      {/* Confirmed Bookings */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mt-8">
        <h2 className="font-bold text-gray-800 text-sm mb-4 border-b border-gray-50 pb-2">Upcoming Confirmed Poojas</h2>
        
        {confirmedRequests.length === 0 ? (
          <p className="text-gray-500 text-xs">No upcoming poojas.</p>
        ) : (
          <div className="space-y-4">
            {confirmedRequests.map(req => (
              <div key={req._id} className="border border-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-50 text-green-500 rounded-full flex items-center justify-center shrink-0">
                    <GiFlowerPot size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-800 text-sm truncate">{req.poojaName}</h4>
                    <p className="text-xs text-gray-500 font-medium">{req.date} at {req.time} - {req.mode === 'online' ? 'Live Stream' : 'In-Person'}</p>
                  </div>
                </div>
                {req.mode === 'online' && (
                  <button 
                    onClick={() => navigate('/astrologer/chat/new', { state: { roomId: req._id, userId: req.userId?._id } })}
                    className="w-full mt-3 flex items-center justify-center gap-2 py-2 bg-purple-500 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-purple-600 transition-colors"
                  >
                    <FiVideo size={14} /> Start Live Stream
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default PoojaRequests;
