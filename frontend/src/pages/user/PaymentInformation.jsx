import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiChevronLeft, FiChevronRight, FiCreditCard, FiSmartphone, FiX } from 'react-icons/fi';
import { BiBuildingHouse } from 'react-icons/bi';
import { fetchProfileThunk } from '../../store/slices/authSlice';
import { fetchWalletThunk } from '../../store/slices/walletSlice';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const PaymentInformation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const amount = location.state?.amount || 200;
  const gst = Math.round(amount * 0.18);
  const total = amount + gst;
  
  const [selectedMethod, setSelectedMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!selectedMethod) return;

    setIsProcessing(true);
    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        toast.error('Failed to load Razorpay SDK. Check your connection.');
        setIsProcessing(false);
        return;
      }

      // 1. Create order on backend (for the total amount including GST)
      const { data } = await api.post('/payment/create-order', { amount: total });
      const order = data.data;

      // 2. Initialize Razorpay options using dynamic key
      const options = {
        key: order.key, // Dynamic from API response
        amount: order.amount,
        currency: order.currency,
        name: 'JyotishLink',
        description: 'Wallet Recharge with GST',
        order_id: order.orderId,
        handler: async function (response) {
          try {
            // 3. Verify payment on backend (credit the base amount to wallet)
            await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: Number(amount), // Only credit the base amount
            });
            toast.success('Payment successful! Wallet recharged.');
            // Refresh profile and wallet to get updated balance
            dispatch(fetchProfileThunk());
            dispatch(fetchWalletThunk());
            const redirectTo = location.state?.redirectTo || '/user/home';
            navigate(redirectTo, { replace: true, state: { paymentSuccess: true } });
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast.error('Payment verification failed.');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone,
        },
        theme: {
          color: '#f97316', // Orange-500
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        console.error(response.error.description);
        toast.error('Payment Failed');
      });
      rzp.open();
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast.error('Failed to initiate payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-24 font-sans">
      {/* ═══ HEADER ═══ */}
      <div className="bg-white sticky top-0 z-50 shadow-sm px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
          <FiChevronLeft size={24} className="text-gray-800" />
        </button>
        <h1 className="text-[17px] font-bold text-gray-800 flex-1">Payment Information</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Bill Details */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500 text-[14px]">Recharge Amount</span>
            <span className="text-gray-800 font-medium text-[14px]">₹ {amount}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-3">
            <span className="text-gray-500 text-[14px]">GST(18%)</span>
            <span className="text-gray-800 font-medium text-[14px]">₹ {gst}</span>
          </div>
          <div className="flex justify-between items-center font-bold">
            <span className="text-gray-900 text-[15px]">Total Recharge Amount</span>
            <span className="text-gray-900 text-[15px]">₹ {total}</span>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
              Billing State: <span className="text-gray-600 font-medium underline">Madhya Pradesh</span><br />
              By continuing, I warrant that this location information is accurate.
            </p>
            <div className="bg-green-50 rounded-xl py-2 flex justify-center items-center gap-1.5 border border-green-100">
              <span className="text-green-600 text-sm">✓</span>
              <span className="text-green-700 text-[12px] font-semibold">100% Safe And Secure</span>
            </div>
          </div>
        </div>

        {/* Applied Offer Banner */}
        <div className="bg-green-50/50 border border-dashed border-green-300 rounded-2xl p-3 relative overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <span className="text-green-700 font-bold text-[13px]">'ASTROFFER100' applied</span>
            <button className="w-5 h-5 bg-gray-200/50 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200">
              <span className="text-[10px] font-bold">✕</span>
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-[10px]">✓</div>
            <span className="text-green-700 text-[12px] font-medium">₹{amount} extra in wallet with this recharge</span>
          </div>
        </div>

        {/* UPI Methods */}
        <div>
          <h2 className="text-gray-600 text-[13px] font-bold mb-3 px-1">Pay via UPI</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div 
              className={`w-full sm:w-[120px] rounded-xl border-2 p-3 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${selectedMethod === 'phonepe' ? 'border-orange-500 bg-orange-50/30' : 'border-gray-200 hover:border-orange-200'}`}
              onClick={() => setSelectedMethod('phonepe')}
            >
              <div className="w-10 h-10 bg-[#5f259f] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">पे</span>
              </div>
              <span className="text-[13px] text-gray-700 font-medium">PhonePe</span>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-gray-400 text-xs">▲</span>
                </div>
                <span className="text-gray-600 text-[14px]">Pay with other UPI apps</span>
              </div>
              <FiChevronRight className="text-gray-400" />
            </div>
          </div>
        </div>

        {/* Other Methods */}
        <div>
          <h2 className="text-gray-600 text-[13px] font-bold mb-3 px-1 mt-6">Others</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {[
              { id: 'upi', name: 'UPI', icon: <FiSmartphone className="text-blue-500" size={18} /> },
              { id: 'card', name: 'Credit/Debit Card', icon: <FiCreditCard className="text-blue-500" size={18} /> },
              { id: 'netbanking', name: 'Net Banking', icon: <BiBuildingHouse className="text-green-500" size={18} /> },
              { id: 'wallets', name: 'Other Wallets', subtext: 'Ola Money, Freecharge, Payzapp & more', icon: <span className="text-orange-500">👛</span> },
              { id: 'paytm', name: 'Paytm', icon: <span className="text-[#002970] font-bold text-xs">Paytm</span> },
            ].map((method, idx) => (
              <div 
                key={method.id} 
                onClick={() => setSelectedMethod(method.id)}
                className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${idx !== 0 ? 'border-t border-gray-100' : ''} ${selectedMethod === method.id ? 'bg-orange-50/30' : 'hover:bg-gray-50'}`}
              >
                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 shrink-0">
                  {method.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-gray-800 text-[14px] font-medium">{method.name}</h3>
                  {method.subtext && <p className="text-gray-400 text-[11px] mt-0.5">{method.subtext}</p>}
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedMethod === method.id ? 'border-orange-500' : 'border-gray-300'}`}>
                  {selectedMethod === method.id && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ BOTTOM STICKY BUTTON ═══ */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-50">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={handlePayment}
            disabled={!selectedMethod || isProcessing}
            className={`w-full py-3.5 rounded-xl font-bold text-[15px] shadow-sm transition-all relative overflow-hidden ${
              selectedMethod && !isProcessing
                ? 'bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.98] shadow-orange-200' 
                : 'bg-orange-200 text-white cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : 'Proceed to pay'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentInformation;
