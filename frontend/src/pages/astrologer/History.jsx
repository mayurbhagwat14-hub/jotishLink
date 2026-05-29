import { FiVideo, FiPhone, FiMessageCircle, FiCheckCircle, FiClock, FiCalendar } from 'react-icons/fi';
import { GiFlowerPot } from 'react-icons/gi';

const History = () => {
  return (
    <div className="p-4 animate-fade-in mb-6 flex flex-col h-[calc(100vh-130px)]">
      
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-gray-800">History</h1>
        <p className="text-sm text-gray-500 font-medium">Log of all your past activities</p>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        
        {/* Date Group */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <FiCalendar size={12} /> Today, May 27
          </h3>
          
          <div className="space-y-3">
            {/* History Item: Audio Call */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center border border-orange-200">
                    <FiPhone size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">Simran K.</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1 font-medium"><FiClock size={10} /> 2:30 PM • 10m 45s</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-gray-800 text-lg">₹215</p>
                  <span className="text-[10px] text-green-500 font-bold flex items-center gap-1 justify-end"><FiCheckCircle size={10} /> Completed</span>
                </div>
              </div>
            </div>

            {/* History Item: Chat */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center border border-orange-200">
                    <FiMessageCircle size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">Neha G.</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1 font-medium"><FiClock size={10} /> 11:15 AM • 25m 10s</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-gray-800 text-lg">₹375</p>
                  <span className="text-[10px] text-green-500 font-bold flex items-center gap-1 justify-end"><FiCheckCircle size={10} /> Completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Date Group */}
        <div className="pt-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <FiCalendar size={12} /> Yesterday, May 26
          </h3>
          
          <div className="space-y-3">
            {/* History Item: Video Call */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center border border-orange-200">
                    <FiVideo size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">Arjun M.</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1 font-medium"><FiClock size={10} /> 9:00 PM • 30m 00s</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-gray-800 text-lg">₹1,500</p>
                  <span className="text-[10px] text-green-500 font-bold flex items-center gap-1 justify-end"><FiCheckCircle size={10} /> Completed</span>
                </div>
              </div>
            </div>

            {/* History Item: Pooja */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center border border-orange-200">
                    <GiFlowerPot size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">Diwali Special Pooja</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1 font-medium"><FiClock size={10} /> 4:00 PM • 2 hours</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-gray-800 text-lg">₹5,100</p>
                  <span className="text-[10px] text-green-500 font-bold flex items-center gap-1 justify-end"><FiCheckCircle size={10} /> Completed</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default History;
