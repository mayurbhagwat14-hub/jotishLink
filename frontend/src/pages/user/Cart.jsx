import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiTrash2, FiPlus, FiMinus, FiTag, FiShoppingBag, FiChevronRight, FiPercent, FiX } from 'react-icons/fi';
import { fetchCartThunk, updateCartThunk } from '../../store/slices/cartSlice';
import { verifyStoreCoupon } from '../../api/storeApis';
import toast from 'react-hot-toast';

/* ═══ SKELETON ═══ */
const CartSkeleton = () => (
  <div className="p-5 space-y-3 animate-fade-in">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-white rounded-store p-3 flex gap-3 shadow-store-sm">
        <div className="w-20 h-20 store-skeleton rounded-xl" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-3.5 store-skeleton w-3/4" />
          <div className="h-3 store-skeleton w-1/3" />
          <div className="h-4 store-skeleton w-1/4 mt-2" />
        </div>
      </div>
    ))}
    <div className="bg-white rounded-store p-4 shadow-store-sm space-y-3 mt-4">
      <div className="h-4 store-skeleton w-1/3" />
      <div className="h-3 store-skeleton w-full" />
      <div className="h-3 store-skeleton w-full" />
      <div className="h-4 store-skeleton w-1/2 mt-2" />
    </div>
  </div>
);

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cart, loading } = useSelector((state) => state.cart);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Per-item loading state for +/- buttons
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    dispatch(fetchCartThunk());
  }, [dispatch]);

  const handleUpdateQuantity = async (productId, currentQty, delta, maxStock) => {
    const newQty = currentQty + delta;
    if (newQty < 0) return;
    if (updatingId) return; // Prevent double-taps

    // Stock limit check
    if (delta > 0 && maxStock && newQty > maxStock) {
      toast.error(`Only ${maxStock} available in stock`, { icon: '⚠️', style: { borderRadius: '12px', fontWeight: 600 } });
      return;
    }

    // Auto-remove confirmation when qty hits 0
    if (newQty === 0) {
      handleRemove(productId);
      return;
    }

    try {
      setUpdatingId(productId);
      await dispatch(updateCartThunk({ productId, quantity: newQty })).unwrap();
    } catch (err) {
      toast.error(err?.message || 'Failed to update quantity');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (productId) => {
    setRemovingId(productId);
    setUpdatingId(productId);
    setTimeout(async () => {
      try {
        await dispatch(updateCartThunk({ productId, quantity: 0 })).unwrap();
      } catch (err) {
        toast.error(err?.message || 'Failed to remove item');
      } finally {
        setRemovingId(null);
        setUpdatingId(null);
      }
    }, 250);
  };

  // Removal animation
  const [removingId, setRemovingId] = useState(null);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await verifyStoreCoupon(couponCode, subtotal);
      const data = res.data?.data || res.data;
      setAppliedCoupon({
        code: data.couponCode || couponCode.toUpperCase(),
        discountAmount: data.discountAmount || 0,
      });
      toast.success(`Coupon applied! ₹${data.discountAmount} off`, { icon: '🎉', style: { borderRadius: '12px', fontWeight: 600 } });
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const items = cart?.items || [];
  
  const subtotal = items.reduce((sum, item) => sum + (item.productId?.price || 0) * item.quantity, 0);
  const shipping = subtotal >= 499 ? 0 : subtotal > 0 ? 49 : 0;
  const discount = appliedCoupon?.discountAmount || 0;
  const total = Math.max(0, subtotal + shipping - discount);

  const hasOutOfStockItems = items.some(item => !item.productId?.inStock || item.productId?.stock < item.quantity);

  return (
    <div className="min-h-screen bg-store-bg flex flex-col font-sans">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-white sticky top-0 z-30 shadow-store-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-store-surface flex items-center justify-center text-store-text hover:bg-store-border transition-colors active:scale-95">
            <FiArrowLeft size={18} />
          </button>
          <div>
            <span className="text-store-text font-bold text-[16px] block leading-tight">My Bag</span>
            {items.length > 0 && (
              <span className="text-store-muted text-[11px] font-medium">{items.length} item{items.length > 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <CartSkeleton />
      ) : items.length === 0 ? (
        /* ═══ EMPTY STATE ═══ */
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="relative mb-6">
            <div className="w-28 h-28 bg-store-surface rounded-full flex items-center justify-center">
              <FiShoppingBag size={44} className="text-store-muted" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center animate-bounce-in" style={{ animationDelay: '0.3s' }}>
              <span className="text-xl">🛍️</span>
            </div>
          </div>
          <h2 className="text-[18px] font-bold text-store-text mb-2">Your bag is empty</h2>
          <p className="text-store-muted text-[13px] font-medium mb-6 max-w-[250px]">
            Looks like you haven't added any spiritual products yet.
          </p>
          <button 
            onClick={() => navigate('/user/store')}
            className="bg-store-text text-white font-bold py-3.5 px-8 rounded-xl hover:bg-gray-800 transition-all active:scale-[0.97] shadow-store"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col pb-40">
          {/* ═══ FREE DELIVERY BANNER ═══ */}
          {subtotal > 0 && subtotal < 499 && (
            <div className="mx-5 mt-3 bg-green-50 border border-green-200 rounded-store p-3 flex items-center gap-2">
              <span className="text-green-500 text-sm">🚚</span>
              <span className="text-[12px] font-semibold text-green-700">
                Add ₹{499 - subtotal} more for <span className="font-bold">FREE delivery</span>
              </span>
              <div className="flex-1 h-1.5 bg-green-200 rounded-full ml-2">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (subtotal / 499) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* ═══ CART ITEMS ═══ */}
          <div className="space-y-2.5 p-5">
            {items.map((item) => (
              <div 
                key={item._id} 
                className={`bg-white rounded-store p-3 flex gap-3 shadow-store-sm transition-all duration-250 ${
                  removingId === item.productId?._id ? 'opacity-0 scale-95 -translate-x-4' : 'opacity-100'
                }`}
              >
                {/* Product Image */}
                <div 
                  onClick={() => navigate(`/user/product/${item.productId?._id}`)}
                  className="w-20 h-20 bg-store-surface rounded-xl overflow-hidden shrink-0 cursor-pointer"
                >
                  <img 
                    src={item.productId?.image || item.productId?.img} 
                    alt={item.productId?.name} 
                    className="w-full h-full object-cover" 
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-[13px] font-semibold text-store-text leading-tight line-clamp-2 flex-1">{item.productId?.name}</h3>
                      <button 
                        onClick={() => handleRemove(item.productId?._id)} 
                        className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-100 transition-colors shrink-0"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                    {(!item.productId?.inStock || item.productId?.stock < item.quantity) && (
                      <span className="inline-block text-[9px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md mt-1 uppercase">
                        {item.productId?.stock === 0 ? 'Out of Stock' : `Only ${item.productId?.stock} left`}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[15px] font-bold text-store-text">₹{(item.productId?.price || 0) * item.quantity}</span>
                    
                    {/* Quantity Stepper */}
                    <div className={`flex items-center bg-store-surface border border-store-border rounded-xl ${updatingId === item.productId?._id ? 'opacity-50 pointer-events-none' : ''}`}>
                      <button 
                        onClick={() => handleUpdateQuantity(item.productId?._id, item.quantity, -1, item.productId?.stock)}
                        disabled={updatingId === item.productId?._id}
                        className="w-8 h-8 flex items-center justify-center text-store-text hover:text-[#fa6830] transition-colors active:scale-90 disabled:opacity-40"
                      >
                        <FiMinus size={12} strokeWidth={2.5} />
                      </button>
                      <span className="w-7 text-center text-[13px] font-bold text-store-text">{item.quantity}</span>
                      <button 
                        onClick={() => handleUpdateQuantity(item.productId?._id, item.quantity, 1, item.productId?.stock)}
                        disabled={updatingId === item.productId?._id || item.quantity >= (item.productId?.stock || 999)}
                        className="w-8 h-8 flex items-center justify-center text-store-text hover:text-[#fa6830] transition-colors active:scale-90 disabled:opacity-40"
                      >
                        <FiPlus size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ═══ COUPON SECTION ═══ */}
          <div className="px-5 mb-3">
            <div className="bg-white rounded-store p-4 shadow-store-sm">
              {appliedCoupon ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                      <FiTag size={15} className="text-green-600" />
                    </div>
                    <div>
                      <span className="text-[13px] font-bold text-green-700">{appliedCoupon.code}</span>
                      <p className="text-[11px] text-green-600 font-medium">₹{appliedCoupon.discountAmount} saved</p>
                    </div>
                  </div>
                  <button onClick={handleRemoveCoupon} className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                    <FiX size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <FiPercent size={16} className="text-store-muted" />
                    <span className="text-[13px] font-semibold text-store-text">Apply Coupon</span>
                  </div>
                  <div className="flex gap-2 mt-2.5">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                      placeholder="Enter coupon code"
                      className="flex-1 bg-store-surface border border-store-border rounded-xl py-2.5 px-3.5 text-[12px] outline-none focus:border-orange-400 transition-all text-store-text placeholder:text-store-muted font-medium uppercase"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-5 py-2.5 bg-store-text text-white rounded-xl text-[12px] font-bold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-red-500 text-[11px] font-medium mt-1.5">{couponError}</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ═══ BILL DETAILS ═══ */}
          <div className="px-5 mb-5">
            <div className="bg-white rounded-store p-4 shadow-store-sm">
              <h3 className="font-bold text-store-text text-[14px] mb-3 flex items-center gap-2">
                <span className="text-sm">📋</span> Price Details
              </h3>
              <div className="space-y-2.5 text-[13px]">
                <div className="flex justify-between text-store-subtitle">
                  <span>Subtotal ({items.reduce((acc, item) => acc + item.quantity, 0)} items)</span>
                  <span className="font-semibold text-store-text">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-store-subtitle">
                  <span>Delivery Fee</span>
                  {shipping === 0 ? (
                    <span className="font-semibold text-green-600">FREE</span>
                  ) : (
                    <span className="font-semibold text-store-text">₹{shipping}</span>
                  )}
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="font-medium">Coupon Discount</span>
                    <span className="font-bold">-₹{discount}</span>
                  </div>
                )}
                <div className="pt-3 mt-3 border-t border-store-border flex justify-between">
                  <span className="font-bold text-store-text text-[15px]">Total Amount</span>
                  <span className="font-extrabold text-store-text text-[18px]">₹{total}</span>
                </div>
              </div>
              {discount > 0 && (
                <div className="mt-3 bg-green-50 rounded-xl p-2.5 text-center">
                  <span className="text-[12px] font-bold text-green-700">🎉 You're saving ₹{discount} on this order!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ STICKY CHECKOUT BAR ═══ */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-store-border shadow-store-top px-5 py-3.5 pb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[11px] text-store-muted font-medium block">Total</span>
              <span className="text-[20px] font-extrabold text-store-text">₹{total}</span>
            </div>
            {discount > 0 && (
              <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">Saving ₹{discount}</span>
            )}
          </div>
          {hasOutOfStockItems && (
            <p className="text-red-500 text-[11px] font-bold text-center mb-2">
              ⚠️ Remove or adjust out-of-stock items to proceed
            </p>
          )}
          <button
            onClick={() => navigate('/user/checkout', { state: { total, couponCode: appliedCoupon?.code } })}
            disabled={hasOutOfStockItems}
            className={`w-full font-bold py-4 rounded-store text-[15px] flex items-center justify-center gap-2 transition-all ${
              hasOutOfStockItems 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-store-text text-white shadow-store hover:bg-gray-800 active:scale-[0.98]'
            }`}
          >
            Proceed to Checkout
            <FiChevronRight size={17} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Cart;
