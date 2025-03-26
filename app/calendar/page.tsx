'use client';

import { useState } from 'react';
import DailyView from '../components/calendar/DailyView';
import WeeklyView from '../components/calendar/WeeklyView';
import MonthlyView from '../components/calendar/MonthlyView';
import StatsView from '../components/calendar/StatsView';
import CalendarSettings from '../components/calendar/CalendarSettings';
import CalendarNavigation from './components/CalendarNavigation';
import { useCalendarContext } from '../context/CalendarContext';
import AuthGuard from '../components/AuthGuard';

// טיפוסים
type CalendarView = 'daily' | 'weekly' | 'monthly' | 'stats' | 'settings' | 'timeline';

export default function CalendarPage() {
  const [selectedView, setSelectedView] = useState<CalendarView>('daily');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddEventModal, setShowAddEventModal] = useState<boolean>(false);
  
  const {
    events,
    categories,
    isLoading,
    updateCategories,
    updateEvents
  } = useCalendarContext();

  // פונקציה שמשנה את התאריך ועוברת לתצוגה יומית
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    // אם נמצאים בתצוגה החודשית ולוחצים על יום, עוברים לתצוגה יומית
    if (selectedView === 'monthly') {
      setSelectedView('daily');
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="p-8 text-center">טוען...</div>;
    }
    
    switch (selectedView) {
      case 'daily':
        return (
          <DailyView 
            date={selectedDate} 
            onDateChange={handleDateChange}
            events={events}
            onEventsUpdate={updateEvents}
            categories={categories}
          />
        );
      case 'weekly':
        return (
          <WeeklyView
            date={selectedDate}
            onDateChange={handleDateChange}
            events={events}
            onEventsUpdate={updateEvents}
            categories={categories}
          />
        );
      case 'monthly':
        return (
          <MonthlyView
            date={selectedDate}
            onDateChange={handleDateChange}
          />
        );
      case 'timeline':
        return null;
      case 'stats':
        return (
          <StatsView
            events={events}
            period="month"
            startDate={new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)}
          />
        );
      case 'settings':
        return (
          <CalendarSettings
            categories={categories}
            onUpdateCategories={updateCategories}
          />
        );
      default:
        return null;
    }
  };
  
  // טיפול בלחיצה על כפתור "אירוע חדש"
  const handleAddEvent = () => {
    setShowAddEventModal(true);
    alert('הוספת אירוע חדש - פונקציונליות זו תיושם בהמשך');
  };

  return (
    <AuthGuard>
      <div className="container p-4">
        <h1 className="text-2xl font-bold mb-6">לוח שנה</h1>
        
        <CalendarNavigation 
          selectedView={selectedView}
          selectedDate={selectedDate}
          onViewChange={setSelectedView}
        />
        
        {renderContent()}
      </div>
    </AuthGuard>
  );
} 