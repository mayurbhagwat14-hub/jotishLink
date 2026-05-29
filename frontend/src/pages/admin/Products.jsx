import { useState } from 'react';
import { FiSearch, FiPlus, FiEdit, FiTrash2, FiChevronDown, FiChevronLeft, FiChevronRight, FiBox, FiImage, FiToggleLeft, FiToggleRight, FiX, FiFilter, FiMoreHorizontal } from 'react-icons/fi';
import AdminFilterDropdown from '../../components/AdminFilterDropdown';

const AdminProducts = () => {
  const [activeTab, setActiveTab] = useState('All Products');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const itemsPerPage = 8;

  const products = [
    { id: 1, name: 'Raw Pyrite Bracelet', category: 'Bracelets', price: 399, originalPrice: 899, discount: '56%', stock: 45, status: 'Active', img: '/store_bracelet.png', rating: 4.5, reviews: 2756, sku: 'BRC-001' },
    { id: 2, name: 'Pyrite Premium Bracelet', category: 'Bracelets', price: 499, originalPrice: 1299, discount: '62%', stock: 22, status: 'Active', img: '/store_rudraksha.png', rating: 4.6, reviews: 1890, sku: 'BRC-002' },
    { id: 3, name: '5 Mukhi Rudraksha Mala', category: 'Rudraksha', price: 799, originalPrice: 1499, discount: '47%', stock: 8, status: 'Active', img: '/store_rudraksha.png', rating: 4.8, reviews: 980, sku: 'RUD-001' },
    { id: 4, name: 'Yellow Sapphire Ring', category: 'Gemstones', price: 1299, originalPrice: 2999, discount: '57%', stock: 3, status: 'Active', img: '/store_gemstone.png', rating: 4.9, reviews: 456, sku: 'GEM-001' },
    { id: 5, name: 'Tiger Eye Bracelet', category: 'Bracelets', price: 349, originalPrice: 699, discount: '50%', stock: 0, status: 'Out of Stock', img: '/store_bracelet.png', rating: 4.3, reviews: 3120, sku: 'BRC-003' },
    { id: 6, name: 'Neelam Stone (Blue Sapphire)', category: 'Gemstones', price: 2499, originalPrice: 4999, discount: '50%', stock: 12, status: 'Active', img: '/store_gemstone.png', rating: 4.7, reviews: 234, sku: 'GEM-002' },
    { id: 7, name: 'Rudraksha Pendant 7 Mukhi', category: 'Rudraksha', price: 1199, originalPrice: 2299, discount: '48%', stock: 15, status: 'Draft', img: '/store_rudraksha.png', rating: 0, reviews: 0, sku: 'RUD-002' },
    { id: 8, name: 'Evil Eye Protection Bracelet', category: 'Lal Kitab', price: 299, originalPrice: 599, discount: '50%', stock: 60, status: 'Active', img: '/store_evileye.png', rating: 4.4, reviews: 1567, sku: 'LKB-001' },
    { id: 9, name: 'Reiki Healing Stones Set', category: 'Lal Kitab', price: 599, originalPrice: 1199, discount: '50%', stock: 18, status: 'Active', img: '/store_reiki.png', rating: 4.2, reviews: 890, sku: 'LKB-002' },
    { id: 10, name: 'Emerald (Panna) Natural', category: 'Gemstones', price: 3499, originalPrice: 6999, discount: '50%', stock: 5, status: 'Active', img: '/store_gemstone.png', rating: 4.8, reviews: 145, sku: 'GEM-003' },
  ];

  const categories = ['All', 'Bracelets', 'Rudraksha', 'Gemstones', 'Lal Kitab'];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesTab = activeTab === 'All Products' ||
      (activeTab === 'Active' && p.status === 'Active') ||
      (activeTab === 'Draft' && p.status === 'Draft') ||
      (activeTab === 'Out of Stock' && p.status === 'Out of Stock');
    return matchesSearch && matchesCategory && matchesTab;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelectAll = () => {
    setSelectedProducts(selectedProducts.length === paginatedProducts.length ? [] : paginatedProducts.map(p => p.id));
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-50 text-green-600';
      case 'Draft': return 'bg-gray-100 text-gray-500';
      case 'Out of Stock': return 'bg-red-50 text-red-500';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const getStockColor = (stock) => {
    if (stock === 0) return 'text-red-500';
    if (stock <= 10) return 'text-orange-500';
    return 'text-gray-900';
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">Manage your store product catalog, pricing, and stock</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-sm shadow-orange-500/20 transition-all"
        >
          <FiPlus size={16} /> Add Product
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: products.length, color: 'blue' },
          { label: 'Active', value: products.filter(p => p.status === 'Active').length, color: 'green' },
          { label: 'Low Stock (< 10)', value: products.filter(p => p.stock > 0 && p.stock <= 10).length, color: 'orange' },
          { label: 'Out of Stock', value: products.filter(p => p.stock === 0).length, color: 'red' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{s.label}</p>
            <h3 className="text-2xl font-black text-gray-900">{s.value}</h3>
          </div>
        ))}
      </div>

      {/* Dropdown Tabs */}
      <AdminFilterDropdown 
        tabs={['All Products', 'Active', 'Draft', 'Out of Stock']}
        activeTab={activeTab}
        onTabChange={(tab) => { setActiveTab(tab); setCurrentPage(1); }}
      />

      {/* Search + Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search products or SKU..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 border-0 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white text-sm font-medium transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <FiFilter size={14} className="text-gray-400" />
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="appearance-none px-4 py-3 pr-10 rounded-xl bg-gray-50 border-0 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-bold text-gray-700 cursor-pointer"
            >
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-4 px-4 w-10">
                  <input type="checkbox" checked={selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300 accent-orange-500 cursor-pointer" />
                </th>
                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Product</th>
                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Category</th>
                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Price</th>
                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Stock</th>
                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Rating</th>
                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active</th>
                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="py-3 px-4">
                    <input type="checkbox" checked={selectedProducts.includes(product.id)} onChange={() => setSelectedProducts(prev => prev.includes(product.id) ? prev.filter(x => x !== product.id) : [...prev, product.id])} className="w-4 h-4 rounded border-gray-300 accent-orange-500 cursor-pointer" />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 overflow-hidden shrink-0 border border-orange-100">
                        <img src={product.img} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-800">{product.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{product.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs font-bold text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg">{product.category}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <span className="text-sm font-black text-gray-900">₹{product.price}</span>
                      <span className="text-[10px] text-gray-400 line-through ml-1.5">₹{product.originalPrice}</span>
                      <span className="text-[10px] text-orange-500 font-bold ml-1.5">{product.discount} OFF</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-sm font-bold ${getStockColor(product.stock)}`}>
                      {product.stock === 0 ? 'Out of stock' : `${product.stock} units`}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {product.rating > 0 ? (
                      <div className="flex items-center gap-1">
                        <span className="text-orange-400 text-xs">★</span>
                        <span className="text-sm font-bold text-gray-700">{product.rating}</span>
                        <span className="text-[10px] text-gray-400">({product.reviews})</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">No reviews</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(product.status)}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className={`transition-colors ${product.status === 'Active' ? 'text-green-500' : 'text-gray-300'}`}>
                      {product.status === 'Active' ? <FiToggleRight size={22} /> : <FiToggleLeft size={22} />}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><FiEdit size={14} /></button>
                      <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><FiTrash2 size={14} /></button>
                      <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><FiMoreHorizontal size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-400 font-medium">
            Showing <span className="font-bold text-gray-700">{Math.min(filteredProducts.length, 1)}</span>-<span className="font-bold text-gray-700">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> of <span className="font-bold text-gray-700">{filteredProducts.length}</span>
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30"><FiChevronLeft size={14} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${currentPage === page ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>{page}</button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30"><FiChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      {/* ═══ ADD PRODUCT MODAL ═══ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-900">Add New Product</h3>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"><FiX size={16} /></button>
            </div>
            <div className="p-6 space-y-5">
              {/* Image Upload */}
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-orange-300 transition-colors cursor-pointer">
                <FiImage size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-600">Click to upload product images</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Product Name</label>
                <input type="text" placeholder="e.g., Raw Pyrite Bracelet" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Description</label>
                <textarea rows="3" placeholder="Describe the product..." className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Category</label>
                  <select className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                    {categories.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">SKU</label>
                  <input type="text" placeholder="BRC-004" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Price (₹)</label>
                  <input type="number" placeholder="399" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">MRP (₹)</label>
                  <input type="number" placeholder="899" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Stock</label>
                  <input type="number" placeholder="50" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
              </div>

              <button className="w-full px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all text-sm">
                <FiPlus size={14} /> Add Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
