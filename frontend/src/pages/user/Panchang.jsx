import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiArrowLeft } from 'react-icons/fi';
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
        setResult(res.data);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setResult({ error: 'Failed to fetch Panchang. Please try again later.' });
        setLoading(false);
      }
    };
    fetchPanchang();
  }, []);

  return (
    <div className="w-full bg-white min-h-screen font-sans pb-24">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between px-4 py-3 bg-white sticky top-0 z-30 shadow-sm border-b border-orange-50">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="text-gray-800 hover:bg-gray-100 p-1.5 rounded-full transition-colors mr-3">
            <FiArrowLeft size={20} />
          </button>
          <span className="text-gray-800 font-semibold text-[17px]">Today's Panchang</span>
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

      <div className="max-w-4xl mx-auto px-6 pt-8">
        <div className="text-center mb-10">
          <h1 className="text-[28px] font-bold text-gray-900 mb-2">Daily Panchang</h1>
          <p className="text-gray-500 text-[14px]">Daily Hindu Calendar elements - Tithi, Nakshatra, Yoga, Karana, and Vaar.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-4" />
            <p className="text-gray-500 font-medium text-[15px]">Loading cosmic data...</p>
          </div>
        ) : result && result.error ? (
          <div className="bg-red-50 text-red-600 text-center py-6 rounded-2xl font-bold border border-red-100 animate-fade-in mb-8">
            {result.error}
          </div>
        ) : result ? (
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-card border border-orange-100">
            
            <div className="flex flex-wrap justify-between items-center mb-8 border-b border-orange-50 pb-6">
              <div className="text-center md:text-left">
                <p className="text-gray-400 font-bold text-[11px] uppercase tracking-wider mb-1">Sunrise</p>
                <p className="text-[22px] font-bold text-gray-900">{result.sunrise}</p>
              </div>
              <div className="text-center order-first w-full md:w-auto md:order-none mb-6 md:mb-0">
                <div className="w-20 h-20 bg-gradient-to-tr from-orange-400 to-orange-300 rounded-full mx-auto shadow-lg shadow-orange-200/50 flex items-center justify-center text-white text-4xl mb-3">
                  ☀️
                </div>
                <p className="font-bold text-gray-800 text-[16px]">{new Date().toDateString()}</p>
              </div>
              <div className="text-center md:text-right">
                <p className="text-gray-400 font-bold text-[11px] uppercase tracking-wider mb-1">Sunset</p>
                <p className="text-[22px] font-bold text-gray-900">{result.sunset}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100 hover:border-orange-200 transition-colors">
                <p className="text-[11px] font-bold text-orange-600 uppercase tracking-wider mb-1.5">Tithi</p>
                <p className="text-[18px] font-semibold text-gray-900">{result.tithi}</p>
              </div>
              <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100 hover:border-orange-200 transition-colors">
                <p className="text-[11px] font-bold text-orange-600 uppercase tracking-wider mb-1.5">Nakshatra</p>
                <p className="text-[18px] font-semibold text-gray-900">{result.nakshatra}</p>
              </div>
              <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100 hover:border-orange-200 transition-colors">
                <p className="text-[11px] font-bold text-orange-600 uppercase tracking-wider mb-1.5">Yoga</p>
                <p className="text-[18px] font-semibold text-gray-900">{result.yoga}</p>
              </div>
              <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100 hover:border-orange-200 transition-colors">
                <p className="text-[11px] font-bold text-orange-600 uppercase tracking-wider mb-1.5">Karana</p>
                <p className="text-[18px] font-semibold text-gray-900">{result.karana}</p>
              </div>
            </div>
            
            <div className="mt-6 bg-red-50 p-5 rounded-2xl border border-red-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-red-500 uppercase tracking-wider mb-1">Rahu Kaal (Inauspicious)</p>
                <p className="text-[20px] font-bold text-red-600">{result.rahuKaal}</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-red-500 text-xl shadow-sm border border-red-100">
                ⚠️
              </div>
            </div>

          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Panchang;
