import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FiArrowLeft, 
  FiCheck, 
  FiAlertTriangle 
} from 'react-icons/fi';
import { getMuhurat } from '../../api/userApis';

const Muhurat = () => {
  const navigate = useNavigate();
  const { openSidebar } = useOutletContext();
  const { user } = useSelector((state) => state.auth);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMuhurat = async () => {
      try {
        const res = await getMuhurat();
        setResult(res.data?.data || res.data);
        setLoading(false);
      } catch (error) {
        console.error(error);
        // Fallback data if API is not yet connected
        setTimeout(() => {
          setResult([
            { name: 'Abhijit Muhurat', time: '11:45 AM - 12:30 PM', isGood: true },
            { name: 'Amrit Kaal', time: '02:15 PM - 03:50 PM', isGood: true },
            { name: 'Brahma Muhurat', time: '04:30 AM - 05:18 AM', isGood: true },
            { name: 'Rahu Kaal', time: '10:30 AM - 12:00 PM', isGood: false },
            { name: 'Yama Gandam', time: '03:00 PM - 04:30 PM', isGood: false },
          ]);
          setLoading(false);
        }, 1000);
      }
    };
    fetchMuhurat();
  }, []);

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
          <span className="text-gray-900 font-bold text-[18px] tracking-tight">Shubh Muhurat</span>
        </div>
        <div 
          onClick={openSidebar}
          className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center overflow-hidden border border-orange-100 cursor-pointer shrink-0 transition-transform active:scale-95 shadow-sm"
        >
          {user?.avatar ? (
            <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-orange-500 font-bold text-sm">{(user?.name || 'G')[0]}</span>
          )}
        </div>
      </div>

      {/* ═══ HERO BANNER ═══ */}
      <div className="relative overflow-hidden bg-gradient-to-tr from-[#ff8c00] via-[#f97316] to-[#ec4899] text-white pt-8 pb-14 px-6 rounded-b-[36px] shadow-lg shadow-orange-100/50">
        <div className="absolute top-0 right-0 w-44 h-44 bg-white/10 rounded-full blur-2xl -translate-y-6 translate-x-6 pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="max-w-xl mx-auto text-center relative z-10">
          <span className="bg-white/20 backdrop-blur-md text-[11px] font-bold tracking-wider uppercase px-3.5 py-1 rounded-full border border-white/10 shadow-sm inline-block mb-3.5">
            ⌛ Cosmic Timings
          </span>
          <h1 className="text-[32px] font-extrabold tracking-tight leading-tight mb-2">Today's Muhurats</h1>
          <p className="text-white/85 text-[13px] font-medium max-w-sm mx-auto leading-relaxed">
            Find the most auspicious times (Shubh Muhurat) to begin investments, purchases, or new ventures.
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-5">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-4" />
            <p className="text-gray-500 font-bold text-[14px]">Consulting panchang charts...</p>
          </div>
        ) : result ? (
          <div className="relative -mt-7 z-20 space-y-4">
            {result.map((muhurat, i) => (
              <div 
                key={i} 
                className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_8px_20px_rgba(0,0,0,0.01)] hover:shadow-md ${
                  muhurat.isGood 
                    ? 'bg-gradient-to-r from-emerald-50/50 to-white border-emerald-100 hover:border-emerald-200' 
                    : 'bg-gradient-to-r from-rose-50/50 to-white border-rose-100 hover:border-rose-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                    muhurat.isGood ? 'bg-emerald-100/50 text-emerald-600' : 'bg-rose-100/50 text-rose-500'
                  }`}>
                    {muhurat.isGood ? <FiCheck size={22} strokeWidth={2.5} /> : <FiAlertTriangle size={22} strokeWidth={2.5} />}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-[15px] mb-1 tracking-tight">{muhurat.name}</h3>
                    <p className="text-gray-500 text-[12.5px] leading-relaxed">
                      {muhurat.isGood ? 'Highly favorable time to start new endeavors.' : 'Avoid starting new tasks or making critical decisions.'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className={`text-[10px] font-extrabold uppercase tracking-wide px-3 py-1.5 rounded-full border shadow-sm ${
                    muhurat.isGood 
                      ? 'bg-white border-emerald-100 text-emerald-600' 
                      : 'bg-white border-rose-100 text-rose-500'
                  }`}>
                    {muhurat.isGood ? 'Auspicious' : 'Inauspicious'}
                  </span>
                  <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100 shrink-0">
                    <p className="text-[14.5px] font-black text-gray-805">{muhurat.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Muhurat;
