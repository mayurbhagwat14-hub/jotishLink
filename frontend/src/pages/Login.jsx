import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import * as userApis from '../api/userApis';
import { login } from '../store/slices/authSlice';
import { FiChevronDown, FiArrowLeft } from 'react-icons/fi';

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(58);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value !== '' && index < 3) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const requestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await userApis.requestOtp(phoneNumber);
      setStep(2);
      setTimer(58);
    } catch {
      setStep(2);
      setTimer(58);
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
      const { _id, name, role, accessToken, isNewUser } = res.data;
      
      dispatch(login({ user: { _id, name, phone: phoneNumber, role }, token: accessToken }));
      
      if (isNewUser || !name || name === 'Guest User') {
        navigate('/user/details');
      } else {
        if (role === 'admin') navigate('/admin/dashboard');
        else if (role === 'astrologer') navigate('/astrologer/dashboard');
        else navigate('/user/home');
      }
    } catch {
      dispatch(login({
        user: { name: 'Guest User', role: 'user', phone: phoneNumber, wallet: 150 },
        token: 'dummy-token-123'
      }));
      navigate('/user/free-chat-offer');
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

          <form onSubmit={verifyOtp} className="w-full max-w-sm flex flex-col items-center mt-6">
            {/* OTP Input boxes */}
            <div className="flex gap-4 mb-10">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={inputRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  className="w-14 h-14 bg-white border-2 border-gray-200 rounded-xl text-center text-xl font-bold text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 shadow-sm transition-all duration-200"
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  maxLength={1}
                />
              ))}
            </div>

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

            <div className="flex flex-col items-center mt-8 gap-2">
              <p className="text-gray-400 text-xs text-center px-4 leading-relaxed font-medium">
              By signing up, you agree to our <br /> <span className="text-gray-600 underline">Terms of Use</span> and <span className="text-gray-600 underline">Privacy Policy</span>
            </p>
            
            {/* DEBUG: Admin Login Bypass */}
             <div className="mt-8">
                <button 
                  type="button"
                  onClick={() => {
                    dispatch(login({ user: { name: 'Super Admin', role: 'admin', phone: '0000000000' }, token: 'admin-token-123' }));
                    navigate('/admin/dashboard');
                  }}
                  className="text-[10px] text-gray-300 font-bold hover:text-orange-500 uppercase tracking-widest transition-colors"
                >
                  [Developer: Login as Admin]
                </button>
             </div>
            </div>
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

      {/* Skip Button */}
      <div className="flex justify-end pt-5 pb-6">
        <button onClick={() => {
          dispatch(login({ user: { name: 'Guest User', role: 'user', wallet: 150 }, token: 'guest-token' }));
          navigate('/user/home');
        }} className="text-gray-500 font-medium text-[15px] hover:text-orange-500 transition-colors">
          Skip
        </button>
      </div>

      <div className="flex flex-col items-center flex-1 w-full max-w-sm mx-auto">

        {/* Logo */}
        <div className="w-[100px] h-[100px] bg-orange-500 rounded-full flex items-center justify-center mb-5 shadow-lg shadow-orange-200 relative">
          <svg width="68" height="68" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="28" stroke="white" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="8" fill="white" />
            <path d="M50 34L53 40L59 38L55 43.5L62 46L56 50L62 54L55 56.5L59 62L53 60L50 66L47 60L41 62L45 56.5L38 54L44 50L38 46L45 43.5L41 38L47 40L50 34Z" fill="white" />
            <circle cx="10" cy="50" r="4.5" fill="white" />
            <circle cx="90" cy="50" r="3" fill="white" />
            <circle cx="50" cy="10" r="3.5" fill="white" />
            <circle cx="22" cy="22" r="2.5" fill="white" />
            <circle cx="22" cy="70" r="3" fill="white" />
            <circle cx="78" cy="28" r="5" stroke="white" strokeWidth="1.5" fill="none" />
            <circle cx="78" cy="28" r="2" fill="white" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-[34px] font-bold text-gray-900 mb-3 tracking-tight">JyotishLink</h1>
        <p className="text-orange-500 text-[14px] font-semibold mb-10">First Chat with Astrologer is FREE!</p>

        {/* Divider */}
        <div className="flex items-center w-full mb-8">
          <div className="flex-1 h-[1px] bg-gray-200" />
          <span className="px-4 text-gray-500 text-[14px] font-medium">Login or Sign Up</span>
          <div className="flex-1 h-[1px] bg-gray-200" />
        </div>

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
              placeholder="Enter Mobile Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading || phoneNumber.length < 10}
            className={`w-full py-4 rounded-xl font-bold tracking-wide text-[15px] transition-all duration-300 ${
              loading || phoneNumber.length < 10
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-orange-500 text-white shadow-lg shadow-orange-200 hover:bg-orange-600 active:scale-[0.98]'
            }`}
          >
            {loading ? 'SENDING OTP...' : 'SEND OTP'}
          </button>
        </form>

        {/* Footer Text */}
        <p className="text-center text-gray-400 text-[12px] mt-8 max-w-[280px] leading-relaxed">
          By signing up, you agree to our{' '}
          <span className="underline cursor-pointer text-orange-500 hover:text-orange-600 transition-colors">Terms of Use</span>{' '}
          &{' '}
          <span className="underline cursor-pointer text-orange-500 hover:text-orange-600 transition-colors">Privacy Policy</span>
        </p>

        {/* Links to Other Panels for Client Demo */}
        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col items-center gap-3 w-full max-w-[280px]">
           <button 
             onClick={() => navigate('/astrologer/login')}
             className="text-[13px] font-bold text-gray-500 hover:text-orange-500 transition-colors"
           >
             Are you an Astrologer? Login Here
           </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
