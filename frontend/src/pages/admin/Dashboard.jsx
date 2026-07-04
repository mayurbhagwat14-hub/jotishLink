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

  const getCardStyles = (color) => {
    switch (color) {
      case 'green': return { bg: 'bg-emerald-50/50', border: 'border-emerald-100', iconBg: 'bg-white', iconBorder: 'border-emerald-200', text: 'text-emerald-500' };
      case 'purple': return { bg: 'bg-purple-50/50', border: 'border-purple-100', iconBg: 'bg-white', iconBorder: 'border-purple-200', text: 'text-purple-500' };
      case 'yellow': return { bg: 'bg-amber-50/50', border: 'border-amber-100', iconBg: 'bg-white', iconBorder: 'border-amber-200', text: 'text-amber-500' };
      case 'blue': return { bg: 'bg-blue-50/50', border: 'border-blue-100', iconBg: 'bg-white', iconBorder: 'border-blue-200', text: 'text-blue-500' };
      case 'orange': return { bg: 'bg-orange-50/50', border: 'border-orange-100', iconBg: 'bg-white', iconBorder: 'border-orange-200', text: 'text-orange-500' };
      case 'cyan': return { bg: 'bg-cyan-50/50', border: 'border-cyan-100', iconBg: 'bg-white', iconBorder: 'border-cyan-200', text: 'text-cyan-500' };
      case 'pink': return { bg: 'bg-pink-50/50', border: 'border-pink-100', iconBg: 'bg-white', iconBorder: 'border-pink-200', text: 'text-pink-500' };
      default: return { bg: 'bg-gray-50/50', border: 'border-gray-100', iconBg: 'bg-white', iconBorder: 'border-gray-200', text: 'text-gray-500' };
    }
  };

  const overviewCards = [
    { label: 'Total Revenue', value: `₹${dbData.metrics?.totalRevenue || 0}`, desc: 'Overall platform revenue', icon: <FaRupeeSign size={16} />, color: 'green', link: '/admin/finance' },
    { label: 'Consultations', value: `₹${dbData.metrics?.chatRevenue || 0}`, desc: 'Chat & call revenue', icon: <FiMessageSquare size={16} />, color: 'purple', link: '/admin/finance' },
    { label: 'Store Sales', value: `₹${dbData.metrics?.storeRevenue || 0}`, desc: 'Total e-commerce volume', icon: <FiPackage size={16} />, color: 'yellow', link: '/admin/orders' },
    { label: 'Pooja Revenue', value: `₹${dbData.metrics?.poojaRevenue || 0}`, desc: 'Total pooja volume', icon: <GiFlowerPot size={16} />, color: 'cyan', link: '/admin/finance' },
    
    { label: 'Total Astrologers', value: dbData.metrics?.totalAstrologers || 0, desc: 'Approved astrologers', icon: <FiStar size={16} />, color: 'blue', link: '/admin/astrologers' },
    { label: 'Astro Requests', value: dbData.metrics?.pendingApprovals || 0, desc: 'Awaiting approval', icon: <FiClock size={16} />, color: 'orange', link: '/admin/astrologers' },
    { label: 'Online Astrologers', value: dbData.metrics?.onlineAstrologers || 0, desc: 'Currently online', icon: <FiActivity size={16} />, color: 'green', link: '/admin/astrologers' },
    { label: 'Total Users', value: dbData.metrics?.registeredUsers || 0, desc: 'Registered users', icon: <FiUsers size={16} />, color: 'purple', link: '/admin/users' },

    { label: 'Total Orders', value: dbData.metrics?.totalOrders || 0, desc: 'E-commerce orders', icon: <FiShoppingCart size={16} />, color: 'yellow', link: '/admin/orders' },
    { label: 'Pending Orders', value: dbData.metrics?.pendingOrders || 0, desc: 'Orders awaiting processing', icon: <FiClock size={16} />, color: 'pink', link: '/admin/orders' },
    { label: 'Completed Orders', value: dbData.metrics?.completedOrders || 0, desc: 'Successfully delivered', icon: <FiCheckCircle size={16} />, color: 'green', link: '/admin/orders' },
    { label: 'Store Profit', value: `₹${dbData.metrics?.storeProfit || 0}`, desc: 'Net e-commerce profit', icon: <FiTrendingUp size={16} />, color: 'cyan', link: '/admin/orders' },

    { label: 'Total Poojas', value: dbData.metrics?.totalPoojas || 0, desc: 'Total pooja bookings', icon: <GiFlowerPot size={16} />, color: 'purple', link: '/admin/finance' },
    { label: 'Pending Poojas', value: dbData.metrics?.pendingPoojas || 0, desc: 'Awaiting confirmation', icon: <FiClock size={16} />, color: 'yellow', link: '/admin/finance' },
    { label: 'Active Sessions', value: dbData.metrics?.liveSessionsCount || 0, desc: 'Ongoing chats & calls', icon: <FiPhoneCall size={16} />, color: 'blue', link: '/admin/sessions' },
    { label: 'Recent Activity', value: dbData.recentActivity?.length || 0, desc: 'Latest transactions', icon: <FiActivity size={16} />, color: 'green', link: '/admin/finance' },
  ];

  return (
    <div className="space-y-7">

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

      {/* ═══ OVERVIEW METRICS (4-Column Layout) ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {overviewCards.map((card, idx) => {
          const styles = getCardStyles(card.color);
          return (
            <Link key={idx} to={card.link} className={`rounded-2xl p-4 border ${styles.bg} ${styles.border} flex justify-between items-center hover:shadow-sm transition-all cursor-pointer group`}>
              <div>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">{card.label}</p>
                <h3 className="text-xl font-black text-gray-900 mb-0.5 group-hover:scale-105 origin-left transition-transform">{card.value}</h3>
                <span className="text-[10px] text-gray-400 font-medium">{card.desc}</span>
              </div>
              <div className={`w-10 h-10 ${styles.iconBg} border ${styles.iconBorder} ${styles.text} rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
                {card.icon}
              </div>
            </Link>
          );
        })}
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
            {dbData.liveSessions?.length > 0 ? (
              dbData.liveSessions.map((s, i) => (
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
              ))
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm font-medium">No live sessions currently</div>
            )}
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
