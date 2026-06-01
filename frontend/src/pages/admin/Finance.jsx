import { useState, useEffect } from 'react';
import { FiArrowUpRight, FiArrowDownLeft, FiRefreshCcw, FiSearch, FiChevronDown, FiCalendar, FiDownload } from 'react-icons/fi';
import { getAdminTransactions } from '../../api/adminApis';

const AdminFinance = () => {
  const [typeFilter, setTypeFilter] = useState('All');
  const [transactions, setTransactions] = useState([]);
  const [inflow, setInflow] = useState(0);
  const [outflow, setOutflow] = useState(0);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await getAdminTransactions();
      const txns = res.data?.data?.transactions || res.data?.transactions || [];
      
      const formatted = txns.map(t => {
        const isCredit = t.type === 'recharge'; // only recharge is inflow to wallet, but wait...
        // For Admin Ledger: Wallet Recharge is inflow to system. Payout is outflow. Deduction from wallet (for sessions) is already in the system, but we can treat it as internal. 
        // Let's just track recharge as Inflow, and refund/payout as Outflow.
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
      const totalOut = formatted.filter(t => t.rawType === 'refund').reduce((s, t) => s + t.amount, 0);
      
      setInflow(totalIn);
      setOutflow(totalOut);
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">

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

      {/* Transactions Table */}
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
              </select>
              <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
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
                      ₹{txn.amount.toLocaleString()}
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
        </div>
      </div>
    </div>
  );
};

export default AdminFinance;
