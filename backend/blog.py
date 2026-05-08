"""Blog management: CRUD operations for blog posts."""

import os
import sqlite3
import time
from datetime import datetime
from typing import Optional
from fastapi import HTTPException

# Reuse the auth module's database connection
from auth import _db_lock, _connect

def init_blog_db():
    """Create blog_posts table if it doesn't exist."""
    with _db_lock, _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS blog_posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                slug TEXT NOT NULL UNIQUE,
                content TEXT NOT NULL,
                excerpt TEXT,
                author_name TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                published INTEGER DEFAULT 0
            )
            """
        )
        conn.commit()


def create_slug(title: str) -> str:
    """Generate a URL-friendly slug from title."""
    return (
        title.lower()
        .replace(" ", "-")
        .replace("--", "-")
        .replace("?", "")
        .replace("!", "")
        .replace(".", "")
        .replace(",", "")
        .replace("'", "")
    )


def get_blog_posts(published_only: bool = True, limit: int = 100, offset: int = 0) -> list[dict]:
    """Get all blog posts, optionally filtered to published only."""
    with _db_lock, _connect() as conn:
        query = "SELECT * FROM blog_posts"
        params = []

        if published_only:
            query += " WHERE published = 1"

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        cur = conn.execute(query, params)
        return [dict(row) for row in cur.fetchall()]


def get_blog_post_by_slug(slug: str) -> Optional[dict]:
    """Get a single blog post by slug."""
    with _db_lock, _connect() as conn:
        cur = conn.execute(
            "SELECT * FROM blog_posts WHERE slug = ? AND published = 1",
            (slug,),
        )
        row = cur.fetchone()
        return dict(row) if row else None


def get_blog_post_by_id(post_id: int) -> Optional[dict]:
    """Get a blog post by ID (admin use)."""
    with _db_lock, _connect() as conn:
        cur = conn.execute("SELECT * FROM blog_posts WHERE id = ?", (post_id,))
        row = cur.fetchone()
        return dict(row) if row else None


def create_blog_post(
    title: str,
    content: str,
    excerpt: Optional[str] = None,
    author_name: Optional[str] = None,
    published: bool = False,
) -> dict:
    """Create a new blog post."""
    slug = create_slug(title)
    now = int(time.time())

    # Check if slug already exists
    existing = get_blog_post_by_id(1)  # dummy check
    with _db_lock, _connect() as conn:
        try:
            cur = conn.execute(
                """
                INSERT INTO blog_posts
                (title, slug, content, excerpt, author_name, created_at, updated_at, published)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (title, slug, content, excerpt or "", author_name or "Admin", now, now, int(published)),
            )
            conn.commit()
            post_id = cur.lastrowid
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=400, detail=f"Slug '{slug}' already exists")

    return get_blog_post_by_id(post_id)


def update_blog_post(
    post_id: int,
    title: Optional[str] = None,
    content: Optional[str] = None,
    excerpt: Optional[str] = None,
    published: Optional[bool] = None,
) -> dict:
    """Update a blog post."""
    post = get_blog_post_by_id(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")

    # Generate new slug if title changed
    slug = create_slug(title) if title else post["slug"]
    now = int(time.time())

    with _db_lock, _connect() as conn:
        updates = []
        params = []

        if title:
            updates.append("title = ?")
            params.append(title)
        if content:
            updates.append("content = ?")
            params.append(content)
        if excerpt is not None:
            updates.append("excerpt = ?")
            params.append(excerpt)
        if published is not None:
            updates.append("published = ?")
            params.append(int(published))

        updates.append("updated_at = ?")
        params.append(now)

        params.append(post_id)

        query = f"UPDATE blog_posts SET {', '.join(updates)} WHERE id = ?"
        try:
            conn.execute(query, params)
            conn.commit()
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=400, detail=f"Slug '{slug}' already exists")

    return get_blog_post_by_id(post_id)


def delete_blog_post(post_id: int) -> None:
    """Delete a blog post."""
    post = get_blog_post_by_id(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")

    with _db_lock, _connect() as conn:
        conn.execute("DELETE FROM blog_posts WHERE id = ?", (post_id,))
        conn.commit()


def search_blog_posts(query: str, limit: int = 20) -> list[dict]:
    """Search blog posts by title or content."""
    search_term = f"%{query}%"
    with _db_lock, _connect() as conn:
        cur = conn.execute(
            """
            SELECT * FROM blog_posts
            WHERE published = 1 AND (title LIKE ? OR content LIKE ?)
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (search_term, search_term, limit),
        )
        return [dict(row) for row in cur.fetchall()]


def get_blog_post_count(published_only: bool = True) -> int:
    """Get total count of blog posts."""
    with _db_lock, _connect() as conn:
        query = "SELECT COUNT(*) as count FROM blog_posts"
        if published_only:
            query += " WHERE published = 1"
        cur = conn.execute(query)
        row = cur.fetchone()
        return row["count"] if row else 0
