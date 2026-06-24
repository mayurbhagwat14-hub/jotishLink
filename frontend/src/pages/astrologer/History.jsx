import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiVideo, FiPhone, FiMessageCircle, FiCheckCircle, FiClock, FiCalendar, FiXCircle, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import { GiFlowerPot } from 'react-icons/gi';
import { fetchAstrologerHistoryThunk, deleteAstrologerHistoryBulkThunk } from '../../store/slices/astrologerSlice';

const History = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { history, loading } = useSelector((state) => state.astrologer);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    dispatch(fetchAstrologerHistoryThunk());
  }, [dispatch]);

  const handleCardClick = (e, item) => {
    if (e.target.type === 'checkbox') return;
    if (item.type === 'chat') {
      navigate(`/astrologer/chat/${item._id}`, { state: { viewOnly: true, userName: item.userName } });
    }
  };

  // Filter history based on active tab
  const filteredHistory = history.filter(item => {
    if (activeTab === 'pooja') return item.type === 'pooja';
    if (activeTab === 'freeChats') return item.isFreeChat;
    if (activeTab === 'consultations') return !item.isFreeChat && (item.type === 'chat' || item.type.includes('call'));
    // For 'all', we exclude free chats to keep them completely separate
    return !item.isFreeChat;
  });

  // Group history by date string (e.g. "Today, May 27", "Yesterday, May 26", etc)
  const groupedHistory = filteredHistory.reduce((acc, item) => {
    const d = new Date(item.date);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Formatting label
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let label = dateStr;
    if (d.toDateString() === today.toDateString()) {
      label = `Today, ${dateStr}`;
    } else if (d.toDateString() === yesterday.toDateString()) {
      label = `Yesterday, ${dateStr}`;
    } else {
      label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }

    if (!acc[label]) acc[label] = [];
    acc[label].push(item);
    return acc;
  }, {});

  const getIconForType = (type) => {
    switch (type) {
      case 'call':
      case 'audio call':
      case 'audio_call':
        return <FiPhone size={18} />;
      case 'video call':
      case 'video_call':
        return <FiVideo size={18} />;
      case 'pooja':
        return <GiFlowerPot size={18} />;
      case 'chat':
      default:
        return <FiMessageCircle size={18} />;
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setIsConfirmModalOpen(true);
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    await dispatch(deleteAstrologerHistoryBulkThunk(selectedIds)).unwrap();
    setIsDeleting(false);
    setSelectedIds([]);
    setIsConfirmModalOpen(false);
  };

  return (
    <div className="p-4 animate-fade-in mb-6 flex flex-col h-[calc(100vh-130px)]">
      
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-gray-800">History</h1>
        <p className="text-sm text-gray-500 font-medium">Log of all your past activities</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 shrink-0 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => { setActiveTab('all'); setSelectedIds([]); }} 
          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'all' ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          All History
        </button>
        <button 
          onClick={() => { setActiveTab('consultations'); setSelectedIds([]); }} 
          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'consultations' ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Consultations
        </button>
        <button 
          onClick={() => { setActiveTab('freeChats'); setSelectedIds([]); }} 
          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'freeChats' ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Free Chats
        </button>
        <button 
          onClick={() => { setActiveTab('pooja'); setSelectedIds([]); }} 
          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'pooja' ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Poojas
        </button>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            No history found.
          </div>
        ) : (
          Object.entries(groupedHistory).map(([dateLabel, items]) => (
            <div key={dateLabel} className={dateLabel.includes('Today') ? '' : 'pt-2'}>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FiCalendar size={12} /> {dateLabel}
              </h3>
              
              <div className="space-y-3">
                {items.map((item) => (
                  <div 
                    key={item._id} 
                    onClick={(e) => handleCardClick(e, item)}
                    className={`bg-white p-4 rounded-2xl border shadow-sm relative transition-colors ${item.type === 'chat' ? 'cursor-pointer hover:border-orange-200 hover:shadow-md' : ''} ${selectedIds.includes(item._id) ? 'border-red-400 bg-red-50/30' : 'border-gray-100'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-red-500 rounded border-gray-300 focus:ring-red-500 cursor-pointer"
                          checked={selectedIds.includes(item._id)}
                          onChange={() => toggleSelection(item._id)}
                        />
                        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center border border-orange-200">
                          {getIconForType(item.type)}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm capitalize flex items-center gap-2">
                            {item.type === 'pooja' ? item.poojaName : item.userName}
                            {item.isFreeChat && (
                              <span className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-widest border border-green-200">Free</span>
                            )}
                          </h4>
                          <p className="text-[10px] uppercase font-bold tracking-wider mt-0.5 text-gray-400 flex items-center gap-1">
                            {item.type.replace('_', ' ')}
                            {item.type === 'pooja' && item.userName && (
                              <span className="normal-case text-gray-500 font-medium">• for {item.userName}</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 font-medium mt-1">
                            <FiClock size={10} /> 
                            {new Date(item.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            {item.duration > 0 && ` • ${formatDuration(item.duration)}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <p className="font-black text-gray-800 text-lg flex items-baseline gap-1">
                          ₹{item.amount}
                        </p>
                        <p className="text-[9px] text-gray-400 italic mb-1">(Platform fees deducted)</p>
                        {item.status === 'completed' || item.status === 'confirmed' ? (
                          <span className="text-[10px] text-green-500 font-bold flex items-center gap-1 justify-end">
                            <FiCheckCircle size={10} /> Completed
                          </span>
                        ) : (
                          <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 justify-end">
                            <FiXCircle size={10} /> {item.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bulk Delete Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-[90px] left-0 right-0 px-4 z-40 animate-fade-in-up">
          <div className="bg-gray-800 text-white rounded-2xl shadow-xl p-3 flex justify-between items-center max-w-lg mx-auto border border-gray-700">
            <span className="font-medium text-sm ml-2">
              {selectedIds.length} selected
            </span>
            <button 
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
            >
              <FiTrash2 size={16} /> Delete
            </button>
          </div>
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
                Are you sure you want to delete {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} from your history? This action cannot be undone.
              </p>
            </div>
            <div className="p-4 bg-gray-50 flex gap-3 border-t border-gray-100">
              <button 
                onClick={() => setIsConfirmModalOpen(false)}
                className="flex-1 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                disabled={isDeleting}
                className="flex-1 py-3 bg-red-500 rounded-xl font-bold text-white shadow-md hover:bg-red-600 transition-colors disabled:opacity-70 flex items-center justify-center"
              >
                {isDeleting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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

export default History;
