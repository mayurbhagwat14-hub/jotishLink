import { useState, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { FiArrowLeft, FiDownload } from 'react-icons/fi';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser } from '../../store/slices/authSlice';
import { getKundli } from '../../api/userApis';
import html2canvas from 'html2canvas';

const Kundli = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { openSidebar } = useOutletContext();
  const user = useSelector((state) => state.auth.user);
  const kundliRef = useRef(null);

  // Helper to safely format ISO date to YYYY-MM-DD for the input
  const formattedDob = user?.dob ? new Date(user.dob).toISOString().split('T')[0] : '';

  const [formData, setFormData] = useState({
    name: user?.name && user.name !== 'Guest User' ? user.name : '',
    dob: formattedDob,
    timeOfBirth: user?.timeOfBirth || '',
    placeOfBirth: user?.placeOfBirth || ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await getKundli(formData);
      setResult(response.data?.data || response.data);

      // Persist the newly entered details into our Redux store
      dispatch(updateUser({
        dob: formData.dob,
        timeOfBirth: formData.timeOfBirth,
        placeOfBirth: formData.placeOfBirth,
      }));
      setLoading(false);
    } catch (error) {
      console.error(error);
      setResult({ error: 'Failed to generate Kundli. Please try again later.' });
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!kundliRef.current) return;
    try {
      const canvas = await html2canvas(kundliRef.current, { scale: 2, useCORS: true });
      const image = canvas.toDataURL("image/jpeg", 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `Kundli_${result?.name || 'Report'}.jpg`;
      link.click();
    } catch (error) {
      console.error("Error downloading Kundli:", error);
    }
  };

  const makeSvgResponsive = (svgString) => {
    if (!svgString) return '';
    let cleaned = svgString.replace(/<svg([^>]*)\bwidth="[^"]*"/g, '<svg$1');
    cleaned = cleaned.replace(/<svg([^>]*)\bheight="[^"]*"/g, '<svg$1');
    if (!cleaned.includes('viewBox')) {
      cleaned = cleaned.replace(/<svg/g, '<svg viewBox="0 0 350 350" style="width: 100%; height: auto; max-width: 350px; display: block; margin: 0 auto;"');
    } else {
      cleaned = cleaned.replace(/<svg/g, '<svg style="width: 100%; height: auto; max-width: 350px; display: block; margin: 0 auto;"');
    }
    return cleaned;
  };

  return (
    <div className="w-full bg-white min-h-screen font-sans pb-24">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between px-4 py-3 bg-white sticky top-0 z-30 shadow-sm border-b border-orange-50">
        <div className="flex items-center">
          <button onClick={() => navigate('/user/home')} className="text-gray-800 hover:bg-gray-100 p-1.5 rounded-full transition-colors mr-3">
            <FiArrowLeft size={20} />
          </button>
          <span className="text-gray-800 font-semibold text-[17px]">Free Kundli</span>
        </div>
        <div 
          onClick={openSidebar}
          className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden border border-orange-200 cursor-pointer shrink-0"
        >
          {user?.avatar ? (
            <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-orange-500 font-bold text-xs">{(user?.name || 'G')[0]}</span>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="text-center mb-10">
          <h1 className="text-[28px] font-bold text-gray-900 mb-2">Generate Your Kundli</h1>
          <p className="text-gray-500 text-[14px]">Discover your cosmic blueprint based on Vedic Astrology.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-card border border-orange-100 p-4 sm:p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full blur-[40px] opacity-60 -z-10" />
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-[13px] font-semibold text-gray-600 mb-1.5">Full Name</label>
              <input 
                required type="text" 
                placeholder="Enter your full name"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full border-2 border-gray-100 rounded-xl py-3 px-4 outline-none focus:border-orange-400 focus:bg-orange-50/30 transition-all text-[15px]" 
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-gray-600 mb-1.5">Date of Birth</label>
              <input 
                required 
                type="date"
                value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})}
                className="w-full border-2 border-gray-100 rounded-xl py-3 px-4 outline-none focus:border-orange-400 focus:bg-orange-50/30 transition-all text-[15px]" 
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-gray-600 mb-1.5">Time of Birth</label>
              <input 
                required 
                type="time" 
                value={formData.timeOfBirth} onChange={e => setFormData({...formData, timeOfBirth: e.target.value})}
                className="w-full border-2 border-gray-100 rounded-xl py-3 px-4 outline-none focus:border-orange-400 focus:bg-orange-50/30 transition-all text-[15px]" 
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-[13px] font-semibold text-gray-600 mb-1.5">Place of Birth</label>
              <input 
                required type="text" 
                placeholder="Enter city"
                value={formData.placeOfBirth} onChange={e => setFormData({...formData, placeOfBirth: e.target.value})}
                className="w-full border-2 border-gray-100 rounded-xl py-3 px-4 outline-none focus:border-orange-400 focus:bg-orange-50/30 transition-all text-[15px]" 
              />
            </div>
            
            <div className="col-span-1 md:col-span-2 mt-4">
              <button 
                type="submit" disabled={loading}
                className={`w-full py-4 rounded-xl font-bold text-[15px] transition-all shadow-lg ${loading ? 'bg-orange-300 text-white cursor-not-allowed' : 'bg-orange-500 text-white shadow-orange-200 hover:bg-orange-600 active:scale-[0.98]'}`}
              >
                {loading ? 'GENERATING...' : 'GENERATE KUNDLI'}
              </button>
            </div>
          </form>
        </div>

        {result && result.error && (
          <div className="bg-red-50 text-red-600 text-center py-6 rounded-2xl font-bold border border-red-100 animate-fade-in mb-8">
            {result.error}
          </div>
        )}

        {result && !result.error && (
          <div className="relative animate-fade-in">
            <div className="flex justify-end mb-4">
              <button 
                onClick={handleDownload}
                className="flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-xl font-bold text-[14px] hover:bg-orange-200 transition-colors"
              >
                <FiDownload size={18} /> Download Kundli
              </button>
            </div>
            
            <div ref={kundliRef} className="bg-[#FFFDF9] rounded-2xl sm:rounded-[32px] p-4 sm:p-8 shadow-sm border border-orange-100/50">
              <h2 className="text-[22px] font-bold text-gray-900 mb-8 text-center">Kundli for {result.name}</h2>
              
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
                <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-orange-50/50 text-center flex flex-col justify-center items-center h-[100px]">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em] mb-2">Ascendant</p>
                  <p className="font-bold text-orange-600 text-[18px]">{result.ascendant}</p>
                </div>
                <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-orange-50/50 text-center flex flex-col justify-center items-center h-[100px]">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em] mb-2">Moon Sign</p>
                  <p className="font-bold text-orange-600 text-[18px]">{result.moonSign}</p>
                </div>
                <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-orange-50/50 text-center flex flex-col justify-center items-center h-[100px]">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em] mb-2">Nakshatra</p>
                  <p className="font-bold text-orange-600 text-[18px] leading-tight">{result.nakshatra}</p>
                </div>
                <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-orange-50/50 text-center flex flex-col justify-center items-center h-[100px]">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em] mb-2">Manglik Dosh</p>
                  <p className={`font-bold text-[18px] ${result.isManglik ? 'text-red-500' : 'text-green-500'}`}>{result.isManglik ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {result.chartSvg && (
                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-orange-50/50 mb-8 flex flex-col items-center justify-center overflow-hidden">
                  <h3 className="font-bold text-gray-800 text-[15px] mb-4 w-full text-center">Lagna Chart (D1)</h3>
                  <div 
                    dangerouslySetInnerHTML={{ __html: makeSvgResponsive(result.chartSvg) }} 
                    className="w-full flex justify-center items-center"
                  />
                </div>
              )}

              <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-orange-50/50">
                <h3 className="font-bold text-gray-800 text-[15px] mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-[12px]">✨</span>
                  Astrological Summary
                </h3>
                <p className="text-gray-500 text-[14px] leading-[1.7]">{result.summary}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Kundli;
