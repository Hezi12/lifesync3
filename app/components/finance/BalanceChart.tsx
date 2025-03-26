'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

interface BalanceChartProps {
  data: {
    date: string;
    balance: number;
  }[];
}

const BalanceChart = ({ data }: BalanceChartProps) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        אין נתונים להצגה
      </div>
    );
  }

  // עיצוב נתונים לתצוגה בגרף
  const chartData = data.map((item) => ({
    name: formatDate(item.date),
    יתרה: item.balance,
    date: item.date // שומר את התאריך המקורי לטולטיפ
  }));

  // פונקציה לפורמט תאריך בצורה מקוצרת
  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  }

  // חישוב ערכים מינימליים ומקסימליים לציר Y
  const minBalance = Math.min(...data.map(item => item.balance));
  const maxBalance = Math.max(...data.map(item => item.balance));
  
  // מחשב את המרווח בין ערכי הציר Y
  const range = maxBalance - minBalance;
  const padding = range * 0.1; // 10% מהטווח כריפוד
  
  const yMin = minBalance - padding;
  const yMax = maxBalance + padding;

  // טולטיפ מותאם אישית
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dateObj = new Date(payload[0].payload.date);
      const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
      
      return (
        <div className="bg-white p-3 shadow-md border rounded-md">
          <p className="font-medium">{formattedDate}</p>
          <p className={`text-lg ${payload[0].value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {payload[0].value.toLocaleString()} ₪
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart
        data={chartData}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <defs>
          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#E5E7EB' }}
          dy={10}
        />
        <YAxis 
          tickFormatter={(value) => `${value.toLocaleString()}`}
          domain={[yMin, yMax]}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#E5E7EB' }}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="יתרה"
          stroke="#0ea5e9"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorBalance)"
          activeDot={{ r: 8 }}
          isAnimationActive={true}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default BalanceChart; 