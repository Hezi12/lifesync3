'use client';

import { useState } from 'react';
import { FiActivity, FiTrendingUp } from 'react-icons/fi';
import WeightTracker from '../components/health/WeightTracker';
import ActivityTracker from '../components/health/ActivityTracker';

type HealthView = 'weight' | 'activity';

export default function HealthPage() {
  const [selectedView, setSelectedView] = useState<HealthView>('weight');

  const renderView = () => {
    switch (selectedView) {
      case 'weight':
        return <WeightTracker />;
      case 'activity':
        return <ActivityTracker />;
      default:
        return <WeightTracker />;
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">בריאות</h1>
        
        <div className="flex space-x-4 space-x-reverse">
          <button
            className={`px-4 py-2 rounded-md flex items-center ${
              selectedView === 'weight' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setSelectedView('weight')}
          >
            <FiTrendingUp className="ml-2" />
            <span>משקל</span>
          </button>
          
          <button
            className={`px-4 py-2 rounded-md flex items-center ${
              selectedView === 'activity' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setSelectedView('activity')}
          >
            <FiActivity className="ml-2" />
            <span>פעילות גופנית</span>
          </button>
        </div>
      </div>
      
      {renderView()}
    </div>
  );
} 