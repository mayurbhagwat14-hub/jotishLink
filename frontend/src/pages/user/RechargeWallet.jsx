import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiChevronLeft } from 'react-icons/fi';
import { fetchWalletThunk } from '../../store/slices/walletSlice';
import { fetchProfileThunk } from '../../store/slices/authSlice';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const rechargeOptions = [
  { amount: 10 },
  { amount: 50 },
  { amount: 100, popular: true },
  { amount: 200 },
  { amount: 500 },
  { amount: 1000 },
  { amount: 2000 },
  { amount: 3000 },
  { amount: 4000 },
  { amount: 8000 },
  { amount: 15000 },
  { amount: 20000 },
  { amount: 50000 },
  { amount: 100000 }
];

const RechargeWallet = () => {
  const { state } = useLocation();
  const [amount, setAmount] = useState(state?.amount ? state.amount.toString() : '50');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { balance } = useSelector((state) => state.wallet);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchWalletThunk());
  }, [dispatch]);

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
    const numAmount = parseInt(amount);
    if (!numAmount || numAmount < 10) return;

    setIsProcessing(true);
    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        toast.error('Failed to load Razorpay SDK. Check your connection.');
        setIsProcessing(false);
        return;
      }

      const total = numAmount; // No extra GST added from frontend

      const { data } = await api.post('/payment/create-order', { amount: total });
      const order = data.data;

      // Handle Mock Order Flow if keys are missing
      if (order.mock) {
        // Simulate a tiny delay for realism
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await api.post('/payment/verify', {
          razorpay_order_id: order.orderId,
          razorpay_payment_id: 'pay_mock_' + Date.now(),
          razorpay_signature: 'mock_signature_test',
          amount: Number(numAmount),
          mock: true
        });
        
        toast.success(`Mock Payment successful! ₹${Number(numAmount)} added to wallet.`);
        dispatch(fetchProfileThunk());
        dispatch(fetchWalletThunk());
        if (state?.redirectTo) {
          navigate(state.redirectTo, { replace: true, state: { paymentSuccess: true } });
        } else {
          navigate('/user/home', { replace: true, state: { paymentSuccess: true } });
        }
        return;
      }

      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: 'JyotishLink',
        description: 'Wallet Recharge with GST',
        order_id: order.orderId,
        handler: async function (response) {
          try {
            await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: Number(numAmount),
            });
            toast.success(`Payment successful! ₹${Number(numAmount)} added to wallet.`);
            dispatch(fetchProfileThunk());
            dispatch(fetchWalletThunk());
            if (state?.redirectTo) {
              navigate(state.redirectTo, { replace: true, state: { paymentSuccess: true } });
            } else {
              navigate('/user/home', { replace: true, state: { paymentSuccess: true } });
            }
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
        theme: { color: '#ff8c00' },
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

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };

  const handleAddQuick = (val) => {
    const current = parseInt(amount) || 0;
    setAmount((current + val).toString());
  };

  const displayBalance = balance !== null ? balance : (user?.wallet || 0);

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-white pb-24 font-sans shadow-xl relative border-x border-gray-100">
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
            <FiChevronLeft size={24} />
          </button>
          <h1 className="text-[17px] font-semibold text-gray-800">My Wallet</h1>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-full border border-gray-200">
          <span className="text-[14px]">👛</span>
          <span className="text-gray-700 font-bold text-[14px]">₹{displayBalance}</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* INPUT SECTION */}
        <div>
          <label className="block text-gray-800 font-semibold text-[15px] mb-3">Enter Amount here</label>
          <div className="flex items-center gap-3 pb-2 border-b border-gray-300">
            <input
              type="number"
              value={amount}
              onChange={handleAmountChange}
              className="flex-1 min-w-0 w-full outline-none text-2xl font-bold text-gray-900 bg-transparent"
              placeholder="0"
            />
            <div className="flex items-center gap-1.5 shrink-0">
              <button 
                onClick={() => handleAddQuick(50)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-[13px] font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                + ₹50
              </button>
              <button 
                onClick={() => handleAddQuick(100)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-[13px] font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                + ₹100
              </button>
            </div>
          </div>
        </div>


        {/* GRID OF OPTIONS */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {rechargeOptions.map((opt) => {
            const isSelected = parseInt(amount) === opt.amount;
            return (
              <div 
                key={opt.amount}
                onClick={() => setAmount(opt.amount.toString())}
                className={`relative rounded-xl border-2 flex flex-col items-center overflow-hidden cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-orange-500 bg-orange-50 shadow-sm' 
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                {opt.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-b-md z-10 whitespace-nowrap">
                    Most Popular
                  </div>
                )}
                <div className={`w-full py-4 flex items-center justify-center ${opt.popular ? 'pt-6' : ''}`}>
                  <span className="text-[16px] font-bold text-gray-900">₹{opt.amount}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PROCEED BUTTON */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-4 bg-white z-20 border-t border-gray-50">
        <button
          onClick={handlePayment}
          disabled={!amount || parseInt(amount) < 10 || isProcessing}
          className={`w-full py-3.5 rounded-xl font-bold text-[15px] shadow-sm transition-all disabled:opacity-50 active:scale-[0.98] ${
            !amount || parseInt(amount) < 10 || isProcessing ? 'bg-orange-300 text-white cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200 text-white'
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
          ) : 'Proceed'}
        </button>
      </div>
    </div>
  );
};

export default RechargeWallet;
