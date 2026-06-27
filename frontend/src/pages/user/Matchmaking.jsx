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
    boyDob: '',
    boyTob: '',
    boyPob: '',
    girlName: '',
    girlDob: '',
    girlTob: '',
    girlPob: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await checkMatchmaking({
        boyDetails: { 
          name: formData.boyName,
          dob: formData.boyDob,
          timeOfBirth: formData.boyTob,
          placeOfBirth: formData.boyPob
        },
        girlDetails: { 
          name: formData.girlName,
          dob: formData.girlDob,
          timeOfBirth: formData.girlTob,
          placeOfBirth: formData.girlPob
        }
      });
      setResult(res.data?.data || res.data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setResult({ error: 'Failed to generate Matchmaking report. Please try again later.' });
      setLoading(false);
    }
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
          <span className="text-gray-900 font-bold text-[18px] tracking-tight">Kundli Matchmaking</span>
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
            💖 Ashtakoot Guna Milan
          </span>
          <h1 className="text-[32px] font-extrabold tracking-tight leading-tight mb-2">Check Compatibility</h1>
          <p className="text-white/85 text-[13px] font-medium max-w-sm mx-auto leading-relaxed">
            Verify astrological harmony between partners to build a solid, loving foundation.
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-5">
        <div className="relative -mt-7 z-20">
          
          {/* ═══ INPUT FORM CARD ═══ */}
          <div className="bg-white rounded-3xl shadow-[0_16px_36px_rgba(249,115,22,0.06)] border border-gray-100 p-5 sm:p-6 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50/50 rounded-full blur-[40px] opacity-60 -z-10" />
            
            <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-6">
              <div className="flex flex-col gap-6 items-stretch">
                {/* Boy's Details Card */}
                <div className="bg-gradient-to-br from-blue-50/30 to-blue-50/10 p-5 rounded-2xl border border-blue-100/50 shadow-sm flex flex-col gap-4">
                  <h3 className="font-extrabold text-blue-700 text-[15px] mb-1 flex items-center gap-2">
                    <span className="text-[17px]">👦</span> Boy's Birth Details
                  </h3>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Name</label>
                    <input 
                      required type="text" placeholder="Enter boy's name"
                      value={formData.boyName} onChange={e => setFormData({...formData, boyName: e.target.value})}
                      className="w-full border border-gray-200 focus:border-blue-500 bg-white rounded-2xl py-3 px-4 outline-none transition-all text-[14px] shadow-sm" 
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Date of Birth</label>
                      <input 
                        required type="date" 
                        value={formData.boyDob} onChange={e => setFormData({...formData, boyDob: e.target.value})}
                        className="w-full border border-gray-200 focus:border-blue-500 bg-white rounded-2xl py-3 px-3 outline-none transition-all text-[14px] shadow-sm" 
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Time of Birth</label>
                      <input 
                        required type="time" 
                        value={formData.boyTob} onChange={e => setFormData({...formData, boyTob: e.target.value})}
                        className="w-full border border-gray-200 focus:border-blue-500 bg-white rounded-2xl py-3 px-3 outline-none transition-all text-[14px] shadow-sm" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Place of Birth</label>
                    <input 
                      required type="text" placeholder="Enter city"
                      value={formData.boyPob} onChange={e => setFormData({...formData, boyPob: e.target.value})}
                      className="w-full border border-gray-200 focus:border-blue-500 bg-white rounded-2xl py-3 px-4 outline-none transition-all text-[14px] shadow-sm" 
                    />
                  </div>
                </div>

                {/* Girl's Details Card */}
                <div className="bg-gradient-to-br from-rose-50/30 to-rose-50/10 p-5 rounded-2xl border border-rose-100/50 shadow-sm flex flex-col gap-4">
                  <h3 className="font-extrabold text-rose-700 text-[15px] mb-1 flex items-center gap-2">
                    <span className="text-[17px]">👩</span> Girl's Birth Details
                  </h3>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Name</label>
                    <input 
                      required type="text" placeholder="Enter girl's name"
                      value={formData.girlName} onChange={e => setFormData({...formData, girlName: e.target.value})}
                      className="w-full border border-gray-200 focus:border-rose-500 bg-white rounded-2xl py-3 px-4 outline-none transition-all text-[14px] shadow-sm" 
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Date of Birth</label>
                      <input 
                        required type="date" 
                        value={formData.girlDob} onChange={e => setFormData({...formData, girlDob: e.target.value})}
                        className="w-full border border-gray-200 focus:border-rose-500 bg-white rounded-2xl py-3 px-3 outline-none transition-all text-[14px] shadow-sm" 
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Time of Birth</label>
                      <input 
                        required type="time" 
                        value={formData.girlTob} onChange={e => setFormData({...formData, girlTob: e.target.value})}
                        className="w-full border border-gray-200 focus:border-rose-500 bg-white rounded-2xl py-3 px-3 outline-none transition-all text-[14px] shadow-sm" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Place of Birth</label>
                    <input 
                      required type="text" placeholder="Enter city"
                      value={formData.girlPob} onChange={e => setFormData({...formData, girlPob: e.target.value})}
                      className="w-full border border-gray-200 focus:border-rose-500 bg-white rounded-2xl py-3 px-4 outline-none transition-all text-[14px] shadow-sm" 
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <button 
                  type="submit" disabled={loading}
                  className={`w-full py-4 rounded-2xl font-extrabold text-[15px] tracking-wide transition-all shadow-lg ${loading ? 'bg-orange-300 text-white cursor-not-allowed' : 'bg-[#fa6830] text-white shadow-orange-200 hover:bg-[#e55923] active:scale-[0.98]'}`}
                >
                  {loading ? 'COMPUTING GUNA MILAN...' : 'COMPARE COMPATIBILITY'}
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
          <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)] animate-fade-in text-center mb-8">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 border-2 text-3xl shadow-sm ${result.matchedGunas >= 18 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-500'}`}>
              {result.matchedGunas >= 18 ? '💖' : '⚠️'}
            </div>
            
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Compatibility Score</p>
            <h2 className="text-[32px] font-black text-gray-900 mb-2 leading-none">
              <span className={result.matchedGunas >= 18 ? 'text-emerald-500' : 'text-rose-500'}>{result.matchedGunas}</span>
              <span className="text-gray-300 font-medium text-[24px]"> / {result.totalGunas} Gunas</span>
            </h2>
            
            <p className="text-gray-650 text-[14px] leading-relaxed mb-8 max-w-md mx-auto font-medium">{result.verdict}</p>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div className="bg-gradient-to-br from-slate-50 to-white p-4.5 rounded-2xl border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1 tracking-wider">Manglik Milan</p>
                <p className={`font-extrabold text-[15px] ${result.isManglikMatch ? 'text-emerald-600' : 'text-red-500'}`}>
                  {result.isManglikMatch ? 'Compatible' : 'Incompatible'}
                </p>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-white p-4.5 rounded-2xl border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1 tracking-wider">Verdict</p>
                <p className={`font-extrabold text-[15px] ${result.matchedGunas >= 18 ? 'text-emerald-600' : 'text-red-500'}`}>
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
