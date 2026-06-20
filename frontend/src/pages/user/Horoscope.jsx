import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FiArrowLeft, 
  FiHeart, 
  FiBriefcase, 
  FiCreditCard, 
  FiActivity, 
  FiNavigation 
} from 'react-icons/fi';
import { getHoroscope } from '../../api/userApis';

const Horoscope = () => {
  const navigate = useNavigate();
  const { openSidebar } = useOutletContext();
  const { user } = useSelector((state) => state.auth);
  const [selectedSign, setSelectedSign] = useState('Aries');
  const [selectedDay, setSelectedDay] = useState('Today');
  const [selectedPeriod, setSelectedPeriod] = useState('Weekly Horoscope');
  const [horoscopeData, setHoroscopeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHoroscope = async () => {
      setLoading(true);
      try {
        const res = await getHoroscope({ sign: selectedSign, period: selectedDay.toLowerCase() });
        setHoroscopeData(res.data?.data || res.data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch horoscope:", error);
        setHoroscopeData(null);
        setLoading(false);
      }
    };
    fetchHoroscope();
  }, [selectedSign, selectedDay]);

  const signs = [
    { name: 'Aries', icon: '♈', image: '/zodiac/horoscope-01.webp' },
    { name: 'Taurus', icon: '♉', image: '/zodiac/horoscope-02.webp' },
    { name: 'Gemini', icon: '♊', image: '/zodiac/horoscope-03.webp' },
    { name: 'Cancer', icon: '♋', image: '/zodiac/horoscope-04.webp' },
    { name: 'Leo', icon: '♌', image: '/zodiac/horoscope-05.webp' },
    { name: 'Virgo', icon: '♍', image: '/zodiac/horoscope-06.webp' },
    { name: 'Libra', icon: '♎', image: '/zodiac/horoscope-07.webp' },
    { name: 'Scorpio', icon: '♏', image: '/zodiac/horoscope-08.webp' },
    { name: 'Sagittarius', icon: '♐', image: '/zodiac/horoscope-09.webp' },
    { name: 'Capricorn', icon: '♑', image: '/zodiac/horoscope-10.webp' },
    { name: 'Aquarius', icon: '♒', image: '/zodiac/horoscope-11.webp' },
    { name: 'Pisces', icon: '♓', image: '/zodiac/horoscope-12.webp' },
  ];

  return (
    <div className="w-full min-h-screen bg-[#fafafc] font-sans pb-32">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between px-5 py-4 bg-white/85 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/user/home')} 
            className="text-gray-800 hover:bg-gray-100 p-2 rounded-full transition-colors -ml-1"
          >
            <FiArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <span className="text-gray-900 font-bold text-[18px] tracking-tight">Daily Horoscope</span>
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

      {/* ═══ ZODIAC STORIES CAROUSEL ═══ */}
      <div className="flex overflow-x-auto gap-5 px-5 py-5 no-scrollbar bg-white border-b border-gray-100">
        {signs.map((sign) => (
          <div 
            key={sign.name} 
            onClick={() => setSelectedSign(sign.name)}
            className="flex flex-col items-center gap-2 cursor-pointer shrink-0 group"
          >
            <div className={`w-[66px] h-[66px] rounded-full flex items-center justify-center p-[2px] transition-all duration-305 ${selectedSign === sign.name ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 shadow-md scale-105' : 'bg-transparent hover:bg-orange-100'}`}>
              <div className="w-full h-full rounded-full overflow-hidden bg-orange-50 flex items-center justify-center text-3xl border-2 border-white shadow-inner">
                {sign.icon}
              </div>
            </div>
            <span className={`text-[11px] font-bold tracking-tight transition-colors duration-300 ${selectedSign === sign.name ? 'text-orange-600 scale-105' : 'text-gray-500'}`}>
              {sign.name}
            </span>
          </div>
        ))}
      </div>

      <div className="px-5 py-6 max-w-xl mx-auto">
        {/* ═══ DAY TABS ═══ */}
        <div className="flex rounded-2xl bg-orange-50/50 p-1.5 border border-orange-100/50 mb-6 shadow-inner">
          {['Yesterday', 'Today', 'Tomorrow'].map((day) => (
            <button 
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-1 py-2.5 text-[13px] font-bold rounded-xl transition-all duration-300 ${selectedDay === day ? 'bg-white shadow-md text-orange-600 scale-[1.02]' : 'text-gray-500 hover:text-gray-800'}`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* ═══ HIGHLIGHT CARD ═══ */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-3" />
            <p className="text-gray-400 font-bold text-xs tracking-wider uppercase">Aligning constellations...</p>
          </div>
        ) : !horoscopeData ? (
          <div className="bg-orange-50 text-orange-600 text-center py-10 rounded-3xl font-bold border border-orange-100 mb-8 shadow-sm">
            Horoscope data is currently unavailable. Please try again later.
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-tr from-[#ff8c00] via-[#f97316] to-[#ec4899] rounded-[32px] p-6 relative overflow-hidden shadow-lg shadow-orange-100/50 mb-8">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
              
              <div className="text-center mb-5 relative z-10">
                <span className="bg-white/20 backdrop-blur-md text-[10px] font-extrabold tracking-widest uppercase px-3.5 py-1 rounded-full border border-white/10 shadow-sm inline-block text-orange-50">
                  {horoscopeData?.date || 'Today'}
                </span>
              </div>
              
              <h2 className="text-white text-[22px] font-extrabold mb-6 relative z-10 w-2/3 leading-tight tracking-tight drop-shadow-sm">Your Daily Horoscope is Ready!</h2>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-5 relative z-10 w-2/3">
                <div>
                  <p className="text-orange-100/80 text-[10px] font-bold uppercase tracking-wider mb-1">Lucky Colors</p>
                  <div className="flex gap-1.5 mt-1">
                    {(horoscopeData?.luckyColors || ['#ff8c00', '#fbbf24']).map((color, i) => (
                      <div key={i} className="w-5.5 h-5.5 rounded-full shadow-sm border border-white/30" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-orange-100/80 text-[10px] font-bold uppercase tracking-wider mb-1">Mood</p>
                  <span className="text-2xl drop-shadow-sm leading-none block mt-0.5">{horoscopeData?.mood || '🤩'}</span>
                </div>
                <div>
                  <p className="text-orange-100/80 text-[10px] font-bold uppercase tracking-wider mb-1">Lucky Number</p>
                  <p className="text-white font-black text-[24px] leading-none drop-shadow-sm mt-0.5">{horoscopeData?.luckyNumber || '9'}</p>
                </div>
                <div>
                  <p className="text-orange-100/80 text-[10px] font-bold uppercase tracking-wider mb-1">Lucky Time</p>
                  <p className="text-white font-extrabold text-[14px] drop-shadow-sm mt-1">{horoscopeData?.luckyTime || '06:15 PM'}</p>
                </div>
              </div>

              <div className="absolute right-[-24px] top-1/2 -translate-y-1/2 w-44 h-44 pointer-events-none">
                <div className="absolute inset-0 rounded-full border-2 border-white/10 border-t-white/40 transform rotate-45" />
                <div className="w-32 h-32 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/95 rounded-full shadow-xl border-4 border-orange-200/50 flex items-center justify-center text-7xl text-orange-500 font-bold z-10">
                  {signs.find(s => s.name === selectedSign)?.icon || '♈'}
                </div>
              </div>
            </div>

            {/* ═══ CATEGORIES ═══ */}
            <h2 className="text-[17px] font-extrabold text-gray-900 mb-4 tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-4.5 bg-orange-500 rounded-sm inline-block" /> Daily Prediction Insights
            </h2>

            <div className="space-y-4 mb-8">
              {[
                { id: 'love', label: 'Love & Relationship', icon: FiHeart, color: 'text-rose-500', bg: 'bg-rose-50/50', border: 'hover:border-rose-200/60' },
                { id: 'career', label: 'Career & Work', icon: FiBriefcase, color: 'text-amber-500', bg: 'bg-amber-50/50', border: 'hover:border-amber-200/60' },
                { id: 'money', label: 'Finance & Money', icon: FiCreditCard, color: 'text-emerald-500', bg: 'bg-emerald-50/50', border: 'hover:border-emerald-200/60' },
                { id: 'health', label: 'Health & Wellness', icon: FiActivity, color: 'text-blue-500', bg: 'bg-blue-50/50', border: 'hover:border-blue-200/60' },
                { id: 'travel', label: 'Travel & Fun', icon: FiNavigation, color: 'text-purple-500', bg: 'bg-purple-50/50', border: 'hover:border-purple-200/60' }
              ].map((cat) => (
                <div key={cat.id} className={`bg-white border border-gray-100 rounded-3xl p-5 relative overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.02)] transition-all duration-300 ${cat.border} hover:shadow-md flex flex-col gap-3 group`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl ${cat.bg} ${cat.color} flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform`}>
                        <cat.icon size={18} strokeWidth={2.5} />
                      </div>
                      <span className="text-[14px] font-extrabold text-gray-800">{cat.label}</span>
                    </div>
                    <span className="text-orange-500 font-extrabold text-[12px] bg-orange-50 px-3 py-1 rounded-full border border-orange-100/50 shadow-sm">
                      {horoscopeData?.[cat.id]?.score || '100%'}
                    </span>
                  </div>
                  <p className="text-gray-655 text-[13px] leading-relaxed pl-1">
                    {horoscopeData?.[cat.id]?.text || 'Today holds unique opportunities in this aspect.'}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ═══ QUOTE OF THE DAY ═══ */}
        <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 text-white rounded-3xl p-6 relative overflow-hidden mb-8 border border-white/5 shadow-md">
          <div className="absolute top-0 right-0 bg-gradient-to-l from-[#ff8c00] to-[#f97316] text-white text-[9px] font-bold px-3.5 py-1.5 rounded-bl-2xl tracking-wider uppercase">
            Quote of the Day
          </div>
          <div className="flex items-center gap-2 mb-3.5">
            <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center text-[10px] font-extrabold text-orange-300 border border-white/5 shadow-inner">
              ✨
            </div>
            <span className="text-orange-200/80 text-[12px] font-bold">Cosmic Wisdom</span>
          </div>
          
          <h3 className="text-white text-[16px] font-semibold leading-relaxed mb-3.5 tracking-wide">
            "Your stars do not dictate your path; they simply light the possibilities."
          </h3>
          <p className="text-orange-200/60 text-[12px] font-medium">— Cosmic Guide</p>
        </div>

        {/* ═══ WEEKLY/MONTHLY/YEARLY TABS ═══ */}
        <h2 className="text-[17px] font-extrabold text-gray-900 mb-4 tracking-tight flex items-center gap-2">
          <span className="w-2.5 h-4.5 bg-orange-500 rounded-sm inline-block" /> Explore Other Timeframes
        </h2>
        <div className="flex rounded-2xl bg-orange-50/50 p-1.5 border border-orange-100/50 mb-6 shadow-inner">
          {['Weekly', 'Monthly', 'Yearly'].map((p) => (
            <button 
              key={p}
              onClick={() => setSelectedPeriod(`${p} Horoscope`)}
              className={`flex-1 py-2.5 text-[13px] font-bold rounded-xl transition-all duration-300 ${selectedPeriod === `${p} Horoscope` ? 'bg-white shadow-md text-orange-600 scale-[1.02]' : 'text-gray-500 hover:text-gray-800'}`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="bg-white border border-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.03)] rounded-3xl p-6 mb-8 hover:border-orange-200/50 transition-colors">
          <h3 className="text-center text-[17px] font-extrabold text-gray-900 mb-2 tracking-tight">{selectedSign} {selectedPeriod}</h3>
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-[1.5px] w-6 bg-orange-200" />
            <span className="text-[11px] font-extrabold text-orange-500 uppercase tracking-widest">
              {selectedPeriod.includes('Weekly') ? horoscopeData?.alsoCheck?.weekly?.date : selectedPeriod.includes('Monthly') ? horoscopeData?.alsoCheck?.monthly?.date : horoscopeData?.alsoCheck?.yearly?.date}
            </span>
            <div className="h-[1.5px] w-6 bg-orange-200" />
          </div>

          <h4 className="text-[14px] font-extrabold text-gray-800 mb-1.5">Overview</h4>
          <p className="text-gray-600 text-[13px] leading-relaxed mb-5">
            {selectedPeriod.includes('Weekly') 
              ? horoscopeData?.alsoCheck?.weekly?.overview 
              : selectedPeriod.includes('Monthly') ? horoscopeData?.alsoCheck?.monthly?.overview : horoscopeData?.alsoCheck?.yearly?.overview}
          </p>

          <h4 className="text-[14px] font-extrabold text-gray-800 mb-1.5">Love & Relationships</h4>
          <p className="text-gray-600 text-[13px] leading-relaxed">
            {selectedPeriod.includes('Weekly') 
              ? horoscopeData?.alsoCheck?.weekly?.love 
              : selectedPeriod.includes('Monthly') ? horoscopeData?.alsoCheck?.monthly?.love : horoscopeData?.alsoCheck?.yearly?.love}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Horoscope;
