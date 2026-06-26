import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiMapPin, FiCreditCard, FiTruck, FiCrosshair } from 'react-icons/fi';
import { createOrderThunk } from '../../store/slices/cartSlice';
import { fetchWalletThunk } from '../../store/slices/walletSlice';
import toast from 'react-hot-toast';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const total = location.state?.total || 0;
  
  const { user } = useSelector((state) => state.auth);
  const { cart } = useSelector((state) => state.cart);
  
  useEffect(() => {
    if (!cart?.items || cart.items.length === 0) {
      navigate('/user/cart', { replace: true });
    }
  }, [cart, navigate]);
  
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phoneNumber || user?.phone || '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
  });
  
  const [isLocating, setIsLocating] = useState(false);

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          setFormData(prev => ({
            ...prev,
            addressLine: data.display_name?.split(',').slice(0, 2).join(', ') || '',
            city: addr.city || addr.town || addr.village || addr.county || '',
            state: addr.state || '',
            pincode: addr.postcode || ''
          }));
          toast.success('Location fetched successfully!');
        }
      } catch (err) {
        toast.error('Failed to fetch address from coordinates');
      } finally {
        setIsLocating(false);
      }
    }, (error) => {
      setIsLocating(false);
      toast.error('Location access denied or unavailable');
    });
  };
  
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' or 'cod'
  const [loading, setLoading] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

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
        // If wallet has enough balance, show confirmation modal
        if (user?.wallet >= total) {
          setShowWalletModal(true);
          setLoading(false);
          return;
        } else {
          // Wallet insufficient, use Razorpay
          const res = await loadRazorpayScript();
          if (!res) {
            toast.error('Razorpay SDK failed to load. Are you online?');
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
                toast.error(err.message || 'Payment verification failed');
              }
            },
            prefill: {
              name: formData.fullName,
              contact: formData.phone
            },
            theme: {
              color: '#ff8c00'
            }
          };

          const paymentObject = new window.Razorpay(options);
          paymentObject.on('payment.failed', function (response) {
            toast.error('Payment Failed: ' + response.error.description);
          });
          paymentObject.open();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to place order');
      if (err.message === 'Cart is empty' || (err.message && err.message.toLowerCase().includes('empty'))) {
        navigate('/user/cart', { replace: true });
        window.location.reload(); // Force sync
      }
    } finally {
      if (paymentMethod !== 'online' || user?.wallet < total) {
        setLoading(false);
      }
    }
  };

  const handleConfirmWalletPayment = async () => {
    setShowWalletModal(false);
    setLoading(true);
    try {
      const res = await dispatch(createOrderThunk({
        shippingAddress: formData,
        paymentMethod: 'wallet'
      })).unwrap();
      
      // Refresh user wallet state
      dispatch(fetchWalletThunk());
      
      navigate(`/user/order-success/${res?.order?._id || 'recent'}`);
    } catch (err) {
      toast.error(err.message || 'Failed to place order');
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
          <div className="flex items-center justify-between gap-2 mb-4 pb-2 border-b border-gray-50">
            <div className="flex items-center gap-2 text-gray-800 font-bold">
              <FiMapPin className="text-orange-500" /> Shipping Address
            </div>
            <button 
              type="button" 
              onClick={fetchLocation} 
              disabled={isLocating}
              className="flex items-center gap-1.5 text-[12px] font-bold text-orange-500 bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50"
            >
              {isLocating ? <span className="w-3.5 h-3.5 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></span> : <FiCrosshair />}
              Use Current Location
            </button>
          </div>
          
          <form className="space-y-3">
            <input 
              type="text" name="fullName" placeholder="Full Name" 
              value={formData.fullName} onChange={handleChange} required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-orange-400"
            />
            <input 
              type="email" name="email" placeholder="Email Address" 
              value={formData.email} onChange={handleChange} required
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

      {/* Wallet Confirmation Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCreditCard size={28} className="text-orange-500" />
              </div>
              <h3 className="text-[20px] font-black text-gray-900 mb-2">Confirm Payment</h3>
              <p className="text-[14px] text-gray-600 mb-6 leading-relaxed">
                <span className="font-bold text-gray-900">₹{total}</span> will be deducted from your wallet to place this order.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowWalletModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl text-[14px] hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmWalletPayment}
                  className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-xl text-[14px] hover:bg-orange-600 transition-colors shadow-sm"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Checkout;
