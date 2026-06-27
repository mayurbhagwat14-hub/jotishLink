import { useState, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { 
  FiArrowLeft, 
  FiDownload,
  FiSunrise,
  FiMoon,
  FiCalendar,
  FiAlertTriangle
} from 'react-icons/fi';
import { useSelector, useDispatch } from 'react-redux';
import LocationAutocomplete from '../../components/LocationAutocomplete';
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
    <div className="w-full bg-[#fafafc] min-h-screen font-sans pb-32">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between px-5 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-gray-100">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/user/home')} 
            className="text-gray-800 hover:bg-gray-100 p-2 rounded-full transition-colors mr-2.5"
          >
            <FiArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <span className="text-gray-900 font-bold text-[18px] tracking-tight">Free Kundli</span>
        </div>
        <div 
          onClick={openSidebar}
          className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center overflow-hidden border border-orange-100 cursor-pointer shrink-0 transition-transform active:scale-95 shadow-sm"
        >
          {user?.avatar ? (
            <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[#fa6830] font-bold text-sm">{(user?.name || 'G')[0]}</span>
          )}
        </div>
      </div>

      {/* ═══ HERO BANNER ═══ */}
      <div className="relative overflow-hidden bg-gradient-to-tr from-[#ff8c00] via-[#f97316] to-[#ec4899] text-white pt-8 pb-14 px-6 rounded-b-[36px] shadow-lg shadow-orange-100/50">
        <div className="absolute top-0 right-0 w-44 h-44 bg-white/10 rounded-full blur-2xl -translate-y-6 translate-x-6 pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="max-w-xl mx-auto text-center relative z-10">
          <span className="bg-white/20 backdrop-blur-md text-[11px] font-bold tracking-wider uppercase px-3.5 py-1 rounded-full border border-white/10 shadow-sm inline-block mb-3.5">
            🌌 Cosmic Blueprints
          </span>
          <h1 className="text-[32px] font-extrabold tracking-tight leading-tight mb-2">Generate Your Kundli</h1>
          <p className="text-white/85 text-[13px] font-medium max-w-sm mx-auto leading-relaxed">
            Uncover the positioning of the planets at the exact moment of your birth. Discover your destiny.
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-5">
        <div className="relative -mt-7 z-20">
          
          {/* ═══ INPUT FORM CARD ═══ */}
          <div className="bg-white rounded-3xl shadow-[0_16px_36px_rgba(249,115,22,0.06)] border border-gray-100 p-6 sm:p-7.5 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50/50 rounded-full blur-[40px] opacity-60 -z-10" />
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
                <input 
                  required type="text" 
                  placeholder="Enter your full name"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-200 focus:border-[#fa6830] rounded-2xl py-3.5 px-4 outline-none transition-all text-[15px] bg-[#fafafc] focus:bg-white shadow-sm" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Date of Birth</label>
                <input 
                  required 
                  type="date"
                  value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})}
                  className="w-full border border-gray-200 focus:border-[#fa6830] rounded-2xl py-3.5 px-4 outline-none transition-all text-[15px] bg-[#fafafc] focus:bg-white shadow-sm" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Time of Birth</label>
                <input 
                  required 
                  type="time" 
                  value={formData.timeOfBirth} onChange={e => setFormData({...formData, timeOfBirth: e.target.value})}
                  className="w-full border border-gray-200 focus:border-[#fa6830] rounded-2xl py-3.5 px-4 outline-none transition-all text-[15px] bg-[#fafafc] focus:bg-white shadow-sm" 
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Place of Birth</label>
                <LocationAutocomplete 
                  required 
                  placeholder="Enter city"
                  value={formData.placeOfBirth} 
                  onChange={e => setFormData({...formData, placeOfBirth: e.target.value})}
                  className="w-full border border-gray-200 focus:border-[#fa6830] rounded-2xl py-3.5 px-4 outline-none transition-all text-[15px] bg-[#fafafc] focus:bg-white shadow-sm" 
                />
              </div>
              
              <div className="col-span-1 md:col-span-2 mt-4">
                <button 
                  type="submit" disabled={loading}
                  className={`w-full py-4 rounded-2xl font-extrabold text-[15px] tracking-wide transition-all shadow-lg ${loading ? 'bg-orange-300 text-white cursor-not-allowed' : 'bg-[#fa6830] text-white shadow-orange-200 hover:bg-[#e55923] active:scale-[0.98]'}`}
                >
                  {loading ? 'GENERATING COSMIC BLUEPRINT...' : 'GENERATE KUNDLI'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {result && result.error && (
          <div className="bg-red-50 text-red-600 text-center py-6 rounded-3xl font-bold border border-red-100 animate-fade-in mb-8 shadow-sm">
            {result.error}
          </div>
        )}

        {result && !result.error && (
          <div className="relative animate-fade-in">
            <div className="flex justify-end mb-4">
              <button 
                onClick={handleDownload}
                className="flex items-center gap-2 bg-orange-50 border border-orange-100 text-[#e55923] px-4.5 py-2.5 rounded-2xl font-extrabold text-[13px] hover:bg-orange-100/70 transition-colors shadow-sm active:scale-95"
              >
                <FiDownload size={16} strokeWidth={2.5} /> Download Report
              </button>
            </div>
            
            <div ref={kundliRef} className="bg-white rounded-[32px] p-5 sm:p-7.5 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-gray-100">
              <h2 className="text-[22px] font-extrabold text-gray-900 mb-8 text-center tracking-tight flex items-center justify-center gap-2.5">
                <span className="text-2xl">📖</span> Kundli for {result.name}
              </h2>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white p-5 rounded-3xl border border-gray-100 text-center flex flex-col justify-center items-center shadow-[0_8px_20px_rgba(0,0,0,0.02)] group cursor-pointer hover:border-orange-200/60 transition-all duration-300">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-3 shadow-inner group-hover:scale-105 transition-transform">
                    <FiSunrise size={20} strokeWidth={2.5} />
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Ascendant</p>
                  <p className="font-extrabold text-gray-800 text-[16px]">{result.ascendant}</p>
                </div>
                
                <div className="bg-white p-5 rounded-3xl border border-gray-100 text-center flex flex-col justify-center items-center shadow-[0_8px_20px_rgba(0,0,0,0.02)] group cursor-pointer hover:border-purple-200/60 transition-all duration-300">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center mb-3 shadow-inner group-hover:scale-105 transition-transform">
                    <FiMoon size={20} strokeWidth={2.5} />
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Moon Sign</p>
                  <p className="font-extrabold text-gray-800 text-[16px]">{result.moonSign}</p>
                </div>
                
                <div className="bg-white p-5 rounded-3xl border border-gray-100 text-center flex flex-col justify-center items-center shadow-[0_8px_20px_rgba(0,0,0,0.02)] group cursor-pointer hover:border-emerald-200/60 transition-all duration-300">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-3 shadow-inner group-hover:scale-105 transition-transform">
                    <FiCalendar size={20} strokeWidth={2.5} />
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Nakshatra</p>
                  <p className="font-extrabold text-gray-800 text-[15px] leading-tight">{result.nakshatra}</p>
                </div>
                
                <div className="bg-white p-5 rounded-3xl border border-gray-100 text-center flex flex-col justify-center items-center shadow-[0_8px_20px_rgba(0,0,0,0.02)] group cursor-pointer hover:border-rose-200/60 transition-all duration-300">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 shadow-inner group-hover:scale-105 transition-transform ${result.isManglik ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                    <FiAlertTriangle size={20} strokeWidth={2.5} />
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Manglik Dosh</p>
                  <p className={`font-extrabold text-[16px] ${result.isManglik ? 'text-red-500' : 'text-green-500'}`}>{result.isManglik ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {result.chartSvg && (
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-[0_8px_20px_rgba(0,0,0,0.02)] mb-8 flex flex-col items-center justify-center overflow-hidden">
                  <h3 className="font-extrabold text-gray-900 text-[16px] mb-5 w-full text-center flex items-center justify-center gap-2">
                    <span className="w-2.5 h-4.5 bg-[#fa6830] rounded-sm inline-block" /> Lagna Chart (D1)
                  </h3>
                  <div 
                    dangerouslySetInnerHTML={{ __html: makeSvgResponsive(result.chartSvg) }} 
                    className="w-full flex justify-center items-center p-2 rounded-2xl bg-orange-50/10 border border-orange-100/50"
                  />
                </div>
              )}

              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-[0_8px_20px_rgba(0,0,0,0.02)]">
                <h3 className="font-extrabold text-gray-900 text-[16px] mb-3.5 flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-orange-50 text-[#fa6830] flex items-center justify-center text-[12px] shadow-inner">✨</span>
                  Astrological Summary
                </h3>
                <p className="text-gray-600 text-[13.5px] leading-relaxed pl-1">{result.summary}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Kundli;
