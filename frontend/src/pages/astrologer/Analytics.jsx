import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiUsers, FiStar, FiActivity, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { fetchAstrologerAnalyticsThunk } from '../../store/slices/dashboardSlice';

const Analytics = () => {
  const dispatch = useDispatch();
  const { astrologerAnalytics, loading } = useSelector((state) => state.dashboard);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(fetchAstrologerAnalyticsThunk());
  }, [dispatch]);

  const data = astrologerAnalytics || {};
  const trends = data.consultationTrends || [0, 0, 0, 0, 0, 0, 0];
  const reviews = data.topReviews || [];

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Analytics Overview</h1>
        <p className="text-gray-500 font-medium">Track your performance and growth</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 font-medium mb-1">Average Rating</p>
            <h2 className="text-3xl font-black text-gray-800">{(data.averageRating || 5.0).toFixed(1)}<span className="text-lg text-[#fa6830] ml-1">★</span></h2>
          </div>
          <div className="w-16 h-16 bg-orange-50 text-[#fa6830] rounded-full flex items-center justify-center">
            <FiStar size={28} />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 font-medium mb-1">Total Users Consulted</p>
            <h2 className="text-3xl font-black text-gray-800">{data.totalUsersConsulted || 0}</h2>
          </div>
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
            <FiUsers size={28} />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 font-medium mb-1">Returning Customers</p>
            <h2 className="text-3xl font-black text-gray-800">{data.returningCustomersPercentage || 0}%</h2>
          </div>
          <div className="w-16 h-16 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center">
            <FiActivity size={28} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm h-80 flex flex-col">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Consultation Trends</h2>
          <div className="flex-1 flex items-end justify-between gap-2 border-b border-gray-100 pb-2">
            {trends.map((h, i) => (
              <div key={i} className="w-full bg-orange-100 rounded-t-lg relative group h-full flex items-end">
                <div 
                  className="w-full bg-[#fa6830] rounded-t-lg transition-all duration-500 group-hover:bg-[#e55923]" 
                  style={{ height: `${h}%` }}
                ></div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-xs font-bold text-gray-400">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Top User Reviews</h2>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-50 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-gray-800">{review.userName}</h4>
                  <div className="flex text-orange-400 text-xs">
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">"{review.review}"</p>
              </div>
            ))}
            {reviews.length === 0 && (
              <p className="text-sm text-gray-500">No reviews yet.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Analytics;
