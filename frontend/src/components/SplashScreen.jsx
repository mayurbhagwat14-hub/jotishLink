import React from 'react';
import { useSelector } from 'react-redux';

const SplashScreen = () => {
  const { appName, appLogo } = useSelector(state => state.settings) || { appName: 'JyotishLink', appLogo: '' };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center font-sans relative overflow-hidden">
      {/* Decorative floating dots */}
      <div className="absolute top-[15%] left-[20%] w-3 h-3 bg-orange-200 rounded-full animate-float opacity-50" />
      <div className="absolute top-[30%] right-[15%] w-2 h-2 bg-orange-300 rounded-full animate-float opacity-40" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-[20%] left-[25%] w-4 h-4 bg-orange-100 rounded-full animate-float opacity-60" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-[30%] right-[20%] w-2.5 h-2.5 bg-orange-200 rounded-full animate-float opacity-50" style={{ animationDelay: '1.5s' }} />

      <div className="flex flex-col items-center animate-pulse-zoom z-10">
        {/* Logo or Title */}
        <div className="flex justify-center relative">
          {appLogo ? (
            <div className="flex flex-col items-center mix-blend-multiply relative z-10">
              <img src={appLogo} alt={appName} className="h-[180px] w-auto object-contain drop-shadow-md mb-2" />
              <div className="text-[44px] font-serif leading-none tracking-tight font-bold text-gray-900 mt-2">
                {appName}
              </div>
            </div>
          ) : (
            <div className="w-[120px] h-[120px] bg-gradient-to-tr from-orange-400 to-orange-500 rounded-full flex flex-col items-center justify-center shadow-lg shadow-orange-200 mb-4 border-4 border-orange-50">
              <span className="text-white font-black text-4xl">{(appName || 'JL').substring(0,2).toUpperCase()}</span>
            </div>
          )}
        </div>

        {!appLogo && (
          <h1 className="text-[34px] font-bold text-gray-900 tracking-tight text-center">{appName}</h1>
        )}
        
        <div className="flex items-center gap-2 mt-8">
            <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse shadow-sm shadow-orange-200" />
            <span className="w-2.5 h-2.5 bg-orange-400 rounded-full animate-pulse shadow-sm shadow-orange-200" style={{ animationDelay: '0.2s' }} />
            <span className="w-2.5 h-2.5 bg-orange-300 rounded-full animate-pulse shadow-sm shadow-orange-200" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
