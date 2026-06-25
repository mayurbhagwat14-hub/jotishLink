import React from 'react';
import { useSelector } from 'react-redux';

const LogoLoader = () => {
  const { appName, appLogo } = useSelector(state => state.settings) || { appName: 'JyotishLink', appLogo: '' };

  return (
    <div className="flex flex-col items-center justify-center p-8 animate-pulse-zoom">
      <div className="flex justify-center relative">
        {appLogo ? (
          <div className="flex flex-col items-center mix-blend-multiply relative z-10">
            <img src={appLogo} alt={appName} className="h-[80px] w-auto object-contain drop-shadow-md mb-2" />
          </div>
        ) : (
          <div className="w-[60px] h-[60px] bg-gradient-to-tr from-orange-400 to-orange-500 rounded-full flex flex-col items-center justify-center shadow-lg shadow-orange-200 mb-2 border-2 border-orange-50">
            <span className="text-white font-black text-xl">{(appName || 'JL').substring(0,2).toUpperCase()}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 mt-3">
          <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-sm shadow-orange-200" />
          <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse shadow-sm shadow-orange-200" style={{ animationDelay: '0.2s' }} />
          <span className="w-2 h-2 bg-orange-300 rounded-full animate-pulse shadow-sm shadow-orange-200" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  );
};

export default LogoLoader;
