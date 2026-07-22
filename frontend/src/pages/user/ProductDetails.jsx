import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiArrowLeft, FiStar, FiShoppingCart, FiMinus, FiPlus, FiCheck, FiTruck, FiShield, FiRefreshCw, FiHeart, FiShare2, FiChevronRight } from 'react-icons/fi';
import { getProductById } from '../../api/userApis';
import { fetchCartThunk, updateCartThunk } from '../../store/slices/cartSlice';
import toast from 'react-hot-toast';

/* ═══ SKELETON ═══ */
const DetailSkeleton = () => (
  <div className="min-h-screen bg-store-bg font-sans animate-fade-in">
    <div className="flex items-center justify-between px-5 py-4 bg-white">
      <div className="w-10 h-10 store-skeleton rounded-xl" />
      <div className="w-28 h-4 store-skeleton" />
      <div className="w-10 h-10 store-skeleton rounded-xl" />
    </div>
    <div className="bg-white mx-5 mt-3 rounded-store-lg overflow-hidden">
      <div className="h-[300px] store-skeleton rounded-none" />
    </div>
    <div className="px-5 mt-4 space-y-3">
      <div className="h-5 store-skeleton w-3/4" />
      <div className="h-4 store-skeleton w-1/2" />
      <div className="h-6 store-skeleton w-1/3" />
      <div className="h-3 store-skeleton w-full mt-4" />
      <div className="h-3 store-skeleton w-5/6" />
      <div className="h-3 store-skeleton w-4/6" />
    </div>
  </div>
);

