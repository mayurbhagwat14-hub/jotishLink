import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSave, FiPlus, FiX, FiCheck } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { fetchAstrologerProfileThunk, updateAstrologerProfileThunk } from '../../store/slices/astrologerSlice';
import { astrologerDeleteAccountThunk } from '../../store/slices/astrologerAuthSlice';
import { testPushNotification } from '../../api/astrologerApis';
import { FiBell } from 'react-icons/fi';

const POOJA_TYPES = ['Satyanarayan Pooja', 'Griha Pravesh', 'Navagraha Shanti', 'Rudrabhishek', 'Vastu Shanti', 'Marriage Pooja', 'Maha Mrityunjaya', 'Kaal Sarp Dosh Nivaran', 'Mangal Dosh Nivaran'];

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { profile } = useSelector((state) => state.astrologer);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [languages, setLanguages] = useState(['Hindi', 'English']);
  const [newLanguage, setNewLanguage] = useState('');
  
  const [expertise, setExpertise] = useState(['Vedic', 'Tarot', 'Numerology']);
  const [newExpertise, setNewExpertise] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    experience: '',
    dob: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    bio: '',
    chatPrice: '',
    audioPrice: '',
    videoPrice: '',
    avatar: '',
    isPandit: false,
    education: '',
    certificationDetails: '',
    consultationStyle: '',
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: ''
  });

  const [poojasOffered, setPoojasOffered] = useState([]);
  const [newPoojaName, setNewPoojaName] = useState('');
  const [newPoojaPrice, setNewPoojaPrice] = useState('');

  useEffect(() => {
    dispatch(fetchAstrologerProfileThunk());
  }, [dispatch]);

  useEffect(() => {
    if (profile?.astrologer) {
       setFormData({
         name: profile.astrologer.name || '',
         experience: profile.astrologer.experience?.toString() || '',
         dob: profile.astrologer.dob ? new Date(profile.astrologer.dob).toISOString().split('T')[0] : '',
         gender: profile.astrologer.gender || '',
         address: profile.astrologer.address || '',
         city: profile.astrologer.city || '',
         state: profile.astrologer.state || '',
         pincode: profile.astrologer.pincode || '',
         bio: profile.astrologer.about || '',
         chatPrice: profile.astrologer.pricing?.chat?.toString() || '15',
         audioPrice: profile.astrologer.pricing?.audioCall?.toString() || '20',
         videoPrice: profile.astrologer.pricing?.videoCall?.toString() || '50',
         avatar: profile.astrologer.avatar || '',
         isPandit: profile.astrologer.isPandit || false,
         education: profile.astrologer.education || '',
         certificationDetails: profile.astrologer.certificationDetails || '',
         consultationStyle: profile.astrologer.consultationStyle || '',
         accountHolderName: profile.astrologer.bankDetails?.accountHolderName || '',
         bankName: profile.astrologer.bankDetails?.bankName || '',
         accountNumber: profile.astrologer.bankDetails?.accountNumber || '',
         ifscCode: profile.astrologer.bankDetails?.ifscCode || '',
         upiId: profile.astrologer.bankDetails?.upiId || ''
       });
       setLanguages(profile.astrologer.languages || []);
       setExpertise(profile.astrologer.skills || []);
       setPoojasOffered(profile.astrologer.poojasOffered || []);
    }
  }, [profile]);

  const handleAddLanguage = (e) => {
    e.preventDefault();
    if (newLanguage.trim() && !languages.includes(newLanguage.trim())) {
      setLanguages([...languages, newLanguage.trim()]);
      setNewLanguage('');
    }
  };

  const removeLanguage = (lang) => {
    setLanguages(languages.filter(l => l !== lang));
  };

  const handleAddExpertise = (e) => {
    e.preventDefault();
    if (newExpertise.trim() && !expertise.includes(newExpertise.trim())) {
      setExpertise([...expertise, newExpertise.trim()]);
      setNewExpertise('');
    }
  };

  const removeExpertise = (exp) => {
    setExpertise(expertise.filter(e => e !== exp));
  };

  const togglePooja = (poojaName) => {
    const currentPoojas = Array.isArray(poojasOffered) ? poojasOffered : [];
    const exists = currentPoojas.find(p => p.poojaName === poojaName);
    if (exists) {
      setPoojasOffered(currentPoojas.filter(p => p.poojaName !== poojaName));
    } else {
      setPoojasOffered([...currentPoojas, { poojaName, price: 500 }]);
    }
  };

  const updatePoojaPrice = (poojaName, price) => {
    const currentPoojas = Array.isArray(poojasOffered) ? poojasOffered : [];
    setPoojasOffered(currentPoojas.map(p => p.poojaName === poojaName ? { ...p, price: Number(price) } : p));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const cPrice = Number(formData.chatPrice);
    const aPrice = Number(formData.audioPrice);
    const vPrice = Number(formData.videoPrice);

    if (cPrice < 5 || aPrice < 5 || vPrice < 5) {
      toast.error("Minimum price for any service must be at least ₹5/min");
      return;
    }
    
    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      toast.error('Pincode must be exactly 6 digits.');
      return;
    }
    
    if (formData.accountNumber && !/^\d{9,18}$/.test(formData.accountNumber)) {
      toast.error('Account Number must be between 9 and 18 digits.');
      return;
    }
    
    if (formData.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode)) {
      toast.error('Invalid IFSC Code format. Example: SBIN0123456');
      return;
    }

    try {
      const res = await dispatch(updateAstrologerProfileThunk({
        name: formData.name,
        experience: Number(formData.experience) || 0,
        dob: formData.dob || undefined,
        gender: formData.gender,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        about: formData.bio,
        languages,
        skills: expertise,
        avatar: formData.avatar,
        isPandit: formData.isPandit,
        education: formData.education,
        certificationDetails: formData.certificationDetails,
        consultationStyle: formData.consultationStyle,
        bankDetails: {
          accountHolderName: formData.accountHolderName,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
          upiId: formData.upiId
        },
        poojasOffered: JSON.stringify(poojasOffered),
        pricing: {
          chat: cPrice,
          audioCall: aPrice,
          videoCall: vPrice
        }
      })).unwrap();

      const updatedData = res?.data?.astrologer || res?.astrologer;
      if (updatedData) {
        dispatch({ type: 'auth/updateUser', payload: { avatar: updatedData.avatar, name: updatedData.name } });
      }

      toast.success('Profile updated successfully!');
      navigate('/astrologer/dashboard');
    } catch (err) {
      toast.error('Failed to save profile: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await dispatch(astrologerDeleteAccountThunk()).unwrap();
      toast.success("Account deleted successfully");
      navigate('/astrologer/login');
    } catch (err) {
      toast.error("Failed to delete account: " + (err.message || 'Unknown error'));
      setShowDeleteModal(false);
    }
  };

  const handleTestPush = async () => {
    try {
      await testPushNotification();
      toast.success("Test push notification sent! Check your device/browser.");
    } catch (err) {
      toast.error("Failed to send test push: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="p-4 md:p-8 animate-fade-in max-w-5xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Profile & Settings</h1>
          <p className="text-gray-500 font-medium">Manage your public presence and pricing</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleTestPush}
            className="flex items-center gap-2 px-6 py-2.5 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 shadow-md shadow-purple-500/20 transition-all"
          >
            <FiBell /> Test Push
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 shadow-md shadow-orange-500/20 transition-all"
          >
            <FiSave /> Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Basic Info & Tags */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-2 border-orange-200 overflow-hidden bg-orange-50 flex items-center justify-center text-orange-400 text-3xl font-bold">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  profile?.astrologer?.name?.[0] || 'A'
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center cursor-pointer shadow-md hover:bg-orange-600 transition-colors">
                <FiPlus />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Profile Photo</h2>
              <p className="text-sm text-gray-500 font-medium">Update your profile picture to build trust with users.</p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3">Personal Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-500 text-xs font-bold mb-1 uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border-2 border-gray-100 rounded-xl py-2 px-4 outline-none focus:border-orange-400 bg-gray-50 transition-all font-medium text-gray-800"
                />
              </div>
              <div>
                <label className="block text-gray-500 text-xs font-bold mb-1 uppercase tracking-wider">Experience (Years)</label>
                <input 
                  type="number" 
                  value={formData.experience}
                  onChange={(e) => setFormData({...formData, experience: e.target.value})}
                  className="w-full border-2 border-gray-100 rounded-xl py-2 px-4 outline-none focus:border-orange-400 bg-gray-50 transition-all font-medium text-gray-800"
                />
              </div>
              <div>
                <label className="block text-gray-500 text-xs font-bold mb-1 uppercase tracking-wider">Date of Birth</label>
                <input 
                  type="date" 
                  value={formData.dob}
                  onChange={(e) => setFormData({...formData, dob: e.target.value})}
                  className="w-full border-2 border-gray-100 rounded-xl py-2 px-4 outline-none focus:border-orange-400 bg-gray-50 transition-all font-medium text-gray-800"
                />
              </div>
              <div>
                <label className="block text-gray-500 text-xs font-bold mb-1 uppercase tracking-wider">Gender</label>
                <select 
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  className="w-full border-2 border-gray-100 rounded-xl py-2 px-4 outline-none focus:border-orange-400 bg-gray-50 transition-all font-medium text-gray-800"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3">Location Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-gray-500 text-xs font-bold mb-1 uppercase tracking-wider">Address</label>
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full border-2 border-gray-100 rounded-xl py-2 px-4 outline-none focus:border-orange-400 bg-gray-50 transition-all font-medium text-gray-800"
                />
              </div>
              <div>
                <label className="block text-gray-500 text-xs font-bold mb-1 uppercase tracking-wider">City</label>
                <input 
                  type="text" 
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full border-2 border-gray-100 rounded-xl py-2 px-4 outline-none focus:border-orange-400 bg-gray-50 transition-all font-medium text-gray-800"
                />
              </div>
              <div>
                <label className="block text-gray-500 text-xs font-bold mb-1 uppercase tracking-wider">State</label>
                <input 
                  type="text" 
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  className="w-full border-2 border-gray-100 rounded-xl py-2 px-4 outline-none focus:border-orange-400 bg-gray-50 transition-all font-medium text-gray-800"
                />
              </div>
              <div>
                <label className="block text-gray-500 text-xs font-bold mb-1 uppercase tracking-wider">Pincode</label>
                <input 
                  type="text" 
                  value={formData.pincode}
                  onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                  className="w-full border-2 border-gray-100 rounded-xl py-2 px-4 outline-none focus:border-orange-400 bg-gray-50 transition-all font-medium text-gray-800"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3">Public Biography</h2>
            <textarea
              rows="4"
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              className="w-full border-2 border-gray-100 rounded-xl py-3 px-4 outline-none focus:border-orange-400 bg-gray-50 transition-all text-gray-800 font-medium resize-none"
              placeholder="Tell users about your experience and methods..."
            ></textarea>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3">Languages Spoken</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {languages.map((lang, i) => (
                <div key={i} className="flex items-center gap-2 bg-orange-50 text-orange-600 font-bold px-3 py-1.5 rounded-lg border border-orange-100">
                  {lang}
                  <button onClick={() => removeLanguage(lang)} className="hover:text-red-500 transition-colors"><FiX size={14}/></button>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddLanguage} className="flex gap-2">
              <input 
                type="text" 
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                placeholder="Add a language..."
                className="flex-1 border-2 border-gray-100 rounded-xl py-2 px-4 outline-none focus:border-orange-400 bg-gray-50 transition-all text-[14px]"
              />
              <button type="submit" className="bg-gray-100 text-gray-600 p-2.5 rounded-xl hover:bg-gray-200 transition-colors">
                <FiPlus />
              </button>
            </form>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3">Areas of Expertise</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {expertise.map((exp, i) => (
                <div key={i} className="flex items-center gap-2 bg-purple-50 text-purple-600 font-bold px-3 py-1.5 rounded-lg border border-purple-100">
                  {exp}
                  <button onClick={() => removeExpertise(exp)} className="hover:text-red-500 transition-colors"><FiX size={14}/></button>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddExpertise} className="flex gap-2">
              <input 
                type="text" 
                value={newExpertise}
                onChange={(e) => setNewExpertise(e.target.value)}
                placeholder="Add an expertise (e.g. Palmistry)..."
                className="flex-1 border-2 border-gray-100 rounded-xl py-2 px-4 outline-none focus:border-orange-400 bg-gray-50 transition-all text-[14px]"
              />
              <button type="submit" className="bg-gray-100 text-gray-600 p-2.5 rounded-xl hover:bg-gray-200 transition-colors">
                <FiPlus />
              </button>
            </form>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Are you a Pandit?</h2>
                <p className="text-[13px] text-gray-500 font-medium mt-0.5">Do you perform poojas for users?</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer gap-3">
                <span className={`text-sm font-bold ${formData.isPandit ? 'text-orange-500' : 'text-gray-400'}`}>
                  {formData.isPandit ? 'Yes' : 'No'}
                </span>
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={formData.isPandit}
                    onChange={(e) => setFormData({...formData, isPandit: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </div>
              </label>
            </div>
            
            {formData.isPandit && (
              <div className="space-y-4 animate-fade-in mt-4">
                <div>
                  <label className="block text-gray-500 text-xs font-bold mb-3 uppercase tracking-wider">Select Poojas You Offer</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {POOJA_TYPES.map(pooja => {
                      const currentPoojas = Array.isArray(poojasOffered) ? poojasOffered : [];
                      const selectedPooja = currentPoojas.find(p => p.poojaName === pooja);
                      const isSelected = !!selectedPooja;
                      
                      return (
                        <div 
                          key={pooja} 
                          className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${
                            isSelected ? 'border-orange-500 bg-orange-50' : 'border-gray-100 bg-white hover:border-orange-200'
                          }`}
                          onClick={(e) => {
                            if(e.target.tagName !== 'INPUT') togglePooja(pooja);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 ${
                              isSelected ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300'
                            }`}>
                              {isSelected && <FiCheck size={12} />}
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
                                className="w-16 bg-white border border-orange-200 rounded-lg px-2 py-1 outline-none text-xs font-bold text-gray-800 focus:border-orange-500"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pricing & Schedule */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3">Pricing Settings (₹/min)</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-500 text-xs font-bold mb-1 uppercase tracking-wider">Chat Price</label>
                <input 
                  type="number" 
                  min="5"
                  value={formData.chatPrice}
                  onChange={(e) => setFormData({...formData, chatPrice: e.target.value})}
                  className="w-full border-2 border-gray-100 rounded-xl py-2.5 px-4 outline-none focus:border-orange-400 bg-gray-50 transition-all font-bold text-gray-800"
                />
              </div>
              <div>
                <label className="block text-gray-500 text-xs font-bold mb-1 uppercase tracking-wider">Audio Call Price</label>
                <input 
                  type="number" 
                  min="5"
                  value={formData.audioPrice}
                  onChange={(e) => setFormData({...formData, audioPrice: e.target.value})}
                  className="w-full border-2 border-gray-100 rounded-xl py-2.5 px-4 outline-none focus:border-orange-400 bg-gray-50 transition-all font-bold text-gray-800"
                />
              </div>
              <div>
                <label className="block text-gray-500 text-xs font-bold mb-1 uppercase tracking-wider">Video Call Price</label>
                <input 
                  type="number" 
                  min="5"
                  value={formData.videoPrice}
                  onChange={(e) => setFormData({...formData, videoPrice: e.target.value})}
                  className="w-full border-2 border-gray-100 rounded-xl py-2.5 px-4 outline-none focus:border-orange-400 bg-gray-50 transition-all font-bold text-gray-800"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3">Professional Info</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-500 text-xs font-bold mb-1 uppercase tracking-wider">Education</label>
                <input 
                  type="text" 
                  value={formData.education}
                  onChange={(e) => setFormData({...formData, education: e.target.value})}
                  className="w-full border-2 border-gray-100 rounded-xl py-2 px-4 outline-none focus:border-orange-400 bg-gray-50 transition-all font-medium text-gray-800"
                />
              </div>
              <div>
                <label className="block text-gray-500 text-xs font-bold mb-1 uppercase tracking-wider">Certifications</label>
                <input 
                  type="text" 
                  value={formData.certificationDetails}
                  onChange={(e) => setFormData({...formData, certificationDetails: e.target.value})}
                  className="w-full border-2 border-gray-100 rounded-xl py-2 px-4 outline-none focus:border-orange-400 bg-gray-50 transition-all font-medium text-gray-800"
                />
              </div>
              <div>
                <label className="block text-gray-500 text-xs font-bold mb-1 uppercase tracking-wider">Consultation Style</label>
                <input 
                  type="text" 
                  value={formData.consultationStyle}
                  onChange={(e) => setFormData({...formData, consultationStyle: e.target.value})}
                  className="w-full border-2 border-gray-100 rounded-xl py-2 px-4 outline-none focus:border-orange-400 bg-gray-50 transition-all font-medium text-gray-800"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3">Bank Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-500 text-xs font-bold mb-1 uppercase tracking-wider">Account Holder Name</label>
                <input 
                  type="text" 
                  value={formData.accountHolderName}
                  onChange={(e) => setFormData({...formData, accountHolderName: e.target.value})}
                  className="w-full border-2 border-gray-100 rounded-xl py-2 px-4 outline-none focus:border-orange-400 bg-gray-50 transition-all font-medium text-gray-800"
                />
              </div>
              <div>
                <label className="block text-gray-500 text-xs font-bold mb-1 uppercase tracking-wider">Bank Name</label>
                <input 
                  type="text" 
                  value={formData.bankName}
                  onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                  className="w-full border-2 border-gray-100 rounded-xl py-2 px-4 outline-none focus:border-orange-400 bg-gray-50 transition-all font-medium text-gray-800"
                />
              </div>
              <div>
                <label className="block text-gray-500 text-xs font-bold mb-1 uppercase tracking-wider">Account Number</label>
                <input 
                  type="password" 
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                  className="w-full border-2 border-gray-100 rounded-xl py-2 px-4 outline-none focus:border-orange-400 bg-gray-50 transition-all font-medium text-gray-800"
                />
              </div>
              <div>
                <label className="block text-gray-500 text-xs font-bold mb-1 uppercase tracking-wider">IFSC Code</label>
                <input 
                  type="text" 
                  value={formData.ifscCode}
                  onChange={(e) => setFormData({...formData, ifscCode: e.target.value})}
                  className="w-full border-2 border-gray-100 rounded-xl py-2 px-4 outline-none focus:border-orange-400 bg-gray-50 transition-all font-medium text-gray-800 uppercase"
                />
              </div>
              <div>
                <label className="block text-gray-500 text-xs font-bold mb-1 uppercase tracking-wider">UPI ID (Optional)</label>
                <input 
                  type="text" 
                  value={formData.upiId}
                  onChange={(e) => setFormData({...formData, upiId: e.target.value})}
                  className="w-full border-2 border-gray-100 rounded-xl py-2 px-4 outline-none focus:border-orange-400 bg-gray-50 transition-all font-medium text-gray-800"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Danger Zone */}
      <div className="mt-8 mb-24 lg:mb-8 bg-red-50/80 border border-red-200 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex-1">
          <h2 className="text-[17px] font-bold text-red-600">Danger Zone</h2>
          <p className="text-[13px] text-red-500/80 font-medium mt-1.5 leading-relaxed">Permanently delete your account and all associated data. This action cannot be undone.</p>
        </div>
        <button 
          onClick={() => setShowDeleteModal(true)}
          className="w-full sm:w-auto px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 shadow-md shadow-red-500/20 transition-all whitespace-nowrap active:scale-95"
        >
          Delete Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl transform transition-all">
            <div className="w-16 h-16 bg-red-50 border-4 border-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <FiX className="text-3xl text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 text-center mb-2">Delete Account?</h3>
            <p className="text-gray-500 text-center text-[14px] font-medium mb-6 leading-relaxed">
              Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be lost.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-md shadow-red-500/20"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
