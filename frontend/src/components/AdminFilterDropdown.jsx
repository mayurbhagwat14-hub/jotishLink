import { FiChevronDown, FiCheck } from 'react-icons/fi';

const AdminFilterDropdown = ({ tabs, activeTab, onTabChange, tabCounts = {} }) => {
  const activeTabObj = tabs.find(t => (typeof t === 'object' ? t.id === activeTab : t === activeTab));
  const activeLabel = typeof activeTabObj === 'object' ? (activeTabObj.label || activeTabObj.id) : activeTab;
  const activeIcon = typeof activeTabObj === 'object' ? activeTabObj.icon : null;

  return (
    <div className="relative group z-20">
      <button className="flex items-center justify-between gap-3 min-w-[160px] px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-sm transition-all hover:bg-black">
        <div className="flex items-center gap-2">
          {activeIcon && <span className="text-gray-300">{activeIcon}</span>}
          <span>{activeLabel}</span>
          {tabCounts[activeTab] > 0 && (
            <span className="bg-white/20 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
              {tabCounts[activeTab]}
            </span>
          )}
        </div>
        <FiChevronDown size={16} className="text-gray-400 group-hover:text-white transition-colors" />
      </button>

      {/* Dropdown Menu */}
      <div className="absolute left-0 mt-2 min-w-[200px] bg-white border border-gray-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-left scale-95 group-hover:scale-100">
        <div className="p-2 space-y-1">
          <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Option</p>
          {tabs.map((tabItem) => {
            const isObject = typeof tabItem === 'object';
            const tabId = isObject ? tabItem.id : tabItem;
            const tabLabel = isObject ? (tabItem.label || tabItem.id) : tabItem;
            const tabIcon = isObject ? tabItem.icon : null;

            return (
              <button
                key={tabId}
                onClick={() => onTabChange(tabId)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-bold rounded-xl transition-colors ${
                  activeTab === tabId ? 'bg-orange-50 text-[#e55923]' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {activeTab === tabId && <FiCheck size={14} />}
                  <span className={`flex items-center gap-2 ${activeTab === tabId ? 'ml-0' : 'ml-5'}`}>
                    {tabIcon && <span className={activeTab === tabId ? 'text-orange-400' : 'text-gray-400'}>{tabIcon}</span>}
                    {tabLabel}
                  </span>
                </div>
                
                {tabCounts[tabId] > 0 && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center justify-center ${
                    activeTab === tabId ? 'bg-orange-100 text-[#e55923]' : 
                    tabId === 'Pending Approval' || tabId === 'Pending' ? 'bg-red-500 text-white animate-pulse' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {tabCounts[tabId]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminFilterDropdown;