/* ═══ TRUST BADGE ═══ */
const TrustBadge = ({ icon: Icon, label }) => (
  <div className="flex flex-col items-center gap-1.5 flex-1">
    <div className="w-10 h-10 bg-store-surface rounded-2xl flex items-center justify-center">
      <Icon size={18} className="text-store-subtitle" />
    </div>
    <span className="text-[10px] font-semibold text-store-muted text-center leading-tight">{label}</span>
  </div>
);

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cart } = useSelector((state) => state.cart);
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [liked, setLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const cartCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  useEffect(() => {
    dispatch(fetchCartThunk());
    const fetchProduct = async () => {
      try {
        const response = await getProductById(id);
        const data = response.data?.data || response.data;
        if (data?.product) {
          setProduct(data.product);
        }
      } catch (err) {
        console.error('Failed to fetch product', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, dispatch]);

  const cartItem = cart?.items?.find(item => {
    const itemId = item.productId?._id || item.productId;
    return itemId === product?._id;
  });
  const currentQuantity = cartItem ? cartItem.quantity : 0;

  const handleUpdateQuantity = async (newQuantity) => {
    if (!product) return;
    setAddingToCart(true);
    try {
      await dispatch(updateCartThunk({ productId: product._id, quantity: newQuantity })).unwrap();
      if (newQuantity === 1 && currentQuantity === 0) {
        toast.success('Added to bag!', { icon: '🛍️', style: { borderRadius: '12px', fontWeight: 600 } });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update cart');
    } finally {
      setAddingToCart(false);
    }
  };

  /* ═══ LOADING STATE ═══ */
  if (loading) return <DetailSkeleton />;

  /* ═══ NOT FOUND STATE ═══ */
  if (!product) {
    return (
      <div className="min-h-screen bg-store-bg flex flex-col font-sans">
        <div className="flex items-center gap-3 px-5 py-4 bg-white">
          <button onClick={() => navigate('/user/store')} className="w-10 h-10 rounded-xl bg-store-surface flex items-center justify-center text-store-text hover:bg-store-border transition-colors">
            <FiArrowLeft size={18} />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-store-surface rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">🔍</span>
          </div>
          <h2 className="text-[18px] font-bold text-store-text mb-2">Product Not Found</h2>
          <p className="text-store-muted mb-6 text-[13px] font-medium">This item is no longer available or may have been removed.</p>
          <button onClick={() => navigate('/user/store')} className="bg-store-text text-white font-bold py-3.5 px-8 rounded-xl shadow-store hover:bg-gray-800 transition-colors">
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on our store!`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const isOutOfStock = !product.inStock || product.stock <= 0;
  const discount = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  const images = product.images?.length > 0 ? product.images : [product.image || product.img];

  return (
    <div className="min-h-screen bg-store-bg flex flex-col font-sans">
      
      {/* ═══ TOP HEADER ═══ */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-white sticky top-0 z-30 shadow-store-sm">
        <button 
          onClick={() => navigate('/user/store')} 
          className="w-10 h-10 bg-store-surface text-store-text rounded-xl flex items-center justify-center transition-all active:scale-95 hover:bg-store-border"
        >
          <FiArrowLeft size={18} />
        </button>
        <h1 className="text-[16px] font-bold text-store-text">Product Details</h1>
        <button 
          onClick={() => navigate('/user/cart')} 
          className="w-10 h-10 bg-store-surface text-store-text rounded-xl flex items-center justify-center transition-all active:scale-95 hover:bg-store-border relative"
        >
          <FiShoppingCart size={17} />
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] bg-[#fa6830] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </button>
      </div>

      {/* ═══ PRODUCT IMAGE GALLERY ═══ */}
      <div className="bg-white mx-5 mt-3 rounded-store-lg overflow-hidden shadow-store relative">
        <div className="w-full h-[300px] sm:h-[350px] bg-store-surface flex items-center justify-center relative overflow-hidden">
          {images[activeImageIndex] ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 store-skeleton rounded-2xl" />
                </div>
              )}
              <img 
                src={images[activeImageIndex]} 
                alt={product.name} 
                className={`w-full h-full object-contain transition-opacity duration-500 p-6 ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
                onLoad={() => setImageLoaded(true)}
              />
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span className="text-5xl">📦</span>
              <span className="text-sm text-store-muted font-medium">No Image</span>
            </div>
          )}

          {/* Discount badge */}
          {discount > 0 && (
            <div className="absolute top-3 left-3 bg-red-500 text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-sm">
              {discount}% OFF
            </div>
          )}

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <span className="text-white text-[14px] font-bold bg-black/50 px-5 py-2 rounded-full">Out of Stock</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            <button 
              onClick={() => setLiked(!liked)}
              className={`w-9 h-9 rounded-full flex items-center justify-center shadow-store-sm transition-all ${
                liked ? 'bg-red-50 text-red-500' : 'bg-white/80 backdrop-blur-sm text-store-muted hover:bg-white'
              }`}
            >
              <FiHeart size={16} className={liked ? 'fill-red-500 wishlist-pop' : ''} />
            </button>
            <button 
              onClick={handleShare}
              className="w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-store-sm text-store-muted hover:bg-white transition-colors"
            >
              <FiShare2 size={15} />
            </button>
          </div>
        </div>

        {/* Image dots (for multi-image support) */}
        {images.length > 1 && (
          <div className="flex justify-center gap-1.5 py-3">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => { setActiveImageIndex(idx); setImageLoaded(false); }}
                className={`h-[5px] rounded-full transition-all duration-300 ${
                  activeImageIndex === idx ? 'w-5 bg-[#fa6830]' : 'w-2 bg-store-border hover:bg-store-muted'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ═══ PRODUCT INFO ═══ */}
      <div className="flex-1 px-5 pt-4 pb-32">
        
        {/* Category tag */}
        {product.category && (
          <div className="inline-block bg-store-surface text-store-subtitle font-semibold px-3 py-1 rounded-full text-[11px] mb-2.5">
            {product.category}
          </div>
        )}

        {/* Title & Price */}
        <h1 className="text-[20px] font-bold text-store-text leading-snug mb-2">
          {product.name}
        </h1>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1 bg-green-50 px-2.5 py-1 rounded-lg">
            <FiStar size={12} className="text-green-600 fill-green-600" />
            <span className="text-[12px] font-bold text-green-700">{product.rating || 4.5}</span>
          </div>
          <span className="text-[12px] text-store-muted font-medium">
            {product.reviews || 0} reviews
          </span>
        </div>

        {/* Price block */}
        <div className="bg-white rounded-store p-4 shadow-store-sm mb-4">
          <div className="flex items-baseline gap-2.5">
            <span className="text-[26px] font-bold text-store-text">₹{product.price}</span>
            {product.originalPrice && (
              <>
                <span className="text-[16px] text-store-muted line-through font-medium">₹{product.originalPrice}</span>
                {discount > 0 && (
                  <span className="text-[13px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-md">{discount}% off</span>
                )}
              </>
            )}
          </div>
          <p className="text-[11px] text-store-muted font-medium mt-1">Inclusive of all taxes</p>
        </div>

        {/* Trust Badges */}
        <div className="flex gap-2 mb-5">
          <TrustBadge icon={FiTruck} label="Free Delivery" />
          <TrustBadge icon={FiShield} label="Genuine Product" />
          <TrustBadge icon={FiRefreshCw} label="Easy Returns" />
        </div>

        {/* Description */}
        <div className="bg-white rounded-store p-4 shadow-store-sm mb-4">
          <h3 className="text-[15px] font-bold text-store-text mb-2">Description</h3>
          <p className="text-[13px] text-store-subtitle leading-relaxed whitespace-pre-wrap break-words w-full overflow-hidden">
            {product.description || 'No description available for this product. Please contact us for more details.'}
          </p>
        </div>

        {/* Stock Info */}
        {product.stock > 0 && product.stock <= 10 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-store p-3 mb-4">
            <span className="text-amber-500 text-sm">⚡</span>
            <span className="text-[12px] font-semibold text-amber-700">Only {product.stock} left in stock — order soon!</span>
          </div>
        )}
      </div>

      {/* ═══ STICKY BOTTOM BAR ═══ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-store-border shadow-store-top px-5 py-3.5 pb-5">
        {isOutOfStock ? (
          <button
            disabled
            className="w-full py-4 rounded-store font-bold text-[15px] flex items-center justify-center gap-2 bg-gray-100 text-gray-400 cursor-not-allowed"
          >
            Out of Stock
          </button>
        ) : currentQuantity > 0 ? (
          <div className="flex items-center gap-3">
            {/* Quantity Selector */}
            <div className="flex items-center bg-store-surface border border-store-border rounded-store px-1.5 py-1.5">
              <button 
                onClick={() => handleUpdateQuantity(currentQuantity - 1)}
                disabled={addingToCart}
                className="w-9 h-9 rounded-xl bg-white text-store-text flex items-center justify-center transition-colors active:scale-90 disabled:opacity-50 shadow-store-sm"
              >
                <FiMinus size={14} strokeWidth={2.5} />
              </button>
              <span className="w-10 text-center font-bold text-store-text text-[15px]">{currentQuantity}</span>
              <button 
                onClick={() => handleUpdateQuantity(currentQuantity + 1)}
                disabled={addingToCart}
                className="w-9 h-9 rounded-xl bg-white text-store-text flex items-center justify-center transition-colors active:scale-90 disabled:opacity-50 shadow-store-sm"
              >
                <FiPlus size={14} strokeWidth={2.5} />
              </button>
            </div>
            
            {/* Go to Cart Button */}
            <button
              onClick={() => navigate('/user/cart')}
              className="flex-1 py-4 rounded-store font-bold text-[15px] flex items-center justify-center gap-2 bg-store-text text-white shadow-store active:scale-[0.98] transition-all"
            >
              <FiShoppingCart size={17} strokeWidth={2.5} /> Go to Bag
              <FiChevronRight size={16} />
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => handleUpdateQuantity(1)}
              disabled={addingToCart}
              className="flex-1 py-4 rounded-store font-bold text-[15px] flex items-center justify-center gap-2 bg-white text-store-text border-2 border-store-text hover:bg-store-surface active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {addingToCart ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-store-text rounded-full animate-spin" />
              ) : (
                <>
                  <FiShoppingCart size={17} strokeWidth={2.5} /> Add to Bag
                </>
              )}
            </button>
            <button
              onClick={() => { handleUpdateQuantity(1); setTimeout(() => navigate('/user/cart'), 300); }}
              disabled={addingToCart}
              className="flex-1 py-4 rounded-store font-bold text-[15px] flex items-center justify-center gap-2 bg-[#fa6830] text-white shadow-lg shadow-orange-500/25 hover:bg-[#e55923] active:scale-[0.98] transition-all disabled:opacity-60"
            >
              Buy Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
