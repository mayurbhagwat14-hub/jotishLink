import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiArrowLeft, FiVideo, FiPackage, FiTruck, FiCheckCircle, FiClock, FiCreditCard, FiMessageCircle, FiX, FiAlertTriangle, FiTrash2, FiCheckSquare } from 'react-icons/fi';
import { GiFlowerPot } from 'react-icons/gi';
import { getUserSessions, getUserPoojas, getUserCalls, deleteUserHistory } from '../../api/userApis';
import { getUserOrders } from '../../api/storeApis';
import { getSocket } from '../../socket/socketManager';
import { formatTime12Hour } from '../../utils/formatTime';
import { toast } from 'react-hot-toast';
import LogoLoader from '../../components/LogoLoader';

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
  const { appName } = useSelector((state) => state.settings) || { appName: 'JyotishLink' };
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'wallet' ? 'Wallet' : (searchParams.get('tab') || 'Chat');
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && historyTabs.includes(tab)) {
      setActiveTab(tab);
    } else if (tab === 'wallet') {
      setActiveTab('Wallet');
    }
  }, [searchParams]);
  const navigate = useNavigate();
  const { openSidebar } = useOutletContext();
  
  const [sessions, setSessions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [poojas, setPoojas] = useState([]);
  const [storeOrders, setStoreOrders] = useState([]);
  const [calls, setCalls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [debugError, setDebugError] = useState('');



  // Selection mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const socket = getSocket();

  useEffect(() => {
    if (!socket) return;
    const handleStatusUpdate = (data) => {
      setPoojas(prev => prev.map(p => p._id === data.poojaId ? data.pooja : p));
    };
    const handleOrderUpdate = (data) => {
      if (!data || !data.order) return;
      setStoreOrders(prev => prev.map(o => o.dbId === data.order._id ? { ...o, orderStatus: data.order.orderStatus, paymentStatus: data.order.paymentStatus } : o));
    };
    socket.on('pooja_status_updated', handleStatusUpdate);
    socket.on('order_updated', handleOrderUpdate);
    return () => {
      socket.off('pooja_status_updated', handleStatusUpdate);
      socket.off('order_updated', handleOrderUpdate);
    };
  }, [socket]);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);

  // Reset selection when tab changes
  useEffect(() => {
    setIsSelectionMode(false);
    setSelectedIds([]);
    setIsConfirmModalOpen(false);
  }, [activeTab]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessionRes, poojaRes, storeRes, callsRes] = await Promise.all([
          getUserSessions().catch((e) => ({ data: { success: false, debug: e.message } })),
          getUserPoojas().catch(() => ({ data: { data: {} } })),
          getUserOrders().catch(() => ({ data: { data: {} } })),
          getUserCalls().catch(() => ({ data: { data: {} } }))
        ]);
        
        if (sessionRes.data?.success) {
          setSessions(sessionRes.data.data.sessions || []);
          setDebugError('');
        } else {
          setDebugError('API Failed: ' + (sessionRes.data?.debug || 'Unknown error or no success flag') + ' | Raw data: ' + JSON.stringify(sessionRes.data || {}));
        }
        
        const rawTxns = sessionRes.data?.data?.transactions || [];
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
        if (poojaRes.data?.success) {
          setPoojas(poojaRes.data.data.poojas || []);
        }
        if (storeRes.data?.success) {
          console.log("STORE RES DATA:", storeRes.data);
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

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const updateLocalPooja = (data) => {
      if (data && data.booking) {
        setPoojas(prev => prev.map(p => p._id === data.booking._id ? data.booking : p));
      }
    };

    socket.on('pooja_booking_accepted', updateLocalPooja);
    socket.on('pooja_booking_rejected', updateLocalPooja);
    socket.on('pooja_booking_completed', updateLocalPooja);

    return () => {
      socket.off('pooja_booking_accepted', updateLocalPooja);
      socket.off('pooja_booking_rejected', updateLocalPooja);
      socket.off('pooja_booking_completed', updateLocalPooja);
    };
  }, []);

  const handleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setIsConfirmModalOpen(true);
  };

  const handleSingleDelete = (id) => {
    setSelectedIds([id]);
    setIsConfirmModalOpen(true);
  };

  const executeDelete = async () => {

    let type;
    if (activeTab === 'Chat') type = 'chat';
    else if (activeTab === 'Calls') type = 'call';
    else if (activeTab === 'Poojas') type = 'pooja';
    else if (activeTab === 'Orders') type = 'order';
    
    if (!type) return;

    try {
      setIsLoading(true);
      await deleteUserHistory({ ids: selectedIds, type });
      
      // Update local state
      if (type === 'chat') setSessions(prev => prev.filter(x => !selectedIds.includes(x._id)));
      if (type === 'call') {
        setCalls(prev => prev.filter(x => !selectedIds.includes(x._id)));
        setSessions(prev => prev.filter(x => !selectedIds.includes(x._id)));
      }
      if (type === 'pooja') setPoojas(prev => prev.filter(x => !selectedIds.includes(x._id)));
      if (type === 'order') setStoreOrders(prev => prev.filter(x => !selectedIds.includes(x._id)));
      
      setIsSelectionMode(false);
      setSelectedIds([]);
      setIsConfirmModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete history');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white min-h-screen font-sans pb-24">

      {/* ═══ TOP NAVBAR ═══ */}
      <div className="flex items-center justify-between px-4 py-3 bg-white sticky top-0 z-30 shadow-sm border-b border-gray-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/user/home')} className="text-gray-800 hover:bg-gray-100 p-1.5 rounded-full transition-colors">
            <FiArrowLeft size={20} />
          </button>
          <span className="text-gray-800 font-semibold text-[17px]">History</span>
        </div>
        <div className="flex items-center gap-3">
          {['Chat', 'Calls', 'Orders', 'Poojas'].includes(activeTab) && (
            <button 
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                setSelectedIds([]);
              }} 
              className={`text-[12px] font-bold px-3 py-1.5 rounded-full transition-colors ${isSelectionMode ? 'bg-gray-200 text-gray-700' : 'bg-orange-50 text-[#e55923] border border-orange-200'}`}
            >
              {isSelectionMode ? 'Cancel' : 'Select'}
            </button>
          )}
          <div 
            onClick={openSidebar}
            className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden border border-orange-200 cursor-pointer shrink-0 ml-1"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[#fa6830] font-bold text-xs">{(user?.name || 'G')[0]}</span>
            )}
          </div>
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="flex overflow-x-auto no-scrollbar bg-white border-b border-gray-100 px-2">
        {historyTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setSearchParams({ tab });
            }}
            className={`flex-1 min-w-[70px] py-3 text-[12px] font-bold transition-all relative whitespace-nowrap px-2 ${
              activeTab === tab ? 'text-[#fa6830]' : 'text-gray-400'
            }`}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-2 right-2 h-[3px] bg-[#fa6830] rounded-full" />}
          </button>
        ))}
      </div>

      {/* ═══ CHAT TAB ═══ */}
      {activeTab === 'Chat' && (() => {
        const chatSessions = sessions.filter(s => s.type === 'chat' || !s.type);
        return (
        <div className="divide-y divide-gray-50">
          {debugError && <div className="p-4 bg-red-100 text-red-700 text-xs font-mono break-words">{debugError}</div>}
          {isLoading ? (
            <div className="flex justify-center p-8"><LogoLoader /></div>
          ) : chatSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-8">
              <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                <FiMessageCircle size={40} className="text-orange-400" />
              </div>
              <h3 className="text-[18px] font-bold text-gray-800 mb-2">No Chat History</h3>
              <p className="text-gray-400 text-[14px] text-center">Start chatting with an astrologer to see your history here.</p>
              <button 
                onClick={() => navigate('/user/astrologers')}
                className="mt-6 bg-[#fa6830] text-white font-bold py-3 px-8 rounded-xl shadow-md hover:bg-[#e55923] transition-colors"
              >
                Find Astrologer
              </button>
            </div>
          ) : (
            chatSessions.map((item, i) => {
              const astroName = item.astrologerId?.name || 'Astrologer';
              const astroAvatar = item.astrologerId?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(astroName)}&background=ffedD5&color=f97316`;
              const lastMsg = item.messages?.length > 0 ? item.messages[item.messages.length - 1]?.text : 'No messages';
              const durationStr = item.durationSeconds ? `${Math.floor(item.durationSeconds / 60)}m ${item.durationSeconds % 60}s` : '0m 0s';

              return (
                <div key={i} className="px-4 py-3.5 hover:bg-orange-50/30 transition-colors flex items-start gap-2 relative">
                  {isSelectionMode && (
                    <div 
                      onClick={() => handleSelect(item._id)}
                      className={`mt-2 w-5 h-5 rounded flex items-center justify-center cursor-pointer shrink-0 border transition-colors ${selectedIds.includes(item._id) ? 'bg-[#fa6830] border-[#fa6830] text-white' : 'border-gray-300'}`}
                    >
                      {selectedIds.includes(item._id) && <FiCheckSquare size={14} />}
                    </div>
                  )}
                  <div className="flex-1 min-w-0" onClick={() => isSelectionMode && handleSelect(item._id)}>
                    <div 
                      className="flex items-center gap-3 mb-3 cursor-pointer hover:bg-white rounded-lg transition-colors p-1 -m-1"
                      onClick={(e) => {
                        if (!isSelectionMode && item.astrologerId?._id) {
                          e.stopPropagation();
                          navigate(`/user/astrologer/${item.astrologerId._id}`);
                        }
                      }}
                    >
                      <div className="w-[48px] h-[48px] rounded-full overflow-hidden border-2 border-orange-100 shrink-0">
                        <img src={astroAvatar} alt={astroName} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 text-[15px]">{astroName}</h4>
                        <p className="text-[12px] text-gray-400">{formatDate(item.createdAt)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            (item.status || 'completed') === 'completed' ? 'bg-green-50 text-green-600' :
                            item.status === 'missed' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {item.status || 'completed'}
                          </span>
                          <span className="text-[12px] text-gray-500 font-medium">{durationStr} • ₹{Number(item.amountDeducted || 0).toFixed(2)}</span>
                        </div>
                        <p className="text-[12px] text-gray-500 line-clamp-1 mt-1">{typeof lastMsg === 'string' ? lastMsg.slice(0, 60) : 'Chat session'}{lastMsg?.length > 60 ? '...' : ''}</p>
                      </div>
                      {!isSelectionMode && (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleSingleDelete(item._id); 
                          }}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors self-start"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      )}
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
                      className="flex-1 py-2 bg-[#fa6830] text-white font-bold rounded-xl text-[12px] shadow-sm shadow-orange-200 hover:bg-[#e55923] transition-colors"
                    >
                      Chat Again
                    </button>
                  </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        );
      })()}

      {/* ═══ CALLS TAB ═══ */}
      {activeTab === 'Calls' && (() => {
        const callSessions = [
          ...sessions.filter(s => 
            (s.type === 'audio_call' || s.type === 'video_call' || s.type === 'audio' || s.type === 'video') && 
            s.durationSeconds > 0
          ), 
          ...calls
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return (
        <div className="divide-y divide-gray-50">
          {isLoading ? (
            <div className="flex justify-center p-8"><LogoLoader /></div>
          ) : callSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-8">
              <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                <FiClock size={40} className="text-orange-400" />
              </div>
              <h3 className="text-[18px] font-bold text-gray-800 mb-2">No Call History</h3>
              <p className="text-gray-400 text-[14px] text-center">Start a call with an astrologer to see your history here.</p>
              <button 
                onClick={() => navigate('/user/astrologers')}
                className="mt-6 bg-[#fa6830] text-white font-bold py-3 px-8 rounded-xl shadow-md hover:bg-[#e55923] transition-colors"
              >
                Find Astrologer
              </button>
            </div>
          ) : (
            callSessions.map((item, i) => {
              const astroName = item.astrologerId?.name || 'Astrologer';
              const astroAvatar = item.astrologerId?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(astroName)}&background=ffedD5&color=f97316`;
              const callDuration = item.duration || item.durationSeconds || 0;
              const durationStr = callDuration ? `${Math.floor(callDuration / 60)}m ${callDuration % 60}s` : '0m 0s';
              const cost = item.totalAmount || item.amountDeducted || 0;

              return (
                <div key={i} className="px-4 py-3.5 hover:bg-orange-50/30 transition-colors flex items-start gap-2 relative">
                  {isSelectionMode && (
                    <div 
                      onClick={() => handleSelect(item._id)}
                      className={`mt-2 w-5 h-5 rounded flex items-center justify-center cursor-pointer shrink-0 border transition-colors ${selectedIds.includes(item._id) ? 'bg-[#fa6830] border-[#fa6830] text-white' : 'border-gray-300'}`}
                    >
                      {selectedIds.includes(item._id) && <FiCheckSquare size={14} />}
                    </div>
                  )}
                  <div className="flex-1 min-w-0" onClick={() => isSelectionMode && handleSelect(item._id)}>
                    <div 
                      className="flex items-center gap-3 mb-3 cursor-pointer hover:bg-white rounded-lg transition-colors p-1 -m-1"
                      onClick={(e) => {
                        if (!isSelectionMode && item.astrologerId?._id) {
                          e.stopPropagation();
                          navigate(`/user/astrologer/${item.astrologerId._id}`);
                        }
                      }}
                    >
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
                          {item.status === 'completed' && <span className="text-[12px] text-gray-500 font-medium">{durationStr} • ₹{Number(cost).toFixed(2)}</span>}
                        </div>
                      </div>
                      {!isSelectionMode && (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleSingleDelete(item._id); 
                          }}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors self-start"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      )}
                    </div>
                  <div className="flex gap-2 pl-[60px]">
                    <button 
                      onClick={() => navigate('/user/astrologers?type=call', { state: { autoConnectAstro: item.astrologerId } })}
                      className="flex-1 py-2 bg-[#fa6830] text-white font-bold rounded-xl text-[12px] shadow-sm shadow-orange-200 hover:bg-[#e55923] transition-colors"
                    >
                      Call Again
                    </button>
                  </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        );
      })()}

      {/* ═══ WALLET TAB ═══ */}
      {activeTab === 'Wallet' && (
        <div>
          {/* Premium Balance Card */}
          <div className="px-4 pt-4 pb-2">
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-6 text-white shadow-xl overflow-hidden border border-gray-700">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-[#fa6830]/20 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-blue-500/20 blur-xl"></div>
              
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-[11px] font-bold tracking-wider uppercase mb-1">Available Balance</p>
                  <div className="flex items-end gap-1">
                    <span className="text-xl font-medium text-gray-300 pb-1">₹</span>
                    <h2 className="text-[36px] font-black leading-none tracking-tight">
                      {Number(user?.wallet || 0).toFixed(2)}
                    </h2>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-inner">
                  <FiCreditCard size={20} className="text-orange-400" />
                </div>
              </div>
              
              <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-[11px] text-gray-300 font-medium">Wallet Active</span>
                </div>
                <button 
                  onClick={() => navigate('/user/wallet')} 
                  className="bg-[#fa6830] hover:bg-orange-400 text-white text-[12px] font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-orange-500/30 transition-all active:scale-95"
                >
                  Recharge
                </button>
              </div>
            </div>
          </div>

          {/* Transaction List — no sub-tabs */}
          <div className="px-4 pt-3">
            <h3 className="text-[14px] font-bold text-gray-800 mb-2">Wallet Transactions</h3>
          </div>
          <div className="divide-y divide-gray-50/50 space-y-2 px-4 pb-4">
            {isLoading ? (
               <div className="flex justify-center p-8"><LogoLoader /></div>
            ) : transactions.length === 0 ? (
               <div className="p-8 text-center text-gray-400">No transactions found.</div>
            ) : (
              transactions.map((txn, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_15px_-4px_rgba(0,0,0,0.1)] transition-all">
                  <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                      txn.type === 'deduction' ? 'bg-gradient-to-br from-red-50 to-red-100/50 text-red-500 border border-red-100' :
                      txn.type === 'refund' ? 'bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-500 border border-blue-100' :
                      'bg-gradient-to-br from-green-50 to-green-100/50 text-green-500 border border-green-100'
                    }`}>
                      {txn.type === 'deduction' ? <span className="font-bold text-lg">↓</span> : 
                       txn.type === 'refund' ? <span className="font-bold text-lg">↩</span> : 
                       <span className="font-bold text-lg">↑</span>}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-[14px] line-clamp-1">{txn.desc}</h4>
                      <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                        {txn.type.charAt(0).toUpperCase() + txn.type.slice(1)} • {formatTxnDate(txn.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[15px] font-black shrink-0 tracking-tight ${
                      txn.type === 'deduction' ? 'text-gray-800' : 'text-green-500'
                    }`}>
                      {txn.type === 'deduction' ? '-' : '+'}₹{Number(Math.abs(txn.amount)).toFixed(2)}
                    </span>
                    {txn.type === 'deduction' && (
                      <span className="text-[10px] text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded-md mt-1">
                        Deducted
                      </span>
                    )}
                  </div>
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
            <div className="flex justify-center p-8"><LogoLoader /></div>
          ) : storeOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-8">
              <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                <FiPackage size={40} className="text-[#fa6830]" />
              </div>
              <h3 className="text-[18px] font-bold text-gray-800 mb-2">No Orders Yet</h3>
              <p className="text-gray-400 text-[14px] text-center">Start shopping from {appName} Services to see your orders here.</p>
              <button 
                onClick={() => navigate('/user/store')}
                className="mt-6 bg-[#fa6830] text-white font-bold py-3 px-8 rounded-xl shadow-md hover:bg-[#e55923] transition-colors"
              >
                Go to Store
              </button>
            </div>
          ) : (
            storeOrders.map((order, i) => (
              <div key={i} className="flex items-start gap-2 relative">
                {isSelectionMode && (
                  <div 
                    onClick={() => handleSelect(order._id)}
                    className={`mt-6 w-5 h-5 rounded flex items-center justify-center cursor-pointer shrink-0 border transition-colors ${selectedIds.includes(order._id) ? 'bg-[#fa6830] border-[#fa6830] text-white' : 'border-gray-300'}`}
                  >
                    {selectedIds.includes(order._id) && <FiCheckSquare size={14} />}
                  </div>
                )}
                <div 
                  className="flex-1 min-w-0 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3 cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => isSelectionMode ? handleSelect(order._id) : navigate(`/user/order/${order._id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-2 items-center">
                      <FiPackage className="text-[#fa6830]" />
                      <span className="text-[13px] font-bold text-gray-800">Order ID: {order._id.slice(-6).toUpperCase()}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide ${
                      order.orderStatus === 'pending' ? 'bg-orange-50 text-[#fa6830]' :
                      order.orderStatus === 'delivered' ? 'bg-green-50 text-green-600' :
                      order.orderStatus === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                    }`}>
                      {order.orderStatus}
                    </span>
                  </div>
                
                  <div className="space-y-3">
                    {order.items.slice(0, 1).map((item, idx) => (
                      <div key={idx} className="flex gap-3 items-center">
                        <div className="w-12 h-12 rounded-xl bg-orange-50 overflow-hidden border border-gray-100">
                          <img src={item.productId?.image || item.productId?.img || '/store_bracelet.png'} alt="Product" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[13px] font-semibold text-gray-800 line-clamp-1">{item.productId?.name}</h4>
                          <p className="text-[11px] text-gray-500">Qty: {item.quantity} {order.items.length > 1 && `(+${order.items.length - 1} more)`}</p>
                        </div>
                        <div className="text-[13px] font-bold text-gray-900">₹{order.totalAmount}</div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center mt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-500 shadow-sm">
                        <FiCreditCard size={14} />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">PAYMENT METHOD</p>
                        <p className="text-[12px] text-gray-800 font-bold capitalize">{order.paymentMethod}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">STATUS</p>
                      <p className={`text-[12px] font-bold capitalize ${
                        (order.paymentStatus === 'paid' || order.orderStatus === 'delivered') ? 'text-green-500' : 
                        (order.paymentStatus === 'failed' || order.orderStatus === 'cancelled') ? 'text-red-500' : 
                        'text-[#fa6830]'
                      }`}>
                        {(order.orderStatus === 'delivered' || order.paymentStatus === 'paid') ? 'Success' : 
                         (order.orderStatus === 'cancelled' && order.paymentStatus === 'pending') ? 'Cancelled' : 
                         order.paymentStatus}
                      </p>
                    </div>
                  </div>
                  {/* Shiprocket Tracking Link */}
                  {order.awbCode ? (
                    <div className="mt-2 text-right">
                      <a 
                        href={`https://shiprocket.co/tracking/${order.awbCode}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#fa6830] bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FiTruck size={14} /> Track Order
                      </a>
                    </div>
                  ) : order.shiprocketOrderId && order.orderStatus !== 'cancelled' ? (
                    <div className="mt-2 text-right">
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                        <FiPackage size={14} /> Processing...
                      </span>
                    </div>
                  ) : null}
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
            <div className="flex justify-center p-8"><LogoLoader /></div>
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
              <div key={i} className="flex items-start gap-2 relative">
                {isSelectionMode && (
                  <div 
                    onClick={() => handleSelect(pooja._id)}
                    className={`mt-6 w-5 h-5 rounded flex items-center justify-center cursor-pointer shrink-0 border transition-colors ${selectedIds.includes(pooja._id) ? 'bg-[#fa6830] border-[#fa6830] text-white' : 'border-gray-300'}`}
                  >
                    {selectedIds.includes(pooja._id) && <FiCheckSquare size={14} />}
                  </div>
                )}
                <div className={`flex-1 min-w-0 bg-white rounded-2xl p-4 shadow-sm border border-orange-100 flex flex-col gap-3 cursor-pointer hover:shadow-md transition-shadow ${isSelectionMode && selectedIds.includes(pooja._id) ? 'border-[#fa6830] bg-orange-50/10' : ''}`} onClick={() => isSelectionMode ? handleSelect(pooja._id) : navigate(`/user/pooja/${pooja._id}`)}>
                  <div className="flex justify-between items-start">
                    <div 
                      className="flex gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => {
                        if (!isSelectionMode && pooja.astrologerId?._id) {
                          e.stopPropagation();
                          navigate(`/user/astrologer/${pooja.astrologerId._id}`);
                        }
                      }}
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-orange-200">
                        <img src={pooja.astrologerId?.avatar || 'https://ui-avatars.com/api/?name=Pandit&background=ffedD5&color=f97316'} alt="Pandit" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-[15px]">{pooja.poojaName}</h4>
                        <p className="text-[12px] text-gray-500">with {pooja.astrologerId?.name || 'Pandit'}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide ${
                      pooja.status === 'Pending' ? 'bg-orange-50 text-[#fa6830]' :
                      pooja.status === 'Accepted' || pooja.status === 'In Progress' ? 'bg-blue-50 text-blue-600' :
                      pooja.status === 'Completed' ? 'bg-green-50 text-green-600' :
                      pooja.status === 'Rejected' || pooja.status === 'Expired' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {pooja.status}
                    </span>
                  </div>
                
                <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center mt-1 border border-gray-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Date & Time</span>
                    <span className="text-[13px] text-gray-800 font-bold">{pooja.date} at {formatTime12Hour(pooja.time)}</span>
                  </div>
                </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}



      {/* Delete Selected Sticky Bottom Bar */}
      {isSelectionMode && selectedIds.length > 0 && (
        <div className="fixed bottom-[70px] left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] z-40 animate-fade-in flex items-center justify-between">
          <span className="text-[13px] font-bold text-gray-700">{selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected</span>
          <button 
            onClick={handleDeleteSelected}
            className="bg-red-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 hover:bg-red-600 transition-colors"
          >
            <FiTrash2 size={16} /> Delete Selected
          </button>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <FiAlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete History</h3>
              <p className="text-gray-500 text-sm">
                Are you sure you want to delete {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} from your {activeTab.toLowerCase()} history? This action cannot be undone.
              </p>
            </div>
            <div className="p-4 bg-gray-50 flex gap-3 border-t border-gray-100">
              <button 
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  if (!isSelectionMode) setSelectedIds([]);
                }}
                className="flex-1 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                disabled={isLoading}
                className="flex-1 py-3 bg-red-500 rounded-xl font-bold text-white shadow-md hover:bg-red-600 transition-colors disabled:opacity-70 flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Yes, Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedMedia(null)}>
          <button className="absolute top-6 right-6 text-white hover:text-gray-300 p-2 bg-black/50 rounded-full backdrop-blur-sm transition-colors" onClick={() => setSelectedMedia(null)}>
            <FiX size={24} />
          </button>
          <div className="relative max-w-full max-h-full flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
            {selectedMedia.type === 'video' ? (
              <video src={selectedMedia.url} controls autoPlay className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl" />
            ) : (
              <img src={selectedMedia.url} alt="Proof Fullscreen" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderHistory;
