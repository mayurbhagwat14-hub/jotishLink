import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiArrowLeft } from 'react-icons/fi';
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
    <div className="w-full bg-white min-h-screen font-sans pb-24">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between px-4 py-3 bg-white sticky top-0 z-30 shadow-sm border-b border-orange-50">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="text-gray-800 hover:bg-gray-100 p-1.5 rounded-full transition-colors mr-3">
            <FiArrowLeft size={20} />
          </button>
          <span className="text-gray-800 font-semibold text-[17px]">Shubh Muhurat</span>
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
          <h1 className="text-[28px] font-bold text-gray-900 mb-2">Today's Muhurats</h1>
          <p className="text-gray-500 text-[14px]">Find the most auspicious times (Shubh Muhurat) for your important tasks today.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-4" />
            <p className="text-gray-500 font-medium text-[15px]">Loading cosmic timings...</p>
          </div>
        ) : result ? (
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-card border border-orange-100 space-y-4">
            {result.map((muhurat, i) => (
              <div 
                key={i} 
                className={`p-5 rounded-2xl border transition-colors flex flex-col md:flex-row items-start md:items-center justify-between ${
                  muhurat.isGood 
                    ? 'bg-green-50/50 border-green-100 hover:border-green-200' 
                    : 'bg-red-50/50 border-red-100 hover:border-red-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[18px]">
                      {muhurat.isGood ? '✨' : '⚠️'}
                    </span>
                    <p className={`text-[15px] font-bold uppercase tracking-wider ${
                      muhurat.isGood ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {muhurat.name}
                    </p>
                  </div>
                  <p className="text-gray-500 text-[13px]">
                    {muhurat.isGood ? 'Highly auspicious time.' : 'Inauspicious time. Avoid starting new tasks.'}
                  </p>
                </div>
                
                <div className="mt-3 md:mt-0 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 whitespace-nowrap">
                  <p className="text-[16px] font-bold text-gray-900">{muhurat.time}</p>
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
