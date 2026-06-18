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
  const [addingToCart, setAddingToCart] = useState(false);
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

  const cartItem = cart?.items?.find(item => {
    const itemId = item.product?._id || item.product;
    return itemId === product?._id;
  });
  const currentQuantity = cartItem ? cartItem.quantity : 0;

  const handleUpdateQuantity = async (newQuantity) => {
    if (!product) return;
    setAddingToCart(true);
    try {
      await dispatch(updateCartThunk({ productId: product._id, quantity: newQuantity })).unwrap();
      if (newQuantity === 1 && currentQuantity === 0) {
        toast.success('Added to cart!');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update cart');
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
      
      {/* ═══ TOP HEADER ═══ */}
      <div className="flex items-center justify-between px-5 py-4 bg-white z-30">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 bg-gray-50 text-gray-800 rounded-xl flex items-center justify-center transition-all active:scale-95"
        >
          <FiArrowLeft size={20} />
        </button>
        <h1 className="text-[18px] font-bold text-gray-900">Product Details</h1>
        <button 
          onClick={() => navigate('/user/cart')} 
          className="w-10 h-10 bg-gray-50 text-gray-800 rounded-xl flex items-center justify-center transition-all active:scale-95 relative"
        >
          <FiShoppingCart size={18} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* ═══ PRODUCT IMAGE ═══ */}
      <div className="w-full h-[35vh] bg-white flex flex-col items-center justify-center relative px-8 pb-4">
        <div className="w-full h-full relative flex items-center justify-center">
          {/* Faint ellipse shadow under product */}
          <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 w-[60%] h-[15px] bg-black/5 rounded-[100%] blur-md"></div>
          
          {(product.image || product.img) ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-pulse w-20 h-20 bg-orange-100 rounded-2xl"></div>
                </div>
              )}
              <img 
                src={product.image || product.img} 
                alt={product.name} 
                className={`w-[90%] h-[90%] object-contain transition-opacity duration-500 relative z-10 ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${(!product.inStock || product.stock <= 0) ? 'grayscale opacity-70' : ''}`}
                onLoad={() => setImageLoaded(true)}
              />
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 relative z-10">
              <span className="text-5xl">📦</span>
              <span className="text-sm text-gray-400 font-medium">No Image</span>
            </div>
          )}
        </div>
      </div>

      {/* ═══ PRODUCT INFO ═══ */}
      <div className="flex-1 bg-white px-5 pt-4">
        
        {/* Title & Price Row */}
        <div className="flex justify-between items-start mb-1">
          <h1 className="text-[22px] font-bold text-gray-900 leading-tight max-w-[70%]">
            {product.name}
          </h1>
          <div className="flex flex-col items-end">
             <span className="text-[12px] text-gray-400 font-medium">Price</span>
             <span className="text-[20px] font-bold text-gray-900">₹{product.price}</span>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-6">
          <FiStar className="text-yellow-400 fill-yellow-400" size={14} />
          <span className="text-[13px] font-medium text-gray-400">
            {product.rating || 4.8}({product.reviews || 0} review)
          </span>
        </div>

        {/* Description Text */}
        <div className="mb-6">
          <h3 className="text-[16px] font-bold text-gray-900 mb-2">Description</h3>
          <p className="text-[14px] text-gray-500 leading-relaxed font-medium whitespace-pre-wrap">
            {product.description || 'No description available for this product. Please contact us for more details.'}
          </p>
        </div>

        {/* Category Section (Similar to Color section in design) */}
        {product.category && (
           <div className="mb-6">
             <h3 className="text-[16px] font-bold text-gray-900 mb-3">Category</h3>
             <div className="inline-block bg-orange-50 text-orange-500 font-bold px-4 py-2 rounded-xl text-[13px]">
               {product.category}
             </div>
           </div>
        )}

        {/* Spacer for bottom bar */}
        <div className="h-24"></div>
      </div>

      {/* ═══ STICKY BOTTOM BAR ═══ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-50 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.06)] px-5 py-4 pb-6">
        <div className="flex items-center gap-4">
          
          {(!product.inStock || product.stock <= 0) ? (
            <button
              disabled
              className="w-full py-4 rounded-2xl font-bold text-[16px] flex items-center justify-center gap-2 bg-gray-100 text-gray-400 cursor-not-allowed transition-all"
            >
              Out of Stock
            </button>
          ) : currentQuantity > 0 ? (
            <>
              {/* Quantity Selector */}
              <div className="flex items-center justify-between bg-white border border-gray-100 shadow-sm rounded-2xl px-2 py-2 flex-1 max-w-[130px]">
                <button 
                  onClick={() => handleUpdateQuantity(currentQuantity - 1)}
                  disabled={addingToCart}
                  className="w-8 h-8 rounded-full bg-orange-50 text-orange-400 flex items-center justify-center transition-colors active:scale-90 disabled:opacity-50"
                >
                  <FiMinus size={14} strokeWidth={3} />
                </button>
                <span className="font-bold text-orange-400 text-[14px]">{currentQuantity}</span>
                <button 
                  onClick={() => handleUpdateQuantity(currentQuantity + 1)}
                  disabled={addingToCart}
                  className="w-8 h-8 rounded-full bg-orange-50 text-orange-400 flex items-center justify-center transition-colors active:scale-90 disabled:opacity-50"
                >
                  <FiPlus size={14} strokeWidth={3} />
                </button>
              </div>
              
              {/* Go to Cart Button */}
              <button
                onClick={() => navigate('/user/cart')}
                className="flex-1 py-4 rounded-2xl font-bold text-[16px] flex items-center justify-center gap-2 bg-green-500 text-white shadow-lg shadow-green-500/30 active:scale-[0.98] transition-all"
              >
                <FiCheck size={18} strokeWidth={3} /> Go to Cart
              </button>
            </>
          ) : (
            <button
              onClick={() => handleUpdateQuantity(1)}
              disabled={addingToCart}
              className="w-full py-4 rounded-2xl font-bold text-[16px] flex items-center justify-center gap-2 bg-orange-400 text-white hover:bg-orange-500 shadow-lg shadow-orange-400/30 active:scale-[0.98] transition-all disabled:opacity-70"
            >
              {addingToCart ? (
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <FiShoppingCart size={18} strokeWidth={2.5} /> Add to cart
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
