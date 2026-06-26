import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Truck, Clock, CreditCard, X, AlertTriangle, MapPin, Check, FileText, ChevronRight, Map, Phone, CheckCircle2, Mail } from 'lucide-react';
import { trackOrder, getOrderById, requestCancelOrder, getUserShiprocketOrderDetails } from '../../api/storeApis';
import { toast } from 'react-hot-toast';
import SplashScreen from '../../components/SplashScreen';

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
  const [shiprocketDetails, setShiprocketDetails] = useState(null);

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
          if (fetchedOrder.shiprocketOrderId) {
            try {
              const srDetailsRes = await getUserShiprocketOrderDetails(fetchedOrder._id);
              if (srDetailsRes.data?.success) {
                setShiprocketDetails(srDetailsRes.data.data.shiprocketDetails.data);
              }
            } catch (err) {
              console.log("Could not load shiprocket live details");
            }
          }
        }
      } catch (err) {
        toast.error('Failed to load order details');
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
      toast.success('Cancellation request submitted.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit cancel request');
    } finally {
      setCancelLoading(false);
    }
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  if (!order) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <Package size={48} strokeWidth={1.5} className="text-gray-300 mb-4" />
        <p className="text-gray-500 font-medium">Order not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-orange-500 font-bold hover:underline">Go Back</button>
      </div>
    );
  }

  const getOrderStatusProgress = () => {
    if (order.orderStatus === 'cancelled') return -1;
    const statuses = ['pending', 'processing', 'shipped', 'delivered'];
    return statuses.indexOf(order.orderStatus);
  };

  const currentStepIndex = getOrderStatusProgress();

  return (
    <div className="w-full bg-gray-50 min-h-screen font-sans pb-24 animate-fade-in">
      {/* ═══ TOP NAVBAR ═══ */}
      <div className="bg-white sticky top-0 z-30 shadow-[0_2px_10px_rgba(0,0,0,0.05)] border-b border-gray-100 flex items-center px-4 py-4">
        <button onClick={() => navigate(-1)} className="text-gray-800 p-1 -ml-1 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-[17px] font-bold text-gray-800 ml-3">Order Details</h1>
      </div>

      <div className="px-3 py-4 max-w-2xl mx-auto space-y-4">

        {/* ORDER ID & DATE */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex justify-between items-center">
           <div>
              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Order ID</p>
              <p className="font-mono text-[14px] font-black text-gray-800">#{order._id.toUpperCase()}</p>
           </div>
           <div className="text-right">
              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Order Date</p>
              <p className="text-[13px] font-bold text-gray-800">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
           </div>
        </div>

        {/* SHIPROCKET & EXPECTED DELIVERY HIGHLIGHT */}
        <div className={`rounded-2xl p-5 shadow-sm border ${
          order.orderStatus === 'cancelled' ? 'bg-red-50 border-red-100' :
          order.orderStatus === 'delivered' ? 'bg-green-50 border-green-100' :
          'bg-orange-50 border-orange-100'
        }`}>
          <div className="flex items-start gap-4">
             <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
               order.orderStatus === 'cancelled' ? 'bg-red-500 text-white' :
               order.orderStatus === 'delivered' ? 'bg-green-500 text-white' :
               'bg-orange-500 text-white'
             }`}>
               {order.orderStatus === 'delivered' ? <CheckCircle2 size={24} /> :
                order.orderStatus === 'cancelled' ? <X size={24} /> :
                <Truck size={24} />}
             </div>
             <div>
                <h2 className={`text-xl font-black capitalize mb-1 ${
                  order.orderStatus === 'cancelled' ? 'text-red-700' :
                  order.orderStatus === 'delivered' ? 'text-green-700' :
                  'text-orange-700'
                }`}>
                  {order.orderStatus === 'pending' ? 'Order Confirmed' : order.orderStatus}
                </h2>
                <p className={`text-[13px] font-medium leading-snug ${
                  order.orderStatus === 'cancelled' ? 'text-red-600' :
                  order.orderStatus === 'delivered' ? 'text-green-600' :
                  'text-orange-700'
                }`}>
                  {order.orderStatus === 'delivered' ? `Your package was delivered on ${formatDate(order.updatedAt)}` :
                   order.orderStatus === 'cancelled' ? 'This order has been cancelled.' :
                   trackingData?.etd ? `Expected Delivery by ${new Date(trackingData.etd).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}` :
                   shiprocketDetails?.status ? `Current Status: ${shiprocketDetails.status}` :
                   'Your order is being processed and will be shipped soon.'}
                </p>
             </div>
          </div>
        </div>

        {/* TRACKING PROGRESS BAR (AMAZON STYLE) */}
        {order.orderStatus !== 'cancelled' && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
             <h3 className="text-[14px] font-bold text-gray-800 mb-6 flex items-center gap-2">
               <MapPin className="text-orange-500" size={18} /> Delivery Status
             </h3>
             <div className="relative flex items-center justify-between z-0 px-2">
                {/* Background Track */}
                <div className="absolute top-4 left-6 right-6 h-1 bg-gray-200 -translate-y-1/2 z-[-1]" />
                {/* Fill Track */}
                <div className="absolute top-4 left-6 h-1 bg-green-500 -translate-y-1/2 transition-all duration-1000 z-[-1]" style={{ width: `calc(${Math.max(0, currentStepIndex)} * (100% - 48px) / 3)` }} />
                
                {['Placed', 'Packed', 'Shipped', 'Delivered'].map((step, idx) => {
                  const isCompleted = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;
                  return (
                    <div key={step} className="flex flex-col items-center gap-2 relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 z-10 ${
                         isCompleted ? 'bg-green-500 text-white shadow-md shadow-green-500/30' : 'bg-gray-200 text-white'
                      }`}>
                        <Check size={16} strokeWidth={3} />
                      </div>
                      <span className={`text-[11px] font-bold absolute top-10 w-20 text-center -ml-6 transition-colors ${
                        isCurrent ? 'text-green-600' : isCompleted ? 'text-gray-800' : 'text-gray-400'
                      }`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
             </div>
             <div className="h-6"></div>
          </div>
        )}

        {/* DETAILED TRACKING TIMELINE */}
        {order.orderStatus !== 'cancelled' && (trackingData?.shipment_track_activities?.length > 0 || trackingData?.shipment_track?.[0] || shiprocketDetails) && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
             <h3 className="text-[14px] font-bold text-gray-800 mb-5 flex items-center gap-2">
               <Truck className="text-orange-500" size={18} /> Shipping Details
             </h3>
             
             {/* Courier Highlights */}
             {(order.courierPartner || trackingData?.shipment_track?.[0] || shiprocketDetails?.courier_name) && (
               <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6 flex flex-wrap gap-4 justify-between items-center">
                 <div>
                   <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">Courier Partner</p>
                   <p className="text-[13px] font-black text-gray-800">{trackingData?.shipment_track?.[0]?.courier_name || shiprocketDetails?.courier_name || order.courierPartner || 'Awaiting Assignment'}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">Tracking AWB</p>
                   <p className="text-[13px] font-bold text-orange-600 font-mono">{trackingData?.shipment_track?.[0]?.awb_code || order.awbCode || 'Pending'}</p>
                 </div>
               </div>
             )}

             {/* Vertical Activities Timeline */}
             {trackingData?.shipment_track_activities?.length > 0 ? (
               <div className="relative pl-3 space-y-6">
                 {/* Timeline Line */}
                 <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-gray-200" />
                 
                 {trackingData.shipment_track_activities.map((activity, idx) => {
                   const isFirst = idx === 0; // Most recent
                   return (
                     <div key={idx} className="relative flex items-start gap-4">
                       <div className={`w-3.5 h-3.5 rounded-full z-10 shrink-0 mt-1.5 ring-4 ring-white ${
                         isFirst && order.orderStatus !== 'delivered' ? 'bg-orange-500' :
                         isFirst && order.orderStatus === 'delivered' ? 'bg-green-500' : 'bg-gray-400'
                       }`} />
                       <div className="flex-1 min-w-0">
                         <p className={`text-[13px] font-bold mb-0.5 ${isFirst ? 'text-gray-900' : 'text-gray-600'}`}>
                           {activity.activity || activity.status}
                         </p>
                         {activity.location && (
                           <p className="text-[11px] text-gray-500 font-medium flex items-center gap-1 mb-1">
                             <MapPin size={10} className="shrink-0" /> <span className="truncate">{activity.location}</span>
                           </p>
                         )}
                         <p className="text-[10px] text-gray-400 font-mono font-medium">
                           {formatDate(activity.date)}
                         </p>
                       </div>
                     </div>
                   );
                 })}
               </div>
             ) : (
               <div className="text-center py-4 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-2 text-gray-400 shadow-sm">
                   <Clock size={18} />
                 </div>
                 <p className="text-[12px] font-bold text-gray-700">Awaiting Courier Updates</p>
                 <p className="text-[11px] text-gray-500 mt-0.5">Tracking events will appear here once the courier updates the status.</p>
               </div>
             )}
          </div>
        )}

        {/* ORDER ITEMS */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-[14px] font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Package size={18} className="text-orange-500" /> Products Ordered
          </h3>
          <div className="space-y-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex gap-4 items-start pb-4 border-b border-gray-50 last:border-0 last:pb-0 cursor-pointer group" onClick={() => navigate(`/user/product/${item.productId?._id}`)}>
                <div className="w-20 h-20 rounded-xl bg-gray-50 overflow-hidden border border-gray-100 shrink-0 relative group-hover:border-orange-200 transition-colors">
                  <img src={item.productId?.image || item.productId?.img || '/store_bracelet.png'} alt="Product" className="w-full h-full object-cover" />
                  <div className="absolute top-1 right-1 bg-white/90 backdrop-blur text-[10px] font-black px-1.5 py-0.5 rounded text-gray-800 shadow-sm">
                    x{item.quantity}
                  </div>
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h4 className="text-[14px] font-bold text-gray-800 line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors">{item.productId?.name}</h4>
                  <p className="text-[11px] text-gray-500 mt-1 font-medium">{item.productId?.category || 'Store Item'}</p>
                  <p className="text-[15px] font-black text-gray-900 mt-2">₹{item.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SHIPPING ADDRESS */}
        {order.shippingAddress && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
             <h3 className="text-[14px] font-bold text-gray-800 mb-4 flex items-center gap-2">
               <Map className="text-orange-500" size={18} /> Shipping Address
             </h3>
             <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-[13px] font-bold text-gray-900 mb-1">{order.shippingAddress.fullName || order.shippingAddress.name || 'Customer'}</p>
                <p className="text-[12px] text-gray-600 leading-relaxed mb-2">
                  {order.shippingAddress.addressLine || order.shippingAddress.street}<br/>
                  {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode || order.shippingAddress.zipCode}
                </p>
                {(order.shippingAddress.phone || order.shippingAddress.email) && (
                  <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-gray-200">
                    {order.shippingAddress.phone && (
                      <p className="text-[12px] font-medium text-gray-700 flex items-center gap-1.5">
                        <Phone size={12} className="text-gray-400" /> {order.shippingAddress.phone}
                      </p>
                    )}
                    {order.shippingAddress.email && (
                      <p className="text-[12px] font-medium text-gray-700 flex items-center gap-1.5">
                        <Mail size={12} className="text-gray-400" /> {order.shippingAddress.email}
                      </p>
                    )}
                  </div>
                )}
             </div>
          </div>
        )}
        
        {/* PRICE SUMMARY */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
           <h3 className="text-[14px] font-bold text-gray-800 mb-4 flex items-center gap-2">
             <CreditCard size={18} className="text-orange-500" /> Payment Summary
           </h3>
           <div className="space-y-3 mb-4">
              <div className="flex justify-between text-[13px] font-medium text-gray-600">
                <span>Items Subtotal</span>
                <span className="font-bold text-gray-800">₹{order.totalAmount + (order.discountAmount || 0)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-[13px] font-medium text-green-600">
                  <span>Coupon Discount</span>
                  <span className="font-bold">-₹{order.discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-[13px] font-medium text-gray-600">
                <span>Shipping Fee</span>
                <span className="font-bold text-green-600">FREE</span>
              </div>
           </div>
           
           <div className="pt-4 border-t border-gray-100 flex justify-between items-center bg-gray-50 -mx-5 px-5 -mb-5 pb-5 rounded-b-2xl">
             <div className="flex flex-col">
               <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider mb-1">
                 {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
               </span>
               <span className={`text-[12px] font-black flex items-center gap-1 ${
                  (order.paymentStatus === 'paid' || order.orderStatus === 'delivered') ? 'text-green-600' : 
                  (order.paymentStatus === 'failed' || order.orderStatus === 'cancelled') ? 'text-red-500' : 'text-orange-500'
               }`}>
                  {(order.orderStatus === 'delivered' || order.paymentStatus === 'paid') ? <><CheckCircle size={14}/> Payment Successful</> : 
                   (order.orderStatus === 'cancelled' && order.paymentStatus === 'pending') ? <><X size={14}/> Cancelled</> : <><Clock size={14}/> Pending Payment</>}
               </span>
             </div>
             <div className="text-right">
               <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-0.5">Grand Total</span>
               <span className="text-[22px] text-gray-900 font-black">₹{order.totalAmount}</span>
             </div>
           </div>
        </div>

        {/* Cancel Request Status Card */}
        {order.cancelRequest?.requested && order.orderStatus !== 'cancelled' && (
          <div className={`rounded-2xl p-5 border shadow-sm ${
            order.cancelRequest.adminResponse === 'pending' ? 'bg-yellow-50 border-yellow-200' :
            order.cancelRequest.adminResponse === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={18} className={
                order.cancelRequest.adminResponse === 'pending' ? 'text-yellow-600' :
                order.cancelRequest.adminResponse === 'rejected' ? 'text-red-500' : 'text-green-500'
              } />
              <span className={`text-[14px] font-black ${
                order.cancelRequest.adminResponse === 'pending' ? 'text-yellow-700' :
                order.cancelRequest.adminResponse === 'rejected' ? 'text-red-600' : 'text-green-700'
              }`}>
                {order.cancelRequest.adminResponse === 'pending' 
                  ? 'Cancellation Requested' 
                  : order.cancelRequest.adminResponse === 'rejected' 
                    ? 'Cancellation Rejected' 
                    : 'Cancellation Approved'}
              </span>
            </div>
            {order.cancelRequest.adminResponse === 'pending' && (
              <p className="text-[12px] text-gray-700 font-medium leading-relaxed">
                Your request is under review. If approved, you will receive <span className="font-black text-green-600">₹{order.cancelRequest.refundAmount}</span> in your wallet.
              </p>
            )}
          </div>
        )}

        {/* Cancel Button */}
        {['pending', 'processing', 'shipped'].includes(order.orderStatus) && !order.cancelRequest?.requested && (
          <button 
            onClick={() => setShowCancelModal(true)}
            className="w-full py-4 border border-red-200 bg-white text-red-500 font-black rounded-2xl text-[14px] hover:bg-red-50 transition-all flex items-center justify-center gap-2 shadow-sm mt-6"
          >
            <X size={18} strokeWidth={3} /> Cancel Order
          </button>
        )}
      </div>

      {/* ═══ CANCEL ORDER MODAL ═══ */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-black text-gray-900 text-[18px]">Cancel Order</h3>
                <p className="text-[12px] text-gray-500 font-mono font-bold">#{order._id.slice(-8).toUpperCase()}</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-4 mb-5 border border-gray-100">
              <p className="text-[13px] text-gray-700 font-medium leading-relaxed">
                {order.paymentMethod === 'cod' ? (
                  <span>This is a <strong>Cash on Delivery</strong> order. No refund is required to be processed.</span>
                ) : (
                  <span>If approved, you will receive an <span className="font-black text-green-600">80% refund (₹{Math.round(order.totalAmount * 0.8)})</span> directly to your wallet.</span>
                )}
              </p>
            </div>

            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Tell us why you're cancelling (optional)"
              rows={3}
              className="w-full bg-white rounded-2xl p-4 text-[13px] font-medium outline-none border border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-50 resize-none mb-5 transition-all placeholder:text-gray-400"
            />

            <div className="flex gap-3">
              <button 
                onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-black rounded-2xl text-[13px] hover:bg-gray-200 transition-colors"
              >
                Keep Order
              </button>
              <button 
                onClick={handleCancelRequest}
                disabled={cancelLoading}
                className="flex-1 py-3.5 bg-red-500 text-white font-black rounded-2xl text-[13px] hover:bg-red-600 transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 flex items-center justify-center"
              >
                {cancelLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderDetails;
