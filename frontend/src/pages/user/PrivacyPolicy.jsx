import React from 'react';
import { useSelector } from 'react-redux';
import { FiShield, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const { privacyPolicy, appName } = useSelector(state => state.settings) || { privacyPolicy: '', appName: 'JyotishLink' };
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-green-600 font-bold mb-6 transition-colors"
        >
          <FiArrowLeft size={20} />
          Back
        </button>
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <FiShield size={120} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white relative z-10 tracking-tight">Privacy Policy</h1>
            <p className="text-green-100 mt-2 font-medium relative z-10">How {appName} protects your data</p>
          </div>
          
          <div className="p-8 sm:p-12 prose prose-green max-w-none text-gray-700 font-medium leading-relaxed">
            {privacyPolicy ? (
              <div 
                dangerouslySetInnerHTML={{ __html: privacyPolicy.replace(/\n/g, '<br />') }} 
                className="whitespace-pre-wrap"
              />
            ) : (
              <div className="text-center text-gray-400 py-10">
                <FiShield size={48} className="mx-auto mb-4 opacity-50" />
                <p>Privacy Policy has not been updated yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
