import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiMessageSquare, FiPhoneCall, FiTrendingUp, FiVideo, FiArrowRight, FiClock } from 'react-icons/fi';
import { GiFlowerPot } from 'react-icons/gi';
import { fetchAstrologerDashboardThunk } from '../../store/slices/dashboardSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { astrologerDashboard, loading, error } = useSelector((state) => state.dashboard);
  const { incomingRequests } = useSelector((state) => state.astrologer);

  useEffect(() => {
    dispatch(fetchAstrologerDashboardThunk());
  }, [dispatch]);

  const dbData = astrologerDashboard || {};

  return (
    <div className="p-4 space-y-6 animate-fade-in mb-6">
      
      {/* Earnings Summary Card */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-400 rounded-3xl p-6 text-white shadow-lg shadow-orange-500/30 relative overflow-hidden">
        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
        <p className="text-orange-50 font-medium mb-1 text-sm">Today's Earnings</p>
        <div className="flex items-end justify-between relative z-10">
          <h2 className="text-3xl font-black">₹{dbData.totalEarnings?.toLocaleString() || '0'}</h2>
          <Link to="/astrologer/earnings" className="bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
            <FiTrendingUp /> Details
          </Link>
        </div>
      </div>

      {/* Actionable Incoming Requests (Replaced old static Active Queue) */}
      <div>
        <div className="flex justify-between items-end mb-3 px-1">
          <h2 className="font-bold text-gray-800 text-lg">Action Required</h2>
          <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse-slow">
            {dbData.pendingActionCount || '0'} PENDING
          </span>
        </div>
        
        <div className="space-y-3">
          
          {/* Incoming Chat */}
          {dbData.chatRequest && (
            <Link to="/astrologer/chats" className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100 flex items-center gap-4 hover:shadow-md hover:border-orange-200 transition-all group relative overflow-hidden block">
               <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-full blur-xl group-hover:bg-orange-500/10 transition-colors"></div>
               <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center shrink-0 border border-orange-100">
                 <FiMessageSquare size={20} />
               </div>
               <div className="flex-1 min-w-0">
                 <h3 className="font-bold text-gray-800 text-sm">Chat Request</h3>
                 <p className="text-xs text-gray-500 font-medium truncate">{dbData.chatRequest.message}</p>
               </div>
               <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                 <FiArrowRight size={16} />
               </div>
            </Link>
          )}

          {/* Incoming Video Call */}
          {dbData.callRequest && (
            <Link to="/astrologer/calls" className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100 flex items-center gap-4 hover:shadow-md hover:border-orange-200 transition-all group relative overflow-hidden block">
               <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-full blur-xl group-hover:bg-orange-500/10 transition-colors"></div>
               <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center shrink-0 border border-orange-100">
                 <FiVideo size={20} />
               </div>
               <div className="flex-1 min-w-0">
                 <h3 className="font-bold text-gray-800 text-sm">Video Call Request</h3>
                 <p className="text-xs text-gray-500 font-medium truncate">{dbData.callRequest.message}</p>
               </div>
               <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                 <FiArrowRight size={16} />
               </div>
            </Link>
          )}

        </div>
      </div>

      {/* Pooja Requests Highlight */}
      {dbData.upcomingPooja && (
        <div>
          <div className="flex justify-between items-end mb-3 px-1">
            <h2 className="font-bold text-gray-800 text-lg">Upcoming Pooja</h2>
            <Link to="/astrologer/pooja" className="text-xs text-orange-500 font-bold hover:underline">View All</Link>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all relative overflow-hidden">
             <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-full blur-xl"></div>
             <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center shrink-0 border border-orange-100">
               <GiFlowerPot size={22} />
             </div>
             <div className="flex-1">
               <h3 className="font-bold text-gray-800 text-sm">{dbData.upcomingPooja.name}</h3>
               <p className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5"><FiClock size={10}/> {dbData.upcomingPooja.time}</p>
             </div>
             <Link to="/astrologer/pooja" className="bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm shadow-orange-500/20">
               Details
             </Link>
          </div>
        </div>
      )}

      {/* Recent History Highlight */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 text-sm mb-3 border-b border-gray-50 pb-2">Recent Sessions</h2>
        <div className="space-y-3">
           {dbData.recentSessions && dbData.recentSessions.length > 0 ? dbData.recentSessions.map((session, i) => (
             <div key={i} className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-800 text-sm">{session.userId?.name || 'Unknown User'}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                    <span className="text-orange-500 font-bold">Chat</span> • {Math.floor((session.durationSeconds || 0) / 60)}m {(session.durationSeconds || 0) % 60}s
                  </p>
                </div>
                <span className="font-black text-gray-800 text-sm">₹{((session.amountDeducted || 0) * 0.7).toFixed(2)}</span>
             </div>
           )) : (
             <p className="text-sm text-gray-500">No recent sessions.</p>
           )}
        </div>
      </div>

      {/* Floating Notification Badge */}
      {incomingRequests && incomingRequests.length > 0 && (
        <div className="fixed bottom-24 right-4 z-50 animate-bounce-short">
          <Link 
            to={incomingRequests[0].type === 'chat' ? '/astrologer/chats' : '/astrologer/calls'}
            className="bg-red-500 hover:bg-red-600 transition-colors text-white rounded-full pl-4 pr-2 py-2 shadow-lg shadow-red-500/40 flex items-center gap-3 animate-pulse border-2 border-white"
          >
            <div className="flex flex-col">
              <span className="font-bold text-[13px] leading-tight">New Request!</span>
              <span className="text-[10px] font-medium opacity-90 leading-tight">Click to view</span>
            </div>
            <div className="bg-white text-red-500 font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-inner">
              {incomingRequests.length}
            </div>
          </Link>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
