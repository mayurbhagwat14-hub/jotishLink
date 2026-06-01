import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiVideo, FiPhone, FiMessageCircle, FiCheckCircle, FiClock, FiCalendar, FiXCircle } from 'react-icons/fi';
import { GiFlowerPot } from 'react-icons/gi';
import { fetchAstrologerHistoryThunk } from '../../store/slices/astrologerSlice';

const History = () => {
  const dispatch = useDispatch();
  const { history, loading } = useSelector((state) => state.astrologer);

  useEffect(() => {
    dispatch(fetchAstrologerHistoryThunk());
  }, [dispatch]);

  // Group history by date string (e.g. "Today, May 27", "Yesterday, May 26", etc)
  const groupedHistory = history.reduce((acc, item) => {
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
        return <FiPhone size={18} />;
      case 'video call':
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

  return (
    <div className="p-4 animate-fade-in mb-6 flex flex-col h-[calc(100vh-130px)]">
      
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-gray-800">History</h1>
        <p className="text-sm text-gray-500 font-medium">Log of all your past activities</p>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : history.length === 0 ? (
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
                  <div key={item._id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center border border-orange-200">
                          {getIconForType(item.type)}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm capitalize">{item.userName}</h4>
                          <p className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                            <FiClock size={10} /> 
                            {new Date(item.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            {item.duration > 0 && ` • ${formatDuration(item.duration)}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-gray-800 text-lg">₹{item.amount}</p>
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

    </div>
  );
};

export default History;
