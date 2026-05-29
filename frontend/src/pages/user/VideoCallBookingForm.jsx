import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiClock, FiVideo } from 'react-icons/fi';

const VideoCallBookingForm = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { astrologer } = location.state || {};

  const [formData, setFormData] = useState({
    date: '',
    time: ''
  });

  if (!astrologer) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">Invalid Booking Session</p>
        <button onClick={() => navigate('/user/video-call')} className="bg-orange-500 text-white px-6 py-2 rounded-xl font-bold">
          Go Back
        </button>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    // After collecting the details, for this mock we just jump into the video room
    navigate(`/user/video-room/${astrologer._id}`, { state: { astrologer, scheduled: formData } });
  };

  const isFormValid = formData.date && formData.time;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 bg-white sticky top-0 z-10 border-b border-gray-50 shadow-sm">
        <button onClick={() => navigate(-1)} className="text-gray-800 p-1 -ml-1 rounded-full hover:bg-gray-100 transition-colors">
          <FiArrowLeft size={22} />
        </button>
        <h1 className="text-[17px] font-bold text-gray-800">Schedule Video Call</h1>
      </div>

      {/* Booking Summary */}
      <div className="px-4 py-5 bg-gradient-to-br from-orange-50 to-white border-b border-orange-100">
        <p className="text-orange-500 font-bold text-[13px] uppercase tracking-wide mb-1">Video Consultation</p>
        <div className="flex items-center gap-3 mt-3">
          <div className="w-14 h-14 rounded-full border-2 border-orange-200 overflow-hidden shrink-0 shadow-sm">
            <img src={astrologer.avatar} alt={astrologer.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-[16px] font-bold text-gray-900 leading-tight">{astrologer.name}</h2>
            <p className="text-[13px] text-gray-600 font-medium">Price: ₹{astrologer.videoPrice}/min</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-5 pt-6">
        <h3 className="text-[18px] font-bold text-gray-800 mb-5 leading-snug">When do you want to connect?</h3>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          
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

        </form>
      </div>

      {/* Footer Action */}
      <div className="px-5 mt-auto pt-6">
        <button
          onClick={handleSubmit}
          disabled={!isFormValid}
          className={`w-full py-4 rounded-xl font-bold tracking-wide text-[15px] transition-all duration-300 shadow-sm flex items-center justify-center gap-2 ${
            isFormValid
              ? 'bg-orange-500 text-white shadow-orange-200 hover:bg-orange-600 active:scale-[0.98]'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <FiVideo size={18} />
          CONFIRM VIDEO CALL
        </button>
        <p className="text-center text-gray-400 text-[12px] font-medium mt-3">You won't be charged yet</p>
      </div>
    </div>
  );
};

export default VideoCallBookingForm;
