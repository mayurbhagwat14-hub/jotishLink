import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle, FiClock, FiUploadCloud, FiCamera } from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import { login } from '../../store/slices/authSlice';

const ApplyAstrologer = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  
  // Form Data
  const [formData, setFormData] = useState({
    mobile: '',
    fullName: '',
    email: '',
    gender: '',
    speciality: '',
    experience: '',
    description: ''
  });

  const [otp, setOtp] = useState(['', '', '', '']);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProfilePic(url);
    }
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1000);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3); // Pending screen
    }, 1500);
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

  // Demo function to simulate admin approval
  const simulateAdminApproval = () => {
    setIsApproved(true);
    setTimeout(() => {
      dispatch(login({ user: { name: formData.fullName, role: 'astrologer' }, token: 'astro-token-123' }));
      navigate('/astrologer/dashboard');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] font-sans flex flex-col items-center py-10 px-4">
      
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-10 text-white relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-bold mb-6">
              <FiArrowLeft size={16} /> Back to Home
            </Link>
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
                    <span className="px-4 py-3 bg-gray-100 border-r border-gray-200 text-gray-500 font-bold text-sm">+91</span>
                    <input 
                      type="tel" 
                      name="mobile"
                      required
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder="10-digit mobile number" 
                      className="w-full px-4 py-3 bg-transparent border-0 focus:outline-none font-medium text-gray-800"
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
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Primary Speciality <span className="text-red-500">*</span></label>
                  <select 
                    name="speciality"
                    required
                    value={formData.speciality}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-gray-800"
                  >
                    <option value="" disabled>Select Speciality</option>
                    <option value="Vedic Astrology">Vedic Astrology</option>
                    <option value="Tarot Reading">Tarot Reading</option>
                    <option value="Numerology">Numerology</option>
                    <option value="Palmistry">Palmistry</option>
                    <option value="Vastu">Vastu Shastra</option>
                  </select>
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

              {/* Document Upload Mock */}
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-orange-300 transition-colors cursor-pointer bg-gray-50">
                <FiUploadCloud size={28} className="text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-700">Upload Identity Proof (Aadhar/PAN)</p>
                <p className="text-xs text-gray-400 mt-1">Required for verification</p>
              </div>

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
              
              <p className="text-xs font-bold text-gray-400 mt-6">Didn't receive code? <button className="text-orange-500 hover:underline">Resend OTP</button></p>
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

                  {/* Development Only button to simulate admin approval */}
                  <button 
                    onClick={simulateAdminApproval}
                    className="text-xs font-bold text-gray-400 hover:text-orange-500 underline decoration-dotted transition-colors"
                  >
                    [Demo Only] Simulate Admin Approval
                  </button>
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
