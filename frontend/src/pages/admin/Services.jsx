import { useState, useEffect } from 'react';
import { FiClock, FiBox, FiTruck, FiCheck, FiMoreHorizontal, FiX, FiCheckCircle } from 'react-icons/fi';
import { GiFlowerPot } from 'react-icons/gi';
import AdminFilterDropdown from '../../components/AdminFilterDropdown';
import { getAdminPoojas, getAdminOrders } from '../../api/adminApis';
import LogoLoader from '../../components/LogoLoader';
import { Link } from 'react-router-dom';

const AdminServices = () => {
  const [activeTab, setActiveTab] = useState('Poojas');
  const [poojas, setPoojas] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proofsModalPooja, setProofsModalPooja] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [poojasRes, ordersRes] = await Promise.all([
        getAdminPoojas(),
        getAdminOrders()
      ]);
      
      const poojasData = poojasRes.data?.data?.poojas || [];
      const ordersData = ordersRes.data?.data?.orders || ordersRes.data?.orders || [];

      setPoojas(poojasData.map(p => ({
        id: p._id.toString().slice(-6).toUpperCase(),
        user: p.userId?.name || 'Unknown User',
        pandit: p.astrologerId?.name || 'Unknown Pandit',
        type: p.poojaName || 'General Pooja',
        date: `${p.date} • ${p.time}`,
        amount: p.price || 0,
        status: p.status,
        proofMedia: p.proofMedia,
        proofNotes: p.proofNotes
      })));

      setOrders(ordersData.map(o => ({
        id: `#${o._id.toString().slice(-6).toUpperCase()}`,
        user: o.userId?.name || 'Unknown User',
        product: o.items && o.items.length > 0 ? o.items.map(i => i.productId?.name || 'Product').join(', ') : 'E-commerce Item(s)',
        amount: o.totalAmount || 0,
        date: new Date(o.createdAt).toLocaleDateString(),
        status: o.orderStatus ? (o.orderStatus.charAt(0).toUpperCase() + o.orderStatus.slice(1)) : 'Pending'
      })));
    } catch (err) {
      console.error('Failed to fetch services data', err);
    } finally {
      setLoading(false);
    }
  };

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
          <h3 className="text-2xl font-black text-gray-900">{poojas.filter(p => p.status === 'Accepted' || p.status === 'In Progress').length}</h3>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Completed Poojas</p>
          <h3 className="text-2xl font-black text-gray-900">{poojas.filter(p => p.status === 'Completed').length}</h3>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Orders In Transit</p>
          <h3 className="text-2xl font-black text-gray-900">{orders.filter(o => o.status === 'Shipped').length}</h3>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Store Revenue</p>
          <h3 className="text-2xl font-black text-gray-900">₹{orders.reduce((acc, o) => acc + o.amount, 0).toLocaleString()}</h3>
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
                {loading ? (
                  <tr><td colSpan="5" className="py-8"><div className="flex justify-center"><LogoLoader /></div></td></tr>
                ) : poojas.length === 0 ? (
                  <tr><td colSpan="5" className="py-8 text-center text-gray-400 text-sm">No poojas found</td></tr>
                ) : poojas.map((p) => (
                  <tr 
                    key={p.id} 
                    className={`hover:bg-gray-50/50 transition-colors ${p.status === 'Completed' ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (p.status === 'Completed' && p.proofMedia && p.proofMedia.length > 0) {
                        setProofsModalPooja(p);
                      }
                    }}
                  >
                    <td colSpan="5" className="p-0 border-0">
                      <div className="flex w-full items-center">
                        <div className="py-4 px-6 w-1/5">
                          <p className="font-bold text-sm text-gray-800 font-mono">PJ-{p.id}</p>
                          <p className="text-xs text-orange-500 font-bold mt-0.5 flex items-center gap-1"><GiFlowerPot size={12} /> {p.type}</p>
                        </div>
                        <div className="py-4 px-6 w-1/5">
                          <p className="text-sm font-bold text-gray-800">{p.user}</p>
                          <p className="text-[10px] text-gray-400 font-medium mt-0.5">By: {p.pandit}</p>
                        </div>
                        <div className="py-4 px-6 w-1/5 text-xs text-gray-500 font-medium flex items-center gap-1"><FiClock size={10} /> {p.date}</div>
                        <div className="py-4 px-6 w-1/5 text-sm font-black text-gray-900">₹{p.amount.toLocaleString()}</div>
                        <div className="py-4 px-6 w-1/5 flex items-center justify-between">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                            p.status === 'Completed' ? 'bg-green-50 text-green-600' : 
                            p.status === 'Accepted' || p.status === 'In Progress' ? 'bg-blue-50 text-blue-600' : 
                            p.status === 'Rejected' || p.status === 'Expired' || p.status === 'Refunded' ? 'bg-red-50 text-red-600' :
                            'bg-orange-50 text-orange-600'
                          }`}>
                            {p.status}
                          </span>
                          {p.status === 'Completed' && p.proofMedia && p.proofMedia.length > 0 && (
                            <button className="text-xs font-bold text-blue-600 hover:text-blue-800 px-3 py-1 bg-blue-50 rounded-lg hover:bg-blue-100 transition">View Proofs</button>
                          )}
                        </div>
                      </div>
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
                {loading ? (
                  <tr><td colSpan="7" className="py-8"><div className="flex justify-center"><LogoLoader /></div></td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan="7" className="py-8 text-center text-gray-400 text-sm">No orders found</td></tr>
                ) : orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-4 px-6 font-bold text-sm text-gray-800 font-mono">{order.id}</td>
                    <td className="py-4 px-6 text-sm font-bold text-gray-700 flex items-center gap-2"><FiBox size={12} className="text-gray-400" /> {order.product}</td>
                    <td className="py-4 px-6 text-sm font-bold text-gray-600">{order.user}</td>
                    <td className="py-4 px-6 text-sm font-black text-gray-900">₹{order.amount.toLocaleString()}</td>
                    <td className="py-4 px-6 text-xs font-medium text-gray-400">{order.date}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                        order.status === 'Delivered' ? 'bg-green-50 text-green-600' :
                        order.status === 'Shipped' ? 'bg-blue-50 text-blue-600' :
                        order.status === 'Cancelled' ? 'bg-red-50 text-red-500' :
                        order.status === 'Completed' ? 'bg-teal-50 text-teal-600' :
                        order.status === 'Processing' ? 'bg-yellow-50 text-yellow-700' :
                        'bg-orange-50 text-orange-600'
                      }`}>
                        {order.status === 'Shipped' && <FiTruck size={10} />}
                        {order.status === 'Delivered' && <FiCheck size={10} />}
                        {order.status === 'Cancelled' && <FiX size={10} />}
                        {order.status === 'Completed' && <FiCheckCircle size={10} />}
                        {order.status === 'Processing' && <FiBox size={10} />}
                        {order.status === 'Pending' && <FiClock size={10} />}
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link to="/admin/orders" className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg transition-colors text-[11px] font-bold whitespace-nowrap">
                        Manage Order
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Proofs Modal */}
      {proofsModalPooja && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Completion Proofs & Notes</h3>
                <p className="text-xs text-gray-500 font-medium mt-1">Pooja ID: PJ-{proofsModalPooja.id} • Pandit: {proofsModalPooja.pandit}</p>
              </div>
              <button 
                onClick={() => setProofsModalPooja(null)}
                className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
              >
                <FiX size={16} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {proofsModalPooja.proofNotes && (
                <div className="mb-6 bg-orange-50 border border-orange-100 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-orange-800 uppercase mb-2">Pandit's Note</h4>
                  <p className="text-sm text-gray-700 italic">"{proofsModalPooja.proofNotes}"</p>
                </div>
              )}
              
              <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Media Uploads ({proofsModalPooja.proofMedia.length})</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {proofsModalPooja.proofMedia.map((mediaUrl, idx) => {
                  const isVideo = mediaUrl.match(/\.(mp4|mov|avi|webm)$/i);
                  return (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 group">
                      {isVideo ? (
                        <video src={mediaUrl} controls className="w-full h-full object-cover"></video>
                      ) : (
                        <a href={mediaUrl} target="_blank" rel="noreferrer" className="block w-full h-full">
                          <img src={mediaUrl} alt="Proof" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setProofsModalPooja(null)}
                className="px-5 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServices;
