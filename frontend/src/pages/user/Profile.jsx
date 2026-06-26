import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiArrowLeft, FiUploadCloud, FiSave, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import { updateUser, fetchProfileThunk, updateProfileThunk, logout } from '../../store/slices/authSlice';
import axiosInstance from '../../api/axios';
import { toast } from 'react-hot-toast';

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const context = useOutletContext();
  const openSidebar = context?.openSidebar;
  const { user } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState(() => ({
    name: user?.name || '',
    gender: user?.gender || 'Male',
    dob: user?.dob || '',
    timeOfBirth: user?.timeOfBirth || '',
    placeOfBirth: user?.placeOfBirth || user?.birthplace || '',
    address: user?.address || '',
    city: user?.city || '',
    pincode: user?.pincode || '',
    avatar: user?.avatar || '',
  }));

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await axiosInstance.delete('/user/profile/delete');
      try {
        const fcmToken = localStorage.getItem('jl_last_fcm_token');
        await axiosInstance.post('/auth/logout', { fcmToken, role: 'user' });
        localStorage.removeItem('jl_last_fcm_token');
        localStorage.removeItem('jl_last_fcm_role');
      } catch (e) {}
      dispatch(logout());
      navigate('/user/login');
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await axiosInstance.post('/user/test-push');
      toast.success('Test notification sent!');
    } catch (err) {
      console.error('Failed to send test notification:', err);
      toast.error(err?.response?.data?.message || 'Failed to send test notification');
    }
  };

  useEffect(() => {
    dispatch(fetchProfileThunk()).unwrap().then((data) => {
      if (data) {
        const profile = data?.data?.user || data?.user || data;
        setFormData({
          name: profile?.name || '',
          gender: profile?.gender || 'Male',
          dob: profile?.dob || '',
          timeOfBirth: profile?.timeOfBirth || '',
          placeOfBirth: profile?.placeOfBirth || profile?.birthplace || '',
          address: profile?.address || '',
          city: profile?.city || '',
          pincode: profile?.pincode || '',
          avatar: profile?.avatar || '',
        });
      }
    }).catch(err => console.error("Error fetching profile:", err));
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      return toast.error("Name cannot be empty");
    }
    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      return toast.error("Pincode must be exactly 6 digits.");
    }
    try {
      await dispatch(updateProfileThunk(formData)).unwrap();
      toast.success("Profile updated successfully!");
      navigate('/user/home');
    } catch (err) {
      console.error("Failed to update profile", err);
      toast.error(err?.message || "Failed to update profile. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-50 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="mr-3 hover:bg-gray-100 p-1.5 rounded-full transition-colors">
            <FiArrowLeft size={20} className="text-gray-800" />
          </button>
          <h1 className="text-[17px] font-semibold text-gray-800">Profile</h1>
        </div>
        <div 
          onClick={openSidebar}
          className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden border border-orange-200 cursor-pointer shrink-0"
        >
          {user?.avatar ? (
            <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-orange-500 font-bold text-xs">{(user?.name || 'G')[0]}</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {/* Avatar Section */}
        <div className="flex flex-col items-center pt-8 pb-6 bg-gradient-to-b from-orange-50 to-white">
          <div className="relative mb-3">
            <div className="w-28 h-28 rounded-full border-[3px] border-orange-300 flex items-center justify-center overflow-hidden bg-white shadow-lg">
              {formData.avatar ? (
                <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-orange-50">
                  <svg className="w-16 h-16 text-orange-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <label className="absolute bottom-1 right-1 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-orange-600 transition-colors">
              <FiUploadCloud size={16} className="text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>
          <span className="text-gray-500 text-[14px] font-medium">{user?.phone || '+91-876xxxx836'}</span>
        </div>

        {/* Form Section */}
        <div className="px-6 space-y-6 mt-4">
          {/* Name */}
          <div>
            <label className="text-gray-500 text-[13px] font-semibold">Name*</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-transparent border-b-2 border-orange-200 py-2 text-gray-800 font-medium text-[15px] outline-none focus:border-orange-500 transition-colors"
              placeholder="Enter Name"
            />
          </div>

          {/* Gender */}
          <div className="flex items-center gap-6 pt-2">
            <span className="text-gray-500 text-[13px] font-semibold">Gender</span>
            <div className="flex items-center gap-6">
              {['Male', 'Female'].map((g) => (
                <label key={g} className="flex items-center gap-2 cursor-pointer">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${formData.gender === g ? 'border-orange-500' : 'border-gray-300'}`}>
                    {formData.gender === g && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />}
                  </div>
                  <input type="radio" name="gender" value={g} checked={formData.gender === g} onChange={handleChange} className="hidden" />
                  <span className={`text-[15px] ${formData.gender === g ? 'text-orange-600 font-semibold' : 'text-gray-600'}`}>{g}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="text-gray-500 text-[13px] font-semibold">Date of Birth</label>
            <input type="text" name="dob" value={formData.dob} onChange={handleChange}
              className="w-full bg-transparent border-b-2 border-orange-200 py-2 text-gray-800 font-medium text-[15px] outline-none focus:border-orange-500 transition-colors" />
          </div>

          {/* Time of Birth */}
          <div>
            <label className="text-gray-500 text-[13px] font-semibold">Time of Birth</label>
            <input type="text" name="timeOfBirth" value={formData.timeOfBirth} onChange={handleChange}
              className="w-full bg-transparent border-b-2 border-orange-200 py-2 text-gray-800 font-medium text-[15px] outline-none focus:border-orange-500 transition-colors" />
          </div>

          {/* Place of Birth */}
          <div>
            <label className="text-gray-500 text-[13px] font-semibold">Place of Birth</label>
            <input type="text" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleChange}
              className="w-full bg-transparent border-b-2 border-orange-200 py-2 text-gray-800 font-medium text-[15px] outline-none focus:border-orange-500 transition-colors" />
          </div>

          {/* Current Address */}
          <div className="mt-6">
            <label className="text-gray-500 text-[13px] font-semibold">Current Address</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange}
              placeholder="Enter Flat, House no, Building, Apartment"
              className="w-full bg-transparent border-b-2 border-orange-200 py-2 text-gray-400 font-medium text-[15px] outline-none focus:border-orange-500 focus:text-gray-800 transition-colors" />
          </div>

          {/* City */}
          <div>
            <label className="text-gray-500 text-[13px] font-semibold">City, State, Country</label>
            <input type="text" name="city" value={formData.city} onChange={handleChange}
              placeholder="Enter Town/City, State, Country"
              className="w-full bg-transparent border-b-2 border-orange-200 py-2 text-gray-400 font-medium text-[15px] outline-none focus:border-orange-500 focus:text-gray-800 transition-colors" />
          </div>

          {/* Pincode */}
          <div>
            <label className="text-gray-500 text-[13px] font-semibold">Pincode</label>
            <input type="text" name="pincode" value={formData.pincode} onChange={handleChange}
              className="w-full bg-transparent border-b-2 border-orange-200 py-2 text-gray-800 font-medium text-[15px] outline-none focus:border-orange-500 transition-colors" />
          </div>
        </div>
      </div>

      {/* Submit Button & Delete Account */}
      <div className="p-4 bg-white mt-auto border-t border-gray-50 space-y-3">
        <button onClick={handleSubmit} className="w-full py-4 flex items-center justify-center gap-2 bg-orange-500 text-white font-bold text-[16px] rounded-xl shadow-lg shadow-orange-200 hover:bg-orange-600 active:scale-[0.98] transition-all">
          <FiSave /> Save Changes
        </button>
        <button 
          onClick={handleTestNotification} 
          className="w-full py-3.5 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 font-bold text-[15px] rounded-xl hover:bg-blue-100 transition-colors"
        >
          Test Notification
        </button>
        <button 
          onClick={() => setShowDeleteModal(true)} 
          className="w-full py-3.5 flex items-center justify-center gap-2 bg-red-50 text-red-600 font-bold text-[15px] rounded-xl hover:bg-red-100 transition-colors"
        >
          <FiTrash2 /> Delete Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertTriangle size={32} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Account?</h3>
            <p className="text-gray-500 text-[14px] font-medium mb-6">
              Are you sure you want to permanently delete your account? All your details will be erased from the database. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                className="flex-1 py-3 text-white font-bold bg-red-500 hover:bg-red-600 rounded-xl transition-colors flex items-center justify-center gap-2"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
