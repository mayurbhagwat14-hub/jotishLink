import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiUsers, FiActivity, FiTrendingUp, FiArrowRight, FiArrowUp, FiArrowDown, FiMessageSquare, FiPhoneCall, FiVideo, FiStar, FiClock, FiShoppingCart, FiBox, FiPackage, FiUserPlus, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import { GiFlowerPot } from 'react-icons/gi';
import { Link } from 'react-router-dom';
import { fetchAdminDashboardThunk } from '../../store/slices/dashboardSlice';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { adminDashboard, loading, error } = useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchAdminDashboardThunk());
  }, [dispatch]);

  const dbData = adminDashboard || {
    metrics: {},
    liveSessions: [],
    recentOrders: [],
    quickStats: [],
    recentActivity: []
  };

  const getIcon = (type) => {
    switch (type) {
      case 'user': return <FiUserPlus size={14} />;
      case 'order': return <FiShoppingCart size={14} />;
      case 'astro': return <FiStar size={14} />;
      case 'delivery': return <FiCheckCircle size={14} />;
      case 'refund': return <FiAlertCircle size={14} />;
      default: return <FiActivity size={14} />;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'user': return 'bg-blue-50 text-blue-500';
      case 'order': return 'bg-orange-50 text-orange-500';
      case 'astro': return 'bg-yellow-50 text-yellow-600';
      case 'delivery': return 'bg-green-50 text-green-500';
      case 'refund': return 'bg-red-50 text-red-500';
      default: return 'bg-gray-50 text-gray-500';
    }
  };

  return (
    <div className="space-y-7 animate-fade-in">

      {/* ═══ WELCOME BANNER ═══ */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute right-20 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
        <div className="relative z-10">
          <p className="text-orange-100 text-xs font-bold uppercase tracking-widest mb-1">Admin Dashboard</p>
          <h1 className="text-2xl lg:text-3xl font-black mb-2">Welcome back, Super Admin 👋</h1>
          <p className="text-orange-100 text-sm font-medium max-w-xl">Here's what's happening on your platform today. You have <span className="text-white font-bold">{dbData.metrics?.pendingApprovals || 0} pending approvals</span> and <span className="text-white font-bold">{dbData.metrics?.pendingOrders || 0} new orders</span> to review.</p>
        </div>
      </div>

      {/* ═══ METRIC CARDS ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">

        {/* Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 group hover:border-orange-200 hover:shadow-sm transition-all">
          <div className="flex justify-between items-start mb-3">
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Total Revenue</p>
            <div className="w-9 h-9 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><FaRupeeSign size={14} /></div>
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-1">₹{dbData.metrics?.totalRevenue || 0}</h3>
          <span className="text-[11px] font-bold text-green-500 flex items-center gap-0.5"><FiArrowUp size={10} /> +14.5% vs last month</span>
        </div>

        {/* Users */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 group hover:border-blue-200 hover:shadow-sm transition-all">
          <div className="flex justify-between items-start mb-3">
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Registered Users</p>
            <div className="w-9 h-9 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><FiUsers size={16} /></div>
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-1">{dbData.metrics?.registeredUsers || '0'}</h3>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-green-500 flex items-center gap-0.5"><FiArrowUp size={10} /> +850 today</span>
            <Link to="/admin/users" className="text-gray-300 hover:text-gray-500 transition-colors"><FiArrowRight size={14} /></Link>
          </div>
        </div>

        {/* Astrologers */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 group hover:border-green-200 hover:shadow-sm transition-all">
          <div className="flex justify-between items-start mb-3">
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Online Astrologers</p>
            <div className="w-9 h-9 bg-green-50 text-green-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><FiActivity size={16} /></div>
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-1">{dbData.metrics?.onlineAstrologers || '0'}</h3>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400">12 in active sessions</span>
            <Link to="/admin/astrologers" className="text-gray-300 hover:text-gray-500 transition-colors"><FiArrowRight size={14} /></Link>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white rounded-2xl p-5 border border-orange-100 group hover:border-orange-200 hover:shadow-sm transition-all">
          <div className="flex justify-between items-start mb-3">
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Pending Orders</p>
            <div className="w-9 h-9 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center relative group-hover:scale-110 transition-transform">
              <FiShoppingCart size={16} />
              {dbData.metrics?.pendingOrders > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </div>
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-1">{dbData.metrics?.pendingOrders || 0}</h3>
          <Link to="/admin/orders" className="text-[11px] font-bold text-orange-500 flex items-center gap-0.5">Review now <FiArrowRight size={10} /></Link>
        </div>

        {/* Store Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 group hover:border-purple-200 hover:shadow-sm transition-all">
          <div className="flex justify-between items-start mb-3">
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Store Revenue</p>
            <div className="w-9 h-9 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><FiPackage size={16} /></div>
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-1">₹{dbData.metrics?.storeRevenue || 0}</h3>
          <span className="text-[11px] font-bold text-green-500 flex items-center gap-0.5"><FiArrowUp size={10} /> +18% vs last month</span>
        </div>
      </div>

      {/* ═══ LIVE SESSIONS + RECENT ORDERS ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Live Sessions — 3 columns */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <h2 className="font-bold text-gray-900">Live Sessions</h2>
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {dbData.liveSessions?.length || 0} Active
              </span>
            </div>
            <Link to="/admin/sessions" className="text-xs font-bold text-orange-500 hover:underline flex items-center gap-1">Monitor All <FiArrowRight size={12} /></Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(dbData.liveSessions || []).map((s, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-blue-600 overflow-hidden">
                      <img src={s.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.user || 'U')}&background=dbeafe&color=2563eb`} alt={s.user} className="w-full h-full object-cover" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-orange-600 overflow-hidden">
                      <img src={s.astrologerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.astrologer || 'A')}&background=ffedD5&color=f97316`} alt={s.astrologer} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{s.user} ↔ {s.astrologer}</p>
                    <p className="text-[10px] text-orange-500 font-bold flex items-center gap-1 mt-0.5">
                      {s.type === 'Video Call' ? <FiVideo size={12} /> : s.type === 'Chat' ? <FiMessageSquare size={12} /> : <FiPhoneCall size={12} />} {s.type} • {s.duration}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-green-600 bg-green-50 px-2.5 py-1 rounded-lg">₹{s.rate}/min</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders — 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs font-bold text-orange-500 hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(dbData.recentOrders || []).map((order) => (
              <div key={order.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-gray-800">{order.product}</p>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">{order.id} • {order.user}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-gray-900">₹{order.amount}</p>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    order.statusColor === 'green' ? 'text-green-600' :
                    order.statusColor === 'blue' ? 'text-blue-600' : 'text-orange-600'
                  }`}>{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ QUICK STATS + RECENT ACTIVITY ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Quick Stats */}
        <div className="lg:col-span-1">
          <div className="grid grid-cols-2 gap-4">
            {(dbData.quickStats || []).map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-gray-200 transition-all">
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">{stat.label}</p>
                <div className="flex items-end justify-between">
                  <h3 className="text-xl font-black text-gray-900">{stat.value}</h3>
                  <span className={`text-[11px] font-bold flex items-center gap-0.5 ${stat.up ? 'text-green-500' : 'text-red-500'}`}>
                    {stat.up ? <FiArrowUp size={10} /> : <FiArrowDown size={10} />} {stat.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {(dbData.recentActivity || []).map((activity, i) => (
              <div key={i} className="px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                <div className={`w-8 h-8 rounded-lg ${getColor(activity.type)} flex items-center justify-center shrink-0`}>
                  {getIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800">{activity.text}</p>
                  <p className="text-[11px] text-gray-400 font-medium truncate">{activity.detail}</p>
                </div>
                <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap shrink-0">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
