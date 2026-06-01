import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiShoppingCart, FiChevronRight } from 'react-icons/fi';

const CartBottomSheet = () => {
  const { cart } = useSelector((state) => state.cart);
  const navigate = useNavigate();
  const location = useLocation();

  if (!cart?.items || cart.items.length === 0) return null;
  
  // Don't show on checkout or cart page
  if (location.pathname.includes('/checkout') || location.pathname.includes('/cart')) return null;

  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.items.reduce((sum, item) => sum + (item.productId?.price || 0) * item.quantity, 0);

  return (
    <div className="fixed bottom-[72px] lg:bottom-4 left-4 right-4 lg:left-auto lg:w-[400px] z-40 bg-orange-500 rounded-2xl shadow-xl p-4 flex items-center justify-between cursor-pointer hover:bg-orange-600 transition-colors animate-slide-up" onClick={() => navigate('/user/cart')}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <FiShoppingCart className="text-white" size={20} />
        </div>
        <div>
          <p className="text-white font-bold text-sm">{totalItems} {totalItems === 1 ? 'Item' : 'Items'} Added</p>
          <p className="text-white/80 text-xs font-medium">Total: ₹{totalPrice}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 text-white font-bold text-sm">
        View Cart
        <FiChevronRight size={18} />
      </div>
    </div>
  );
};

export default CartBottomSheet;
