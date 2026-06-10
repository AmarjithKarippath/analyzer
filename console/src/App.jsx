import React, { useEffect, useState } from 'react'
import { BarChart3, AlertCircle } from 'lucide-react'
import { getUserCount, getAllUsers, groupUsersByDate } from './api'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  const [dailySignups, setDailySignups] = useState([])
  const [users, setUsers] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const count = await getUserCount()
        const allUsers = await getAllUsers()
        const grouped = groupUsersByDate(allUsers)

        setTotalCount(count)
        setDailySignups(grouped)
        setUsers(allUsers)
      } catch (err) {
        setError(
          err?.response?.data?.detail ||
            err?.message ||
            'Failed to load dashboard data'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="app">
        <div className="container">
          <div className="header">
            <h1>Admin Console</h1>
          </div>
          <div className="loading">
            <div className="spinner"></div>
            <p style={{ marginTop: '16px' }}>Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <h1>Admin Console</h1>
          <p>User registration analytics</p>
        </div>

        {error && (
          <div className="error">
            <AlertCircle size={16} style={{ display: 'inline-block', marginRight: '8px' }} />
            {error}
          </div>
        )}

        <Dashboard totalCount={totalCount} dailySignups={dailySignups} users={users} />
      </div>
    </div>
  )
}

export default App
