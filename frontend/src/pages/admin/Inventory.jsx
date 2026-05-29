import { useState } from 'react';
import { FiSearch, FiAlertTriangle, FiBox, FiPackage, FiChevronDown, FiChevronLeft, FiChevronRight, FiRefreshCcw, FiPlus, FiMinus, FiX, FiTrendingDown, FiDatabase } from 'react-icons/fi';

const AdminInventory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [restockModal, setRestockModal] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const itemsPerPage = 10;

  const inventory = [
    { id: 1, name: 'Raw Pyrite Bracelet', sku: 'BRC-001', category: 'Bracelets', stock: 45, minStock: 20, sold: 312, lastUpdated: 'May 27, 2026', status: 'In Stock' },
    { id: 2, name: 'Pyrite Premium Bracelet', sku: 'BRC-002', category: 'Bracelets', stock: 22, minStock: 15, sold: 189, lastUpdated: 'May 26, 2026', status: 'In Stock' },
    { id: 3, name: '5 Mukhi Rudraksha Mala', sku: 'RUD-001', category: 'Rudraksha', stock: 8, minStock: 10, sold: 98, lastUpdated: 'May 25, 2026', status: 'Low Stock' },
    { id: 4, name: 'Yellow Sapphire Ring', sku: 'GEM-001', category: 'Gemstones', stock: 3, minStock: 5, sold: 45, lastUpdated: 'May 27, 2026', status: 'Low Stock' },
    { id: 5, name: 'Tiger Eye Bracelet', sku: 'BRC-003', category: 'Bracelets', stock: 0, minStock: 20, sold: 412, lastUpdated: 'May 20, 2026', status: 'Out of Stock' },
    { id: 6, name: 'Neelam Stone (Blue Sapphire)', sku: 'GEM-002', category: 'Gemstones', stock: 12, minStock: 5, sold: 23, lastUpdated: 'May 24, 2026', status: 'In Stock' },
    { id: 7, name: 'Rudraksha Pendant 7 Mukhi', sku: 'RUD-002', category: 'Rudraksha', stock: 15, minStock: 10, sold: 0, lastUpdated: 'May 22, 2026', status: 'In Stock' },
    { id: 8, name: 'Evil Eye Protection Bracelet', sku: 'LKB-001', category: 'Lal Kitab', stock: 60, minStock: 25, sold: 156, lastUpdated: 'May 27, 2026', status: 'In Stock' },
    { id: 9, name: 'Reiki Healing Stones Set', sku: 'LKB-002', category: 'Lal Kitab', stock: 18, minStock: 15, sold: 89, lastUpdated: 'May 26, 2026', status: 'In Stock' },
    { id: 10, name: 'Emerald (Panna) Natural', sku: 'GEM-003', category: 'Gemstones', stock: 5, minStock: 5, sold: 14, lastUpdated: 'May 23, 2026', status: 'Low Stock' },
  ];

  const categories = ['All', 'Bracelets', 'Rudraksha', 'Gemstones', 'Lal Kitab'];
  const statuses = ['All', 'In Stock', 'Low Stock', 'Out of Stock'];

  const filtered = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStockBarWidth = (stock, minStock) => {
    const maxDisplay = minStock * 3;
    return Math.min(100, (stock / maxDisplay) * 100);
  };

  const getStockBarColor = (status) => {
    switch (status) {
      case 'In Stock': return 'bg-green-500';
      case 'Low Stock': return 'bg-orange-500';
      case 'Out of Stock': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <p className="text-sm text-gray-400 font-medium mt-1">Track stock levels and manage inventory across all products</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-4">
          <div className="w-11 h-11 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center"><FiDatabase size={18} /></div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Total Products</p>
            <h3 className="text-xl font-black text-gray-900">{inventory.length}</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-4">
          <div className="w-11 h-11 bg-green-50 text-green-500 rounded-xl flex items-center justify-center"><FiBox size={18} /></div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">In Stock</p>
            <h3 className="text-xl font-black text-gray-900">{inventory.filter(i => i.status === 'In Stock').length}</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-orange-100 flex items-center gap-4">
          <div className="w-11 h-11 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center relative">
            <FiAlertTriangle size={18} />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Low Stock Alerts</p>
            <h3 className="text-xl font-black text-orange-600">{inventory.filter(i => i.status === 'Low Stock').length}</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-red-100 flex items-center gap-4">
          <div className="w-11 h-11 bg-red-50 text-red-500 rounded-xl flex items-center justify-center"><FiTrendingDown size={18} /></div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Out of Stock</p>
            <h3 className="text-xl font-black text-red-600">{inventory.filter(i => i.status === 'Out of Stock').length}</h3>
          </div>
        </div>
      </div>

      {/* Search + Filters */}
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
        <div className="flex gap-2">
          <div className="relative">
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="appearance-none px-4 py-3 pr-10 rounded-xl bg-gray-50 border-0 text-sm font-bold text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20">
              {statuses.map(s => <option key={s}>{s}</option>)}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
          </div>
          <div className="relative">
            <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }} className="appearance-none px-4 py-3 pr-10 rounded-xl bg-gray-50 border-0 text-sm font-bold text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20">
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-4 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Product</th>
                <th className="py-4 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Category</th>
                <th className="py-4 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Stock Level</th>
                <th className="py-4 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Min. Stock</th>
                <th className="py-4 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Sold</th>
                <th className="py-4 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Last Updated</th>
                <th className="py-4 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="py-4 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map(item => (
                <tr key={item.id} className={`hover:bg-gray-50/50 transition-colors group ${item.status === 'Out of Stock' ? 'bg-red-50/30' : item.status === 'Low Stock' ? 'bg-orange-50/20' : ''}`}>
                  <td className="py-4 px-5">
                    <p className="font-bold text-sm text-gray-800">{item.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{item.sku}</p>
                  </td>
                  <td className="py-4 px-5">
                    <span className="text-xs font-bold text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg">{item.category}</span>
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-black ${item.stock === 0 ? 'text-red-500' : item.stock <= item.minStock ? 'text-orange-500' : 'text-gray-900'}`}>
                        {item.stock}
                      </span>
                      <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${getStockBarColor(item.status)}`} style={{ width: `${getStockBarWidth(item.stock, item.minStock)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span className="text-sm font-medium text-gray-500">{item.minStock}</span>
                  </td>
                  <td className="py-4 px-5">
                    <span className="text-sm font-bold text-gray-700">{item.sold}</span>
                  </td>
                  <td className="py-4 px-5">
                    <span className="text-xs text-gray-400 font-medium">{item.lastUpdated}</span>
                  </td>
                  <td className="py-4 px-5">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                      item.status === 'In Stock' ? 'bg-green-50 text-green-600' :
                      item.status === 'Low Stock' ? 'bg-orange-50 text-orange-600' :
                      'bg-red-50 text-red-500'
                    }`}>
                      {item.status === 'Low Stock' && <FiAlertTriangle size={10} />}
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <button
                      onClick={() => { setRestockModal(item); setRestockQty(''); }}
                      className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg transition-colors text-[11px] font-bold flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100"
                    >
                      <FiRefreshCcw size={12} /> Restock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-400 font-medium">
            Showing <span className="font-bold text-gray-700">{filtered.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}</span>-<span className="font-bold text-gray-700">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span className="font-bold text-gray-700">{filtered.length}</span>
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30"><FiChevronLeft size={14} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${currentPage === page ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>{page}</button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30"><FiChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      {/* ═══ RESTOCK MODAL ═══ */}
      {restockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setRestockModal(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Restock Product</h3>
              <button onClick={() => setRestockModal(null)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"><FiX size={16} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-bold text-gray-800">{restockModal.name}</p>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">{restockModal.sku}</p>
                <div className="flex items-center gap-4 mt-3">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Current Stock</p>
                    <p className={`text-lg font-black ${restockModal.stock === 0 ? 'text-red-500' : restockModal.stock <= restockModal.minStock ? 'text-orange-500' : 'text-gray-900'}`}>{restockModal.stock}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Min. Stock</p>
                    <p className="text-lg font-black text-gray-900">{restockModal.minStock}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Add Quantity</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRestockQty(prev => String(Math.max(1, (parseInt(prev) || 0) - 1)))}
                    className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                  ><FiMinus size={16} /></button>
                  <input
                    type="number"
                    value={restockQty}
                    onChange={e => setRestockQty(e.target.value)}
                    placeholder="0"
                    className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border-0 text-center text-lg font-black text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                  <button
                    onClick={() => setRestockQty(prev => String((parseInt(prev) || 0) + 1))}
                    className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                  ><FiPlus size={16} /></button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Notes (optional)</label>
                <input type="text" placeholder="e.g., Restocked from supplier XYZ" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
              </div>

              {restockQty && parseInt(restockQty) > 0 && (
                <div className="bg-green-50 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-green-700">New stock after restock:</span>
                  <span className="text-lg font-black text-green-700">{restockModal.stock + parseInt(restockQty)}</span>
                </div>
              )}

              <button
                onClick={() => setRestockModal(null)}
                disabled={!restockQty || parseInt(restockQty) <= 0}
                className="w-full px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all text-sm disabled:opacity-50"
              >
                <FiRefreshCcw size={14} /> Update Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
