"use client";

import { Heart, YajirushiSvg } from "../Svgs";

export type Blog = {
  id: string;
  title: string;
  date: string;
  category: string;
  thumbnailUrl?: string;
};

type BlogListProps = {
  blogs: Blog[];
};

export default function BlogList({ blogs }: BlogListProps) {
  return (
    <ul className="blog-list">
      {blogs.map((blog) => (
        <li key={blog.id} className="blog-list__item">
          <a href={`/blog/${blog.id}`} className="blog-list__link">
            <div className="blog-list__thumb">
              {blog.thumbnailUrl && (
                <img src={blog.thumbnailUrl} alt={blog.title} />
              )}
            </div>

            <div className="blog-list__body">
              <p className="blog-list__title">{blog.title}</p>
              <div className="blog-list__meta">
                <span className="blog-list__date">{blog.date}</span>
                <span className="blog-list__category">{blog.category}</span> {/* タグで表示(雑記など) */}
              </div>
            </div>

            <Heart/>
            <YajirushiSvg/>
          </a>
        </li>
      ))}

      <style jsx>{`
        .blog-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .blog-list__item {
          border-bottom: 1px solid #eee;
        }

        .blog-list__link {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 8px;
          text-decoration: none;
          color: inherit;
        }

        .blog-list__link:hover {
          background: #f9f9f9;
        }

        .blog-list__thumb {
          width: 88px;
          height: 88px;
          border-radius: 8px;
          background: #f0f0f0;
          flex-shrink: 0;
          overflow: hidden;
        }

        .blog-list__thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .blog-list__body {
          flex: 1;
          min-width: 0;
        }

        .blog-list__title {
          font-size: 16px;
          font-weight: 500;
          color: #222;
          margin: 0 0 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .blog-list__meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .blog-list__date {
          font-size: 13px;
          color: #999;
        }

        .blog-list__category {
          font-size: 12px;
          color: #d4537e;
          background: #fbeaf0;
          padding: 2px 10px;
          border-radius: 10px;
        }

        .blog-list__chevron {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          color: #ccc;
        }
      `}</style>
    </ul>
  );
}