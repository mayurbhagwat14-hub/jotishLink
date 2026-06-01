import { useState, useEffect } from 'react';
import { FiTrendingUp, FiDownload, FiCreditCard, FiClock } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAstrologerEarningsThunk } from '../../store/slices/astrologerSlice';

const Earnings = () => {
  const dispatch = useDispatch();
  const { earnings: { earnings = [], total = 0 }, loading } = useSelector((state) => state.astrologer);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  useEffect(() => {
    dispatch(fetchAstrologerEarningsThunk());
  }, [dispatch]);

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Earnings & Wallet</h1>
          <p className="text-gray-500 font-medium">Manage your revenue and payouts</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 shadow-sm transition-all">
          <FiDownload /> Download Statement
        </button>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-6 text-white shadow-lg shadow-orange-500/20 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <p className="text-orange-100 font-medium mb-1">Available Balance</p>
          <h2 className="text-4xl font-black mb-6">₹{total.toLocaleString()}</h2>
          
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 flex gap-3">
            <input 
              type="number" 
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Amount to withdraw" 
              className="bg-transparent text-white placeholder-orange-200 outline-none w-full font-bold"
            />
            <button className="bg-white text-orange-600 px-4 py-1.5 rounded-lg font-bold text-sm hover:bg-orange-50 transition-colors shrink-0 shadow-sm">
              Withdraw
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 text-green-500 rounded-full flex items-center justify-center">
              <FiTrendingUp size={20} />
            </div>
            <h3 className="font-bold text-gray-700">This Month</h3>
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-800 mb-1">₹45,200</h2>
            <p className="text-sm font-bold text-green-500 flex items-center gap-1">+12.5% from last month</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center">
              <FiCreditCard size={20} />
            </div>
            <h3 className="font-bold text-gray-700">Bank Account</h3>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">HDFC Bank ending in</p>
            <h2 className="text-xl font-black text-gray-800">**** **** **** 4592</h2>
            <button className="text-orange-500 text-sm font-bold mt-3 hover:underline">Manage Accounts</button>
          </div>
        </div>
      </div>

      {/* Recent Earnings List */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Recent Session Earnings</h2>
        </div>
        
        <div className="bg-orange-50/50 border border-orange-100 p-3 rounded-xl mb-6">
          <p className="text-xs text-orange-700 font-medium text-center">
            *All amounts shown below are your <strong className="font-bold">net earnings (70%)</strong> after the platform commission is automatically deducted.
          </p>
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {earnings.length > 0 ? earnings.map((earn, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 border border-gray-50 rounded-xl hover:bg-gray-50">
              <div>
                <p className="font-bold text-gray-800 flex items-center gap-2">Session <span className="text-xs font-normal text-gray-400">({earn.sessionId.slice(-6)})</span></p>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <FiClock size={12} />
                  {Math.floor((earn.durationSeconds || 0) / 60)}m {(earn.durationSeconds || 0) % 60}s
                  <span className="ml-2 text-xs text-gray-400">{new Date(earn.date).toLocaleDateString()}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="font-black text-green-600">₹{earn.amount}</p>
              </div>
            </div>
          )) : (
            <p className="text-gray-500 text-center py-4">No recent earnings available.</p>
          )}
        </div>
      </div>

    </div>
  );
};

export default Earnings;
