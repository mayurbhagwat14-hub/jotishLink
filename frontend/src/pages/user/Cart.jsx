import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiTrash2, FiPlus, FiMinus } from 'react-icons/fi';
import { fetchCartThunk, updateCartThunk } from '../../store/slices/cartSlice';
import LogoLoader from '../../components/LogoLoader';

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cart, loading } = useSelector((state) => state.cart);

  useEffect(() => {
    dispatch(fetchCartThunk());
  }, [dispatch]);

  const handleUpdateQuantity = async (productId, currentQty, delta) => {
    const newQty = currentQty + delta;
    if (newQty < 0) return;
    await dispatch(updateCartThunk({ productId, quantity: newQty }));
  };

  const handleRemove = async (productId) => {
    await dispatch(updateCartThunk({ productId, quantity: 0 }));
  };

  const items = cart?.items || [];
  
  const subtotal = items.reduce((sum, item) => sum + (item.productId?.price || 0) * item.quantity, 0);
  const shipping = subtotal > 0 ? 50 : 0;
  const total = subtotal + shipping;

  const hasOutOfStockItems = items.some(item => !item.productId?.inStock || item.productId?.stock < item.quantity);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between px-4 py-3 bg-white sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-800 hover:bg-gray-100 p-1.5 rounded-full transition-colors">
            <FiArrowLeft size={20} />
          </button>
          <span className="text-gray-800 font-semibold text-[17px]">My Cart</span>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div className="flex-1 flex justify-center items-center">
          <LogoLoader />
        </div>
      ) : items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
          <button 
            onClick={() => navigate('/user/store')}
            className="bg-orange-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-4">
          {/* Cart Items */}
          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div key={item._id} className="bg-white rounded-2xl p-3 flex gap-4 shadow-sm border border-gray-100">
                <div className="w-20 h-20 bg-orange-50 rounded-xl overflow-hidden shrink-0">
                  <img 
                    src={item.productId?.image || item.productId?.img} 
                    alt={item.productId?.name} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-[14px] font-bold text-gray-800 leading-tight line-clamp-1">{item.productId?.name}</h3>
                      <button onClick={() => handleRemove(item.productId?._id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-orange-500 font-bold text-[15px]">₹{item.productId?.price}</p>
                      {(!item.productId?.inStock || item.productId?.stock < item.quantity) && (
                        <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md uppercase">
                          {item.productId?.stock === 0 ? 'Out of Stock' : `Only ${item.productId?.stock} left`}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                      <button 
                        onClick={() => handleUpdateQuantity(item.productId?._id, item.quantity, -1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-orange-500 transition-colors"
                      >
                        <FiMinus size={14} />
                      </button>
                      <span className="w-6 text-center text-[13px] font-bold text-gray-800">{item.quantity}</span>
                      <button 
                        onClick={() => handleUpdateQuantity(item.productId?._id, item.quantity, 1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-orange-500 transition-colors"
                      >
                        <FiPlus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bill Details */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
            <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-50 pb-2">Bill Details</h3>
            <div className="space-y-2 text-[14px]">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-800">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span className="font-semibold text-gray-800">₹{shipping}</span>
              </div>
              <div className="pt-2 mt-2 border-t border-gray-50 flex justify-between">
                <span className="font-bold text-gray-800">Total Amount</span>
                <span className="font-black text-orange-500 text-[16px]">₹{total}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-auto pt-4">
            {hasOutOfStockItems && (
              <p className="text-red-500 text-sm font-bold text-center mb-3">Please remove or adjust out of stock items to proceed.</p>
            )}
            <button
              onClick={() => navigate('/user/checkout', { state: { total } })}
              disabled={hasOutOfStockItems}
              className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all ${
                hasOutOfStockItems 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' 
                  : 'bg-orange-500 text-white shadow-orange-500/30 hover:bg-orange-600 active:scale-[0.98]'
              }`}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
