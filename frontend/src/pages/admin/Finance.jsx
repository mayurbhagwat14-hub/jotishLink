import { useState, useEffect } from 'react';
import { FiArrowUpRight, FiArrowDownLeft, FiRefreshCcw, FiSearch, FiChevronDown, FiCalendar, FiDownload, FiX, FiChevronLeft, FiChevronRight, FiBriefcase, FiCreditCard, FiHash, FiSmartphone, FiDatabase, FiTrendingUp } from 'react-icons/fi';
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
          date: new Date(t.createdAt).toLocaleString(),
          rawDate: t.createdAt,
          isCredit: t.type === 'recharge' || (t.type === 'deduction' && descLower.includes('online order payment')),
          rawType: t.type,
          descLower: descLower
        };
      });

      setTransactions(formatted);
      
      const totalIn = formatted.filter(t => 
        (t.entityType === 'User' && t.rawType === 'recharge') || 
        (t.entityType === 'User' && t.rawType === 'deduction' && t.descLower?.includes('online order payment'))
      ).reduce((s, t) => s + t.amount, 0);
      
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

  // --- DYNAMIC METRICS CALCULATIONS ---
  // All TXNs
  const globalInflow = transactions.filter(t => t.entityType === 'User' && t.rawType === 'recharge').reduce((s, t) => s + t.amount, 0);
  const globalOutflow = transactions.filter(t => 
    (t.entityType === 'User' && t.rawType === 'refund') || 
    (t.entityType === 'Astro' && (t.rawType === 'refund' || t.rawType === 'withdrawal' || t.rawType === 'payout'))
  ).reduce((s, t) => s + Math.abs(t.amount), 0);
  const netProfit = globalInflow - globalOutflow;

  // Users
  const userDeposits = transactions.filter(t => 
    (t.entityType === 'User' && t.rawType === 'recharge') || 
    (t.entityType === 'User' && t.rawType === 'deduction' && t.descLower?.includes('online order payment'))
  ).reduce((s, t) => s + Math.abs(t.amount), 0);
  
  const userSpends = transactions.filter(t => t.entityType === 'User' && t.rawType === 'deduction').reduce((s, t) => s + Math.abs(t.amount), 0);
  const userRefunds = transactions.filter(t => t.entityType === 'User' && t.rawType === 'refund').reduce((s, t) => s + Math.abs(t.amount), 0);

  // Astrologers
  const astroEarnings = transactions.filter(t => t.entityType === 'Astro' && t.rawType === 'recharge').reduce((s, t) => s + t.amount, 0);
  const astroDeductions = transactions.filter(t => t.entityType === 'Astro' && t.rawType === 'deduction').reduce((s, t) => s + Math.abs(t.amount), 0);
  const astroWithdrawals = transactions.filter(t => t.entityType === 'Astro' && (t.rawType === 'withdrawal' || t.rawType === 'payout' || t.rawType === 'refund')).reduce((s, t) => s + Math.abs(t.amount), 0);

  // Payouts
  const pendingPayoutsCount = payouts.filter(p => p.status?.toLowerCase() === 'pending').length;
  const pendingPayoutsAmount = payouts.filter(p => p.status?.toLowerCase() === 'pending').reduce((s, p) => s + (p.wallet || p.amount || 0), 0);
  const completedPayoutsAmount = payouts.filter(p => p.status?.toLowerCase() === 'completed').reduce((s, p) => s + (p.wallet || p.amount || 0), 0);

  return (
    <div className="space-y-8 pb-10 max-w-7xl mx-auto">
      {/* ═══ PREMIUM HEADER ═══ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Finance Ledger</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Track wallet recharges, session billing, astrologer payouts, and refunds with deep analytics.</p>
        </div>
        <button 
          onClick={() => setIsExportModalOpen(true)}
          className="px-5 py-3 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-gray-900/20 active:scale-95"
        >
          <FiDownload size={16} /> Export Report
        </button>
      </div>

      {/* ═══ CLEAN DASHBOARD CARDS ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {activeTab === 'transactions' && (
          <>
            {/* Inflow Card */}
            <div className="bg-white rounded-2xl p-5 border border-emerald-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Inflow</p>
                <h3 className="text-2xl font-black text-gray-900 leading-none mb-1">₹{globalInflow.toLocaleString()}</h3>
                <p className="text-[10px] text-gray-400 font-medium">Platform gross revenue</p>
              </div>
              <div className="w-10 h-10 rounded-xl border border-emerald-200 bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                <FiArrowDownLeft size={18} />
              </div>
            </div>

            {/* Outflow Card */}
            <div className="bg-white rounded-2xl p-5 border border-rose-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Outflow</p>
                <h3 className="text-2xl font-black text-gray-900 leading-none mb-1">₹{globalOutflow.toLocaleString()}</h3>
                <p className="text-[10px] text-gray-400 font-medium">Platform gross expenses</p>
              </div>
              <div className="w-10 h-10 rounded-xl border border-rose-200 bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                <FiArrowUpRight size={18} />
              </div>
            </div>

            {/* Net Profit Card */}
            <div className="bg-white rounded-2xl p-5 border border-indigo-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Net Platform Profit</p>
                <h3 className="text-2xl font-black text-gray-900 leading-none mb-1">₹{netProfit.toLocaleString()}</h3>
                <p className="text-[10px] text-gray-400 font-medium">Total Inflow - Total Outflow</p>
              </div>
              <div className="w-10 h-10 rounded-xl border border-indigo-200 bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                <FaRupeeSign size={16} />
              </div>
            </div>
          </>
        )}

        {activeTab === 'user_transactions' && (
          <>
            <div className="bg-white rounded-2xl p-5 border border-blue-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">User Payments & Deposits</p>
                <h3 className="text-2xl font-black text-gray-900 leading-none mb-1">₹{userDeposits.toLocaleString()}</h3>
                <p className="text-[10px] text-gray-400 font-medium">Wallet top-ups & direct orders</p>
              </div>
              <div className="w-10 h-10 rounded-xl border border-blue-200 bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                <FiArrowDownLeft size={18} />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-purple-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total User Spending</p>
                <h3 className="text-2xl font-black text-gray-900 leading-none mb-1">₹{userSpends.toLocaleString()}</h3>
                <p className="text-[10px] text-gray-400 font-medium">Sessions & E-commerce</p>
              </div>
              <div className="w-10 h-10 rounded-xl border border-purple-200 bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
                <FaRupeeSign size={16} />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Refunds</p>
                <h3 className="text-2xl font-black text-gray-900 leading-none mb-1">₹{userRefunds.toLocaleString()}</h3>
                <p className="text-[10px] text-gray-400 font-medium">Returned to users</p>
              </div>
              <div className="w-10 h-10 rounded-xl border border-gray-300 bg-gray-50 flex items-center justify-center text-gray-600 shrink-0">
                <FiRefreshCcw size={18} />
              </div>
            </div>
          </>
        )}

        {activeTab === 'astro_transactions' && (
          <>
            <div className="bg-white rounded-2xl p-5 border border-emerald-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Earnings</p>
                <h3 className="text-2xl font-black text-gray-900 leading-none mb-1">₹{astroEarnings.toLocaleString()}</h3>
                <p className="text-[10px] text-gray-400 font-medium">Income credited to Astros</p>
              </div>
              <div className="w-10 h-10 rounded-xl border border-emerald-200 bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                <FaRupeeSign size={16} />
              </div>
            </div>
          </>
        )}

        {activeTab === 'payouts' && (
          <>
            <div className="bg-white rounded-2xl p-5 border border-amber-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Pending Requests</p>
                <h3 className="text-2xl font-black text-gray-900 leading-none mb-1">{pendingPayoutsCount}</h3>
                <p className="text-[10px] text-gray-400 font-medium">Awaiting action</p>
              </div>
              <div className="w-10 h-10 rounded-xl border border-amber-200 bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                <FiRefreshCcw size={18} />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-orange-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Pending Amount</p>
                <h3 className="text-2xl font-black text-gray-900 leading-none mb-1">₹{pendingPayoutsAmount.toLocaleString()}</h3>
                <p className="text-[10px] text-gray-400 font-medium">Total liability</p>
              </div>
              <div className="w-10 h-10 rounded-xl border border-orange-200 bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                <FiArrowUpRight size={18} />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-emerald-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Paid Out Total</p>
                <h3 className="text-2xl font-black text-gray-900 leading-none mb-1">₹{completedPayoutsAmount.toLocaleString()}</h3>
                <p className="text-[10px] text-gray-400 font-medium">Successfully cleared</p>
              </div>
              <div className="w-10 h-10 rounded-xl border border-emerald-200 bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                <FaRupeeSign size={16} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* ═══ MODERN SEGMENTED TABS & FILTERS ═══ */}
      <div className="bg-white p-3 rounded-3xl border border-gray-100 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-center z-20 relative">
        
        {/* Segmented Controls */}
        <div className="flex p-1.5 bg-gray-50 rounded-2xl w-full xl:w-auto overflow-x-auto no-scrollbar">
          {[
            { id: 'transactions', label: 'All TXNs' },
            { id: 'user_transactions', label: 'Users' },
            { id: 'astro_transactions', label: 'Astrologers' },
            { id: 'payouts', label: 'Payouts' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-300 ${
                activeTab === tab.id 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Unified Filter Bar */}
        {['transactions', 'user_transactions', 'astro_transactions'].includes(activeTab) && (
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <div className="relative w-full sm:w-64">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search TXN ID..." 
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
              />
            </div>
            
            <div className="flex items-center gap-2 bg-gray-50 rounded-2xl p-1 border border-gray-100 w-full sm:w-auto">
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                <input 
                  type="date" 
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="appearance-none pl-9 pr-3 py-2 bg-transparent border-0 text-xs font-bold text-gray-700 cursor-pointer focus:outline-none" 
                />
              </div>
              <span className="text-gray-300 font-bold">-</span>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                <input 
                  type="date" 
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="appearance-none pl-9 pr-3 py-2 bg-transparent border-0 text-xs font-bold text-gray-700 cursor-pointer focus:outline-none" 
                />
              </div>
              {(startDateFilter || endDateFilter) && (
                <button 
                  onClick={() => { setStartDateFilter(''); setEndDateFilter(''); }} 
                  className="mr-2 p-1.5 bg-gray-200 hover:bg-red-100 hover:text-red-600 text-gray-500 rounded-lg transition-colors"
                  title="Clear Dates"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>

            <div className="relative w-full sm:w-48">
              <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)} 
                className="appearance-none w-full px-4 py-3 pr-10 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="All">All Types</option>
                <option value="Wallet Deposit">Wallet Deposit</option>
                <option value="Session Payment">Session Payment</option>
                <option value="Wallet Refund">Wallet Refund</option>
                <option value="Session Earnings">Session Earnings</option>
                <option value="Payout/Withdrawal">Payout/Withdrawal</option>
              </select>
              <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
          </div>
        )}
      </div>

      {/* ═══ DATA TABLES ═══ */}
      {['transactions', 'user_transactions', 'astro_transactions'].includes(activeTab) ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden z-10 relative">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="py-4 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">TXN ID</th>
                  <th className="py-4 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Entity</th>
                  <th className="py-4 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                  <th className="py-4 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                  <th className="py-4 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="py-4 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedTransactions.map((txn, i) => (
                  <tr key={i} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="py-4 px-6">
                      <span className="font-mono text-sm font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-lg group-hover:bg-white transition-colors">{txn.id}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black tracking-wider shadow-sm ${
                          txn.entityType === 'Astro' ? 'bg-orange-100 text-orange-600 border border-orange-200' : 
                          txn.entityType === 'User' ? 'bg-blue-100 text-blue-600 border border-blue-200' : 
                          'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          {txn.user.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">{txn.user}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{txn.entityType}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-semibold text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">{txn.type}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className={`flex items-center gap-1.5 font-black text-base ${txn.isCredit ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {txn.isCredit ? <FiArrowDownLeft size={16} /> : <FiArrowUpRight size={16} />}
                        ₹{Math.abs(txn.amount).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                        {txn.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-400 font-medium whitespace-nowrap">
                      {txn.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length === 0 && (
              <div className="py-16 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                  <FiSearch className="text-gray-300" size={24} />
                </div>
                <p className="text-gray-500 text-sm font-bold">No transactions found</p>
                <p className="text-gray-400 text-xs mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>
          
          {/* Pagination Controls */}
          {(paginatedTransactions || []).length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/30">
              <p className="text-xs text-gray-500 font-medium">
                Showing <span className="font-bold text-gray-900">{((txnPage - 1) * itemsPerPage) + 1}</span> to <span className="font-bold text-gray-900">{Math.min(txnPage * itemsPerPage, filteredTransactions.length)}</span> of <span className="font-bold text-gray-900">{filteredTransactions.length}</span> entries
              </p>
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                <button
                  type="button"
                  onClick={() => setTxnPage(p => Math.max(1, p - 1))}
                  disabled={txnPage === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors disabled:opacity-30"
                ><FiChevronLeft size={16} /></button>
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
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                      txnPage === page
                        ? 'bg-gray-900 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >{page}</button>
                ))}
                <button
                  type="button"
                  onClick={() => setTxnPage(p => Math.min(totalTxnPages, p + 1))}
                  disabled={txnPage === totalTxnPages || totalTxnPages === 0}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors disabled:opacity-30"
                ><FiChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Payouts Table */
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden z-10 relative">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="py-4 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Astrologer</th>
                  <th className="py-4 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Bank Details</th>
                  <th className="py-4 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Requested Amount</th>
                  <th className="py-4 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="py-4 px-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedPayouts.map((astro, i) => (
                  <tr key={i} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
                          {astro.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{astro.name}</p>
                          <p className="text-xs text-gray-500 font-medium mt-0.5">{astro.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {astro.bankDetails ? (
                        <button 
                          onClick={() => handleViewDetails(astro.astrologerId)} 
                          className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-gray-100 rounded-xl transition-colors text-left"
                          title="View Full Details"
                        >
                          <div className="w-7 h-7 rounded-md bg-indigo-50 border border-indigo-100 shadow-sm flex items-center justify-center shrink-0 text-indigo-500">
                            <FiBriefcase size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-800 line-clamp-1">{astro.bankDetails.bankName}</p>
                            <p className="text-[10px] font-mono text-gray-500">...{String(astro.bankDetails.accountNumber).slice(-4)}</p>
                          </div>
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-rose-100">No Bank Added</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-black text-lg text-emerald-600">₹{astro.wallet?.toLocaleString() || 0}</span>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{new Date(astro.date).toLocaleDateString()}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                        astro.status === 'completed' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : 'bg-orange-50 text-orange-600 border-orange-100'
                      }`}>
                        {astro.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => handleOpenPayoutModal(astro)}
                        disabled={!astro.wallet || astro.wallet <= 0 || astro.status === 'completed' || !astro.bankDetails}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          astro.wallet > 0 && astro.status !== 'completed' && astro.bankDetails 
                            ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <FaRupeeSign size={12} /> {astro.status === 'completed' ? 'Paid' : 'Process Payout'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payouts.length === 0 && (
              <div className="py-16 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                  <FiRefreshCcw className="text-gray-300" size={24} />
                </div>
                <p className="text-gray-500 text-sm font-bold">No withdrawal requests</p>
              </div>
            )}
          </div>
          
          {/* Pagination Controls for Payouts */}
          {(paginatedPayouts || []).length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/30">
              <p className="text-xs text-gray-500 font-medium">
                Showing <span className="font-bold text-gray-900">{((payoutPage - 1) * itemsPerPage) + 1}</span> to <span className="font-bold text-gray-900">{Math.min(payoutPage * itemsPerPage, payouts.length)}</span> of <span className="font-bold text-gray-900">{payouts.length}</span> entries
              </p>
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                <button
                  type="button"
                  onClick={() => setPayoutPage(p => Math.max(1, p - 1))}
                  disabled={payoutPage === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors disabled:opacity-30"
                ><FiChevronLeft size={16} /></button>
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
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                      payoutPage === page
                        ? 'bg-gray-900 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >{page}</button>
                ))}
                <button
                  type="button"
                  onClick={() => setPayoutPage(p => Math.min(totalPayoutPages, p + 1))}
                  disabled={payoutPage === totalPayoutPages || totalPayoutPages === 0}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors disabled:opacity-30"
                ><FiChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Process Payout Modal */}
      {isPayoutModalOpen && selectedAstrologer && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Process Payout</h3>
              <button onClick={() => setIsPayoutModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
                <FiX size={16} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-2xl p-5 border border-indigo-100/50">
                <div className="flex items-center gap-4 mb-4">
                   <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border border-indigo-200 text-lg shadow-sm">
                      {selectedAstrologer.name.substring(0, 2).toUpperCase()}
                   </div>
                   <div>
                     <p className="text-lg font-black text-gray-900 leading-tight">{selectedAstrologer.name}</p>
                     <p className="text-sm text-gray-500 font-medium">{selectedAstrologer.phone}</p>
                   </div>
                </div>
                
                <div className="pt-4 border-t border-indigo-200/50 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Requested Amount</span>
                    <span className="text-xl font-black text-emerald-600">₹{selectedAstrologer.wallet?.toLocaleString()}</span>
                  </div>
                  {selectedAstrologer.bankDetails && (
                    <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm mt-1">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-gray-400 font-bold">Bank:</span> <span className="text-gray-800 font-semibold">{selectedAstrologer.bankDetails.bankName}</span></div>
                        <div><span className="text-gray-400 font-bold">A/C:</span> <span className="font-mono font-semibold text-gray-800">{selectedAstrologer.bankDetails.accountNumber}</span></div>
                        <div><span className="text-gray-400 font-bold">IFSC:</span> <span className="font-mono font-semibold text-gray-800">{selectedAstrologer.bankDetails.ifscCode}</span></div>
                        <div><span className="text-gray-400 font-bold">Name:</span> <span className="font-semibold text-gray-800 line-clamp-1">{selectedAstrologer.bankDetails.accountHolderName}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Payment Receipt / Screenshot</label>
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setPayoutReceipt(e.target.files[0])}
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-bold text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:uppercase file:tracking-wider file:bg-indigo-100 file:text-indigo-600 hover:file:bg-indigo-200 transition-all cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50/50">
              <button 
                onClick={() => setIsPayoutModalOpen(false)}
                className="flex-1 px-4 py-3.5 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleProcessPayout}
                disabled={isProcessingPayout || !payoutReceipt}
                className="flex-1 px-4 py-3.5 rounded-xl font-bold bg-gray-900 text-white hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-gray-900/20 active:scale-95"
              >
                {isProcessingPayout ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : 'Complete Payout'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Astrologer Details Modal */}
      {isDetailsModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full mx-4 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-scale-in">
            <button 
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute top-6 right-6 w-10 h-10 bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 rounded-full transition-colors"
            >
              <FiX size={20} />
            </button>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-8">Astrologer Details</h3>
            
            {loadingDetails ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              </div>
            ) : detailedAstrologer ? (
              <div className="space-y-8">
                <div className="flex items-center gap-5 bg-gradient-to-r from-gray-50 to-white p-5 rounded-2xl border border-gray-100">
                  <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-black overflow-hidden shadow-inner">
                    {detailedAstrologer.avatar ? (
                      <img src={detailedAstrologer.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      detailedAstrologer.name?.[0]?.toUpperCase()
                    )}
                  </div>
                  <div>
                    <h4 className="font-black text-2xl text-gray-900 leading-tight">{detailedAstrologer.name}</h4>
                    <p className="text-gray-500 font-medium mt-1">{detailedAstrologer.phone}</p>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] rounded-full uppercase font-black tracking-widest mt-2 inline-block border border-emerald-200">
                      {detailedAstrologer.approvalStatus}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4 text-blue-600 border border-blue-100 group-hover:scale-110 transition-transform duration-300"><FiBriefcase size={18} /></div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Bank Name</p>
                    <p className="text-base font-bold text-gray-900 line-clamp-1" title={detailedAstrologer.bankDetails?.bankName}>{detailedAstrologer.bankDetails?.bankName || 'N/A'}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 text-indigo-600 border border-indigo-100 group-hover:scale-110 transition-transform duration-300"><FiCreditCard size={18} /></div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Account Number</p>
                    <p className="text-base font-mono font-bold text-gray-900 truncate" title={detailedAstrologer.bankDetails?.accountNumber}>{detailedAstrologer.bankDetails?.accountNumber || 'N/A'}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-4 text-purple-600 border border-purple-100 group-hover:scale-110 transition-transform duration-300"><FiHash size={18} /></div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">IFSC Code</p>
                    <p className="text-base font-mono font-bold text-gray-900">{detailedAstrologer.bankDetails?.ifscCode || 'N/A'}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center mb-4 text-pink-600 border border-pink-100 group-hover:scale-110 transition-transform duration-300"><FiSmartphone size={18} /></div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">UPI ID</p>
                    <p className="text-base font-medium text-gray-900 truncate" title={detailedAstrologer.bankDetails?.upiId}>{detailedAstrologer.bankDetails?.upiId || 'N/A'}</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-white p-5 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-600 transform group-hover:scale-150 transition-transform duration-500"><FiDatabase size={64} /></div>
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 text-emerald-600 border border-emerald-200 relative z-10 group-hover:scale-110 transition-transform duration-300"><FiDatabase size={18} /></div>
                    <p className="text-xs text-emerald-600/70 font-bold uppercase tracking-wider mb-1 relative z-10">Wallet Balance</p>
                    <p className="text-2xl font-black text-emerald-600 relative z-10">₹{detailedAstrologer.wallet?.toLocaleString() || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-indigo-600 transform group-hover:scale-150 transition-transform duration-500"><FiTrendingUp size={64} /></div>
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 text-indigo-600 border border-indigo-200 relative z-10 group-hover:scale-110 transition-transform duration-300"><FiTrendingUp size={18} /></div>
                    <p className="text-xs text-indigo-600/70 font-bold uppercase tracking-wider mb-1 relative z-10">Total Earnings</p>
                    <p className="text-2xl font-black text-indigo-600 relative z-10">₹{detailedAstrologer.earnings?.total?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
                <FiSearch className="mx-auto text-gray-300 mb-3" size={32} />
                <p className="text-gray-500 font-bold">Details not found.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export Report Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-scale-in border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Export Report</h3>
              <button onClick={() => setIsExportModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
                <FiX size={16} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Select Period</label>
                <div className="space-y-3">
                  <label className={`flex items-center gap-3 p-4 border rounded-2xl cursor-pointer transition-all ${exportFilter === 'all' ? 'border-indigo-500 bg-indigo-50/30 shadow-sm' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input 
                      type="radio" 
                      name="exportFilter" 
                      value="all" 
                      checked={exportFilter === 'all'} 
                      onChange={() => setExportFilter('all')} 
                      className="text-indigo-600 focus:ring-indigo-600 w-4 h-4"
                    />
                    <span className="font-bold text-sm text-gray-800">All Time</span>
                  </label>
                  <label className={`flex items-center gap-3 p-4 border rounded-2xl cursor-pointer transition-all ${exportFilter === 'thisMonth' ? 'border-indigo-500 bg-indigo-50/30 shadow-sm' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input 
                      type="radio" 
                      name="exportFilter" 
                      value="thisMonth" 
                      checked={exportFilter === 'thisMonth'} 
                      onChange={() => setExportFilter('thisMonth')} 
                      className="text-indigo-600 focus:ring-indigo-600 w-4 h-4"
                    />
                    <span className="font-bold text-sm text-gray-800">This Month</span>
                  </label>
                  <label className={`flex items-center gap-3 p-4 border rounded-2xl cursor-pointer transition-all ${exportFilter === 'custom' ? 'border-indigo-500 bg-indigo-50/30 shadow-sm' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input 
                      type="radio" 
                      name="exportFilter" 
                      value="custom" 
                      checked={exportFilter === 'custom'} 
                      onChange={() => setExportFilter('custom')} 
                      className="text-indigo-600 focus:ring-indigo-600 w-4 h-4"
                    />
                    <span className="font-bold text-sm text-gray-800">Specific Month</span>
                  </label>
                </div>
              </div>

              {exportFilter === 'custom' && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Choose Month</label>
                  <input 
                    type="month" 
                    value={exportMonth}
                    onChange={(e) => setExportMonth(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-bold text-gray-800 shadow-sm transition-all"
                  />
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50/50">
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="flex-1 px-4 py-3.5 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleExportReport}
                disabled={exportFilter === 'custom' && !exportMonth}
                className="flex-1 px-4 py-3.5 rounded-xl font-bold bg-gray-900 text-white hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-gray-900/20 active:scale-95"
              >
                <FiDownload size={16} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminFinance;
