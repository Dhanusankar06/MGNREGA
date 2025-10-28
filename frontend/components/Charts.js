import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useIntl } from 'react-intl';
import { format, parseISO } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Time Series Chart for trends over months
export const TimeSeriesChart = ({ data, metric, title }) => {
  const intl = useIntl();

  const chartData = {
    labels: data.map(item => 
      format(new Date(item.year, item.month - 1), 'MMM yyyy')
    ),
    datasets: [
      {
        label: title,
        data: data.map(item => item[metric]),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            if (metric === 'wages_paid') {
              return `₹${(value / 10000000).toFixed(1)}Cr`;
            } else if (metric === 'women_participation_pct') {
              return `${value.toFixed(1)}%`;
            } else {
              return value.toLocaleString();
            }
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            if (metric === 'wages_paid') {
              return `₹${(value / 10000000).toFixed(1)}Cr`;
            } else if (metric === 'women_participation_pct') {
              return `${value}%`;
            } else if (value >= 100000) {
              return `${(value / 100000).toFixed(1)}L`;
            } else if (value >= 1000) {
              return `${(value / 1000).toFixed(1)}K`;
            }
            return value;
          }
        }
      }
    },
  };

  return (
    <div className="h-80">
      <Line data={chartData} options={options} />
    </div>
  );
};

// District Comparison Bar Chart
export const ComparisonChart = ({ districts, metric, title }) => {
  const intl = useIntl();

  const chartData = {
    labels: districts.map(d => d.name),
    datasets: [
      {
        label: title,
        data: districts.map(d => d[metric]),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(139, 92, 246)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            if (metric === 'total_wages_paid') {
              return `₹${(value / 10000000).toFixed(1)}Cr`;
            } else if (metric === 'avg_women_participation') {
              return `${value.toFixed(1)}%`;
            } else {
              return value.toLocaleString();
            }
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            if (metric === 'total_wages_paid') {
              return `₹${(value / 10000000).toFixed(1)}Cr`;
            } else if (metric === 'avg_women_participation') {
              return `${value}%`;
            } else if (value >= 100000) {
              return `${(value / 100000).toFixed(1)}L`;
            } else if (value >= 1000) {
              return `${(value / 1000).toFixed(1)}K`;
            }
            return value;
          }
        }
      }
    },
  };

  return (
    <div className="h-80">
      <Bar data={chartData} options={options} />
    </div>
  );
};

// Performance Gauge Chart
export const PerformanceGauge = ({ value, target, title, unit = '' }) => {
  const percentage = Math.min((value / target) * 100, 100);
  const remaining = 100 - percentage;

  const chartData = {
    labels: ['Achieved', 'Remaining'],
    datasets: [
      {
        data: [percentage, remaining],
        backgroundColor: [
          percentage >= 80 ? '#10B981' : percentage >= 60 ? '#F59E0B' : '#EF4444',
          '#E5E7EB',
        ],
        borderWidth: 0,
        cutout: '70%',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 14,
          weight: 'bold',
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            if (context.dataIndex === 0) {
              return `Achieved: ${value.toLocaleString()}${unit}`;
            } else {
              return `Target: ${target.toLocaleString()}${unit}`;
            }
          }
        }
      }
    },
  };

  return (
    <div className="relative h-48">
      <Doughnut data={chartData} options={options} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {percentage.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">
            {value.toLocaleString()}{unit}
          </div>
        </div>
      </div>
    </div>
  );
};

// Monthly Trend Summary
export const MonthlyTrendSummary = ({ monthlyData }) => {
  const intl = useIntl();

  if (!monthlyData || monthlyData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {intl.formatMessage({ id: 'charts.no_data', defaultMessage: 'No data available' })}
      </div>
    );
  }

  const latest = monthlyData[0];
  const previous = monthlyData[1];

  const calculateChange = (current, prev) => {
    if (!prev || prev === 0) return 0;
    return ((current - prev) / prev) * 100;
  };

  const metrics = [
    {
      key: 'households_work_provided',
      label: 'Households Provided Work',
      icon: '👪',
      current: latest?.households_work_provided || 0,
      change: calculateChange(latest?.households_work_provided, previous?.households_work_provided),
    },
    {
      key: 'total_persondays',
      label: 'Person Days Generated',
      icon: '👷',
      current: latest?.total_persondays || 0,
      change: calculateChange(latest?.total_persondays, previous?.total_persondays),
    },
    {
      key: 'wages_paid',
      label: 'Wages Paid',
      icon: '₹',
      current: latest?.wages_paid || 0,
      change: calculateChange(latest?.wages_paid, previous?.wages_paid),
      format: 'currency',
    },
    {
      key: 'women_participation_pct',
      label: 'Women Participation',
      icon: '♀',
      current: latest?.women_participation_pct || 0,
      change: calculateChange(latest?.women_participation_pct, previous?.women_participation_pct),
      format: 'percentage',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <div key={metric.key} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{metric.icon}</span>
            <span className={`text-sm font-medium ${
              metric.change > 0 ? 'text-green-600' : metric.change < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {metric.format === 'currency' 
              ? `₹${(metric.current / 10000000).toFixed(1)}Cr`
              : metric.format === 'percentage'
              ? `${metric.current.toFixed(1)}%`
              : metric.current.toLocaleString()
            }
          </div>
          <div className="text-sm text-gray-600">
            {metric.label}
          </div>
        </div>
      ))}
    </div>
  );
};