import { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiEdit, FiTrash2, FiChevronDown, FiChevronLeft, FiChevronRight, FiBox, FiImage, FiToggleLeft, FiToggleRight, FiX, FiFilter, FiMoreHorizontal, FiCamera } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminFilterDropdown from '../../components/AdminFilterDropdown';
import { getAdminProducts, createAdminProduct, deleteAdminProduct, updateAdminProduct } from '../../api/adminApis';

const AdminProducts = () => {
  const [activeTab, setActiveTab] = useState('All Products');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openActionDropdown, setOpenActionDropdown] = useState(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: '', description: '', category: 'Bracelets', sku: '', price: '', costPrice: '', originalPrice: '', discount: '', stock: '', image: '', featuredSection: 'none', weight: '', length: '', breadth: '', height: ''
  });
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await getAdminProducts();
      const fetchedProducts = response.data?.data?.products || response.data?.products || [];
      
      const mapped = fetchedProducts.map(p => ({
        id: p._id,
        name: p.name,
        category: p.category || 'General',
        price: p.price,
        costPrice: p.costPrice || '',
        originalPrice: p.originalPrice || '',
        description: p.description || '',
        featuredSection: p.featuredSection || 'none',
        discount: p.discount === '0%' ? '' : (p.discount || ''),
        stock: p.stock || 0,
        status: p.isActive === false || p.stock === 0 ? (p.stock === 0 ? 'Out of Stock' : 'Draft') : 'Active',
        img: p.image || '/store_bracelet.png',
        rating: p.rating || 0,
        reviews: p.reviews?.length || 0,
        sku: p.sku || p._id.toString().slice(-6).toUpperCase(),
        weight: p.weight || '',
        length: p.length || '',
        breadth: p.breadth || '',
        height: p.height || ''
      }));
      setProducts(mapped);
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNumberChange = (key, value) => {
    if (value === '') {
      setFormData(prev => ({ ...prev, [key]: '' }));
      return;
    }
    const num = Number(value);
    if (isNaN(num) || num < 0) return;
    setFormData(prev => ({ ...prev, [key]: num }));
  };

  const handleSaveProduct = async () => {
    if (isSubmitting) return;
    try {
      if (!formData.name || !formData.price || !formData.category) {
        toast.error('Product Name, Price, and Category are required.');
        return;
      }
      if (!formData.weight || !formData.length || !formData.breadth || !formData.height) {
        toast.error('Weight, Length, Breadth, and Height are required for shipping details.');
        return;
      }
      if (Number(formData.price) >= Number(formData.originalPrice) && Number(formData.originalPrice) > 0) {
        toast.error('Selling price must be less than MRP.');
        return;
      }
      
      setIsSubmitting(true);
      const payload = {
        ...formData,
        price: Number(formData.price),
        costPrice: Number(formData.costPrice || 0),
        originalPrice: Number(formData.originalPrice),
        discount: formData.discount,
        stock: Number(formData.stock),
        weight: Number(formData.weight),
        length: Number(formData.length),
        breadth: Number(formData.breadth),
        height: Number(formData.height)
      };

      if (editingProductId) {
        await updateAdminProduct(editingProductId, payload);
        toast.success('Product updated successfully!');
      } else {
        await createAdminProduct(payload);
        toast.success('Product created successfully!');
      }
      
      setShowAddModal(false);
      setEditingProductId(null);
      setFormData({ name: '', description: '', category: 'Bracelets', sku: '', price: '', costPrice: '', originalPrice: '', discount: '', stock: '', image: '', featuredSection: 'none', weight: '', length: '', breadth: '', height: '' });
      fetchProducts();
    } catch (err) {
      console.error('Failed to save product', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (product) => {
    setEditingProductId(product.id);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      sku: product.sku,
      price: product.price,
      costPrice: product.costPrice,
      originalPrice: product.originalPrice,
      discount: product.discount,
      stock: product.stock,
      image: product.img,
      featuredSection: product.featuredSection || 'none',
      weight: product.weight || '',
      length: product.length || '',
      breadth: product.breadth || '',
      height: product.height || ''
    });
    setOpenActionDropdown(null);
    setShowNewCategoryInput(false);
    setShowAddModal(true);
  };

  const handleDeleteProduct = async () => {
    if (!deleteConfirmProduct || isDeleting) return;
    try {
      setIsDeleting(true);
      await deleteAdminProduct(deleteConfirmProduct.id);
      toast.success('Product deleted successfully!');
      setDeleteConfirmProduct(null);
      fetchProducts();
    } catch (err) {
      console.error('Failed to delete product', err);
      toast.error('Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  const categories = ['All', 'Bracelets', 'Rudraksha', 'Gemstones', 'Lal Kitab'];

  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || categoryFilter === '' || (p.category || '').toLowerCase().includes(categoryFilter.toLowerCase());
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
    <div className="space-y-6 pb-32">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">Manage your store product catalog, pricing, and stock</p>
        </div>
        <button
          onClick={() => {
            setEditingProductId(null);
            setFormData({ name: '', description: '', category: 'Bracelets', sku: '', price: '', originalPrice: '', discount: '', stock: '', image: '', featuredSection: 'none', weight: '', length: '', breadth: '', height: '' });
            setShowNewCategoryInput(false);
            setShowAddModal(true);
          }}
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
          <CategorySearchDropdown 
            categories={categories}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            setCurrentPage={setCurrentPage}
          />
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-2xl border border-gray-100 min-h-[400px]">
        <div className="w-full overflow-visible">
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
                  <td className={`py-3 px-4 text-right relative ${openActionDropdown === product.id ? 'z-50' : ''}`}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const isOpening = openActionDropdown !== product.id;
                        setOpenActionDropdown(isOpening ? product.id : null);
                        if (isOpening) {
                          const td = e.currentTarget.closest('td');
                          setTimeout(() => {
                            const dropdown = td.querySelector('.action-dropdown-menu');
                            if (dropdown) dropdown.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                          }, 50);
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <FiMoreHorizontal size={18} />
                    </button>

                    {openActionDropdown === product.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpenActionDropdown(null)} />
                        <div className="action-dropdown-menu absolute right-5 top-12 mt-1 w-48 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-50 overflow-hidden animate-slide-down origin-top-right text-left">
                          <button
                            onClick={() => openEditModal(product)}
                            className="w-full px-4 py-3 text-left text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors border-b border-gray-50"
                          >
                            <FiEdit size={16} className="text-blue-500" /> Edit Product
                          </button>
                          <button
                            onClick={() => { setDeleteConfirmProduct(product); setOpenActionDropdown(null); }}
                            className="w-full px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                          >
                            <FiTrash2 size={16} /> Delete Product
                          </button>
                        </div>
                      </>
                    )}
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

      {/* ═══ ADD/EDIT PRODUCT MODAL ═══ */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className="w-full sm:max-w-2xl bg-white rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up sm:animate-scale-in flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                  {editingProductId ? <FiEdit size={20} /> : <FiBox size={20} />}
                </div>
                <div>
                  <h3 className="font-black text-gray-900">{editingProductId ? 'Edit Product' : 'Add New Product'}</h3>
                  <p className="text-xs font-medium text-gray-400">Fill in the product details below</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                <FiX size={20} />
              </button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Image Upload */}
              <div className="flex justify-center mb-2">
                <div className="flex flex-col items-center w-full">
                  <div className={`border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group ${formData.image ? 'w-40 h-40 shrink-0 mb-3' : 'w-full p-8 mb-3'}`}>
                    {formData.image ? (
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <FiImage size={32} className="text-gray-300 mx-auto mb-3" />
                        <p className="text-sm font-bold text-gray-600">No Product Image</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <label className="cursor-pointer bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg flex items-center gap-2 text-[11px] font-bold shadow-sm transition-colors">
                      <FiImage size={14} /> Upload File
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                    <label className="cursor-pointer bg-orange-50 border border-orange-100 hover:bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg flex items-center gap-2 text-[11px] font-bold shadow-sm transition-colors">
                      <FiCamera size={14} /> Take Photo
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Product Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g., Raw Pyrite Bracelet" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Description</label>
                <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe the product..." className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Featured Section</label>
                <select value={formData.featuredSection} onChange={e => setFormData({...formData, featuredSection: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                  <option value="none">None (At the bottom)</option>
                  <option value="top_selling">Top Selling</option>
                  <option value="newly_launch">Newly Launch</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Category</label>
                  {!showNewCategoryInput ? (
                    <select
                      value={formData.category}
                      onChange={e => {
                        if (e.target.value === '__add_new__') {
                          setShowNewCategoryInput(true);
                          setFormData({...formData, category: ''});
                        } else {
                          setFormData({...formData, category: e.target.value});
                        }
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    >
                      <option value="" disabled>Select Category</option>
                      {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="__add_new__" className="font-bold text-orange-600">+ Add New Category</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={formData.category} 
                        onChange={e => setFormData({...formData, category: e.target.value})} 
                        placeholder="Type new category..."
                        autoFocus
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowNewCategoryInput(false)}
                        className="px-3 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 text-xs font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">SKU</label>
                  <input type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="BRC-004" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Selling Price</label>
                  <input type="number" min="0" value={formData.price} onChange={e => handleNumberChange('price', e.target.value)} onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} placeholder="399" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Cost Price</label>
                  <input type="number" min="0" value={formData.costPrice} onChange={e => handleNumberChange('costPrice', e.target.value)} onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} placeholder="200" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">MRP (₹)</label>
                  <input type="number" min="0" value={formData.originalPrice} onChange={e => handleNumberChange('originalPrice', e.target.value)} onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} placeholder="899" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Discount Tag (%)</label>
                  <input type="number" min="0" max="100" value={formData.discount} onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    if (val === '' || (Number(val) >= 0 && Number(val) <= 100)) {
                      setFormData({...formData, discount: val});
                    }
                  }} onKeyDown={(e) => ['e', 'E', '+', '-', '.'].includes(e.key) && e.preventDefault()} placeholder="e.g. 50" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Stock</label>
                  <input type="number" min="0" value={formData.stock} onChange={e => handleNumberChange('stock', e.target.value)} onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} placeholder="50" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Weight (kg)</label>
                  <input type="number" min="0" step="0.01" value={formData.weight} onChange={e => handleNumberChange('weight', e.target.value)} onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} placeholder="0.5" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Length (cm)</label>
                  <input type="number" min="0" value={formData.length} onChange={e => handleNumberChange('length', e.target.value)} onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} placeholder="10" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Breadth (cm)</label>
                  <input type="number" min="0" value={formData.breadth} onChange={e => handleNumberChange('breadth', e.target.value)} onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} placeholder="10" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Height (cm)</label>
                  <input type="number" min="0" value={formData.height} onChange={e => handleNumberChange('height', e.target.value)} onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} placeholder="10" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
              </div>

              <button 
                onClick={handleSaveProduct} 
                disabled={isSubmitting}
                className={`w-full px-6 py-3.5 ${isSubmitting ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 active:scale-[0.98]'} text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all text-sm`}
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    {editingProductId ? <FiEdit size={14} /> : <FiPlus size={14} />} {editingProductId ? 'Update Product' : 'Add Product'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DELETE CONFIRMATION MODAL ═══ */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" onClick={() => setDeleteConfirmProduct(null)}>
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-scale-in flex flex-col p-8 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
              <FiTrash2 size={32} className="text-red-500" />
            </div>
            
            <h3 className="text-2xl font-black text-gray-900 mb-2">Delete Product?</h3>
            <p className="text-gray-500 font-medium mb-8">
              Are you sure you want to permanently delete <b className="text-gray-900">{deleteConfirmProduct.name}</b> from the store? This action cannot be undone.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setDeleteConfirmProduct(null)}
                className="flex-1 py-3.5 px-6 rounded-xl font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors active:scale-[0.98]"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteProduct}
                disabled={isDeleting}
                className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-white transition-all active:scale-[0.98] flex items-center justify-center ${isDeleting ? 'bg-red-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20'}`}
              >
                {isDeleting ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  'Yes, Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CategorySearchDropdown = ({ categories, categoryFilter, setCategoryFilter, setCurrentPage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const filteredOptions = categories.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="appearance-none px-4 py-3 pr-10 rounded-xl bg-gray-50 border-0 hover:bg-gray-100 transition-colors text-sm font-bold text-gray-700 cursor-pointer min-w-[150px] flex items-center justify-between select-none"
      >
        <span className="truncate max-w-[120px]">{categoryFilter || 'All'}</span>
        <FiChevronDown className={`text-gray-400 transition-transform absolute right-4 ${isOpen ? 'rotate-180' : ''}`} size={14} />
      </div>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setIsOpen(false); setSearch(''); }} />
          <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-50 p-2 overflow-hidden animate-slide-down origin-top-right">
            <div className="relative mb-2">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input 
                type="text" 
                autoFocus 
                placeholder="Search category..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium focus:outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>
            <div className="max-h-48 overflow-y-auto no-scrollbar space-y-1">
              {filteredOptions.map(c => (
                <div 
                  key={c} 
                  onClick={() => {
                    setCategoryFilter(c);
                    setCurrentPage(1);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors flex items-center justify-between ${categoryFilter === c ? 'bg-orange-50 text-orange-600 font-bold' : 'text-gray-700 font-medium hover:bg-gray-50'}`}
                >
                  {c}
                  {categoryFilter === c && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                </div>
              ))}
              {filteredOptions.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-gray-400 font-medium">No categories found</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminProducts;
