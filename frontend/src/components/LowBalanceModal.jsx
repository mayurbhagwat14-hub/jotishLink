import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiX } from 'react-icons/fi';

const rechargeOptions = [
  { amount: 200 },
  { amount: 500 },
  { amount: 1000 },
  { amount: 2000 },
  { amount: 3000 },
];

const LowBalanceModal = ({ isOpen, onClose, requiredAmount, currentBalance, targetName = "Astrologer", redirectTo }) => {
  const navigate = useNavigate();
  const [selectedAmount, setSelectedAmount] = useState(200);

  if (!isOpen) return null;

  const handleProceed = () => {
    onClose();
    navigate('/user/recharge', { 
      state: { 
        amount: selectedAmount,
        redirectTo: redirectTo || location.pathname
      } 
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full sm:w-[400px] bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-slide-up pb-6">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h2 className="text-[18px] font-bold text-gray-900">Low wallet balance!</h2>
            <div className="flex items-center gap-1 text-[13px] font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
              👛 ₹ {currentBalance || 0}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors">
            <FiX size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
            <p className="text-[14px] text-gray-800 font-medium mb-1">
              Minimum balance required: ₹{requiredAmount}
            </p>
            <p className="text-[12px] text-gray-500">
              You need ₹{Math.max(0, requiredAmount - (currentBalance || 0))} more to start chat with {targetName}
            </p>
          </div>

          {/* Recharge Options Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {rechargeOptions.map((opt) => (
              <div 
                key={opt.amount}
                onClick={() => setSelectedAmount(opt.amount)}
                className={`flex flex-col items-center justify-center rounded-xl border-2 cursor-pointer transition-all overflow-hidden ${
                  selectedAmount === opt.amount 
                    ? 'border-orange-500 bg-orange-50/50 scale-[1.02] shadow-sm' 
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <div className="py-2.5 font-bold text-gray-800 text-[15px]">
                  ₹ {opt.amount}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleProceed}
            className="w-full mt-4 bg-orange-500 text-white font-bold text-[15px] py-3.5 rounded-xl hover:bg-orange-600 active:scale-[0.98] transition-all shadow-md shadow-orange-200"
          >
            Proceed
          </button>
        </div>
      </div>
    </div>
  );
};

export default LowBalanceModal;
