import React from 'react';
import { useSelector } from 'react-redux';
import { FiFileText, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Terms = () => {
  const { termsOfUse, appName } = useSelector(state => state.settings) || { termsOfUse: '', appName: 'JyotishLink' };
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-orange-500 font-bold mb-6 transition-colors"
        >
          <FiArrowLeft size={20} />
          Back
        </button>
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <FiFileText size={120} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white relative z-10 tracking-tight">Terms & Conditions</h1>
            <p className="text-orange-100 mt-2 font-medium relative z-10">Welcome to {appName}</p>
          </div>
          
          <div className="p-8 sm:p-12 prose prose-orange max-w-none text-gray-700 whitespace-pre-wrap font-medium leading-relaxed">
            {termsOfUse || (
              <div className="text-center text-gray-400 py-10">
                <FiFileText size={48} className="mx-auto mb-4 opacity-50" />
                <p>Terms & Conditions have not been updated yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
