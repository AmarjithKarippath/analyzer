/**
 * Custom hook to manage SEO meta tags and structured data
 * Updates document head with meta tags, title, and JSON-LD schema
 */

import { useEffect } from 'react'

export function useSEO({
  title = 'Chilloutfox - Trading Analytics Dashboard',
  description = 'P&L Dashboard for traders. Analyze trading performance with visual charts, metrics, and insights.',
  image = 'https://www.chilloutfox.com/og-image.png',
  url = 'https://www.chilloutfox.com',
  type = 'website',
  canonical = null,
  schema = null,
}) {
  useEffect(() => {
    // Set page title
    document.title = title

    // Helper to update or create meta tag
    const updateMeta = (name, content) => {
      let tag = document.querySelector(`meta[name="${name}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('name', name)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }

    const updateOGMeta = (property, content) => {
      let tag = document.querySelector(`meta[property="${property}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('property', property)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }

    // Standard meta tags
    updateMeta('description', description)
    updateMeta('viewport', 'width=device-width, initial-scale=1.0')
    updateMeta('robots', 'index, follow')

    // Open Graph tags (for social media)
    updateOGMeta('og:title', title)
    updateOGMeta('og:description', description)
    updateOGMeta('og:image', image)
    updateOGMeta('og:url', url)
    updateOGMeta('og:type', type)
    updateOGMeta('og:site_name', 'Chilloutfox')

    // Twitter Card tags
    updateMeta('twitter:card', 'summary_large_image')
    updateMeta('twitter:title', title)
    updateMeta('twitter:description', description)
    updateMeta('twitter:image', image)

    // Canonical URL
    if (canonical) {
      let canonical_tag = document.querySelector('link[rel="canonical"]')
      if (!canonical_tag) {
        canonical_tag = document.createElement('link')
        canonical_tag.setAttribute('rel', 'canonical')
        document.head.appendChild(canonical_tag)
      }
      canonical_tag.setAttribute('href', canonical)
    }

    // JSON-LD Structured Data (Schema.org)
    if (schema) {
      let scriptTag = document.querySelector('script[type="application/ld+json"]')
      if (!scriptTag) {
        scriptTag = document.createElement('script')
        scriptTag.setAttribute('type', 'application/ld+json')
        document.head.appendChild(scriptTag)
      }
      scriptTag.textContent = JSON.stringify(schema)
    }

    return () => {
      // Cleanup can be done here if needed
    }
  }, [title, description, image, url, type, canonical, schema])
}

/**
 * Generate Organization schema for homepage
 */
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Chilloutfox',
    url: 'https://www.chilloutfox.com',
    logo: 'https://www.chilloutfox.com/logo.png',
    description: 'P&L Dashboard for traders. Analyze trading performance with visual charts and metrics.',
    sameAs: [
      'https://twitter.com/chilloutfox',
      'https://linkedin.com/company/chilloutfox',
    ],
  }
}

/**
 * Generate BlogPosting schema for blog posts
 */
export function getBlogPostSchema(post) {
  const postDate = new Date(post.created_at * 1000)
  const updatedDate = new Date(post.updated_at * 1000)

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || post.content.substring(0, 160),
    image: 'https://www.chilloutfox.com/blog-image.png',
    datePublished: postDate.toISOString(),
    dateModified: updatedDate.toISOString(),
    author: {
      '@type': 'Person',
      name: post.author_name || 'Chilloutfox Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Chilloutfox',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.chilloutfox.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.chilloutfox.com/blog/${post.slug}`,
    },
  }
}

/**
 * Generate BreadcrumbList schema for navigation
 */
export function getBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
