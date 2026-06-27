import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { GiFlowerPot } from 'react-icons/gi';
import { FiCheck, FiX, FiCalendar, FiClock, FiVideo, FiTrash2, FiSquare, FiCheckSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { formatTime12Hour } from '../../utils/formatTime';
import { fetchAstrologerPoojaRequestsThunk, updatePoojaStatusThunk } from '../../store/slices/astrologerSlice';

const PoojaRequests = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { poojaRequests, loading } = useSelector((state) => state.astrologer);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [proofData, setProofData] = useState({ photos: [], video: null, notes: '' });

  useEffect(() => {
    dispatch(fetchAstrologerPoojaRequestsThunk());
  }, [dispatch]);

  const handleStatusChange = async (id, status) => {
    await dispatch(updatePoojaStatusThunk({ id, status })).unwrap();
    dispatch(fetchAstrologerPoojaRequestsThunk());
  };

  const pendingRequests = poojaRequests.filter(req => req.status === 'Pending');
  const confirmedRequests = poojaRequests.filter(req => req.status === 'Accepted' || req.status === 'In Progress');

  return (
    <div className="p-4 animate-fade-in mb-6 space-y-6">
      
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Pooja Requests</h1>
        <p className="text-sm text-gray-500 font-medium">Manage and review your pooja bookings</p>
      </div>

      {/* New Request Cards */}
      {pendingRequests.length === 0 && !loading && (
        <p className="text-gray-500 text-sm">No new pooja requests.</p>
      )}
      
      {pendingRequests.map(req => (
        <div key={req._id} className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-orange-100 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 bg-[#fa6830]/10 rounded-full blur-xl"></div>
           
           <div className="flex items-start gap-4 mb-4 relative z-10">
             <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center shrink-0">
               <GiFlowerPot size={24} />
             </div>
             <div className="flex-1">
               <div className="flex justify-between items-start">
                 <h3 className="font-bold text-gray-800 text-lg leading-tight">{req.poojaName}</h3>
                 <span className="bg-red-50 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">New</span>
               </div>
               <p className="text-gray-500 text-xs font-medium mt-1">Requested by <span className="text-gray-700 font-bold">{req.userId?.name || 'User'}</span></p>
             </div>
           </div>

           <div className="bg-gray-50 rounded-xl p-3 mb-5 border border-gray-100 relative z-10">
             <div className="flex justify-between items-center mb-2">
               <span className="text-xs text-gray-500 font-bold flex items-center gap-1"><FiCalendar /> Proposed Date</span>
               <span className="text-xs text-gray-800 font-bold">{req.date}</span>
             </div>
             <div className="flex justify-between items-center mb-2">
               <span className="text-xs text-gray-500 font-bold flex items-center gap-1"><FiClock /> Time</span>
               <span className="text-xs text-gray-800 font-bold">{req.time}</span>
             </div>
           </div>

           <div className="flex gap-3 relative z-10">
             <button 
               onClick={() => handleStatusChange(req._id, 'Rejected')}
               className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
             >
               <FiX /> Decline
             </button>
             <button 
               onClick={() => handleStatusChange(req._id, 'Accepted')}
               className="flex-1 bg-[#fa6830] hover:bg-[#e55923] text-white font-bold py-3 rounded-xl shadow-md shadow-orange-500/30 flex items-center justify-center gap-2 transition-colors text-sm"
             >
               <FiCheck /> Accept Booking
             </button>
           </div>
        </div>
      ))}

      {/* Confirmed Bookings */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mt-8">
        <h2 className="font-bold text-gray-800 text-sm mb-4 border-b border-gray-50 pb-2">Upcoming Confirmed Poojas</h2>
        
        {confirmedRequests.length === 0 ? (
          <p className="text-gray-500 text-xs">No upcoming poojas.</p>
        ) : (
          <div className="space-y-4">
            {confirmedRequests.map(req => (
              <div key={req._id} className="border border-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-50 text-green-500 rounded-full flex items-center justify-center shrink-0">
                    <GiFlowerPot size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-800 text-sm truncate">{req.poojaName}</h4>
                    <p className="text-xs text-gray-500 font-medium">{req.date} at {formatTime12Hour(req.time)}</p>
                  </div>
                </div>

                <button
                  onClick={() => { setSelectedBookingId(req._id); setUploadModalOpen(true); }}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2 bg-green-500 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-green-600 transition-colors"
                >
                  <FiCheck size={14} /> Upload Proof & Complete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Proof Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden p-6 relative">
            <button onClick={() => setUploadModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <FiX size={20} />
            </button>
            <h3 className="font-bold text-gray-900 text-lg mb-4">Complete Pooja & Upload Proof</h3>
            <p className="text-sm text-gray-500 mb-4">Upload minimum 2 photos and 1 video to verify completion and release your payment.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Upload Photos (Min 2)</label>
                <div className="flex flex-wrap gap-3">
                  {proofData.photos.map((photo, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-orange-100 shadow-sm">
                      <img src={photo} alt="proof" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setProofData({ ...proofData, photos: proofData.photos.filter((_, i) => i !== idx) })} 
                        className="absolute top-1 right-1 bg-white/80 backdrop-blur-sm text-red-500 rounded-full w-5 h-5 flex items-center justify-center shadow-sm hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <FiX size={12} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#fa6830] hover:bg-orange-50 hover:text-[#fa6830] text-gray-400 transition-all bg-gray-50">
                    <span className="text-2xl font-light mb-1">+</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider">Add</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      className="hidden"
                      onChange={(e) => {
                         const files = Array.from(e.target.files);
                         Promise.all(files.map(f => {
                           return new Promise(res => {
                             const reader = new FileReader();
                             reader.onloadend = () => res(reader.result);
                             reader.readAsDataURL(f);
                           });
                         })).then(base64Arr => setProofData({...proofData, photos: [...proofData.photos, ...base64Arr]}));
                      }}
                    />
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Upload Video (Min 1)</label>
                {proofData.video ? (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden border-2 border-orange-100 bg-black shadow-sm group">
                    <video src={proofData.video} controls className="w-full h-full object-contain" />
                    <button 
                      onClick={() => setProofData({ ...proofData, video: null })} 
                      className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm text-red-500 rounded-full w-7 h-7 flex items-center justify-center shadow-sm hover:bg-red-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <FiX size={16} strokeWidth={3} />
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#fa6830] hover:bg-orange-50 hover:text-[#fa6830] text-gray-400 transition-all bg-gray-50">
                    <FiVideo size={24} className="mb-2" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Click to upload video</span>
                    <input 
                      type="file" 
                      accept="video/*" 
                      className="hidden"
                      onChange={(e) => {
                         const f = e.target.files[0];
                         if(f) {
                           const reader = new FileReader();
                           reader.onloadend = () => setProofData({...proofData, video: reader.result});
                           reader.readAsDataURL(f);
                         }
                      }}
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Completion Notes</label>
                <textarea 
                  rows="2"
                  value={proofData.notes}
                  onChange={e => setProofData({...proofData, notes: e.target.value})}
                  placeholder="Any final words or blessings..."
                  className="w-full text-sm border-2 border-gray-100 rounded-lg p-2 outline-none focus:border-[#fa6830]"
                ></textarea>
              </div>

              <button
                disabled={proofData.photos.length < 2 || !proofData.video || uploading}
                onClick={async () => {
                  setUploading(true);
                  try {
                    const { uploadPoojaProof } = await import('../../api/astrologerApis.js');
                    const allMedia = [...proofData.photos, proofData.video];
                    await uploadPoojaProof(selectedBookingId, { proofMedia: allMedia, notes: proofData.notes });
                    await handleStatusChange(selectedBookingId, 'Completed');
                    setUploadModalOpen(false);
                    setProofData({ photos: [], video: null, notes: '' });
                    toast.success('Pooja marked as completed and payment released!');
                  } catch(err) {
                    toast.error(err.response?.data?.message || 'Failed to upload proof');
                  } finally {
                    setUploading(false);
                  }
                }}
                className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${
                  proofData.photos.length >= 2 && proofData.video && !uploading ? 'bg-[#fa6830] hover:bg-[#e55923]' : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {uploading ? 'Uploading...' : 'Submit Proof & Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PoojaRequests;
