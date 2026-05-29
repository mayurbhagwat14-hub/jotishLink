import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiClock, FiShoppingBag } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { getStoreProducts, getStorePandits } from '../../api/userApis';

const tabs = ['Astro Mall', 'Pandit Booking'];

const poojaTypes = [
  'Navagraha Shanti', 'Vastu Shanti', 'Satyanarayan', 'Marriage Pooja', 'Maha Mrityunjaya'
];

const availablePandits = [
  { id: 1, name: 'Pandit Ravi Sharma', img: 'https://i.pravatar.cc/150?u=pandit1', experience: '15 Years', rating: 4.9, price: 1100, poojas: ['Navagraha Shanti', 'Vastu Shanti', 'Satyanarayan'] },
  { id: 2, name: 'Acharya Vinod', img: 'https://i.pravatar.cc/150?u=pandit2', experience: '8 Years', rating: 4.7, price: 800, poojas: ['Satyanarayan', 'Marriage Pooja'] },
  { id: 3, name: 'Pandit Kedar Nath', img: 'https://i.pravatar.cc/150?u=pandit3', experience: '20 Years', rating: 5.0, price: 2100, poojas: ['Navagraha Shanti', 'Maha Mrityunjaya'] },
  { id: 4, name: 'Shastri Ramdas', img: 'https://i.pravatar.cc/150?u=pandit4', experience: '12 Years', rating: 4.8, price: 1500, poojas: ['Vastu Shanti', 'Marriage Pooja', 'Maha Mrityunjaya'] },
  { id: 5, name: 'Pandit Dinesh', img: 'https://i.pravatar.cc/150?u=pandit5', experience: '5 Years', rating: 4.5, price: 500, poojas: ['Satyanarayan', 'Navagraha Shanti'] },
];

const storeCategories = [
  { name: 'Bracelets', img: '/store_bracelet.png' },
  { name: 'Rudraksha', img: '/store_rudraksha.png' },
  { name: 'Gemstones', img: '/store_gemstone.png' },
  { name: 'Lal Kitab', img: '/store_spell.png' },
];

const topSellingProducts = [
  { name: 'VIP Pooja', img: '/store_puja.png', badge: 'VIP' },
  { name: 'Palmistry', img: '/store_palmistry.png' },
  { name: 'Spell', img: '/store_spell.png' },
  { name: 'Love Sp...', img: '/store_healing.png' },
];

const newLaunchProducts = [
  { name: 'Gemstone', img: '/store_gemstone.png' },
  { name: 'Reiki Healing', img: '/store_reiki.png' },
  { name: 'Evil Eye', img: '/store_evileye.png' },
  { name: 'Love Sp...', img: '/store_healing.png' },
];

const allProducts = [
  { name: 'Raw Pyrite Bracelet', rating: 4.5, reviews: 2756, price: 399, originalPrice: 899, discount: '56% Off', img: '/store_bracelet.png' },
  { name: 'Pyrite Bracelet', rating: 4.6, reviews: 1890, price: 499, originalPrice: 1299, discount: '62% Off', img: '/store_rudraksha.png' },
  { name: 'Raw Pyrite Bracelet', rating: 4.3, reviews: 3120, price: 399, originalPrice: 899, discount: '56% Off', img: '/store_gemstone.png' },
  { name: 'Raw Pyrite Bracelet', rating: 4.8, reviews: 980, price: 299, originalPrice: 799, discount: '63% Off', img: '/store_bracelet.png' },
];

// poojaItems is commented out to satisfy ESLint rules
/*
const poojaItems = [
  { name: 'Palmistry', price: 'Starts at ₹ 499', color: 'bg-orange-500' },
  { name: 'Spell', price: 'Starts at ₹ 199', color: 'bg-orange-500' },
  { name: 'Reiki Healing', price: 'Starts at ₹ 799', color: 'bg-orange-400' },
  { name: 'E Pooja', price: 'Starts at ₹ 599', color: 'bg-orange-500' },
  { name: 'VIP E Pooja', price: 'Starts at ₹ 1199', color: 'bg-orange-400' },
  { name: 'Free Gemstone Consultation', price: 'Starts at ₹ 199', color: 'bg-orange-500' },
  { name: 'Relationship', price: 'Starts at ₹ 499', color: 'bg-orange-400' },
  { name: 'Evil Eye Removal (Buri Nazar Nivaran)', price: 'Starts at ₹ 399', color: 'bg-orange-500' },
];
*/

