import { useState, useEffect } from 'react';
import { FiArrowUpRight, FiArrowDownLeft, FiRefreshCcw, FiSearch, FiChevronDown, FiCalendar, FiDownload, FiDollarSign } from 'react-icons/fi';
import { getAdminTransactions, getAstrologerPayouts, processAstrologerPayout } from '../../api/adminApis';
import toast from 'react-hot-toast';

const AdminFinance = () => {
  const [typeFilter, setTypeFilter] = useState('All');
  const [transactions, setTransactions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [inflow, setInflow] = useState(0);
  const [outflow, setOutflow] = useState(0);
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' or 'payouts'
  
  // Payout Modal State
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [selectedAstrologer, setSelectedAstrologer] = useState(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);

  useEffect(() => {
    fetchTransactions();
    fetchPayouts();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await getAdminTransactions();
      const txns = res.data?.data?.transactions || res.data?.transactions || [];
      
      const formatted = txns.map(t => {
        return {
          id: t._id.slice(-6).toUpperCase(),
          user: t.userId?.name || 'Unknown',
          type: t.type === 'recharge' ? 'Wallet Recharge' : t.type === 'deduction' ? 'Session Deduction' : 'Refund/Payout',
          amount: t.amount,
          status: 'Success',
          date: new Date(t.createdAt).toLocaleString(),
          isCredit: t.type === 'recharge',
          rawType: t.type
        };
      });

      setTransactions(formatted);
      
      const totalIn = formatted.filter(t => t.rawType === 'recharge').reduce((s, t) => s + t.amount, 0);
      const totalOut = formatted.filter(t => t.rawType === 'refund' || t.rawType === 'deduction').reduce((s, t) => s + Math.abs(t.amount), 0);
      
      setInflow(totalIn);
      setOutflow(totalOut);
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    }
  };

  const fetchPayouts = async () => {
    try {
      const res = await getAstrologerPayouts();
      setPayouts(res.data?.data?.payouts || res.data?.payouts || []);
    } catch (err) {
      console.error('Failed to fetch payouts', err);
    }
  };

  const handleOpenPayoutModal = (astrologer) => {
    setSelectedAstrologer(astrologer);
    setPayoutAmount('');
    setIsPayoutModalOpen(true);
  };

  const handleProcessPayout = async () => {
    if (!payoutAmount || isNaN(payoutAmount) || Number(payoutAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (Number(payoutAmount) > selectedAstrologer.wallet) {
      toast.error('Amount exceeds available wallet balance');
      return;
    }

    setIsProcessingPayout(true);
    try {
      await processAstrologerPayout(selectedAstrologer._id, { amount: Number(payoutAmount) });
      toast.success('Payout processed successfully');
      setIsPayoutModalOpen(false);
      fetchPayouts(); // Refresh payouts list
      fetchTransactions(); // Refresh transactions list
    } catch (err) {
      console.error('Failed to process payout:', err);
      toast.error(err.response?.data?.message || 'Failed to process payout');
    } finally {
      setIsProcessingPayout(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Ledger</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">Track wallet recharges, session billing, astrologer payouts, and refunds</p>
        </div>
        <button className="px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm">
          <FiDownload size={14} /> Export Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-500 rounded-xl flex items-center justify-center shrink-0">
            <FiArrowDownLeft size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Inflow (Total)</p>
            <h3 className="text-2xl font-black text-gray-900">₹{inflow.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0">
            <FiArrowUpRight size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Outflow (Total)</p>
            <h3 className="text-2xl font-black text-gray-900">₹{outflow.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shrink-0">
            <FiRefreshCcw size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Total Transactions</p>
            <h3 className="text-2xl font-black text-gray-900">{transactions.length}</h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 font-bold text-sm transition-colors ${activeTab === 'transactions' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          All Transactions
        </button>
        <button
          onClick={() => setActiveTab('payouts')}
          className={`pb-3 font-bold text-sm transition-colors ${activeTab === 'payouts' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Astrologer Payouts
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'transactions' ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <h2 className="font-bold text-gray-900">All Transactions</h2>
            <div className="flex gap-2">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input type="text" placeholder="Search TXN ID..." className="pl-9 pr-4 py-2 rounded-xl bg-gray-50 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-medium" />
              </div>
              <div className="relative">
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="appearance-none px-3 py-2 pr-8 rounded-xl bg-gray-50 border-0 text-sm font-bold text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                  <option>All</option>
                  <option>Wallet Recharge</option>
                  <option>Payout</option>
                  <option>Refund</option>
                  <option>Session Deduction</option>
                </select>
                <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">TXN ID</th>
                  <th className="py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">User / Entity</th>
                  <th className="py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions
                  .filter(t => typeFilter === 'All' || t.type.includes(typeFilter))
                  .map((txn, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-sm text-gray-800 font-mono">{txn.id}</td>
                    <td className="py-3.5 px-6 text-sm font-bold text-gray-600">{txn.user}</td>
                    <td className="py-3.5 px-6 text-xs text-gray-500 font-medium">{txn.type}</td>
                    <td className="py-3.5 px-6">
                      <span className={`font-black text-sm flex items-center gap-1 ${txn.isCredit ? 'text-green-600' : 'text-red-500'}`}>
                        {txn.isCredit ? <FiArrowDownLeft size={12} /> : <FiArrowUpRight size={12} />}
                        ₹{Math.abs(txn.amount).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-xs text-gray-400 font-medium">{txn.date}</td>
                    <td className="py-3.5 px-6">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-600`}>
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length === 0 && (
              <div className="py-10 text-center text-gray-400 text-sm font-medium">No transactions found</div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <h2 className="font-bold text-gray-900">Astrologer Balances & Payouts</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Astrologer</th>
                  <th className="py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Phone</th>
                  <th className="py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Available Wallet Balance</th>
                  <th className="py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payouts.map((astro, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-6 text-sm font-bold text-gray-800">{astro.name}</td>
                    <td className="py-3.5 px-6 text-sm text-gray-500 font-medium">{astro.phone}</td>
                    <td className="py-3.5 px-6">
                      <span className="font-black text-green-600">₹{astro.wallet?.toLocaleString() || 0}</span>
                    </td>
                    <td className="py-3.5 px-6">
                      <button 
                        onClick={() => handleOpenPayoutModal(astro)}
                        disabled={!astro.wallet || astro.wallet <= 0}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${astro.wallet > 0 ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                      >
                        <FiDollarSign size={12} /> Process Payout
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payouts.length === 0 && (
              <div className="py-10 text-center text-gray-400 text-sm font-medium">No astrologers found</div>
            )}
          </div>
        </div>
      )}

      {/* Process Payout Modal */}
      {isPayoutModalOpen && selectedAstrologer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900">Process Payout</h3>
              <button onClick={() => setIsPayoutModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <div className="p-5 space-y-5">
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                <p className="text-xs text-orange-600 font-bold uppercase mb-1">Paying To</p>
                <p className="text-lg font-black text-gray-900">{selectedAstrologer.name}</p>
                <p className="text-sm text-gray-500">{selectedAstrologer.phone}</p>
                <div className="mt-3 pt-3 border-t border-orange-200 flex justify-between">
                  <span className="text-sm font-bold text-gray-600">Available Balance:</span>
                  <span className="text-sm font-black text-green-600">₹{selectedAstrologer.wallet?.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Amount to Deduct/Pay (₹)</label>
                <input 
                  type="number" 
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="Enter amount"
                  max={selectedAstrologer.wallet}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-bold"
                />
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button 
                onClick={() => setIsPayoutModalOpen(false)}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleProcessPayout}
                disabled={isProcessingPayout || !payoutAmount || Number(payoutAmount) <= 0 || Number(payoutAmount) > selectedAstrologer.wallet}
                className="flex-1 px-4 py-3 rounded-xl font-bold bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessingPayout ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : 'Confirm Payout'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminFinance;
