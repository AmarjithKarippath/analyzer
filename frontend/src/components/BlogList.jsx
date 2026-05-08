import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Search, Calendar } from 'lucide-react'
import { getBlogPosts, searchBlogPosts } from '../services/blogApi'
import { useSEO, getOrganizationSchema } from '../hooks/useSEO'
import './BlogList.css'

function BlogList() {
  useSEO({
    title: 'Trading Blog - P&L Insights & Strategies | Chilloutfox',
    description: 'Read insights, trading strategies, and performance analysis from the Chilloutfox trading analytics team.',
    url: 'https://www.chilloutfox.com/blog',
    type: 'blog',
    canonical: 'https://www.chilloutfox.com/blog',
    schema: getOrganizationSchema(),
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [posts, setPosts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [skip, setSkip] = useState(0)
  const [total, setTotal] = useState(0)

  const LIMIT = 10

  useEffect(() => {
    fetchPosts()
  }, [skip])

  const fetchPosts = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getBlogPosts(skip, LIMIT)
      setPosts(data.posts)
      setTotal(data.total)
      setIsSearching(false)
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Failed to load blog posts')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      await fetchPosts()
      return
    }

    setLoading(true)
    setError(null)
    try {
      const results = await searchBlogPosts(searchQuery)
      setPosts(results)
      setIsSearching(true)
      setTotal(results.length)
    } catch (err) {
      setError('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setIsSearching(false)
    setSkip(0)
    fetchPosts()
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading && !posts.length) {
    return (
      <div className="blog-container">
        <div className="blog-loading">
          <div className="spinner"></div>
          <p>Loading blog posts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="blog-container">
      <div className="blog-header">
        <h1>Trading Blog</h1>
        <p>Insights, strategies, and market analysis for traders</p>
      </div>

      {/* Search Bar */}
      <form className="blog-search" onSubmit={handleSearch}>
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search blog posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-btn">
          Search
        </button>
        {isSearching && (
          <button type="button" onClick={handleClearSearch} className="clear-btn">
            Clear
          </button>
        )}
      </form>

      {error && (
        <div className="blog-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="blog-empty">
          <p>No blog posts found.</p>
          {isSearching && (
            <button onClick={handleClearSearch} className="btn-link">
              View all posts
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="blog-grid">
            {posts.map((post) => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="blog-card">
                <div className="blog-card-content">
                  <h2 className="blog-card-title">{post.title}</h2>
                  <p className="blog-card-excerpt">{post.excerpt || post.content.substring(0, 150)}...</p>
                  <div className="blog-card-meta">
                    <Calendar size={14} />
                    <span>{formatDate(post.created_at)}</span>
                    {post.author_name && (
                      <>
                        <span className="meta-sep">•</span>
                        <span>{post.author_name}</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {!isSearching && total > LIMIT && (
            <div className="blog-pagination">
              <button
                onClick={() => setSkip(Math.max(0, skip - LIMIT))}
                disabled={skip === 0}
                className="pagination-btn"
              >
                ← Previous
              </button>
              <span className="pagination-info">
                Showing {skip + 1} – {Math.min(skip + LIMIT, total)} of {total}
              </span>
              <button
                onClick={() => setSkip(skip + LIMIT)}
                disabled={skip + LIMIT >= total}
                className="pagination-btn"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Admin Link */}
      <div className="blog-admin-link">
        <Link to="/admin/blog" className="btn-admin">
          Admin Panel
        </Link>
      </div>
    </div>
  )
}

export default BlogList
