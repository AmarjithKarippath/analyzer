import React from 'react'
import './Dashboard.css'

function Dashboard({ totalCount, dailySignups }) {
  return (
    <div className="dashboard">
      {/* Total Users Card */}
      <div className="card card-large">
        <div className="card-content">
          <div className="card-number">{totalCount}</div>
          <div className="card-label">Total Customers</div>
        </div>
      </div>

      {/* Daily Signups Table */}
      <div className="card card-table">
        <div className="card-header">
          <h2>Daily Registrations</h2>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>New Customers</th>
              </tr>
            </thead>
            <tbody>
              {dailySignups.length > 0 ? (
                dailySignups.map((row) => (
                  <tr key={row.date}>
                    <td>{row.date}</td>
                    <td className="number">{row.count}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="empty">
                    No registrations yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
