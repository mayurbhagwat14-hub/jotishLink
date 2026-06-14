import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiArrowLeft, FiHeart, FiBriefcase, FiCreditCard, FiActivity, FiNavigation } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
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
        const res = await getHoroscope({ sign: selectedSign, timeframe: selectedDay.toLowerCase() });
        setHoroscopeData(res.data);
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
    <div className="w-full min-h-screen bg-white font-sans pb-32">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between px-4 py-3 bg-white sticky top-0 z-50 shadow-sm border-b border-orange-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-800 hover:bg-gray-100 p-1.5 rounded-full transition-colors -ml-1.5">
            <FiArrowLeft size={20} />
          </button>
          <h1 className="text-[17px] font-semibold text-gray-800">Daily Horoscope</h1>
        </div>
        <div className="flex items-center gap-3">
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
      </div>

      {/* ═══ ZODIAC CAROUSEL ═══ */}
      <div className="flex overflow-x-auto gap-5 px-4 py-5 no-scrollbar bg-white border-b border-gray-50">
        {signs.map((sign) => (
          <div 
            key={sign.name} 
            onClick={() => setSelectedSign(sign.name)}
            className="flex flex-col items-center gap-2 cursor-pointer shrink-0 group"
          >
            <div className={`w-[60px] h-[60px] rounded-full flex items-center justify-center p-[2px] transition-colors ${selectedSign === sign.name ? 'bg-orange-500' : 'bg-transparent group-hover:bg-orange-200'}`}>
              <div className="w-full h-full rounded-full overflow-hidden bg-orange-50 flex items-center justify-center text-2xl border-2 border-white">
                {sign.icon}
              </div>
            </div>
            <span className={`text-[12px] font-semibold transition-colors ${selectedSign === sign.name ? 'text-orange-600' : 'text-gray-600'}`}>
              {sign.name}
            </span>
          </div>
        ))}
      </div>

      <div className="px-4 py-5 max-w-xl mx-auto">
        {/* ═══ DAY TABS ═══ */}
        <div className="flex rounded-xl bg-orange-50/50 p-1 border border-orange-100 mb-6">
          {['Yesterday', 'Today', 'Tomorrow'].map((day) => (
            <button 
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all ${selectedDay === day ? 'bg-white shadow-sm text-orange-500' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* ═══ HIGHLIGHT CARD ═══ */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : !horoscopeData ? (
          <div className="bg-orange-50 text-orange-600 text-center py-10 rounded-2xl font-bold border border-orange-100 mb-8">
            Horoscope data is currently unavailable. Please try again later.
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-br from-orange-500 to-orange-400 rounded-3xl p-6 relative overflow-hidden shadow-lg mb-8">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-600/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
              
              <div className="text-center mb-5 relative z-10">
                <span className="text-orange-100 text-[11px] tracking-widest font-bold uppercase">—— {horoscopeData?.date || 'Loading...'} ——</span>
              </div>
              
              <h2 className="text-white text-[20px] font-bold mb-6 relative z-10 w-2/3 leading-tight">Your Daily horoscope is ready!</h2>
              
              <div className="grid grid-cols-2 gap-y-5 relative z-10 w-2/3">
                <div>
                  <p className="text-orange-100 text-[11px] font-bold uppercase tracking-wider mb-1.5">Lucky Colours</p>
                  <div className="flex gap-2">
                    {(horoscopeData?.luckyColors || ['#f97316', '#fbbf24']).map((color, i) => (
                      <div key={i} className="w-5 h-5 rounded-full shadow-sm border border-white/30" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-orange-100 text-[11px] font-bold uppercase tracking-wider mb-1.5">Mood</p>
                  <span className="text-2xl drop-shadow-sm">{horoscopeData?.mood || '🤩'}</span>
                </div>
                <div>
                  <p className="text-orange-100 text-[11px] font-bold uppercase tracking-wider mb-1.5">Lucky Number</p>
                  <p className="text-white font-black text-[22px] drop-shadow-sm">{horoscopeData?.luckyNumber || '9'}</p>
                </div>
                <div>
                  <p className="text-orange-100 text-[11px] font-bold uppercase tracking-wider mb-1.5">Lucky Time</p>
                  <p className="text-white font-bold text-[16px] drop-shadow-sm mt-1">{horoscopeData?.luckyTime || '06:15 PM'}</p>
                </div>
              </div>

              <div className="absolute right-[-20px] top-1/2 -translate-y-1/2 w-40 h-40">
                <div className="absolute inset-0 rounded-full border-2 border-white/20 border-t-white/60 transform rotate-45" />
                <div className="w-28 h-28 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow-lg border-4 border-orange-300 flex items-center justify-center text-6xl text-orange-500 font-bold z-10">
                  {signs.find(s => s.name === selectedSign)?.icon || '♈'}
                </div>
              </div>
            </div>

            {/* ═══ CATEGORIES ═══ */}
            <h2 className="text-[17px] font-bold text-gray-800 mb-4">Daily Horoscope</h2>

            <div className="space-y-4 mb-8">
              {[
                { id: 'love', label: 'Love', icon: FiHeart, color: 'text-pink-500' },
                { id: 'career', label: 'Career', icon: FiBriefcase, color: 'text-orange-500' },
                { id: 'money', label: 'Money', icon: FiCreditCard, color: 'text-green-500' },
                { id: 'health', label: 'Health', icon: FiActivity, color: 'text-blue-500' },
                { id: 'travel', label: 'Travel', icon: FiNavigation, color: 'text-purple-500' }
              ].map((cat) => (
                <div key={cat.id} className="bg-white border border-gray-100 rounded-2xl p-5 relative overflow-hidden shadow-card">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <cat.icon className={cat.color} size={18} />
                      <span className="text-[15px] font-bold text-gray-800">{cat.label}</span>
                    </div>
                    <span className="text-orange-500 font-bold text-[13px] bg-orange-50 px-2.5 py-0.5 rounded-full">
                      {horoscopeData?.[cat.id]?.score || '100%'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-[13px] leading-relaxed">
                    {horoscopeData?.[cat.id]?.text || 'Loading...'}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ═══ QUOTE OF THE DAY ═══ */}
        <div className="bg-gray-900 rounded-2xl p-6 relative overflow-hidden mb-8 border border-orange-200/20 shadow-lg">
          <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-wider uppercase">
            Quote of the Day
          </div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-[12px] font-bold text-white shadow-sm">
              A
            </div>
            <span className="text-orange-50 text-[12px] font-semibold">JyotishLink</span>
          </div>
          
          <h3 className="text-white text-[16px] font-medium leading-relaxed mb-3">
            "Life shrinks or expands in proportion to one's courage."
          </h3>
          <p className="text-orange-200/60 text-[12px]">- Anais Nin</p>
        </div>

        {/* ═══ WEEKLY/MONTHLY ═══ */}
        <h2 className="text-[17px] font-bold text-gray-800 mb-4">Also Check</h2>
        <div className="flex rounded-xl bg-orange-50/50 p-1 border border-orange-100 mb-6">
          {['Weekly', 'Monthly', 'Yearly'].map((period) => (
            <button 
              key={period}
              onClick={() => setSelectedPeriod(`${period} Horoscope`)}
              className={`flex-1 py-2.5 text-[13px] font-bold rounded-lg transition-all ${selectedPeriod === `${period} Horoscope` ? 'bg-white shadow-sm text-orange-500' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {period}
            </button>
          ))}
        </div>

        <div className="bg-white border border-gray-100 shadow-card rounded-2xl p-5 mb-8">
          <h3 className="text-center text-[16px] font-bold text-gray-900 mb-2">{selectedSign} {selectedPeriod}</h3>
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-[1px] w-8 bg-orange-200" />
            <span className="text-[11px] font-bold text-orange-500 uppercase tracking-widest">24 May - 30 May</span>
            <div className="h-[1px] w-8 bg-orange-200" />
          </div>

          <h4 className="text-[14px] font-bold text-gray-800 mb-2">Overview</h4>
          <p className="text-gray-600 text-[13px] leading-relaxed mb-5">
            {selectedSign}, the first sign of the zodiac, embodies the raw energy of new beginnings and fearless leadership. Ruled by Mars, the planet of action and courage, you are natural-born warriors...
          </p>

          <h4 className="text-[14px] font-bold text-gray-800 mb-2">Love & Relationships</h4>
          <p className="text-gray-600 text-[13px] leading-relaxed">
            Romance blazes brightly this week, with passionate energy infusing your love life. For coupled {selectedSign}, Monday through Wednesday bring opportunities to reignite the spark...
          </p>
        </div>
      </div>
    </div>
  );
};

export default Horoscope;