const Store = () => {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [selectedPooja, setSelectedPooja] = useState(poojaTypes[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [panditSearchQuery, setPanditSearchQuery] = useState('');
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // Local state for products, pandits and loading state
  const reduxProducts = useSelector((state) => state.payment?.products) || [];
  const [products, setProducts] = useState(() => {
    // Merge allProducts with Redux products, deduplicated by name
    const merged = [...allProducts];
    reduxProducts.forEach(rp => {
      if (!merged.some(p => p.name === rp.name)) {
        merged.push(rp);
      }
    });
    return merged;
  });
  const [pandits, setPandits] = useState(availablePandits);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
            const data = productsRes.value.data;
            const fetchedProducts = Array.isArray(data) ? data : (data.products || []);
            if (fetchedProducts.length > 0) {
              setProducts(fetchedProducts);
            }
          }
          if (panditsRes.status === 'fulfilled' && panditsRes.value?.data) {
            const data = panditsRes.value.data;
            const fetchedPandits = Array.isArray(data) ? data : (data.pandits || []);
            if (fetchedPandits.length > 0) {
              setPandits(fetchedPandits);
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
    return () => {
      active = false;
    };
  }, []);

  const filteredPandits = (pandits || []).filter(p => 
    p &&
    Array.isArray(p.poojas) && p.poojas.includes(selectedPooja) && 
    typeof p.name === 'string' && p.name.toLowerCase().includes(panditSearchQuery.toLowerCase())
  );
  const filteredProducts = (products || []).filter(p => 
    p &&
    typeof p.name === 'string' && p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <button className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center hover:bg-orange-100 transition-colors">
            <FiShoppingBag size={16} className="text-orange-500" />
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
                    <div key={product.id || product._id || i} className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden cursor-pointer hover:shadow-card-hover transition-shadow">
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
                        <button className="w-full border-2 border-orange-500 text-orange-500 font-bold text-[12px] py-1.5 rounded-xl hover:bg-orange-50 active:scale-95 transition-all">
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
              <div className="px-4 py-3">
                <div className="w-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-5 relative overflow-hidden shadow-lg">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                  <p className="text-white/80 text-[11px] font-bold tracking-widest mb-1">2025</p>
                  <h3 className="text-white font-bold text-[18px] leading-tight mb-1">Navya Mahakundali</h3>
                  <p className="text-white/80 text-[12px] mb-3">Premium Collection</p>
                  <button className="bg-white text-orange-600 text-[12px] font-bold px-4 py-1.5 rounded-full shadow-sm">Book Now</button>
                </div>
              </div>

              {/* ═══ TOP SELLING ═══ */}
              <div className="px-4 py-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-[16px] font-bold text-gray-800">Top Selling</h2>
                  <span className="text-[12px] text-orange-500 font-semibold cursor-pointer">View All</span>
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar">
                  {topSellingProducts.map((p, i) => (
                    <div key={i} className="shrink-0 flex flex-col items-center gap-1.5 w-[72px] cursor-pointer group">
                      <div className="w-[64px] h-[64px] rounded-full overflow-hidden border-2 border-orange-100 bg-orange-50 group-hover:border-orange-300 transition-colors">
                        <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] text-gray-600 font-semibold text-center leading-tight">{p.name}</span>
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
                    <div key={i} className="shrink-0 flex flex-col items-center gap-1.5 w-[72px] cursor-pointer group">
                      <div className="w-[64px] h-[64px] rounded-full overflow-hidden border-2 border-orange-100 bg-orange-50 group-hover:border-orange-300 transition-colors">
                        <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] text-gray-600 font-semibold text-center leading-tight">{p.name}</span>
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
                    <div key={product.id || product._id || i} className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden cursor-pointer hover:shadow-card-hover transition-shadow">
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
                        <button className="w-full border-2 border-orange-500 text-orange-500 font-bold text-[12px] py-1.5 rounded-xl hover:bg-orange-50 active:scale-95 transition-all">
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
                    <p className="text-[13px] text-gray-500 font-medium mb-1">Exp: {pandit.experience}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-orange-500 text-[12px]">★</span>
                      <span className="text-[12px] font-bold text-gray-700">{pandit.rating}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-gray-400 font-semibold mb-0.5">Starting at</p>
                    <p className="text-[18px] font-bold text-gray-900 leading-none">₹{pandit.price}</p>
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
