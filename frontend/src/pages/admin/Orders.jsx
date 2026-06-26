import { useState, useEffect } from 'react';
import { FiSearch, FiChevronDown, FiChevronLeft, FiChevronRight, FiTruck, FiCheck, FiX, FiPackage, FiMapPin, FiClock, FiEye, FiMoreHorizontal, FiFilter, FiDownload, FiAlertCircle, FiCheckCircle, FiLoader } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import AdminFilterDropdown from '../../components/AdminFilterDropdown';
import { getAdminOrders, updateAdminOrderStatus, processCancelRequest as processCancelRequestApi, pushOrderToShiprocket, generateOrderAWB, getShiprocketOrderDetails } from '../../api/adminApis';
import { useGlobalSocket } from '../../hooks/useGlobalSocket';
const AdminOrders = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showShipModal, setShowShipModal] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingProvider, setShippingProvider] = useState('DHL Express');
  const [isCustomProvider, setIsCustomProvider] = useState(false);
  const [customProviderName, setCustomProviderName] = useState('');
  const [successToast, setSuccessToast] = useState(null);
  const [shiprocketDetails, setShiprocketDetails] = useState(null);
  const itemsPerPage = 8;
  const socket = useGlobalSocket();

  useEffect(() => {
    if (!socket) return;
    const handleOrderUpdate = (data) => {
      if (!data || !data.order) return;
      const updatedBackendOrder = data.order;
      setOrders(prev => prev.map(o => {
        if (o.dbId === updatedBackendOrder._id) {
          return {
            ...o,
            status: updatedBackendOrder.orderStatus ? (updatedBackendOrder.orderStatus.charAt(0).toUpperCase() + updatedBackendOrder.orderStatus.slice(1)) : o.status,
            payment: updatedBackendOrder.paymentStatus || o.payment
          };
        }
        return o;
      }));
    };
    socket.on('order_updated', handleOrderUpdate);
    return () => socket.off('order_updated', handleOrderUpdate);
  }, [socket]);

  const now = () => {
    const d = new Date();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} at ${h12}:${minutes} ${ampm}`;
  };

  const [orders, setOrders] = useState([]);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchOrders = async () => {
    try {
      const res = await getAdminOrders();
      const fetchedOrders = res.data?.data?.orders || res.data?.orders || [];
      
      // Map backend Order models to frontend UI schema
      const formattedOrders = fetchedOrders.map(o => ({
        id: o._id.slice(-6).toUpperCase(),
        dbId: o._id,
        customer: o.userId?.name || 'Unknown',
        phone: o.userId?.phoneNumber || o.userId?.phone || 'N/A',
        email: o.userId?.email || 'N/A',
        address: o.shippingAddress 
          ? `${o.shippingAddress.fullName}, ${o.shippingAddress.addressLine}, ${o.shippingAddress.city}, ${o.shippingAddress.state} - ${o.shippingAddress.pincode}` 
          : 'N/A',
        addressPhone: o.shippingAddress?.phone || '',
        addressEmail: o.shippingAddress?.email || '',
        products: o.items.map(item => ({ name: item.productId?.name || 'Product', qty: item.quantity, price: item.price })),
        total: o.totalAmount || 0,
        payment: o.paymentStatus || 'Paid',
        status: o.orderStatus ? (o.orderStatus.charAt(0).toUpperCase() + o.orderStatus.slice(1)) : 'Pending',
        cancelRequest: o.cancelRequest || null,
        shiprocketOrderId: o.shiprocketOrderId,
        shipmentId: o.shipmentId,
        tracking: o.trackingId || o.awbCode || null,
        shippingProvider: o.courierPartner || 'Unknown',
        date: new Date(o.createdAt).toLocaleDateString(),
        time: new Date(o.createdAt).toLocaleTimeString(),
        timeline: [{ label: 'Order Placed', time: new Date(o.createdAt).toLocaleString(), icon: 'check' }]
      }));
      setOrders(formattedOrders);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    }
  };

  useEffect(() => {

    fetchOrders();
  }, []);

  const showToast = (message) => {
    setSuccessToast(message);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // ═══ ACCEPT ORDER ═══
  const acceptOrder = async (orderId, dbId) => {
    try {
      await updateAdminOrderStatus(dbId, 'Processing');
      setOrders(prev => prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'Processing',
            timeline: [...o.timeline, { label: 'Accepted by Admin', time: now(), icon: 'check' }]
          };
        }
        return o;
      }));
      showToast(`${orderId} accepted! Ready to ship.`);
      setSelectedOrder(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to accept order');
    }
  };

  // ═══ SHIP ORDER ═══
  const confirmShipping = async () => {
    if (!trackingNumber) return;
    const finalProvider = shippingProvider.trim();
    if (!finalProvider) return; // Prevent empty provider
    
    try {
      await updateAdminOrderStatus(showShipModal.dbId, 'Shipped');
      setOrders(prev => prev.map(o => {
        if (o.id === showShipModal.id) {
          return {
            ...o,
            status: 'Shipped',
            tracking: trackingNumber,
            shippingProvider: finalProvider,
            timeline: [...o.timeline, { label: 'Shipped', time: now(), icon: 'truck', detail: `Tracking: ${trackingNumber} via ${finalProvider}` }]
          };
        }
        return o;
      }));
      const orderId = showShipModal.id;
      setShowShipModal(null);
      setTrackingNumber('');
      setShippingProvider('DHL Express');
      showToast(`${orderId} shipped! Tracking: ${trackingNumber}`);
    } catch (err) {
      console.error(err);
      showToast('Failed to ship order');
    }
  };

  // ═══ MARK DELIVERED ═══
  const markDelivered = async (orderId, dbId) => {
    try {
      await updateAdminOrderStatus(dbId, 'Delivered');
      setOrders(prev => prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'Delivered',
            payment: 'Paid',
            timeline: [...o.timeline, { label: 'Delivered', time: now(), icon: 'delivered' }]
          };
        }
        return o;
      }));
      showToast(`${orderId} marked as delivered! ✅`);
      setSelectedOrder(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to update status');
    }
  };

  // ═══ MARK COMPLETED ═══
  const markCompleted = async (orderId, dbId) => {
    try {
      await updateAdminOrderStatus(dbId, 'Completed');
      setOrders(prev => prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'Completed',
            timeline: [...o.timeline, { label: 'Completed', time: now(), icon: 'check' }]
          };
        }
        return o;
      }));
      showToast(`${orderId} marked as completed! 🎉`);
      setSelectedOrder(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to update status');
    }
  };

  // ═══ CANCEL ORDER ═══
  const cancelOrder = async (orderId, dbId) => {
    try {
      await updateAdminOrderStatus(dbId, 'Cancelled');
      setOrders(prev => prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'Cancelled',
            payment: o.payment === 'Paid' ? 'Refunded' : o.payment,
            timeline: [...o.timeline, { label: 'Cancelled', time: now(), icon: 'cancel', detail: 'Cancelled by Admin' }]
          };
        }
        return o;
      }));
      showToast(`${orderId} cancelled and refund initiated.`);
      setSelectedOrder(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to cancel order');
    }
  };

  const tabs = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Completed', 'Cancel Requests', 'Cancelled'];
  const tabCounts = {
    All: orders.length,
    Pending: orders.filter(o => o.status === 'Pending').length,
    Processing: orders.filter(o => o.status === 'Processing').length,
    Shipped: orders.filter(o => o.status === 'Shipped').length,
    Delivered: orders.filter(o => o.status === 'Delivered').length,
    Completed: orders.filter(o => o.status === 'Completed').length,
    'Cancel Requests': orders.filter(o => o.cancelRequest?.requested && o.cancelRequest?.adminResponse === 'pending').length,
    Cancelled: orders.filter(o => o.status === 'Cancelled').length,
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(searchQuery.toLowerCase()) || o.customer.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'Cancel Requests') {
      return matchesSearch && o.cancelRequest?.requested && o.cancelRequest?.adminResponse === 'pending';
    }
    const matchesTab = activeTab === 'All' || o.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Pending': return 'bg-orange-50 text-orange-600';
      case 'Processing': return 'bg-yellow-50 text-yellow-700';
      case 'Shipped': return 'bg-blue-50 text-blue-600';
      case 'Delivered': return 'bg-green-50 text-green-600';
      case 'Completed': return 'bg-teal-50 text-teal-600';
      case 'Cancelled': return 'bg-red-50 text-red-500';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <FiClock size={10} />;
      case 'Processing': return <FiPackage size={10} />;
      case 'Shipped': return <FiTruck size={10} />;
      case 'Delivered': return <FiCheck size={10} />;
      case 'Completed': return <FiCheckCircle size={10} />;
      case 'Cancelled': return <FiX size={10} />;
      default: return null;
    }
  };

  const getTimelineIconStyle = (icon) => {
    switch (icon) {
      case 'check': return 'bg-green-50 text-green-500';
      case 'truck': return 'bg-blue-50 text-blue-500';
      case 'delivered': return 'bg-green-100 text-green-600';
      case 'cancel': return 'bg-red-50 text-red-500';
      default: return 'bg-gray-50 text-gray-400';
    }
  };

  const getTimelineIcon = (icon) => {
    switch (icon) {
      case 'check': return <FiCheck size={12} />;
      case 'truck': return <FiTruck size={12} />;
      case 'delivered': return <FiCheckCircle size={12} />;
      case 'cancel': return <FiX size={12} />;
      default: return <FiClock size={12} />;
    }
  };

  // Refresh detail modal when orders change
  const getOrderById = (id) => orders.find(o => o.id === id);

  useEffect(() => {
    if (selectedOrder) {
      const order = getOrderById(selectedOrder.id) || selectedOrder;
      if (order.shiprocketOrderId) {
        setShiprocketDetails(null);
        getShiprocketOrderDetails(order.dbId).then(res => {
          setShiprocketDetails(res.data.data.shiprocketDetails.data);
        }).catch(err => console.error("Failed to fetch shiprocket details:", err));
      } else {
        setShiprocketDetails(null);
      }
    }
  }, [selectedOrder]);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ═══ SUCCESS TOAST ═══ */}
      {successToast && (
        <div className="fixed top-6 right-6 z-[60] animate-slide-down">
          <div className="bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[300px]">
            <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center shrink-0">
              <FiCheck size={16} className="text-white" />
            </div>
            <p className="text-sm font-bold flex-1">{successToast}</p>
            <button onClick={() => setSuccessToast(null)} className="text-gray-400 hover:text-white transition-colors">
              <FiX size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">Track, process, and ship store product orders</p>
        </div>
        <button className="px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all">
          <FiDownload size={14} /> Export Orders
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: orders.length, icon: <FiPackage size={16} />, color: 'blue' },
          { label: 'Pending Review', value: tabCounts.Pending, icon: <FiClock size={16} />, color: 'orange', pulse: tabCounts.Pending > 0 },
          { label: 'In Transit', value: tabCounts.Shipped, icon: <FiTruck size={16} />, color: 'purple' },
          { label: 'Total Revenue', value: `₹${orders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + o.total, 0).toLocaleString()}`, icon: <FaRupeeSign size={14} />, color: 'green' },
        ].map((s, i) => (
          <div key={i} className={`bg-white rounded-2xl p-5 border ${s.pulse ? 'border-orange-200' : 'border-gray-100'} flex items-center gap-4 transition-all`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 relative ${
              s.color === 'blue' ? 'bg-blue-50 text-blue-500' :
              s.color === 'orange' ? 'bg-orange-50 text-orange-500' :
              s.color === 'purple' ? 'bg-purple-50 text-purple-500' : 'bg-green-50 text-green-500'
            }`}>
              {s.icon}
              {s.pulse && <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white animate-pulse" />}
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{s.label}</p>
              <h3 className="text-xl font-black text-gray-900">{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ ORDER FLOW VISUAL ═══ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Order Lifecycle</p>
        <div className="flex items-center justify-between relative">
          <div className="absolute top-5 left-[10%] right-[10%] h-[2px] bg-gray-100" />
          {[
            { label: 'Pending', count: tabCounts.Pending, color: 'orange', desc: 'New orders' },
            { label: 'Processing', count: tabCounts.Processing, color: 'yellow', desc: 'Accepted' },
            { label: 'Shipped', count: tabCounts.Shipped, color: 'blue', desc: 'In transit' },
            { label: 'Delivered', count: tabCounts.Delivered, color: 'green', desc: 'Complete' },
          ].map((step, i) => (
            <div key={i} className="flex flex-col items-center relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 mb-2 ${
                step.color === 'orange' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                step.color === 'yellow' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                step.color === 'blue' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                'bg-green-50 text-green-600 border-green-200'
              }`}>
                {step.count}
              </div>
              <p className="text-xs font-bold text-gray-700">{step.label}</p>
              <p className="text-[10px] text-gray-400">{step.desc}</p>
              {i < 3 && (
                <div className="absolute top-5 left-full w-full flex items-center justify-center -ml-4">
                  <span className="text-gray-300 text-xs">→</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Filters and Tabs Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Dropdown Tabs */}
        <AdminFilterDropdown 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={(tab) => { setActiveTab(tab); setCurrentPage(1); }} 
          tabCounts={tabCounts} 
        />

        {/* Dropdown Navbar */}
        <div className="relative group z-20 self-start lg:self-auto">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <FiFilter size={16} /> Filter & Sort <FiChevronDown size={16} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
          </button>
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right scale-95 group-hover:scale-100">
            <div className="p-2 space-y-1">
              <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sort By</p>
              <button className="w-full text-left px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">Newest First</button>
              <button className="w-full text-left px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">Oldest First</button>
              <button className="w-full text-left px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">Highest Amount</button>
              <div className="h-px bg-gray-100 my-1"></div>
              <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Filter</p>
              <button className="w-full text-left px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">High Value Orders</button>
              <button className="w-full text-left px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">Delayed Orders</button>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by Order ID or Customer name..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 border-0 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white text-sm font-medium transition-all"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-4 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Order ID</th>
                <th className="py-4 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="py-4 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Products</th>
                <th className="py-4 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="py-4 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="py-4 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="py-4 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedOrders.map(order => (
                <tr key={order.id} className={`hover:bg-gray-50/50 transition-colors group ${order.status === 'Pending' ? 'bg-orange-50/20' : ''}`}>
                  <td className="py-4 px-5">
                    <span className="font-bold text-sm text-gray-800 font-mono">{order.id}</span>
                  </td>
                  <td className="py-4 px-5">
                    <p className="text-sm font-bold text-gray-800">{order.customer}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">{order.phone}</p>
                  </td>
                  <td className="py-4 px-5">
                    {order.products.map((p, i) => (
                      <p key={i} className="text-xs font-medium text-gray-600">
                        {p.name} <span className="text-gray-400">×{p.qty}</span>
                      </p>
                    ))}
                  </td>
                  <td className="py-4 px-5">
                    <span className="text-sm font-black text-gray-900">₹{order.total.toLocaleString()}</span>
                    <p className={`text-[10px] font-bold mt-0.5 ${order.payment === 'Paid' ? 'text-green-500' : (order.payment === 'Refunded' || order.status === 'Cancelled') ? 'text-red-500' : 'text-orange-500'}`}>
                      {order.status === 'Cancelled' && order.payment.toLowerCase() === 'pending' ? 'Cancelled' : order.payment}
                    </p>
                  </td>
                  <td className="py-4 px-5">
                    <p className="text-xs text-gray-500 font-medium">{order.date}</p>
                    <p className="text-[10px] text-gray-400">{order.time}</p>
                  </td>
                  <td className="py-4 px-5">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${getStatusStyle(order.status)}`}>
                      {getStatusIcon(order.status)} {order.status}
                    </span>
                    {order.tracking && (
                      <p className="text-[9px] text-blue-500 font-mono font-bold mt-1">{order.tracking}</p>
                    )}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedOrder(getOrderById(order.id))}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-[11px] font-bold flex items-center gap-1 shadow-sm"
                      ><FiEye size={12} /> View Details</button>

                      {(!order.cancelRequest?.requested || order.cancelRequest?.adminResponse !== 'pending') && (
                        <>
                          {order.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => acceptOrder(order.id, order.dbId)}
                                className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all text-[11px] font-bold flex items-center gap-1 shadow-sm shadow-green-500/20 hover:shadow-md hover:shadow-green-500/30 active:scale-95"
                              >
                                <FiCheck size={12} /> Accept
                              </button>
                              <button
                                onClick={() => cancelOrder(order.id, order.dbId)}
                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all text-[11px] font-bold flex items-center gap-1 shadow-sm"
                              >
                                <FiX size={12} /> Cancel
                              </button>
                            </>
                          )}

                          {order.status === 'Processing' && (
                            <>
                              {!order.shipmentId ? (
                                <button
                                  disabled={actionLoadingId === order.id}
                                  onClick={async () => {
                                    if (actionLoadingId === order.id) return;
                                    try {
                                      setActionLoadingId(order.id);
                                      await pushOrderToShiprocket(order.dbId);
                                      showToast(`Order ${order.id} pushed to SR!`);
                                      await fetchOrders();
                                    } catch (e) {
                                      showToast('Failed to push to SR');
                                    } finally {
                                      setActionLoadingId(null);
                                    }
                                  }}
                                  className={`px-3 py-1.5 ${actionLoadingId === order.id ? 'bg-purple-300' : 'bg-purple-500 hover:bg-purple-600 active:scale-95 shadow-purple-500/20'} text-white rounded-lg transition-all text-[11px] font-bold flex items-center gap-1 shadow-sm`}
                                >
                                  {actionLoadingId === order.id ? <FiLoader className="animate-spin" size={12} /> : <FiPackage size={12} />} 
                                  {actionLoadingId === order.id ? 'Pushing...' : 'Push to SR'}
                                </button>
                              ) : (
                                <button
                                  disabled={actionLoadingId === order.id}
                                  onClick={async () => {
                                    if (actionLoadingId === order.id) return;
                                    try {
                                      setActionLoadingId(order.id);
                                      await generateOrderAWB(order.dbId);
                                      showToast(`AWB Generated!`);
                                      await fetchOrders();
                                    } catch (e) {
                                      showToast('Failed to generate AWB');
                                    } finally {
                                      setActionLoadingId(null);
                                    }
                                  }}
                                  className={`px-3 py-1.5 ${actionLoadingId === order.id ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600 active:scale-95 shadow-blue-500/20'} text-white rounded-lg transition-all text-[11px] font-bold flex items-center gap-1 shadow-sm`}
                                >
                                  {actionLoadingId === order.id ? <FiLoader className="animate-spin" size={12} /> : <FiTruck size={12} />} 
                                  {actionLoadingId === order.id ? 'Generating...' : 'Generate AWB'}
                                </button>
                              )}
                              <button
                                onClick={() => cancelOrder(order.id, order.dbId)}
                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all text-[11px] font-bold flex items-center gap-1 shadow-sm"
                              >
                                <FiX size={12} /> Cancel
                              </button>
                            </>
                          )}

                          {order.status === 'Shipped' && (
                            <button
                              onClick={() => markDelivered(order.id, order.dbId)}
                              className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all text-[11px] font-bold flex items-center gap-1 shadow-sm shadow-green-500/20 hover:shadow-md hover:shadow-green-500/30 active:scale-95"
                            >
                              <FiCheckCircle size={12} /> Delivered
                            </button>
                          )}
                          
                          {order.status === 'Delivered' && (
                            <button
                              onClick={() => markCompleted(order.id, order.dbId)}
                              className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-all text-[11px] font-bold flex items-center gap-1 shadow-sm shadow-teal-500/20 hover:shadow-md hover:shadow-teal-500/30 active:scale-95"
                            >
                              <FiCheckCircle size={12} /> Complete
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FiPackage size={28} className="text-gray-300" />
                    </div>
                    <p className="text-sm font-bold text-gray-500 mb-1">No orders found</p>
                    <p className="text-xs text-gray-400">Try adjusting your search or filter</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredOrders.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-400 font-medium">
              Showing <span className="font-bold text-gray-700">{((currentPage - 1) * itemsPerPage) + 1}</span>-<span className="font-bold text-gray-700">{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</span> of <span className="font-bold text-gray-700">{filteredOrders.length}</span>
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30"><FiChevronLeft size={14} /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${currentPage === page ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>{page}</button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30"><FiChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ ORDER DETAIL MODAL ═══ */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {(() => {
              const order = getOrderById(selectedOrder.id) || selectedOrder;
              return (
                <>
                  <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div>
                      <h3 className="font-bold text-gray-900">{order.id}</h3>
                      <p className="text-[10px] text-gray-400 font-medium">{order.date} at {order.time}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${getStatusStyle(order.status)}`}>
                        {getStatusIcon(order.status)} {order.status}
                      </span>
                      <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"><FiX size={16} /></button>
                    </div>
                  </div>
                  <div className="p-6 space-y-5">
                    {/* Customer Info */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Customer</p>
                      <p className="text-sm font-bold text-gray-800">{order.customer}</p>
                      <p className="text-xs text-gray-500 mt-1">{order.phone} • {order.email}</p>
                      <p className="text-xs text-gray-500 mt-1 flex items-start gap-1"><FiMapPin size={12} className="shrink-0 mt-0.5" /> {order.address}</p>
                      <div className="flex flex-col gap-0.5 mt-1">
                        {order.addressPhone && <p className="text-[10px] text-gray-400">📞 {order.addressPhone}</p>}
                        {order.addressEmail && <p className="text-[10px] text-gray-400">✉️ {order.addressEmail}</p>}
                      </div>
                    </div>

                    {/* Products */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Products</p>
                      <div className="space-y-2">
                        {order.products.map((p, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                            <div>
                              <p className="text-sm font-bold text-gray-800">{p.name}</p>
                              <p className="text-[10px] text-gray-400">Qty: {p.qty}</p>
                            </div>
                            <span className="text-sm font-black text-gray-900">₹{(p.price * p.qty).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between mt-3 pt-3 border-t border-gray-100">
                        <span className="text-sm font-bold text-gray-600">Total</span>
                        <span className="text-lg font-black text-gray-900">₹{order.total.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Tracking Info */}
                    {order.tracking && (
                      <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600"><FiTruck size={16} /></div>
                        <div>
                          <p className="text-xs font-bold text-blue-800">Tracking: <span className="font-mono">{order.tracking}</span></p>
                          <p className="text-[10px] text-blue-600">via {order.shippingProvider}</p>
                        </div>
                      </div>
                    )}

                    {/* Shiprocket Live Details */}
                    {shiprocketDetails && (
                      <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                        <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <FiPackage size={12} /> Live Shiprocket Details
                        </p>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <div>
                            <p className="text-[10px] text-gray-500">SR Order ID</p>
                            <p className="text-xs font-bold text-gray-800">{shiprocketDetails.id}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500">Status</p>
                            <p className="text-xs font-bold text-purple-700">{shiprocketDetails.status}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500">Courier Name</p>
                            <p className="text-xs font-bold text-gray-800">{shiprocketDetails.shipments?.[0]?.courier || 'Pending'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500">AWB Code</p>
                            <p className="text-xs font-bold text-gray-800">{shiprocketDetails.shipments?.[0]?.awb || 'Pending'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status Timeline */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Order Timeline</p>
                      <div className="space-y-0">
                        {order.timeline.map((step, i) => (
                          <div key={i} className="flex gap-3 relative">
                            {/* Connecting line */}
                            {i < order.timeline.length - 1 && (
                              <div className="absolute left-3 top-7 bottom-0 w-[2px] bg-gray-100" />
                            )}
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 relative z-10 ${getTimelineIconStyle(step.icon)}`}>
                              {getTimelineIcon(step.icon)}
                            </div>
                            <div className="pb-4">
                              <p className="text-xs font-bold text-gray-800">{step.label}</p>
                              <p className="text-[10px] text-gray-400">{step.time}</p>
                              {step.detail && <p className={`text-[10px] font-medium mt-0.5 ${step.icon === 'cancel' ? 'text-red-400' : 'text-blue-500'}`}>{step.detail}</p>}
                            </div>
                          </div>
                        ))}

                        {/* Next step indicator */}
                        {order.status === 'Pending' && (
                          <div className="flex gap-3 opacity-40">
                            <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center shrink-0"><FiCheck size={10} className="text-gray-300" /></div>
                            <p className="text-xs font-medium text-gray-400 pt-1">Waiting for acceptance...</p>
                          </div>
                        )}
                        {order.status === 'Processing' && (
                          <div className="flex gap-3 opacity-40">
                            <div className="w-6 h-6 rounded-full border-2 border-dashed border-blue-300 flex items-center justify-center shrink-0"><FiTruck size={10} className="text-blue-300" /></div>
                            <p className="text-xs font-medium text-gray-400 pt-1">Ready to ship...</p>
                          </div>
                        )}
                        {order.status === 'Shipped' && (
                          <div className="flex gap-3 opacity-40">
                            <div className="w-6 h-6 rounded-full border-2 border-dashed border-green-300 flex items-center justify-center shrink-0"><FiCheckCircle size={10} className="text-green-300" /></div>
                            <p className="text-xs font-medium text-gray-400 pt-1">Awaiting delivery confirmation...</p>
                          </div>
                        )}
                        {order.status === 'Delivered' && (
                          <div className="flex gap-3 opacity-40">
                            <div className="w-6 h-6 rounded-full border-2 border-dashed border-teal-300 flex items-center justify-center shrink-0"><FiCheckCircle size={10} className="text-teal-300" /></div>
                            <p className="text-xs font-medium text-gray-400 pt-1">Awaiting completion...</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Actions removed as per user request */}
                    
                    {/* Cancel Request Section */}
                    {order.cancelRequest?.requested && order.cancelRequest?.adminResponse === 'pending' && (
                      <div className="mt-4 bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                        <p className="text-xs font-bold text-yellow-700 mb-2 flex items-center gap-1.5">
                          <FiAlertCircle size={14} /> Cancel Request from Customer
                        </p>
                        <p className="text-xs text-gray-600 mb-3">Reason: {order.cancelRequest.reason || 'No reason given'}</p>
                        <div className="flex flex-col gap-2 mb-4">
                          <label className="text-[12px] font-bold text-gray-700">Custom Refund Amount (₹):</label>
                          <input
                            type="number"
                            defaultValue={order.payment === 'cod' || order.paymentMethod === 'cod' ? 0 : Math.round(order.total * (order.cancelRequest.refundPercent || 80) / 100)}
                            min={0}
                            max={order.total}
                            id={`refund-${order.id}`}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-yellow-400 outline-none"
                            placeholder="Enter amount to refund"
                          />
                          <span className="text-[11px] text-gray-500">Max allowed: ₹{order.total}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              const refundEl = document.getElementById(`refund-${order.id}`);
                              const customRefundAmount = parseInt(refundEl?.value) || 0;
                              try {
                                await processCancelRequestApi(order.dbId, 'approved', customRefundAmount);
                                setOrders(prev => prev.map(o => o.id === order.id ? {
                                  ...o, status: 'Cancelled', payment: o.payment === 'Paid' ? 'Refunded' : o.payment,
                                  cancelRequest: { ...o.cancelRequest, adminResponse: 'approved' },
                                  timeline: [...o.timeline, { label: 'Cancelled by User Request', time: now(), icon: 'cancel', detail: `Refunded ₹${customRefundAmount}` }]
                                } : o));
                                showToast(`${order.id} cancelled. ₹${customRefundAmount} refund issued.`);
                                setSelectedOrder(null);
                              } catch(e) { showToast('Failed to process cancel'); }
                            }}
                            className="flex-1 px-3 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1"
                          ><FiCheck size={12} /> Approve Cancel</button>
                          <button
                            onClick={async () => {
                              try {
                                await processCancelRequestApi(order.dbId, 'rejected', 0);
                                setOrders(prev => prev.map(o => o.id === order.id ? {
                                  ...o, cancelRequest: { ...o.cancelRequest, adminResponse: 'rejected' }
                                } : o));
                                showToast(`Cancel request for ${order.id} rejected.`);
                                setSelectedOrder(null);
                              } catch(e) { showToast('Failed to reject cancel'); }
                            }}
                            className="flex-1 px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1"
                          ><FiX size={12} /> Reject</button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ═══ SHIP MODAL ═══ */}
      {showShipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowShipModal(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2"><FiTruck size={16} className="text-blue-500" /> Ship Order</h3>
              <p className="text-xs text-gray-400 font-medium mt-1">{showShipModal.id} — {showShipModal.customer}</p>
            </div>
            <div className="p-6 space-y-5">
              {/* Order summary */}
              <div className="bg-gray-50 rounded-xl p-3">
                {showShipModal.products.map((p, i) => (
                  <p key={i} className="text-xs font-medium text-gray-600">{p.name} × {p.qty} — <span className="font-bold">₹{(p.price * p.qty).toLocaleString()}</span></p>
                ))}
                <p className="text-[10px] text-gray-400 mt-2 flex items-start gap-1"><FiMapPin size={10} className="shrink-0 mt-0.5" /> {showShipModal.address}</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tracking Number <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="e.g., DHL-789456123"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Shipping Provider</label>
                <input 
                  type="text"
                  list="shipping-providers"
                  value={shippingProvider}
                  onChange={e => setShippingProvider(e.target.value)}
                  placeholder="Select or type provider..."
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <datalist id="shipping-providers">
                  <option value="DHL Express" />
                  <option value="Blue Dart" />
                  <option value="Delhivery" />
                  <option value="India Post" />
                  <option value="FedEx" />
                  <option value="DTDC" />
                </datalist>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowShipModal(null)}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmShipping}
                  disabled={!trackingNumber.trim() || !shippingProvider.trim()}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  <FiTruck size={14} /> Confirm Ship
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
