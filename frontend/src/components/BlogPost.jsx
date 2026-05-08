import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, AlertCircle, Calendar } from 'lucide-react'
import { getBlogPost } from '../services/blogApi'
import { useSEO, getBlogPostSchema } from '../hooks/useSEO'
import './BlogPost.css'

function BlogPost() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // SEO for blog posts (updated when post loads)
  useSEO(
    post
      ? {
          title: `${post.title} | Chilloutfox Blog`,
          description: post.excerpt || post.content.substring(0, 160),
          url: `https://www.chilloutfox.com/blog/${post.slug}`,
          canonical: `https://www.chilloutfox.com/blog/${post.slug}`,
          type: 'article',
          schema: getBlogPostSchema(post),
        }
      : {}
  )

  useEffect(() => {
    fetchPost()
  }, [slug])

  const fetchPost = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getBlogPost(slug)
      setPost(data)
    } catch (err) {
      setError(err?.response?.status === 404 ? 'Blog post not found' : 'Failed to load blog post')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="blog-post-container">
        <div className="blog-loading">
          <div className="spinner"></div>
          <p>Loading post...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="blog-post-container">
        <Link to="/blog" className="back-link">
          <ArrowLeft size={18} /> Back to Blog
        </Link>
        <div className="blog-error" style={{ marginTop: '32px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
        <div style={{ marginTop: '16px' }}>
          <Link to="/blog" className="btn-primary">
            View All Posts
          </Link>
        </div>
      </div>
    )
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="blog-post-container">
      <Link to="/blog" className="back-link">
        <ArrowLeft size={18} /> Back to Blog
      </Link>

      <article className="blog-post">
        <header className="blog-post-header">
          <h1 className="blog-post-title">{post.title}</h1>
          <div className="blog-post-meta">
            <Calendar size={16} />
            <span>{formatDate(post.created_at)}</span>
            {post.author_name && (
              <>
                <span className="meta-sep">•</span>
                <span>By {post.author_name}</span>
              </>
            )}
          </div>
        </header>

        <div className="blog-post-content">
          {/* Simple markdown rendering (line breaks and basic formatting) */}
          {post.content.split('\n\n').map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        <footer className="blog-post-footer">
          <Link to="/blog" className="btn-secondary">
            ← Back to All Posts
          </Link>
        </footer>
      </article>
    </div>
  )
}

export default BlogPost
