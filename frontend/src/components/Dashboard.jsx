import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, RefreshCw, Calendar, LogOut } from 'lucide-react';
import StatisticsCards from './StatisticsCards';
import Charts from './Charts';
import TopDaysTable from './TopDaysTable';
import TradeCalendar from './TradeCalendar';
import './Dashboard.css';

const RANGE_OPTIONS = [
  { value: '1w', label: 'Last week' },
  { value: '1m', label: 'Last month' },
  { value: '3m', label: 'Last 3 months' },
  { value: '6m', label: 'Last 6 months' },
  { value: 'all', label: 'All time' },
];

function Dashboard({ stats, summary, onNewFile, isLoading, user, onLogout }) {
  const [range, setRange] = useState('all');
  const [currentStats, setCurrentStats] = useState(stats);
  const [topDays, setTopDays] = useState(null);
  const [pivotData, setPivotData] = useState(null);
  const [distributionData, setDistributionData] = useState(null);
  const [calendarData, setCalendarData] = useState(null);
  const [calendarMonths, setCalendarMonths] = useState(1);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    fetchDashboardData(range, calendarMonths);
  }, []);

  const fetchDashboardData = async (rangeKey = range, months = calendarMonths) => {
    setLoadingData(true);
    try {
      const [statsRes, topRes, pivotRes, distRes, calRes] = await Promise.all([
        axios.get(`/statistics?range=${rangeKey}`),
        axios.get(`/top-days?top_n=5&range=${rangeKey}`),
        axios.get(`/pivot-data?range=${rangeKey}`),
        axios.get(`/distribution-data?bins=20&range=${rangeKey}`),
        axios.get(`/calendar-data?months=${months}`),
      ]);

      setCurrentStats(statsRes.data);
      setTopDays(topRes.data);
      setPivotData(pivotRes.data);
      setDistributionData(distRes.data);
      setCalendarData(calRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleRangeChange = (e) => {
    const next = e.target.value;
    setRange(next);
    fetchDashboardData(next, calendarMonths);
  };

  const handleCalendarMonthsChange = async (months) => {
    setCalendarMonths(months);
    try {
      const res = await axios.get(`/calendar-data?months=${months}`);
      setCalendarData(res.data);
    } catch (err) {
      console.error('Error fetching calendar data:', err);
    }
  };

  const handleRefresh = async () => {
    await fetchDashboardData(range, calendarMonths);
  };

  if (!currentStats || !summary) {
    return (
      <div className="dashboard loading">
        <div className="spinner">
          <div className="spinner-circle"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <h1>P&L Dashboard</h1>
            <p>
              {user ? <>Signed in as <strong>{user.name || user.email}</strong> · </> : null}
              Data from {summary.date_range.start} to {summary.date_range.end}
            </p>
          </div>

          <div className="header-actions">
            <div className="range-selector">
              <Calendar size={16} className="range-icon" />
              <select
                className="range-select"
                value={range}
                onChange={handleRangeChange}
                disabled={loadingData}
                title="Date range"
              >
                {RANGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="btn btn-secondary"
              onClick={handleRefresh}
              disabled={loadingData}
              title="Refresh data"
            >
              <RefreshCw size={18} className={loadingData ? 'spinning' : ''} />
              Refresh
            </button>
            <button className="btn btn-primary" onClick={onNewFile}>
              <Plus size={18} />
              New File
            </button>
            {onLogout && (
              <button
                className="btn btn-secondary"
                onClick={onLogout}
                title="Sign out"
              >
                <LogOut size={18} />
                Sign out
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        {/* Data Summary */}
        <section className="section">
          <h2 className="section-title">Data Summary</h2>
          <div className="summary-grid">
            <div className="summary-card">
              <label>Total Records</label>
              <p className="summary-value">{summary.total_records}</p>
            </div>
            <div className="summary-card">
              <label>Trading Days</label>
              <p className="summary-value">{summary.total_days}</p>
            </div>
            <div className="summary-card">
              <label>Date Range</label>
              <p className="summary-value small">
                {summary.date_range.start} to {summary.date_range.end}
              </p>
            </div>
            <div className="summary-card">
              <label>Columns</label>
              <p className="summary-value small">{summary.columns.length} fields</p>
            </div>
          </div>
        </section>

        {/* Statistics Cards */}
        <section className="section">
          <h2 className="section-title">Key Metrics</h2>
          <StatisticsCards stats={currentStats} />
        </section>

        {/* Calendar Summary */}
        {calendarData && (
          <section className="section">
            <h2 className="section-title">Calendar Summary</h2>
            <TradeCalendar
              calendarData={calendarData}
              months={calendarMonths}
              onMonthsChange={handleCalendarMonthsChange}
            />
          </section>
        )}

        {/* Charts */}
        {pivotData && distributionData && (
          <section className="section">
            <h2 className="section-title">Performance Analysis</h2>
            <Charts
              pivotData={pivotData}
              distributionData={distributionData}
              stats={currentStats}
            />
          </section>
        )}

        {/* Top Days */}
        {topDays && (
          <section className="section">
            <h2 className="section-title">Best & Worst Days</h2>
            <TopDaysTable topDays={topDays} />
          </section>
        )}

      </main>
    </div>
  );
}

export default Dashboard;
