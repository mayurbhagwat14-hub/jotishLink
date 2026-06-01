import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiArrowLeft, FiStar, FiShoppingCart, FiMinus, FiPlus, FiCheck } from 'react-icons/fi';
import { getProductById } from '../../api/userApis';
import { updateCartThunk } from '../../store/slices/cartSlice';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [added, setAdded] = useState(false);

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
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      alert(err.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <div className="flex items-center justify-between px-4 py-3 bg-white sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-gray-800 p-1.5 rounded-full">
              <FiArrowLeft size={20} />
            </button>
            <span className="text-gray-800 font-semibold text-[17px]">Loading...</span>
          </div>
        </div>
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <div className="flex items-center justify-between px-4 py-3 bg-white sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-gray-800 p-1.5 rounded-full">
              <FiArrowLeft size={20} />
            </button>
            <span className="text-gray-800 font-semibold text-[17px]">Product Not Found</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Item unavailable</h2>
          <p className="text-gray-500 mb-6">The product you are looking for does not exist.</p>
          <button onClick={() => navigate('/user/store')} className="bg-orange-500 text-white font-bold py-3 px-8 rounded-xl">
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans pb-24">
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 bg-transparent absolute top-0 left-0 right-0 z-30">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/80 backdrop-blur text-gray-800 hover:bg-white rounded-full flex items-center justify-center shadow-sm transition-colors">
          <FiArrowLeft size={20} />
        </button>
        <button onClick={() => navigate('/user/cart')} className="w-10 h-10 bg-white/80 backdrop-blur text-gray-800 hover:bg-white rounded-full flex items-center justify-center shadow-sm transition-colors relative">
          <FiShoppingCart size={18} />
        </button>
      </div>

      {/* PRODUCT IMAGE */}
      <div className="w-full bg-orange-50 aspect-square flex items-center justify-center relative overflow-hidden">
        {product.image || product.img ? (
          <img src={product.image || product.img} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl font-bold text-gray-400">No Image</span>
        )}
      </div>

      {/* PRODUCT INFO */}
      <div className="bg-white rounded-t-3xl -mt-6 relative z-10 p-5 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight pr-4">{product.name}</h1>
        </div>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center bg-orange-50 px-2 py-1 rounded gap-1">
            <FiStar className="text-orange-500 fill-orange-500" size={12} />
            <span className="text-sm font-bold text-orange-600">{product.rating || 4.5}</span>
          </div>
          <span className="text-sm text-gray-400 font-medium">{product.reviews || 0} reviews</span>
          <span className="text-sm text-gray-300">•</span>
          <span className="text-sm text-gray-500 font-medium">{product.category}</span>
        </div>

        <div className="flex items-end gap-2 mb-6">
          <span className="text-3xl font-black text-gray-900">₹{product.price}</span>
          {product.originalPrice > product.price && (
            <>
              <span className="text-sm text-gray-400 line-through mb-1.5">₹{product.originalPrice}</span>
              <span className="text-sm font-bold text-green-500 mb-1.5 ml-1">{product.discount || `${Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF`}</span>
            </>
          )}
        </div>

        <h3 className="font-bold text-gray-900 mb-2">Description</h3>
        <p className="text-[15px] text-gray-600 leading-relaxed mb-6">
          {product.description || 'No description available for this product.'}
        </p>

        {/* QUANTITY */}
        <div className="flex items-center justify-between py-4 border-t border-b border-gray-100 mb-4">
          <span className="font-bold text-gray-800">Quantity</span>
          <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 p-1">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
            >
              <FiMinus size={18} />
            </button>
            <span className="w-10 text-center font-bold text-gray-800 text-[16px]">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
            >
              <FiPlus size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button
          onClick={handleAddToCart}
          disabled={addingToCart || added}
          className={`w-full py-4 rounded-xl font-bold text-[16px] flex items-center justify-center gap-2 transition-all ${
            added 
              ? 'bg-green-500 text-white' 
              : 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/30'
          }`}
        >
          {added ? (
            <><FiCheck size={20} /> Added to Cart</>
          ) : addingToCart ? (
            'Adding...'
          ) : (
            'Add to Cart'
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductDetails;
