import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FiArrowLeft, 
  FiSunrise, 
  FiSunset, 
  FiCalendar, 
  FiMoon, 
  FiActivity, 
  FiCompass, 
  FiAlertTriangle,
  FiClock
} from 'react-icons/fi';
import { getPanchang } from '../../api/userApis';

const Panchang = () => {
  const navigate = useNavigate();
  const { openSidebar } = useOutletContext();
  const { user } = useSelector((state) => state.auth);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPanchang = async () => {
      try {
        const res = await getPanchang();
        setResult(res.data?.data || res.data);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setResult({ error: 'Failed to fetch Panchang. Please try again later.' });
        setLoading(false);
      }
    };
    fetchPanchang();
  }, []);

  const getFormattedDate = () => {
    const options = { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  return (
    <div className="w-full bg-[#fafafc] min-h-screen font-sans pb-28">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between px-5 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-gray-100">
        <div className="flex items-center">
          <button 
            onClick={() => navigate(-1)} 
            className="text-gray-800 hover:bg-gray-100 p-2 rounded-full transition-colors mr-2.5"
          >
            <FiArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <span className="text-gray-900 font-bold text-[18px] tracking-tight">Daily Panchang</span>
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
            ✨ Vedic Insights
          </span>
          <h1 className="text-[32px] font-extrabold tracking-tight leading-tight mb-2">Today's Energy</h1>
          <p className="text-white/85 text-[13px] font-medium max-w-sm mx-auto leading-relaxed">
            Align your schedule with ancient cosmic principles. Plan your day with Nakshatra, Tithi & Muhurat.
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-4" />
            <p className="text-gray-500 font-bold text-[14px]">Syncing with stars...</p>
          </div>
        ) : result && result.error ? (
          <div className="bg-red-50 text-red-600 text-center py-6 rounded-3xl font-bold border border-red-100 animate-fade-in mt-8 shadow-sm">
            {result.error}
          </div>
        ) : result ? (
          <div className="relative -mt-7 z-20">
            
            {/* ═══ SUNRISE / SUNSET FLOATING CARD ═══ */}
            <div className="bg-white/95 backdrop-blur-xl border border-white/60 rounded-3xl p-5 shadow-[0_16px_36px_rgba(249,115,22,0.08)] flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-inner">
                  <FiSunrise size={22} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Sunrise</span>
                  <span className="text-[16px] font-extrabold text-gray-800">{result.sunrise}</span>
                </div>
              </div>

              <div className="flex flex-col items-center px-2">
                <span className="text-[12px] font-extrabold text-[#fa6830] bg-orange-50 px-3 py-1 rounded-full border border-orange-100/50 shadow-sm">
                  {getFormattedDate()}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex flex-col text-right">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Sunset</span>
                  <span className="text-[16px] font-extrabold text-gray-800">{result.sunset}</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-inner">
                  <FiSunset size={22} strokeWidth={2.5} />
                </div>
              </div>
            </div>

            {/* ═══ COSMIC ELEMENTS GRID ═══ */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              
              {/* Tithi */}
              <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-[0_8px_20px_rgba(0,0,0,0.02)] hover:border-orange-200/60 transition-all hover:shadow-md group cursor-pointer flex flex-col gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#ff8c00] flex items-center justify-center group-hover:scale-105 transition-transform shadow-inner">
                  <FiCalendar size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Tithi</span>
                  <span className="text-[15px] font-extrabold text-gray-800 leading-snug block truncate capitalize">{result.tithi}</span>
                </div>
              </div>

              {/* Nakshatra */}
              <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-[0_8px_20px_rgba(0,0,0,0.02)] hover:border-purple-200/60 transition-all hover:shadow-md group cursor-pointer flex flex-col gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center group-hover:scale-105 transition-transform shadow-inner">
                  <FiMoon size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Nakshatra</span>
                  <span className="text-[15px] font-extrabold text-gray-800 leading-snug block truncate capitalize">{result.nakshatra}</span>
                </div>
              </div>

              {/* Yoga */}
              <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-[0_8px_20px_rgba(0,0,0,0.02)] hover:border-blue-200/60 transition-all hover:shadow-md group cursor-pointer flex flex-col gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-105 transition-transform shadow-inner">
                  <FiActivity size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Yoga</span>
                  <span className="text-[15px] font-extrabold text-gray-800 leading-snug block truncate capitalize">{result.yoga}</span>
                </div>
              </div>

              {/* Karana */}
              <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-[0_8px_20px_rgba(0,0,0,0.02)] hover:border-emerald-200/60 transition-all hover:shadow-md group cursor-pointer flex flex-col gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-105 transition-transform shadow-inner">
                  <FiCompass size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Karana</span>
                  <span className="text-[15px] font-extrabold text-gray-800 leading-snug block truncate capitalize">{result.karana}</span>
                </div>
              </div>

            </div>

            {/* ═══ INAUSPICIOUS RAHU KAAL CARD ═══ */}
            <div className="bg-gradient-to-r from-rose-50 to-red-50/50 border border-red-100 p-5 rounded-3xl flex items-center gap-4 shadow-sm hover:shadow transition-shadow">
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center shrink-0 border border-red-100 shadow-inner">
                <FiAlertTriangle size={24} strokeWidth={2.5} className="animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block mb-0.5">Rahu Kaal (Avoid New Tasks)</span>
                <span className="text-[18px] font-extrabold text-red-600 block leading-tight">
                  {typeof result.rahuKaal === 'object' && result.rahuKaal
                    ? `${result.rahuKaal.start} - ${result.rahuKaal.end}`
                    : result.rahuKaal}
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-red-100/50 rounded-full border border-red-200 text-red-700 text-xs font-bold shrink-0 uppercase tracking-wide">
                <FiClock size={12} strokeWidth={3} /> Inauspicious
              </div>
            </div>

            {/* ═══ MOTIVATIONAL CARD ═══ */}
            <div className="mt-6 bg-gradient-to-tr from-slate-900 to-indigo-950 text-white rounded-3xl p-5 shadow-md flex items-center justify-between gap-4 overflow-hidden relative">
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex-1 relative z-10">
                <h4 className="font-bold text-[15px] mb-1">Make Auspicious Decisions 🪐</h4>
                <p className="text-white/80 text-[12px] font-medium leading-normal">
                  Want to find the best mahurat for marriages, properties or investments? Our verified astrologers are here to guide you.
                </p>
              </div>
              <button 
                onClick={() => navigate('/user/astrologers')}
                className="bg-white text-indigo-950 font-bold px-4 py-2.5 rounded-full text-xs shrink-0 shadow hover:bg-orange-50 transition-colors active:scale-95"
              >
                TALK NOW
              </button>
            </div>

          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Panchang;
