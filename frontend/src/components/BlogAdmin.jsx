import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Plus, Edit2, Trash2, Eye } from 'lucide-react'
import {
  getBlogPostsAdmin,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from '../services/blogApi'
import './BlogAdmin.css'

function BlogAdmin() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', content: '', excerpt: '', published: false })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const data = await getBlogPostsAdmin(0, 100)
      setPosts(data.posts)
      setError(null)
    } catch (err) {
      setError('Failed to load blog posts')
    } finally {
      setLoading(false)
    }
  }

  const handleNew = () => {
    setEditing(null)
    setForm({ title: '', content: '', excerpt: '', published: false })
  }

  const handleEdit = (post) => {
    setEditing(post.id)
    setForm({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || '',
      published: post.published === 1,
    })
  }

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and content are required')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      if (editing) {
        await updateBlogPost(editing, form)
      } else {
        await createBlogPost(form.title, form.content, form.excerpt, form.published)
      }
      await fetchPosts()
      setEditing(null)
      setForm({ title: '', content: '', excerpt: '', published: false })
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to save post')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    setSubmitting(true)
    try {
      await deleteBlogPost(postId)
      await fetchPosts()
    } catch (err) {
      setError('Failed to delete post')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="blog-admin">
      <div className="admin-header">
        <h1>Blog Admin</h1>
        <button onClick={() => navigate('/blog')} className="btn-secondary">
          ← Back to Blog
        </button>
      </div>

      {error && (
        <div className="admin-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="admin-layout">
        {/* Editor */}
        <form onSubmit={handleSubmit} className="admin-editor">
          <h2>{editing ? 'Edit Post' : 'New Post'}</h2>

          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              placeholder="Post title..."
              value={form.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group">
            <label>Excerpt</label>
            <input
              type="text"
              placeholder="Short summary (optional)"
              value={form.excerpt}
              onChange={(e) => handleInputChange('excerpt', e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label>Content *</label>
            <textarea
              placeholder="Write your post here... (plain text or markdown)"
              value={form.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              disabled={submitting}
              required
              rows={12}
            />
          </div>

          <div className="form-group checkbox">
            <input
              type="checkbox"
              id="published"
              checked={form.published}
              onChange={(e) => handleInputChange('published', e.target.checked)}
              disabled={submitting}
            />
            <label htmlFor="published">Publish immediately</label>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editing ? 'Update Post' : 'Create Post'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={handleNew}
                className="btn-secondary"
                disabled={submitting}
              >
                New Post
              </button>
            )}
          </div>
        </form>

        {/* Posts List */}
        <div className="admin-posts">
          <h2>All Posts ({posts.length})</h2>

          {loading ? (
            <div className="loading">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="empty">No posts yet. Create your first post!</div>
          ) : (
            <div className="posts-table">
              {posts.map((post) => (
                <div key={post.id} className="post-row">
                  <div className="post-info">
                    <h3>{post.title}</h3>
                    <p className="post-meta">
                      {formatDate(post.created_at)}
                      {post.published === 1 ? (
                        <span className="badge published">Published</span>
                      ) : (
                        <span className="badge draft">Draft</span>
                      )}
                    </p>
                  </div>
                  <div className="post-actions">
                    <button
                      onClick={() => handleEdit(post)}
                      className="action-btn edit"
                      disabled={submitting}
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => navigate(`/blog/${post.slug}`)}
                      className="action-btn view"
                      target="_blank"
                      title="View"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="action-btn delete"
                      disabled={submitting}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BlogAdmin
