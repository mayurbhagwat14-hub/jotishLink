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
    <div className="p-4 space-y-6 animate-fade-in mb-8">
      
      {/* Earnings Summary Card */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-400 to-orange-500 rounded-3xl p-6 text-white shadow-xl shadow-orange-500/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 group-hover:scale-110 transition-transform duration-700"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-orange-600/20 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex items-center gap-2 mb-2 opacity-90">
          <FiTrendingUp className="animate-pulse" />
          <p className="text-orange-50 font-semibold text-sm uppercase tracking-wider">Today's Earnings</p>
        </div>
        <div className="flex items-end justify-between relative z-10">
          <h2 className="text-4xl font-black tracking-tight drop-shadow-sm">
            <span className="text-orange-200 mr-1">₹</span>
            {dbData.totalEarnings?.toLocaleString() || '0'}
          </h2>
          <Link to="/astrologer/earnings" className="bg-white/20 hover:bg-white/30 border border-white/20 transition-all backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow-md hover:-translate-y-0.5">
             Details <FiArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Actionable Incoming Requests */}
      <div>
        <div className="flex justify-between items-center mb-4 px-1">
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-gray-800 text-lg">Action Required</h2>
            {dbData.pendingActionCount > 0 && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </div>
          <span className="bg-red-50 text-red-600 border border-red-100 text-[10px] font-black px-2.5 py-1 rounded-full animate-pulse-slow shadow-sm">
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
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4 px-1">
            <h2 className="font-extrabold text-gray-800 text-lg">Upcoming Pooja</h2>
            <Link to="/astrologer/pooja" className="text-xs text-orange-500 font-bold hover:underline flex items-center gap-1">
              View All <FiArrowRight size={12} />
            </Link>
          </div>
          
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all relative overflow-hidden">
             <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-full blur-xl"></div>
             <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center shrink-0 border border-orange-100">
               <GiFlowerPot size={22} />
             </div>
             <div className="flex-1">
               <h3 className="font-bold text-gray-800 text-sm">{dbData.upcomingPooja.name}</h3>
               <p className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5"><FiClock size={10}/> {dbData.upcomingPooja.time}</p>
             </div>
             <Link to="/astrologer/pooja" className="bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-orange-500/20">
               Details
             </Link>
          </div>
        </div>
      )}

      {/* Recent History Highlight */}
      <div className="bg-white rounded-3xl p-5 shadow-lg shadow-gray-100/50 border border-gray-50/50 relative overflow-hidden mt-8 mb-24">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl"></div>
        <div className="flex justify-between items-center mb-4 relative z-10 border-b border-gray-50 pb-3">
          <h2 className="font-extrabold text-gray-800 text-base">Recent Sessions</h2>
          <Link to="/astrologer/history" className="text-xs text-orange-500 font-bold hover:underline flex items-center gap-1">
            View All <FiArrowRight size={12} />
          </Link>
        </div>
        
        <div className="space-y-2 relative z-10">
           {dbData.recentSessions && dbData.recentSessions.length > 0 ? dbData.recentSessions.slice(0, 4).map((session, i) => (
             <div key={i} className="flex justify-between items-center group p-2 hover:bg-orange-50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center font-bold text-lg shadow-inner">
                      {session.userId?.name ? session.userId.name.charAt(0).toUpperCase() : 'U'}
                   </div>
                   <div>
                     <p className="font-bold text-gray-800 text-sm group-hover:text-orange-600 transition-colors">{session.userId?.name || 'Unknown User'}</p>
                     <p className="text-xs text-gray-500 flex items-center gap-1 font-medium mt-0.5">
                       <span className="text-orange-500 font-bold bg-orange-100 px-1.5 rounded-sm capitalize">{session.type || 'Chat'}</span> • {Math.floor((session.durationSeconds || 0) / 60)}m {(session.durationSeconds || 0) % 60}s
                     </p>
                   </div>
                </div>
                <span className="font-black text-gray-800 text-sm group-hover:text-orange-600 transition-colors">₹{((session.amountDeducted || 0) * 0.7).toFixed(2)}</span>
             </div>
           )) : (
             <div className="text-center py-6">
               <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2 text-gray-300">
                 <FiClock size={16} />
               </div>
               <p className="text-sm text-gray-500 font-medium">No recent sessions.</p>
             </div>
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
