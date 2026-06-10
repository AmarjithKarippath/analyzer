import React, { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import './Dashboard.css'

function Dashboard({ totalCount, dailySignups, users }) {
  const [sortField, setSortField] = useState('created_at')
  const [sortDirection, setSortDirection] = useState('desc')

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedUsers = [...(users?.users || [])].sort((a, b) => {
    let aVal = a[sortField]
    let bVal = b[sortField]

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const formatDate = (timestamp) => {
    if (!timestamp) return '-'
    try {
      const date = new Date(timestamp)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch (e) {
      return timestamp
    }
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronUp size={14} className="sort-icon inactive" />
    return sortDirection === 'asc' ? (
      <ChevronUp size={14} className="sort-icon active" />
    ) : (
      <ChevronDown size={14} className="sort-icon active" />
    )
  }

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

      {/* All Users Table */}
      <div className="card card-table card-users">
        <div className="card-header">
          <h2>All Users ({sortedUsers.length})</h2>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('email')} className="sortable">
                  Email
                  <SortIcon field="email" />
                </th>
                <th onClick={() => handleSort('name')} className="sortable">
                  Name
                  <SortIcon field="name" />
                </th>
                <th onClick={() => handleSort('provider')} className="sortable">
                  Provider
                  <SortIcon field="provider" />
                </th>
                <th onClick={() => handleSort('created_at')} className="sortable">
                  Joined
                  <SortIcon field="created_at" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.length > 0 ? (
                sortedUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="email">{user.email}</td>
                    <td className="name">{user.name || '-'}</td>
                    <td>
                      <span className={`badge badge-${user.provider}`}>
                        {user.provider === 'google' ? '🔵 Google' : '📧 Email'}
                      </span>
                    </td>
                    <td className="date">{formatDate(user.created_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="empty">
                    No users found
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
