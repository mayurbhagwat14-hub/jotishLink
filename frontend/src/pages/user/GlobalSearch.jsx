import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiArrowLeft, FiSearch } from 'react-icons/fi';
import { getAstrologers, getStoreProducts } from '../../api/userApis';

const GlobalSearch = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const navigate = useNavigate();

  const [astrologers, setAstrologers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debounce the search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) {
      setAstrologers([]);
      setProducts([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [astroRes, prodRes] = await Promise.all([
          getAstrologers({ search: debouncedQuery }),
          getStoreProducts() // this fetches all, we will filter locally
        ]);

        if (astroRes.data?.success) {
          setAstrologers(astroRes.data.data.astrologers || []);
        }

        if (prodRes.data?.success) {
          const rawData = prodRes.data.data;
          const allProducts = Array.isArray(rawData) ? rawData : (rawData.products || []);
          const lowerQuery = debouncedQuery.toLowerCase();
          const filteredProds = allProducts.filter(p => 
            p.name?.toLowerCase().includes(lowerQuery) || 
            p.category?.toLowerCase().includes(lowerQuery)
          );
          setProducts(filteredProds);
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [debouncedQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/user/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-20 font-sans">
      {/* ═══ TOP NAVBAR ═══ */}
      <div className="bg-white sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="text-gray-800 hover:bg-gray-100 p-1.5 rounded-full transition-colors">
            <FiArrowLeft size={20} />
          </button>
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search astrologers, products..."
              className="w-full bg-gray-100 border border-transparent focus:border-orange-300 rounded-xl py-2 px-4 pr-10 text-[14px] outline-none transition-all"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-400">
              <FiSearch size={18} />
            </button>
          </form>
        </div>
      </div>

      {/* ═══ RESULTS ═══ */}
      <div className="p-4 space-y-6">
        {loading && (
          <div className="text-center text-gray-400 py-8">Searching...</div>
        )}

        {!loading && debouncedQuery && astrologers.length === 0 && products.length === 0 && (
          <div className="text-center text-gray-500 py-8 font-medium">
            No results found for "{debouncedQuery}"
          </div>
        )}

        {/* Astrologers Section */}
        {!loading && astrologers.length > 0 && (
          <div>
            <h2 className="text-[16px] font-bold text-gray-800 mb-3 border-b pb-2">Astrologers ({astrologers.length})</h2>
            <div className="flex flex-col gap-3">
              {astrologers.map((astro) => (
                <div 
                  key={astro._id} 
                  onClick={() => navigate('/user/astrologers')}
                  className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="w-14 h-14 rounded-full border-2 border-orange-200 overflow-hidden shrink-0">
                    <img src={astro.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(astro.name)}&background=ffedD5&color=f97316`} alt={astro.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 text-[15px] line-clamp-1">{astro.name}</h3>
                    <p className="text-[12px] text-gray-500 truncate">{astro.skills?.join(', ') || 'Astrologer'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[14px] font-bold text-gray-900">₹{astro.pricing?.chat || astro.rate || 5}/min</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products Section */}
        {!loading && products.length > 0 && (
          <div>
            <h2 className="text-[16px] font-bold text-gray-800 mb-3 border-b pb-2">Products ({products.length})</h2>
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => (
                <div 
                  key={product._id} 
                  onClick={() => navigate(`/user/product/${product._id || product.id}`)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="h-[120px] bg-orange-50 overflow-hidden relative">
                    <img src={product.image || product.img} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3 flex-1 flex flex-col">
                    <h4 className="text-[13px] font-semibold text-gray-800 line-clamp-1 mb-1">{product.name}</h4>
                    <div className="mt-auto flex items-center gap-2">
                      <span className="text-[14px] font-bold text-gray-900">₹{product.price}</span>
                      <span className="text-orange-400 text-[11px]">★ {product.rating || '5.0'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalSearch;
