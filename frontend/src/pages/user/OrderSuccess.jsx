import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiPackage, FiTruck, FiHome, FiArrowLeft, FiClock, FiCreditCard } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { getOrderById } from '../../api/storeApis';
import SplashScreen from '../../components/SplashScreen';

const OrderSuccess = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        if (!orderId || orderId === 'recent') {
          // Fallback if no specific orderId is passed, although it shouldn't happen normally
          setOrder({
            id: 'ORD-' + Math.floor(Math.random() * 1000000),
            status: 'accepted',
            date: new Date().toLocaleDateString(),
            amount: 'N/A',
            paymentMethod: 'wallet',
          });
          setLoading(false);
          return;
        }

        const res = await getOrderById(orderId);
        const orderData = res.data?.data?.order || res.data?.order;
        
        if (orderData) {
          setOrder({
            id: orderData._id.toString().slice(-6).toUpperCase(),
            fullId: orderData._id,
            status: orderData.orderStatus,
            date: new Date(orderData.createdAt).toLocaleDateString(),
            amount: '₹' + orderData.totalAmount,
            paymentMethod: orderData.paymentMethod,
          });
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  if (loading) {
    return <SplashScreen />;
  }

  const steps = [
    { label: 'Order Accepted', icon: FiCheckCircle, date: order?.date || 'Today', active: true },
    { label: 'Processing', icon: FiPackage, date: 'Pending', active: ['processing', 'shipped', 'delivered'].includes(order?.status) },
    { label: 'Shipped', icon: FiTruck, date: 'Pending', active: ['shipped', 'delivered'].includes(order?.status) },
    { label: 'Delivered', icon: FiHome, date: 'Expected in 3-5 days', active: order?.status === 'delivered' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between px-4 py-3 bg-white sticky top-0 z-30 shadow-sm border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/user/store')} className="text-gray-800 hover:bg-gray-100 p-1.5 rounded-full transition-colors">
            <FiArrowLeft size={20} />
          </button>
          <span className="text-gray-800 font-semibold text-[17px]">Order Confirmation</span>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {/* Success Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100 mb-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4">
            <FiCheckCircle className="text-green-500 w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Order Placed Successfully!</h2>
          <p className="text-sm text-gray-500 font-medium mb-4">Thank you for your purchase. Your order has been received and is currently being processed.</p>
          <div className="bg-gray-50 w-full py-3 rounded-xl border border-gray-100 flex justify-center gap-6 mt-4">
            <div>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Order ID</p>
              <p className="text-sm font-bold text-gray-800">#{order?.id}</p>
            </div>
            <div className="w-px bg-gray-200"></div>
            <div>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Total Amount</p>
              <p className="text-sm font-bold text-gray-800">{order?.amount}</p>
            </div>
            <div className="w-px bg-gray-200"></div>
            <div>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Payment</p>
              <p className="text-sm font-bold text-gray-800 capitalize flex items-center gap-1">
                <FiCreditCard size={12} className="text-[#fa6830]" />
                {order?.paymentMethod}
              </p>
            </div>
          </div>
        </div>

        {/* Tracking Timeline */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-[15px] font-bold text-gray-800 mb-5">Order Status</h3>
          <div className="relative pl-3">
            <div className="absolute left-[21px] top-4 bottom-4 w-0.5 bg-gray-100"></div>
            <div className="space-y-6">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={idx} className="relative flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 relative z-10 ${step.active ? 'bg-[#fa6830] text-white shadow-md shadow-orange-500/20' : 'bg-gray-100 text-gray-400'}`}>
                      <Icon size={14} />
                    </div>
                    <div className="pt-1 flex-1">
                      <p className={`text-[14px] font-bold ${step.active ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                      <p className={`text-[12px] mt-0.5 flex items-center gap-1 ${step.active ? 'text-gray-500 font-medium' : 'text-gray-300'}`}>
                        <FiClock size={10} /> {step.date}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Next Steps Action */}
        <div className="space-y-3">
          <button 
            onClick={() => navigate(order?.fullId ? `/user/order/${order.fullId}` : '/user/history?tab=Orders')} 
            className="w-full bg-[#fa6830] hover:bg-[#e55923] text-white font-bold py-4 rounded-xl text-[14px] shadow-sm transition-colors"
          >
            Track Order Details
          </button>
          <button 
            onClick={() => navigate('/user/store')} 
            className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-4 rounded-xl text-[14px] border border-gray-200 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
