import { useState, useEffect } from 'react';
import { FiSettings, FiPercent, FiCreditCard, FiBell, FiSave, FiToggleLeft, FiToggleRight, FiShield, FiGlobe, FiMail, FiPhone, FiSliders, FiMessageSquare, FiPhoneCall, FiVideo, FiStar, FiPlus, FiTrash2 } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import * as adminApis from '../../api/adminApis';
import { GiFlowerPot } from 'react-icons/gi';
import AdminFilterDropdown from '../../components/AdminFilterDropdown';
import toast from 'react-hot-toast';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('General');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [orderConfirmation, setOrderConfirmation] = useState(true);
  const [shippingUpdate, setShippingUpdate] = useState(true);
  const [deliveryConfirmation, setDeliveryConfirmation] = useState(true);
  const [newUserWelcome, setNewUserWelcome] = useState(true);
  const [astrologerApproval, setAstrologerApproval] = useState(true);
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [celebrities, setCelebrities] = useState([]);
  const [newCeleb, setNewCeleb] = useState({ name: '', role: '', img: '', quote: '', isActive: true });
  
  const [generalSettings, setGeneralSettings] = useState({
    appName: 'JyotishLink',
    tagline: 'Connect with the Stars',
    supportEmail: 'support@jyotishlink.com',
    supportPhone: '+91 1800 000 000',
    minChatBalance: 50,
    freeChatDuration: 1
  });

  useEffect(() => {
    if (activeTab === 'Celebrities') {
      fetchCelebrities();
    } else if (activeTab === 'General') {
      fetchGeneralSettings();
    }
  }, [activeTab]);

  const fetchGeneralSettings = async () => {
    try {
      const res = await adminApis.getAdminSettings();
      if (res.data?.data?.settings) {
        setGeneralSettings(prev => ({ ...prev, ...res.data.data.settings }));
        setMaintenanceMode(res.data.data.settings.maintenanceMode || false);
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  };

  const handleSaveGeneral = async () => {
    try {
      await adminApis.updateAdminSettings({ ...generalSettings, maintenanceMode });
      toast.success('Settings saved successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings');
    }
  };

  const handleCommissionChange = (key, value) => {
    // Prevent empty string from turning into 0 when user deletes
    const val = value === '' ? '' : Number(value);
    
    setGeneralSettings(prev => ({
      ...prev,
      commissionRates: {
        ...prev.commissionRates,
        [key]: val
      }
    }));
  };

  const handleSaveCommission = async () => {
    try {
      await adminApis.updateAdminSettings({ commissionRates: generalSettings.commissionRates });
      toast.success('Commission rates saved successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save commission rates');
    }
  };

  const fetchCelebrities = async () => {
    try {
      const res = await adminApis.getAdminCelebrities();
      setCelebrities(res.data.data.celebrities);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCeleb = async () => {
    if (!newCeleb.name || !newCeleb.role || !newCeleb.img) return toast.error("Fill all fields");
    try {
      await adminApis.createAdminCelebrity(newCeleb);
      setNewCeleb({ name: '', role: '', img: '', quote: '', isActive: true });
      fetchCelebrities();
      toast.success("Celebrity added successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add celebrity");
    }
  };

  const handleDeleteCeleb = async (id) => {
    try {
      await adminApis.deleteAdminCelebrity(id);
      fetchCelebrities();
    } catch (err) {
      console.error(err);
    }
  };

  const tabs = [
    { id: 'General', icon: <FiSettings size={14} /> },
    { id: 'Commission', icon: <FiPercent size={14} /> },
    { id: 'Celebrities', icon: <FiStar size={14} /> },
  ];

  const ToggleSwitch = ({ enabled, onToggle, label }) => (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <button
        onClick={onToggle}
        className={`transition-colors ${enabled ? 'text-green-500' : 'text-gray-300'}`}
      >
        {enabled ? <FiToggleRight size={28} /> : <FiToggleLeft size={28} />}
      </button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-400 font-medium mt-1">Configure platform settings, commission rates, and notifications</p>
      </div>

      {/* Dropdown Tabs */}
      <AdminFilterDropdown 
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId)}
      />

      {/* ═══ GENERAL TAB ═══ */}
      {activeTab === 'General' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <h3 className="font-bold text-gray-900 flex items-center gap-2"><FiGlobe size={16} className="text-orange-500" /> Platform Info</h3>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Platform Name</label>
              <input type="text" value={generalSettings.appName} onChange={e => setGeneralSettings({...generalSettings, appName: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tagline</label>
              <input type="text" value={generalSettings.tagline} onChange={e => setGeneralSettings({...generalSettings, tagline: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Support Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input type="email" value={generalSettings.supportEmail} onChange={e => setGeneralSettings({...generalSettings, supportEmail: e.target.value})} className="w-full pl-9 pr-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Support Phone</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input type="tel" value={generalSettings.supportPhone} onChange={e => setGeneralSettings({...generalSettings, supportPhone: e.target.value})} className="w-full pl-9 pr-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
              </div>
            </div>

            <button onClick={handleSaveGeneral} className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-sm shadow-orange-500/20 transition-all">
              <FiSave size={14} /> Save Changes
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2"><FiSliders size={16} className="text-orange-500" /> Platform Controls</h3>

            <ToggleSwitch
              enabled={maintenanceMode}
              onToggle={() => setMaintenanceMode(!maintenanceMode)}
              label="Maintenance Mode"
            />
            <div className={`rounded-xl p-3 text-xs font-medium transition-all ${maintenanceMode ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
              {maintenanceMode ? '⚠️ Platform is in maintenance mode. Users will see a maintenance page.' : 'Platform is live and accessible to all users.'}
            </div>

            <ToggleSwitch
              enabled={autoApprove}
              onToggle={() => setAutoApprove(!autoApprove)}
              label="Auto-approve Astrologer Applications"
            />

            <div className="space-y-1.5 pt-2">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Min Wallet Balance for Chat (₹)</label>
              <input type="number" value={generalSettings.minChatBalance} onChange={e => setGeneralSettings({...generalSettings, minChatBalance: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Free Chat Duration (minutes)</label>
              <select value={generalSettings.freeChatDuration} onChange={e => setGeneralSettings({...generalSettings, freeChatDuration: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                <option value={1}>1 minute</option>
                <option value={2}>2 minutes</option>
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
              </select>
            </div>

            <button onClick={handleSaveGeneral} className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-sm shadow-orange-500/20 transition-all">
              <FiSave size={14} /> Save Changes
            </button>
          </div>
        </div>
      )}

      {/* ═══ COMMISSION TAB ═══ */}
      {activeTab === 'Commission' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Platform Commission Rates</h3>
            <p className="text-xs text-gray-400 font-medium mt-1">Set the percentage the platform takes from each service type</p>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { id: 'chat', service: 'Chat Sessions', icon: <FiMessageSquare size={16} />, rate: 30, description: 'Platform commission on all chat session revenue', color: 'blue' },
              { id: 'audioCall', service: 'Audio Calls', icon: <FiPhoneCall size={16} />, rate: 30, description: 'Platform commission on audio call revenue', color: 'green' },
              { id: 'videoCall', service: 'Video Calls', icon: <FiVideo size={16} />, rate: 30, description: 'Platform commission on video call revenue', color: 'purple' },
              { id: 'pooja', service: 'E-Pooja Bookings', icon: <GiFlowerPot size={16} />, rate: 20, description: 'Platform commission on e-pooja bookings', color: 'orange' },
              { id: 'storeProduct', service: 'Store Products', icon: <FaRupeeSign size={14} />, rate: 10, description: 'Platform commission on store product sales', color: 'pink' },
            ].map((item, i) => (
              <div key={i} className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    item.color === 'blue' ? 'bg-blue-50 text-blue-500' :
                    item.color === 'green' ? 'bg-green-50 text-green-500' :
                    item.color === 'purple' ? 'bg-purple-50 text-purple-500' :
                    item.color === 'pink' ? 'bg-pink-50 text-pink-500' : 'bg-orange-50 text-orange-500'
                  }`}>{item.icon}</div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{item.service}</p>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">{item.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-24">
                    <input
                      type="number"
                      value={generalSettings.commissionRates?.[item.id] !== undefined ? generalSettings.commissionRates[item.id] : item.rate}
                      onChange={(e) => handleCommissionChange(item.id, e.target.value)}
                      min="0"
                      max="100"
                      className="w-full px-3 py-2.5 pr-8 rounded-xl bg-gray-50 border-0 text-sm font-black text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-right"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-5 border-t border-gray-100 flex justify-end">
            <button onClick={handleSaveCommission} className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-sm shadow-orange-500/20 transition-all">
              <FiSave size={14} /> Save Commission Rates
            </button>
          </div>
        </div>
      )}

      {/* ═══ CELEBRITIES TAB ═══ */}
      {activeTab === 'Celebrities' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <h3 className="font-bold text-gray-900 flex items-center gap-2"><FiStar size={16} className="text-orange-500" /> Add New Celebrity Review</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Celebrity Name</label>
                <input type="text" value={newCeleb.name} onChange={e => setNewCeleb({...newCeleb, name: e.target.value})} placeholder="e.g. Maniesh Bahl" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Role / Profession</label>
                <input type="text" value={newCeleb.role} onChange={e => setNewCeleb({...newCeleb, role: e.target.value})} placeholder="e.g. Bollywood" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Image URL</label>
                <input type="text" value={newCeleb.img} onChange={e => setNewCeleb({...newCeleb, img: e.target.value})} placeholder="https://..." className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
              </div>
              <div className="space-y-1.5 md:col-span-3">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Review / Quote</label>
                <textarea rows="3" value={newCeleb.quote} onChange={e => setNewCeleb({...newCeleb, quote: e.target.value})} placeholder="Write what the celebrity says about JyotishLink..." className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"></textarea>
              </div>
            </div>
            
            <button onClick={handleAddCeleb} className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-sm shadow-orange-500/20 transition-all">
              <FiPlus size={14} /> Add Celebrity
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Existing Celebrity Reviews</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Image</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Quote</th>
                    <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {celebrities.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-6">
                        <img src={c.img} alt={c.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                      </td>
                      <td className="py-3 px-6 font-bold text-sm text-gray-800">{c.name}</td>
                      <td className="py-3 px-6 text-sm text-gray-500">{c.role}</td>
                      <td className="py-3 px-6 text-[12px] text-gray-500 max-w-[250px] truncate">{c.quote || '-'}</td>
                      <td className="py-3 px-6 text-right">
                        <button onClick={() => handleDeleteCeleb(c._id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors inline-flex ml-auto">
                          <FiTrash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {celebrities.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-400 text-sm font-medium">No celebrities added yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
