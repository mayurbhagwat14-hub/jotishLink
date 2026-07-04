import { useState, useEffect } from 'react';
import { FiArrowUpRight, FiArrowDownLeft, FiRefreshCcw, FiSearch, FiChevronDown, FiCalendar, FiDownload, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import { getAdminTransactions, getAstrologerPayouts, processAstrologerPayout, getAdminAstrologerById } from '../../api/adminApis';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getSocket } from '../../socket/socketManager';
import { useSelector } from 'react-redux';

const AdminFinance = () => {
  const { appName } = useSelector((state) => state.settings) || { appName: 'JyotishLink' };
  const [typeFilter, setTypeFilter] = useState('All');
  const [searchFilter, setSearchFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [inflow, setInflow] = useState(0);
  const [outflow, setOutflow] = useState(0);
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' or 'payouts'
  
  // Pagination
  const [txnPage, setTxnPage] = useState(1);
  const [payoutPage, setPayoutPage] = useState(1);
  const itemsPerPage = 10;
  
  // Payout Modal State
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [selectedAstrologer, setSelectedAstrologer] = useState(null);
  const [payoutReceipt, setPayoutReceipt] = useState(null);
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);

  // Astrologer Details Modal
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailedAstrologer, setDetailedAstrologer] = useState(null);

  // Export Report Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFilter, setExportFilter] = useState('all'); // 'all', 'thisMonth', 'custom'
  const [exportMonth, setExportMonth] = useState(''); // 'YYYY-MM'

  useEffect(() => {
    fetchTransactions();
    fetchPayouts();

    const token = localStorage.getItem('token') || localStorage.getItem('refreshToken');
    const socket = getSocket(token);

    const onUpdate = () => {
      fetchTransactions();
      fetchPayouts();
    };

    socket.on('dashboard_updated', onUpdate);

    return () => {
      socket.off('dashboard_updated', onUpdate);
    };
  }, []);

  useEffect(() => {
    if (isPayoutModalOpen || isDetailsModalOpen || isExportModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isPayoutModalOpen, isDetailsModalOpen, isExportModalOpen]);

  const fetchTransactions = async () => {
    try {
      const res = await getAdminTransactions();
      const txns = res.data?.data?.transactions || res.data?.transactions || [];
      
      const formatted = txns.map(t => {
        const rawName = t.userId?.name || 'Unknown';
        const isAstro = rawName.startsWith('Astro: ');
        const isUser = rawName.startsWith('User: ');
        const name = rawName.replace('Astro: ', '').replace('User: ', '');
        const entityType = isAstro ? 'Astro' : (isUser ? 'User' : 'Unknown');

        let displayType = t.type;
        const descLower = (t.desc || '').toLowerCase();
        
        if (entityType === 'Astro') {
          if (t.type === 'recharge') {
            if (descLower.includes('video')) displayType = 'Video Call Earnings';
            else if (descLower.includes('audio') || descLower.includes('voice')) displayType = 'Audio Call Earnings';
            else if (descLower.includes('chat')) displayType = 'Chat Earnings';
            else displayType = 'Session Earnings';
          }
          else if (t.type === 'refund' || t.type === 'withdrawal') displayType = 'Payout/Withdrawal';
          else displayType = 'Astrologer Deduction';
        } else if (entityType === 'User') {
          if (t.type === 'recharge') displayType = 'Wallet Deposit';
          else if (t.type === 'deduction') {
            if (descLower.includes('video')) displayType = 'Video Call Payment';
            else if (descLower.includes('audio') || descLower.includes('voice')) displayType = 'Audio Call Payment';
            else if (descLower.includes('chat')) displayType = 'Chat Payment';
            else displayType = 'Session Payment';
          }
          else if (t.type === 'refund') displayType = 'Wallet Refund';
        } else {
          displayType = t.type === 'recharge' ? 'Wallet Recharge' : t.type === 'deduction' ? 'Session Deduction' : 'Refund/Payout';
        }

        return {
          id: t._id.slice(-6).toUpperCase(),
          user: name,
          entityType,
          rawName,
          type: displayType,
          amount: t.amount,
          status: 'Success',
          date: new Date(t.createdAt).toLocaleString(),
          rawDate: t.createdAt,
          isCredit: t.type === 'recharge',
          rawType: t.type
        };
      });

      setTransactions(formatted);
      
      const totalIn = formatted.filter(t => t.entityType === 'User' && t.rawType === 'recharge').reduce((s, t) => s + t.amount, 0);
      
      // User spending (deduction) is not an outflow from the platform. Actual outflows are User refunds and Astro payouts.
      const totalOut = formatted.filter(t => 
        (t.entityType === 'User' && t.rawType === 'refund') || 
        (t.entityType === 'Astro' && (t.rawType === 'refund' || t.rawType === 'withdrawal' || t.rawType === 'payout'))
      ).reduce((s, t) => s + Math.abs(t.amount), 0);
      
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
    setPayoutReceipt(null);
    setIsPayoutModalOpen(true);
  };

  const handleViewDetails = async (id) => {
    try {
      setIsDetailsModalOpen(true);
      setLoadingDetails(true);
      const res = await getAdminAstrologerById(id);
      setDetailedAstrologer(res.data?.data?.astrologer || res.data?.astrologer);
    } catch (err) {
      toast.error('Failed to fetch details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleProcessPayout = async () => {
    if (!payoutReceipt) {
      toast.error('Please upload a payment receipt screenshot');
      return;
    }

    if (isProcessingPayout) return;

    setIsProcessingPayout(true);
    try {
      const formData = new FormData();
      formData.append('receipt', payoutReceipt);

      await processAstrologerPayout(selectedAstrologer._id, formData);
      toast.success('Payout completed successfully');
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

  const handleExportReport = () => {
    let filteredTransactions = [...transactions];
    
    if (exportFilter === 'thisMonth') {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      filteredTransactions = transactions.filter(t => {
        const d = new Date(t.rawDate);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
    } else if (exportFilter === 'custom' && exportMonth) {
      const [year, month] = exportMonth.split('-');
      
      filteredTransactions = transactions.filter(t => {
        const d = new Date(t.rawDate);
        return d.getMonth() === parseInt(month) - 1 && d.getFullYear() === parseInt(year);
      });
    }

    if (filteredTransactions.length === 0) {
      toast.error('No transactions found for the selected period');
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(17, 24, 39); // Gray 900
      doc.text(`${appName} Finance Ledger`, pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
      
      let periodText = 'All Time';
      if (exportFilter === 'thisMonth') periodText = 'This Month';
      if (exportFilter === 'custom') periodText = `Month: ${exportMonth}`;
      doc.text(`Period: ${periodText}`, 14, 37);

      // Calculate Totals
      let totalInflow = 0;
      let totalOutflow = 0;

      filteredTransactions.forEach(t => {
        if (t.entityType === 'User' && t.rawType === 'recharge') {
          totalInflow += t.amount;
        } else if (
          (t.entityType === 'User' && t.rawType === 'refund') || 
          (t.entityType === 'Astro' && (t.rawType === 'refund' || t.rawType === 'withdrawal' || t.rawType === 'payout'))
        ) {
          totalOutflow += Math.abs(t.amount);
        }
      });

      // Summary Box
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(14, 45, pageWidth - 28, 30, 3, 3, 'FD');
      
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text(`Total Inflow (Recharges): Rs. ${totalInflow.toLocaleString()}`, 20, 55);
      doc.text(`Total Outflow (Payouts/Deductions): Rs. ${totalOutflow.toLocaleString()}`, 20, 65);
      
      const net = totalInflow - totalOutflow;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      if (net >= 0) {
        doc.setTextColor(34, 197, 94); // Green 500
      } else {
        doc.setTextColor(239, 68, 68); // Red 500
      }
      doc.text(`Net Amount: ${net >= 0 ? '+' : ''}Rs. ${net.toLocaleString()}`, pageWidth - 20, 60, { align: 'right' });

      // Table Data
      const tableColumn = ["TXN ID", "User/Entity", "Type", "Amount (Rs)", "Status", "Date"];
      const tableRows = [];

      filteredTransactions.forEach(t => {
        const amountStr = t.isCredit ? `+${t.amount}` : `-${Math.abs(t.amount)}`;
        tableRows.push([
          t.id, 
          t.user, 
          t.type, 
          amountStr, 
          t.status, 
          t.date
        ]);
      });
      
      doc.setFont("helvetica", "normal");
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 85,
        theme: 'grid',
        headStyles: { fillColor: [17, 24, 39] },
        styles: { fontSize: 9 }
      });
      
      doc.save(`${appName.replace(/\s+/g, '')}_Ledger_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Report downloaded successfully');
      setIsExportModalOpen(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate report');
    }
  };

  const filteredTransactions = transactions
    .filter(t => {
      if (activeTab === 'user_transactions') return t.entityType === 'User';
      if (activeTab === 'astro_transactions') return t.entityType === 'Astro';
      return true;
    })
    .filter(t => typeFilter === 'All' || t.type.includes(typeFilter))
    .filter(t => {
      if (!startDateFilter && !endDateFilter) return true;
      const txnDate = new Date(t.rawDate).toISOString().split('T')[0];
      if (startDateFilter && txnDate < startDateFilter) return false;
      if (endDateFilter && txnDate > endDateFilter) return false;
      return true;
    })
    .filter(t => !searchFilter || t.id.toLowerCase().includes(searchFilter.toLowerCase()));

  const totalTxnPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (txnPage - 1) * itemsPerPage,
    txnPage * itemsPerPage
  );

  const totalPayoutPages = Math.ceil(payouts.length / itemsPerPage);
  const paginatedPayouts = payouts.slice(
    (payoutPage - 1) * itemsPerPage,
    payoutPage * itemsPerPage
  );

  return (
    <div className="space-y-6 pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Ledger</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">Track wallet recharges, session billing, astrologer payouts, and refunds</p>
        </div>
        <button 
          onClick={() => setIsExportModalOpen(true)}
          className="px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm"
        >
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
          onClick={() => setActiveTab('user_transactions')}
          className={`pb-3 font-bold text-sm transition-colors ${activeTab === 'user_transactions' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          User Transactions
        </button>
        <button
          onClick={() => setActiveTab('astro_transactions')}
          className={`pb-3 font-bold text-sm transition-colors ${activeTab === 'astro_transactions' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Astrologer Ledger
        </button>
        <button
          onClick={() => setActiveTab('payouts')}
          className={`pb-3 font-bold text-sm transition-colors ${activeTab === 'payouts' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Withdrawal Requests
        </button>
      </div>

      {/* Tab Content */}
      {['transactions', 'user_transactions', 'astro_transactions'].includes(activeTab) ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <h2 className="font-bold text-gray-900">
              {activeTab === 'transactions' ? 'All Transactions' : activeTab === 'user_transactions' ? 'User Transactions' : 'Astrologer Ledger'}
            </h2>
            <div className="flex gap-2">
              <div className="relative flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1 sm:max-w-[200px]">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input 
                    type="text" 
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search TXN ID..." 
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-medium" 
                  />
                </div>
                <div className="relative flex items-center gap-1 bg-gray-50 rounded-xl px-2">
                  <input 
                    type="date" 
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                    className="appearance-none w-full sm:w-auto px-2 py-2 bg-transparent border-0 text-sm font-bold text-gray-700 cursor-pointer focus:outline-none" 
                  />
                  <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">TO</span>
                  <input 
                    type="date" 
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                    className="appearance-none w-full sm:w-auto px-2 py-2 bg-transparent border-0 text-sm font-bold text-gray-700 cursor-pointer focus:outline-none" 
                  />
                  {(startDateFilter || endDateFilter) && (
                    <button 
                      onClick={() => { setStartDateFilter(''); setEndDateFilter(''); }} 
                      className="ml-1 px-2 py-1 bg-gray-200 hover:bg-red-100 hover:text-red-600 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <div className="relative w-full sm:w-auto">
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="appearance-none px-3 py-2 pr-8 rounded-xl bg-gray-50 border-0 text-sm font-bold text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                  <option value="All">All Types</option>
                  <option value="Wallet Deposit">Wallet Deposit</option>
                  <option value="Session Payment">Session Payment</option>
                  <option value="Wallet Refund">Wallet Refund</option>
                  <option value="Session Earnings">Session Earnings</option>
                  <option value="Payout/Withdrawal">Payout/Withdrawal</option>
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
                {paginatedTransactions.map((txn, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-sm text-gray-800 font-mono">{txn.id}</td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${txn.entityType === 'Astro' ? 'bg-orange-100 text-orange-600' : txn.entityType === 'User' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                          {txn.entityType}
                        </span>
                        <span className="text-sm font-bold text-gray-600">{txn.user}</span>
                      </div>
                    </td>
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
          
          {/* Pagination Controls for Transactions */}
          {(paginatedTransactions || []).length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-gray-400 font-medium">
                Showing <span className="font-bold text-gray-700">{((txnPage - 1) * itemsPerPage) + 1}</span> to <span className="font-bold text-gray-700">{Math.min(txnPage * itemsPerPage, filteredTransactions.length)}</span> of <span className="font-bold text-gray-700">{filteredTransactions.length}</span>
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setTxnPage(p => Math.max(1, p - 1))}
                  disabled={txnPage === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-30"
                ><FiChevronLeft size={14} /></button>
                {Array.from({ length: Math.min(totalTxnPages, 5) }, (_, i) => {
                  let startPage = Math.max(1, txnPage - 2);
                  let endPage = startPage + 4;
                  if (endPage > totalTxnPages) {
                    endPage = totalTxnPages;
                    startPage = Math.max(1, endPage - 4);
                  }
                  return startPage + i;
                }).map(page => (
                  <button
                    type="button"
                    key={page}
                    onClick={() => setTxnPage(page)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                      txnPage === page
                        ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >{page}</button>
                ))}
                <button
                  type="button"
                  onClick={() => setTxnPage(p => Math.min(totalTxnPages, p + 1))}
                  disabled={txnPage === totalTxnPages || totalTxnPages === 0}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-30"
                ><FiChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <h2 className="font-bold text-gray-900">Withdrawal Requests</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Astrologer</th>
                  <th className="py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Bank Details</th>
                  <th className="py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Requested Amount</th>
                  <th className="py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedPayouts.map((astro, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-6">
                      <p className="text-sm font-bold text-gray-800">{astro.name}</p>
                      <p className="text-xs text-gray-500 font-medium">{astro.phone}</p>
                    </td>
                    <td className="py-3.5 px-6">
                      {astro.bankDetails ? (
                        <div 
                          onClick={() => handleViewDetails(astro.astrologerId)} 
                          className="cursor-pointer p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors group"
                          title="Click to view full astrologer details"
                        >
                          <p className="text-xs font-bold text-gray-700 group-hover:text-orange-600 transition-colors">{astro.bankDetails.bankName || 'N/A'}</p>
                          <p className="text-[10px] font-mono text-gray-500 group-hover:text-orange-500">A/C: {astro.bankDetails.accountNumber || 'N/A'}</p>
                          <p className="text-[10px] font-mono text-gray-500 group-hover:text-orange-500">IFSC: {astro.bankDetails.ifscCode || 'N/A'}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-red-500 font-bold">No Bank Added</p>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="font-black text-green-600">₹{astro.wallet?.toLocaleString() || 0}</span>
                      <p className="text-[10px] text-gray-400 mt-1">{new Date(astro.date).toLocaleDateString()}</p>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${astro.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                        {astro.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <button 
                        onClick={() => handleOpenPayoutModal(astro)}
                        disabled={!astro.wallet || astro.wallet <= 0 || astro.status === 'completed' || !astro.bankDetails}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${astro.wallet > 0 && astro.status !== 'completed' && astro.bankDetails ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                      >
                        <FaRupeeSign size={12} /> {astro.status === 'completed' ? 'Paid' : 'Process'}
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
          
          {/* Pagination Controls for Payouts */}
          {(paginatedPayouts || []).length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-gray-400 font-medium">
                Showing <span className="font-bold text-gray-700">{((payoutPage - 1) * itemsPerPage) + 1}</span> to <span className="font-bold text-gray-700">{Math.min(payoutPage * itemsPerPage, payouts.length)}</span> of <span className="font-bold text-gray-700">{payouts.length}</span>
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPayoutPage(p => Math.max(1, p - 1))}
                  disabled={payoutPage === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-30"
                ><FiChevronLeft size={14} /></button>
                {Array.from({ length: Math.min(totalPayoutPages, 5) }, (_, i) => {
                  let startPage = Math.max(1, payoutPage - 2);
                  let endPage = startPage + 4;
                  if (endPage > totalPayoutPages) {
                    endPage = totalPayoutPages;
                    startPage = Math.max(1, endPage - 4);
                  }
                  return startPage + i;
                }).map(page => (
                  <button
                    type="button"
                    key={page}
                    onClick={() => setPayoutPage(page)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                      payoutPage === page
                        ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >{page}</button>
                ))}
                <button
                  type="button"
                  onClick={() => setPayoutPage(p => Math.min(totalPayoutPages, p + 1))}
                  disabled={payoutPage === totalPayoutPages || totalPayoutPages === 0}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-30"
                ><FiChevronRight size={14} /></button>
              </div>
            </div>
          )}
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
                <div className="mt-3 pt-3 border-t border-orange-200 flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-bold text-gray-600">Requested Amount:</span>
                    <span className="text-sm font-black text-green-600">₹{selectedAstrologer.wallet?.toLocaleString()}</span>
                  </div>
                  {selectedAstrologer.bankDetails && (
                    <div className="bg-white/50 p-2 rounded-lg mt-2 text-xs">
                      <p><strong className="text-gray-700">Bank:</strong> {selectedAstrologer.bankDetails.bankName}</p>
                      <p><strong className="text-gray-700">A/C:</strong> {selectedAstrologer.bankDetails.accountNumber}</p>
                      <p><strong className="text-gray-700">IFSC:</strong> {selectedAstrologer.bankDetails.ifscCode}</p>
                      <p><strong className="text-gray-700">Name:</strong> {selectedAstrologer.bankDetails.accountHolderName}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Payment Screenshot / Receipt</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setPayoutReceipt(e.target.files[0])}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-bold text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
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
                disabled={isProcessingPayout || !payoutReceipt}
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
                ) : 'Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Astrologer Details Modal */}
      {isDetailsModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full mx-4 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-slide-up">
            <button 
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiX size={20} />
            </button>
            <h3 className="text-xl font-black text-gray-900 mb-6">Astrologer Details</h3>
            
            {loadingDetails ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            ) : detailedAstrologer ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-2xl font-bold overflow-hidden">
                    {detailedAstrologer.avatar ? (
                      <img src={detailedAstrologer.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      detailedAstrologer.name?.[0]?.toUpperCase()
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900">{detailedAstrologer.name}</h4>
                    <p className="text-sm text-gray-500">{detailedAstrologer.phone}</p>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] rounded uppercase font-bold mt-1 inline-block">
                      {detailedAstrologer.approvalStatus}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold mb-1">Bank Name</p>
                    <p className="text-sm font-mono text-gray-900">{detailedAstrologer.bankDetails?.bankName || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold mb-1">Account Number</p>
                    <p className="text-sm font-mono text-gray-900">{detailedAstrologer.bankDetails?.accountNumber || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold mb-1">IFSC Code</p>
                    <p className="text-sm font-mono text-gray-900">{detailedAstrologer.bankDetails?.ifscCode || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold mb-1">UPI ID</p>
                    <p className="text-sm font-mono text-gray-900">{detailedAstrologer.bankDetails?.upiId || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold mb-1">Wallet Balance</p>
                    <p className="text-sm font-black text-green-600">₹{detailedAstrologer.wallet?.toLocaleString() || 0}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold mb-1">Total Earnings</p>
                    <p className="text-sm font-black text-gray-900">₹{detailedAstrologer.earnings?.total?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-10">Details not found.</p>
            )}
          </div>
        </div>
      )}

      {/* Export Report Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900">Export Report</h3>
              <button onClick={() => setIsExportModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Period</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <input 
                      type="radio" 
                      name="exportFilter" 
                      value="all" 
                      checked={exportFilter === 'all'} 
                      onChange={() => setExportFilter('all')} 
                      className="text-gray-900 focus:ring-gray-900 w-4 h-4"
                    />
                    <span className="font-bold text-sm text-gray-700">All Time</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <input 
                      type="radio" 
                      name="exportFilter" 
                      value="thisMonth" 
                      checked={exportFilter === 'thisMonth'} 
                      onChange={() => setExportFilter('thisMonth')} 
                      className="text-gray-900 focus:ring-gray-900 w-4 h-4"
                    />
                    <span className="font-bold text-sm text-gray-700">This Month</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <input 
                      type="radio" 
                      name="exportFilter" 
                      value="custom" 
                      checked={exportFilter === 'custom'} 
                      onChange={() => setExportFilter('custom')} 
                      className="text-gray-900 focus:ring-gray-900 w-4 h-4"
                    />
                    <span className="font-bold text-sm text-gray-700">Specific Month</span>
                  </label>
                </div>
              </div>

              {exportFilter === 'custom' && (
                <div className="animate-fade-in mt-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Choose Month</label>
                  <input 
                    type="month" 
                    value={exportMonth}
                    onChange={(e) => setExportMonth(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 font-bold"
                  />
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleExportReport}
                disabled={exportFilter === 'custom' && !exportMonth}
                className="flex-1 px-4 py-3 rounded-xl font-bold bg-gray-900 text-white hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminFinance;
