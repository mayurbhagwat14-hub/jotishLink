import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle, FiClock, FiUploadCloud, FiCamera } from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import { login, astrologerSignupThunk } from '../../store/slices/authSlice';
import { checkAstrologerPhone, requestOtp } from '../../api/astrologerApis';

const CATEGORIES = ['Love', 'Education', 'Marriage', 'Wealth', 'Health', 'Legal', 'Career'];
const SPECIALITIES = ['Vedic Astrology', 'Tarot Reading', 'Numerology', 'Palmistry', 'Vastu Shastra'];

const ApplyAstrologer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [identityProof, setIdentityProof] = useState('');
  const [apiError, setApiError] = useState('');
  const [tempAuthData, setTempAuthData] = useState(null);
  
  const prefilledPhone = location.state?.phone || '';
  
  // Form Data
  const [formData, setFormData] = useState({
    mobile: prefilledPhone,
    fullName: '',
    email: '',
    password: '',
    gender: '',
    specialities: [],
    categories: [],
    experience: '',
    description: '',
    chatPrice: 5,
    callPrice: 5,
    videoPrice: 10
  });

  const [otp, setOtp] = useState(['', '', '', '']);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdentityProof(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCategoryToggle = (category) => {
    setFormData(prev => {
      const isSelected = prev.categories.includes(category);
      if (isSelected) {
        return { ...prev, categories: prev.categories.filter(c => c !== category) };
      } else {
        return { ...prev, categories: [...prev.categories, category] };
      }
    });
  };

  const handleSpecialityToggle = (speciality) => {
    setFormData(prev => {
      const isSelected = prev.specialities.includes(speciality);
      if (isSelected) {
        return { ...prev, specialities: prev.specialities.filter(s => s !== speciality) };
      } else {
        return { ...prev, specialities: [...prev.specialities, speciality] };
      }
    });
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setApiError('');
    setOtp(['', '', '', '']); // Clear the OTP blocks
    try {
      // Pre-flight check: see if they are already an astrologer
      const checkRes = await checkAstrologerPhone({ phone: formData.mobile });
      const checkData = checkRes.data?.data || checkRes.data;
      
      if (checkData?.exists) {
        setApiError('This phone number is already registered as an astrologer. Please login instead.');
        setLoading(false);
        return;
      }

      await requestOtp(formData.mobile);
      setLoading(false);
      setStep(2);
    } catch (err) {
      console.error(err);
      setApiError(err.response?.data?.message || err.message || 'Failed to send OTP');
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setApiError('');
    try {
      const payload = {
        name: formData.fullName,
        phone: formData.mobile,
        password: formData.password,
        otp: otp.join(''),
        skills: formData.specialities,
        categories: formData.categories,
        experience: Number(formData.experience),
        about: formData.description,
        identityProof: identityProof,
        avatar: profilePic,
        pricing: {
          chat: Number(formData.chatPrice) || 5,
          audioCall: Number(formData.callPrice) || 5,
          videoCall: Number(formData.videoPrice) || 10
        }
      };
      const res = await dispatch(astrologerSignupThunk(payload)).unwrap();
      const data = res?.data || res;
      if (data?.accessToken) {
        setTempAuthData({ user: data.user, token: data.accessToken });
      }
      setLoading(false);
      setStep(3); // Pending screen
    } catch (err) {
      console.error(err);
      setApiError(err.message || 'Signup failed');
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1); // Only allow one digit
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 3) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  useEffect(() => {
    let interval;
    if (step === 3 && !isApproved) {
      interval = setInterval(async () => {
        try {
          const res = await checkAstrologerPhone({ phone: formData.mobile });
          const data = res.data?.data || res.data;
          if (data?.approvalStatus === 'approved') {
            setIsApproved(true);
            clearInterval(interval);
            setTimeout(() => {
              if (tempAuthData) {
                dispatch(login(tempAuthData));
                navigate('/astrologer/dashboard');
              } else {
                navigate('/astrologer/login');
              }
            }, 2000);
          }
        } catch (e) {
          // ignore polling errors
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [step, isApproved, formData.mobile, tempAuthData, dispatch, navigate]);

  return (
    <div className="min-h-screen bg-[#F8F9FC] font-sans flex flex-col items-center py-10 px-4">
      
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-10 text-white relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-bold mb-6 cursor-pointer bg-transparent border-none p-0">
              <FiArrowLeft size={16} /> Back
            </button>
            <h1 className="text-3xl font-black mb-2">Join as an Astrologer</h1>
            <p className="text-orange-100 font-medium">Partner with JyotishLink and guide millions of users worldwide.</p>
          </div>
        </div>

        {/* Form Container */}
        <div className="p-8">
          
          {/* STEP 1: Application Form */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-6 animate-fade-in">
              
              {/* Profile Photo Upload */}
              <div className="flex flex-col items-center justify-center mb-4">
                <label className="relative cursor-pointer group">
                  <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden transition-all group-hover:border-orange-500">
                    {profilePic ? (
                      <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <FiCamera size={28} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-bold">Upload</span>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
                <p className="text-xs font-bold text-gray-500 mt-2">Profile Photo <span className="text-red-500">*</span></p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name" 
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-gray-800"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Mobile Number <span className="text-red-500">*</span></label>
                  <div className="flex rounded-xl bg-gray-50 border border-gray-200 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all overflow-hidden">
                    <span className={`px-4 py-3 border-r border-gray-200 font-bold text-sm ${prefilledPhone ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 text-gray-500'}`}>+91</span>
                    <input 
                      type="tel" 
                      name="mobile"
                      required
                      value={formData.mobile}
                      onChange={handleChange}
                      readOnly={!!prefilledPhone}
                      placeholder="10-digit mobile number" 
                      className={`w-full px-4 py-3 border-0 focus:outline-none font-medium text-gray-800 ${prefilledPhone ? 'bg-gray-100 cursor-not-allowed' : 'bg-transparent'}`}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address <span className="text-red-500">*</span></label>
                  <input 
                    type="email" 
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com" 
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-gray-800"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password <span className="text-red-500">*</span></label>
                  <input 
                    type="password" 
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password" 
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-gray-800"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Gender <span className="text-red-500">*</span></label>
                  <select 
                    name="gender"
                    required
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-gray-800"
                  >
                    <option value="" disabled>Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Speciality */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Primary Specialities <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-3">
                    {SPECIALITIES.map(spec => (
                      <label key={spec} className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 hover:border-orange-300 transition-all">
                        <input 
                          type="checkbox" 
                          checked={formData.specialities.includes(spec)}
                          onChange={() => handleSpecialityToggle(spec)}
                          className="accent-orange-500 w-4 h-4"
                        />
                        <span className="text-sm font-medium text-gray-700">{spec}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Expertise Categories <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-3">
                    {CATEGORIES.map(cat => (
                      <label key={cat} className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 hover:border-orange-300 transition-all">
                        <input 
                          type="checkbox" 
                          checked={formData.categories.includes(cat)}
                          onChange={() => handleCategoryToggle(cat)}
                          className="accent-orange-500 w-4 h-4"
                        />
                        <span className="text-sm font-medium text-gray-700">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Experience */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Experience (Years) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    name="experience"
                    min="0"
                    required
                    value={formData.experience}
                    onChange={handleChange}
                    placeholder="e.g. 5" 
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-gray-800"
                  />
                </div>
                
                {/* Pricing Details */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Chat Price */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Chat Price/min (₹) <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      name="chatPrice"
                      min="5"
                      required
                      value={formData.chatPrice}
                      onChange={handleChange}
                      placeholder="Min 5" 
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-gray-800"
                    />
                  </div>
                  {/* Call Price */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Audio Call Price/min (₹) <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      name="callPrice"
                      min="5"
                      required
                      value={formData.callPrice}
                      onChange={handleChange}
                      placeholder="Min 5" 
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-gray-800"
                    />
                  </div>
                  {/* Video Price */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Video Call Price/min (₹) <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      name="videoPrice"
                      min="5"
                      required
                      value={formData.videoPrice}
                      onChange={handleChange}
                      placeholder="Min 5" 
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-gray-800"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">About You (Description) <span className="text-red-500">*</span></label>
                <textarea 
                  name="description"
                  required
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell us about your background, expertise, and how you help people..." 
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-gray-800 resize-none"
                ></textarea>
              </div>

              {/* Document Upload */}
              <div>
                <label className="relative cursor-pointer block border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-orange-300 transition-colors bg-gray-50">
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleDocumentUpload} required />
                  {identityProof ? (
                    <div className="text-green-500">
                      <FiCheckCircle size={28} className="mx-auto mb-2" />
                      <p className="text-sm font-bold">Document Uploaded Successfully</p>
                    </div>
                  ) : (
                    <>
                      <FiUploadCloud size={28} className="text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-bold text-gray-700">Upload Identity Proof (Aadhar/PAN) <span className="text-red-500">*</span></p>
                      <p className="text-xs text-gray-400 mt-1">Required for verification</p>
                    </>
                  )}
                </label>
              </div>

              {apiError && <p className="text-xs font-bold text-red-500 text-center mb-4">{apiError}</p>}
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl shadow-lg shadow-orange-500/30 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Submit Application & Get OTP'}
              </button>
            </form>
          )}

          {/* STEP 2: OTP Verification */}
          {step === 2 && (
            <div className="text-center py-8 animate-fade-in max-w-sm mx-auto">
              <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FiCheckCircle size={32} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Verify Mobile Number</h2>
              <p className="text-sm text-gray-500 font-medium mb-8">We've sent a 4-digit OTP to <span className="font-bold text-gray-800">+91 {formData.mobile}</span></p>
              
              {apiError && <p className="text-xs font-bold text-red-500 text-center mb-4">{apiError}</p>}
              <form onSubmit={handleVerifyOtp}>
                <div className="flex justify-center gap-3 mb-8">
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      value={otp[index]}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      className="w-14 h-14 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 text-center text-xl font-black text-gray-900 outline-none transition-all"
                    />
                  ))}
                </div>
                
                <button 
                  type="submit"
                  disabled={loading || otp.join('').length < 4}
                  className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl shadow-lg shadow-orange-500/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify & Complete Application'}
                </button>
              </form>
              
              <p className="text-xs font-bold text-gray-400 mt-6">Didn't receive code? <button type="button" onClick={handleSendOtp} className="text-orange-500 hover:underline">Resend OTP</button></p>
            </div>
          )}

          {/* STEP 3: Approval Status */}
          {step === 3 && (
            <div className="text-center py-10 animate-fade-in max-w-md mx-auto">
              
              {!isApproved ? (
                <>
                  <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                    <FiClock size={40} className="text-blue-500" />
                    <span className="absolute top-0 right-0 w-6 h-6 bg-yellow-400 rounded-full border-4 border-white flex items-center justify-center animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 mb-3">Application Submitted!</h2>
                  <p className="text-gray-500 font-medium leading-relaxed mb-8">
                    Thank you for applying, <span className="font-bold text-gray-800">{formData.fullName}</span>. 
                    Your application has been sent to the admin panel for review. Our team will verify your details and get back to you shortly.
                  </p>
                  
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-left mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <p className="text-sm font-bold text-gray-800">Application Received</p>
                    </div>
                    <div className="flex items-center gap-3 mb-4 opacity-50">
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                      <p className="text-sm font-bold text-gray-500">Document Verification</p>
                    </div>
                    <div className="flex items-center gap-3 opacity-50">
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                      <p className="text-sm font-bold text-gray-500">Final Approval</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="animate-scale-in">
                  <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiCheckCircle size={40} className="text-green-500" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 mb-3">Application Approved!</h2>
                  <p className="text-gray-500 font-medium leading-relaxed mb-8">
                    Congratulations! Your astrologer profile has been verified and approved by the admin. Redirecting you to your dashboard...
                  </p>
                  <div className="flex justify-center">
                    <span className="w-8 h-8 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                  </div>
                </div>
              )}
              
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ApplyAstrologer;
