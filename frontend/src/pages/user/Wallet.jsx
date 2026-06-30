import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfileThunk } from '../../store/slices/authSlice';
import { fetchWalletThunk } from '../../store/slices/walletSlice';
import api from '../../api/axios';
import { FiArrowUpRight, FiArrowDownLeft, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Wallet = () => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const { balance, transactions, loading: walletLoading } = useSelector((state) => state.wallet);
  const { appName } = useSelector((state) => state.settings) || { appName: 'JyotishLink' };
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchWalletThunk());
  }, [dispatch]);

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
    if (!amount || isNaN(amount) || amount < 10) {
      toast.error('Please enter a valid amount (minimum ₹10)');
      return;
    }

    setLoading(true);
    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        toast.error('Failed to load Razorpay SDK. Check your connection.');
        setLoading(false);
        return;
      }

      // 1. Create order on backend
      const { data } = await api.post('/payment/create-order', { amount: Number(amount) });
      const order = data.data;

      // 2. Initialize Razorpay options using dynamic key
      const options = {
        key: order.key, // Dynamic from API response
        amount: order.amount,
        currency: order.currency,
        name: appName,
        description: 'Wallet Recharge',
        order_id: order.orderId,
        handler: async function (response) {
          try {
            // 3. Verify payment on backend
            await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: Number(amount),
            });
            toast.success('Payment successful! Wallet recharged.');
            // Refresh profile and wallet to get updated balance
            dispatch(fetchProfileThunk());
            dispatch(fetchWalletThunk());
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
          color: '#ff8c00', // Orange-500
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
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-[#fa6830] p-6 text-center text-white">
          <h2 className="text-2xl font-bold">Wallet Balance</h2>
          <p className="text-4xl font-black mt-2">₹{balance !== null ? balance : (user?.wallet || 0)}</p>
        </div>
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Add Money to Wallet</h3>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[50, 100, 200, 500, 1000, 2000].map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                className={`py-2 rounded-xl border ${amount === amt.toString() ? 'border-[#fa6830] bg-orange-50 text-[#e55923] font-bold' : 'border-gray-200 text-gray-600 hover:border-orange-300'} transition-colors`}
              >
                ₹{amt}
              </button>
            ))}
          </div>
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-500 mb-2">Custom Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#fa6830] focus:ring-1 focus:ring-orange-500"
              placeholder="Enter amount"
              min="10"
            />
          </div>
          <button
            onClick={handlePayment}
            disabled={loading || !amount || amount < 10}
            className="w-full bg-[#fa6830] hover:bg-[#e55923] text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : `Proceed to Pay ₹${amount || 0}`}
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-lg">Transaction History</h3>
        </div>
        <div className="p-4">
          {walletLoading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#fa6830]"></div>
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div key={tx._id} className="flex flex-col gap-3 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'recharge' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {tx.type === 'recharge' ? <FiArrowDownLeft size={18} /> : <FiArrowUpRight size={18} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-800 capitalize">
                          {tx.type === 'recharge' ? 'Wallet Recharge' : 
                           (tx.desc?.toLowerCase().includes('video') ? 'Video Call' :
                            tx.desc?.toLowerCase().includes('audio') || tx.desc?.toLowerCase().includes('voice') ? 'Audio Call' :
                            tx.desc?.toLowerCase().includes('chat') ? 'Chat' : 'Wallet Deduction')}
                        </h4>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <FiClock size={10} />
                          <span>{new Date(tx.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold text-base ${tx.type === 'recharge' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'recharge' ? '+' : '-'}₹{Math.abs(tx.amount)}
                      </div>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${tx.paymentStatus === 'success' || !tx.paymentStatus ? 'bg-green-100 text-green-700' : tx.paymentStatus === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                        {tx.paymentStatus || 'Success'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Detailed Transaction Info */}
                  <div className="bg-white rounded-lg p-3 border border-gray-100 text-xs mt-1 space-y-1.5 shadow-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Transaction ID:</span>
                      <span className="text-gray-800 font-mono">{tx._id}</span>
                    </div>
                    {tx.razorpayReference && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Razorpay Ref:</span>
                        <span className="text-gray-800 font-mono">{tx.razorpayReference}</span>
                      </div>
                    )}
                    {tx.desc && !tx.razorpayReference && (
                       <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Details:</span>
                        <span className="text-gray-800 text-right max-w-[200px] truncate" title={tx.desc}>{tx.desc}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No transactions found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;
