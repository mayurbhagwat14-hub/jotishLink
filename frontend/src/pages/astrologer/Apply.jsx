import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle, FiClock, FiUploadCloud, FiCamera } from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import { login, astrologerSignupThunk } from '../../store/slices/authSlice';
import { checkAstrologerPhone, requestOtp, astrologerSignup } from '../../api/astrologerApis';

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
    dob: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    specialities: [],
    categories: [],
    experience: '',
    description: '',
    consultationStyle: '',
    education: '',
    certificationDetails: '',
    chatPrice: 5,
    callPrice: 5,
    videoPrice: 10,
    reportPrice: 0,
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: ''
  });

  const [otp, setOtp] = useState(['', '', '', '']);

  const [aadhaarFront, setAadhaarFront] = useState('');
  const [aadhaarBack, setAadhaarBack] = useState('');
  const [panCard, setPanCard] = useState('');
  const [certificate, setCertificate] = useState('');
  const [selfieVerification, setSelfieVerification] = useState('');

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

  const handleDocUpload = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setter(file);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setter(reader.result);
        };
        reader.readAsDataURL(file);
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

    // Comprehensive format validations
    const errors = [];
    if (!profilePic) errors.push('Profile Photo is required.');
    if (!aadhaarFront || !aadhaarBack || !panCard || !certificate || !selfieVerification) errors.push('All Document uploads are required.');
    if (formData.fullName.trim().length < 3) errors.push('Full Name must be at least 3 characters.');
    if (!/^\d{10}$/.test(formData.mobile)) errors.push('Mobile Number must be exactly 10 digits.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.push('Please enter a valid email format.');
    if (formData.password.length < 6) errors.push('Password must be at least 6 characters.');
    if (formData.specialities.length === 0) errors.push('Please select at least one Primary Speciality.');
    if (formData.categories.length === 0) errors.push('Please select at least one Expertise Category.');
    if (Number(formData.chatPrice) < 5 || Number(formData.callPrice) < 5 || Number(formData.videoPrice) < 5) {
      errors.push('All prices (Chat, Call, Video) must be at least ₹5/min.');
    }
    if (formData.description.trim().length < 20) errors.push('About You description must be at least 20 characters.');
    
    // Check some required text fields
    if (!formData.dob || !formData.address || !formData.city || !formData.state || !formData.pincode) errors.push('All Personal Details are required.');
    if (!formData.education || !formData.consultationStyle) errors.push('Professional details like education and style are required.');
    if (!formData.accountHolderName || !formData.bankName || !formData.accountNumber || !formData.ifscCode) errors.push('Bank details are required.');

    if (errors.length > 0) {
      setApiError('Validation Failed: ' + errors.join(' | '));
      setLoading(false);
      return;
    }

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
        email: formData.email,
        password: formData.password,
        otp: otp.join(''),
        skills: formData.specialities,
        categories: formData.categories,
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
        pricing: {
          chat: Number(formData.chatPrice) || 5,
          audioCall: Number(formData.callPrice) || 5,
          videoCall: Number(formData.videoPrice) || 10,
          report: Number(formData.reportPrice) || 0
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
      
      // Auto login in Redux with the token we get from signup
      if (res.data?.data?.accessToken) {
        dispatch(login({ 
          user: res.data.data.user, 
          token: res.data.data.accessToken 
        }));
      } else if (res.data?.accessToken) {
        dispatch(login({
          user: res.data.user,
          token: res.data.accessToken
        }));
      }

      setLoading(false);
      setStep(3); // Pending screen
    } catch (err) {
      console.error(err);
      setApiError(err.message || 'Invalid OTP. Please try again.');
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
      interval = setInterval(async () => {
        try {
          const res = await checkAstrologerPhone({ phone: formData.mobile });
          const data = res.data?.data || res.data;
          if (data?.approvalStatus === 'approved') {
            clearInterval(interval);
            navigate('/astrologer/dashboard');
          }
        } catch (e) {
          // ignore
        }
      }, 3000); // Check every 3 seconds
    }
    return () => clearInterval(interval);
  }, [step, formData.mobile, navigate]);

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

                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Date of Birth <span className="text-red-500">*</span></label>
                  <input 
                    type="date" 
                    name="dob"
                    required
                    value={formData.dob}
                    onChange={handleChange}
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

                {/* Address */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Address <span className="text-red-500">*</span></label>
                    <input type="text" name="address" required value={formData.address} onChange={handleChange} placeholder="Street Address" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-gray-800" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">City <span className="text-red-500">*</span></label>
                      <input type="text" name="city" required value={formData.city} onChange={handleChange} placeholder="City" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-gray-800" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">State <span className="text-red-500">*</span></label>
                      <input type="text" name="state" required value={formData.state} onChange={handleChange} placeholder="State" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-gray-800" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pincode <span className="text-red-500">*</span></label>
                      <input type="text" name="pincode" required value={formData.pincode} onChange={handleChange} placeholder="ZIP" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-gray-800" />
                    </div>
                  </div>
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
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Report Price (₹)</label>
                    <input type="number" name="reportPrice" min="0" value={formData.reportPrice} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none font-medium" />
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
                      <input type="password" name="accountNumber" required value={formData.accountNumber} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">IFSC Code <span className="text-red-500">*</span></label>
                      <input type="text" name="ifscCode" required value={formData.ifscCode} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none font-medium uppercase" />
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
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell us about your background, expertise, and how you help people..." 
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-gray-800 resize-none"
                ></textarea>
              </div>

              {/* Document Uploads Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Aadhaar Front", state: aadhaarFront, setter: setAadhaarFront },
                  { label: "Aadhaar Back", state: aadhaarBack, setter: setAadhaarBack },
                  { label: "PAN Card", state: panCard, setter: setPanCard },
                  { label: "Astrology Certificate", state: certificate, setter: setCertificate },
                  { label: "Selfie Verification", state: selfieVerification, setter: setSelfieVerification },
                ].map((doc, idx) => (
                  <label key={idx} className="relative cursor-pointer border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:border-orange-300 transition-colors bg-gray-50">
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleDocUpload(e, doc.setter)} required />
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
                          <span className="text-[10px] text-gray-500 mt-1 hover:text-orange-500">Click to change</span>
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
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiCheckCircle size={40} className="text-green-500" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-3">Application Submitted Successfully!</h2>
              <p className="text-gray-500 font-medium leading-relaxed mb-6">
                Thank you for applying, <span className="font-bold text-gray-800">{formData.fullName}</span>. 
                Your application has been sent to the admin panel for review. Our team will verify your details.
              </p>

              <div className="flex flex-col items-center justify-center space-y-4 mb-8">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-orange-500 font-bold text-sm animate-pulse">Waiting for Admin Approval...</p>
              </div>
              
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
