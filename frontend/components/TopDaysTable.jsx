import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import './TopDaysTable.css';

function TopDaysTable({ topDays }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="top-days-container">
      <div className="top-days-section">
        <h3 className="section-title">
          <TrendingUp className="section-icon" size={20} />
          Top Profitable Days
        </h3>
        <div className="table-wrapper">
          <table className="days-table">
            <thead>
              <tr>
                <th className="rank">Rank</th>
                <th className="date">Date</th>
                <th className="amount">P&L Amount</th>
              </tr>
            </thead>
            <tbody>
              {topDays.top_profitable_days.data.map((day, index) => (
                <tr key={index} className="profitable-row">
                  <td className="rank">
                    <span className="rank-badge">{index + 1}</span>
                  </td>
                  <td className="date">{formatDate(day.date)}</td>
                  <td className="amount positive">
                    <span className="amount-value">+{formatCurrency(day.pnl_amount)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="top-days-section">
        <h3 className="section-title">
          <TrendingDown className="section-icon" size={20} />
          Top Loss-Making Days
        </h3>
        <div className="table-wrapper">
          <table className="days-table">
            <thead>
              <tr>
                <th className="rank">Rank</th>
                <th className="date">Date</th>
                <th className="amount">P&L Amount</th>
              </tr>
            </thead>
            <tbody>
              {topDays.top_loss_days.data.map((day, index) => (
                <tr key={index} className="loss-row">
                  <td className="rank">
                    <span className="rank-badge">{index + 1}</span>
                  </td>
                  <td className="date">{formatDate(day.date)}</td>
                  <td className="amount negative">
                    <span className="amount-value">{formatCurrency(day.pnl_amount)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TopDaysTable;
