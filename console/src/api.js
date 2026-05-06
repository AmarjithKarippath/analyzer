import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
})

export async function getUserCount() {
  try {
    const res = await api.get('/admin/users/count')
    return res.data.count
  } catch (err) {
    console.error('Failed to fetch user count:', err)
    throw err
  }
}

export async function getAllUsers() {
  try {
    const res = await api.get('/admin/users')
    return res.data.users || []
  } catch (err) {
    console.error('Failed to fetch users:', err)
    throw err
  }
}

// Group users by creation date (YYYY-MM-DD) and count
export function groupUsersByDate(users) {
  const grouped = {}

  users.forEach((user) => {
    const date = new Date(user.created_at * 1000) // created_at is unix timestamp
    const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD

    if (!grouped[dateStr]) {
      grouped[dateStr] = 0
    }
    grouped[dateStr]++
  })

  // Convert to array, sort by date descending (newest first)
  return Object.entries(grouped)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => b.date.localeCompare(a.date))
}
