import { useState } from 'react';
import { FiImage, FiBell, FiTag, FiPlus, FiTrash2, FiSend, FiEdit, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import AdminFilterDropdown from '../../components/AdminFilterDropdown';

const AdminContent = () => {
  const [activeTab, setActiveTab] = useState('Banners');

  const coupons = [
    { code: 'WELCOME50', discount: '50% OFF (Upto ₹100)', expiry: 'Dec 31, 2026', usage: '1,452 / Unlimited', active: true },
    { code: 'FIRSTCALL', discount: 'Flat ₹50 OFF on Audio Call', expiry: 'Aug 31, 2026', usage: '320 / 1000', active: true },
    { code: 'DIWALI20', discount: 'Flat ₹200 OFF', expiry: 'Oct 30, 2026', usage: '0 / 500', active: false },
  ];

  const notifications = [
    { title: '🔮 Free Kundli Report!', body: 'Generate your free Kundli now and get personalized predictions.', audience: 'All Users', sent: 'May 26, 2026 • 2:00 PM', status: 'Delivered' },
    { title: '💰 50% OFF First Chat!', body: 'New users get 50% OFF on their first astrologer chat session.', audience: 'New Users', sent: 'May 25, 2026 • 10:00 AM', status: 'Delivered' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Content & CMS</h1>
        <p className="text-sm text-gray-400 font-medium mt-1">Manage homepage banners, coupon codes, and push notifications that users see in the app</p>
      </div>

      {/* Dropdown Tabs */}
      <AdminFilterDropdown 
        tabs={[
          { id: 'Banners', icon: <FiImage size={14} /> },
          { id: 'Coupons', icon: <FiTag size={14} /> },
          { id: 'Push Notifications', icon: <FiBell size={14} /> },
        ]}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId)}
      />

      {/* ═══ BANNERS TAB ═══ */}
      {activeTab === 'Banners' && (
        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500 font-medium">These banners appear on the User home screen carousel</p>
            <button className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm shadow-orange-500/20 transition-all">
              <FiPlus size={14} /> Upload Banner
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((banner) => (
              <div key={banner} className="bg-white border border-gray-100 rounded-2xl overflow-hidden group hover:border-gray-200 transition-all">
                <div className="h-36 bg-gradient-to-br from-orange-100 to-orange-50 relative flex items-center justify-center">
                  <span className="text-4xl">🔮</span>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button className="w-10 h-10 bg-white text-gray-700 rounded-xl flex items-center justify-center hover:scale-110 transition-transform shadow-sm"><FiEdit size={16} /></button>
                    <button className="w-10 h-10 bg-white text-red-500 rounded-xl flex items-center justify-center hover:scale-110 transition-transform shadow-sm"><FiTrash2 size={16} /></button>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm font-bold text-gray-800">Promo Banner {banner}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase tracking-wider">Active</span>
                    <span className="text-[10px] text-gray-400 font-medium">Position {banner}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ COUPONS TAB ═══ */}
      {activeTab === 'Coupons' && (
        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500 font-medium">Manage discount coupons for wallet recharges and sessions</p>
            <button className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm shadow-orange-500/20 transition-all">
              <FiPlus size={14} /> Create Coupon
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Code</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Discount</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Expiry</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Usage</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {coupons.map((c) => (
                    <tr key={c.code} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="py-4 px-6 font-black text-orange-500 tracking-wider text-sm font-mono">{c.code}</td>
                      <td className="py-4 px-6 font-bold text-sm text-gray-800">{c.discount}</td>
                      <td className="py-4 px-6 text-xs text-gray-500 font-medium">{c.expiry}</td>
                      <td className="py-4 px-6 text-xs text-gray-500 font-bold">{c.usage}</td>
                      <td className="py-4 px-6 text-right">
                        <button className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors ${
                          c.active ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}>
                          {c.active ? <FiToggleRight size={14} /> : <FiToggleLeft size={14} />}
                          {c.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PUSH NOTIFICATIONS TAB ═══ */}
      {activeTab === 'Push Notifications' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Send Form — 2 cols */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <h2 className="font-bold text-gray-900">Send New Notification</h2>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Target Audience</label>
              <select className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                <option>All Users</option>
                <option>New Users (Joined last 7 days)</option>
                <option>Inactive Users (No activity {'>'} 30 days)</option>
                <option>Premium Users (Wallet {'>'} ₹500)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Title</label>
              <input type="text" placeholder="e.g., 50% OFF on your next Tarot reading!" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Message Body</label>
              <textarea rows="4" placeholder="Enter the push notification message..." className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none" />
            </div>

            <button className="w-full px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all text-sm">
              <FiSend size={14} /> Send Broadcast
            </button>
          </div>

          {/* History — 3 cols */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Recent Broadcasts</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {notifications.map((n, i) => (
                <div key={i} className="px-6 py-5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-gray-800 mb-1">{n.title}</h3>
                      <p className="text-xs text-gray-500 font-medium leading-relaxed">{n.body}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{n.audience}</span>
                        <span className="text-[10px] text-gray-400 font-medium">{n.sent}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-lg uppercase tracking-wider shrink-0">{n.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default AdminContent;
