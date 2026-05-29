import { useState } from 'react';
import { FiTrendingUp, FiDownload, FiCreditCard } from 'react-icons/fi';

const Earnings = () => {
  const [withdrawAmount, setWithdrawAmount] = useState('');

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
          <h2 className="text-4xl font-black mb-6">₹12,450</h2>
          
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

      {/* Revenue Breakdown */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Revenue Breakdown</h2>
        </div>
        
        <div className="bg-orange-50/50 border border-orange-100 p-3 rounded-xl mb-6">
          <p className="text-xs text-orange-700 font-medium text-center">
            *All amounts shown below are your <strong className="font-bold">net earnings (90%)</strong> after the standard 10% platform commission is automatically deducted per session.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-800">Chat Sessions</p>
              <p className="text-sm text-gray-500">45 sessions</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-800">₹8,500</p>
              <p className="text-sm text-green-500">65%</p>
            </div>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full" style={{ width: '65%' }}></div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <div>
              <p className="font-bold text-gray-800">Audio Calls</p>
              <p className="text-sm text-gray-500">12 sessions</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-800">₹2,450</p>
              <p className="text-sm text-blue-500">20%</p>
            </div>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: '20%' }}></div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <div>
              <p className="font-bold text-gray-800">Video Calls</p>
              <p className="text-sm text-gray-500">5 sessions</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-800">₹1,500</p>
              <p className="text-sm text-purple-500">15%</p>
            </div>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: '15%' }}></div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Earnings;
