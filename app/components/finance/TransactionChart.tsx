'use client';

import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

// רישום כל האלמנטים הנדרשים של Chart.js
Chart.register(...registerables);

interface ChartData {
  id: string;
  name: string;
  value: number;
  color: string;
}

interface TransactionChartProps {
  data: ChartData[];
}

const TransactionChart: React.FC<TransactionChartProps> = ({ data }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    // הרס הגרף הקודם אם קיים
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // עיבוד הנתונים לפורמט המתאים לגרף
    const labels = data.map(item => item.name);
    const values = data.map(item => item.value);
    const colors = data.map(item => item.color);

    // יצירת הגרף החדש - גרף עוגה
    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            borderColor: 'white',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            align: 'center',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.label || '';
                if (label) {
                  label += ': ';
                }
                const value = context.raw as number;
                label += '₪' + value.toLocaleString();
                
                // הוספת אחוז מסך הכל
                const total = (context.dataset.data as number[]).reduce(
                  (sum: number, val: number) => sum + val, 0
                );
                const percentage = Math.round((value / total) * 100);
                return `${label} (${percentage}%)`;
              }
            }
          },
        },
        cutout: '60%',
        animation: {
          animateRotate: true,
          animateScale: true
        }
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  // אם אין נתונים, הצג הודעה
  if (!data.length) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">אין נתונים להצגה</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <canvas ref={chartRef} />
    </div>
  );
};

export default TransactionChart; 