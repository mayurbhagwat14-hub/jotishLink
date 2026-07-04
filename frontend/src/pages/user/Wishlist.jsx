import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { FiArrowLeft, FiHeart, FiStar, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { getWishlist, toggleWishlist } from '../../api/storeApis';
import { fetchCartThunk } from '../../store/slices/cartSlice';
import SplashScreen from '../../components/SplashScreen';
import { ProductCard } from './Store';

const Wishlist = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadWishlist = async () => {
    try {
      const res = await getWishlist();
      if (res.data?.success) {
        setWishlistProducts(res.data.data.wishlist?.products || []);
      }
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const handleToggleWishlist = async (productId) => {
    try {
      // Optimistic UI update
      setWishlistProducts(wishlistProducts.filter(p => (p._id || p.id) !== productId));
      await toggleWishlist(productId);
    } catch (err) {
      toast.error('Failed to update wishlist');
      loadWishlist(); // Revert on failure
    }
  };

  const handleAddToCart = async (product) => {
    try {
      await import('../../api/storeApis').then(m => m.updateCart(product._id || product.id, 1));
      dispatch(fetchCartThunk());
      toast.success('Added to Bag');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add item');
    }
  };

  const handleProductNavigate = (productId) => {
    navigate(`/user/product/${productId}`);
  };

  if (loading) return <SplashScreen />;

  return (
    <div className="bg-store-bg min-h-screen pb-20 font-store">
      {/* ═══ HEADER ═══ */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-store-border px-5 py-3 flex items-center gap-3 shadow-store-sm">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center text-store-text hover:bg-store-surface rounded-full transition-colors active:scale-95"
        >
          <FiArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-[17px] font-extrabold text-store-text leading-tight tracking-tight">My Wishlist</h1>
          <p className="text-[11px] text-store-muted font-medium mt-0.5">{wishlistProducts.length} items saved</p>
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="p-5 store-stagger">
        {wishlistProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 store-stagger">
            {wishlistProducts.map((product, i) => (
              <ProductCard
                key={product._id || product.id || i}
                product={product}
                onAddToCart={handleAddToCart}
                onNavigate={handleProductNavigate}
                isWishlisted={true}
                onToggleWishlist={handleToggleWishlist}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl shadow-store-sm border border-store-border mt-4">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <FiHeart size={40} className="text-red-400 fill-red-100" />
            </div>
            <h3 className="text-[18px] font-extrabold text-store-text mb-2 tracking-tight">Your Wishlist is Empty</h3>
            <p className="text-[13px] text-store-muted mb-6 max-w-[200px] mx-auto leading-relaxed">
              Save your favorite items here to buy them later.
            </p>
            <button
              onClick={() => navigate('/user/store')}
              className="px-6 py-3 bg-store-text text-white font-bold rounded-xl text-[13px] hover:bg-gray-800 transition-colors shadow-store-sm active:scale-95"
            >
              Explore Store
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
