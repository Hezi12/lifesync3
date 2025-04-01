'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { motion } from 'framer-motion';

type TimeRangeType = 'week' | 'month' | 'last30' | 'prevMonth';

interface BalanceChartProps {
  data: {
    date: string;
    balance: number;
  }[];
  period?: TimeRangeType;
}

const BalanceChart = ({ data, period = 'last30' }: BalanceChartProps) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        אין נתונים להצגה
      </div>
    );
  }

  // עיצוב נתונים לתצוגה בגרף
  const chartData = data.map((item) => ({
    name: formatDate(item.date, period),
    יתרה: item.balance,
    date: item.date // שומר את התאריך המקורי לטולטיפ
  }));

  // פונקציה לפורמט תאריך בצורה מקוצרת בהתאם לתקופה
  function formatDate(dateStr: string, periodType: TimeRangeType): string {
    const date = new Date(dateStr);
    
    switch (periodType) {
      case 'week':
        // הצג רק את היום בשבוע
        return date.toLocaleString('he-IL', { weekday: 'short' });
      case 'month':
      case 'last30':
        // הצג רק את היום בחודש
        return `${date.getDate()}/${date.getMonth() + 1}`;
      case 'prevMonth':
        // בחודש קודם הצג גם את היום בחודש
        return `${date.getDate()}`;
      default:
        return `${date.getDate()}/${date.getMonth() + 1}`;
    }
  }

  // חישוב ערכים מינימליים ומקסימליים לציר Y
  const minBalance = Math.min(...data.map(item => item.balance));
  const maxBalance = Math.max(...data.map(item => item.balance));
  
  // מחשב את המרווח בין ערכי הציר Y
  const range = maxBalance - minBalance;
  const padding = range * 0.15; // 15% מהטווח כריפוד
  
  const yMin = minBalance - padding;
  const yMax = maxBalance + padding;

  // חישוב ממוצע
  const averageBalance = data.reduce((sum, item) => sum + item.balance, 0) / data.length;

  // טולטיפ מותאם אישית
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dateObj = new Date(payload[0].payload.date);
      const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
      const value = payload[0].value;
      const isPositive = value >= 0;
      
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-4 shadow-lg border border-gray-100 rounded-lg"
        >
          <p className="font-medium text-gray-700 mb-1">{formattedDate}</p>
          <p className={`text-xl font-bold ${isPositive ? "text-green-600" : "text-red-500"}`}>
            {value.toLocaleString()} ₪
          </p>
          <div className="flex justify-between mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
            <span>יום {label}</span>
            <span>{isPositive ? 'חיובי' : 'שלילי'}</span>
          </div>
        </motion.div>
      );
    }
    return null;
  };

  // גרדיאנט דינמי לפי הערכים בגרף
  const getGradientColors = () => {
    if (maxBalance < 0) return { primary: '#f87171', secondary: '#fca5a5' }; // אדום
    if (minBalance < 0) return { primary: '#60a5fa', secondary: '#93c5fd' }; // כחול - חצי חיובי חצי שלילי
    return { primary: '#34d399', secondary: '#6ee7b7' }; // ירוק - חיובי בלבד
  };

  const gradientColors = getGradientColors();

  // הצגת x-axis בהתאם לתקופה
  const getXAxisTicks = () => {
    if (data.length <= 10) return undefined; // אם יש פחות מ-10 נקודות, תציג את כולן
    
    // אחרת, בחר נקודות מייצגות
    const indices: number[] = [];
    const step = Math.max(1, Math.floor(data.length / 5)); // מקסימום 5 נקודות
    
    for (let i = 0; i < data.length; i += step) {
      indices.push(i);
    }
    
    // הוסף תמיד את הנקודה האחרונה
    if (indices[indices.length - 1] !== data.length - 1) {
      indices.push(data.length - 1);
    }
    
    return indices;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="w-full h-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 0,
            bottom: 10,
          }}
        >
          <defs>
            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={gradientColors.primary} stopOpacity={0.8} />
              <stop offset="95%" stopColor={gradientColors.secondary} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke="#E5E7EB"
            strokeOpacity={0.7}
          />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
            dy={10}
            padding={{ left: 10, right: 10 }}
            ticks={getXAxisTicks()}
          />
          <YAxis 
            tickFormatter={(value) => `${value >= 1000 ? (value / 1000).toFixed(0) + 'K' : value}`}
            domain={[yMin, yMax]}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
            width={60}
          />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ stroke: '#94A3B8', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <ReferenceLine 
            y={0} 
            stroke="#CBD5E1" 
            strokeWidth={1.5}
          />
          <ReferenceLine 
            y={averageBalance} 
            stroke="#94A3B8" 
            strokeDasharray="3 3" 
            strokeWidth={1}
            label={{ 
              value: 'ממוצע', 
              position: 'right',
              fill: '#94A3B8',
              fontSize: 11
            }}
          />
          <Area
            type="monotone"
            dataKey="יתרה"
            stroke={gradientColors.primary}
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorBalance)"
            activeDot={{ 
              r: 8, 
              stroke: '#FFFFFF', 
              strokeWidth: 2,
              fill: gradientColors.primary
            }}
            isAnimationActive={true}
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default BalanceChart; 