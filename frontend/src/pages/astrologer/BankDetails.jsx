import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSave, FiArrowLeft, FiCreditCard } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAstrologerProfileThunk, updateAstrologerProfileThunk } from '../../store/slices/astrologerSlice';

const BankDetails = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { profile } = useSelector((state) => state.astrologer);

  const [formData, setFormData] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: ''
  });

  useEffect(() => {
    dispatch(fetchAstrologerProfileThunk());
  }, [dispatch]);

  useEffect(() => {
    if (profile?.astrologer?.bankDetails) {
       setFormData({
         accountHolderName: profile.astrologer.bankDetails.accountHolderName || '',
         bankName: profile.astrologer.bankDetails.bankName || '',
         accountNumber: profile.astrologer.bankDetails.accountNumber || '',
         ifscCode: profile.astrologer.bankDetails.ifscCode || '',
         upiId: profile.astrologer.bankDetails.upiId || ''
       });
    }
  }, [profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateAstrologerProfileThunk({
        bankDetails: JSON.stringify(formData)
      })).unwrap();
      
      navigate('/astrologer/earnings');
    } catch (err) {
      alert('Failed to update bank details: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <div className="p-4 md:p-8 animate-fade-in max-w-3xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button onClick={() => navigate('/astrologer/earnings')} className="flex items-center gap-2 text-gray-500 font-bold mb-2 hover:text-orange-500 transition-colors">
            <FiArrowLeft /> Back to Earnings
          </button>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Manage Bank Account</h1>
          <p className="text-gray-500 font-medium">Update your bank details for payouts</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
            <FiCreditCard size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Bank Details</h2>
            <p className="text-sm text-gray-500">Ensure this matches your registered PAN card name.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-gray-500 text-xs font-bold mb-2 uppercase tracking-wider">Account Holder Name</label>
              <input 
                type="text" 
                required
                value={formData.accountHolderName}
                onChange={(e) => setFormData({...formData, accountHolderName: e.target.value})}
                className="w-full border-2 border-gray-100 rounded-xl py-3 px-4 outline-none focus:border-blue-400 bg-gray-50 transition-all font-medium text-gray-800"
                placeholder="John Doe"
              />
            </div>
            
            <div>
              <label className="block text-gray-500 text-xs font-bold mb-2 uppercase tracking-wider">Bank Name</label>
              <input 
                type="text" 
                required
                value={formData.bankName}
                onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                className="w-full border-2 border-gray-100 rounded-xl py-3 px-4 outline-none focus:border-blue-400 bg-gray-50 transition-all font-medium text-gray-800"
                placeholder="e.g. HDFC Bank"
              />
            </div>

            <div>
              <label className="block text-gray-500 text-xs font-bold mb-2 uppercase tracking-wider">Account Number</label>
              <input 
                type="text" 
                required
                value={formData.accountNumber}
                onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                className="w-full border-2 border-gray-100 rounded-xl py-3 px-4 outline-none focus:border-blue-400 bg-gray-50 transition-all font-medium text-gray-800"
                placeholder="1234567890"
              />
            </div>

            <div>
              <label className="block text-gray-500 text-xs font-bold mb-2 uppercase tracking-wider">IFSC Code</label>
              <input 
                type="text" 
                required
                value={formData.ifscCode}
                onChange={(e) => setFormData({...formData, ifscCode: e.target.value})}
                className="w-full border-2 border-gray-100 rounded-xl py-3 px-4 outline-none focus:border-blue-400 bg-gray-50 transition-all font-medium text-gray-800 uppercase"
                placeholder="HDFC0001234"
              />
            </div>

            <div>
              <label className="block text-gray-500 text-xs font-bold mb-2 uppercase tracking-wider">UPI ID (Optional)</label>
              <input 
                type="text" 
                value={formData.upiId}
                onChange={(e) => setFormData({...formData, upiId: e.target.value})}
                className="w-full border-2 border-gray-100 rounded-xl py-3 px-4 outline-none focus:border-blue-400 bg-gray-50 transition-all font-medium text-gray-800"
                placeholder="username@bank"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button 
              type="submit"
              className="flex items-center gap-2 px-8 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 shadow-md shadow-blue-500/20 transition-all"
            >
              <FiSave /> Save Bank Details
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default BankDetails;
