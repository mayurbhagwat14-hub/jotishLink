import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { FiSearch, FiShoppingBag, FiHeart, FiStar, FiChevronRight, FiZap, FiArrowLeft } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { getStoreProducts, getStorePandits } from '../../api/userApis';
import { fetchCartThunk, updateCartThunk } from '../../store/slices/cartSlice';
import getSocket from '../../socket/socketManager';
import toast from 'react-hot-toast';

import { getWishlist, toggleWishlist } from '../../api/storeApis';

const tabs = ['Astro Mall', 'Pandit Booking'];

/* ═══════════════════════════════════════════
   SKELETON LOADERS
   ═══════════════════════════════════════════ */
const CategorySkeleton = () => (
  <div className="flex gap-3 px-5 py-4 overflow-x-hidden">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex flex-col items-center gap-2 shrink-0">
        <div className="w-14 h-14 rounded-2xl store-skeleton" />
        <div className="w-12 h-2.5 store-skeleton rounded-full" />
      </div>
    ))}
  </div>
);

const BannerSkeleton = () => (
  <div className="px-5 py-3">
    <div className="w-full h-40 store-skeleton rounded-store-lg" />
  </div>
);

const ProductGridSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 px-5">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="bg-white rounded-store overflow-hidden shadow-store-sm">
        <div className="h-[140px] store-skeleton rounded-none" />
        <div className="p-3 space-y-2">
          <div className="h-3 store-skeleton w-3/4" />
          <div className="h-2.5 store-skeleton w-1/2" />
          <div className="h-4 store-skeleton w-1/3" />
          <div className="h-8 store-skeleton w-full mt-2" />
        </div>
      </div>
    ))}
  </div>
);

