import { useState } from 'react';
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiArrowLeft } from 'react-icons/fi';

const historyTabs = ['Chat', 'Wallet', 'Orders'];

const chatHistory = [
  { name: 'Astrologer', date: '01 Jan 25, 11:05 am', avatar: 'https://i.pravatar.cc/150?u=astro1', type: 'chat' },
  { name: 'Arun', date: '01 Jan 25, 11:05 am', avatar: 'https://i.pravatar.cc/150?u=arun', type: 'chat' },
  { name: 'Rahul', date: '01 Jan 25, 11:05 am', avatar: 'https://i.pravatar.cc/150?u=rahul99', type: 'chat' },
  { name: 'VinayS2', date: '01 Jan 25, 11:05 am', avatar: 'https://i.pravatar.cc/150?u=vinay2', type: 'chat' },
  { name: 'Arun', date: '01 Jan 25, 11:05 am', avatar: 'https://i.pravatar.cc/150?u=arun2', type: 'chat' },
  { name: 'Rahul', date: '01 Jan 25, 11:05 am', avatar: 'https://i.pravatar.cc/150?u=rahul2', type: 'chat' },
];

const walletTransactions = [
  { desc: 'Chat with Astrologer for 2 minutes', date: '#Chat, Date:01/01/2024', amount: -23, type: 'debit' },
  { desc: 'Chat with RahulS2 for 2 minutes', date: '#Chat, Date:01/01/2024', amount: -9, type: 'debit' },
  { desc: 'Chat with Shivaj for 7 minutes', date: '#Chat, Date:01/01/2024', amount: -25, type: 'debit' },
  { desc: 'Chat with Rishi for 5 minutes', date: '#Chat, Date:01/01/2024', amount: -14, type: 'debit' },
  { desc: 'Chat with Astrologer for 3 minutes', date: '#Chat, Date:01/01/2024', amount: -23, type: 'debit' },
  { desc: 'Chat with RahulS2 for 2 minutes', date: '#Chat, Date:01/01/2024', amount: -9, type: 'debit' },
  { desc: 'Chat with Shivaj for 7 minutes', date: '#Chat, Date:01/01/2024', amount: -2, type: 'debit' },
  { desc: 'Chat with Rishi for 5 minutes', date: '#Chat, Date:01/01/2024', amount: -14, type: 'debit' },
];

const OrderHistory = () => {
  const { user } = useSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'wallet' ? 'Wallet' : 'Chat';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [walletSubTab, setWalletSubTab] = useState('Wallet Transaction');
  const navigate = useNavigate();
  const { openSidebar } = useOutletContext();

  return (
    <div className="w-full bg-white min-h-screen font-sans pb-24">

      {/* ═══ TOP NAVBAR ═══ */}
      <div className="flex items-center justify-between px-4 py-3 bg-white sticky top-0 z-30 shadow-sm border-b border-gray-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-800 hover:bg-gray-100 p-1.5 rounded-full transition-colors">
            <FiArrowLeft size={20} />
          </button>
          <span className="text-gray-800 font-semibold text-[17px]">Order History</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
            <span className="text-[12px] font-bold text-orange-600">₹ {user?.wallet || 0}</span>
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
      </div>

      {/* ═══ TABS ═══ */}
      <div className="flex overflow-x-auto no-scrollbar bg-white border-b border-gray-100 px-2">
        {historyTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[70px] py-3 text-[12px] font-bold transition-all relative whitespace-nowrap px-2 ${
              activeTab === tab ? 'text-orange-500' : 'text-gray-400'
            }`}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-2 right-2 h-[3px] bg-orange-500 rounded-full" />}
          </button>
        ))}
      </div>

      {/* ═══ CHAT TAB ═══ */}
      {activeTab === 'Chat' && (
        <div className="divide-y divide-gray-50">
          {chatHistory.map((item, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5 hover:bg-orange-50/50 transition-colors cursor-pointer">
              <div className="w-[48px] h-[48px] rounded-full overflow-hidden border-2 border-orange-100 shrink-0">
                <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-800 text-[15px]">{item.name}</h4>
                <p className="text-[12px] text-gray-400">{item.date}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ WALLET TAB ═══ */}
      {activeTab === 'Wallet' && (
        <div>
          {/* Balance Card */}
          <div className="px-4 pt-4 pb-2">
            <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-5 text-white shadow-lg">
              <p className="text-orange-100 text-[12px] font-medium mb-1">Available Balance</p>
              <h2 className="text-[32px] font-black mb-3">₹100</h2>
              <button className="bg-white text-orange-600 text-[12px] font-bold px-5 py-2 rounded-full shadow-sm hover:shadow-md transition-shadow">
                Recharge
              </button>
            </div>
          </div>

          {/* Sub tabs */}
          <div className="flex bg-white px-4 pt-3 gap-2">
            {['Wallet Transaction', 'Payment List'].map((sub) => (
              <button
                key={sub}
                onClick={() => setWalletSubTab(sub)}
                className={`px-4 py-2 rounded-full text-[12px] font-bold transition-all ${
                  walletSubTab === sub
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-orange-50 text-gray-500 border border-orange-100'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Transaction List */}
          <div className="divide-y divide-gray-50 mt-3">
            {walletTransactions.map((txn, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3.5 hover:bg-orange-50/30 transition-colors">
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="font-medium text-gray-800 text-[13px] line-clamp-1">{txn.desc}</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">{txn.date}</p>
                </div>
                <span className={`text-[14px] font-bold shrink-0 ${txn.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {txn.amount < 0 ? '' : '+'}₹{Math.abs(txn.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}



      {/* ═══ ORDERS TAB ═══ */}
      {activeTab === 'Orders' && (
        <div className="flex flex-col items-center justify-center py-20 px-8">
          <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-4">
            <span className="text-5xl">📦</span>
          </div>
          <h3 className="text-[18px] font-bold text-gray-800 mb-2">No Orders Yet</h3>
          <p className="text-gray-400 text-[14px] text-center">Start shopping from JyotishLink Services to see your orders here.</p>
        </div>
      )}


    </div>
  );
};

export default OrderHistory;
