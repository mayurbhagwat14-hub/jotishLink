import { useState, useEffect } from 'react';
import { FiImage, FiBell, FiTag, FiPlus, FiTrash2, FiSend, FiEdit, FiToggleLeft, FiToggleRight, FiX, FiCheck, FiLoader } from 'react-icons/fi';
import AdminFilterDropdown from '../../components/AdminFilterDropdown';
import * as adminApis from '../../api/adminApis';
import { toast } from 'react-hot-toast';
import LogoLoader from '../../components/LogoLoader';

const AdminContent = () => {
  const [activeTab, setActiveTab] = useState('Banners');

  // State
  const [banners, setBanners] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [isSubmittingBanner, setIsSubmittingBanner] = useState(false);
  const [deleteConfirmBanner, setDeleteConfirmBanner] = useState(null);
  const [isDeletingBanner, setIsDeletingBanner] = useState(false);
  const [newBanner, setNewBanner] = useState({ imageUrl: '', pages: ['Home'] });

  const [showCouponModal, setShowCouponModal] = useState(false);
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: '', discountPercent: 0, maxDiscount: 0, expiryDate: '', usageLimit: 0 });

  const [broadcastData, setBroadcastData] = useState({ title: '', message: '', audience: 'All Users' });
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [notifications, setNotifications] = useState([
    { title: '🔮 Free Kundli Report!', body: 'Generate your free Kundli now and get personalized predictions.', audience: 'All Users', sent: 'May 26, 2026 • 2:00 PM', status: 'Delivered' },
    { title: '💰 50% OFF First Chat!', body: 'New users get 50% OFF on their first astrologer chat session.', audience: 'New Users', sent: 'May 25, 2026 • 10:00 AM', status: 'Delivered' },
  ]);
  const [deleteConfirmCoupon, setDeleteConfirmCoupon] = useState(null);
  const [isDeletingCoupon, setIsDeletingCoupon] = useState(false);

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
    if (isSubmittingBanner) return;
    try {
      if (!newBanner.imageUrl) {
        toast.error('Please select an image for the banner');
        return;
      }
      setIsSubmittingBanner(true);
      await adminApis.createAdminBanner(newBanner);
      setShowBannerModal(false);
      setNewBanner({ imageUrl: '', pages: ['Home'] });
      fetchBanners();
    } catch (err) {
      console.error(err);
      toast.error('Failed to create banner');
    } finally {
      setIsSubmittingBanner(false);
    }
  };

  const handleBannerImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Use functional state update to prevent stale closures
        setNewBanner((prev) => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteBanner = async () => {
    if (!deleteConfirmBanner || isDeletingBanner) return;
    try {
      setIsDeletingBanner(true);
      await adminApis.deleteAdminBanner(deleteConfirmBanner._id);
      setDeleteConfirmBanner(null);
      fetchBanners();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete banner');
    } finally {
      setIsDeletingBanner(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastData.title || !broadcastData.message) return;
    try {
      setIsSendingBroadcast(true);
      await adminApis.sendBroadcast(broadcastData);
      
      // Add to local UI array
      setNotifications([{
        title: broadcastData.title,
        body: broadcastData.message,
        audience: broadcastData.audience,
        sent: 'Just now',
        status: 'Delivered'
      }, ...notifications]);

      setBroadcastData({ title: '', message: '', audience: 'All Users' });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingBroadcast(false);
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

  const handleCouponNumberChange = (key, value) => {
    if (value === '') {
      setNewCoupon(prev => ({ ...prev, [key]: '' }));
      return;
    }
    const num = Number(value);
    if (isNaN(num) || num < 0) return;
    setNewCoupon(prev => ({ ...prev, [key]: num }));
  };

  // --- Coupon Actions ---
  const handleCreateCoupon = async () => {
    try {
      setIsCreatingCoupon(true);
      await adminApis.createAdminCoupon(newCoupon);
      setShowCouponModal(false);
      setNewCoupon({ code: '', discountPercent: 0, maxDiscount: 0, expiryDate: '', usageLimit: 0 });
      fetchCoupons();
    } catch (err) {
      console.error(err);
      toast.error('Failed to create coupon');
    } finally {
      setIsCreatingCoupon(false);
    }
  };

  const handleDeleteCoupon = async () => {
    if (!deleteConfirmCoupon || isDeletingCoupon) return;
    try {
      setIsDeletingCoupon(true);
      await adminApis.deleteAdminCoupon(deleteConfirmCoupon._id);
      setDeleteConfirmCoupon(null);
      fetchCoupons();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete coupon');
    } finally {
      setIsDeletingCoupon(false);
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

          {loading && <div className="flex justify-center py-10"><LogoLoader /></div>}
          {!loading && (
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
                      <button onClick={() => setDeleteConfirmBanner(banner)} className="w-10 h-10 bg-white text-red-500 rounded-xl flex items-center justify-center hover:scale-110 transition-transform shadow-sm">
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${banner.isActive ? 'text-green-600 bg-green-50' : 'text-gray-500 bg-gray-100'}`}>
                        {banner.isActive ? 'Active' : 'Inactive'}
                      </span>
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
                  {loading && <tr><td colSpan="5" className="py-8"><div className="flex justify-center"><LogoLoader /></div></td></tr>}
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
                        <button onClick={() => setDeleteConfirmCoupon(c)} className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors bg-red-50 text-red-500 hover:bg-red-100">
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
              <select 
                value={broadcastData.audience}
                onChange={e => setBroadcastData({...broadcastData, audience: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option>All Users</option>
                <option>All Astrologers</option>
                <option>All Users & Astrologers</option>
                <option>New Users</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Title</label>
              <input 
                type="text" 
                value={broadcastData.title}
                onChange={e => setBroadcastData({...broadcastData, title: e.target.value})}
                placeholder="e.g., 50% OFF!" 
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Message</label>
              <textarea 
                rows="4" 
                value={broadcastData.message}
                onChange={e => setBroadcastData({...broadcastData, message: e.target.value})}
                placeholder="..." 
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none" 
              />
            </div>
            <button 
              onClick={handleSendBroadcast}
              disabled={isSendingBroadcast}
              className={`w-full px-6 py-3.5 ${isSendingBroadcast ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 active:scale-[0.98]'} text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all text-sm`}
            >
              {isSendingBroadcast ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <FiSend size={14} /> Send Broadcast
                </>
              )}
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
              <button 
                onClick={() => !isSubmittingBanner && setShowBannerModal(false)} 
                className={`${isSubmittingBanner ? 'opacity-30 cursor-not-allowed' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <FiX size={20}/>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Banner Image</label>
                <label className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-orange-300 transition-colors cursor-pointer block relative overflow-hidden group">
                  <input type="file" accept="image/*" className="hidden" onChange={handleBannerImageUpload} />
                  {newBanner.imageUrl ? (
                    <div className="absolute inset-0 w-full h-full">
                      <img src={newBanner.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white font-bold text-sm">Change Image</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <FiImage size={32} className="text-gray-300 mx-auto mb-3" />
                      <p className="text-sm font-bold text-gray-600">Click to upload banner image</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                    </>
                  )}
                </label>
              </div>

              {/* Pages Selection */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Display On Pages</label>
                <div className="flex gap-4">
                  {['Home', 'Store'].map(page => (
                    <label key={page} className="flex items-center gap-2 cursor-pointer">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${newBanner.pages?.includes(page) ? 'bg-orange-500 border-orange-500' : 'bg-white border-gray-300'}`}>
                        {newBanner.pages?.includes(page) && <FiCheck size={12} className="text-white" />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={newBanner.pages?.includes(page)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          const currentPages = newBanner.pages || [];
                          if (isChecked) {
                            setNewBanner({ ...newBanner, pages: [...currentPages, page] });
                          } else {
                            if (currentPages.length > 1) {
                              setNewBanner({ ...newBanner, pages: currentPages.filter(p => p !== page) });
                            } else {
                              toast.error('At least one page must be selected');
                            }
                          }
                        }}
                      />
                      <span className="text-sm font-bold text-gray-700">{page}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleCreateBanner} 
                disabled={isSubmittingBanner}
                className={`w-full py-3 mt-2 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${isSubmittingBanner ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 active:scale-[0.98]'}`}
              >
                {isSubmittingBanner ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Uploading Image...
                  </>
                ) : (
                  'Save Banner'
                )}
              </button>
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
                  <input type="number" min="0" value={newCoupon.discountPercent} onChange={e=>handleCouponNumberChange('discountPercent', e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm focus:ring-2 focus:ring-orange-500/20"/>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Max Discount (₹)</label>
                  <input type="number" min="0" value={newCoupon.maxDiscount} onChange={e=>handleCouponNumberChange('maxDiscount', e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm focus:ring-2 focus:ring-orange-500/20" placeholder="0 for no limit"/>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Expiry Date</label>
                <input type="date" value={newCoupon.expiryDate} onChange={e=>setNewCoupon({...newCoupon, expiryDate: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm focus:ring-2 focus:ring-orange-500/20"/>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Usage Limit</label>
                <input type="number" min="0" value={newCoupon.usageLimit} onChange={e=>handleCouponNumberChange('usageLimit', e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm focus:ring-2 focus:ring-orange-500/20" placeholder="0 for unlimited"/>
              </div>
              <button onClick={handleCreateCoupon} disabled={isCreatingCoupon} className={`w-full py-3 mt-2 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ${isCreatingCoupon ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}>
                {isCreatingCoupon ? <FiLoader size={16} className="animate-spin" /> : null}
                {isCreatingCoupon ? 'Creating...' : 'Create Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DELETE CONFIRMATION MODAL ═══ */}
      {deleteConfirmBanner && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" onClick={() => setDeleteConfirmBanner(null)}>
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-scale-in flex flex-col p-8 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
              <FiTrash2 size={32} className="text-red-500" />
            </div>
            
            <h3 className="text-2xl font-black text-gray-900 mb-2">Delete Banner?</h3>
            <p className="text-gray-500 font-medium mb-8">
              Are you sure you want to permanently delete this banner from the home screen carousel? This action cannot be undone.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setDeleteConfirmBanner(null)}
                className="flex-1 py-3.5 px-6 rounded-xl font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors active:scale-[0.98]"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteBanner}
                disabled={isDeletingBanner}
                className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-white transition-all active:scale-[0.98] flex items-center justify-center ${isDeletingBanner ? 'bg-red-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20'}`}
              >
                {isDeletingBanner ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  'Yes, Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ═══ DELETE COUPON CONFIRMATION MODAL ═══ */}
      {deleteConfirmCoupon && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" onClick={() => setDeleteConfirmCoupon(null)}>
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-scale-in flex flex-col p-8 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
              <FiTrash2 size={32} className="text-red-500" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Delete Coupon?</h3>
            <p className="text-gray-500 font-medium mb-8">
              Are you sure you want to permanently delete this coupon? This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setDeleteConfirmCoupon(null)}
                className="flex-1 py-3.5 px-6 rounded-xl font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors active:scale-[0.98]"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteCoupon}
                disabled={isDeletingCoupon}
                className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-white transition-all active:scale-[0.98] flex items-center justify-center ${isDeletingCoupon ? 'bg-red-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20'}`}
              >
                {isDeletingCoupon ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  'Yes, Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContent;
