import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiArrowLeft } from 'react-icons/fi';
import { checkMatchmaking } from '../../api/userApis';

const Matchmaking = () => {
  const navigate = useNavigate();
  const { openSidebar } = useOutletContext();
  const { user } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    boyName: '',
    girlName: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await checkMatchmaking({
        boyDetails: { name: formData.boyName },
        girlDetails: { name: formData.girlName }
      });
      setResult(res.data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setResult({ error: 'Failed to generate Matchmaking report. Please try again later.' });
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white min-h-screen font-sans pb-24">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between px-4 py-3 bg-white sticky top-0 z-30 shadow-sm border-b border-orange-50">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="text-gray-800 hover:bg-gray-100 p-1.5 rounded-full transition-colors mr-3">
            <FiArrowLeft size={20} />
          </button>
          <span className="text-gray-800 font-semibold text-[17px]">Kundli Matchmaking</span>
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
          <h1 className="text-[28px] font-bold text-gray-900 mb-2">Check Compatibility</h1>
          <p className="text-gray-500 text-[14px]">Match Kundlis based on Vedic Astrology (Ashtakoot Guna Milan).</p>
        </div>

        <div className="bg-white rounded-3xl shadow-card border border-orange-100 p-6 md:p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full blur-[40px] opacity-60 -z-10" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-100 rounded-full blur-[50px] opacity-40 -z-10" />
          
          <form onSubmit={handleSubmit} className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1 w-full bg-orange-50/50 p-5 rounded-2xl border border-orange-100 shadow-sm">
              <h3 className="font-bold text-orange-800 text-[15px] mb-3 flex items-center gap-2">👨 Boy's Details</h3>
              <input 
                required type="text" placeholder="Enter boy's name"
                value={formData.boyName} onChange={e => setFormData({...formData, boyName: e.target.value})}
                className="w-full border-2 border-white bg-white rounded-xl py-3 px-4 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 shadow-sm transition-all text-[14px]" 
              />
            </div>

            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md font-bold text-orange-400 shrink-0 border border-orange-100 z-10 text-[14px]">
              VS
            </div>

            <div className="flex-1 w-full bg-orange-50/50 p-5 rounded-2xl border border-orange-100 shadow-sm">
              <h3 className="font-bold text-orange-800 text-[15px] mb-3 flex items-center gap-2">👩 Girl's Details</h3>
              <input 
                required type="text" placeholder="Enter girl's name"
                value={formData.girlName} onChange={e => setFormData({...formData, girlName: e.target.value})}
                className="w-full border-2 border-white bg-white rounded-xl py-3 px-4 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 shadow-sm transition-all text-[14px]" 
              />
            </div>
            
            <div className="w-full md:w-auto shrink-0 mt-2 md:mt-0">
              <button 
                type="submit" disabled={loading}
                className={`w-full md:w-auto py-4 px-8 rounded-xl font-bold text-[15px] transition-all shadow-lg ${loading ? 'bg-orange-300 text-white cursor-not-allowed' : 'bg-orange-500 text-white shadow-orange-200 hover:bg-orange-600 active:scale-[0.98]'}`}
              >
                {loading ? 'MATCHING...' : 'MATCH KUNDLI'}
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
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-orange-100 shadow-card animate-fade-in text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 text-3xl shadow-sm ${result.matchedGunas >= 18 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
              {result.matchedGunas >= 18 ? '💖' : '⚠️'}
            </div>
            <h2 className="text-[24px] font-bold text-gray-900 mb-1">
              Gunas Matched: <span className={result.matchedGunas >= 18 ? 'text-green-500' : 'text-red-500'}>{result.matchedGunas}</span> / {result.totalGunas}
            </h2>
            
            <p className="text-gray-600 text-[14px] mb-8 max-w-lg mx-auto">{result.verdict}</p>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                <p className="text-[11px] text-gray-500 uppercase font-bold mb-1 tracking-wide">Manglik Match</p>
                <p className={`font-bold text-[15px] ${result.isManglikMatch ? 'text-green-600' : 'text-red-500'}`}>
                  {result.isManglikMatch ? 'Compatible' : 'Incompatible'}
                </p>
              </div>
              <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                <p className="text-[11px] text-gray-500 uppercase font-bold mb-1 tracking-wide">Conclusion</p>
                <p className={`font-bold text-[15px] ${result.matchedGunas >= 18 ? 'text-green-600' : 'text-red-500'}`}>
                  {result.matchedGunas >= 18 ? 'Good Match' : 'Not Recommended'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Matchmaking;
