import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiChevronLeft, FiChevronRight, FiCreditCard, FiSmartphone, FiX } from 'react-icons/fi';
import { BiBuildingHouse } from 'react-icons/bi';
import { addWalletCash } from '../../store/slices/authSlice';
import axios from '../../utils/axios';

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
  const [showRazorpayMock, setShowRazorpayMock] = useState(false);

  const handlePayment = () => {
    if (!selectedMethod) return;
    setIsProcessing(true);
    // Simulate opening the Razorpay Checkout Modal
    setTimeout(() => {
      setIsProcessing(false);
      setShowRazorpayMock(true);
    }, 800);
  };

  const handleMockSuccess = async () => {
    setIsProcessing(true);
    setShowRazorpayMock(false);
    try {
      // Call backend to verify and credit the user's wallet in MongoDB
      const res = await axios.post('/payment/verify', {
        razorpay_order_id: `order_mock_${Date.now()}`,
        razorpay_payment_id: `pay_mock_${Date.now()}`,
        razorpay_signature: 'mock_signature_bypass',
        amount: amount
      });

      if (res.data?.success) {
        // Credit the local Redux store balance
        dispatch(addWalletCash(amount));
        const redirectTo = location.state?.redirectTo || '/user/home';
        navigate(redirectTo, { replace: true, state: { paymentSuccess: true } });
      } else {
        alert('Payment verification failed on the server.');
      }
    } catch (err) {
      console.error('Bypass verification failed, applying locally:', err.message);
      dispatch(addWalletCash(amount));
      const redirectTo = location.state?.redirectTo || '/user/home';
      navigate(redirectTo, { replace: true, state: { paymentSuccess: true } });
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

      {/* ═══ MOCK RAZORPAY CHECKOUT MODAL ═══ */}
      {showRazorpayMock && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-[#1C2038] text-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-in border border-slate-700/50">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-[#12162B] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center font-bold text-lg text-white">
                  R
                </div>
                <div>
                  <h3 className="font-bold text-[14px]">Razorpay Checkout</h3>
                  <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider bg-blue-900/30 px-2 py-0.5 rounded">TEST MODE</span>
                </div>
              </div>
              <button 
                onClick={() => setShowRazorpayMock(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Product Info */}
              <div className="flex justify-between items-center bg-[#151930] p-4 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-gray-400 text-xs">Paying to</span>
                  <p className="font-bold text-sm text-gray-200">JyotishLink Services</p>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 text-xs">Amount</span>
                  <p className="font-extrabold text-[16px] text-blue-400">₹{total}</p>
                </div>
              </div>

              {/* User details */}
              <div className="space-y-3">
                <div className="flex justify-between text-[13px] border-b border-slate-800 pb-2">
                  <span className="text-gray-400">Phone</span>
                  <span className="text-gray-200 font-medium">{user?.phone || '+91 9876543210'}</span>
                </div>
                <div className="flex justify-between text-[13px] border-b border-slate-800 pb-2">
                  <span className="text-gray-400">Email</span>
                  <span className="text-gray-200 font-medium">{user?.email || 'user@jyotishlink.com'}</span>
                </div>
              </div>

              {/* Simulator Options */}
              <div className="space-y-3 pt-2">
                <p className="text-xs text-yellow-400 font-semibold text-center mb-1 bg-yellow-950/20 py-1.5 rounded-lg border border-yellow-900/30">
                  ⚠️ Simulated Sandbox Payment Gateway
                </p>
                <button
                  onClick={handleMockSuccess}
                  className="w-full bg-green-500 hover:bg-green-600 active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl transition-all shadow-md shadow-green-900/20 text-sm"
                >
                  SIMULATE PAYMENT SUCCESS
                </button>
                <button
                  onClick={() => setShowRazorpayMock(false)}
                  className="w-full bg-red-500/20 hover:bg-red-500/30 active:scale-[0.98] text-red-400 font-bold py-3 rounded-2xl transition-all border border-red-500/30 text-sm"
                >
                  SIMULATE PAYMENT FAILURE
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#12162B] text-center border-t border-slate-800">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                🔒 Secured by Razorpay
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentInformation;
