import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiArrowLeft, FiStar, FiShoppingCart, FiMinus, FiPlus, FiCheck, FiTruck, FiShield, FiRefreshCw, FiHeart, FiShare2 } from 'react-icons/fi';
import { getProductById } from '../../api/userApis';
import { updateCartThunk } from '../../store/slices/cartSlice';
import toast from 'react-hot-toast';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cart } = useSelector((state) => state.cart);
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [added, setAdded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const cartCount = cart?.items?.length || 0;

  useEffect(() => {
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
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    try {
      await dispatch(updateCartThunk({ productId: product._id, quantity })).unwrap();
      setAdded(true);
      toast.success('Added to cart!');
      setTimeout(() => setAdded(false), 2500);
    } catch (err) {
      toast.error(err.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  /* ═══ LOADING STATE ═══ */
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
            <FiArrowLeft size={20} />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-orange-200 border-t-orange-500"></div>
          <span className="text-gray-400 text-sm font-medium">Loading product...</span>
        </div>
      </div>
    );
  }

  /* ═══ NOT FOUND STATE ═══ */
  if (!product) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
            <FiArrowLeft size={20} />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">🔍</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Product Not Found</h2>
          <p className="text-gray-500 mb-6 text-sm">This item is no longer available or may have been removed.</p>
          <button onClick={() => navigate('/user/store')} className="bg-orange-500 text-white font-bold py-3 px-8 rounded-xl shadow-md shadow-orange-500/20 hover:bg-orange-600 transition-colors">
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  const discount = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      
      {/* ═══ TOP HEADER (floating over image) ═══ */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3 py-3">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 bg-white/90 backdrop-blur-md text-gray-800 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95"
        >
          <FiArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLiked(!liked)}
            className={`w-10 h-10 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${liked ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-800 hover:bg-white'}`}
          >
            <FiHeart size={18} fill={liked ? 'currentColor' : 'none'} />
          </button>
          <button 
            onClick={() => navigate('/user/cart')} 
            className="w-10 h-10 bg-white/90 backdrop-blur-md text-gray-800 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 relative"
          >
            <FiShoppingCart size={18} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ═══ PRODUCT IMAGE ═══ */}
      <div className="w-full aspect-square bg-gradient-to-br from-orange-50 via-orange-100/50 to-amber-50 flex items-center justify-center relative overflow-hidden">
        {(product.image || product.img) ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-pulse w-20 h-20 bg-orange-200/50 rounded-2xl"></div>
              </div>
            )}
            <img 
              src={product.image || product.img} 
              alt={product.name} 
              className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
            />
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="text-5xl">📦</span>
            <span className="text-sm text-gray-400 font-medium">No Image</span>
          </div>
        )}
        
        {/* Discount badge */}
        {discount > 0 && (
          <div className="absolute top-16 left-3 bg-green-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-md">
            {discount}% OFF
          </div>
        )}
      </div>

      {/* ═══ PRODUCT INFO CARD ═══ */}
      <div className="bg-white rounded-t-[28px] -mt-7 relative z-10 flex-1">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-4"></div>
        
        <div className="px-5">
          {/* Category Tag */}
          {product.category && (
            <span className="inline-block bg-orange-50 text-orange-500 text-[11px] font-bold px-3 py-1 rounded-full mb-3 border border-orange-100">
              {product.category}
            </span>
          )}

          {/* Title */}
          <h1 className="text-[22px] font-black text-gray-900 leading-tight mb-2">
            {product.name}
          </h1>

          {/* Ratings */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1 bg-green-500 px-2 py-0.5 rounded-md">
              <FiStar className="text-white fill-white" size={11} />
              <span className="text-[12px] font-bold text-white">{product.rating || 4.5}</span>
            </div>
            <span className="text-[13px] text-gray-400 font-medium">{product.reviews || 0} reviews</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-5 pb-5 border-b border-gray-100">
            <span className="text-[28px] font-black text-gray-900">₹{product.price}</span>
            {product.originalPrice > product.price && (
              <>
                <span className="text-[16px] text-gray-400 line-through font-medium">₹{product.originalPrice}</span>
                <span className="text-[13px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-md">{discount}% off</span>
              </>
            )}
          </div>

          {/* ═══ DELIVERY & TRUST SECTION ═══ */}
          <div className="grid grid-cols-3 gap-3 mb-5 pb-5 border-b border-gray-100">
            {[
              { icon: <FiTruck size={18} />, label: 'Free\nDelivery', color: 'text-blue-500', bg: 'bg-blue-50' },
              { icon: <FiShield size={18} />, label: '100%\nAuthentic', color: 'text-green-500', bg: 'bg-green-50' },
              { icon: <FiRefreshCw size={18} />, label: 'Easy\nReturns', color: 'text-purple-500', bg: 'bg-purple-50' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-1.5">
                <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center ${item.color}`}>
                  {item.icon}
                </div>
                <span className="text-[10px] text-gray-600 font-semibold leading-tight whitespace-pre-line">{item.label}</span>
              </div>
            ))}
          </div>

          {/* ═══ DESCRIPTION ═══ */}
          <div className="mb-5 pb-5 border-b border-gray-100">
            <h3 className="text-[15px] font-bold text-gray-900 mb-2">Description</h3>
            <p className="text-[14px] text-gray-500 leading-relaxed">
              {product.description || 'No description available for this product. Please contact us for more details.'}
            </p>
          </div>

          {/* ═══ QUANTITY SELECTOR ═══ */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-[15px] font-bold text-gray-900">Quantity</span>
            <div className="flex items-center bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-11 h-11 flex items-center justify-center text-gray-500 hover:text-orange-500 hover:bg-orange-50 transition-colors active:scale-90"
              >
                <FiMinus size={16} strokeWidth={2.5} />
              </button>
              <span className="w-12 text-center font-bold text-gray-800 text-[16px] select-none">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="w-11 h-11 flex items-center justify-center text-gray-500 hover:text-orange-500 hover:bg-orange-50 transition-colors active:scale-90"
              >
                <FiPlus size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between bg-orange-50/70 rounded-2xl px-4 py-3 mb-6 border border-orange-100">
            <span className="text-[13px] font-semibold text-gray-600">Total Amount</span>
            <span className="text-[18px] font-black text-gray-900">₹{product.price * quantity}</span>
          </div>

          {/* Spacer for bottom bar */}
          <div className="h-24"></div>
        </div>
      </div>

      {/* ═══ STICKY BOTTOM ADD-TO-CART BAR ═══ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        <div className="px-4 py-3 flex items-center gap-3">
          {/* Price summary */}
          <div className="flex-1">
            <p className="text-[11px] text-gray-400 font-medium">{quantity} item{quantity > 1 ? 's' : ''}</p>
            <p className="text-[20px] font-black text-gray-900 leading-tight">₹{product.price * quantity}</p>
          </div>
          
          {/* Add to Cart / Go to Cart */}
          {added ? (
            <button
              onClick={() => navigate('/user/cart')}
              className="flex-1 py-3.5 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 bg-green-500 text-white shadow-lg shadow-green-500/30 active:scale-[0.98] transition-all"
            >
              <FiCheck size={18} strokeWidth={3} /> Go to Cart
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="flex-1 py-3.5 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/30 active:scale-[0.98] transition-all disabled:opacity-70"
            >
              {addingToCart ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                  Adding...
                </>
              ) : (
                <>
                  <FiShoppingCart size={18} /> Add to Cart
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
