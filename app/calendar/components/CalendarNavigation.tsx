import { format } from 'date-fns';
import { he } from 'date-fns/locale';

type CalendarView = 'daily' | 'weekly' | 'monthly' | 'stats' | 'settings' | 'timeline';

interface CalendarNavigationProps {
  selectedView: CalendarView;
  selectedDate: Date;
  onViewChange: (view: CalendarView) => void;
}

const CalendarNavigation: React.FC<CalendarNavigationProps> = ({
  selectedView,
  selectedDate,
  onViewChange
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="space-x-2 space-x-reverse rtl">
        <button
          className={`px-4 py-2 rounded-md ${selectedView === 'daily' ? 'bg-primary-500 text-white' : 'bg-gray-100'}`}
          onClick={() => onViewChange('daily')}
        >
          יומי
        </button>
        <button
          className={`px-4 py-2 rounded-md ${selectedView === 'weekly' ? 'bg-primary-500 text-white' : 'bg-gray-100'}`}
          onClick={() => onViewChange('weekly')}
        >
          שבועי
        </button>
        <button
          className={`px-4 py-2 rounded-md ${selectedView === 'monthly' ? 'bg-primary-500 text-white' : 'bg-gray-100'}`}
          onClick={() => onViewChange('monthly')}
        >
          חודשי
        </button>
        <button
          className={`px-4 py-2 rounded-md ${selectedView === 'stats' ? 'bg-primary-500 text-white' : 'bg-gray-100'}`}
          onClick={() => onViewChange('stats')}
        >
          סטטיסטיקה
        </button>
        <button
          className={`px-4 py-2 rounded-md ${selectedView === 'settings' ? 'bg-primary-500 text-white' : 'bg-gray-100'}`}
          onClick={() => onViewChange('settings')}
        >
          הגדרות
        </button>
      </div>
      
      {selectedView !== 'settings' && (
        <div className="flex items-center">
          <span className="font-medium">
            {format(selectedDate, 'EEEE, d בMMMM yyyy', { locale: he })}
          </span>
        </div>
      )}
    </div>
  );
};

export default CalendarNavigation; 