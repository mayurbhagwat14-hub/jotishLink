import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { astrologerLogin, astrologerLoginThunk } from '../../store/slices/astrologerAuthSlice';
import OtpInput from '../../components/OtpInput';
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
  const { isAuthenticated, user } = useSelector((state) => state.astrologerAuth);
  const { appLogo, appName } = useSelector((state) => state.settings) || { appName: 'JyotishLink' };

  useEffect(() => {
    // If the user is already authenticated but not approved, jump directly to step 3
    if (isAuthenticated && user?.approvalStatus && user.approvalStatus !== 'approved') {
      setPhone(user.phone || '');
      setStep(3);
    }
  }, [isAuthenticated, user]);

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
      const data = await dispatch(astrologerLoginThunk({ phone, otp: otp.join('') })).unwrap();
      
      if (data && data.data) {
        dispatch(astrologerLogin({ user: { ...data.data.user, role: 'astrologer' }, token: data.data.accessToken }));
      } else if (data && data.accessToken) {
        dispatch(astrologerLogin({ user: { ...data.user, role: 'astrologer' }, token: data.accessToken }));
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

  const handleGoBack = () => {
    if (isAuthenticated) {
      // Must import astrologerLogout from slice for this
      import('../../store/slices/astrologerAuthSlice').then(({ astrologerLogout }) => {
        dispatch(astrologerLogout());
      });
    }
    setStep(1);
    setPhone('');
    setError('');
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
          {step !== 3 && (
            <>
              {appLogo ? (
                <div className="flex flex-col items-center mb-4 mt-2 mx-auto mix-blend-multiply relative z-10">
                  <img src={appLogo} alt="App Logo" className="h-[140px] w-auto object-contain drop-shadow-md mb-2" />
                  <div className="text-[34px] font-serif leading-none tracking-tight">
                    <span className="bg-gradient-to-b from-orange-400 to-orange-600 bg-clip-text text-transparent font-semibold">{appName || 'JyotishLink'}</span>
                  </div>
                </div>
              ) : (
                <div className="w-[80px] h-[80px] bg-[#fa6830] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-orange-200 relative mx-auto">
                  <FiMoon size={36} className="text-white" />
                </div>
              )}
              
              <h1 className="text-[32px] font-bold text-gray-700 mb-2 tracking-tight text-center">Astrologer Portal</h1>
              <p className="text-center text-gray-500 text-[14px] font-medium mb-10">Login to manage your sessions and earnings.</p>

              {error && (
                <div className="w-full mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600 font-medium text-center shadow-sm">
                  {error}
                </div>
              )}
            </>
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
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val.startsWith('91') && val.length > 10) val = val.slice(2);
                    if (val.startsWith('0') && val.length > 10) val = val.slice(1);
                    if (val.length > 10) val = val.slice(0, 10);
                    if (val.length > 0 && !/^[6-9]/.test(val)) return;
                    setPhone(val);
                  }}
                  placeholder="Enter 10-digit number" 
                  className="flex-1 min-w-0 border-2 border-gray-200 rounded-xl px-4 py-3.5 bg-gray-50 text-[15px] text-gray-900 outline-none focus:border-[#fa6830] focus:bg-white focus:ring-2 focus:ring-orange-100 placeholder-gray-400 font-medium transition-all duration-200"
                />
              </div>
              <button 
                type="submit"
                disabled={loading || !/^[6-9]\d{9}$/.test(phone)}
                className={`w-full py-4 rounded-xl font-bold tracking-wide text-[15px] transition-all duration-300 flex justify-center items-center ${
                  loading || !/^[6-9]\d{9}$/.test(phone)
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-[#fa6830] text-white shadow-lg shadow-orange-200 hover:bg-[#e55923] active:scale-[0.98]'
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
                <OtpInput length={4} value={otp} onChange={setOtp} autoFocus inputClassName="w-14 h-14 bg-white border-2 border-gray-200 rounded-xl text-center text-xl font-bold text-gray-900 outline-none focus:border-[#fa6830] focus:ring-2 focus:ring-orange-100 shadow-sm transition-all duration-200" />
                
                <button 
                  type="submit"
                  disabled={loading || otp.join('').length < 4}
                  className={`w-full py-4 rounded-xl font-bold tracking-wide text-[15px] transition-all duration-300 flex justify-center items-center ${
                    loading || otp.join('').length < 4
                      ? 'bg-orange-200 text-orange-400 cursor-not-allowed'
                      : 'bg-[#fa6830] text-white shadow-lg shadow-orange-200 hover:bg-[#e55923] active:scale-[0.98]'
                  }`}
                >
                  {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'VERIFY & LOGIN'}
                </button>
              </form>
              <div className="flex flex-col items-center mt-8 gap-2">
                <p className="text-gray-400 text-xs font-medium">
                  Didn't receive code? <button type="button" onClick={resendOtp} className="text-[#fa6830] hover:underline">Resend OTP</button>
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-10 animate-fade-in max-w-md mx-auto">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiCheckCircle size={40} className="text-green-500" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-3">Application Submitted Successfully!</h2>
              <p className="text-gray-500 font-medium leading-relaxed mb-6">
                Thank you for applying. Your application has been sent to the admin panel for review. Our team will verify your details.
              </p>

              <button 
                onClick={handleGoBack}
                className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all active:scale-[0.98]"
              >
                Go Back
              </button>
            </div>
          )}

        </div>
        
        {step !== 3 && (
          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center gap-3 w-full">
            <p className="text-[13px] font-medium text-gray-500">
              Not an astrologer yet?{' '}
              <Link 
                to="/astrologer/apply" 
                onClick={() => {
                  sessionStorage.removeItem('apply_step');
                  sessionStorage.removeItem('apply_mobile');
                  sessionStorage.removeItem('apply_authData');
                }}
                className="text-[#fa6830] font-bold hover:underline transition-colors"
              >
                Apply Here
              </Link>
            </p>

            <p className="text-[11px] text-gray-400 font-medium text-center leading-relaxed mt-4">
              By continuing, you agree to our{' '}
              <Link to="/user/terms" className="underline cursor-pointer text-[#fa6830] hover:underline transition-colors">Terms & Conditions</Link>{' '}
              and{' '}
              <Link to="/user/privacy" className="underline cursor-pointer text-[#fa6830] hover:underline transition-colors">Privacy Policy</Link>
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default AstrologerLogin;
