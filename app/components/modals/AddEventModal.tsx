'use client';

import { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiClock, FiTag, FiGrid, FiList, FiImage } from 'react-icons/fi';
import { format } from 'date-fns';
import { EventCategory, CalendarEvent } from '../../types';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, 'id'>) => void;
  selectedDate: Date;
  categories: EventCategory[];
  defaultStartTime?: string;
  defaultEndTime?: string;
  defaultDescription?: string;
  defaultCategoryId?: string;
  editEvent?: CalendarEvent | null;
}

const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  selectedDate,
  categories,
  defaultStartTime,
  defaultEndTime,
  defaultDescription,
  defaultCategoryId,
  editEvent
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  
  const [weight, setWeight] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  
  // מעקב אחרי אילו שדות חושבו אוטומטית
  const [autoCalculated, setAutoCalculated] = useState<{
    distance: boolean;
    speed: boolean;
    duration: boolean;
  }>({
    distance: false,
    speed: false,
    duration: false
  });
  
  useEffect(() => {
    if (isOpen) {
      if (editEvent) {
        setTitle(editEvent.title || '');
        setDescription(editEvent.description || '');
        setImageUrl(editEvent.imageUrl || '');
        
        const startHour = editEvent.start.getHours().toString().padStart(2, '0');
        const startMinute = editEvent.start.getMinutes().toString().padStart(2, '0');
        setStartTime(`${startHour}:${startMinute}`);
        
        const endHour = editEvent.end.getHours().toString().padStart(2, '0');
        const endMinute = editEvent.end.getMinutes().toString().padStart(2, '0');
        setEndTime(`${endHour}:${endMinute}`);
        
        setCategoryId(editEvent.categoryId || '');
        
        setWeight(editEvent.weight !== undefined ? editEvent.weight : null);
        setDistance(editEvent.distance !== undefined ? editEvent.distance : null);
        setSpeed(editEvent.speed !== undefined ? editEvent.speed : null);
        setDuration(editEvent.duration !== undefined ? editEvent.duration : null);
      } else {
        const now = new Date();
        const hour = now.getHours().toString().padStart(2, '0');
        const nextHour = (now.getHours() + 1).toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        
        setTitle(defaultDescription || '');
        setDescription('');
        setImageUrl('');
        setStartTime(defaultStartTime || `${hour}:${minutes}`);
        setEndTime(defaultEndTime || `${nextHour}:${minutes}`);
        setCategoryId(defaultCategoryId || '');
        
        setWeight(null);
        setDistance(null);
        setSpeed(null);
        setDuration(null);
      }
    }
  }, [isOpen, defaultDescription, defaultStartTime, defaultEndTime, defaultCategoryId, editEvent]);
  
  useEffect(() => {
    if (description && categories.length > 0) {
      const desc = description.toLowerCase();
      const matchedCategory = categories.find(category => 
        category.keywords?.some(keyword => keyword && desc.includes(keyword.toLowerCase()))
      );
      
      if (matchedCategory) {
        setCategoryId(matchedCategory.id);
      }
    }
  }, [description, categories]);
  
  // סנכרון בין שדות ההליכון - חישוב אוטומטי של השדה השלישי
  useEffect(() => {
    // רק אם זו פעילות הליכון
    if (categoryId === 'treadmill' || title.toLowerCase().includes('הליכון')) {
      // אם יש זמן ומהירות, נחשב מרחק
      if (duration !== null && speed !== null && (distance === null || distance === 0)) {
        // מרחק = זמן (בשעות) * מהירות (קמ"ש)
        const durationInHours = duration / 60;
        const calculatedDistance = parseFloat((durationInHours * speed).toFixed(2));
        setDistance(calculatedDistance);
        setAutoCalculated(prev => ({ ...prev, distance: true, speed: false, duration: false }));
      } 
      // אם יש מרחק ומהירות, נחשב זמן
      else if (distance !== null && speed !== null && (duration === null || duration === 0) && speed > 0) {
        // זמן (בדקות) = (מרחק / מהירות) * 60
        const calculatedDuration = Math.round((distance / speed) * 60);
        setDuration(calculatedDuration);
        setAutoCalculated(prev => ({ ...prev, distance: false, speed: false, duration: true }));
      }
      // אם יש מרחק וזמן, נחשב מהירות
      else if (distance !== null && duration !== null && duration > 0 && (speed === null || speed === 0)) {
        // מהירות = מרחק / זמן (בשעות)
        const durationInHours = duration / 60;
        const calculatedSpeed = parseFloat((distance / durationInHours).toFixed(2));
        setSpeed(calculatedSpeed);
        setAutoCalculated(prev => ({ ...prev, distance: false, speed: true, duration: false }));
      }
    }
  }, [duration, speed, distance, categoryId, title]);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // בפרויקט אמיתי, כאן היינו מעלים את התמונה לשרת
      // כרגע נשתמש ב-URL.createObjectURL לתצוגה מקומית
      const objectUrl = URL.createObjectURL(file);
      setImageUrl(objectUrl);
    }
  };
  
  const handleSave = () => {
    if (!title.trim()) {
      alert('יש להזין כותרת לאירוע');
      return;
    }
    
    const [startHour, startMinutes] = startTime.split(':').map(Number);
    const [endHour, endMinutes] = endTime.split(':').map(Number);
    
    const startDate = new Date(selectedDate);
    startDate.setHours(startHour, startMinutes, 0, 0);
    
    const endDate = new Date(selectedDate);
    endDate.setHours(endHour, endMinutes, 0, 0);
    
    if (endDate < startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }
    
    const category = categories.find(c => c.id === categoryId);
    const isWakeUp = category?.id === 'wakeup' || title.toLowerCase().includes('השכמה');
    const isTreadmill = category?.id === 'treadmill' || title.toLowerCase().includes('הליכון');
    
    const newEvent: Omit<CalendarEvent, 'id'> = {
      title: title.trim(),
      start: startDate,
      end: endDate,
      categoryId: categoryId || 'general',
      description: description.trim() || undefined,
      imageUrl: imageUrl || undefined
    };
    
    if (isWakeUp) {
      newEvent.isWakeUp = true;
      if (weight !== null) newEvent.weight = weight;
    }
    
    if (isTreadmill) {
      newEvent.isTreadmill = true;
      if (distance !== null) newEvent.distance = distance;
      if (speed !== null) newEvent.speed = speed;
      if (duration !== null) newEvent.duration = duration;
    }
    
    onSave(newEvent);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isOpen ? '' : 'hidden'}`}>
      <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {editEvent ? 'עריכת אירוע' : 'אירוע חדש'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              כותרת
            </label>
            <input
              type="text"
              id="title"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="הוסף כותרת לאירוע"
              autoFocus
            />
          </div>
          
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
              תמונה
            </label>
            <div className="flex items-center space-x-4 space-x-reverse">
              <input
                type="file"
                id="image"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              <label
                htmlFor="image"
                className="cursor-pointer bg-primary-50 text-primary-700 px-4 py-2 rounded-md flex items-center"
              >
                <FiImage className="ml-2" />
                {imageUrl ? 'החלף תמונה' : 'הוסף תמונה'}
              </label>
              {imageUrl && (
                <button
                  type="button"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => setImageUrl('')}
                >
                  הסר
                </button>
              )}
            </div>
            {imageUrl && (
              <div className="mt-2">
                <img src={imageUrl} alt="תמונת אירוע" className="w-full max-h-40 object-contain rounded-md" />
              </div>
            )}
          </div>
          
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FiCalendar className="ml-1" />
              תאריך
            </label>
            <input
              type="text"
              id="date"
              value={format(selectedDate, 'dd/MM/yyyy')}
              readOnly
              className="block w-full py-2 px-3 border bg-gray-100 rounded-md"
            />
          </div>
          
          <div>
            <label htmlFor="eventDescription" className="block text-sm font-medium text-gray-700 mb-1">
              תיאור מורחב (אופציונלי)
            </label>
            <textarea
              id="eventDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 resize-none"
              placeholder="הוסף פרטים נוספים על האירוע"
              dir="rtl"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <FiClock className="ml-1" />
                שעת התחלה
              </label>
              <input
                type="time"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="block w-full py-2 px-3 border rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <FiClock className="ml-1" />
                שעת סיום
              </label>
              <input
                type="time"
                id="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="block w-full py-2 px-3 border rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center">
                <FiTag className="ml-1" />
                קטגוריה
              </label>
            </div>
            
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="" disabled>בחר קטגוריה</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap gap-2 mt-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setCategoryId(category.id)}
                  className={`py-1 px-2 rounded-full text-sm flex items-center ${
                    categoryId === category.id
                      ? 'ring-2 ring-primary-500' 
                      : 'hover:bg-gray-100'
                  }`}
                  style={{
                    backgroundColor: categoryId === category.id ? `${category.color}20` : '',
                    color: category.id === categoryId ? category.color : ''
                  }}
                >
                  <span className="mr-1">{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>
          
          {(categoryId === 'wakeup' || title.toLowerCase().includes('השכמה')) && (
            <div className="p-3 bg-yellow-50 rounded-md">
              <h3 className="font-medium mb-2 flex items-center">
                <span className="ml-2">🌞</span>
                פרטי השכמה
              </h3>
              <div>
                <label htmlFor="weightInput" className="block text-sm font-medium text-gray-700 mb-1">
                  משקל בבוקר (ק"ג)
                </label>
                <input
                  type="number"
                  id="weightInput"
                  value={weight !== null ? weight : ''}
                  onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : null)}
                  step="0.1"
                  min="30"
                  max="200"
                  className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="לדוגמה: 70.5"
                />
              </div>
            </div>
          )}
          
          {(categoryId === 'treadmill' || title.toLowerCase().includes('הליכון')) && (
            <div className="p-3 bg-green-50 rounded-md">
              <h3 className="font-medium mb-2 flex items-center">
                <span className="ml-2">🏃</span>
                פרטי הליכון
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor="durationInput" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    זמן (דקות)
                    {autoCalculated.duration && (
                      <span className="mr-1 text-xs bg-green-100 text-green-800 px-1 rounded">אוטומטי</span>
                    )}
                  </label>
                  <input
                    type="number"
                    id="durationInput"
                    value={duration !== null ? duration : ''}
                    onChange={(e) => {
                      setDuration(e.target.value ? Number(e.target.value) : null);
                      setAutoCalculated(prev => ({ ...prev, duration: false }));
                    }}
                    min="1"
                    max="300"
                    className={`block w-full py-2 px-3 border ${
                      autoCalculated.duration 
                        ? 'bg-green-50 border-green-300' 
                        : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                    placeholder="לדוגמה: 30"
                  />
                </div>
                <div>
                  <label htmlFor="speedInput" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    מהירות (קמ"ש)
                    {autoCalculated.speed && (
                      <span className="mr-1 text-xs bg-green-100 text-green-800 px-1 rounded">אוטומטי</span>
                    )}
                  </label>
                  <input
                    type="number"
                    id="speedInput"
                    value={speed !== null ? speed : ''}
                    onChange={(e) => {
                      setSpeed(e.target.value ? Number(e.target.value) : null);
                      setAutoCalculated(prev => ({ ...prev, speed: false }));
                    }}
                    step="0.1"
                    min="0.1"
                    max="30"
                    className={`block w-full py-2 px-3 border ${
                      autoCalculated.speed 
                        ? 'bg-green-50 border-green-300' 
                        : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                    placeholder="לדוגמה: 5.5"
                  />
                </div>
                <div>
                  <label htmlFor="distanceInput" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    מרחק (ק"מ)
                    {autoCalculated.distance && (
                      <span className="mr-1 text-xs bg-green-100 text-green-800 px-1 rounded">אוטומטי</span>
                    )}
                  </label>
                  <input
                    type="number"
                    id="distanceInput"
                    value={distance !== null ? distance : ''}
                    onChange={(e) => {
                      setDistance(e.target.value ? Number(e.target.value) : null);
                      setAutoCalculated(prev => ({ ...prev, distance: false }));
                    }}
                    step="0.1"
                    min="0.1"
                    max="100"
                    className={`block w-full py-2 px-3 border ${
                      autoCalculated.distance 
                        ? 'bg-green-50 border-green-300' 
                        : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                    placeholder="לדוגמה: 2.5"
                  />
                </div>
              </div>
              
              <div className="mt-2 text-sm text-gray-600 bg-white p-2 rounded-md border border-green-100">
                <p className="flex items-center">
                  <span className="ml-1">💡</span>
                  <strong>חישוב אוטומטי:</strong> מלא רק 2 שדות והשדה השלישי יחושב עבורך!
                </p>
                <ul className="mr-5 mt-1 text-xs list-disc space-y-1">
                  <li>
                    <strong>זמן + מהירות</strong> = מרחק 
                    <span className="text-gray-500 mr-1">(לדוגמה: 30 דקות במהירות 5 קמ"ש = 2.5 ק"מ)</span>
                  </li>
                  <li>
                    <strong>מרחק + זמן</strong> = מהירות 
                    <span className="text-gray-500 mr-1">(לדוגמה: 2.5 ק"מ במשך 30 דקות = 5 קמ"ש)</span>
                  </li>
                  <li>
                    <strong>מרחק + מהירות</strong> = זמן 
                    <span className="text-gray-500 mr-1">(לדוגמה: 2.5 ק"מ במהירות 5 קמ"ש = 30 דקות)</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={!title || !startTime || !endTime}
              className={`px-4 py-2 rounded-md ${
                !title || !startTime || !endTime
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-500 text-white hover:bg-primary-600'
              }`}
            >
              שמור
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEventModal; 