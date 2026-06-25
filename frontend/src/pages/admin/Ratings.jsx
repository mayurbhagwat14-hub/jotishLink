import { useState, useEffect } from 'react';
import { FiSearch, FiTrash2, FiStar, FiCalendar, FiX, FiCheck } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';
import api from '../../api/axios';
import LogoLoader from '../../components/LogoLoader';

const AdminRatings = () => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [successToast, setSuccessToast] = useState(null);
  const [deleteConfirmRating, setDeleteConfirmRating] = useState(null);
  const itemsPerPage = 10;

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/ratings');
      if (data.success) {
        setRatings(data.data.ratings);
      }
    } catch (error) {
      console.error('Failed to fetch ratings', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, []);

  const showToast = (message) => {
    setSuccessToast(message);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const filteredRatings = ratings.filter(r => {
    const userName = r.userId?.name || 'Unknown User';
    const astroName = r.astrologerId?.name || 'Unknown Astrologer';
    const reviewText = r.review || '';
    const q = searchQuery.toLowerCase();
    
    return userName.toLowerCase().includes(q) || 
           astroName.toLowerCase().includes(q) || 
           reviewText.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filteredRatings.length / itemsPerPage);
  const paginatedRatings = filteredRatings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const executeDelete = async () => {
    if (!deleteConfirmRating) return;
    try {
      await api.delete(`/admin/ratings/${deleteConfirmRating._id}`);
      showToast('Rating permanently deleted.');
      setRatings(prev => prev.filter(r => r._id !== deleteConfirmRating._id));
    } catch (error) {
      console.error('Delete rating failed', error);
    } finally {
      setDeleteConfirmRating(null);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star}>
            {rating >= star ? (
              <FaStar size={14} className="text-yellow-400" />
            ) : (
              <FiStar size={14} className="text-gray-300" />
            )}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* ═══ SUCCESS TOAST ═══ */}
      {successToast && (
        <div className="fixed top-6 right-6 z-[60] animate-slide-down">
          <div className="bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[300px]">
            <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center shrink-0">
              <FiCheck size={16} className="text-white" />
            </div>
            <p className="text-sm font-bold flex-1">{successToast}</p>
            <button onClick={() => setSuccessToast(null)} className="text-gray-400 hover:text-white transition-colors">
              <FiX size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ratings & Reviews</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">View and manage feedback left by users for astrologers</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg font-bold">{ratings.length} Total</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by user, astrologer, or review text..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 border-0 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white text-sm font-medium transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="w-full overflow-visible">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/30">
                <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">User</th>
                <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Astrologer</th>
                <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rating</th>
                <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Review</th>
                <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12"><div className="flex justify-center"><LogoLoader /></div></td>
                </tr>
              ) : paginatedRatings.map((rating) => {
                const dateObj = new Date(rating.createdAt);
                const formattedDate = !isNaN(dateObj) ? dateObj.toLocaleDateString() : 'N/A';
                
                return (
                <tr key={rating._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="py-3 px-4">
                    <p className="font-bold text-[13px] text-gray-800">{rating.userId?.name || 'Unknown User'}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-[13px] text-gray-800">{rating.astrologerId?.name || 'Unknown Astrologer'}</p>
                  </td>
                  <td className="py-3 px-4">
                    {renderStars(rating.rating)}
                  </td>
                  <td className="py-3 px-4 max-w-[300px]">
                    <p className="text-[12px] text-gray-600 truncate" title={rating.review || 'No review text'}>
                      {rating.review || <span className="text-gray-400 italic">No review text</span>}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                      <FiCalendar size={10} /> {formattedDate}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button 
                      onClick={() => setDeleteConfirmRating(rating)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Rating"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </td>
                </tr>
                );
              })}
              {!loading && paginatedRatings.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    No ratings found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredRatings.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-400 font-medium">
              Showing <span className="font-bold text-gray-700">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-bold text-gray-700">{Math.min(currentPage * itemsPerPage, filteredRatings.length)}</span> of <span className="font-bold text-gray-700">{filteredRatings.length}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >Prev</button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1.5 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >Next</button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ DELETE CONFIRM MODAL ═══ */}
      {deleteConfirmRating && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setDeleteConfirmRating(null)} />
          <div className="bg-white rounded-3xl w-full max-w-sm relative z-10 shadow-2xl p-6 text-center animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
              <FiTrash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Rating?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to permanently delete this rating? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmRating(null)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-red-500/30"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRatings;
