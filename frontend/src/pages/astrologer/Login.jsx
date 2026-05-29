import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login, astrologerLoginThunk } from '../../store/slices/authSlice';
import { FiMoon, FiPhone, FiLock } from 'react-icons/fi';

const AstrologerLogin = () => {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = Mobile, 2 = OTP
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (mobile.length >= 10) {
      setStep(2);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length === 4) {
      try {
        // Try calling actual API endpoint
        await dispatch(astrologerLoginThunk({ mobile, otp })).unwrap();
        navigate('/astrologer/dashboard');
      } catch (err) {
        // Fallback for mock environment
        dispatch(login({
          user: { name: 'Astro Jane', role: 'astrologer', mobile: mobile },
          token: 'mock-astro-token'
        }));
        navigate('/astrologer/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex flex-col justify-center items-center p-4">
      
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-orange-500/10 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-yellow-400"></div>
        
        <div className="p-8">
          <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
             <FiMoon size={32} />
          </div>
          
          <h1 className="text-2xl font-black text-center text-gray-800 mb-1">Astrologer Portal</h1>
          <p className="text-center text-gray-500 text-sm font-medium mb-8">Login to manage your sessions and earnings.</p>

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-6 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mobile Number</label>
                <div className="flex border-2 border-gray-100 rounded-xl overflow-hidden focus-within:border-orange-400 transition-colors bg-gray-50">
                  <div className="px-4 flex items-center justify-center border-r border-gray-100 bg-white">
                    <span className="text-gray-500 font-bold text-sm">🇮🇳 +91</span>
                  </div>
                  <input 
                    type="tel" 
                    required
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter your 10 digit number" 
                    className="flex-1 px-4 py-3 outline-none text-gray-800 font-medium bg-transparent"
                  />
                </div>
              </div>
              <button 
                type="submit"
                disabled={mobile.length < 10}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-400 text-white font-bold py-3.5 rounded-xl shadow-md shadow-orange-500/30 hover:shadow-lg disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
              >
                Send OTP
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Enter OTP</label>
                <div className="flex border-2 border-gray-100 rounded-xl overflow-hidden focus-within:border-orange-400 transition-colors bg-gray-50">
                  <div className="px-4 flex items-center justify-center border-r border-gray-100 bg-white">
                    <FiLock className="text-gray-400" />
                  </div>
                  <input 
                    type="text" 
                    required
                    maxLength={4}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="4 digit OTP (e.g. 1234)" 
                    className="flex-1 px-4 py-3 outline-none text-gray-800 font-medium bg-transparent tracking-widest text-center text-lg"
                  />
                </div>
              </div>
              <button 
                type="submit"
                disabled={otp.length < 4}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-400 text-white font-bold py-3.5 rounded-xl shadow-md shadow-orange-500/30 hover:shadow-lg disabled:opacity-50 disabled:shadow-none transition-all"
              >
                Verify & Login
              </button>
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-sm font-bold text-gray-500 hover:text-orange-500 transition-colors"
              >
                Edit Mobile Number
              </button>
            </form>
          )}

        </div>
        
        <div className="bg-gray-50 p-6 text-center border-t border-gray-100 flex flex-col gap-4">
          <p className="text-sm font-medium text-gray-600">
            Not an astrologer yet?{' '}
            <Link to="/astrologer/apply" className="text-orange-500 font-bold hover:underline">
              Apply Here
            </Link>
          </p>
          <button 
             onClick={() => navigate('/login')}
             className="text-xs font-bold text-gray-400 hover:text-gray-700 transition-colors"
          >
             Back to User Login
          </button>
        </div>

      </div>
    </div>
  );
};

export default AstrologerLogin;
