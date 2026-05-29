import { FiUsers, FiStar, FiActivity, FiArrowUp, FiArrowDown } from 'react-icons/fi';

const Analytics = () => {
  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Analytics Overview</h1>
        <p className="text-gray-500 font-medium">Track your performance and growth</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 font-medium mb-1">Average Rating</p>
            <h2 className="text-3xl font-black text-gray-800">4.9<span className="text-lg text-orange-500 ml-1">★</span></h2>
            <p className="text-sm font-bold text-green-500 flex items-center gap-1 mt-2">
              <FiArrowUp /> +0.2 this week
            </p>
          </div>
          <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center">
            <FiStar size={28} />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 font-medium mb-1">Total Users Consulted</p>
            <h2 className="text-3xl font-black text-gray-800">1,248</h2>
            <p className="text-sm font-bold text-green-500 flex items-center gap-1 mt-2">
              <FiArrowUp /> +45 this week
            </p>
          </div>
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
            <FiUsers size={28} />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 font-medium mb-1">Returning Customers</p>
            <h2 className="text-3xl font-black text-gray-800">42%</h2>
            <p className="text-sm font-bold text-red-500 flex items-center gap-1 mt-2">
              <FiArrowDown /> -2% this week
            </p>
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
            {[40, 60, 45, 80, 50, 90, 70].map((h, i) => (
              <div key={i} className="w-full bg-orange-100 rounded-t-lg relative group">
                <div 
                  className="absolute bottom-0 w-full bg-orange-500 rounded-t-lg transition-all duration-500 group-hover:bg-orange-600" 
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
            <div className="border-b border-gray-50 pb-4">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold text-gray-800">Priya K.</h4>
                <div className="flex text-orange-400 text-xs">★★★★★</div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">"Very accurate predictions. The remedies suggested were easy to follow and highly effective. Highly recommend!"</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold text-gray-800">Rahul M.</h4>
                <div className="flex text-orange-400 text-xs">★★★★★</div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">"Gave me great clarity about my career path. The video consultation felt very personal and deeply insightful."</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Analytics;
