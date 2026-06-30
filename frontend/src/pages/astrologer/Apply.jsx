import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle, FiClock, FiUploadCloud, FiCamera } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { astrologerLogin, astrologerSignupThunk } from '../../store/slices/astrologerAuthSlice';
import { checkAstrologerPhone, requestOtp, astrologerSignup } from '../../api/astrologerApis';

const CATEGORIES = ['Love', 'Education', 'Marriage', 'Wealth', 'Health', 'Legal', 'Career', 'Business', 'Kids'];
const SPECIALITIES = ['Vedic Astrology', 'Tarot Reading', 'Numerology', 'Palmistry', 'Vastu Shastra'];
const LANGUAGES = ['Hindi', 'English', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Gujarati', 'Bengali'];
const POOJA_TYPES = ['Satyanarayan Pooja', 'Griha Pravesh', 'Navagraha Shanti', 'Rudrabhishek', 'Vastu Shanti', 'Marriage Pooja', 'Maha Mrityunjaya', 'Kaal Sarp Dosh Nivaran', 'Mangal Dosh Nivaran'];

const ApplyAstrologer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  // Use sessionStorage for bulletproof step persistency across refreshes
  const [step, setStepState] = useState(() => Number(sessionStorage.getItem('apply_step')) || 1);

  const setStep = (newStep, extraState = {}) => {
    sessionStorage.setItem('apply_step', newStep);
    if (extraState.mobile) sessionStorage.setItem('apply_mobile', extraState.mobile);
    if (extraState.authData) sessionStorage.setItem('apply_authData', JSON.stringify(extraState.authData));
    
    setStepState(newStep);
    navigate(location.pathname, { replace: false }); // Push state for back button handling
  };

  // Intercept back button
  useEffect(() => {
    const handlePopState = () => {
      if (step > 1) {
        navigate('/astrologer/login');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [step, navigate]);
  const [loading, setLoading] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [identityProof, setIdentityProof] = useState('');
  const [apiError, setApiError] = useState('');
  const [tempAuthData, setTempAuthData] = useState(null);
  const { appName } = useSelector(state => state.settings) || { appName: 'JyotishLink' };
  
  const prefilledPhone = location.state?.phone || '';
  
  // Form Data
  const [formData, setFormData] = useState({
    mobile: prefilledPhone,
    fullName: '',
    password: '',
    gender: '',
    dob: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    skills: [],
    categories: [],
    languages: [],
    experience: '',
    description: '',
    consultationStyle: '',
    education: '',
    certificationDetails: '',
    chatPrice: 5,
    callPrice: 5,
    videoPrice: 10,
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    isPandit: false,
    poojasOffered: []
  });

  // Load from local storage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('astrologerApplyData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData((prev) => ({ ...prev, ...parsed, mobile: prefilledPhone || parsed.mobile || '' }));
      } catch (err) {
        console.error('Failed to parse local storage data', err);
      }
    }
  }, [prefilledPhone]);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('astrologerApplyData', JSON.stringify(formData));
  }, [formData]);

  const [otp, setOtp] = useState(['', '', '', '']);

  // Load photos from sessionStorage
  const [profilePic, setProfilePic] = useState(() => sessionStorage.getItem('apply_profilePic') || null);
  const [aadhaarFront, setAadhaarFront] = useState(() => sessionStorage.getItem('apply_aadhaarFront') || '');
  const [aadhaarBack, setAadhaarBack] = useState(() => sessionStorage.getItem('apply_aadhaarBack') || '');
  const [panCard, setPanCard] = useState(() => sessionStorage.getItem('apply_panCard') || '');
  const [certificate, setCertificate] = useState(() => sessionStorage.getItem('apply_certificate') || '');
  const [selfieVerification, setSelfieVerification] = useState(() => sessionStorage.getItem('apply_selfieVerification') || '');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const compressImage = (file, maxWidth = 800, callback) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL('image/jpeg', 0.7)); // Compress to 70% quality JPEG
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, 400, (compressedDataUrl) => {
        setProfilePic(compressedDataUrl);
        try { sessionStorage.setItem('apply_profilePic', compressedDataUrl); } catch (e) { console.warn('Storage full'); }
      });
    }
  };

  const handleDocUpload = (e, setter, storageKey) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setter(file);
        // Can't reliably store File objects in sessionStorage, but we can store a flag
        try { sessionStorage.setItem(storageKey, 'pdf_attached'); } catch (e) {}
      } else {
        compressImage(file, 800, (compressedDataUrl) => {
          setter(compressedDataUrl);
          try { sessionStorage.setItem(storageKey, compressedDataUrl); } catch (e) { console.warn('Storage full'); }
        });
      }
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

  const handleSkillToggle = (skill) => {
    setFormData(prev => {
      const isSelected = prev.skills.includes(skill);
      if (isSelected) {
        return { ...prev, skills: prev.skills.filter(s => s !== skill) };
      } else {
        return { ...prev, skills: [...prev.skills, skill] };
      }
    });
  };

  const togglePooja = (poojaName) => {
    const exists = formData.poojasOffered.find(p => p.poojaName === poojaName);
    if (exists) {
      setFormData({ ...formData, poojasOffered: formData.poojasOffered.filter(p => p.poojaName !== poojaName) });
    } else {
      setFormData({ ...formData, poojasOffered: [...formData.poojasOffered, { poojaName, price: 500 }] });
    }
  };

  const handleLanguageToggle = (language) => {
    setFormData(prev => {
      const isSelected = prev.languages.includes(language);
      if (isSelected) {
        return { ...prev, languages: prev.languages.filter(l => l !== language) };
      } else {
        return { ...prev, languages: [...prev.languages, language] };
      }
    });
  };

  const updatePoojaPrice = (poojaName, price) => {
    setFormData({ 
      ...formData, 
      poojasOffered: formData.poojasOffered.map(p => p.poojaName === poojaName ? { ...p, price: Number(price) } : p)
    });
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setApiError('');
    setOtp(['', '', '', '']); // Clear the OTP blocks

    // Comprehensive format validations
    if (!profilePic) { toast.error('Profile Photo is required.'); return setLoading(false); }
    if (!aadhaarFront || !aadhaarBack || !panCard || !certificate || !selfieVerification) { toast.error('All Document uploads are required.'); return setLoading(false); }
    
    if (formData.fullName.trim().length < 3) { toast.error('Full Name must be at least 3 characters.'); return setLoading(false); }
    if (!/^[a-zA-Z\s.-]+$/.test(formData.fullName)) { toast.error('Full Name can only contain letters, spaces, dots, and hyphens.'); return setLoading(false); }
    if (!/^[6-9]\d{9}$/.test(formData.mobile)) { toast.error('Mobile Number must be a valid 10-digit Indian number.'); return setLoading(false); }

    if (formData.password.length < 6) { toast.error('Password must be at least 6 characters.'); return setLoading(false); }
    if (!formData.dob || !formData.address || !formData.city || !formData.state || !formData.pincode) { toast.error('All Personal Details are required.'); return setLoading(false); }
    if (!/^[a-zA-Z\s]+$/.test(formData.city)) { toast.error('City can only contain letters and spaces.'); return setLoading(false); }
    if (!/^[a-zA-Z\s]+$/.test(formData.state)) { toast.error('State can only contain letters and spaces.'); return setLoading(false); }
    if (!/^\d{6}$/.test(formData.pincode)) { toast.error('Pincode must be exactly 6 digits.'); return setLoading(false); }
    
    if (formData.skills.length === 0) { toast.error('Please select at least one Primary Skill.'); return setLoading(false); }
    if (formData.categories.length === 0) { toast.error('Please select at least one Expertise Category.'); return setLoading(false); }
    if (formData.languages.length === 0) { toast.error('Please select at least one Language.'); return setLoading(false); }
    
    if (!formData.education || !formData.consultationStyle) { toast.error('Professional details like education and style are required.'); return setLoading(false); }
    if (Number(formData.chatPrice) < 5 || Number(formData.callPrice) < 5 || Number(formData.videoPrice) < 5) { toast.error('All prices (Chat, Call, Video) must be at least ₹5/min.'); return setLoading(false); }
    
    if (!formData.accountHolderName || !formData.bankName || !formData.accountNumber || !formData.ifscCode) { toast.error('Bank details are required.'); return setLoading(false); }
    if (!/^[a-zA-Z\s]+$/.test(formData.accountHolderName)) { toast.error('Account Holder Name can only contain letters and spaces.'); return setLoading(false); }
    if (!/^[a-zA-Z\s]+$/.test(formData.bankName)) { toast.error('Bank Name can only contain letters and spaces.'); return setLoading(false); }
    if (!/^\d{9,18}$/.test(formData.accountNumber)) { toast.error('Account Number must be between 9 and 18 digits.'); return setLoading(false); }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode)) { toast.error('Invalid IFSC Code format. Example: SBIN0123456'); return setLoading(false); }
    
    if (formData.description.trim().length < 20) { toast.error('About You description must be at least 20 characters.'); return setLoading(false); }

    try {
      // Pre-flight check: see if they are already an astrologer
      const checkRes = await checkAstrologerPhone({ phone: formData.mobile, name: formData.fullName });
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
        skills: formData.skills,
        categories: formData.categories,
        languages: formData.languages,
        experience: Number(formData.experience),
        about: formData.description,
        avatar: profilePic,
        gender: formData.gender,
        dob: formData.dob,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        consultationStyle: formData.consultationStyle,
        education: formData.education,
        certificationDetails: formData.certificationDetails,
        aadhaarFront,
        aadhaarBack,
        panCard,
        certificate,
        selfieVerification,
        isPandit: formData.isPandit,
        poojasOffered: formData.poojasOffered,
        pricing: {
          chat: Number(formData.chatPrice) || 5,
          audioCall: Number(formData.callPrice) || 5,
          videoCall: Number(formData.videoPrice) || 10
        },
        bankDetails: {
          accountHolderName: formData.accountHolderName,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
          upiId: formData.upiId
        }
      };
      const res = await astrologerSignup(payload);
      
      // Store auth data temporarily instead of dispatching immediately
      // so we don't bypass the pending screen
      let authData = null;
      if (res.data?.data?.accessToken) {
        authData = { user: res.data.data.user, token: res.data.data.accessToken };
        setTempAuthData(authData);
      } else if (res.data?.accessToken) {
        authData = { user: res.data.user, token: res.data.accessToken };
        setTempAuthData(authData);
      }

      setLoading(false);
      setStep(3, { mobile: formData.mobile, authData }); // Pass state for polling across refreshes
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.message || 'Invalid OTP. Please try again.';
      setApiError(errorMsg);
      toast.error(errorMsg);
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

  // Poll for approval status automatically
  useEffect(() => {
    let interval;
    if (step === 3) {
      const pollingMobile = sessionStorage.getItem('apply_mobile') || formData.mobile;
      const rawAuth = sessionStorage.getItem('apply_authData');
      const savedAuthData = rawAuth ? JSON.parse(rawAuth) : tempAuthData;
      
      const checkStatus = async () => {
        try {
          const res = await checkAstrologerPhone({ phone: pollingMobile });
          const data = res.data?.data || res.data;
          if (data?.approvalStatus === 'approved') {
            if (interval) clearInterval(interval);
            
            // Clear all storages ONLY upon approval
            localStorage.removeItem('astrologerApplyData');
            sessionStorage.removeItem('apply_step');
            sessionStorage.removeItem('apply_mobile');
            sessionStorage.removeItem('apply_authData');
            sessionStorage.removeItem('apply_profilePic');
            sessionStorage.removeItem('apply_aadhaarFront');
            sessionStorage.removeItem('apply_aadhaarBack');
            sessionStorage.removeItem('apply_panCard');
            sessionStorage.removeItem('apply_certificate');
            sessionStorage.removeItem('apply_selfieVerification');
            
            if (savedAuthData) {
              // Update the stale user data with the fresh approved status so routing works
              if (savedAuthData.user) {
                savedAuthData.user.approvalStatus = 'approved';
              }
              dispatch(astrologerLogin(savedAuthData));
            } else {
              navigate('/astrologer/login');
            }
          }
        } catch (e) {
          console.error('Polling error', e);
        }
      };

      // Check instantly on mount/refresh so there is no 5 second delay
      checkStatus();
      interval = setInterval(checkStatus, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, formData.mobile, navigate, tempAuthData, dispatch]);

  return (
    <div className="min-h-screen bg-[#F8F9FC] font-sans flex flex-col items-center py-10 px-4">
      
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-10 text-white relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <button onClick={() => {
              if (step === 2) {
                setStep(1);
                setApiError('');
              } else {
                navigate(-1);
              }
            }} className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-bold mb-6 cursor-pointer bg-transparent border-none p-0">
              <FiArrowLeft size={16} /> Back
            </button>
            <h1 className="text-3xl font-black mb-2">Join as an Astrologer</h1>
            <p className="text-orange-100 font-medium">Partner with {appName} and guide millions of users worldwide.</p>
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
                  <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden transition-all group-hover:border-[#fa6830]">
                    {profilePic ? (
                      <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <FiCamera size={28} className="text-gray-400 group-hover:text-[#fa6830] transition-colors" />
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
                    minLength={3}
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name" 
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#fa6830] transition-all font-medium text-gray-800"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Mobile Number <span className="text-red-500">*</span></label>
                  <div className="flex rounded-xl bg-gray-50 border border-gray-200 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-[#fa6830] transition-all overflow-hidden">
                    <span className="px-4 py-3 border-r border-gray-200 font-bold text-sm bg-gray-100 text-gray-500">+91</span>
                    <input 
                      type="tel" 
                      name="mobile"
                      required
                      value={formData.mobile}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length > 0 && !/^[6-9]/.test(val)) return;
                        if (val.length <= 10) handleChange({ target: { name: 'mobile', value: val } });
                      }}
                      pattern="^[6-9]\d{9}$"
                      title="10-digit mobile number starting with 6-9"
                      placeholder="10-digit mobile number" 
                      className="w-full px-4 py-3 border-0 focus:outline-none font-medium text-gray-800 bg-transparent"
                    />
                  </div>
                </div>



                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password <span className="text-red-500">*</span></label>
                  <input 
                    type="password" 
                    name="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 6 characters" 
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#fa6830] transition-all font-medium text-gray-800"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Date of Birth <span className="text-red-500">*</span></label>
                  <input 
                    type="date" 
                    name="dob"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={formData.dob}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#fa6830] transition-all font-medium text-gray-800"
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
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#fa6830] transition-all font-medium text-gray-800"
                  >
                    <option value="" disabled>Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Address */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Address <span className="text-red-500">*</span></label>
                    <input type="text" name="address" required value={formData.address} onChange={handleChange} placeholder="Street Address" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#fa6830] transition-all font-medium text-gray-800" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">City <span className="text-red-500">*</span></label>
                      <input type="text" name="city" required value={formData.city} onChange={handleChange} placeholder="City" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#fa6830] transition-all font-medium text-gray-800" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">State <span className="text-red-500">*</span></label>
                      <input type="text" name="state" required value={formData.state} onChange={handleChange} placeholder="State" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#fa6830] transition-all font-medium text-gray-800" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pincode <span className="text-red-500">*</span></label>
                      <input type="text" name="pincode" required pattern="^\d{6}$" title="6-digit pincode" value={formData.pincode} onChange={handleChange} placeholder="e.g. 400001" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#fa6830] transition-all font-medium text-gray-800" />
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Primary Skills <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-3">
                    {SPECIALITIES.map(spec => (
                      <label key={spec} className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 hover:border-orange-300 transition-all">
                        <input 
                          type="checkbox" 
                          checked={formData.skills.includes(spec)}
                          onChange={() => handleSkillToggle(spec)}
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

                {/* Languages */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Languages <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-3">
                    {LANGUAGES.map(lang => (
                      <label key={lang} className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 hover:border-orange-300 transition-all">
                        <input 
                          type="checkbox" 
                          checked={formData.languages.includes(lang)}
                          onChange={() => handleLanguageToggle(lang)}
                          className="accent-orange-500 w-4 h-4"
                        />
                        <span className="text-sm font-medium text-gray-700">{lang}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Pandit Details */}
                <div className="md:col-span-2 bg-orange-50 border border-orange-100 p-5 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-orange-800 text-sm mb-1">Are you a Pandit?</h3>
                      <p className="text-xs text-[#e55923]">Do you perform poojas for users?</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={formData.isPandit}
                        onChange={(e) => setFormData({...formData, isPandit: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#fa6830]"></div>
                    </label>
                  </div>
                  
                  {formData.isPandit && (
                    <div className="mt-4 pt-4 border-t border-orange-200 animate-fade-in">
                      <label className="block text-xs font-bold text-orange-700 uppercase tracking-wider mb-3">Select Poojas You Offer</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {POOJA_TYPES.map(pooja => {
                          const selectedPooja = formData.poojasOffered.find(p => p.poojaName === pooja);
                          const isSelected = !!selectedPooja;
                          return (
                            <div 
                              key={pooja} 
                              className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer bg-white ${
                                isSelected ? 'border-[#fa6830]' : 'border-gray-100 hover:border-orange-200'
                              }`}
                              onClick={(e) => {
                                if(e.target.tagName !== 'INPUT') togglePooja(pooja);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 ${
                                  isSelected ? 'bg-[#fa6830] border-[#fa6830] text-white' : 'border-gray-300'
                                }`}>
                                  {isSelected && <FiCheckCircle size={12} />}
                                </div>
                                <span className={`text-sm font-bold ${isSelected ? 'text-orange-700' : 'text-gray-600'}`}>{pooja}</span>
                              </div>
                              
                              {isSelected && (
                                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                  <span className="text-gray-400 text-xs font-bold">₹</span>
                                  <input 
                                    type="number" 
                                    min="0"
                                    value={selectedPooja.price}
                                    onChange={(e) => updatePoojaPrice(pooja, e.target.value)}
                                    className="w-16 bg-white border border-orange-200 rounded-lg px-2 py-1 outline-none text-xs font-bold text-gray-800 focus:border-[#fa6830]"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
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
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#fa6830] transition-all font-medium text-gray-800"
                  />
                </div>

                {/* Professional Info */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Education <span className="text-red-500">*</span></label>
                    <input type="text" name="education" required value={formData.education} onChange={handleChange} placeholder="Highest Degree" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Certifications</label>
                    <input type="text" name="certificationDetails" value={formData.certificationDetails} onChange={handleChange} placeholder="Astrology certifications" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Consultation Style <span className="text-red-500">*</span></label>
                    <input type="text" name="consultationStyle" required value={formData.consultationStyle} onChange={handleChange} placeholder="e.g. Compassionate" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none font-medium" />
                  </div>
                </div>
                
                {/* Pricing Details */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Chat /min (₹) <span className="text-red-500">*</span></label>
                    <input type="number" name="chatPrice" min="5" required value={formData.chatPrice} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none font-medium" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Audio Call /min (₹) <span className="text-red-500">*</span></label>
                    <input type="number" name="callPrice" min="5" required value={formData.callPrice} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none font-medium" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Video Call /min (₹) <span className="text-red-500">*</span></label>
                    <input type="number" name="videoPrice" min="5" required value={formData.videoPrice} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none font-medium" />
                  </div>
                </div>

                {/* Bank Details */}
                <div className="md:col-span-2 mt-4">
                  <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Bank Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Account Holder Name <span className="text-red-500">*</span></label>
                      <input type="text" name="accountHolderName" required value={formData.accountHolderName} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bank Name <span className="text-red-500">*</span></label>
                      <input type="text" name="bankName" required value={formData.bankName} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Account Number <span className="text-red-500">*</span></label>
                      <input type="password" name="accountNumber" required pattern="^\d{9,18}$" title="Account number between 9 and 18 digits" value={formData.accountNumber} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">IFSC Code <span className="text-red-500">*</span></label>
                      <input type="text" name="ifscCode" required pattern="^[A-Za-z]{4}0[A-Za-z0-9]{6}$" title="Valid IFSC Code (e.g. SBIN0123456)" value={formData.ifscCode} onChange={(e) => handleChange({ target: { name: 'ifscCode', value: e.target.value.toUpperCase() } })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none font-medium" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">UPI ID (Optional)</label>
                      <input type="text" name="upiId" value={formData.upiId} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none font-medium" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">About You (Description) <span className="text-red-500">*</span></label>
                <textarea 
                  name="description"
                  required
                  minLength={20}
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell us about your background, expertise, and how you help people..." 
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#fa6830] transition-all font-medium text-gray-800 resize-none"
                ></textarea>
              </div>

              {/* Document Uploads Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Aadhaar Front", state: aadhaarFront, setter: setAadhaarFront, key: 'apply_aadhaarFront' },
                  { label: "Aadhaar Back", state: aadhaarBack, setter: setAadhaarBack, key: 'apply_aadhaarBack' },
                  { label: "PAN Card", state: panCard, setter: setPanCard, key: 'apply_panCard' },
                  { label: "Astrology Certificate", state: certificate, setter: setCertificate, key: 'apply_certificate' },
                  { label: "Selfie Verification", state: selfieVerification, setter: setSelfieVerification, key: 'apply_selfieVerification' },
                ].map((doc, idx) => (
                  <label key={idx} className="relative cursor-pointer border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:border-orange-300 transition-colors bg-gray-50">
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleDocUpload(e, doc.setter, doc.key)} required={!doc.state} />
                    {doc.state ? (
                      doc.state.startsWith('data:image/') ? (
                        <div className="relative w-full h-24 rounded-xl overflow-hidden group">
                          <img src={doc.state} alt={doc.label} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-xs font-bold">Change</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-green-500 flex flex-col items-center justify-center h-24">
                          <FiCheckCircle size={24} className="mx-auto mb-2" />
                          <p className="text-xs font-bold truncate px-2">{doc.label} Uploaded</p>
                          <span className="text-[10px] text-gray-500 mt-1 hover:text-[#fa6830]">Click to change</span>
                        </div>
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center h-24">
                        <FiUploadCloud size={24} className="text-gray-400 mx-auto mb-2" />
                        <p className="text-[11px] font-bold text-gray-700">{doc.label} <span className="text-red-500">*</span></p>
                      </div>
                    )}
                  </label>
                ))}
              </div>

              {apiError && <p className="text-xs font-bold text-red-500 text-center mb-4">{apiError}</p>}
              <button 
                type="submit"
                disabled={loading}
                className={`w-full py-4 font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
                  loading
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-70'
                    : 'bg-[#fa6830] hover:bg-[#e55923] text-white shadow-lg shadow-orange-500/30 active:scale-[0.98]'
                }`}
              >
                {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Submit Application & Get OTP'}
              </button>
            </form>
          )}

          {/* STEP 2: OTP Verification */}
          {step === 2 && (
            <div className="text-center py-8 animate-fade-in max-w-sm mx-auto">
              <div className="w-16 h-16 bg-orange-50 text-[#fa6830] rounded-2xl flex items-center justify-center mx-auto mb-6">
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
                      className="w-14 h-14 rounded-xl border-2 border-gray-200 focus:border-[#fa6830] focus:ring-4 focus:ring-orange-500/10 text-center text-xl font-black text-gray-900 outline-none transition-all"
                    />
                  ))}
                </div>
                
                <button 
                  type="submit"
                  disabled={loading || otp.join('').length < 4}
                  className="w-full py-4 bg-[#fa6830] hover:bg-[#e55923] text-white font-black rounded-xl shadow-lg shadow-orange-500/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify & Complete Application'}
                </button>
              </form>
              
              <p className="text-xs font-bold text-gray-400 mt-6">Didn't receive code? <button type="button" onClick={handleSendOtp} className="text-[#fa6830] hover:underline">Resend OTP</button></p>
            </div>
          )}

          {/* STEP 3: Approval Status */}
          {step === 3 && (
            <div className="text-center py-10 animate-fade-in max-w-md mx-auto">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiCheckCircle size={40} className="text-green-500" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-3">Application Submitted Successfully!</h2>
              <p className="text-gray-500 font-medium leading-relaxed mb-6">
                Thank you for applying, <span className="font-bold text-gray-800">{formData.fullName}</span>. 
                Your application has been sent to the admin panel for review. Our team will verify your details.
              </p>

              <button 
                onClick={() => navigate('/astrologer/dashboard')}
                className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all active:scale-[0.98]"
              >
                Go to Dashboard Later
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ApplyAstrologer;
