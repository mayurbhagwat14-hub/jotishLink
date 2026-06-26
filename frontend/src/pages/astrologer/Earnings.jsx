import { useState, useEffect } from 'react';
import { FiTrendingUp, FiDownload, FiCreditCard, FiClock, FiTrash2, FiArrowRight } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fetchAstrologerEarningsThunk, fetchAstrologerProfileThunk, requestWithdrawalThunk } from '../../store/slices/astrologerSlice';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import getSocket from '../../socket/socketManager';
import { deleteWithdrawalRequest } from '../../api/astrologerApis';

const Earnings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { earnings: { earnings = [], total = 0, thisMonth = 0, percentageChange = 0, pendingWithdrawalAmount = 0, completedWithdrawalAmount = 0, withdrawals = [] }, profile, loading } = useSelector((state) => state.astrologer);
  const { appName } = useSelector((state) => state.settings) || { appName: 'JyotishLink' };
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [deleteModalData, setDeleteModalData] = useState(null);

  useEffect(() => {
    dispatch(fetchAstrologerEarningsThunk());
    dispatch(fetchAstrologerProfileThunk());

    const token = localStorage.getItem('token') || localStorage.getItem('refreshToken');
    const socket = getSocket(token);

    const onWithdrawalProcessed = () => {
      toast.success('Your withdrawal has been successfully processed!', { duration: 5000 });
      dispatch(fetchAstrologerEarningsThunk());
    };

    socket.on('withdrawal_processed', onWithdrawalProcessed);

    return () => {
      socket.off('withdrawal_processed', onWithdrawalProcessed);
    };
  }, [dispatch]);

  const handleWithdraw = async () => {
    if (!withdrawAmount || Number(withdrawAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (Number(withdrawAmount) > total) {
      toast.error(`Amount exceeds available balance of ₹${total}`);
      return;
    }

    setIsWithdrawing(true);
    try {
      const res = await dispatch(requestWithdrawalThunk(Number(withdrawAmount))).unwrap();
      toast.success(res?.message || 'Withdrawal request sent. Money will come to your account in 1-2 working days.', { duration: 5000 });
      setWithdrawAmount('');
      dispatch(fetchAstrologerEarningsThunk());
    } catch (err) {
      toast.error(err.message || 'Failed to submit withdrawal request');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleDeleteWithdrawal = async () => {
    if (!deleteModalData) return;
    try {
      await deleteWithdrawalRequest(deleteModalData);
      toast.success("Record deleted successfully");
      dispatch(fetchAstrologerEarningsThunk());
    } catch (error) {
      toast.error("Failed to delete record");
    } finally {
      setDeleteModalData(null);
    }
  };

  const handleDownloadStatement = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(249, 115, 22); // Orange
      doc.text(`${appName} Earnings Statement`, pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Astrologer: ${profile?.astrologer?.name || 'N/A'}`, 14, 35);
      doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 42);
      
      // Summary Box
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(14, 50, pageWidth - 28, 30, 3, 3, 'FD');
      
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text(`Available Balance: Rs. ${total.toLocaleString()}`, 20, 60);
      doc.text(`Earnings This Month: Rs. ${thisMonth.toLocaleString()}`, 20, 70);
      
      // Table Data
      const tableColumn = ["Date", "Type", "Session ID", "Duration", "Net Earnings (Rs)"];
      const tableRows = [];
      
      if (earnings && earnings.length > 0) {
        earnings.forEach(earn => {
          const date = new Date(earn.date).toLocaleDateString();
          const type = earn.type === 'audio_call' ? 'Audio Call' : earn.type === 'video_call' ? 'Video Call' : earn.type || 'Session';
          const sessionId = String(earn.sessionId || '').slice(-8);
          const duration = earn.type === 'pooja' ? 'N/A' : `${Math.floor((earn.durationSeconds || 0) / 60)}m ${(earn.durationSeconds || 0) % 60}s`;
          const amount = earn.amount;
          
          tableRows.push([date, type, sessionId, duration, amount]);
        });
      } else {
        tableRows.push(["-", "No recent earnings", "-", "-", "-"]);
      }
      
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 90,
        theme: 'grid',
        headStyles: { fillColor: [249, 115, 22] },
        styles: { fontSize: 10 }
      });
      
      doc.save(`${appName.replace(/\s+/g, '')}_Statement_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Statement downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate statement');
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Earnings & Wallet</h1>
          <p className="text-gray-500 font-medium">Manage your revenue and payouts</p>
        </div>
        <button 
          onClick={handleDownloadStatement}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 shadow-sm transition-all"
        >
          <FiDownload /> Download Statement
        </button>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-6 text-white shadow-lg shadow-orange-500/20 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <p className="text-orange-100 font-medium mb-1">Available Balance</p>
          <h2 className="text-4xl font-black mb-6">₹{total.toLocaleString()}</h2>
          
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 flex gap-3 items-center border border-white/30 shadow-inner">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-200 font-black">₹</span>
              <input 
                type="number" 
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount..." 
                className="bg-black/10 rounded-lg pl-8 pr-3 py-2 text-white placeholder-orange-200 outline-none w-full font-bold focus:bg-black/20 focus:ring-2 focus:ring-white/50 transition-all"
                disabled={isWithdrawing}
              />
            </div>
            <button 
              onClick={handleWithdraw}
              disabled={isWithdrawing}
              className="bg-white text-orange-600 px-5 py-2.5 rounded-lg font-black text-sm hover:bg-orange-50 transition-colors shrink-0 shadow-md disabled:opacity-50"
            >
              {isWithdrawing ? 'Processing...' : 'Withdraw'}
            </button>
          </div>
          
          
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 text-green-500 rounded-full flex items-center justify-center">
                <FiTrendingUp size={20} />
              </div>
              <h3 className="font-bold text-gray-700">This Month</h3>
            </div>
            <button 
              onClick={() => navigate('/astrologer/session-earnings')}
              className="text-orange-500 text-sm font-bold hover:underline flex items-center gap-1"
            >
              Details <FiArrowRight size={14} />
            </button>
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-800 mb-1">₹{thisMonth.toLocaleString()}</h2>
            <p className="text-[11px] text-gray-400 font-medium mb-1">*Platform commission already deducted</p>
            <p className={`text-sm font-bold flex items-center gap-1 ${percentageChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {percentageChange >= 0 ? '+' : ''}{percentageChange}% from last month
            </p>
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
            <p className="text-gray-500 text-sm mb-1">{profile?.astrologer?.bankDetails?.bankName || 'No bank added'}</p>
            <h2 className="text-xl font-black text-gray-800">
              {profile?.astrologer?.bankDetails?.accountNumber ? `**** **** **** ${profile.astrologer.bankDetails.accountNumber.slice(-4)}` : '**** **** **** ****'}
            </h2>
            <button onClick={() => navigate('/astrologer/bank-details')} className="text-orange-500 text-sm font-bold mt-3 hover:underline cursor-pointer">Manage Accounts</button>
          </div>
        </div>
      </div>



      {/* Withdrawal History Grid */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-gray-800">Withdrawal History</h2>
        </div>
        
        {withdrawals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {withdrawals.map((withdrawal, idx) => (
              <div 
                key={idx} 
                className={`rounded-3xl p-6 shadow-sm border transition-all ${
                  withdrawal.status === 'completed' 
                    ? 'bg-gradient-to-br from-green-50 to-white border-green-100 hover:shadow-green-100/50 hover:shadow-md' 
                    : 'bg-gradient-to-br from-orange-50 to-white border-orange-100 hover:shadow-orange-100/50 hover:shadow-md'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Withdrawal Amount</p>
                    <h3 className="text-3xl font-black text-gray-800">₹{withdrawal.amount}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm ${
                      withdrawal.status === 'completed' 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-orange-100 text-orange-700 border border-orange-200 animate-pulse'
                    }`}>
                      {withdrawal.status}
                    </span>
                    <button 
                      onClick={() => setDeleteModalData(withdrawal._id)}
                      className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors border border-red-100"
                      title="Delete Record"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-5 flex items-center gap-2">
                  <FiClock className={withdrawal.status === 'completed' ? 'text-green-500' : 'text-orange-500'} /> 
                  Requested: {new Date(withdrawal.createdAt).toLocaleDateString()}
                </p>

                {withdrawal.status === 'completed' && withdrawal.paymentProof ? (
                  <div className="mt-auto border-t border-green-100/50 pt-4 flex items-center justify-between">
                    <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Payment Receipt</p>
                    <button 
                      onClick={() => setSelectedReceipt(withdrawal.paymentProof)}
                      className="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl text-sm font-bold transition-colors shadow-sm border border-green-200"
                    >
                      View Receipt
                    </button>
                  </div>
                ) : withdrawal.status === 'pending' ? (
                  <div className="mt-auto border-t border-orange-100/50 pt-4">
                    <div className="flex items-center gap-2 text-orange-600 bg-orange-100/50 p-3 rounded-xl">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>
                      <p className="text-sm font-medium">Waiting for admin approval</p>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCreditCard className="text-gray-300 w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Withdrawals Yet</h3>
            <p className="text-gray-500">When you request a payout, it will appear here.</p>
          </div>
        )}
      </div>

      {/* Receipt Viewer Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedReceipt(null)}>
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedReceipt(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 font-bold"
            >
              Close ✕
            </button>
            <img src={selectedReceipt} alt="Payment Receipt" className="w-full h-auto rounded-lg object-contain max-h-[80vh]" />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setDeleteModalData(null)}>
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="bg-red-50 p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
                <FiTrash2 size={28} />
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2">Delete Record?</h3>
              <p className="text-sm text-gray-600 font-medium">Are you sure you want to permanently delete this withdrawal record? This action cannot be undone.</p>
            </div>
            <div className="p-4 bg-gray-50 flex gap-3">
              <button 
                onClick={() => setDeleteModalData(null)}
                className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteWithdrawal}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors shadow-sm shadow-red-500/30"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Earnings;
