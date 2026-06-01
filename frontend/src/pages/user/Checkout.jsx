import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiMapPin, FiCreditCard, FiTruck } from 'react-icons/fi';
import { createOrderThunk } from '../../store/slices/cartSlice';
import { fetchWalletThunk } from '../../store/slices/walletSlice';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const total = location.state?.total || 0;
  
  const { user } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    phone: user?.phoneNumber || '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
  });
  
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' or 'cod'
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isFormValid = 
    formData.fullName && 
    formData.phone && 
    formData.addressLine && 
    formData.city && 
    formData.state && 
    formData.pincode;

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    try {
      if (paymentMethod === 'cod') {
        const res = await dispatch(createOrderThunk({
          shippingAddress: formData,
          paymentMethod: 'cod'
        })).unwrap();
        navigate(`/user/order-success/${res?.order?._id || 'recent'}`);
      } else {
        // If wallet has enough balance, use it directly
        if (user?.wallet >= total) {
          const res = await dispatch(createOrderThunk({
            shippingAddress: formData,
            paymentMethod: 'wallet'
          })).unwrap();
          
          // Refresh user wallet state
          dispatch(fetchWalletThunk());
          
          navigate(`/user/order-success/${res?.order?._id || 'recent'}`);
        } else {
          // Wallet insufficient, use Razorpay
          const res = await loadRazorpayScript();
          if (!res) {
            alert('Razorpay SDK failed to load. Are you online?');
            setLoading(false);
            return;
          }

          // 1. Create order on backend
          const { createRazorpayOrder } = await import('../../api/storeApis');
          const orderResponse = await createRazorpayOrder(total);
          const orderData = orderResponse.data?.data || orderResponse.data;

          // 2. Open Razorpay modal
          const options = {
            key: 'rzp_test_dummy', // Replace with your actual key
            amount: orderData.amount,
            currency: orderData.currency,
            name: 'Astrotalk Replica',
            description: 'Store Purchase',
            order_id: orderData.id,
            handler: async function (response) {
              try {
                // 3. Verify payment on backend by submitting order
                const res = await dispatch(createOrderThunk({
                  shippingAddress: formData,
                  paymentMethod: 'online',
                  paymentData: response
                })).unwrap();
                navigate(`/user/order-success/${res?.order?._id || 'recent'}`);
              } catch (err) {
                alert(err.message || 'Payment verification failed');
              }
            },
            prefill: {
              name: formData.fullName,
              contact: formData.phone
            },
            theme: {
              color: '#f97316'
            }
          };

          const paymentObject = new window.Razorpay(options);
          paymentObject.on('payment.failed', function (response) {
            alert('Payment Failed: ' + response.error.description);
          });
          paymentObject.open();
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between px-4 py-3 bg-white sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-800 hover:bg-gray-100 p-1.5 rounded-full transition-colors">
            <FiArrowLeft size={20} />
          </button>
          <span className="text-gray-800 font-semibold text-[17px]">Checkout</span>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50 text-gray-800 font-bold">
            <FiMapPin className="text-orange-500" /> Shipping Address
          </div>
          
          <form className="space-y-3">
            <input 
              type="text" name="fullName" placeholder="Full Name" 
              value={formData.fullName} onChange={handleChange} required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-orange-400"
            />
            <input 
              type="tel" name="phone" placeholder="Phone Number" 
              value={formData.phone} onChange={handleChange} required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-orange-400"
            />
            <textarea 
              name="addressLine" placeholder="House No, Building, Street" rows="2"
              value={formData.addressLine} onChange={handleChange} required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-orange-400 resize-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="text" name="city" placeholder="City" 
                value={formData.city} onChange={handleChange} required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-orange-400"
              />
              <input 
                type="text" name="pincode" placeholder="Pincode" 
                value={formData.pincode} onChange={handleChange} required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-orange-400"
              />
            </div>
            <input 
              type="text" name="state" placeholder="State" 
              value={formData.state} onChange={handleChange} required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-orange-400"
            />
          </form>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50 text-gray-800 font-bold">
            <FiCreditCard className="text-orange-500" /> Payment Method
          </div>
          
          <div className="space-y-3">
            <label 
              onClick={() => setPaymentMethod('online')}
              className={`flex items-center justify-between p-3 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'online' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 bg-white'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'online' ? 'border-orange-500' : 'border-gray-300'}`}>
                  {paymentMethod === 'online' && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />}
                </div>
                <div>
                  <span className="font-bold text-[14px] text-gray-800 block">Pay Online (Wallet)</span>
                  <span className="text-[11px] text-gray-500">Available Balance: ₹{user?.wallet || 0}</span>
                </div>
              </div>
            </label>

            <label 
              onClick={() => setPaymentMethod('cod')}
              className={`flex items-center justify-between p-3 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 bg-white'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cod' ? 'border-orange-500' : 'border-gray-300'}`}>
                  {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />}
                </div>
                <div>
                  <span className="font-bold text-[14px] text-gray-800 block flex items-center gap-1">Cash on Delivery <FiTruck className="text-gray-400"/></span>
                  <span className="text-[11px] text-gray-500">Pay when the order arrives</span>
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 border-t border-gray-100 pb-8 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-500 font-bold text-[13px]">Total Amount</span>
          <span className="text-[20px] font-black text-gray-900">₹{total}</span>
        </div>
        <button
          onClick={handlePlaceOrder}
          disabled={!isFormValid || loading}
          className={`w-full py-4 rounded-xl font-bold tracking-wide text-[15px] transition-all duration-300 shadow-sm ${
            isFormValid && !loading
              ? 'bg-orange-500 text-white shadow-orange-200 hover:bg-orange-600 active:scale-[0.98]'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? 'PROCESSING...' : 'PLACE ORDER'}
        </button>
      </div>

    </div>
  );
};

export default Checkout;
