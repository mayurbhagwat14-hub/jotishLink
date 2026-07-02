import { useState, useEffect } from 'react';
import { FiSettings, FiPercent, FiCreditCard, FiBell, FiSave, FiLoader, FiToggleLeft, FiToggleRight, FiShield, FiGlobe, FiMail, FiPhone, FiSliders, FiMessageSquare, FiPhoneCall, FiVideo, FiStar, FiPlus, FiTrash2, FiFileText } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import * as adminApis from '../../api/adminApis';
import { GiFlowerPot } from 'react-icons/gi';
import AdminFilterDropdown from '../../components/AdminFilterDropdown';
import toast from 'react-hot-toast';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('General');
  const [savingSection, setSavingSection] = useState(null);
  const [isSavingCommission, setIsSavingCommission] = useState(false);
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
  
  const [generalSettings, setGeneralSettings] = useState({
    appName: 'JyotishLink',
    appLogo: '',
    tagline: 'Connect with the Stars',
    supportEmail: 'support@jyotishlink.com',
    supportPhone: '+91 1800 000 000',
    astrologerBannerMessage: 'Will I have love or arranged marriage?',
    minChatBalance: 50,
    freeChatDuration: 1,
    termsOfUse: '',
    privacyPolicy: ''
  });

  useEffect(() => {
    if (activeTab === 'General') {
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

  const handleSaveGeneral = async (section) => {
    try {
      if (section === 'info') {
        if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(generalSettings.supportEmail.trim().toLowerCase())) {
          return toast.error('Support email must be a valid @gmail.com address');
        }
        const strippedPhone = generalSettings.supportPhone.replace(/\D/g, '');
        if (strippedPhone.length < 10) {
          return toast.error('Support phone must be a valid number (at least 10 digits)');
        }
      }

      setSavingSection(section);
      const payload = { ...generalSettings, maintenanceMode };
      await adminApis.updateAdminSettings(payload);
      toast.success('Settings saved successfully');
      
      // Instantly update Redux state
      const { updateSettingsFromSave } = await import('../../store/slices/settingsSlice');
      const store = (await import('../../store/store')).default;
      store.dispatch(updateSettingsFromSave(payload));
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings');
    } finally {
      setSavingSection(null);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGeneralSettings(prev => ({ ...prev, appLogo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGeneralNumberChange = (key, value) => {
    if (value === '') {
      setGeneralSettings(prev => ({ ...prev, [key]: '' }));
      return;
    }
    const num = Number(value);
    if (isNaN(num) || num < 0) return; // prevent negatives and invalid numbers
    setGeneralSettings(prev => ({ ...prev, [key]: num }));
  };

  const handleCommissionChange = (key, value) => {
    // Prevent empty string from turning into 0 when user deletes
    if (value === '') {
      setGeneralSettings(prev => ({
        ...prev,
        commissionRates: {
          ...prev.commissionRates,
          [key]: ''
        }
      }));
      return;
    }
    
    const val = Number(value);
    if (isNaN(val) || val < 0) return; // prevent negatives and invalid numbers

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
      setIsSavingCommission(true);
      await adminApis.updateAdminSettings({ commissionRates: generalSettings.commissionRates });
      toast.success('Commission rates saved successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save commission rates');
    } finally {
      setIsSavingCommission(false);
    }
  };



  const tabs = [
    { id: 'General', icon: <FiSettings size={14} /> },
    { id: 'Commission', icon: <FiPercent size={14} /> },
    { id: 'Legal', icon: <FiFileText size={14} /> },
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
    <div className="space-y-6">

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
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">App Logo (Leave blank for default)</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                  {generalSettings.appLogo ? (
                    <img src={generalSettings.appLogo} alt="App Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="text-[10px] text-gray-400 font-bold">No Logo</span>
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoUpload}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100 transition-all cursor-pointer"
                />
              </div>
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

            <button onClick={() => handleSaveGeneral('info')} disabled={savingSection !== null} className={`px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-sm shadow-orange-500/20 transition-all ${savingSection === 'info' ? 'opacity-70 cursor-not-allowed' : ''}`}>
              {savingSection === 'info' ? <FiLoader size={14} className="animate-spin" /> : <FiSave size={14} />} 
              {savingSection === 'info' ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2"><FiSliders size={16} className="text-orange-500" /> Platform Controls</h3>


            <div className="space-y-1.5 pt-2">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Min Wallet Balance for Chat (₹)</label>
              <input type="number" min="0" value={generalSettings.minChatBalance ?? ''} onChange={e => handleGeneralNumberChange('minChatBalance', e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Question Banner (Astrologers Page)</label>
              <input type="text" value={generalSettings.astrologerBannerMessage ?? 'Will I have love or arranged marriage?'} onChange={e => setGeneralSettings({...generalSettings, astrologerBannerMessage: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Free Chat Duration (minutes)</label>
              <select value={generalSettings.freeChatDuration} onChange={e => handleGeneralNumberChange('freeChatDuration', e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                <option value={1}>1 minute</option>
                <option value={2}>2 minutes</option>
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
              </select>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-gray-100">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider text-orange-500">Store Flat Shipping Fee (₹)</label>
              <input type="number" min="0" value={generalSettings.flatShippingFee ?? ''} onChange={e => handleGeneralNumberChange('flatShippingFee', e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider text-orange-500">Store Default GST (%)</label>
              <input type="number" min="0" value={generalSettings.defaultGstPercent ?? ''} onChange={e => handleGeneralNumberChange('defaultGstPercent', e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
            </div>

            <button onClick={() => handleSaveGeneral('controls')} disabled={savingSection !== null} className={`px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-sm shadow-orange-500/20 transition-all ${savingSection === 'controls' ? 'opacity-70 cursor-not-allowed' : ''}`}>
              {savingSection === 'controls' ? <FiLoader size={14} className="animate-spin" /> : <FiSave size={14} />} 
              {savingSection === 'controls' ? 'Saving...' : 'Save Changes'}
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
          <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button onClick={handleSaveCommission} disabled={isSavingCommission} className={`px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-sm shadow-orange-500/20 transition-all ${isSavingCommission ? 'opacity-70 cursor-not-allowed' : ''}`}>
              {isSavingCommission ? <FiLoader size={14} className="animate-spin" /> : <FiSave size={14} />} 
              {isSavingCommission ? 'Saving...' : 'Save Commission Rates'}
            </button>
          </div>
        </div>
      )}

      {/* ═══ LEGAL TAB ═══ */}
      {activeTab === 'Legal' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <FiFileText size={16} className="text-orange-500" /> Legal Documents
          </h3>
          <p className="text-sm text-gray-400 font-medium">Manage the content for your platform's legal pages. This will be publicly visible to users.</p>

          <div className="space-y-4">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Terms & Conditions</label>
            <textarea 
              value={generalSettings.termsOfUse || ''} 
              onChange={e => setGeneralSettings({...generalSettings, termsOfUse: e.target.value})} 
              rows={8}
              placeholder="Enter Terms & Conditions content here..."
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20" 
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Privacy Policy</label>
            <textarea 
              value={generalSettings.privacyPolicy || ''} 
              onChange={e => setGeneralSettings({...generalSettings, privacyPolicy: e.target.value})} 
              rows={8}
              placeholder="Enter Privacy Policy content here..."
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20" 
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button onClick={() => handleSaveGeneral('legal')} disabled={savingSection !== null} className={`px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-sm shadow-orange-500/20 transition-all ${savingSection === 'legal' ? 'opacity-70 cursor-not-allowed' : ''}`}>
              {savingSection === 'legal' ? <FiLoader size={14} className="animate-spin" /> : <FiSave size={14} />} 
              {savingSection === 'legal' ? 'Saving...' : 'Save Legal Documents'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminSettings;
