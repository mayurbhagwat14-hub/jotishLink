import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login, astrologerLoginThunk } from '../../store/slices/authSlice';
import { checkAstrologerPhone, requestOtp } from '../../api/astrologerApis';
import { FiMoon, FiPhone, FiCheckCircle } from 'react-icons/fi';

const AstrologerLogin = () => {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await checkAstrologerPhone({ phone });
      const data = res.data?.data || res.data;
      
      if (data?.exists) {
        // Astrologer exists, proceed to OTP login
        await requestOtp(phone);
        setLoading(false);
        setStep(2);
      } else {
        // Not an astrologer, redirect to apply page with prefilled phone
        navigate('/astrologer/apply', { state: { phone } });
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to check phone number');
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await dispatch(astrologerLoginThunk({ phone, otp: otp.join('') })).unwrap();
      const data = res?.data || res;
      if (data?.accessToken) {
        dispatch(login({ user: data.user, token: data.accessToken }));
      }
      navigate('/astrologer/dashboard');
    } catch (err) {
      const status = err?.status;
      const message = err?.message || 'Invalid OTP';
      
      if (status === 404) {
        // Not registered
        navigate('/astrologer/apply');
      } else if (status === 403) {
        // Pending or rejected
        setError(message);
        setStep(3); // Pending / Rejected screen
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval;
    if (step === 3) {
      interval = setInterval(async () => {
        try {
          const res = await checkAstrologerPhone({ phone });
          const data = res.data?.data || res.data;
          if (data?.approvalStatus === 'approved') {
            clearInterval(interval);
            setError('Your application has been approved! You can now log in.');
            setTimeout(() => {
              setStep(1);
            }, 3000);
          }
        } catch (e) {
          // ignore
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [step, phone]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const resendOtp = async () => {
    setLoading(true);
    setError('');
    setOtp(['', '', '', '']);
    try {
      await requestOtp(phone);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center font-sans p-4 relative overflow-hidden">
      {/* Decorative floating dots */}
      <div className="absolute top-[15%] right-[15%] w-3 h-3 bg-orange-200 rounded-full animate-float opacity-50" />
      <div className="absolute top-[35%] left-[10%] w-2 h-2 bg-orange-300 rounded-full animate-float opacity-40" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-[20%] right-[20%] w-2 h-2 bg-orange-200 rounded-full animate-float opacity-30" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-[30%] left-[15%] w-4 h-4 bg-orange-100 rounded-full animate-float opacity-60" style={{ animationDelay: '1.5s' }} />

      <div className="w-full max-w-sm z-10">
        
        <div className="flex flex-col items-center">
          <div className="w-[80px] h-[80px] bg-orange-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-orange-200 relative">
            <FiMoon size={36} className="text-white" />
          </div>
          
          <h1 className="text-[32px] font-bold text-gray-900 mb-2 tracking-tight">Astrologer Portal</h1>
          <p className="text-center text-gray-500 text-[14px] font-medium mb-10">Login to manage your sessions and earnings.</p>

          {error && (
            <div className="w-full mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600 font-medium text-center shadow-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleSendOtp} className="w-full space-y-6 animate-fade-in">
              <div className="flex gap-2 sm:gap-3">
                <div className="flex items-center gap-1 border-2 border-gray-200 rounded-xl px-3 sm:px-4 py-3.5 bg-gray-50 shrink-0 transition-colors">
                  <span className="text-gray-800 font-bold text-[15px]">+91</span>
                </div>
                <input 
                  type="tel" 
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number" 
                  className="flex-1 min-w-0 border-2 border-gray-200 rounded-xl px-4 py-3.5 bg-gray-50 text-[15px] text-gray-900 outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 placeholder-gray-400 font-medium transition-all duration-200"
                />
              </div>
              <button 
                type="submit"
                disabled={loading || phone.length < 10}
                className={`w-full py-4 rounded-xl font-bold tracking-wide text-[15px] transition-all duration-300 flex justify-center items-center ${
                  loading || phone.length < 10
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-orange-500 text-white shadow-lg shadow-orange-200 hover:bg-orange-600 active:scale-[0.98]'
                }`}
              >
                {loading ? <span className="w-5 h-5 border-2 border-orange-400/30 border-t-orange-500 rounded-full animate-spin" /> : 'GET OTP'}
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="w-full text-center animate-fade-in">
              <p className="text-gray-600 text-[15px] font-medium mb-8">
                OTP Sent to +91 {phone}
              </p>
              <form onSubmit={handleLogin} className="flex flex-col items-center">
                <div className="flex gap-4 mb-10 justify-center w-full">
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={otp[index]}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      className="w-14 h-14 bg-white border-2 border-gray-200 rounded-xl text-center text-xl font-bold text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 shadow-sm transition-all duration-200"
                    />
                  ))}
                </div>
                
                <button 
                  type="submit"
                  disabled={loading || otp.join('').length < 4}
                  className={`w-full py-4 rounded-xl font-bold tracking-wide text-[15px] transition-all duration-300 flex justify-center items-center ${
                    loading || otp.join('').length < 4
                      ? 'bg-orange-200 text-orange-400 cursor-not-allowed'
                      : 'bg-orange-500 text-white shadow-lg shadow-orange-200 hover:bg-orange-600 active:scale-[0.98]'
                  }`}
                >
                  {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'VERIFY & LOGIN'}
                </button>
              </form>
              <div className="flex flex-col items-center mt-8 gap-2">
                <p className="text-gray-400 text-xs font-medium">
                  Didn't receive code? <button type="button" onClick={resendOtp} className="text-orange-500 hover:underline">Resend OTP</button>
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="w-full text-center py-6 animate-fade-in">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 relative shadow-inner">
                <FiCheckCircle size={32} className="text-blue-500" />
                <span className="absolute top-0 right-0 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Your application is under review</h2>
              <p className="text-gray-500 font-medium leading-relaxed mb-8">
                {error || "Your application is currently under review by our admin team."}
              </p>
              <button 
                onClick={() => setStep(1)}
                className="px-8 py-3 border-2 border-orange-500 text-orange-500 font-bold rounded-xl hover:bg-orange-50 transition-colors active:scale-[0.98]"
              >
                Go Back
              </button>
            </div>
          )}

        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center gap-3 w-full">
          <p className="text-[13px] font-medium text-gray-500">
            Not an astrologer yet?{' '}
            <Link to="/astrologer/apply" className="text-orange-500 font-bold hover:underline transition-colors">
              Apply Here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default AstrologerLogin;
