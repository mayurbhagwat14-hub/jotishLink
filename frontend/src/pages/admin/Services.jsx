import { useState } from 'react';
import { FiClock, FiBox, FiTruck, FiCheck, FiMoreHorizontal } from 'react-icons/fi';
import { GiFlowerPot } from 'react-icons/gi';
import AdminFilterDropdown from '../../components/AdminFilterDropdown';

const AdminServices = () => {
  const [activeTab, setActiveTab] = useState('Poojas');

  const poojas = [
    { id: 'PJ-102', user: 'Amit K.', pandit: 'Pandit Ravi Sharma', type: 'Grah Shanti Pooja', date: 'May 28, 2026 • 9:00 AM', amount: 1100, status: 'Scheduled' },
    { id: 'PJ-101', user: 'Sneha R.', pandit: 'Acharya Vinod', type: 'Navgrah Pooja', date: 'May 27, 2026 • 6:30 AM', amount: 800, status: 'Completed' },
    { id: 'PJ-100', user: 'Vikram S.', pandit: 'Pandit Kedar Nath', type: 'Maha Mrityunjaya', date: 'May 26, 2026 • 7:00 AM', amount: 2100, status: 'Completed' },
  ];

  const orders = [
    { id: 'ORD-554', user: 'Vikram S.', product: 'Rudraksha Mala (5 Mukhi)', amount: 399, date: 'May 27, 2026', status: 'Processing' },
    { id: 'ORD-553', user: 'Ankita V.', product: 'Yellow Sapphire Ring', amount: 1299, date: 'May 25, 2026', status: 'Shipped' },
    { id: 'ORD-552', user: 'Priya M.', product: 'Raw Pyrite Bracelet', amount: 499, date: 'May 24, 2026', status: 'Delivered' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Services & Orders</h1>
        <p className="text-sm text-gray-400 font-medium mt-1">Manage E-Pooja bookings from the Pandit Booking tab and physical product orders from JyotishLink Store</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Active Poojas</p>
          <h3 className="text-2xl font-black text-gray-900">1</h3>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Completed Poojas</p>
          <h3 className="text-2xl font-black text-gray-900">2</h3>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Orders In Transit</p>
          <h3 className="text-2xl font-black text-gray-900">1</h3>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Store Revenue</p>
          <h3 className="text-2xl font-black text-gray-900">₹2,197</h3>
        </div>
      </div>

      {/* Dropdown Tabs */}
      <AdminFilterDropdown 
        tabs={[
          { id: 'Poojas', label: 'E-Poojas', icon: <GiFlowerPot size={14} /> },
          { id: 'Orders', label: 'Store Orders', icon: <FiBox size={14} /> }
        ]}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId)}
      />

      {/* ═══ POOJAS TAB ═══ */}
      {activeTab === 'Poojas' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Booking</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">User → Pandit</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Schedule</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {poojas.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-sm text-gray-800 font-mono">{p.id}</p>
                      <p className="text-xs text-orange-500 font-bold mt-0.5 flex items-center gap-1"><GiFlowerPot size={12} /> {p.type}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm font-bold text-gray-800">{p.user}</p>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">By: {p.pandit}</p>
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-500 font-medium flex items-center gap-1"><FiClock size={10} /> {p.date}</td>
                    <td className="py-4 px-6 text-sm font-black text-gray-900">₹{p.amount.toLocaleString()}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        p.status === 'Completed' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ ORDERS TAB ═══ */}
      {activeTab === 'Orders' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Order ID</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-4 px-6 font-bold text-sm text-gray-800 font-mono">{order.id}</td>
                    <td className="py-4 px-6 text-sm font-bold text-gray-700 flex items-center gap-2"><FiBox size={12} className="text-gray-400" /> {order.product}</td>
                    <td className="py-4 px-6 text-sm font-bold text-gray-600">{order.user}</td>
                    <td className="py-4 px-6 text-sm font-black text-gray-900">₹{order.amount}</td>
                    <td className="py-4 px-6 text-xs font-medium text-gray-400">{order.date}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                        order.status === 'Delivered' ? 'bg-green-50 text-green-600' :
                        order.status === 'Shipped' ? 'bg-blue-50 text-blue-600' :
                        'bg-orange-50 text-orange-600'
                      }`}>
                        {order.status === 'Shipped' && <FiTruck size={10} />}
                        {order.status === 'Delivered' && <FiCheck size={10} />}
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors text-[11px] font-bold opacity-0 group-hover:opacity-100">
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServices;
