import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiArrowLeft, FiVideo, FiPackage, FiTruck, FiCheckCircle, FiClock, FiCreditCard, FiMessageCircle, FiX, FiAlertTriangle } from 'react-icons/fi';
import { GiFlowerPot } from 'react-icons/gi';
import { getUserSessions, getUserPoojas, getUserCalls } from '../../api/userApis';
import { getUserOrders, requestCancelOrder } from '../../api/storeApis';

const historyTabs = ['Chat', 'Calls', 'Wallet', 'Orders', 'Poojas'];

const formatDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: '2-digit',
    hour: 'numeric', minute: '2-digit', hour12: true
  });
};

const formatTxnDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

const OrderHistory = () => {
  const { user } = useSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'wallet' ? 'Wallet' : (searchParams.get('tab') || 'Chat');
  const [activeTab, setActiveTab] = useState(initialTab);
  const navigate = useNavigate();
  const { openSidebar } = useOutletContext();
  
  const [sessions, setSessions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [poojas, setPoojas] = useState([]);
  const [storeOrders, setStoreOrders] = useState([]);
  const [calls, setCalls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessionRes, poojaRes, storeRes, callsRes] = await Promise.all([
          getUserSessions().catch(() => ({ data: { data: {} } })),
          getUserPoojas().catch(() => ({ data: { data: {} } })),
          getUserOrders().catch(() => ({ data: { data: {} } })),
          getUserCalls().catch(() => ({ data: { data: {} } }))
        ]);
        
        if (sessionRes.data?.success) {
          setSessions(sessionRes.data.data.sessions || []);
          
          const rawTxns = sessionRes.data.data.transactions || [];
          const aggregatedTxns = [];
          let currentSessionTxn = null;

          for (const txn of rawTxns) {
            if (txn.desc === 'Chat session - 1 min') {
              if (!currentSessionTxn) {
                currentSessionTxn = { ...txn, sessionCount: 1 };
                aggregatedTxns.push(currentSessionTxn);
              } else {
                const timeDiff = new Date(currentSessionTxn.createdAt).getTime() - new Date(txn.createdAt).getTime();
                if (timeDiff <= 150000 && timeDiff >= 0) {
                  currentSessionTxn.amount += txn.amount;
                  currentSessionTxn.sessionCount += 1;
                  currentSessionTxn.desc = `Chat session - ${currentSessionTxn.sessionCount} mins`;
                  currentSessionTxn.createdAt = txn.createdAt;
                } else {
                  currentSessionTxn = { ...txn, sessionCount: 1 };
                  aggregatedTxns.push(currentSessionTxn);
                }
              }
            } else {
              aggregatedTxns.push(txn);
              currentSessionTxn = null;
            }
          }
          setTransactions(aggregatedTxns);
        }
        if (poojaRes.data?.success) {
          setPoojas(poojaRes.data.data.poojas || []);
        }
        if (storeRes.data?.success) {
          setStoreOrders(storeRes.data.data.orders || []);
        }
        if (callsRes.data?.success) {
          setCalls(callsRes.data.data.calls || []);
        }
      } catch (err) {
        console.error("Failed to fetch order history", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCancelRequest = async () => {
    if (!showCancelModal) return;
    setCancelLoading(true);
    try {
      const res = await requestCancelOrder(showCancelModal._id, cancelReason);
      if (res.data?.success) {
        setStoreOrders(prev => prev.map(o => 
          o._id === showCancelModal._id ? { ...o, cancelRequest: res.data.data.order.cancelRequest } : o
        ));
      }
      setShowCancelModal(null);
      setCancelReason('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit cancel request');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="w-full bg-white min-h-screen font-sans pb-24">

      {/* ═══ TOP NAVBAR ═══ */}
      <div className="flex items-center justify-between px-4 py-3 bg-white sticky top-0 z-30 shadow-sm border-b border-gray-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-800 hover:bg-gray-100 p-1.5 rounded-full transition-colors">
            <FiArrowLeft size={20} />
          </button>
          <span className="text-gray-800 font-semibold text-[17px]">Order History</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
            <span className="text-[12px] font-bold text-orange-600">₹ {user?.wallet || 0}</span>
          </div>
          <div 
            onClick={openSidebar}
            className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden border border-orange-200 cursor-pointer shrink-0"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-orange-500 font-bold text-xs">{(user?.name || 'G')[0]}</span>
            )}
          </div>
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="flex overflow-x-auto no-scrollbar bg-white border-b border-gray-100 px-2">
        {historyTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[70px] py-3 text-[12px] font-bold transition-all relative whitespace-nowrap px-2 ${
              activeTab === tab ? 'text-orange-500' : 'text-gray-400'
            }`}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-2 right-2 h-[3px] bg-orange-500 rounded-full" />}
          </button>
        ))}
      </div>

      {/* ═══ CHAT TAB ═══ */}
      {activeTab === 'Chat' && (
        <div className="divide-y divide-gray-50">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-8">
              <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                <FiMessageCircle size={40} className="text-orange-400" />
              </div>
              <h3 className="text-[18px] font-bold text-gray-800 mb-2">No Chat History</h3>
              <p className="text-gray-400 text-[14px] text-center">Start chatting with an astrologer to see your history here.</p>
              <button 
                onClick={() => navigate('/user/astrologers')}
                className="mt-6 bg-orange-500 text-white font-bold py-3 px-8 rounded-xl shadow-md hover:bg-orange-600 transition-colors"
              >
                Find Astrologer
              </button>
            </div>
          ) : (
            sessions.map((item, i) => {
              const astroName = item.astrologerId?.name || 'Astrologer';
              const astroAvatar = item.astrologerId?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(astroName)}&background=ffedD5&color=f97316`;
              const lastMsg = item.messages?.length > 0 ? item.messages[item.messages.length - 1]?.text : 'No messages';
              const duration = item.duration || (item.messages?.length ? `${item.messages.length} msgs` : '');

              return (
                <div key={i} className="px-4 py-3.5 hover:bg-orange-50/30 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-[48px] h-[48px] rounded-full overflow-hidden border-2 border-orange-100 shrink-0">
                      <img src={astroAvatar} alt={astroName} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 text-[15px]">{astroName}</h4>
                      <p className="text-[12px] text-gray-400">{formatDate(item.createdAt)} {duration && `• ${duration}`}</p>
                      <p className="text-[12px] text-gray-500 line-clamp-1 mt-0.5">{typeof lastMsg === 'string' ? lastMsg.slice(0, 60) : 'Chat session'}{lastMsg?.length > 60 ? '...' : ''}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pl-[60px]">
                    <button 
                      onClick={() => navigate('/user/chat', { state: { astrologer: item.astrologerId, viewOnly: true, roomId: item.roomId, messages: item.messages } })}
                      className="flex-1 py-2 border border-gray-200 text-gray-600 font-semibold rounded-xl text-[12px] hover:bg-gray-50 transition-colors"
                    >
                      View Chat
                    </button>
                    <button 
                      onClick={() => navigate('/user/astrologers?type=chat', { state: { autoConnectAstro: item.astrologerId } })}
                      className="flex-1 py-2 bg-orange-500 text-white font-bold rounded-xl text-[12px] shadow-sm shadow-orange-200 hover:bg-orange-600 transition-colors"
                    >
                      Start Chat
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ═══ CALLS TAB ═══ */}
      {activeTab === 'Calls' && (
        <div className="divide-y divide-gray-50">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : calls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-8">
              <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                <FiClock size={40} className="text-orange-400" />
              </div>
              <h3 className="text-[18px] font-bold text-gray-800 mb-2">No Call History</h3>
              <p className="text-gray-400 text-[14px] text-center">Start a call with an astrologer to see your history here.</p>
              <button 
                onClick={() => navigate('/user/astrologers')}
                className="mt-6 bg-orange-500 text-white font-bold py-3 px-8 rounded-xl shadow-md hover:bg-orange-600 transition-colors"
              >
                Find Astrologer
              </button>
            </div>
          ) : (
            calls.map((item, i) => {
              const astroName = item.astrologerId?.name || 'Astrologer';
              const astroAvatar = item.astrologerId?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(astroName)}&background=ffedD5&color=f97316`;
              const duration = item.duration ? `${Math.floor(item.duration / 60)}m ${item.duration % 60}s` : '0m 0s';

              return (
                <div key={i} className="px-4 py-3.5 hover:bg-orange-50/30 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-[48px] h-[48px] rounded-full overflow-hidden border-2 border-orange-100 shrink-0">
                      <img src={astroAvatar} alt={astroName} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 text-[15px]">{astroName}</h4>
                      <p className="text-[12px] text-gray-400">{formatDate(item.createdAt)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          item.status === 'completed' ? 'bg-green-50 text-green-600' :
                          item.status === 'missed' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {item.status}
                        </span>
                        {item.status === 'completed' && <span className="text-[12px] text-gray-500 font-medium">{duration} • ₹{item.totalAmount}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pl-[60px]">
                    <button 
                      onClick={() => navigate('/user/astrologers')}
                      className="flex-1 py-2 bg-orange-500 text-white font-bold rounded-xl text-[12px] shadow-sm shadow-orange-200 hover:bg-orange-600 transition-colors"
                    >
                      Call Again
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ═══ WALLET TAB ═══ */}
      {activeTab === 'Wallet' && (
        <div>
          {/* Balance Card */}
          <div className="px-4 pt-4 pb-2">
            <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-5 text-white shadow-lg">
              <p className="text-orange-100 text-[12px] font-medium mb-1">Available Balance</p>
              <h2 className="text-[32px] font-black mb-3">₹{user?.wallet || 0}</h2>
              <button onClick={() => navigate('/user/wallet')} className="bg-white text-orange-600 text-[12px] font-bold px-5 py-2 rounded-full shadow-sm hover:shadow-md transition-shadow">
                Recharge
              </button>
            </div>
          </div>

          {/* Transaction List — no sub-tabs */}
          <div className="px-4 pt-3">
            <h3 className="text-[14px] font-bold text-gray-800 mb-2">Wallet Transactions</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {isLoading ? (
               <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : transactions.length === 0 ? (
               <div className="p-8 text-center text-gray-400">No transactions found.</div>
            ) : (
              transactions.map((txn, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3.5 hover:bg-orange-50/30 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      txn.type === 'deduction' ? 'bg-red-50 text-red-500' :
                      txn.type === 'refund' ? 'bg-blue-50 text-blue-500' :
                      'bg-green-50 text-green-500'
                    }`}>
                      {txn.type === 'deduction' ? '↓' : txn.type === 'refund' ? '↩' : '↑'}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 text-[13px] line-clamp-1">{txn.desc}</h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {txn.type.charAt(0).toUpperCase() + txn.type.slice(1)} • {formatTxnDate(txn.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[14px] font-bold shrink-0 ${
                    txn.type === 'deduction' ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {txn.type === 'deduction' ? '-' : '+'}₹{txn.amount}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ═══ ORDERS TAB ═══ */}
      {activeTab === 'Orders' && (
        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : storeOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-8">
              <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                <FiPackage size={40} className="text-orange-500" />
              </div>
              <h3 className="text-[18px] font-bold text-gray-800 mb-2">No Orders Yet</h3>
              <p className="text-gray-400 text-[14px] text-center">Start shopping from JyotishLink Services to see your orders here.</p>
              <button 
                onClick={() => navigate('/user/store')}
                className="mt-6 bg-orange-500 text-white font-bold py-3 px-8 rounded-xl shadow-md hover:bg-orange-600 transition-colors"
              >
                Go to Store
              </button>
            </div>
          ) : (
            storeOrders.map((order, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2 items-center">
                    <FiPackage className="text-orange-500" />
                    <span className="text-[13px] font-bold text-gray-800">Order ID: {order._id.slice(-6).toUpperCase()}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide ${
                    order.orderStatus === 'pending' ? 'bg-orange-50 text-orange-500' :
                    order.orderStatus === 'delivered' ? 'bg-green-50 text-green-600' :
                    order.orderStatus === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                  }`}>
                    {order.orderStatus}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <div className="w-12 h-12 rounded-xl bg-orange-50 overflow-hidden border border-gray-100">
                        <img src={item.productId?.image || item.productId?.img} alt="Product" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[13px] font-semibold text-gray-800 line-clamp-1">{item.productId?.name}</h4>
                        <p className="text-[11px] text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-[13px] font-bold text-gray-900">₹{item.price * item.quantity}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-50 flex flex-col gap-3">
                  {/* Payment Details */}
                  <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-500 shadow-sm">
                        <FiCreditCard size={14} />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Payment Method</p>
                        <p className="text-[12px] text-gray-800 font-bold capitalize">{order.paymentMethod}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Status</p>
                      <p className={`text-[12px] font-bold capitalize ${order.paymentStatus === 'paid' ? 'text-green-500' : order.paymentStatus === 'failed' ? 'text-red-500' : 'text-orange-500'}`}>
                        {order.paymentStatus}
                      </p>
                    </div>
                  </div>

                  {/* Timeline UI */}
                  <div className="bg-white rounded-xl border border-gray-100 p-4 mt-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Order Timeline</p>
                    <div className="relative">
                      <div className="absolute left-[11px] top-2 bottom-4 w-0.5 bg-gray-100 z-0"></div>
                      <div className="space-y-4 relative z-10">
                        {['pending', 'processing', 'shipped', 'delivered'].map((step, idx) => {
                          const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
                          const currentIndex = statusOrder.indexOf(order.orderStatus);
                          const isCompleted = currentIndex >= idx;
                          const isCurrent = currentIndex === idx;
                          
                          if (order.orderStatus === 'cancelled' && step !== 'pending') return null;

                          let icon = <FiClock size={12} />;
                          if (step === 'processing') icon = <FiPackage size={12} />;
                          if (step === 'shipped') icon = <FiTruck size={12} />;
                          if (step === 'delivered') icon = <FiCheckCircle size={12} />;

                          return (
                            <div key={step} className={`flex items-start gap-4 ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 bg-white ${
                                isCurrent ? 'border-orange-500 text-orange-500' : 
                                isCompleted ? 'border-green-500 text-green-500' : 'border-gray-300 text-gray-400'
                              }`}>
                                {icon}
                              </div>
                              <div className="pt-0.5">
                                <p className={`text-xs font-bold capitalize ${isCurrent ? 'text-orange-600' : isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                                  {step}
                                </p>
                                {isCurrent && step === 'shipped' && order.trackingId && (
                                  <p className="text-[10px] text-blue-500 font-mono mt-1">
                                    Tracking: {order.trackingId}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {order.orderStatus === 'cancelled' && (
                          <div className="flex items-start gap-4">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 bg-white border-red-500 text-red-500">
                              <FiCheckCircle size={12} />
                            </div>
                            <div className="pt-0.5">
                              <p className="text-xs font-bold text-red-500 capitalize">Cancelled</p>
                              {order.cancelRequest?.refundAmount > 0 && (
                                <p className="text-[10px] text-green-500 font-bold mt-0.5">
                                  ₹{order.cancelRequest.refundAmount} refunded to wallet
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cancel Request Status Card */}
                  {order.cancelRequest?.requested && order.orderStatus !== 'cancelled' && (
                    <div className={`rounded-xl p-4 border ${
                      order.cancelRequest.adminResponse === 'pending' ? 'bg-yellow-50 border-yellow-200' :
                      order.cancelRequest.adminResponse === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <FiAlertTriangle size={14} className={
                          order.cancelRequest.adminResponse === 'pending' ? 'text-yellow-600' :
                          order.cancelRequest.adminResponse === 'rejected' ? 'text-red-500' : 'text-green-500'
                        } />
                        <span className={`text-[12px] font-bold ${
                          order.cancelRequest.adminResponse === 'pending' ? 'text-yellow-700' :
                          order.cancelRequest.adminResponse === 'rejected' ? 'text-red-600' : 'text-green-700'
                        }`}>
                          {order.cancelRequest.adminResponse === 'pending' 
                            ? 'Cancel Request Sent' 
                            : order.cancelRequest.adminResponse === 'rejected' 
                              ? 'Cancel Request Rejected' 
                              : 'Cancel Approved'}
                        </span>
                      </div>
                      {order.cancelRequest.adminResponse === 'pending' && (
                        <p className="text-[11px] text-gray-600">
                          Your cancellation request is being reviewed. Expected refund: <span className="font-bold text-green-600">₹{order.cancelRequest.refundAmount} ({order.cancelRequest.refundPercent}%)</span>
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-2 px-1">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Ordered On</span>
                      <span className="text-[12px] text-gray-800 font-bold">{formatDate(order.createdAt)}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Total Amount</span>
                      <span className="text-[15px] text-orange-500 font-black">₹{order.totalAmount}</span>
                    </div>
                  </div>

                  {/* Cancel Button — only for pending/processing and no existing cancel request */}
                  {['pending', 'processing'].includes(order.orderStatus) && !order.cancelRequest?.requested && (
                    <button 
                      onClick={() => setShowCancelModal(order)}
                      className="mt-2 w-full py-2.5 border-2 border-red-200 text-red-500 font-bold rounded-xl text-[13px] hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <FiX size={16} /> Cancel Order
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ═══ POOJAS TAB ═══ */}
      {activeTab === 'Poojas' && (
        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : poojas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-8">
              <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center mb-4 text-purple-500">
                <GiFlowerPot size={40} />
              </div>
              <h3 className="text-[18px] font-bold text-gray-800 mb-2">No Pooja Bookings</h3>
              <p className="text-gray-400 text-[14px] text-center">Book a Pooja from the store to see it here.</p>
            </div>
          ) : (
            poojas.map((pooja, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-orange-200">
                      <img src={pooja.astrologerId?.avatar || 'https://ui-avatars.com/api/?name=Pandit&background=ffedD5&color=f97316'} alt="Pandit" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-[15px]">{pooja.poojaName}</h4>
                      <p className="text-[12px] text-gray-500">with {pooja.astrologerId?.name || 'Pandit'}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide ${
                    pooja.status === 'pending' ? 'bg-orange-50 text-orange-500' :
                    pooja.status === 'confirmed' ? 'bg-green-50 text-green-600' :
                    pooja.status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {pooja.status}
                  </span>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center mt-1 border border-gray-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Date & Time</span>
                    <span className="text-[13px] text-gray-800 font-bold">{pooja.date} at {pooja.time}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Mode</span>
                    <span className={`text-[13px] font-bold ${pooja.mode === 'online' ? 'text-purple-600' : 'text-orange-600'}`}>
                      {pooja.mode === 'online' ? 'Live Stream' : 'In-Person'}
                    </span>
                  </div>
                </div>

                {pooja.mode === 'online' && pooja.status === 'confirmed' && (
                  <button 
                    onClick={() => navigate(`/user/video-room/${pooja._id}`, { state: { astrologerId: pooja.astrologerId?._id } })}
                    className="mt-2 w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-purple-500/20 transition-all"
                  >
                    <FiVideo size={18} /> Join Live Pooja
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ═══ CANCEL ORDER MODAL ═══ */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <FiAlertTriangle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-[16px]">Cancel Order</h3>
                <p className="text-[11px] text-gray-400">Order #{showCancelModal._id.slice(-6).toUpperCase()}</p>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-xl p-3 mb-4 border border-green-100">
              <p className="text-[12px] text-green-700 font-medium">
                You will receive <span className="font-bold">80% refund (₹{Math.round(showCancelModal.totalAmount * 0.8)})</span> to your wallet upon approval.
              </p>
            </div>

            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)"
              rows={3}
              className="w-full bg-gray-50 rounded-xl p-3 text-[13px] outline-none border border-gray-100 focus:border-orange-300 resize-none mb-4"
            />

            <div className="flex gap-2">
              <button 
                onClick={() => { setShowCancelModal(null); setCancelReason(''); }}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-[13px] hover:bg-gray-200 transition-colors"
              >
                Keep Order
              </button>
              <button 
                onClick={handleCancelRequest}
                disabled={cancelLoading}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl text-[13px] hover:bg-red-600 transition-colors shadow-sm disabled:opacity-50"
              >
                {cancelLoading ? 'Sending...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderHistory;
