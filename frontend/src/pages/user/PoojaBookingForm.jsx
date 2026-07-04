import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiClock, FiMapPin, FiVideo } from 'react-icons/fi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const PoojaBookingForm = () => {
  // const { panditId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { pandit, pooja } = location.state || {};

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const handleFocus = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        setIsKeyboardOpen(true);
      }
    };
    const handleBlur = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        setIsKeyboardOpen(false);
      }
    };
    window.addEventListener('focusin', handleFocus);
    window.addEventListener('focusout', handleBlur);
    return () => {
      window.removeEventListener('focusin', handleFocus);
      window.removeEventListener('focusout', handleBlur);
    };
  }, []);

  if (!pandit) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">Invalid Booking Session</p>
        <button onClick={() => navigate('/user/store')} className="bg-[#fa6830] text-white px-6 py-2 rounded-xl font-bold">
          Go Back
        </button>
      </div>
    );
  }

  const handleSubmitClick = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    // Validate that date/time is not in the past
    const [timeVal, modifier] = formData.time.split(' ');
    let [hours, minutes] = timeVal.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
    
    const selectedDateTime = new Date(`${formData.date}T${String(hours).padStart(2, '0')}:${minutes}:00`);
    if (selectedDateTime < new Date()) {
      toast.error('Cannot select a past date and time for booking');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      await api.post('/pooja/book', {
        poojaName: pooja,
        astrologerId: pandit.id || pandit._id,
        date: formData.date,
        time: formData.time,
        notes: formData.notes,
        mode: 'offline', // We default it so it doesn't break backend schemas
        price: location.state?.price || 500
      });
      toast.success('Pooja booked successfully!');
      navigate('/user/history?tab=Poojas'); // Navigate to history and open Poojas tab
    } catch (error) {
      setErrorModalMessage(error.response?.data?.message || 'Failed to book pooja');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.date && formData.time;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 bg-white sticky top-0 z-10 border-b border-gray-50 shadow-sm">
        <button onClick={() => navigate('/user/store', { state: { tab: 'Pandit Booking' } })} className="text-gray-800 p-1 -ml-1 rounded-full hover:bg-gray-100 transition-colors">
          <FiArrowLeft size={22} />
        </button>
        <h1 className="text-[17px] font-bold text-gray-800">Booking Details</h1>
      </div>

      {/* Booking Summary */}
      <div className="px-5 py-6 bg-gradient-to-br from-orange-50 to-white border-b border-orange-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-full blur-3xl opacity-50 -mr-10 -mt-10"></div>
        <p className="text-[#fa6830] font-bold text-[12px] uppercase tracking-widest mb-1.5">{pooja}</p>
        <div className="flex items-center gap-4 mt-3 relative z-10">
          <div className="w-16 h-16 rounded-full border-[3px] border-white shadow-md overflow-hidden shrink-0 bg-orange-100">
            <img src={pandit.avatar || pandit.image || pandit.img} alt={pandit.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-gray-900 leading-tight mb-1">{pandit.name}</h2>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] text-gray-500 font-medium">Price:</span>
              <span className="text-[15px] font-bold text-[#e55923]">₹{location.state?.price || 500}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-5 pt-6">
        <h3 className="text-[18px] font-bold text-gray-800 mb-5 leading-snug">When & Where should the Pooja happen?</h3>
        
        <form onSubmit={handleSubmitClick} className="space-y-5">
          

          {/* Date Picker */}
          <div>
            <label className="block text-gray-700 text-[13px] font-bold mb-2">Select Date</label>
            <input
              type="date"
              required
              className="w-full border-2 border-gray-200 rounded-xl py-3.5 px-4 text-[15px] font-medium text-gray-800 outline-none focus:border-[#fa6830] focus:ring-2 focus:ring-orange-100 transition-all bg-gray-50 focus:bg-white cursor-pointer"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              onClick={(e) => e.target.showPicker && e.target.showPicker()}
            />
          </div>

          {/* Time Picker */}
          <div>
            <label className="block text-gray-700 text-[13px] font-bold mb-2">Select Time</label>
            <div className="relative">
              <select
                required
                className="w-full border-2 border-gray-200 rounded-xl py-3.5 px-4 text-[15px] font-medium text-gray-800 outline-none focus:border-[#fa6830] focus:ring-2 focus:ring-orange-100 transition-all bg-gray-50 focus:bg-white cursor-pointer appearance-none"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              >
                <option value="" disabled>Select AM/PM Time</option>
                {Array.from({ length: 48 }).map((_, i) => {
                  const h = Math.floor(i / 2);
                  const m = i % 2 === 0 ? '00' : '30';
                  const isPM = h >= 12;
                  const hour12 = h % 12 || 12;
                  const timeStr = `${hour12}:${m} ${isPM ? 'PM' : 'AM'}`;
                  return <option key={timeStr} value={timeStr}>{timeStr}</option>;
                })}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                <FiClock size={18} />
              </div>
            </div>
          </div>


          {/* Additional Notes */}
          <div>
            <label className="block text-gray-700 text-[13px] font-bold mb-2">Additional Notes (Optional)</label>
            <div className="relative">
              <textarea
                rows="2"
                placeholder="Any special requests or details..."
                className="w-full border-2 border-gray-200 rounded-xl py-3.5 px-4 text-[15px] font-medium text-gray-800 outline-none focus:border-[#fa6830] focus:ring-2 focus:ring-orange-100 transition-all bg-gray-50 focus:bg-white resize-none"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

        </form>
      </div>

      {/* Footer Action */}
      {!isKeyboardOpen && (
        <div className="px-5 pb-6 pt-4 bg-white border-t border-gray-50 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] shrink-0">
          <button
            onClick={handleSubmitClick}
            disabled={!isFormValid || loading}
            className={`w-full py-4 rounded-xl font-bold tracking-wide text-[15px] transition-all duration-300 shadow-sm flex justify-center items-center gap-2 ${
              isFormValid && !loading
                ? 'bg-[#fa6830] text-white shadow-orange-200 hover:bg-[#e55923] active:scale-[0.98]'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                BOOKING...
              </span>
            ) : 'CONFIRM POOJA BOOKING'}
          </button>
          <p className="text-center text-gray-400 text-[12px] font-medium mt-3">You won't be charged yet</p>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-[16px]">Confirm Booking</h3>
            </div>
            
            <div className="p-5 space-y-4">
              <p className="text-[14px] text-gray-700 font-medium leading-relaxed">
                The booking amount of <span className="font-bold text-[#e55923]">₹{location.state?.price || 500}</span> will be reserved from your wallet. 
                The amount will only be transferred after the Pooja is successfully completed and verified. 
              </p>
              <p className="text-[13px] text-gray-500 font-bold">Do you want to continue?</p>
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmSubmit}
                className="flex-1 px-4 py-3 rounded-xl font-bold bg-[#fa6830] text-white hover:bg-[#e55923] transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                Yes, Book Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error / Insufficient Balance Modal */}
      {errorModalMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-red-100 bg-red-50/50 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center font-bold text-xl">!</div>
              <h3 className="font-bold text-gray-900 text-[18px]">Booking Failed</h3>
            </div>
            
            <div className="p-6 text-center">
              <p className="text-[14px] text-gray-700 font-medium leading-relaxed">
                {errorModalMessage}
              </p>
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button 
                onClick={() => setErrorModalMessage('')}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
              {errorModalMessage.toLowerCase().includes('wallet') && (
                <button 
                  onClick={() => navigate('/user/wallet')}
                  className="flex-1 px-4 py-3 rounded-xl font-bold bg-[#fa6830] text-white hover:bg-[#e55923] transition-colors shadow-sm"
                >
                  Recharge Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PoojaBookingForm;
