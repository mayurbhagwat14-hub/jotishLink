import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiMessageSquare, FiPhoneCall, FiTrendingUp, FiVideo, FiArrowRight, FiClock, FiCheckCircle, FiBell, FiBriefcase, FiUser } from 'react-icons/fi';
import { GiWallet, GiFlowerPot } from 'react-icons/gi';
import { fetchAstrologerDashboardThunk } from '../../store/slices/dashboardSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { astrologerDashboard, loading, error } = useSelector((state) => state.dashboard);
  const { incomingRequests } = useSelector((state) => state.astrologer);
  const { user } = useSelector((state) => state.astrologerAuth);
  const { appName } = useSelector(state => state.settings) || { appName: 'JyotishLink' };

  useEffect(() => {
    dispatch(fetchAstrologerDashboardThunk());

    // Intercept back button to prevent breaking chronological flow
    window.history.pushState(null, null, window.location.pathname);
    const handlePopState = () => {
      window.history.pushState(null, null, window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [dispatch]);

  const dbData = astrologerDashboard || {};
  const activeSessionsCount = (incomingRequests?.length || 0) + (dbData.pendingActionCount || 0);

  return (
    <div className="p-4 space-y-6 mb-8 bg-gray-50 min-h-screen">
      
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-3xl p-6 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden flex items-center justify-between">
         <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl"></div>
         <div className="flex items-center gap-4 relative z-10">
           <div className="w-14 h-14 rounded-2xl bg-[#e55923]/50 border border-orange-300 flex items-center justify-center overflow-hidden shrink-0">
             {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
             ) : (
                <FiUser size={24} className="text-white" />
             )}
           </div>
           <div>
             <p className="text-orange-100 font-bold text-[10px] uppercase tracking-widest mb-1">WELCOME BACK</p>
             <h2 className="text-xl font-bold text-white leading-tight">{user?.name === 'Temp Astrologer' ? 'Astrologer' : (user?.name || 'Astrologer')}</h2>
             <p className="text-orange-100/80 text-xs mt-0.5">{appName}</p>
           </div>
         </div>
         <div className="relative z-10">
            <Link to="/astrologer/profile" className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 border border-white/20 flex items-center justify-center transition-colors relative">
               <FiArrowRight size={18} className="text-white" />
            </Link>
         </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Today's Earnings */}
        <Link to="/astrologer/session-earnings" className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col justify-center hover:shadow-md transition-shadow cursor-pointer active:scale-95 block">
          <div className="w-10 h-10 rounded-full bg-green-100 text-green-500 flex items-center justify-center mb-3">
             <GiWallet size={20} />
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Today's Earnings</p>
          <h3 className="text-xl font-black text-gray-800">₹{dbData.todayEarnings?.toLocaleString() || '0'}</h3>
        </Link>

        {/* Total Sessions */}
        <Link to="/astrologer/history" className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col justify-center hover:shadow-md transition-shadow block">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mb-3">
             <FiBriefcase size={20} />
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Sessions</p>
          <h3 className="text-xl font-black text-gray-800">{dbData.stats?.totalSessions || '0'}</h3>
        </Link>

        {/* Total Withdraw */}
        <Link to="/astrologer/earnings" className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col justify-center hover:shadow-md transition-shadow block">
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-3">
             <FiTrendingUp size={20} className="transform rotate-180" />
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Withdraw</p>
          <h3 className="text-xl font-black text-gray-800">₹{dbData.totalWithdraw?.toLocaleString() || '0'}</h3>
        </Link>

        {/* Total Earnings */}
        <Link to="/astrologer/earnings" className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col justify-center hover:shadow-md transition-shadow block">
          <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-500 flex items-center justify-center mb-3">
             <GiWallet size={20} />
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Earnings</p>
          <h3 className="text-xl font-black text-gray-800">₹{dbData.totalEarnings?.toLocaleString() || '0'}</h3>
        </Link>
      </div>

      {/* Recent Sessions */}
      <div className="mb-24 mt-6">
         <div className="flex justify-between items-center mb-4 px-1">
            <h2 className="font-extrabold text-gray-800 text-lg">Recent Sessions</h2>
            <Link to="/astrologer/history" className="bg-orange-100 text-[#e55923] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-orange-200 transition-colors">
              View All
            </Link>
         </div>

         <div className="space-y-4">
            {dbData.recentSessions && dbData.recentSessions.length > 0 ? dbData.recentSessions.slice(0, 4).map((session, i) => (
              <div key={i} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 relative overflow-hidden flex flex-col group hover:shadow-md transition-all">
                 <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-400"></div>
                 <div className="flex items-start justify-between pl-3">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#fa6830] flex items-center justify-center font-bold text-lg border border-orange-100">
                          {session.userId?.name ? session.userId.name.charAt(0).toUpperCase() : 'U'}
                       </div>
                       <div>
                         <p className="font-bold text-gray-800 text-sm flex items-center gap-2">
                           {session.userId?.name || 'Unknown User'}
                           {session.isFreeChat && (
                             <span className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-widest border border-green-200">Free</span>
                           )}
                         </p>
                         <div className="mt-1">
                           <span className="inline-block bg-green-50 text-green-600 border border-green-100 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                              Completed
                           </span>
                         </div>
                       </div>
                    </div>
                    <Link 
                      to={session.type === 'chat' ? `/astrologer/chat/${session._id}` : '/astrologer/history'} 
                      state={session.type === 'chat' ? { viewOnly: true, userName: session.userId?.name } : undefined}
                      className="w-8 h-8 rounded-full bg-gray-50 hover:bg-orange-50 text-gray-400 hover:text-[#fa6830] flex items-center justify-center transition-colors"
                    >
                       <FiArrowRight size={16} />
                    </Link>
                 </div>
                 
                 <div className="mt-4 pl-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                       {session.type?.includes('video') ? <FiVideo size={12} className="text-gray-400" /> : 
                        session.type?.includes('audio') ? <FiPhoneCall size={12} className="text-gray-400" /> : 
                        <FiMessageSquare size={12} className="text-gray-400" />}
                       <span className="capitalize">
                         {session.type === 'video_call' || session.type === 'video' ? 'Video Call' : 
                          session.type === 'audio_call' || session.type === 'audio' ? 'Audio Call' : 'Chat'}
                       </span> • {Math.floor((session.durationSeconds || 0) / 60)}m {(session.durationSeconds || 0) % 60}s
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                       <GiWallet size={12} className="text-gray-400" />
                       <span>₹{session.amount !== undefined ? session.amount : 0}</span>
                       <span className="text-[9px] text-gray-400 italic ml-1">(Platform fees deducted)</span>
                    </div>
                 </div>
              </div>
            )) : (
              <div className="text-center py-8 bg-white rounded-3xl border border-gray-100">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
                  <FiBriefcase size={20} />
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

