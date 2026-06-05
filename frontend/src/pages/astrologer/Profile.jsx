import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSave, FiPlus, FiX } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAstrologerProfileThunk, updateAstrologerProfileThunk } from '../../store/slices/astrologerSlice';

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { profile } = useSelector((state) => state.astrologer);

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
    avatar: ''
  });

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
         avatar: profile.astrologer.avatar || ''
       });
       setLanguages(profile.astrologer.languages || []);
       setExpertise(profile.astrologer.skills || []);
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
      alert("Minimum price for any service must be at least ₹5/min");
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

      navigate('/astrologer/dashboard');
    } catch (err) {
      alert('Failed to save profile: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <div className="p-4 md:p-8 animate-fade-in max-w-5xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Profile & Settings</h1>
          <p className="text-gray-500 font-medium">Manage your public presence and pricing</p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 shadow-md shadow-orange-500/20 transition-all"
        >
          <FiSave /> Save Changes
        </button>
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
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3">Availability Schedule</h2>
            <p className="text-sm text-gray-500 mb-4">Set your regular working hours so users know when to expect you online.</p>
            
            <div className="space-y-3">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
                <div key={day} className="flex items-center justify-between">
                  <span className="font-bold text-gray-700 w-10">{day}</span>
                  <select className="border border-gray-200 rounded-lg px-2 py-1 text-sm bg-gray-50 outline-none">
                    <option>09:00 AM</option>
                    <option>10:00 AM</option>
                  </select>
                  <span className="text-gray-400 text-xs">to</span>
                  <select className="border border-gray-200 rounded-lg px-2 py-1 text-sm bg-gray-50 outline-none">
                    <option>05:00 PM</option>
                    <option>06:00 PM</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
