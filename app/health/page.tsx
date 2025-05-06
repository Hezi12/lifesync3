'use client';

import { useState } from 'react';
import { HiOutlineScale, HiOutlineChartBar } from 'react-icons/hi';
import WeightTracker from '../components/health/WeightTracker';
import ActivityTracker from '../components/health/ActivityTracker';

const HealthPage = () => {
  const [activeTab, setActiveTab] = useState<'weight' | 'activity'>('weight');
  
  return (
    <div className="container max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">בריאות וכושר</h1>
      
      <div className="bg-white rounded-lg shadow-md mb-4 sm:mb-6">
        <div className="flex border-b overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('weight')}
            className={`flex items-center px-4 sm:px-6 py-2 sm:py-3 text-sm font-medium transition-colors flex-1 justify-center sm:justify-start ${
              activeTab === 'weight'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <HiOutlineScale className="ml-1 sm:ml-2 flex-shrink-0" />
            <span>מעקב משקל</span>
          </button>
          
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center px-4 sm:px-6 py-2 sm:py-3 text-sm font-medium transition-colors flex-1 justify-center sm:justify-start ${
              activeTab === 'activity'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <HiOutlineChartBar className="ml-1 sm:ml-2 flex-shrink-0" />
            <span>פעילות גופנית</span>
          </button>
        </div>
        
        <div className="p-2 sm:p-4">
          {activeTab === 'weight' ? <WeightTracker /> : <ActivityTracker />}
        </div>
      </div>
    </div>
  );
};

export default HealthPage; 