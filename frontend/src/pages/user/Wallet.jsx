import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfileThunk } from '../../store/slices/authSlice';
import api from '../../api/axios';

const Wallet = () => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handlePayment = async () => {
    if (!amount || isNaN(amount) || amount < 10) {
      alert('Please enter a valid amount (minimum ₹10)');
      return;
    }

    setLoading(true);
    try {
      // 1. Create order on backend
      const { data } = await api.post('/payment/create-order', { amount: Number(amount) });
      const order = data.data;

      // 2. Initialize Razorpay options
      const options = {
        key: 'rzp_test_dummy', // Replace with real key in production
        amount: order.amount,
        currency: order.currency,
        name: 'JyotishLink',
        description: 'Wallet Recharge',
        order_id: order.id,
        handler: async function (response) {
          try {
            // 3. Verify payment on backend
            await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: Number(amount),
            });
            alert('Payment successful! Wallet recharged.');
            // Refresh profile to get updated wallet balance
            dispatch(fetchProfileThunk());
            navigate('/user/home');
          } catch (error) {
            console.error('Payment verification failed:', error);
            alert('Payment verification failed.');
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
        alert('Payment Failed');
      });
      rzp.open();
    } catch (error) {
      console.error('Error initiating payment:', error);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-orange-500 p-6 text-center text-white">
          <h2 className="text-2xl font-bold">Wallet Balance</h2>
          <p className="text-4xl font-black mt-2">₹{user?.wallet || 0}</p>
        </div>
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Add Money to Wallet</h3>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[50, 100, 200, 500, 1000, 2000].map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                className={`py-2 rounded-xl border ${amount === amt.toString() ? 'border-orange-500 bg-orange-50 text-orange-600 font-bold' : 'border-gray-200 text-gray-600 hover:border-orange-300'} transition-colors`}
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
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              placeholder="Enter amount"
              min="10"
            />
          </div>
          <button
            onClick={handlePayment}
            disabled={loading || !amount || amount < 10}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : `Proceed to Pay ₹${amount || 0}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
