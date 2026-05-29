import { useState } from 'react';
import { FiSettings, FiPercent, FiCreditCard, FiBell, FiSave, FiToggleLeft, FiToggleRight, FiShield, FiGlobe, FiMail, FiPhone, FiSliders, FiMessageSquare, FiPhoneCall, FiVideo, FiDollarSign } from 'react-icons/fi';
import { GiFlowerPot } from 'react-icons/gi';
import AdminFilterDropdown from '../../components/AdminFilterDropdown';

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

  const tabs = [
    { id: 'General', icon: <FiSettings size={14} /> },
    { id: 'Commission', icon: <FiPercent size={14} /> },
    { id: 'Payments', icon: <FiCreditCard size={14} /> },
    { id: 'Notifications', icon: <FiBell size={14} /> },
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
              <input type="text" defaultValue="JyotishLink" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tagline</label>
              <input type="text" defaultValue="Your Trusted Astrology Platform" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Support Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input type="email" defaultValue="support@jyotishlink.com" className="w-full pl-9 pr-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Support Phone</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input type="tel" defaultValue="+91 1800 000 000" className="w-full pl-9 pr-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
              </div>
            </div>

            <button className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-sm shadow-orange-500/20 transition-all">
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
              <input type="number" defaultValue="50" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Free Chat Duration (minutes)</label>
              <input type="number" defaultValue="5" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
            </div>

            <button className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-sm shadow-orange-500/20 transition-all">
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
              { service: 'Chat Sessions', icon: <FiMessageSquare size={16} />, rate: 30, description: 'Platform commission on all chat session revenue', color: 'blue' },
              { service: 'Audio Calls', icon: <FiPhoneCall size={16} />, rate: 25, description: 'Platform commission on audio call revenue', color: 'green' },
              { service: 'Video Calls', icon: <FiVideo size={16} />, rate: 25, description: 'Platform commission on video call revenue', color: 'purple' },
              { service: 'E-Pooja Bookings', icon: <GiFlowerPot size={16} />, rate: 20, description: 'Platform commission on e-pooja bookings', color: 'orange' },
              { service: 'Store Products', icon: <FiDollarSign size={16} />, rate: 100, description: 'Full margin on store product sales', color: 'pink' },
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
                      defaultValue={item.rate}
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
            <button className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-sm shadow-orange-500/20 transition-all">
              <FiSave size={14} /> Save Commission Rates
            </button>
          </div>
        </div>
      )}

      {/* ═══ PAYMENTS TAB ═══ */}
      {activeTab === 'Payments' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <h3 className="font-bold text-gray-900 flex items-center gap-2"><FiCreditCard size={16} className="text-orange-500" /> Payment Gateway</h3>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Gateway Provider</label>
              <select className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                <option>Razorpay</option>
                <option>Paytm</option>
                <option>PhonePe</option>
                <option>Stripe</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">API Key</label>
              <input type="password" defaultValue="rzp_live_xxxxxxxxxxxxx" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Secret Key</label>
              <input type="password" defaultValue="xxxxxxxxxxxxxxxxxxxxx" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
            </div>

            <div className="bg-green-50 rounded-xl p-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-xs font-bold text-green-700">Payment gateway is active and connected</span>
            </div>

            <button className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-sm shadow-orange-500/20 transition-all">
              <FiSave size={14} /> Save Gateway Config
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <h3 className="font-bold text-gray-900 flex items-center gap-2"><FiDollarSign size={16} className="text-orange-500" /> Payout Settings</h3>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Payout Frequency</label>
              <select className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                <option>Weekly (Every Monday)</option>
                <option>Bi-weekly</option>
                <option>Monthly (1st of month)</option>
                <option>On Demand</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Minimum Payout (₹)</label>
              <input type="number" defaultValue="500" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Payout Method</label>
              <select className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                <option>Bank Transfer (NEFT/IMPS)</option>
                <option>UPI</option>
                <option>PayPal</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Hold Period (days)</label>
              <input type="number" defaultValue="7" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
              <p className="text-[10px] text-gray-400 font-medium">Days to hold earnings before making them available for payout</p>
            </div>

            <button className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-sm shadow-orange-500/20 transition-all">
              <FiSave size={14} /> Save Payout Settings
            </button>
          </div>
        </div>
      )}

      {/* ═══ NOTIFICATIONS TAB ═══ */}
      {activeTab === 'Notifications' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-2">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-3"><FiBell size={16} className="text-orange-500" /> Notification Channels</h3>
            <ToggleSwitch enabled={emailNotifications} onToggle={() => setEmailNotifications(!emailNotifications)} label="Email Notifications" />
            <ToggleSwitch enabled={smsNotifications} onToggle={() => setSmsNotifications(!smsNotifications)} label="SMS Notifications" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-2">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-3"><FiShield size={16} className="text-orange-500" /> Auto-Notification Triggers</h3>
            <ToggleSwitch enabled={orderConfirmation} onToggle={() => setOrderConfirmation(!orderConfirmation)} label="Order Confirmation" />
            <ToggleSwitch enabled={shippingUpdate} onToggle={() => setShippingUpdate(!shippingUpdate)} label="Shipping Updates" />
            <ToggleSwitch enabled={deliveryConfirmation} onToggle={() => setDeliveryConfirmation(!deliveryConfirmation)} label="Delivery Confirmation" />
            <ToggleSwitch enabled={newUserWelcome} onToggle={() => setNewUserWelcome(!newUserWelcome)} label="New User Welcome" />
            <ToggleSwitch enabled={astrologerApproval} onToggle={() => setAstrologerApproval(!astrologerApproval)} label="Astrologer Approval" />
            <ToggleSwitch enabled={lowStockAlert} onToggle={() => setLowStockAlert(!lowStockAlert)} label="Low Stock Alert (Admin)" />
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <h3 className="font-bold text-gray-900 flex items-center gap-2"><FiMail size={16} className="text-orange-500" /> Email Templates</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Welcome Email', status: 'Active', lastEdited: 'May 20, 2026' },
                { name: 'Order Confirmation', status: 'Active', lastEdited: 'May 18, 2026' },
                { name: 'Shipping Notification', status: 'Active', lastEdited: 'May 15, 2026' },
                { name: 'Delivery Confirmation', status: 'Active', lastEdited: 'May 15, 2026' },
                { name: 'Astrologer Approval', status: 'Active', lastEdited: 'May 10, 2026' },
                { name: 'Password Reset', status: 'Draft', lastEdited: 'May 05, 2026' },
              ].map((template, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors cursor-pointer group">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-gray-800">{template.name}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      template.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-gray-200 text-gray-500'
                    }`}>{template.status}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium">Last edited: {template.lastEdited}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
