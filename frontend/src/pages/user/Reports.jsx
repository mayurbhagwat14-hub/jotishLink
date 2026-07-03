import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiFileText } from 'react-icons/fi';

const Reports = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center gap-3 sticky top-0 z-50 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <FiArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="text-[17px] font-bold text-gray-900">My Reports</h1>
      </div>

      <div className="flex flex-col items-center justify-center p-8 mt-10 text-center">
        <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-4 border border-teal-100">
          <FiFileText size={32} className="text-teal-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No Reports Available</h2>
        <p className="text-gray-500 text-sm max-w-[250px]">
          You haven't requested any detailed reports yet.
        </p>
        <button 
          onClick={() => navigate('/user/home')}
          className="mt-6 bg-[#fa6830] text-white px-6 py-2.5 rounded-full font-bold shadow-md shadow-orange-500/20 active:scale-95 transition-all"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default Reports;
