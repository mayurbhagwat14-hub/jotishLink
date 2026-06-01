import { useState } from 'react';
import { FiX, FiStar } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';

const RateAstrologerModal = ({ isOpen, onClose, astrologer, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (rating === 0) return;
    if (onSubmit) {
      onSubmit({ rating, review });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl animate-slide-up relative p-6">
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 w-8 h-8 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-400 transition-colors"
        >
          <FiX size={18} />
        </button>

        {/* Header */}
        <h2 className="text-center text-[18px] font-bold text-gray-900 mb-6">
          Rate Astrologer
        </h2>

        {/* Astrologer Info */}
        <div className="flex items-center gap-4 mb-6 px-2">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-orange-100 shrink-0 shadow-sm">
            <img 
              src={astrologer?.avatar || 'https://ui-avatars.com/api/?name=Astrologer&background=ffedD5&color=f97316'} 
              alt={astrologer?.name || 'Astrologer'} 
              className="w-full h-full object-cover" 
            />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-[16px] leading-tight">
              {astrologer?.name || 'Astrologer'}
            </h3>
            <p className="text-[12px] text-gray-500 mt-0.5">
              {astrologer?.skills?.join(', ') || 'Vedic, Numerology'}
            </p>
          </div>
        </div>

        {/* Helper Text */}
        <p className="text-center text-[12px] text-gray-500 font-medium mb-6 px-4 leading-relaxed">
          How was your experience? Your feedback helps us improve our services and build trust.
        </p>

        {/* Star Rating */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="p-1 focus:outline-none transition-transform hover:scale-110"
            >
              {(hoverRating || rating) >= star ? (
                <FaStar size={32} className="text-yellow-400 drop-shadow-sm" />
              ) : (
                <FiStar size={32} className="text-gray-200 fill-gray-100" />
              )}
            </button>
          ))}
        </div>

        {/* Review Textarea */}
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Describe your experience (optional)"
          className="w-full h-24 border border-gray-200 rounded-2xl p-4 text-[13px] text-gray-800 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none transition-all mb-6 bg-gray-50/50"
        ></textarea>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={rating === 0}
          className={`w-full py-3.5 rounded-xl font-bold text-[14px] transition-all shadow-sm ${
            rating > 0
              ? 'bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.98] shadow-orange-200'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          SUBMIT
        </button>
      </div>
    </div>
  );
};

export default RateAstrologerModal;
