import { useState, useEffect } from 'react';
import { FiImage, FiBell, FiTag, FiPlus, FiTrash2, FiSend, FiEdit, FiToggleLeft, FiToggleRight, FiX } from 'react-icons/fi';
import AdminFilterDropdown from '../../components/AdminFilterDropdown';
import * as adminApis from '../../api/adminApis';

const AdminContent = () => {
  const [activeTab, setActiveTab] = useState('Banners');

  // State
  const [banners, setBanners] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [newBanner, setNewBanner] = useState({ title: '', imageUrl: '', linkUrl: '', position: 0 });

  const [showCouponModal, setShowCouponModal] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: '', discountPercent: 0, maxDiscount: 0, expiryDate: '', usageLimit: 0 });

  useEffect(() => {
    if (activeTab === 'Banners') fetchBanners();
    if (activeTab === 'Coupons') fetchCoupons();
  }, [activeTab]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await adminApis.getAdminBanners();
      setBanners(res.data.data.banners || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await adminApis.getAdminCoupons();
      setCoupons(res.data.data.coupons || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Banner Actions ---
  const handleCreateBanner = async () => {
    try {
      await adminApis.createAdminBanner(newBanner);
      setShowBannerModal(false);
      setNewBanner({ title: '', imageUrl: '', linkUrl: '', position: 0 });
      fetchBanners();
    } catch (err) {
      console.error(err);
      alert('Failed to create banner');
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    try {
      await adminApis.deleteAdminBanner(id);
      fetchBanners();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBanner = async (banner) => {
    try {
      await adminApis.updateAdminBanner(banner._id, { isActive: !banner.isActive });
      fetchBanners();
    } catch (err) {
      console.error(err);
    }
  };

  // --- Coupon Actions ---
  const handleCreateCoupon = async () => {
    try {
      await adminApis.createAdminCoupon(newCoupon);
      setShowCouponModal(false);
      setNewCoupon({ code: '', discountPercent: 0, maxDiscount: 0, expiryDate: '', usageLimit: 0 });
      fetchCoupons();
    } catch (err) {
      console.error(err);
      alert('Failed to create coupon');
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await adminApis.deleteAdminCoupon(id);
      fetchCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleCoupon = async (coupon) => {
    try {
      await adminApis.updateAdminCoupon(coupon._id, { isActive: !coupon.isActive });
      fetchCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  const notifications = [
    { title: '🔮 Free Kundli Report!', body: 'Generate your free Kundli now and get personalized predictions.', audience: 'All Users', sent: 'May 26, 2026 • 2:00 PM', status: 'Delivered' },
    { title: '💰 50% OFF First Chat!', body: 'New users get 50% OFF on their first astrologer chat session.', audience: 'New Users', sent: 'May 25, 2026 • 10:00 AM', status: 'Delivered' },
  ];

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Content & CMS</h1>
        <p className="text-sm text-gray-400 font-medium mt-1">Manage homepage banners, coupon codes, and push notifications</p>
      </div>

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
            <button onClick={() => setShowBannerModal(true)} className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm shadow-orange-500/20 transition-all">
              <FiPlus size={14} /> Add Banner
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500 text-center py-10">Loading Banners...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {banners.map((banner) => (
                <div key={banner._id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden group hover:border-gray-200 transition-all">
                  <div className="h-36 bg-gray-100 relative">
                    {banner.imageUrl ? (
                      <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🔮</div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button onClick={() => handleToggleBanner(banner)} className="w-10 h-10 bg-white text-gray-700 rounded-xl flex items-center justify-center hover:scale-110 transition-transform shadow-sm" title="Toggle Active">
                        {banner.isActive ? <FiToggleRight size={16} className="text-green-500" /> : <FiToggleLeft size={16} className="text-gray-400" />}
                      </button>
                      <button onClick={() => handleDeleteBanner(banner._id)} className="w-10 h-10 bg-white text-red-500 rounded-xl flex items-center justify-center hover:scale-110 transition-transform shadow-sm">
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-bold text-gray-800">{banner.title}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${banner.isActive ? 'text-green-600 bg-green-50' : 'text-gray-500 bg-gray-100'}`}>
                        {banner.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">Position {banner.position}</span>
                    </div>
                  </div>
                </div>
              ))}
              {banners.length === 0 && <p className="col-span-full text-center text-sm text-gray-500 py-10">No banners found.</p>}
            </div>
          )}
        </div>
      )}

      {/* ═══ COUPONS TAB ═══ */}
      {activeTab === 'Coupons' && (
        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500 font-medium">Manage discount coupons for wallet recharges and sessions</p>
            <button onClick={() => setShowCouponModal(true)} className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm shadow-orange-500/20 transition-all">
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
                    <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading && <tr><td colSpan="5" className="py-8 text-center text-sm text-gray-500">Loading...</td></tr>}
                  {!loading && coupons.length === 0 && <tr><td colSpan="5" className="py-8 text-center text-sm text-gray-500">No coupons found.</td></tr>}
                  {!loading && coupons.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="py-4 px-6 font-black text-orange-500 tracking-wider text-sm font-mono">{c.code}</td>
                      <td className="py-4 px-6 font-bold text-sm text-gray-800">{c.discountPercent}% {c.maxDiscount > 0 ? `(Upto ₹${c.maxDiscount})` : ''}</td>
                      <td className="py-4 px-6 text-xs text-gray-500 font-medium">{new Date(c.expiryDate).toLocaleDateString()}</td>
                      <td className="py-4 px-6 text-xs text-gray-500 font-bold">{c.currentUsage} / {c.usageLimit > 0 ? c.usageLimit : 'Unlimited'}</td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button onClick={() => handleToggleCoupon(c)} className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors ${
                          c.isActive ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}>
                          {c.isActive ? <FiToggleRight size={14} /> : <FiToggleLeft size={14} />}
                          {c.isActive ? 'Active' : 'Inactive'}
                        </button>
                        <button onClick={() => handleDeleteCoupon(c._id)} className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors bg-red-50 text-red-500 hover:bg-red-100">
                          <FiTrash2 size={14} />
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
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <h2 className="font-bold text-gray-900">Send New Notification</h2>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Target Audience</label>
              <select className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                <option>All Users</option>
                <option>New Users</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Title</label>
              <input type="text" placeholder="e.g., 50% OFF!" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Message</label>
              <textarea rows="4" placeholder="..." className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none" />
            </div>
            <button className="w-full px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all text-sm">
              <FiSend size={14} /> Send Broadcast
            </button>
          </div>
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

      {/* --- Modals --- */}
      {showBannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Add New Banner</h3>
              <button onClick={() => setShowBannerModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Title</label>
                <input type="text" value={newBanner.title} onChange={e=>setNewBanner({...newBanner, title: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm focus:ring-2 focus:ring-orange-500/20" placeholder="Diwali Sale"/>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Image URL</label>
                <input type="text" value={newBanner.imageUrl} onChange={e=>setNewBanner({...newBanner, imageUrl: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm focus:ring-2 focus:ring-orange-500/20" placeholder="https://..."/>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Link URL (optional)</label>
                <input type="text" value={newBanner.linkUrl} onChange={e=>setNewBanner({...newBanner, linkUrl: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm focus:ring-2 focus:ring-orange-500/20" placeholder="/user/wallet"/>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Position (Order)</label>
                <input type="number" value={newBanner.position} onChange={e=>setNewBanner({...newBanner, position: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm focus:ring-2 focus:ring-orange-500/20"/>
              </div>
              <button onClick={handleCreateBanner} className="w-full py-3 mt-2 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors">Save Banner</button>
            </div>
          </div>
        </div>
      )}

      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Create New Coupon</h3>
              <button onClick={() => setShowCouponModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Coupon Code</label>
                <input type="text" value={newCoupon.code} onChange={e=>setNewCoupon({...newCoupon, code: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm uppercase focus:ring-2 focus:ring-orange-500/20" placeholder="WELCOME50"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Discount %</label>
                  <input type="number" value={newCoupon.discountPercent} onChange={e=>setNewCoupon({...newCoupon, discountPercent: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm focus:ring-2 focus:ring-orange-500/20"/>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Max Discount (₹)</label>
                  <input type="number" value={newCoupon.maxDiscount} onChange={e=>setNewCoupon({...newCoupon, maxDiscount: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm focus:ring-2 focus:ring-orange-500/20" placeholder="0 for no limit"/>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Expiry Date</label>
                <input type="date" value={newCoupon.expiryDate} onChange={e=>setNewCoupon({...newCoupon, expiryDate: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm focus:ring-2 focus:ring-orange-500/20"/>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Usage Limit</label>
                <input type="number" value={newCoupon.usageLimit} onChange={e=>setNewCoupon({...newCoupon, usageLimit: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm focus:ring-2 focus:ring-orange-500/20" placeholder="0 for unlimited"/>
              </div>
              <button onClick={handleCreateCoupon} className="w-full py-3 mt-2 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors">Create Coupon</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminContent;
