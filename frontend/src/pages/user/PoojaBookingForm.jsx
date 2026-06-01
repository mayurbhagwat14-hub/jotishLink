import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiClock, FiMapPin, FiVideo } from 'react-icons/fi';
import api from '../../api/axios';

const PoojaBookingForm = () => {
  // const { panditId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { pandit, pooja } = location.state || {};

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    address: '',
    mode: 'offline', // 'online' or 'offline'
  });
  const [loading, setLoading] = useState(false);

  if (!pandit) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">Invalid Booking Session</p>
        <button onClick={() => navigate('/user/store')} className="bg-orange-500 text-white px-6 py-2 rounded-xl font-bold">
          Go Back
        </button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/pooja/book', {
        poojaName: pooja,
        astrologerId: pandit.id || pandit._id,
        date: formData.date,
        time: formData.time,
        address: formData.mode === 'online' ? 'Online Video Call' : formData.address,
        mode: formData.mode,
      });
      alert('Pooja booked successfully!');
      navigate('/user/history'); // Navigate to history to see the booking
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to book pooja');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.date && formData.time && (formData.mode === 'online' || formData.address.length > 5);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 bg-white sticky top-0 z-10 border-b border-gray-50 shadow-sm">
        <button onClick={() => navigate(-1)} className="text-gray-800 p-1 -ml-1 rounded-full hover:bg-gray-100 transition-colors">
          <FiArrowLeft size={22} />
        </button>
        <h1 className="text-[17px] font-bold text-gray-800">Booking Details</h1>
      </div>

      {/* Booking Summary */}
      <div className="px-4 py-5 bg-gradient-to-br from-orange-50 to-white border-b border-orange-100">
        <p className="text-orange-500 font-bold text-[13px] uppercase tracking-wide mb-1">{pooja}</p>
        <div className="flex items-center gap-3 mt-3">
          <div className="w-14 h-14 rounded-full border-2 border-orange-200 overflow-hidden shrink-0 shadow-sm">
            <img src={pandit.image || pandit.img} alt={pandit.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-[16px] font-bold text-gray-900 leading-tight">{pandit.name}</h2>
            <p className="text-[13px] text-gray-600 font-medium">Price: ₹{pandit.price}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-5 pt-6">
        <h3 className="text-[18px] font-bold text-gray-800 mb-5 leading-snug">When & Where should the Pooja happen?</h3>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Mode Selection */}
          <div>
            <label className="block text-gray-700 text-[13px] font-bold mb-2">Pooja Mode</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, mode: 'offline' })}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold transition-all ${
                  formData.mode === 'offline' 
                    ? 'border-orange-500 bg-orange-50 text-orange-600' 
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <FiMapPin /> In-Person
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, mode: 'online' })}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold transition-all ${
                  formData.mode === 'online' 
                    ? 'border-orange-500 bg-orange-50 text-orange-600' 
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <FiVideo /> Live Stream
              </button>
            </div>
          </div>
          
          {/* Date Picker */}
          <div>
            <label className="block text-gray-700 text-[13px] font-bold mb-2">Select Date</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400">
                <FiCalendar size={18} />
              </div>
              <input
                type="date"
                required
                className="w-full border-2 border-gray-200 rounded-xl py-3.5 pl-11 pr-4 text-[15px] font-medium text-gray-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all bg-gray-50 focus:bg-white"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          {/* Time Picker */}
          <div>
            <label className="block text-gray-700 text-[13px] font-bold mb-2">Select Time</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400">
                <FiClock size={18} />
              </div>
              <input
                type="time"
                required
                className="w-full border-2 border-gray-200 rounded-xl py-3.5 pl-11 pr-4 text-[15px] font-medium text-gray-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all bg-gray-50 focus:bg-white"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

          {/* Address */}
          {formData.mode === 'offline' && (
            <div>
              <label className="block text-gray-700 text-[13px] font-bold mb-2">Full Address</label>
              <div className="relative">
                <div className="absolute left-4 top-4 text-orange-400">
                  <FiMapPin size={18} />
                </div>
                <textarea
                  required
                  rows="3"
                  placeholder="Enter complete address for the pooja..."
                  className="w-full border-2 border-gray-200 rounded-xl py-3.5 pl-11 pr-4 text-[15px] font-medium text-gray-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all bg-gray-50 focus:bg-white resize-none"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>
          )}

        </form>
      </div>

      {/* Footer Action */}
      <div className="px-5 mt-auto pt-6">
        <button
          onClick={handleSubmit}
          disabled={!isFormValid || loading}
          className={`w-full py-4 rounded-xl font-bold tracking-wide text-[15px] transition-all duration-300 shadow-sm ${
            isFormValid && !loading
              ? 'bg-orange-500 text-white shadow-orange-200 hover:bg-orange-600 active:scale-[0.98]'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? 'BOOKING...' : 'CONFIRM POOJA BOOKING'}
        </button>
        <p className="text-center text-gray-400 text-[12px] font-medium mt-3">You won't be charged yet</p>
      </div>
    </div>
  );
};

export default PoojaBookingForm;
