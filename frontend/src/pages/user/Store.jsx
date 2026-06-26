import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
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
  const { appName } = useSelector((state) => state.settings) || { appName: 'JyotishLink' };
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { openSidebar } = useOutletContext() || {};

  // Local state for products, pandits and loading state
  const [products, setProducts] = useState([]);
  const [topSellingProducts, setTopSellingProducts] = useState([]);
  const [newLaunchProducts, setNewLaunchProducts] = useState([]);
  const [storeCategories, setStoreCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const scrollRef = useRef(null);

  const handleBannerScroll = (e) => {
    if (!e.target.children[0]) return;
    const childWidth = e.target.children[0].offsetWidth;
    const scrollLeft = e.target.scrollLeft;
    const index = Math.round(scrollLeft / (childWidth + 16));
    if (index >= 0 && index < banners.length && index !== currentBannerIndex) {
      setCurrentBannerIndex(index);
    }
  };

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => {
        const next = (prev + 1) % banners.length;
        if (scrollRef.current && scrollRef.current.children[next]) {
          const child = scrollRef.current.children[next];
          scrollRef.current.scrollTo({ left: child.offsetLeft - 16, behavior: 'smooth' });
        }
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [banners.length]);
  
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
            const rawData = panditsRes.value.data;
            const data = rawData.data || rawData;
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

  const filteredPandits = (pandits || []).filter(p => {
    if (!p) return false;
    
    let offersSelectedPooja = false;
    if (p.poojasOffered && p.poojasOffered.length > 0) {
      offersSelectedPooja = p.poojasOffered.some(pooja => pooja.poojaName === selectedPooja);
    } else if (p.skills && p.skills.includes(selectedPooja)) {
      offersSelectedPooja = true;
    }

    const matchesSearch = typeof p.name === 'string' && p.name.toLowerCase().includes(panditSearchQuery.toLowerCase());
    
    return offersSelectedPooja && matchesSearch;
  });
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
          <div 
            onClick={() => openSidebar && openSidebar()} 
            className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-orange-200 cursor-pointer"
          >
            <span className="text-orange-500 font-bold text-sm">{(user?.name || 'G')[0]}</span>
          </div>
          <span className="text-gray-800 font-semibold text-[18px]">{appName} Services</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Icons removed as per user request */}
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredProducts.map((product, i) => (
                    <div 
                      key={product.id || product._id || i} 
                      onClick={() => navigate(`/user/product/${product._id || product.id}`)}
                      className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden cursor-pointer hover:shadow-card-hover transition-shadow"
                    >
                      <div className="h-[100px] bg-orange-50 overflow-hidden">
                        <img src={product.image || product.img} alt={product.name} className={`w-full h-full object-cover hover:scale-105 transition-transform duration-500 ${(!product.inStock || product.stock <= 0) ? 'grayscale opacity-70' : ''}`} />
                      </div>
                      <div className="p-3">
                        <h4 className="text-[13px] font-semibold text-gray-800 line-clamp-1 mb-1">{product.name}</h4>
                        <div className="flex items-center gap-1 mb-1.5">
                          <span className="text-orange-400 text-[11px]">★ {product.rating}</span>
                          <span className="text-gray-400 text-[10px]">({product.reviews})</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[15px] font-bold text-gray-900">₹{product.price}</span>
                          {product.originalPrice ? <span className="text-[12px] text-gray-400 line-through">₹{product.originalPrice}</span> : null}
                          {product.discount && product.discount !== '0%' && <span className="text-[10px] text-orange-500 font-bold bg-orange-50 px-1.5 py-0.5 rounded">{product.discount}</span>}
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); if(product.inStock !== false && product.stock > 0) handleAddToCart(product); }}
                          disabled={product.inStock === false || product.stock <= 0}
                          className={`w-full border-2 font-bold text-[12px] py-1.5 rounded-xl transition-all ${
                            (!product.inStock || product.stock <= 0)
                              ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                              : 'border-orange-500 text-orange-500 hover:bg-orange-50 active:scale-95'
                          }`}
                        >
                          {(!product.inStock || product.stock <= 0) ? 'Out of Stock' : 'Add to cart'}
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
              <div className="flex gap-3 px-4 py-4 overflow-x-auto no-scrollbar">
                {storeCategories.map((cat, i) => (
                  <div 
                    key={i} 
                    onClick={() => setSearchQuery(cat.name)}
                    className="flex items-center gap-2 shrink-0 px-3 py-2 bg-white rounded-2xl border-2 border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:border-orange-400 hover:shadow-orange-500/10 cursor-pointer transition-all active:scale-95 group"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-orange-50 shrink-0">
                      <img src={cat.img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <span className="text-[13px] text-gray-800 font-bold whitespace-nowrap pr-1">{cat.name}</span>
                  </div>
                ))}
              </div>

              {/* ═══ BANNER ═══ */}
              {banners.length > 0 && (
                <div className="py-3">
                  <div 
                    ref={scrollRef}
                    onScroll={handleBannerScroll}
                    className="px-4 flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory"
                  >
                    {banners.map((banner, i) => (
                      <div 
                        key={banner._id || i} 
                        className="w-[85vw] sm:w-[320px] h-36 shrink-0 snap-center bg-gray-100 rounded-2xl relative overflow-hidden shadow-sm cursor-pointer"
                        onClick={() => {
                          if (banner.linkUrl) {
                            if (banner.linkUrl.startsWith('http')) {
                              window.open(banner.linkUrl, '_blank');
                            } else {
                              navigate(banner.linkUrl);
                            }
                          }
                        }}
                      >
                        <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination Dots Indicator */}
                  <div className="flex justify-center gap-1.5 mt-3">
                    {banners.map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`h-[4px] rounded-full transition-all duration-300 ${currentBannerIndex === idx ? 'w-4 bg-[#ff8c00]' : 'w-1.5 bg-[#ff8c00]/30'}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ═══ TOP SELLING ═══ */}
              <div className="px-4 py-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-[16px] font-bold text-gray-800">Top Selling</h2>
                  <span className="text-[12px] text-orange-500 font-semibold cursor-pointer">View All</span>
                </div>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {topSellingProducts.map((p, i) => (
                    <div 
                      key={i} 
                      onClick={() => navigate(`/user/product/${p._id || p.id}`)}
                      className="shrink-0 w-[135px] bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all group"
                    >
                      <div className="h-[110px] bg-orange-50 relative overflow-hidden flex items-center justify-center">
                        {p.image || p.img ? (
                          <img src={p.image || p.img} alt={p.name} className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${(!p.inStock || p.stock <= 0) ? 'grayscale opacity-70' : ''}`} />
                        ) : (
                          <span className="text-[10px] font-bold text-orange-300">No Img</span>
                        )}
                        {p.discount && p.discount !== '0%' && (
                          <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-orange-400 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">
                            {p.discount} OFF
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <h4 className="text-[12px] font-bold text-gray-800 line-clamp-1 mb-1">{p.name}</h4>
                        <div className="flex items-center gap-1 mb-2">
                          <span className="text-orange-400 text-[10px]">★ {p.rating || '4.8'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[14px] font-black text-gray-900">₹{p.price}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); if(p.inStock !== false && p.stock > 0) handleAddToCart(p); }}
                            className="w-6 h-6 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 font-bold hover:bg-orange-500 hover:text-white transition-colors text-[14px]"
                          >
                            +
                          </button>
                        </div>
                      </div>
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
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {newLaunchProducts.map((p, i) => (
                    <div 
                      key={i} 
                      onClick={() => navigate(`/user/product/${p._id || p.id}`)}
                      className="shrink-0 w-[135px] bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all group"
                    >
                      <div className="h-[110px] bg-orange-50 relative overflow-hidden flex items-center justify-center">
                        {p.image || p.img ? (
                          <img src={p.image || p.img} alt={p.name} className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${(!p.inStock || p.stock <= 0) ? 'grayscale opacity-70' : ''}`} />
                        ) : (
                          <span className="text-[10px] font-bold text-orange-300">No Img</span>
                        )}
                        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-white text-[8px] font-black tracking-wider px-1.5 py-0.5 rounded shadow-sm uppercase">
                          NEW
                        </div>
                      </div>
                      <div className="p-2.5">
                        <h4 className="text-[12px] font-bold text-gray-800 line-clamp-1 mb-1">{p.name}</h4>
                        <div className="flex items-center gap-1 mb-2">
                          <span className="text-orange-400 text-[10px]">★ {p.rating || 'New'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[14px] font-black text-gray-900">₹{p.price}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); if(p.inStock !== false && p.stock > 0) handleAddToCart(p); }}
                            className="w-6 h-6 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 font-bold hover:bg-orange-500 hover:text-white transition-colors text-[14px]"
                          >
                            +
                          </button>
                        </div>
                      </div>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {products.map((product, i) => (
                    <div 
                      key={product.id || product._id || i} 
                      onClick={() => navigate(`/user/product/${product._id || product.id}`)}
                      className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all group flex flex-col"
                    >
                      <div className="h-[120px] bg-gray-50 relative overflow-hidden flex items-center justify-center text-gray-300">
                        {product.image || product.img ? (
                          <img src={product.image || product.img} alt={product.name} className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${(!product.inStock || product.stock <= 0) ? 'grayscale opacity-70' : ''}`} />
                        ) : (
                          <span className="text-[10px] font-bold text-gray-400">No Img</span>
                        )}
                        {product.discount && product.discount !== '0%' && (
                          <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-orange-400 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">
                            {product.discount}
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex flex-col flex-1 justify-between">
                        <div>
                          <h4 className="text-[13px] font-bold text-gray-800 line-clamp-1 mb-1">{product.name}</h4>
                          <div className="flex items-center gap-1 mb-1.5">
                            <span className="text-orange-400 text-[10px]">★ {product.rating || '4.5'}</span>
                            <span className="text-gray-400 text-[9px]">({product.reviews || '120'})</span>
                          </div>
                          <div className="flex items-center gap-1 mb-3">
                            <span className="text-[15px] font-black text-gray-900">₹{product.price}</span>
                            {product.originalPrice ? <span className="text-[11px] text-gray-400 line-through font-medium">₹{product.originalPrice}</span> : null}
                          </div>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); if(product.inStock !== false && product.stock > 0) handleAddToCart(product); }}
                          disabled={product.inStock === false || product.stock <= 0}
                          className={`w-full font-bold text-[12px] py-2 rounded-lg transition-all shadow-sm ${
                            (!product.inStock || product.stock <= 0)
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-orange-500/30 hover:-translate-y-0.5 active:scale-95'
                          }`}
                        >
                          {(!product.inStock || product.stock <= 0) ? 'Out of Stock' : 'Add to Cart'}
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
                    <img src={pandit.avatar || pandit.image || pandit.img} alt={pandit.name} className="w-full h-full object-cover" />
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
                    <p className="text-[18px] font-bold text-gray-900 leading-none">
                      ₹{pandit.poojasOffered?.find(p => p.poojaName === selectedPooja)?.price || pandit.pricing?.chat || pandit.price || 500}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => navigate(`/user/pooja-booking/${pandit.id || pandit._id}`, { state: { pandit, pooja: selectedPooja, price: pandit.poojasOffered?.find(p => p.poojaName === selectedPooja)?.price || 500 } })}
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
