import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Target,
} from 'lucide-react';
import './StatisticsCards.css';

function StatisticsCards({ stats }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value.toFixed(2)}%`;
  };

  const cards = [
    {
      id: 'total-pnl',
      title: 'Total P&L',
      value: formatCurrency(stats.summary.total_pnl),
      icon: TrendingUp,
      color: 'success',
      status: stats.summary.total_pnl >= 0 ? 'positive' : 'negative',
      trend: `${stats.daily_metrics.profitable_days} winning days`,
    },
    {
      id: 'win-rate',
      title: 'Win Rate',
      value: formatPercent(stats.summary.win_rate_percentage),
      icon: Target,
      color: 'primary',
      change: `${stats.daily_metrics.profitable_days}/${stats.daily_metrics.total_traded_days} days`,
    },
    {
      id: 'profit-factor',
      title: 'Profit Factor',
      value: stats.summary.profit_factor.toFixed(2),
      icon: BarChart3,
      color: 'info',
      change: 'Winning vs Losing',
    },
    {
      id: 'max-profit',
      title: 'Best Day',
      value: formatCurrency(stats.daily_metrics.max_profit_per_day),
      icon: TrendingUp,
      color: 'success',
      change: 'Maximum profit',
    },
    {
      id: 'max-loss',
      title: 'Worst Day',
      value: formatCurrency(stats.daily_metrics.max_loss_per_day),
      icon: TrendingDown,
      color: 'danger',
      change: 'Maximum loss',
    },
    {
      id: 'avg-profit',
      title: 'Avg Daily Win',
      value: formatCurrency(stats.daily_metrics.average_profit_per_day),
      icon: Activity,
      color: 'success',
      change: `${stats.daily_metrics.profitable_days} days`,
    },
    {
      id: 'avg-loss',
      title: 'Avg Daily Loss',
      value: formatCurrency(stats.daily_metrics.average_loss_per_day),
      icon: TrendingDown,
      color: 'danger',
      change: `${stats.daily_metrics.loss_days} days`,
    },
    {
      id: 'total-trades',
      title: 'Total Trades',
      value: stats.trade_metrics.total_trades.toLocaleString(),
      icon: PieChart,
      color: 'info',
      change: `${stats.trade_metrics.average_trades_per_day.toFixed(1)}/day avg`,
    },
  ];

  return (
    <div className="statistics-cards">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.id} className={`card card-${card.color}`}>
            <div className="card-header">
              <h3 className="card-title">{card.title}</h3>
              <Icon className="card-icon" size={24} />
            </div>

            <div className="card-body">
              <p className="card-value">{card.value}</p>
              {(card.trend || card.change) && (
                <p className="card-meta">{card.trend || card.change}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default StatisticsCards;
