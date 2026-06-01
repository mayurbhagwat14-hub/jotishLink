import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login, adminLoginThunk } from '../../store/slices/authSlice';
import { FiLock, FiUser, FiArrowRight, FiShield, FiCheckCircle, FiCpu, FiKey } from 'react-icons/fi';

const AdminLogin = () => {
  const [step, setStep] = useState(1); // 1: Credentials, 2: OTP
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const otpRefs = useRef([]);

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Call real backend: POST /api/admin/auth/login with { email, password }
      const res = await dispatch(adminLoginThunk({ email: username, password })).unwrap();
      const data = res?.data || res;
      if (data?.accessToken) {
        dispatch(login({ user: data.user, token: data.accessToken }));
      }
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err?.message || 'Invalid admin credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value !== '' && index < 5) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Handle backspace to focus previous input
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    // OTP step is now optional — direct login on step 1
    navigate('/admin/dashboard');
  };


  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex overflow-hidden font-sans">
      
      {/* Left Column - Graphic / Brand Side */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 bg-gradient-to-br from-gray-900 to-black border-r border-gray-800">
        
        {/* Background Decorative Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-orange-500 rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600 rounded-full mix-blend-screen filter blur-[100px] opacity-10"></div>
          {/* Cyber Grid */}
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 text-orange-500 mb-8">
            <FiShield size={32} />
            <span className="text-2xl font-black tracking-widest uppercase">JyotishLink Security</span>
          </div>
          
          <h1 className="text-5xl font-black leading-tight mb-6">
            Enterprise <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
              Command Center
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-md">
            Restricted access. Advanced authentication required to access administrative privileges and system controls.
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4 bg-gray-800/50 p-4 rounded-2xl border border-gray-700 backdrop-blur-md max-w-sm">
            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
              <FiCheckCircle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-sm">Encrypted Connection</h3>
              <p className="text-xs text-gray-400">End-to-end 256-bit encryption active</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-gray-800/50 p-4 rounded-2xl border border-gray-700 backdrop-blur-md max-w-sm">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
              <FiCpu size={24} />
            </div>
            <div>
              <h3 className="font-bold text-sm">AI Threat Monitoring</h3>
              <p className="text-xs text-gray-400">System actively analyzing connection</p>
            </div>
          </div>
        </div>

      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="max-w-md w-full relative z-10">
          
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-black mb-2">Admin Portal</h2>
            <p className="text-gray-400">
              {step === 1 ? 'Enter your credentials to initiate secure connection.' : 'Enter the 6-digit OTP sent to your secure device.'}
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
            {/* Subtle glow inside card */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50"></div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm font-semibold text-red-400 text-center animate-shake">
                {error}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleCredentialsSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Username</label>
                  <div className="relative group">
                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500 transition-colors" size={18} />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-xl bg-black border border-gray-800 focus:bg-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-semibold text-white placeholder-gray-600"
                      placeholder="Enter admin ID"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Master Password</label>
                  <div className="relative group">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500 transition-colors" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 rounded-xl bg-black border border-gray-800 focus:bg-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-semibold text-white placeholder-gray-600"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-orange-500 transition-colors"
                    >
                      {showPassword ? (
                        <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="18" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"></path></svg>
                      ) : (
                        <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="18" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(234,88,12,0.3)] hover:shadow-[0_0_30px_rgba(234,88,12,0.5)] active:scale-[0.98] mt-4"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Verify Credentials <FiArrowRight /></>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center border border-orange-500/30 text-orange-500 shadow-[0_0_20px_rgba(234,88,12,0.2)]">
                    <FiKey size={28} />
                  </div>
                </div>

                <div className="flex gap-2 justify-center">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-14 text-center text-xl font-bold rounded-lg bg-black border border-gray-800 focus:bg-gray-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-white outline-none"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(234,88,12,0.3)] hover:shadow-[0_0_30px_rgba(234,88,12,0.5)] active:scale-[0.98]"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Authorize Access <FiShield /></>
                  )}
                </button>
                
                <div className="text-center mt-4">
                  <button type="button" onClick={() => setStep(1)} className="text-xs text-gray-500 hover:text-orange-500 transition-colors font-semibold uppercase tracking-wider">
                    Cancel & Return
                  </button>
                </div>
              </form>
            )}

          </div>

          <div className="mt-12 text-center">
            <button 
              onClick={() => navigate('/user/login')}
              className="text-xs font-bold text-gray-500 hover:text-orange-500 transition-colors uppercase tracking-wider"
            >
              Back to User Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
