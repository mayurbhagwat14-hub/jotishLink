import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import * as userApis from '../api/userApis';
import { login } from '../store/slices/authSlice';
import { FiChevronDown, FiArrowLeft } from 'react-icons/fi';
import OtpInput from '../components/OtpInput';

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState(() => sessionStorage.getItem('loginPhone') || '');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(58);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { appName, appLogo } = useSelector(state => state.settings) || { appName: 'JyotishLink', appLogo: '' };
  
  const redirectTo = location.state?.redirectTo || 
    (location.state?.from ? `${location.state.from.pathname}${location.state.from.search || ''}` : '/user/home');

  useEffect(() => {
    // Clear any stale user details when arriving at the login page
    localStorage.removeItem('userDetailsApplyData');
    localStorage.removeItem('astrologerApplyData');
  }, []);

  useEffect(() => {
    sessionStorage.setItem('loginPhone', phoneNumber);
  }, [phoneNumber]);

  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const requestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      setError('Please enter a valid 10-digit mobile number starting with 6-9.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await userApis.requestOtp(phoneNumber);
      setStep(2);
      setTimer(58);
      setOtp(['', '', '', '']); // clear OTP on resend
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    const otpValue = otp.join('');
    try {
      const res = await userApis.verifyOtp(phoneNumber, otpValue);
      const data = res.data.data;
      
      if (data.isNewUser) {
        sessionStorage.setItem('pendingRegisterPhone', data.phone);
        navigate('/user/details', { state: { redirectTo } });
      } else {
        const { user, accessToken } = data;
        dispatch(login({ user, token: accessToken }));
        
        // Role-based routing
        if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (user.role === 'astrologer') {
          navigate('/astrologer/dashboard');
        } else {
          navigate(redirectTo);
        }
      }
    } catch (err) {
      console.error('OTP verification failed:', err?.response?.data?.message || err.message);
      setError(err?.response?.data?.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  // ─── OTP VERIFICATION SCREEN ───
  if (step === 2) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        {/* Header */}
        <div className="flex items-center px-4 py-4 bg-white border-b border-gray-100">
          <button onClick={() => setStep(1)} className="text-gray-800 p-1 -ml-1 rounded-full hover:bg-gray-100 transition-colors">
            <FiArrowLeft size={22} />
          </button>
          <h1 className="text-[17px] font-semibold text-gray-800 ml-3">← Verify Number</h1>
        </div>

        <div className="flex flex-col items-center flex-1 w-full px-4 sm:px-6 pt-12">
          {/* Decorative stars */}
          <div className="relative w-full flex justify-center mb-8">
            <div className="absolute top-0 left-[20%] w-2 h-2 bg-orange-300 rounded-full animate-float opacity-60" />
            <div className="absolute top-4 right-[15%] w-1.5 h-1.5 bg-orange-400 rounded-full animate-float opacity-40" style={{ animationDelay: '0.5s' }} />
          </div>

          <p className="text-gray-600 text-[15px] font-medium mb-2">
            OTP Sent to +91 {phoneNumber || '8766556836'}
          </p>

          {error && (
            <div className="w-full max-w-sm mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600 font-medium text-center shadow-sm">
              {error}
            </div>
          )}

          <form onSubmit={verifyOtp} className="w-full max-w-sm flex flex-col items-center mt-6">
            {/* OTP Input boxes */}
            <OtpInput length={4} value={otp} onChange={setOtp} autoFocus />

            <button
              type="submit"
              disabled={loading || otp.join('').length < 4}
              className={`w-full py-4 rounded-xl font-bold tracking-wide text-[15px] transition-all duration-300 ${
                loading || otp.join('').length < 4
                  ? 'bg-orange-200 text-orange-400 cursor-not-allowed'
                  : 'bg-orange-500 text-white shadow-lg shadow-orange-200 hover:bg-orange-600 active:scale-[0.98]'
              }`}
            >
              SUBMIT
            </button>

            <div className="flex flex-col items-center mt-6 gap-2">
              {timer > 0 ? (
                <p className="text-gray-500 text-[14px] font-medium mb-6">
                  Resend OTP in <span className="text-orange-500 font-bold text-[15px]">00:{timer < 10 ? `0${timer}` : timer}</span>
                </p>
              ) : (
                <p className="text-gray-500 text-[14px] font-medium mb-6">
                  Didn't receive code? <button type="button" onClick={() => requestOtp()} className="text-orange-500 font-bold hover:underline transition-all">Resend OTP</button>
                </p>
              )}
            </div>
            
            {/* Footer Text */}
            <p className="text-center text-gray-400 text-[12px] mt-6 max-w-[280px] leading-relaxed relative z-20">
              By signing up, you agree to our{' '}
              <Link to="/user/terms" className="underline cursor-pointer text-orange-500 hover:text-orange-600 transition-colors relative z-20">Terms & Conditions</Link>{' '}
              &{' '}
              <Link to="/user/privacy" className="underline cursor-pointer text-orange-500 hover:text-orange-600 transition-colors relative z-20">Privacy Policy</Link>
            </p>
          </form>
        </div>
      </div>
    );
  }

  // ─── LOGIN SCREEN (Phone Number Entry) ───
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans px-4 sm:px-6 relative">
      {/* Decorative floating dots */}
      <div className="absolute top-[10%] right-[10%] w-3 h-3 bg-orange-200 rounded-full animate-float opacity-50" />
      <div className="absolute top-[30%] left-[8%] w-2 h-2 bg-orange-300 rounded-full animate-float opacity-40" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-[25%] right-[15%] w-2 h-2 bg-orange-200 rounded-full animate-float opacity-30" style={{ animationDelay: '0.5s' }} />

      <div className="flex justify-end pt-5 pb-6">
        <button onClick={() => {
          navigate('/user/home');
        }} className="text-gray-500 font-medium text-[15px] hover:text-orange-500 transition-colors">
          Skip
        </button>
      </div>

      <div className="flex flex-col items-center flex-1 w-full max-w-sm mx-auto">

        {/* Logo or Title */}
        <div className="flex justify-center mb-10 mt-4 relative">
          {appLogo ? (
            <div className="flex flex-col items-center mb-4 mt-4 mix-blend-multiply relative z-10">
              <img src={appLogo} alt={appName} className="h-[180px] w-auto object-contain drop-shadow-md mb-2" />
              <div className="text-[44px] font-serif leading-none tracking-tight">
                <span className="bg-gradient-to-b from-orange-400 to-orange-600 bg-clip-text text-transparent font-semibold">{appName || 'JyotishLink'}</span>
              </div>
            </div>
          ) : (
            <div className="w-[100px] h-[100px] bg-orange-500 rounded-full flex flex-col items-center justify-center shadow-lg shadow-orange-200">
              <span className="text-white font-black text-3xl">{(appName || 'JL').substring(0,2).toUpperCase()}</span>
            </div>
          )}
        </div>

        {!appLogo && (
          <h1 className="text-[34px] font-bold text-gray-900 mb-3 tracking-tight text-center">{appName}</h1>
        )}
        <p className="text-orange-500 text-[14px] font-semibold mb-10 text-center w-full">First Chat with Astrologer is FREE!</p>

        {/* Divider */}
        <div className="flex items-center w-full mb-6">
          <div className="flex-1 h-[1px] bg-gray-200" />
          <span className="px-4 text-gray-500 text-[14px] font-medium">Login or Sign Up</span>
          <div className="flex-1 h-[1px] bg-gray-200" />
        </div>

        {error && (
          <div className="w-full mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600 font-medium text-center shadow-sm">
            {error}
          </div>
        )}

        <form onSubmit={requestOtp} className="w-full space-y-5">
          <div className="flex gap-2 sm:gap-3">
            {/* Country Code */}
            <div className="flex items-center gap-1 border-2 border-gray-200 rounded-xl px-2.5 sm:px-3 py-3.5 bg-white shrink-0 hover:border-orange-300 transition-colors">
              <span className="text-xl leading-none">🇮🇳</span>
              <span className="text-gray-800 font-semibold text-[15px] ml-1">+91</span>
              <FiChevronDown className="text-gray-500 ml-0.5" size={16} />
            </div>

            {/* Phone Input */}
            <input
              type="tel"
              required
              className="flex-1 min-w-0 border-2 border-gray-200 rounded-xl px-3 sm:px-4 py-3.5 bg-white text-[15px] text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 placeholder-gray-400 font-medium transition-all duration-200"
              placeholder="10 digit mobile number"
              value={phoneNumber}
              onChange={(e) => {
                let val = e.target.value.replace(/\D/g, '');
                if (val.startsWith('91') && val.length > 10) val = val.slice(2);
                if (val.startsWith('0') && val.length > 10) val = val.slice(1);
                if (val.length > 10) val = val.slice(0, 10);
                if (val.length > 0 && !/^[6-9]/.test(val)) return;
                setPhoneNumber(val);
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !/^[6-9]\d{9}$/.test(phoneNumber)}
            className={`w-full py-4 rounded-xl font-bold tracking-wide text-[15px] transition-all duration-300 ${
              loading || !/^[6-9]\d{9}$/.test(phoneNumber)
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-orange-500 text-white shadow-lg shadow-orange-200 hover:bg-orange-600 active:scale-[0.98]'
            }`}
          >
            {loading ? 'SENDING OTP...' : 'SEND OTP'}
          </button>
        </form>

        {/* Footer Text */}
        <p className="text-center text-gray-400 text-[12px] mt-6 max-w-[280px] leading-relaxed relative z-20">
          By signing up, you agree to our{' '}
          <Link to="/user/terms" className="underline cursor-pointer text-orange-500 hover:text-orange-600 transition-colors relative z-20">Terms & Conditions</Link>{' '}
          &{' '}
          <Link to="/user/privacy" className="underline cursor-pointer text-orange-500 hover:text-orange-600 transition-colors relative z-20">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
