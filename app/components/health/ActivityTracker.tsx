'use client';

import { useState } from 'react';
import { FiPlusCircle, FiEdit, FiTrash2, FiActivity, FiClock, FiMapPin } from 'react-icons/fi';
import { PhysicalActivity } from '../../types';
import { useHealthContext } from '../../context/HealthContext';
import { motion } from 'framer-motion';
import Modal from '../Modal';

const ActivityTracker = () => {
  const { 
    activities, 
    addActivity, 
    updateActivity, 
    deleteActivity,
    isLoading
  } = useHealthContext();
  
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [editingActivity, setEditingActivity] = useState<PhysicalActivity | null>(null);
  
  // מצבים לטופס הוספת פעילות
  const [newActivityType, setNewActivityType] = useState('הליכון');
  const [newActivityDuration, setNewActivityDuration] = useState('');
  const [newActivityDistance, setNewActivityDistance] = useState('');
  const [newActivityDate, setNewActivityDate] = useState(new Date().toISOString().split('T')[0]);
  
  // הכנת רשימת סוגי הפעילויות
  const activityTypes = ['הליכון', 'ריצה', 'הליכה', 'שחייה', 'אופניים', 'כדורסל', 'אימון כוח', 'יוגה', 'אחר'];
  
  // פתיחת טופס עריכה
  const openEditForm = (activity: PhysicalActivity) => {
    setEditingActivity(activity);
    setNewActivityType(activity.type);
    setNewActivityDuration(activity.duration.toString());
    setNewActivityDistance(activity.distance ? activity.distance.toString() : '');
    setNewActivityDate(activity.date.toISOString().split('T')[0]);
    setIsAddingActivity(true);
  };
  
  // הוספת פעילות גופנית חדשה
  const handleAddActivity = () => {
    if (
      !newActivityType || 
      !newActivityDuration || 
      isNaN(Number(newActivityDuration)) || 
      Number(newActivityDuration) <= 0 ||
      !newActivityDate
    ) return;
    
    // המרת משך לדקות
    const duration = Number(newActivityDuration);
    
    // חישוב מהירות אם הוזן מרחק
    let distance = undefined;
    let speed = undefined;
    
    if (newActivityDistance && !isNaN(Number(newActivityDistance)) && Number(newActivityDistance) > 0) {
      distance = parseFloat(Number(newActivityDistance).toFixed(1));
      speed = distance / (duration / 60); // מהירות בקמ"ש
    }
    
    if (editingActivity) {
      // עדכון פעילות קיימת
      updateActivity({
        ...editingActivity,
        type: newActivityType,
        duration,
        distance,
        speed,
        date: new Date(newActivityDate)
      });
    } else {
      // הוספת פעילות חדשה
      addActivity({
        date: new Date(newActivityDate),
        type: newActivityType,
        duration,
        distance,
        speed
      });
    }
    
    // איפוס הטופס
    resetForm();
  };
  
  // איפוס הטופס
  const resetForm = () => {
    setNewActivityType('הליכון');
    setNewActivityDuration('');
    setNewActivityDistance('');
    setNewActivityDate(new Date().toISOString().split('T')[0]);
    setIsAddingActivity(false);
    setEditingActivity(null);
  };
  
  // חישוב סטטיסטיקות
  const calculateStats = () => {
    if (activities.length === 0) {
      return {
        totalActivities: 0,
        totalDuration: 0,
        totalDistance: 0,
        averageSpeed: 0,
        typeBreakdown: {}
      };
    }
    
    // חישוב סך כל המשך והמרחק
    let totalDuration = 0;
    let totalDistanceWithSpeed = 0;
    let activitiesWithSpeed = 0;
    
    // מיפוי פעילויות לפי סוג
    const typeMap: Record<string, { count: number, duration: number, distance: number }> = {};
    
    activities.forEach(activity => {
      totalDuration += activity.duration;
      
      if (activity.distance) {
        totalDistanceWithSpeed += activity.distance;
        activitiesWithSpeed++;
      }
      
      // עדכון מיפוי סוגי פעילויות
      if (!typeMap[activity.type]) {
        typeMap[activity.type] = { count: 0, duration: 0, distance: 0 };
      }
      
      typeMap[activity.type].count++;
      typeMap[activity.type].duration += activity.duration;
      if (activity.distance) {
        typeMap[activity.type].distance += activity.distance;
      }
    });
    
    // חישוב מהירות ממוצעת (רק על פעילויות עם מרחק)
    const averageSpeed = activitiesWithSpeed > 0 
      ? totalDistanceWithSpeed / (totalDuration / 60 * (activitiesWithSpeed / activities.length))
      : 0;
    
    return {
      totalActivities: activities.length,
      totalDuration,
      totalDistance: totalDistanceWithSpeed,
      averageSpeed,
      typeBreakdown: typeMap
    };
  };
  
  const stats = calculateStats();
  
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours} שעות ${mins > 0 ? `ו-${mins} דקות` : ''}`;
    }
    
    return `${mins} דקות`;
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-xl text-gray-500">טוען נתונים...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* כרטיס סטטיסטיקה */}
        <motion.div
          className="bg-white rounded-xl p-3 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-green-200 via-blue-200 to-purple-200"></div>
          
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <span className="w-9 h-9 flex items-center justify-center bg-green-500 rounded-full mr-4 text-white shadow-sm">
                <FiActivity className="text-lg" />
              </span>
              סיכום פעילות
            </h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAddingActivity(true)}
              className="w-9 h-9 flex items-center justify-center bg-green-500 rounded-full text-white shadow-sm hover:bg-green-600 transition-colors"
            >
              <FiPlusCircle size={18} />
            </motion.button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">סך פעילויות</div>
              <div className="text-xl font-bold">{stats.totalActivities}</div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">סך זמן</div>
              <div className="text-xl font-bold">{formatDuration(stats.totalDuration)}</div>
            </div>
            
            {stats.totalDistance > 0 && (
              <>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">סך מרחק</div>
                  <div className="text-xl font-bold">{stats.totalDistance.toFixed(1)} ק"מ</div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">מהירות ממוצעת</div>
                  <div className="text-xl font-bold">{stats.averageSpeed.toFixed(1)} קמ"ש</div>
                </div>
              </>
            )}
          </div>
          
          {activities.length > 0 && (
            <div className="mt-4">
              <h4 className="text-md font-medium text-gray-700 mb-2">התפלגות לפי סוג פעילות</h4>
              <div className="space-y-2">
                {Object.entries(stats.typeBreakdown).map(([type, data]) => (
                  <div key={type} className="flex justify-between bg-gray-50 p-2 rounded-lg">
                    <span className="font-medium">{type}</span>
                    <span className="text-gray-500">{data.count} פעילויות ({formatDuration(data.duration)})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
        
        {/* מידע על פעילות אחרונה */}
        <motion.div
          className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200"></div>
          
          <h3 className="text-lg font-bold text-gray-800 mb-4">פעילויות אחרונות</h3>
          
          <div className="max-h-[260px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {activities.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <p>אין פעילויות גופניות להצגה.</p>
                <button
                  onClick={() => setIsAddingActivity(true)}
                  className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  הוסף פעילות ראשונה
                </button>
              </div>
            ) : (
              [...activities].reverse().slice(0, 5).map((activity) => (
                <div 
                  key={activity.id} 
                  className="p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className={`w-8 h-8 flex items-center justify-center rounded-full mr-3 ${
                        activity.type === 'הליכון' ? 'bg-blue-100 text-blue-600' :
                        activity.type === 'ריצה' ? 'bg-green-100 text-green-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        <FiActivity />
                      </span>
                      <div>
                        <div className="font-medium">{activity.type}</div>
                        <div className="text-sm text-gray-500">
                          {formatDate(activity.date)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 space-x-reverse">
                      {!activity.fromCalendar && (
                        <button 
                          onClick={() => openEditForm(activity)}
                          className="p-1.5 text-blue-500 hover:text-blue-600"
                          title="ערוך"
                        >
                          <FiEdit size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => deleteActivity(activity.id)}
                        className="p-1.5 text-red-500 hover:text-red-600"
                        title="מחק"
                        disabled={activity.fromCalendar}
                      >
                        <FiTrash2 size={16} className={activity.fromCalendar ? 'opacity-30' : ''} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex flex-wrap gap-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <FiClock className="ml-1" />
                      <span>{formatDuration(activity.duration)}</span>
                    </div>
                    
                    {activity.distance && (
                      <div className="flex items-center text-sm text-gray-600">
                        <FiMapPin className="ml-1" />
                        <span>{activity.distance.toFixed(1)} ק"מ</span>
                      </div>
                    )}
                    
                    {activity.speed && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="ml-1">⚡</span>
                        <span>{activity.speed.toFixed(1)} קמ"ש</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
      
      {/* טבלת פעילויות */}
      <motion.div
        className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-purple-200 via-pink-200 to-red-200"></div>
        
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">כל הפעילויות</h3>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddingActivity(true)}
            className="px-3 py-1 text-sm bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors flex items-center"
          >
            <FiPlusCircle size={14} className="ml-1" />
            <span>הוסף פעילות</span>
          </motion.button>
        </div>
        
        {activities.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="text-xs uppercase bg-gray-50 rounded-lg">
                <tr>
                  <th className="px-4 py-2 font-medium text-gray-500">תאריך</th>
                  <th className="px-4 py-2 font-medium text-gray-500">סוג</th>
                  <th className="px-4 py-2 font-medium text-gray-500">משך</th>
                  <th className="px-4 py-2 font-medium text-gray-500">מרחק</th>
                  <th className="px-4 py-2 font-medium text-gray-500">מהירות</th>
                  <th className="px-4 py-2 font-medium text-gray-500">מקור</th>
                  <th className="px-4 py-2 font-medium text-gray-500">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {[...activities].reverse().map((activity) => (
                  <tr key={activity.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {formatDate(activity.date)}
                    </td>
                    <td className="px-4 py-3">{activity.type}</td>
                    <td className="px-4 py-3">{formatDuration(activity.duration)}</td>
                    <td className="px-4 py-3">
                      {activity.distance ? `${activity.distance.toFixed(1)} ק"מ` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {activity.speed ? `${activity.speed.toFixed(1)} קמ"ש` : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {activity.fromCalendar ? 'לוח שנה' : 'ידני'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2 space-x-reverse">
                        {!activity.fromCalendar && (
                          <button 
                            onClick={() => openEditForm(activity)}
                            className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                            title="ערוך"
                          >
                            <FiEdit size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => deleteActivity(activity.id)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                          title="מחק"
                          disabled={activity.fromCalendar}
                        >
                          <FiTrash2 size={16} className={activity.fromCalendar ? 'opacity-30' : ''} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>אין פעילויות גופניות להצגה.</p>
            <button
              onClick={() => setIsAddingActivity(true)}
              className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              הוסף פעילות ראשונה
            </button>
          </div>
        )}
      </motion.div>
      
      {/* מודאל להוספת פעילות */}
      <Modal
        isOpen={isAddingActivity}
        onClose={resetForm}
        title={editingActivity ? "עריכת פעילות גופנית" : "הוספת פעילות גופנית"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תאריך</label>
            <input
              type="date"
              value={newActivityDate}
              onChange={(e) => setNewActivityDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סוג פעילות</label>
            <select
              value={newActivityType}
              onChange={(e) => setNewActivityType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {activityTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">משך זמן (דקות)</label>
            <input
              type="number"
              value={newActivityDuration}
              onChange={(e) => setNewActivityDuration(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="לדוגמה: 30"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              מרחק (ק"מ) - אופציונלי
            </label>
            <input
              type="number"
              step="0.1"
              value={newActivityDistance}
              onChange={(e) => setNewActivityDistance(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="לדוגמה: 2.5"
            />
          </div>
          
          {newActivityDuration && newActivityDistance && !isNaN(Number(newActivityDuration)) && !isNaN(Number(newActivityDistance)) && (
            <div className="p-3 bg-blue-50 rounded-md">
              <div className="text-sm text-blue-700 mb-1">מהירות מחושבת:</div>
              <div className="font-bold text-blue-800">
                {(Number(newActivityDistance) / (Number(newActivityDuration) / 60)).toFixed(1)} קמ"ש
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-4 space-x-reverse pt-2">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              ביטול
            </button>
            
            <button
              onClick={handleAddActivity}
              className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
              disabled={
                !newActivityType || 
                !newActivityDuration || 
                isNaN(Number(newActivityDuration)) || 
                Number(newActivityDuration) <= 0
              }
            >
              {editingActivity ? "עדכן" : "הוסף"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ActivityTracker; 