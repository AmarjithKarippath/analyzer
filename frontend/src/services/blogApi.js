import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
})

// Public endpoints
export async function getBlogPosts(skip = 0, limit = 10) {
  try {
    const res = await api.get('/blog/posts', { params: { skip, limit } })
    return res.data
  } catch (err) {
    console.error('Failed to fetch blog posts:', err)
    throw err
  }
}

export async function getBlogPost(slug) {
  try {
    const res = await api.get(`/blog/posts/${slug}`)
    return res.data.post
  } catch (err) {
    console.error(`Failed to fetch blog post "${slug}":`, err)
    throw err
  }
}

export async function searchBlogPosts(query) {
  try {
    const res = await api.get('/blog/search', { params: { q: query } })
    return res.data.posts
  } catch (err) {
    console.error('Failed to search blog posts:', err)
    throw err
  }
}

// Admin endpoints
export async function createBlogPost(title, content, excerpt, published = false) {
  try {
    const res = await api.post('/blog/admin/posts', {
      title,
      content,
      excerpt,
      published,
    })
    return res.data.post
  } catch (err) {
    console.error('Failed to create blog post:', err)
    throw err
  }
}

export async function updateBlogPost(postId, updates) {
  try {
    const res = await api.put(`/blog/admin/posts/${postId}`, updates)
    return res.data.post
  } catch (err) {
    console.error(`Failed to update blog post ${postId}:`, err)
    throw err
  }
}

export async function deleteBlogPost(postId) {
  try {
    await api.delete(`/blog/admin/posts/${postId}`)
  } catch (err) {
    console.error(`Failed to delete blog post ${postId}:`, err)
    throw err
  }
}

export async function getBlogPostsAdmin(skip = 0, limit = 100) {
  try {
    const res = await api.get('/blog/admin/posts', { params: { skip, limit } })
    return res.data
  } catch (err) {
    console.error('Failed to fetch admin blog posts:', err)
    throw err
  }
}
