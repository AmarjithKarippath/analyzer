import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import './Charts.css';

function Charts({ pivotData, distributionData, stats }) {
  // Prepare pivot data for chart
  const chartData = pivotData.data.map((item) => ({
    date: item.date,
    pnl: item.pnl_amount,
    cumulative: 0, // Will be calculated
  }));

  // Calculate cumulative P&L
  let cumulative = 0;
  chartData.forEach((item) => {
    cumulative += item.pnl;
    item.cumulative = cumulative;
  });

  // Prepare distribution data
  const distributionChartData = distributionData.distribution.map((item) => ({
    range: `${item.bin_start.toFixed(0)}`, // Simplified label
    frequency: item.frequency,
  }));

  // Win/Loss pie chart data
  const winLossData = [
    {
      name: 'Profitable Days',
      value: stats.daily_metrics.profitable_days,
      color: '#10b981',
    },
    {
      name: 'Loss Days',
      value: stats.daily_metrics.loss_days,
      color: '#ef4444',
    },
  ];

  // Format currency for tooltip
  const formatCurrency = (value) => {
    return `₹${value.toFixed(2)}`;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? formatCurrency(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="charts-container">
      {/* Daily P&L Chart */}
      <div className="chart-section">
        <h3>Daily P&L Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
            <defs>
              <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              interval={Math.floor(chartData.length / 6)}
            />
            <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="pnl"
              stroke="#6366f1"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPnl)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Cumulative P&L Chart */}
      <div className="chart-section">
        <h3>Cumulative P&L</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              interval={Math.floor(chartData.length / 6)}
            />
            <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="cumulative"
              stroke="#764ba2"
              dot={false}
              strokeWidth={2}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Distribution Chart */}
      <div className="chart-section">
        <h3>P&L Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={distributionChartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="range" tick={{ fontSize: 11 }} stroke="#6b7280" />
            <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="frequency" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Win/Loss Pie Chart */}
      <div className="chart-section">
        <h3>Winning vs Losing Days</h3>
        <div className="pie-chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={winLossData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) =>
                  `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {winLossData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => value} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Charts;
