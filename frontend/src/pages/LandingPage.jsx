import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMessageCircle, FiDownload, FiStar, FiPhone } from 'react-icons/fi';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className={`w-full font-sans transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>

      {/* ═══════════════════════════════════════ */}
      {/* MOBILE VIEW */}
      {/* ═══════════════════════════════════════ */}
      <div className="block lg:hidden w-full pb-20 bg-white">

        {/* Hero Section */}
        <div className="px-6 pt-12 pb-10 bg-gradient-to-b from-orange-50 to-white relative overflow-hidden flex flex-col items-center text-center">
          {/* Floating decorative dots */}
          <div className="absolute top-[10%] left-[15%] w-2 h-2 bg-orange-300 rounded-full animate-float opacity-40" />
          <div className="absolute top-[30%] right-[10%] w-3 h-3 bg-orange-200 rounded-full animate-float opacity-30" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-[20%] left-[8%] w-2 h-2 bg-orange-400 rounded-full animate-float opacity-20" style={{ animationDelay: '0.5s' }} />

          <div className="inline-flex items-center gap-2 bg-white px-5 py-2 rounded-full text-[12px] font-bold text-gray-700 shadow-card border border-orange-100 mb-8">
            <span className="text-orange-500 animate-pulse">✦</span> FIRST CHAT FREE • 24×7
          </div>

          <h1 className="text-[44px] leading-[1.1] font-bold text-gray-900 mb-5">
            Talk to<br />
            <span className="text-orange-500">Astrologers</span><br />
            right now.
          </h1>

          <p className="text-gray-500 text-[14px] mb-10 leading-relaxed px-2 max-w-sm">
            India's most-loved astrology platform. <strong className="text-gray-800">48,726+ verified astrologers</strong> in 13 languages.
          </p>

          <div className="flex w-full gap-3 mb-10 px-2 justify-center">
            <button
              onClick={() => navigate('/user/login')}
              className="flex-1 bg-orange-500 text-white font-bold py-4 px-4 rounded-2xl flex items-center justify-center gap-2 transition shadow-lg shadow-orange-200 hover:bg-orange-600 active:scale-95"
            >
              <FiMessageCircle size={18} /> Chat now
            </button>
            <button
              onClick={() => navigate('/user/login')}
              className="flex-1 bg-white text-gray-800 font-bold py-4 px-4 rounded-2xl flex items-center justify-center gap-2 border-2 border-orange-200 hover:bg-orange-50 transition shadow-sm active:scale-95"
            >
              <FiPhone size={18} /> Call now
            </button>
          </div>

          <div className="flex flex-col items-center gap-3 py-5 border-t border-orange-100 w-full max-w-sm">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <img key={i} className="w-10 h-10 rounded-full border-2 border-white object-cover" src={`https://i.pravatar.cc/100?img=${i}`} alt="user" />
              ))}
            </div>
            <div className="flex flex-col items-center text-sm">
              <div className="flex items-center gap-1.5 font-bold text-gray-800 text-[14px]">
                <FiStar className="text-orange-400 fill-orange-400" size={14} /> 4.7
                <span className="text-gray-400 font-normal text-[13px]">· 32M+ readings</span>
              </div>
              <div className="text-green-600 font-bold text-[11px] mt-1 flex items-center gap-1.5 bg-green-50 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> 50M+ Downloads
              </div>
            </div>
          </div>
        </div>

        {/* 100% Cashback Banner */}
        <div className="px-4 py-4">
          <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-5 flex justify-between items-center relative overflow-hidden shadow-lg">
            <div className="absolute right-[-20px] bottom-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="relative z-10">
              <h2 className="text-xl font-black text-white mb-1">100% CASHBACK!</h2>
              <p className="text-orange-100 text-[12px] mb-3">on your first recharge</p>
              <button className="bg-white text-orange-600 text-[11px] font-bold px-4 py-1.5 rounded-full shadow-sm">
                RECHARGE NOW
              </button>
            </div>
            <div className="relative z-10 w-20 h-20 flex items-center justify-center">
              <span className="text-5xl">👛</span>
            </div>
          </div>
        </div>



        {/* Quick Actions */}
        <div className="px-4 py-3 flex gap-3">
          <button onClick={() => navigate('/user/login')} className="flex-1 bg-orange-500 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-[13px] shadow-lg shadow-orange-200 transition hover:bg-orange-600">
            <FiMessageCircle size={16} /> Chat with Astrologer
          </button>
          <button onClick={() => navigate('/user/login')} className="flex-1 bg-orange-500 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-[13px] shadow-lg shadow-orange-200 transition hover:bg-orange-600">
            <FiPhone size={16} /> Call with Astrologer
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* DESKTOP VIEW */}
      {/* ═══════════════════════════════════════ */}
      <div className="hidden lg:block w-full bg-white min-h-screen text-gray-800">

        {/* Desktop Hero */}
        <div className="relative overflow-hidden pt-24 pb-32 px-10 flex items-center bg-gradient-to-br from-orange-50 via-white to-orange-50">
          <div className="flex-1 relative z-10 pr-10 pl-10 max-w-3xl">
            <h1 className="text-[72px] font-bold text-gray-900 mb-6 leading-[1.1] tracking-tight">
              Talk to <span className="text-orange-500">Astrologers</span><br /> right now.
            </h1>
            <p className="text-gray-500 text-[17px] max-w-xl mb-12 leading-relaxed">
              India's most-loved astrology platform. <strong className="text-gray-900">48,726+ verified astrologers</strong> in 13 languages. Instant chat, free kundli, honest answers.
            </p>
            <div className="flex gap-4">
              <button onClick={() => navigate('/user/login')} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-2xl flex items-center gap-2 transition shadow-lg shadow-orange-200">
                <FiMessageCircle size={20} /> Get Free Chat
              </button>
              <button className="bg-white hover:bg-orange-50 text-gray-800 font-bold py-4 px-8 rounded-2xl flex items-center gap-2 border-2 border-orange-200 transition shadow-sm">
                <FiDownload size={20} /> Download App
              </button>
            </div>
            <div className="flex items-center gap-4 mt-12">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <img key={i} className="w-12 h-12 rounded-full border-2 border-white object-cover" src={`https://i.pravatar.cc/100?img=${i}`} alt="user" />
                ))}
              </div>
              <div>
                <p className="font-bold text-gray-900 flex items-center gap-1 text-[15px]">
                  <FiStar className="text-orange-400 fill-orange-400" /> 4.7 · 120.2M+ customers
                </p>
                <p className="text-[13px] text-gray-400 mt-0.5">1326 Million+ chat/call minutes served</p>
              </div>
            </div>
          </div>

          {/* Hero Graphic */}
          <div className="flex-1 flex justify-center items-center relative z-10">
            <div className="relative w-[400px] h-[400px] border border-orange-200 rounded-full flex justify-center items-center">
              <div className="w-28 h-28 bg-gradient-to-br from-orange-500 to-orange-300 rounded-full shadow-[0_0_60px_rgba(251,146,60,0.5)] z-10" />
              <div className="absolute top-[10%] left-[15%] w-8 h-8 bg-orange-100 rounded-full shadow-sm border border-orange-200 flex items-center justify-center text-orange-500 font-serif">♈</div>
              <div className="absolute bottom-[20%] right-[10%] w-8 h-8 bg-orange-100 rounded-full shadow-sm border border-orange-200 flex items-center justify-center text-orange-500 font-serif">♏</div>
              <div className="absolute top-[40%] right-[5%] w-8 h-8 bg-orange-100 rounded-full shadow-sm border border-orange-200 flex items-center justify-center text-orange-500 font-serif">♋</div>
            </div>
          </div>
        </div>

        {/* Desktop Astrologer Cards */}
        <div className="px-10 py-24 max-w-[1400px] mx-auto">
          <h2 className="text-[44px] font-bold text-gray-900 mb-10 tracking-tight">13,000+ best astrologers, ready now.</h2>
          <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar">
            {[
              { name: 'Triansh', skills: 'Vedic, Face Reading, Tarot', lang: 'English, Hindi', exp: '4 years', price: '65', avatar: 'https://i.pravatar.cc/150?u=triansh' },
              { name: 'Manu', skills: 'Vedic, Vastu, Prashana', lang: 'Hindi, Sanskrit', exp: '8 years', price: '50', avatar: 'https://i.pravatar.cc/150?u=manu' },
              { name: 'RajatV', skills: 'Tarot, Palmistry, Vedic', lang: 'English, Hindi', exp: '7 years', price: '78', avatar: 'https://i.pravatar.cc/150?u=rajat' },
              { name: 'Vipul', skills: 'Vedic, Face Reading', lang: 'English, Hindi', exp: '4 years', price: '46', avatar: 'https://i.pravatar.cc/150?u=vipul' },
            ].map((astro, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-6 min-w-[320px] border border-orange-100 shadow-card hover:shadow-card-hover transition relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full blur-[60px] opacity-60" />
                <div className="flex gap-4 mb-6 relative z-10">
                  <div className="flex flex-col items-center">
                    <img src={astro.avatar} alt={astro.name} className="w-[56px] h-[56px] rounded-full border-2 border-orange-200 object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[18px] text-gray-900">{astro.name}</h3>
                    <p className="text-[13px] text-gray-500 mt-1 line-clamp-1">{astro.skills}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-[12px] font-medium text-gray-600">
                      <FiStar className="text-orange-400 fill-orange-400" size={13} /> 4.98 · 10k+ orders
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-[13px] mb-6 relative z-10">
                  <div className="text-gray-500">Languages</div>
                  <div className="text-right text-gray-800 font-medium">{astro.lang}</div>
                  <div className="text-gray-500 -mt-2">Experience</div>
                  <div className="text-right text-gray-800 font-medium -mt-2">{astro.exp}</div>
                </div>
                <div className="flex justify-between items-center relative z-10 mt-2">
                  <span className="font-bold text-gray-900 text-[20px]">₹{astro.price}<span className="text-[13px] text-gray-400 font-normal">/min</span></span>
                  <button onClick={() => navigate('/user/login')} className="bg-orange-500 text-white font-bold px-8 py-2.5 rounded-xl hover:bg-orange-600 transition shadow-sm text-[14px]">
                    Chat
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-12">
            <button onClick={() => navigate('/user/login')} className="bg-orange-50 text-orange-600 font-bold px-8 py-3.5 rounded-full hover:bg-orange-100 transition border border-orange-200 flex items-center gap-2">
              More Astrologers <span className="text-lg leading-none">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