const HorizontalSkeleton = () => (
  <div className="flex gap-3 px-5 overflow-x-hidden pb-2">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="shrink-0 w-[150px] bg-white rounded-store overflow-hidden shadow-store-sm">
        <div className="h-[130px] store-skeleton rounded-none" />
        <div className="p-3 space-y-2">
          <div className="h-3 store-skeleton w-3/4" />
          <div className="h-4 store-skeleton w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

/* ═══════════════════════════════════════════
   PRODUCT CARD COMPONENT
   ═══════════════════════════════════════════ */
const ProductCard = ({ product, onAddToCart, onNavigate, variant = 'grid', isWishlisted, onToggleWishlist }) => {
  const isOutOfStock = !product.inStock || product.stock <= 0;
  const discount = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  const isNew = product.featuredSection === 'newly_launch';

  if (variant === 'horizontal') {
    return (
      <div
        onClick={() => onNavigate(product._id || product.id)}
        className="shrink-0 w-[145px] bg-white rounded-store overflow-hidden shadow-store-sm border border-store-border/60 store-card cursor-pointer group flex flex-col"
      >
        <div className="h-[120px] bg-store-surface/50 relative overflow-hidden flex items-center justify-center">
          {(product.image || product.img) ? (
            <img
              src={product.image || product.img}
              alt={product.name}
              className={`w-full h-full object-cover store-img-zoom ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-store-surface rounded-lg">
              <span className="text-3xl">📦</span>
            </div>
          )}
          
          {/* Badge Stack */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 items-start">
            {isNew && (
              <span className="bg-store-text text-white text-[7.5px] font-black tracking-wider px-1.5 py-0.5 rounded-md shadow-sm uppercase leading-none">
                NEW
              </span>
            )}
            {discount > 0 && (
              <span className="bg-red-500 text-white text-[7.5px] font-black px-1.5 py-0.5 rounded-md shadow-sm leading-none">
                {discount}% OFF
              </span>
            )}
          </div>

          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px] flex items-center justify-center">
              <span className="text-white text-[9px] font-extrabold bg-black/60 px-2.5 py-0.5 rounded-full">Out of Stock</span>
            </div>
          )}
          {/* Wishlist Heart */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleWishlist(product._id || product.id); }}
            className="absolute top-2 right-2 w-6 h-6 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
          >
            <FiHeart size={11} className={`transition-colors ${isWishlisted ? 'text-red-500 fill-red-500' : 'text-store-muted hover:text-red-500'}`} />
          </button>
        </div>
        <div className="p-2 flex flex-col flex-1 justify-between bg-white border-t border-store-border/30">
          <div>
            <h4 className="text-[11.5px] font-bold text-store-text line-clamp-1 mb-0.5">{product.name}</h4>
            <div className="flex items-center gap-0.5 mb-1.5">
              <FiStar size={10} className="text-amber-400 fill-amber-400" />
              <span className="text-[10px] font-bold text-store-subtitle">{product.rating || '4.5'}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[13px] font-extrabold text-store-text">₹{product.price}</span>
              {product.originalPrice && (
                <span className="text-[9.5px] text-store-muted line-through">₹{product.originalPrice}</span>
              )}
            </div>
            {!isOutOfStock && (
              <button
                onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                className="w-6.5 h-6.5 rounded-full bg-store-text text-white flex items-center justify-center hover:bg-gray-800 active:scale-90 transition-all shadow-sm"
                style={{ width: '26px', height: '26px', fontSize: '15px', fontWeight: 'bold' }}
              >
                +
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid variant
  return (
    <div
      onClick={() => onNavigate(product._id || product.id)}
      className="bg-white rounded-store overflow-hidden shadow-store-sm border border-store-border/50 store-card cursor-pointer group flex flex-col"
    >
      <div className="h-[135px] bg-store-surface/50 relative overflow-hidden flex items-center justify-center">
        {(product.image || product.img) ? (
          <img
            src={product.image || product.img}
            alt={product.name}
            className={`w-full h-full object-cover store-img-zoom ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-store-surface rounded-xl">
            <span className="text-4xl">📦</span>
          </div>
        )}

        {/* Badge Stack */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 items-start">
          {isNew && (
            <span className="bg-store-text text-white text-[8px] font-black tracking-wider px-2 py-0.5 rounded-md shadow-sm uppercase leading-none">
              NEW
            </span>
          )}
          {discount > 0 && (
            <span className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-md shadow-sm leading-none">
              {discount}% OFF
            </span>
          )}
        </div>

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px] flex items-center justify-center">
            <span className="text-white text-[10px] font-bold bg-black/60 px-3 py-1 rounded-full">Out of Stock</span>
          </div>
        )}
        {/* Wishlist Heart */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleWishlist(product._id || product.id); }}
          className="absolute top-2.5 right-2.5 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
        >
          <FiHeart size={13} className={`transition-colors ${isWishlisted ? 'text-red-500 fill-red-500' : 'text-store-muted hover:text-red-500'}`} />
        </button>
      </div>
      <div className="p-3 flex flex-col flex-1 justify-between bg-white border-t border-store-border/30">
        <div>
          <h4 className="text-[12.5px] font-bold text-store-text line-clamp-2 mb-1 leading-tight min-h-[34px]">{product.name}</h4>
          <div className="flex items-center gap-1.5 mb-2.5">
            <div className="flex items-center gap-0.5 bg-green-50 px-1.5 py-0.5 rounded">
              <FiStar size={9.5} className="text-green-600 fill-green-600" />
              <span className="text-[10px] font-extrabold text-green-700">{product.rating || '4.5'}</span>
            </div>
            <span className="text-[10.5px] text-store-muted font-medium">({product.reviews || 0})</span>
          </div>
        </div>
        <div className="mt-auto">
          <div className="flex items-baseline gap-1.5 mb-2.5">
            <span className="text-[15.5px] font-extrabold text-store-text">₹{product.price}</span>
            {product.originalPrice && (
              <span className="text-[11px] text-store-muted line-through font-medium">₹{product.originalPrice}</span>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); if (!isOutOfStock) onAddToCart(product); }}
            disabled={isOutOfStock}
            className={`w-full font-bold text-[12px] py-2.5 rounded-xl transition-all ${
              isOutOfStock
                ? 'bg-store-surface text-store-muted/60 cursor-not-allowed border border-store-border'
                : 'bg-store-text text-white hover:bg-gray-800 active:scale-[0.97] shadow-store-sm'
            }`}
          >
            {isOutOfStock ? 'Out of Stock' : 'Add to Bag'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   SECTION HEADER COMPONENT
   ═══════════════════════════════════════════ */
const SectionHeader = ({ title, subtitle, onViewAll, icon }) => (
  <div className="flex items-center justify-between mb-3.5">
    <div className="flex items-center gap-2">
      {icon && <span className="text-lg">{icon}</span>}
      <div>
        <h2 className="text-[15px] font-extrabold text-store-text leading-tight">{title}</h2>
        {subtitle && <p className="text-[11px] text-store-muted font-medium mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {onViewAll && (
      <button
        onClick={onViewAll}
        className="flex items-center gap-0.5 text-[11.5px] text-[#fa6830] font-bold hover:text-[#e55923] transition-colors"
      >
        View All
        <FiChevronRight size={14} strokeWidth={2.5} />
      </button>
    )}
  </div>
);

/* ═══════════════════════════════════════════
   MAIN STORE PAGE
   ═══════════════════════════════════════════ */
const Store = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [searchQuery, setSearchQuery] = useState(location.state?.category || '');
  const [activeFilterSection, setActiveFilterSection] = useState('none'); // 'none', 'top_selling', 'newly_launch', 'all'
  const [panditSearchQuery, setPanditSearchQuery] = useState('');
  const { user } = useSelector((state) => state.auth);
  const { cart } = useSelector((state) => state.cart);
  const { appName } = useSelector((state) => state.settings) || { appName: 'JyotishLink' };
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { openSidebar } = useOutletContext() || {};

  // Reset filter when search or tabs change
  useEffect(() => {
    setActiveFilterSection('none');
  }, [searchQuery, activeTab]);

  // Local state for products, pandits and loading state
  const [products, setProducts] = useState([]);
  const [topSellingProducts, setTopSellingProducts] = useState([]);
  const [newLaunchProducts, setNewLaunchProducts] = useState([]);
  const [storeCategories, setStoreCategories] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [banners, setBanners] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const scrollRef = useRef(null);

  const handleToggleWishlist = async (productId) => {
    try {
      const res = await toggleWishlist(productId);
      const isAdded = res.data?.data?.isAdded;
      if (isAdded) {
        setWishlist(prev => [...prev, productId]);
        toast.success('Added to wishlist');
      } else {
        setWishlist(prev => prev.filter(id => id !== productId));
        toast.success('Removed from wishlist');
      }
    } catch (err) {
      toast.error('Failed to update wishlist');
    }
  };

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
        const [productsRes, panditsRes, wishlistRes] = await Promise.allSettled([
          getStoreProducts(),
          getStorePandits(),
          getWishlist()
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
          if (wishlistRes.status === 'fulfilled' && wishlistRes.value?.data) {
            const rawData = wishlistRes.value.data;
            const data = rawData.data || rawData;
            const fetchedWishlist = data.wishlist?.products?.map(p => typeof p === 'object' ? p._id : p) || [];
            setWishlist(fetchedWishlist);
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
      toast.success('Added to bag!', { icon: '🛍️', style: { borderRadius: '12px', fontWeight: 600 } });
    } catch (err) {
      toast.error(err.message || 'Failed to add to bag');
    }
  };

  const cartItemCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  const handleProductNavigate = (id) => {
    navigate(`/user/product/${id}`);
  };

  return (
    <div className="w-full bg-store-bg min-h-screen pb-24 font-sans relative">
      {/* ═══ TOP APP BAR ═══ */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-white sticky top-0 z-30 shadow-store-sm">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => openSidebar && openSidebar()} 
            className="w-9 h-9 bg-store-surface rounded-full flex items-center justify-center overflow-hidden border border-store-border cursor-pointer"
          >
            <span className="text-store-text font-bold text-sm">{(user?.name || 'G')[0]}</span>
          </div>
          <div>
            <span className="text-store-text font-bold text-[17px] block leading-tight">{appName}</span>
            <span className="text-store-muted text-[11px] font-medium">Spiritual Store</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/user/search')}
            className="w-9 h-9 bg-store-surface rounded-full flex items-center justify-center hover:bg-store-border transition-colors"
          >
            <FiSearch size={17} className="text-store-text" />
          </button>
          <button
            onClick={() => navigate('/user/cart')}
            className="w-9 h-9 bg-store-surface rounded-full flex items-center justify-center hover:bg-store-border transition-colors relative"
          >
            <FiShoppingBag size={17} className="text-store-text" />
            {cartItemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] bg-[#fa6830] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white badge-bounce">
                {cartItemCount > 9 ? '9+' : cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="flex bg-white px-5 border-b border-store-border">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-[13px] font-bold transition-all relative ${
              activeTab === tab ? 'text-store-text' : 'text-store-muted'
            }`}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-4 right-4 h-[2.5px] bg-[#fa6830] rounded-full" />}
          </button>
        ))}
      </div>

      {activeTab === tabs[0] ? (
        <>
          {/* ═══ SEARCH BAR ═══ */}
          <div className="px-5 py-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products, gemstones, rudraksha..."
                className="w-full bg-white border border-store-border rounded-store py-3 px-4 pr-10 text-[13px] outline-none focus:border-orange-400 focus:shadow-[0_0_0_3px_rgba(255,140,0,0.08)] transition-all text-store-text placeholder:text-store-muted"
              />
              <FiSearch className="absolute right-3.5 top-1/2 -translate-y-1/2 text-store-muted" size={17} />
            </div>
          </div>

          {activeFilterSection !== 'none' ? (
            /* ═══ FILTERED SECTION VIEW ═══ */
            <div className="px-5 py-4 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <button 
                  onClick={() => setActiveFilterSection('none')}
                  className="w-10 h-10 bg-white border border-store-border text-store-text rounded-xl flex items-center justify-center transition-all active:scale-95 hover:bg-store-surface"
                >
                  <FiArrowLeft size={18} />
                </button>
                <div>
                  <h2 className="text-[16px] font-extrabold text-store-text leading-tight">
                    {activeFilterSection === 'top_selling' ? 'Top Selling Products' : 
                     activeFilterSection === 'newly_launch' ? 'New Arrivals' : 'All Products'}
                  </h2>
                  <p className="text-[11px] text-store-muted font-medium mt-0.5">
                    {activeFilterSection === 'top_selling' ? 'Our most popular and highly-rated products' : 
                     activeFilterSection === 'newly_launch' ? 'Fresh additions to help your spiritual journey' : 'Browse our entire collection'}
                  </p>
                </div>
              </div>

              {loading ? (
                <ProductGridSkeleton />
              ) : (activeFilterSection === 'top_selling' ? topSellingProducts : 
                   activeFilterSection === 'newly_launch' ? newLaunchProducts : products).length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 store-stagger">
                  {(activeFilterSection === 'top_selling' ? topSellingProducts : 
                    activeFilterSection === 'newly_launch' ? newLaunchProducts : products).map((product, i) => (
                    <ProductCard
                      key={product._id || product.id || i}
                      product={product}
                      onAddToCart={handleAddToCart}
                      onNavigate={handleProductNavigate}
                      isWishlisted={wishlist.includes(product._id || product.id)}
                      onToggleWishlist={handleToggleWishlist}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-store-surface rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">📦</span>
                  </div>
                  <h3 className="text-[16px] font-bold text-store-text mb-1">No products found</h3>
                </div>
              )}
            </div>
          ) : searchQuery ? (
            /* ═══ SEARCH RESULTS ═══ */
            <div className="px-5 py-4 store-stagger">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[16px] font-bold text-store-text">
                  Results for "{searchQuery}"
                  <span className="text-store-muted font-medium text-[13px] ml-2">({filteredProducts.length})</span>
                </h2>
                <button onClick={() => setSearchQuery('')} className="text-[12px] text-[#fa6830] font-semibold">Clear</button>
              </div>
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 store-stagger">
                  {filteredProducts.map((product, i) => (
                    <ProductCard
                      key={product._id || product.id || i}
                      product={product}
                      onAddToCart={handleAddToCart}
                      onNavigate={handleProductNavigate}
                      isWishlisted={wishlist.includes(product._id || product.id)}
                      onToggleWishlist={handleToggleWishlist}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-store-surface rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">🔍</span>
                  </div>
                  <h3 className="text-[16px] font-bold text-store-text mb-1">No products found</h3>
                  <p className="text-[13px] text-store-muted">Try a different search term</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* ═══ CATEGORIES CHIPS ═══ */}
              {loading ? (
                <CategorySkeleton />
              ) : storeCategories.length > 0 && (
                <div className="flex gap-3 px-5 py-4 overflow-x-auto no-scrollbar">
                  {storeCategories.map((cat, i) => (
                    <div 
                      key={i} 
                      onClick={() => { setSearchQuery(cat.name); setActiveFilterSection('none'); }}
                      className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
                    >
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white border-2 border-store-border shadow-store-sm group-hover:border-orange-300 group-hover:shadow-store transition-all group-active:scale-90">
                        <img src={cat.img} alt={cat.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] text-store-subtitle font-semibold whitespace-nowrap max-w-[60px] truncate text-center group-hover:text-[#fa6830] transition-colors">{cat.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ═══ BANNER CAROUSEL ═══ */}
              {loading ? (
                <BannerSkeleton />
              ) : banners.length > 0 && (
                <div className="py-2">
                  <div 
                    ref={scrollRef}
                    onScroll={handleBannerScroll}
                    className="px-5 flex gap-3.5 overflow-x-auto no-scrollbar snap-x snap-mandatory"
                  >
                    {banners.map((banner, i) => (
                      <div 
                        key={banner._id || i} 
                        className="w-[85vw] sm:w-[340px] h-[155px] shrink-0 snap-center bg-store-surface rounded-store-lg relative overflow-hidden shadow-store cursor-pointer store-card"
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
                  
                  {/* Pagination Dots */}
                  {banners.length > 1 && (
                    <div className="flex justify-center gap-1.5 mt-3">
                      {banners.map((_, idx) => (
                        <div 
                          key={idx} 
                          className={`h-[4px] rounded-full transition-all duration-300 ${currentBannerIndex === idx ? 'w-5 bg-[#fa6830]' : 'w-1.5 bg-[#fa6830]/25'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ═══ FLASH SALE / TOP SELLING ═══ */}
              {loading ? (
                <div className="px-5 py-4">
                  <div className="h-4 store-skeleton w-32 mb-4" />
                  <HorizontalSkeleton />
                </div>
              ) : topSellingProducts.length > 0 && (
                <div className="py-4">
                  <div className="px-5">
                    <SectionHeader
                      title="Top Selling"
                      subtitle="Most popular products"
                      icon="🔥"
                      onViewAll={() => setActiveFilterSection('top_selling')}
                    />
                  </div>
                  <div className="flex gap-3 px-5 overflow-x-auto no-scrollbar pb-2">
                    {topSellingProducts.map((p, i) => (
                      <ProductCard
                        key={p._id || i}
                        product={p}
                        variant="horizontal"
                        onAddToCart={handleAddToCart}
                        onNavigate={handleProductNavigate}
                        isWishlisted={wishlist.includes(p._id || p.id)}
                        onToggleWishlist={handleToggleWishlist}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ═══ NEWLY LAUNCHED ═══ */}
              {loading ? (
                <div className="px-5 py-4">
                  <div className="h-4 store-skeleton w-32 mb-4" />
                  <HorizontalSkeleton />
                </div>
              ) : newLaunchProducts.length > 0 && (
                <div className="py-4">
                  <div className="px-5">
                    <SectionHeader
                      title="New Arrivals"
                      subtitle="Freshly added to the store"
                      icon="✨"
                      onViewAll={() => setActiveFilterSection('newly_launch')}
                    />
                  </div>
                  <div className="flex gap-3 px-5 overflow-x-auto no-scrollbar pb-2">
                    {newLaunchProducts.map((p, i) => (
                      <ProductCard
                        key={p._id || i}
                        product={p}
                        variant="horizontal"
                        onAddToCart={handleAddToCart}
                        onNavigate={handleProductNavigate}
                        isWishlisted={wishlist.includes(p._id || p.id)}
                        onToggleWishlist={handleToggleWishlist}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ═══ ALL PRODUCTS GRID ═══ */}
              <div className="px-5 py-4">
                <SectionHeader
                  title="All Products"
                  subtitle={`${products.length} items available`}
                  icon="🛍️"
                  onViewAll={() => setActiveFilterSection('all')}
                />
                {loading ? (
                  <ProductGridSkeleton />
                ) : products.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 store-stagger">
                    {products.map((product, i) => (
                      <ProductCard
                        key={product._id || product.id || i}
                        product={product}
                        onAddToCart={handleAddToCart}
                        onNavigate={handleProductNavigate}
                        isWishlisted={wishlist.includes(product._id || product.id)}
                        onToggleWishlist={handleToggleWishlist}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-store-surface rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl">📦</span>
                    </div>
                    <h3 className="text-[16px] font-bold text-store-text mb-1">No products yet</h3>
                    <p className="text-[13px] text-store-muted">Check back soon for new additions!</p>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      ) : (
        /* ═══ PANDIT BOOKING TAB ═══ */
        <div className="bg-store-bg min-h-screen">
          
          {/* SEARCH PANDIT */}
          <div className="bg-white px-5 py-3 shadow-store-sm mb-1">
            <div className="relative">
              <input
                type="text"
                value={panditSearchQuery}
                onChange={(e) => setPanditSearchQuery(e.target.value)}
                placeholder="Search pandit by name..."
                className="w-full bg-store-surface border border-store-border rounded-store py-3 px-4 pr-10 text-[13px] outline-none focus:border-orange-400 transition-all text-store-text placeholder:text-store-muted"
              />
              <FiSearch className="absolute right-3.5 top-1/2 -translate-y-1/2 text-store-muted" size={17} />
            </div>
          </div>

          {/* Pooja Selector */}
          <div className="bg-white px-5 py-4 mb-2 shadow-store-sm">
            <h2 className="text-[15px] font-bold text-store-text mb-3">Select Pooja</h2>
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {poojaTypes.map((pooja) => (
                <button
                  key={pooja}
                  onClick={() => setSelectedPooja(pooja)}
                  className={`shrink-0 px-4 py-2 rounded-full text-[12px] font-bold transition-all ${
                    selectedPooja === pooja
                      ? 'bg-store-text text-white shadow-store-sm'
                      : 'bg-store-surface text-store-subtitle border border-store-border hover:border-store-muted'
                  }`}
                >
                  {pooja}
                </button>
              ))}
            </div>
          </div>

          {/* Pandits List */}
          <div className="px-5 py-4 space-y-3">
            <h2 className="text-[15px] font-bold text-store-text mb-1">Available Pandits for {selectedPooja}</h2>
            {filteredPandits.map((pandit, idx) => (
              <div key={pandit.id || pandit._id || idx} className="bg-white rounded-store p-4 shadow-store store-card flex flex-col gap-3">
                <div className="flex gap-3 items-center">
                  <div className="w-14 h-14 rounded-2xl border-2 border-store-border overflow-hidden shrink-0">
                    <img src={pandit.avatar || pandit.image || pandit.img} alt={pandit.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[15px] font-bold text-store-text leading-tight">{pandit.name}</h3>
                    <p className="text-[12px] text-store-muted font-medium mb-1">Exp: {pandit.experience || 0} Years</p>
                    <div className="flex items-center gap-1">
                      <FiStar size={11} className="text-amber-400 fill-amber-400" />
                      <span className="text-[11px] font-bold text-store-subtitle">{pandit.rating}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-store-muted font-medium mb-0.5">Starting at</p>
                    <p className="text-[18px] font-bold text-store-text leading-none">
                      ₹{pandit.poojasOffered?.find(p => p.poojaName === selectedPooja)?.price || pandit.pricing?.chat || pandit.price || 500}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => navigate(`/user/pooja-booking/${pandit.id || pandit._id}`, { state: { pandit, pooja: selectedPooja, price: pandit.poojasOffered?.find(p => p.poojaName === selectedPooja)?.price || 500 } })}
                  className="w-full bg-store-text text-white font-bold py-3 rounded-xl text-[13px] hover:bg-gray-800 active:scale-[0.98] transition-all shadow-store-sm"
                >
                  Book Now
                </button>
              </div>
            ))}
            
            {filteredPandits.length === 0 && (
              <div className="text-center py-14">
                <div className="w-16 h-16 bg-store-surface rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">🕉️</span>
                </div>
                <p className="text-store-muted font-semibold text-[14px]">No Pandits available for this Pooja right now.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Store;
