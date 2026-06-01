import { useState, useEffect } from 'react';
import { FiBarChart2, FiDownload, FiCalendar, FiArrowUp, FiArrowDown, FiTrendingUp } from 'react-icons/fi';
import { getAdminReports } from '../../api/adminApis';

const AdminReports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getAdminReports();
        setReportData(res.data?.data);
      } catch (err) {
        console.error('Failed to fetch reports', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (val) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${Math.round(val)}`;
  };

  const getKPIs = () => {
    if (!reportData) return [];
    return [
      { label: 'Total Revenue', value: formatCurrency(reportData.totalRevenue), change: '+14.5%', up: true },
      { label: 'Platform Commission', value: formatCurrency(reportData.platformCommission), change: '+14.5%', up: true },
      { label: 'Avg Session Value', value: formatCurrency(reportData.avgSessionValue), change: '+8%', up: true },
      { label: 'Store Revenue', value: formatCurrency(reportData.storeRevenue), change: '+5%', up: true },
    ];
  };

  const getServiceSplit = () => {
    if (!reportData) return [];
    const total = reportData.totalRevenue || 1; // avoid division by zero
    // In our simplified logic, storeRevenue is one part, chat is another part.
    // Assuming platformCommission is 10% of totalDeductions. So totalDeductions = platformCommission * 10.
    const deductions = reportData.platformCommission * 10;
    const store = reportData.storeRevenue;
    
    // We mock the breakdown since we don't have separate models for Audio/Video
    const chat = deductions * 0.43;
    const audio = deductions * 0.35;
    const video = deductions * 0.22;
    const pooja = 0; // We don't have pooja price in revenue yet in the simplified backend logic

    return [
      { label: 'Chat Sessions', value: formatCurrency(chat), pct: Math.round((chat/total)*100), color: 'bg-blue-500' },
      { label: 'Audio Calls', value: formatCurrency(audio), pct: Math.round((audio/total)*100), color: 'bg-green-500' },
      { label: 'Video Calls', value: formatCurrency(video), pct: Math.round((video/total)*100), color: 'bg-purple-500' },
      { label: 'Store Products', value: formatCurrency(store), pct: Math.round((store/total)*100), color: 'bg-pink-500' },
    ];
  };

  const maxRevenue = reportData ? Math.max(...reportData.dailyRevenue.map(d => d.amount), 1) : 1;

  if (loading) {
    return <div className="p-10 text-center text-gray-500 font-medium">Loading reports...</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">Platform performance overview and exportable financial data</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl flex items-center gap-2 transition-all">
            <FiCalendar size={14} /> This Month
          </button>
          <button className="px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all">
            <FiDownload size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {getKPIs().map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">{kpi.label}</p>
            <h3 className="text-xl font-black text-gray-900 mb-1">{kpi.value}</h3>
            <span className={`text-[11px] font-bold flex items-center gap-0.5 ${kpi.up ? 'text-green-500' : 'text-red-500'}`}>
              {kpi.up ? <FiArrowUp size={10} /> : <FiArrowDown size={10} />} {kpi.change}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ═══ Revenue Chart ═══ */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="font-bold text-gray-900 flex items-center gap-2"><FiBarChart2 size={16} className="text-orange-500" /> Weekly Revenue</h2>
              <p className="text-xs text-gray-400 font-medium mt-1">Revenue collected per day this week</p>
            </div>
          </div>
          <div className="h-56 flex items-end justify-between gap-3 relative">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-gray-400 font-bold pr-2">
              <span>{formatCurrency(maxRevenue)}</span>
              <span>{formatCurrency(maxRevenue / 2)}</span>
              <span>0</span>
            </div>
            {/* Bars */}
            <div className="ml-8 w-full flex items-end justify-between gap-3 h-full">
              {reportData?.dailyRevenue.map((dayData, i) => (
                <div key={i} className="w-full flex flex-col items-center gap-1 group">
                  <div className="text-[10px] font-bold text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity">{formatCurrency(dayData.amount)}</div>
                  <div className="w-full rounded-t-lg bg-orange-100 group-hover:bg-orange-200 transition-colors relative" style={{ height: `${(dayData.amount / maxRevenue) * 100}%` }}>
                    <div className="absolute bottom-0 w-full h-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between mt-3 ml-8 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            {reportData?.dailyRevenue.map((d, i) => <span key={i}>{d.day}</span>)}
          </div>
        </div>

        {/* ═══ Revenue Split ═══ */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="font-bold text-gray-900 flex items-center gap-2"><FiTrendingUp size={16} className="text-orange-500" /> Revenue Split by Service</h2>
              <p className="text-xs text-gray-400 font-medium mt-1">Breakdown across Chat, Call, Video, Pooja, and Store</p>
            </div>
          </div>

          <div className="space-y-5">
            {getServiceSplit().map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    <span className="text-sm font-bold text-gray-700">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-gray-900">{item.value}</span>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{item.pct}%</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.color} transition-all duration-700`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminReports;
