import { EventCategory } from '../types/index';

// קטגוריות ברירת מחדל
export const defaultCategories: EventCategory[] = [
  {
    id: 'wakeup',
    name: 'השכמה',
    icon: '🌞',
    color: '#eab308',
    isDefault: true,
    keywords: ['השכמה', 'קימה', 'התעוררות', 'בוקר']
  },
  {
    id: 'treadmill',
    name: 'הליכון',
    icon: '🏃',
    color: '#22c55e',
    isDefault: true,
    keywords: ['הליכון', 'ריצה', 'הליכה']
  },
  {
    id: 'work',
    name: 'עבודה',
    icon: '💼',
    color: '#0ea5e9',
    isDefault: true,
    keywords: ['עבודה', 'משרד', 'פגישת עבודה', 'שיחת עבודה']
  },
  {
    id: 'meal',
    name: 'ארוחה',
    icon: '🍔',
    color: '#f97316',
    isDefault: true,
    keywords: ['ארוחה', 'אוכל', 'ארוחת בוקר', 'ארוחת צהריים', 'ארוחת ערב']
  },
  {
    id: 'sleep',
    name: 'שינה',
    icon: '🛌',
    color: '#8b5cf6',
    isDefault: true,
    keywords: ['שינה', 'לישון', 'מנוחה']
  },
  {
    id: 'computer',
    name: 'מחשב',
    icon: '💻',
    color: '#0891b2',
    isDefault: true,
    keywords: ['מחשב', 'קוד', 'תכנות', 'מחשבים']
  },
  {
    id: 'shower',
    name: 'מקלחת',
    icon: '🚿',
    color: '#38bdf8',
    isDefault: true,
    keywords: ['מקלחת', 'רחצה', 'התרעננות']
  },
  {
    id: 'tv',
    name: 'צפייה',
    icon: '📺',
    color: '#7e22ce',
    isDefault: true,
    keywords: ['צפייה', 'טלויזיה', 'סרט', 'סדרה', 'טי.וי']
  },
  {
    id: 'tasks',
    name: 'משימות',
    icon: '📋',
    color: '#be185d',
    isDefault: true,
    keywords: ['משימות', 'תכנון', 'משימה', 'תכנון משימות']
  },
  {
    id: 'general',
    name: 'כללי',
    icon: '📅',
    color: '#64748b',
    isDefault: true,
    keywords: []
  }
]; 