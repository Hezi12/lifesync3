'use client';

import { useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface TransactionChartProps {
  data: ChartData[];
}

const TransactionChart = ({ data }: TransactionChartProps) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        אין נתונים להצגה
      </div>
    );
  }

  // עיגול של הסכומים לספרות עשרוניות נחוצות
  const formattedData = data.map(item => ({
    ...item,
    value: Math.round(item.value * 100) / 100
  }));

  // חישוב הסכום הכולל עבור הצגת אחוזים
  const total = formattedData.reduce((sum, item) => sum + item.value, 0);

  // פורמטר מותאם אישית לתווית
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ 
    cx, 
    cy, 
    midAngle, 
    innerRadius, 
    outerRadius, 
    percent 
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 shadow-md border rounded-md">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm">{payload[0].value.toLocaleString()} ₪</p>
          <p className="text-xs text-gray-500">
            {((payload[0].value / total) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={formattedData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {formattedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          layout="vertical" 
          verticalAlign="middle" 
          align="left"
          formatter={(value, entry, index) => {
            const item = formattedData[index];
            return (
              <span className="text-gray-800 text-sm">
                {value} ({((item.value / total) * 100).toFixed(1)}%)
              </span>
            );
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default TransactionChart; 