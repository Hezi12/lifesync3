'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Legend } from 'recharts';
import { WeightRecord, WeightGoal } from '../../types';

interface WeightChartProps {
  weightRecords: WeightRecord[];
  weightGoal: WeightGoal | null;
}

const WeightChart = ({ weightRecords, weightGoal }: WeightChartProps) => {
  // עיבוד הנתונים לגרף
  const chartData = useMemo(() => {
    if (weightRecords.length === 0) return [];
    
    return weightRecords.map(record => ({
      date: record.date.toLocaleDateString('he-IL', { month: 'short', day: 'numeric' }),
      weight: record.weight,
      // נוסיף את תאריך הרשומה כ-timestamp למיון
      timestamp: record.date.getTime()
    }));
  }, [weightRecords]);
  
  // מציאת טווח המשקל המינימלי והמקסימלי לתצוגת הגרף
  const yDomain = useMemo(() => {
    if (weightRecords.length === 0) return [60, 90]; // ערכי ברירת מחדל
    
    let min = Math.min(...weightRecords.map(r => r.weight));
    let max = Math.max(...weightRecords.map(r => r.weight));
    
    // הוספת יעד המשקל אם קיים
    if (weightGoal) {
      min = Math.min(min, weightGoal.targetWeight);
      max = Math.max(max, weightGoal.startWeight);
    }
    
    // הוספת שוליים
    min = Math.floor(min - 1);
    max = Math.ceil(max + 1);
    
    return [min, max];
  }, [weightRecords, weightGoal]);
  
  // פורמטר לכיתוב על ציר ה-Y
  const formatYAxis = (value: number) => `${value} ק"ג`;
  
  // פורמטר לטקסט בתיבת המידע
  const renderTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-md rounded-md border border-gray-200 text-right">
          <p className="font-medium">{label}</p>
          <p className="text-primary-500 font-bold">
            {payload[0].value} ק"ג
          </p>
        </div>
      );
    }
    return null;
  };
  
  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">אין נתוני משקל להצגה</p>
      </div>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          axisLine={true}
          tickLine={true}
          padding={{ left: 10, right: 10 }}
        />
        <YAxis 
          domain={yDomain}
          tickFormatter={formatYAxis}
          width={60}
          orientation="right"
        />
        <Tooltip content={renderTooltip} />
        <Legend verticalAlign="top" height={36} />
        
        {/* קו הנתונים */}
        <Line
          type="monotone"
          dataKey="weight"
          stroke="#3B82F6"
          strokeWidth={2}
          dot={{ r: 4, strokeWidth: 2 }}
          activeDot={{ r: 6 }}
          name="משקל"
        />
        
        {/* הצגת קו היעד אם קיים */}
        {weightGoal && (
          <ReferenceLine
            y={weightGoal.targetWeight}
            stroke="#8B5CF6"
            strokeDasharray="3 3"
            strokeWidth={2}
            label={{
              position: 'left',
              value: `יעד: ${weightGoal.targetWeight} ק"ג`,
              fill: '#8B5CF6',
              fontSize: 12
            }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default WeightChart; 