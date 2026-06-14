import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPackage, FiTruck, FiCheckCircle, FiClock, FiCreditCard, FiX, FiAlertTriangle, FiActivity } from 'react-icons/fi';
import { getOrderById, requestCancelOrder, trackOrder } from '../../api/storeApis';

const formatDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  });
};

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const [trackingData, setTrackingData] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await getOrderById(id);
        if (res.data?.success) {
          const fetchedOrder = res.data.data.order;
          setOrder(fetchedOrder);
          
          if (fetchedOrder.awbCode) {
            try {
               const trackRes = await trackOrder(fetchedOrder._id);
               if (trackRes.data?.success && trackRes.data.data.tracking?.tracking_data?.track_status === 1) {
                  setTrackingData(trackRes.data.data.tracking.tracking_data);
               }
            } catch (trackErr) {
               console.log("Could not load advanced tracking data");
            }
          }
        }
      } catch (err) {
        alert('Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleCancelRequest = async () => {
    setCancelLoading(true);
    try {
      const res = await requestCancelOrder(order._id, cancelReason);
      if (res.data?.success) {
        setOrder({ ...order, cancelRequest: res.data.data.order.cancelRequest });
      }
      setShowCancelModal(false);
      setCancelReason('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit cancel request');
    } finally {
      setCancelLoading(false);
    }
  };

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-gray-50 text-gray-400">Loading Order...</div>;
  }

  if (!order) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <FiPackage size={40} className="text-gray-300 mb-4" />
        <p className="text-gray-500 font-medium">Order not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-orange-500 font-bold">Go Back</button>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 min-h-screen font-sans pb-24 animate-fade-in">
      
      {/* ═══ TOP NAVBAR ═══ */}
      <div className="flex items-center gap-3 px-4 py-4 bg-white sticky top-0 z-30 shadow-sm">
        <button onClick={() => navigate(-1)} className="text-gray-800 hover:bg-gray-100 p-1.5 rounded-full transition-colors">
          <FiArrowLeft size={20} />
        </button>
        <span className="text-gray-800 font-bold text-[17px]">Order Details</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Order Header Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4 border-b border-gray-50 pb-3">
            <div className="flex gap-2 items-center">
              <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                <FiPackage size={16} />
              </div>
              <div>
                <span className="text-[14px] font-black text-gray-800 block leading-tight">Order ID: {order._id.slice(-6).toUpperCase()}</span>
                <span className="text-[11px] text-gray-400">{formatDate(order.createdAt)}</span>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide ${
              order.orderStatus === 'pending' ? 'bg-orange-50 text-orange-500' :
              order.orderStatus === 'delivered' ? 'bg-green-50 text-green-600' :
              order.orderStatus === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
            }`}>
              {order.orderStatus}
            </span>
          </div>

          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex gap-3 items-center">
                <div className="w-14 h-14 rounded-xl bg-orange-50 overflow-hidden border border-gray-100 shrink-0 shadow-inner">
                  <img src={item.productId?.image || item.productId?.img || '/store_bracelet.png'} alt="Product" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[14px] font-bold text-gray-800 line-clamp-2 leading-tight">{item.productId?.name}</h4>
                  <p className="text-[12px] text-gray-500 mt-1">Qty: {item.quantity}</p>
                </div>
                <div className="text-[14px] font-black text-gray-900 shrink-0">₹{item.price * item.quantity}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-[13px] font-bold text-gray-800 mb-3 flex items-center gap-2"><FiCreditCard className="text-gray-400" /> Payment Summary</h3>
          <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center mb-3">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Payment Method</span>
              <span className="text-[13px] text-gray-800 font-bold capitalize">{order.paymentMethod}</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Status</span>
              <span className={`text-[13px] font-bold capitalize ${(order.paymentStatus === 'paid' || order.orderStatus === 'delivered') ? 'text-green-500' : order.paymentStatus === 'failed' ? 'text-red-500' : 'text-orange-500'}`}>
                {(order.orderStatus === 'delivered' || order.paymentStatus === 'paid') ? 'Success' : order.paymentStatus}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center px-1">
            <span className="text-[14px] font-bold text-gray-800">Total Amount</span>
            <span className="text-[18px] text-orange-500 font-black">₹{order.totalAmount}</span>
          </div>
        </div>

        {/* Timeline UI */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-[13px] font-bold text-gray-800 mb-5 flex items-center gap-2"><FiTruck className="text-gray-400" /> Track Order</h3>
          <div className="relative pl-2">
            <div className="absolute left-[19px] top-2 bottom-4 w-0.5 bg-gray-100 z-0"></div>
            <div className="space-y-6 relative z-10">
              {['pending', 'processing', 'shipped', 'delivered'].map((step, idx) => {
                const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
                const currentIndex = statusOrder.indexOf(order.orderStatus);
                const isCompleted = currentIndex >= idx;
                const isCurrent = currentIndex === idx;
                
                if (order.orderStatus === 'cancelled' && step !== 'pending') return null;

                let icon = <FiClock size={14} />;
                if (step === 'processing') icon = <FiPackage size={14} />;
                if (step === 'shipped') icon = <FiTruck size={14} />;
                if (step === 'delivered') icon = <FiCheckCircle size={14} />;

                return (
                  <div key={step} className={`flex items-start gap-4 ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 bg-white shadow-sm ${
                      isCurrent ? 'border-orange-500 text-orange-500' : 
                      isCompleted ? 'border-green-500 text-green-500' : 'border-gray-300 text-gray-400'
                    }`}>
                      {icon}
                    </div>
                    <div className="pt-1.5">
                      <p className={`text-[14px] font-bold capitalize ${isCurrent ? 'text-orange-600' : isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                        {step === 'pending' ? 'Order Placed' : step}
                      </p>
                      {isCurrent && step === 'shipped' && order.trackingId && (
                        <p className="text-[11px] text-blue-500 font-mono mt-1 bg-blue-50 inline-block px-2 py-0.5 rounded-md">
                          Tracking: {order.trackingId}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Shiprocket Advanced Tracking Data */}
              {trackingData && trackingData.shipment_track && trackingData.shipment_track.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-[12px] font-bold text-gray-600 mb-3 flex items-center gap-2"><FiActivity /> Live Courier Updates ({order.courierPartner})</h4>
                  <div className="space-y-4">
                    {trackingData.shipment_track[0].origin && (
                      <p className="text-[11px] text-gray-500">Origin: <strong>{trackingData.shipment_track[0].origin}</strong> → Destination: <strong>{trackingData.shipment_track[0].destination}</strong></p>
                    )}
                    <p className="text-[11px] text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded inline-block">
                       Current Status: {trackingData.shipment_status === 1 ? 'AWB Assigned' : trackingData.shipment_track[0].current_status}
                    </p>
                  </div>
                </div>
              )}
              
              {order.orderStatus === 'cancelled' && (
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 bg-white border-red-500 text-red-500 shadow-sm">
                    <FiCheckCircle size={14} />
                  </div>
                  <div className="pt-1.5">
                    <p className="text-[14px] font-bold text-red-500 capitalize">Cancelled</p>
                    {order.cancelRequest?.refundAmount > 0 && (
                      <p className="text-[11px] text-green-600 font-bold mt-1 bg-green-50 inline-block px-2 py-0.5 rounded-md">
                        ₹{order.cancelRequest.refundAmount} refunded to wallet
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cancel Request Status Card */}
        {order.cancelRequest?.requested && order.orderStatus !== 'cancelled' && (
          <div className={`rounded-2xl p-4 border shadow-sm ${
            order.cancelRequest.adminResponse === 'pending' ? 'bg-yellow-50 border-yellow-200' :
            order.cancelRequest.adminResponse === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <FiAlertTriangle size={16} className={
                order.cancelRequest.adminResponse === 'pending' ? 'text-yellow-600' :
                order.cancelRequest.adminResponse === 'rejected' ? 'text-red-500' : 'text-green-500'
              } />
              <span className={`text-[14px] font-bold ${
                order.cancelRequest.adminResponse === 'pending' ? 'text-yellow-700' :
                order.cancelRequest.adminResponse === 'rejected' ? 'text-red-600' : 'text-green-700'
              }`}>
                {order.cancelRequest.adminResponse === 'pending' 
                  ? 'Cancel Request Sent' 
                  : order.cancelRequest.adminResponse === 'rejected' 
                    ? 'Cancel Request Rejected' 
                    : 'Cancel Approved'}
              </span>
            </div>
            {order.cancelRequest.adminResponse === 'pending' && (
              <p className="text-[12px] text-gray-700 leading-relaxed">
                Your cancellation request is being reviewed. Expected refund: <span className="font-bold text-green-600">₹{order.cancelRequest.refundAmount} ({order.cancelRequest.refundPercent}%)</span>
              </p>
            )}
          </div>
        )}

        {/* Cancel Button */}
        {['pending', 'processing', 'shipped'].includes(order.orderStatus) && !order.cancelRequest?.requested && (
          <button 
            onClick={() => setShowCancelModal(true)}
            className="w-full py-3.5 border-2 border-red-200 bg-white text-red-500 font-bold rounded-2xl text-[14px] hover:bg-red-50 transition-colors flex items-center justify-center gap-2 shadow-sm mt-6"
          >
            <FiX size={18} /> Cancel Order
          </button>
        )}
      </div>

      {/* ═══ CANCEL ORDER MODAL ═══ */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <FiAlertTriangle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-[16px]">Cancel Order</h3>
                <p className="text-[11px] text-gray-400">Order #{order._id.slice(-6).toUpperCase()}</p>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-xl p-3 mb-4 border border-green-100">
              <p className="text-[12px] text-green-700 font-medium">
                You will receive <span className="font-bold">80% refund (₹{Math.round(order.totalAmount * 0.8)})</span> to your wallet upon approval.
              </p>
            </div>

            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)"
              rows={3}
              className="w-full bg-gray-50 rounded-xl p-3 text-[13px] outline-none border border-gray-100 focus:border-orange-300 resize-none mb-4"
            />

            <div className="flex gap-2">
              <button 
                onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-[13px] hover:bg-gray-200 transition-colors"
              >
                Keep Order
              </button>
              <button 
                onClick={handleCancelRequest}
                disabled={cancelLoading}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl text-[13px] hover:bg-red-600 transition-colors shadow-sm disabled:opacity-50"
              >
                {cancelLoading ? 'Sending...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderDetails;
