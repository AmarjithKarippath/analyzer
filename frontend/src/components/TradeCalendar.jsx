import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import './TradeCalendar.css';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatCompactCurrency(value) {
  if (value === null || value === undefined) return '';
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs >= 100000) return `${sign}$${(abs / 1000).toFixed(2)}K`;
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(2)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

function classifyDay(day) {
  if (day.pnl === null || day.pnl === undefined) return 'empty';
  if (day.pnl > 0 && day.win_rate >= 50) return 'profit';
  if (day.pnl > 0) return 'mixed';
  if (day.pnl < 0) return 'loss';
  return 'neutral';
}

function MonthGrid({ month }) {
  const blanks = Array.from({ length: month.first_weekday }, (_, i) => i);

  // Trailing blanks to fill last row
  const totalCells = blanks.length + month.days.length;
  const trailing = (7 - (totalCells % 7)) % 7;
  const trailingBlanks = Array.from({ length: trailing }, (_, i) => i);

  return (
    <div className="calendar-month">
      <div className="calendar-month-header">
        <h3>
          {month.month_name} {month.year}
        </h3>
        <div className="month-summary">
          <span
            className={`month-pnl ${
              month.summary.pnl > 0 ? 'positive' : month.summary.pnl < 0 ? 'negative' : ''
            }`}
          >
            {formatCompactCurrency(month.summary.pnl)}
          </span>
          <span className="month-meta">
            {month.summary.trading_days} day
            {month.summary.trading_days !== 1 ? 's' : ''} ·{' '}
            {month.summary.win_rate !== null ? `${month.summary.win_rate.toFixed(1)}%` : '—'}
          </span>
        </div>
      </div>

      <div className="calendar-body">
        <div className="calendar-grid">
          <div className="calendar-weekdays">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="weekday-label">
                {label}
              </div>
            ))}
          </div>

          <div className="calendar-days">
            {blanks.map((i) => (
              <div key={`b-${i}`} className="day-cell empty"></div>
            ))}

            {month.days.map((day) => {
              const cls = classifyDay(day);
              const hasData = day.pnl !== null && day.pnl !== undefined;
              return (
                <div
                  key={day.date}
                  className={`day-cell ${cls}`}
                  title={hasData ? `${day.date}` : ''}
                >
                  <div className="day-cell-top">
                    {hasData && <FileText size={12} className="day-icon" />}
                    <span className="day-number">{day.day}</span>
                  </div>

                  {hasData && (
                    <div className="day-cell-body">
                      <div className="day-pnl">{formatCompactCurrency(day.pnl)}</div>
                      <div className="day-meta">
                        {day.trades} trade{day.trades !== 1 ? 's' : ''}
                      </div>
                      <div className="day-meta muted">
                        {day.win_rate !== null ? `${day.win_rate.toFixed(2)}%` : ''}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {trailingBlanks.map((i) => (
              <div key={`t-${i}`} className="day-cell empty"></div>
            ))}
          </div>
        </div>

        <div className="calendar-weeks">
          {month.weeks.map((week) => {
            const tone =
              week.pnl > 0 ? 'positive' : week.pnl < 0 ? 'negative' : 'neutral';
            return (
              <div key={week.week_number} className={`week-card ${tone}`}>
                <div className="week-label">Week {week.week_number}</div>
                <div className={`week-pnl ${tone}`}>
                  {formatCompactCurrency(week.pnl)}
                </div>
                <div className="week-meta">
                  {week.trading_days} day{week.trading_days !== 1 ? 's' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TradeCalendar({ calendarData, onMonthsChange, months }) {
  const [windowMonths, setWindowMonths] = useState(months || 2);

  if (!calendarData || !calendarData.months || calendarData.months.length === 0) {
    return (
      <div className="calendar-empty">
        No data available for the selected window.
      </div>
    );
  }

  const handleChange = (delta) => {
    const next = Math.max(1, Math.min(12, windowMonths + delta));
    if (next !== windowMonths) {
      setWindowMonths(next);
      onMonthsChange && onMonthsChange(next);
    }
  };

  return (
    <div className="trade-calendar">
      <div className="calendar-controls">
        <button
          className="cal-btn"
          onClick={() => handleChange(-1)}
          disabled={windowMonths <= 1}
          title="Show fewer months"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="cal-window-label">
          Last {windowMonths} month{windowMonths !== 1 ? 's' : ''}
        </span>
        <button
          className="cal-btn"
          onClick={() => handleChange(1)}
          disabled={windowMonths >= 12}
          title="Show more months"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="calendar-months">
        {calendarData.months.map((month) => (
          <MonthGrid key={`${month.year}-${month.month}`} month={month} />
        ))}
      </div>
    </div>
  );
}

export default TradeCalendar;
