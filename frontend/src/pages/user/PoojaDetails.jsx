import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiVideo, FiX } from 'react-icons/fi';
import { getUserPoojaById } from '../../api/userApis';
import { toast } from 'react-hot-toast';
import { useGlobalSocket } from '../../hooks/useGlobalSocket';
import { formatTime12Hour } from '../../utils/formatTime';

const PoojaDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pooja, setPooja] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const socket = useGlobalSocket();

  useEffect(() => {
    if (!socket || !pooja) return;
    const handleStatusUpdate = (data) => {
      if (data.poojaId === pooja._id) {
        setPooja(data.pooja);
      }
    };
    socket.on('pooja_status_updated', handleStatusUpdate);
    return () => socket.off('pooja_status_updated', handleStatusUpdate);
  }, [socket, pooja]);

  useEffect(() => {
    const fetchPooja = async () => {
      try {
        const { data } = await getUserPoojaById(id);
        if (data.success) {
          setPooja(data.data.pooja);
        }
      } catch (err) {
        toast.error('Failed to load pooja details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPooja();
  }, [id]);

  if (loading) {
    return <SplashScreen />;
  }

  if (!pooja) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">Pooja not found</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-orange-500 text-white rounded-lg">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Top Navigation */}
      <div className="bg-white px-4 py-3 sticky top-0 z-30 shadow-sm border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
          <FiArrowLeft size={20} className="text-gray-800" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">Pooja Details</h1>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5 mb-5">
          <div className="flex justify-between items-start mb-4">
            <div className="flex gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-orange-200 shrink-0">
                <img 
                  src={pooja.astrologerId?.avatar || 'https://ui-avatars.com/api/?name=Pandit&background=ffedD5&color=f97316'} 
                  alt="Pandit" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg leading-tight">{pooja.poojaName}</h2>
                <p className="text-sm text-gray-500 mt-0.5">with {pooja.astrologerId?.name || 'Pandit'}</p>
              </div>
            </div>
            <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wide ${
              pooja.status === 'Pending' ? 'bg-orange-50 text-orange-600' :
              pooja.status === 'Accepted' || pooja.status === 'In Progress' ? 'bg-blue-50 text-blue-600' :
              pooja.status === 'Completed' ? 'bg-green-50 text-green-600' :
              pooja.status === 'Rejected' || pooja.status === 'Expired' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'
            }`}>
              {pooja.status}
            </span>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-1 border border-gray-100">
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Scheduled For</span>
            <span className="text-[15px] text-gray-800 font-bold">{pooja.date} at {formatTime12Hour(pooja.time)}</span>
          </div>
        </div>

        {/* Proofs Section */}
        {pooja.status === 'Completed' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-green-500 rounded-full inline-block"></span>
              Pooja Proofs & Notes
            </h3>

            {pooja.proofNotes && (
              <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100/50 mb-5">
                <p className="text-[15px] text-gray-700 leading-relaxed italic">"{pooja.proofNotes}"</p>
              </div>
            )}

            {pooja.proofMedia && pooja.proofMedia.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {pooja.proofMedia.map((mediaUrl, idx) => {
                  const isVideo = mediaUrl.match(/\.(mp4|mov|avi|webm)/i) || mediaUrl.includes('/video/');
                  return isVideo ? (
                    <div 
                      key={idx} 
                      className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-900 cursor-pointer group shadow-sm border border-gray-200" 
                      onClick={() => setSelectedMedia({ url: mediaUrl, type: 'video' })}
                    >
                      <video src={mediaUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"></video>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                        <div className="w-10 h-10 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <FiVideo size={20} className="text-white drop-shadow-md ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div 
                      key={idx}
                      className="relative w-full aspect-square rounded-xl overflow-hidden cursor-pointer shadow-sm border border-gray-200 group"
                      onClick={() => setSelectedMedia({ url: mediaUrl, type: 'image' })}
                    >
                      <img src={mediaUrl} alt="Proof" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No media uploaded.</p>
            )}
          </div>
        )}
      </div>

      {/* Media Viewer Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm">
          <button 
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white z-50"
            onClick={() => setSelectedMedia(null)}
          >
            <FiX size={24} />
          </button>
          
          <div className="relative w-full max-w-4xl max-h-[90vh] flex items-center justify-center">
            {selectedMedia.type === 'video' ? (
              <video 
                src={selectedMedia.url} 
                controls 
                autoPlay 
                playsInline
                className="max-w-full max-h-[85vh] rounded-lg shadow-2xl"
              />
            ) : (
              <img 
                src={selectedMedia.url} 
                alt="Full screen proof" 
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PoojaDetails;
