'use client';

import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

// רישום כל האלמנטים הנדרשים של Chart.js
Chart.register(...registerables);

interface BalanceChartProps {
  data: { date: string; balance: number }[];
}

const BalanceChart: React.FC<BalanceChartProps> = ({ data }) => {
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
    const labels = data.map(item => formatDate(item.date));
    const values = data.map(item => item.balance);

    // יצירת הגרף החדש
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'מצב הון',
            data: values,
            backgroundColor: 'rgba(14, 165, 233, 0.2)',
            borderColor: 'rgba(14, 165, 233, 1)',
            borderWidth: 2,
            fill: 'start',
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: 'rgba(14, 165, 233, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 1.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                label += '₪' + context.parsed.y.toLocaleString();
                return label;
              }
            }
          },
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 7,
            },
          },
          y: {
            beginAtZero: false,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              callback: function(value) {
                return '₪' + value.toLocaleString();
              },
            },
          },
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false,
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  // המרת התאריך לפורמט נוח יותר
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  return (
    <div className="w-full h-full">
      <canvas ref={chartRef} />
    </div>
  );
};

export default BalanceChart; 