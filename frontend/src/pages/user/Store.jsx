import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiSearch, FiClock, FiShoppingBag } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { getStoreProducts, getStorePandits } from '../../api/userApis';
import { fetchCartThunk, updateCartThunk } from '../../store/slices/cartSlice';
import getSocket from '../../socket/socketManager';
import toast from 'react-hot-toast';

const tabs = ['Astro Mall', 'Pandit Booking'];

const Store = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [searchQuery, setSearchQuery] = useState(location.state?.category || '');
  const [panditSearchQuery, setPanditSearchQuery] = useState('');
  const { user } = useSelector((state) => state.auth);
  const { cart } = useSelector((state) => state.cart);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Local state for products, pandits and loading state
  const [products, setProducts] = useState([]);
  const [topSellingProducts, setTopSellingProducts] = useState([]);
  const [newLaunchProducts, setNewLaunchProducts] = useState([]);
  const [storeCategories, setStoreCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  
  const [pandits, setPandits] = useState([]);
  const [poojaTypes, setPoojaTypes] = useState(['General Pooja']);
  const [selectedPooja, setSelectedPooja] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchCartThunk());
    let active = true;
    const loadStoreData = async () => {
      try {
        setLoading(true);
        const [productsRes, panditsRes] = await Promise.allSettled([
          getStoreProducts(),
          getStorePandits()
        ]);

        if (active) {
          if (productsRes.status === 'fulfilled' && productsRes.value?.data) {
            const rawData = productsRes.value.data;
            const data = rawData.data || rawData; // Handle ApiResponse wrapper
            const fetchedProducts = Array.isArray(data) ? data : (data.products || []);
            setProducts(fetchedProducts);
            if (data.categories) setStoreCategories(data.categories);
            if (data.topSelling) setTopSellingProducts(data.topSelling);
            if (data.newLaunch) setNewLaunchProducts(data.newLaunch);
            if (data.banners) setBanners(data.banners);
          }
          if (panditsRes.status === 'fulfilled' && panditsRes.value?.data) {
            const data = panditsRes.value.data;
            const fetchedPandits = Array.isArray(data) ? data : (data.pandits || []);
            if (fetchedPandits.length > 0) {
              setPandits(fetchedPandits);
            }
            if (data.poojaTypes && data.poojaTypes.length > 0) {
              setPoojaTypes(data.poojaTypes);
              if (!selectedPooja) setSelectedPooja(data.poojaTypes[0]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load store data:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    loadStoreData();

    // Listen for real-time banner updates
    const s = getSocket();
    if (s) {
      s.on('banners_updated', loadStoreData);
    }

    return () => {
      active = false;
      if (s) s.off('banners_updated', loadStoreData);
    };
  }, [dispatch]);

  const filteredPandits = (pandits || []).filter(p => 
    p &&
    Array.isArray(p.skills) && p.skills.includes(selectedPooja) && 
    typeof p.name === 'string' && p.name.toLowerCase().includes(panditSearchQuery.toLowerCase())
  );
  const filteredProducts = (products || []).filter(p => {
    if (!p) return false;
    const query = searchQuery.toLowerCase();
    const matchName = typeof p.name === 'string' && p.name.toLowerCase().includes(query);
    const matchCategory = typeof p.category === 'string' && p.category.toLowerCase().includes(query);
    return matchName || matchCategory;
  });

  const handleAddToCart = async (product) => {
    try {
      const existingItem = cart?.items?.find(item => item.productId?._id === product._id || item.productId === product._id);
      const newQty = existingItem ? existingItem.quantity + 1 : 1;
      await dispatch(updateCartThunk({ productId: product._id, quantity: newQty })).unwrap();
      toast.success('Added to cart successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to add to cart');
    }
  };

  const cartItemCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  return (
    <div className="w-full bg-white min-h-screen pb-24 font-sans relative">
      {loading && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-orange-300 animate-pulse z-50" />
      )}

      {/* ═══ TOP NAVBAR ═══ */}
      <div className="flex items-center justify-between px-4 py-3 bg-white sticky top-0 z-30 shadow-sm border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-orange-200">
            <span className="text-orange-500 font-bold text-sm">{(user?.name || 'G')[0]}</span>
          </div>
          <span className="text-gray-800 font-semibold text-[18px]">JyotishLink Services</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center hover:bg-orange-100 transition-colors">
            <FiClock size={16} className="text-orange-500" />
          </button>
          <button onClick={() => navigate('/user/cart')} className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center hover:bg-orange-100 transition-colors relative">
            <FiShoppingBag size={16} className="text-orange-500" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="flex bg-white border-b border-gray-100 px-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-[13px] font-bold transition-all relative ${
              activeTab === tab ? 'text-orange-500' : 'text-gray-400'
            }`}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-2 right-2 h-[3px] bg-orange-500 rounded-full" />}
          </button>
        ))}
      </div>

      {activeTab === tabs[0] ? (
        <>
          {/* ═══ SEARCH BAR ═══ */}
          <div className="px-4 py-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full border-2 border-gray-100 rounded-xl py-2.5 px-4 pr-10 text-[14px] outline-none focus:border-orange-400 bg-gray-50 transition-all"
              />
              <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-400" size={18} />
            </div>
          </div>

          {searchQuery ? (
            <div className="px-4 py-4">
              <h2 className="text-[16px] font-bold text-gray-800 mb-3">Search Results</h2>
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {filteredProducts.map((product, i) => (
                    <div 
                      key={product.id || product._id || i} 
                      onClick={() => navigate(`/user/product/${product._id || product.id}`)}
                      className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden cursor-pointer hover:shadow-card-hover transition-shadow"
                    >
                      <div className="h-[140px] bg-orange-50 overflow-hidden">
                        <img src={product.image || product.img} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="p-3">
                        <h4 className="text-[13px] font-semibold text-gray-800 line-clamp-1 mb-1">{product.name}</h4>
                        <div className="flex items-center gap-1 mb-1.5">
                          <span className="text-orange-400 text-[11px]">★ {product.rating}</span>
                          <span className="text-gray-400 text-[10px]">({product.reviews})</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[15px] font-bold text-gray-900">₹{product.price}</span>
                          <span className="text-[12px] text-gray-400 line-through">₹{product.originalPrice}</span>
                          <span className="text-[10px] text-orange-500 font-bold bg-orange-50 px-1.5 py-0.5 rounded">{product.discount}</span>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                          className="w-full border-2 border-orange-500 text-orange-500 font-bold text-[12px] py-1.5 rounded-xl hover:bg-orange-50 active:scale-95 transition-all"
                        >
                          Add to cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500 font-medium">No products found matching "{searchQuery}"</div>
              )}
            </div>
          ) : (
            <>
              {/* ═══ CATEGORIES ═══ */}
              <div className="flex gap-5 px-4 py-3 overflow-x-auto no-scrollbar">
                {storeCategories.map((cat, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group" onClick={() => setSearchQuery(cat.name)}>
                    <div className="w-[60px] h-[60px] rounded-2xl overflow-hidden border-2 border-orange-100 bg-orange-50 shadow-card group-hover:shadow-card-hover group-hover:border-orange-300 transition-all">
                      <img src={cat.img} alt={cat.name} className="w-full h-full object-cover p-1 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <span className="text-[11px] text-gray-700 font-semibold text-center">{cat.name}</span>
                  </div>
                ))}
              </div>

              {/* ═══ BANNER ═══ */}
              {banners.length > 0 && (
                <div className="px-4 py-3 flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory">
                  {banners.map((banner, i) => (
                    <div key={banner._id || i} className="w-full shrink-0 snap-center">
                      <div className="w-full h-36 bg-gray-100 rounded-2xl relative overflow-hidden shadow-sm">
                        <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ═══ TOP SELLING ═══ */}
              <div className="px-4 py-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-[16px] font-bold text-gray-800">Top Selling</h2>
                  <span className="text-[12px] text-orange-500 font-semibold cursor-pointer">View All</span>
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar">
                  {topSellingProducts.map((p, i) => (
                    <div 
                      key={i} 
                      onClick={() => navigate(`/user/product/${p._id || p.id}`)}
                      className="shrink-0 flex flex-col items-center gap-1.5 w-[72px] cursor-pointer group"
                    >
                      <div className="w-[64px] h-[64px] rounded-full overflow-hidden border-2 border-orange-100 bg-orange-50 group-hover:border-orange-300 transition-colors flex items-center justify-center text-orange-300">
                        {p.image || p.img ? (
                          <img src={p.image || p.img} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-gray-400">No Img</span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-600 font-semibold text-center leading-tight truncate w-full px-1">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ═══ NEWLY LAUNCH ═══ */}
              <div className="px-4 py-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-[16px] font-bold text-gray-800">Newly Launch</h2>
                  <span className="text-[12px] text-orange-500 font-semibold cursor-pointer">View All</span>
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar">
                  {newLaunchProducts.map((p, i) => (
                    <div 
                      key={i} 
                      onClick={() => navigate(`/user/product/${p._id || p.id}`)}
                      className="shrink-0 flex flex-col items-center gap-1.5 w-[72px] cursor-pointer group"
                    >
                      <div className="w-[64px] h-[64px] rounded-full overflow-hidden border-2 border-orange-100 bg-orange-50 group-hover:border-orange-300 transition-colors flex items-center justify-center text-orange-300">
                        {p.image || p.img ? (
                          <img src={p.image || p.img} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-gray-400">No Img</span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-600 font-semibold text-center leading-tight truncate w-full px-1">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ═══ ALL PRODUCTS GRID ═══ */}
              <div className="px-4 py-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-[16px] font-bold text-gray-800">All Products</h2>
                  <span className="text-[12px] text-orange-500 font-semibold cursor-pointer">View All</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {products.map((product, i) => (
                    <div 
                      key={product.id || product._id || i} 
                      onClick={() => navigate(`/user/product/${product._id || product.id}`)}
                      className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden cursor-pointer hover:shadow-card-hover transition-shadow"
                    >
                      <div className="h-[140px] bg-orange-50 overflow-hidden flex items-center justify-center text-orange-300">
                        {product.image || product.img ? (
                          <img src={product.image || product.img} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <span className="text-sm font-bold text-gray-400">No Img</span>
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className="text-[13px] font-semibold text-gray-800 line-clamp-1 mb-1">{product.name}</h4>
                        <div className="flex items-center gap-1 mb-1.5">
                          <span className="text-orange-400 text-[11px]">★ {product.rating}</span>
                          <span className="text-gray-400 text-[10px]">({product.reviews})</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[15px] font-bold text-gray-900">₹{product.price}</span>
                          {product.originalPrice && <span className="text-[12px] text-gray-400 line-through">₹{product.originalPrice}</span>}
                          {product.discount && <span className="text-[10px] text-orange-500 font-bold bg-orange-50 px-1.5 py-0.5 rounded">{product.discount}</span>}
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                          className="w-full border-2 border-orange-500 text-orange-500 font-bold text-[12px] py-1.5 rounded-xl hover:bg-orange-50 active:scale-95 transition-all"
                        >
                          Add to cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        /* ═══ PANDIT BOOKING TAB ═══ */
        <div className="bg-gray-50 min-h-screen">
          
          {/* SEARCH PANDIT */}
          <div className="bg-white px-4 py-3 shadow-sm mb-1">
            <div className="relative">
              <input
                type="text"
                value={panditSearchQuery}
                onChange={(e) => setPanditSearchQuery(e.target.value)}
                placeholder="Search pandit by name..."
                className="w-full border-2 border-gray-100 rounded-xl py-2.5 px-4 pr-10 text-[14px] outline-none focus:border-orange-400 bg-gray-50 transition-all"
              />
              <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-400" size={18} />
            </div>
          </div>

          {/* Pooja Selector */}
          <div className="bg-white px-4 py-4 mb-2 shadow-sm">
            <h2 className="text-[16px] font-bold text-gray-800 mb-3">Select Pooja</h2>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {poojaTypes.map((pooja) => (
                <button
                  key={pooja}
                  onClick={() => setSelectedPooja(pooja)}
                  className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-bold border-2 transition-all ${
                    selectedPooja === pooja
                      ? 'border-orange-500 bg-orange-50 text-orange-600'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-orange-300'
                  }`}
                >
                  {pooja}
                </button>
              ))}
            </div>
          </div>

          {/* Pandits List */}
          <div className="px-4 py-4 space-y-3">
            <h2 className="text-[16px] font-bold text-gray-800 mb-1">Available Pandits for {selectedPooja}</h2>
            {filteredPandits.map((pandit, idx) => (
              <div key={pandit.id || pandit._id || idx} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
                <div className="flex gap-3 items-center">
                  <div className="w-16 h-16 rounded-full border-2 border-orange-200 overflow-hidden shrink-0">
                    <img src={pandit.image || pandit.img} alt={pandit.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[16px] font-bold text-gray-900 leading-tight">{pandit.name}</h3>
                    <p className="text-[13px] text-gray-500 font-medium mb-1">Exp: {pandit.experience || 0} Years</p>
                    <div className="flex items-center gap-1">
                      <span className="text-orange-500 text-[12px]">★</span>
                      <span className="text-[12px] font-bold text-gray-700">{pandit.rating}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-gray-400 font-semibold mb-0.5">Starting at</p>
                    <p className="text-[18px] font-bold text-gray-900 leading-none">₹{pandit.pricing?.chat || pandit.price || 500}</p>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => navigate(`/user/pooja-booking/${pandit.id || pandit._id}`, { state: { pandit, pooja: selectedPooja } })}
                    className="flex-1 bg-orange-500 text-white font-bold py-2.5 rounded-xl text-[13px] hover:bg-orange-600 active:scale-[0.98] transition-all shadow-sm shadow-orange-200"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
            
            {filteredPandits.length === 0 && (
              <div className="text-center py-10">
                <p className="text-gray-500 font-medium">No Pandits available for this Pooja right now.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Store;
