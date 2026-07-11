"use client";

import Image from "next/image";
import { type JuniorLikeItem } from "@/stores/likeStore";
import { TwoPersonIcon, YajirushiSvg } from "../Svgs";

type IdleListProps = {
  idles: JuniorLikeItem[];
  onToggleLike?: (id: string) => void;
};

export default function IdleList({ idles, onToggleLike }: IdleListProps) {
  return (
    <ul className="idle-list">
      {idles.map((idle) => (
        <li key={idle.id} className="idle-list__item">
          <a href={`/junior/${idle.id}`} className="idle-list__link">
            <div className="idle-list__thumb">
              {idle.imageUrl && (
                <Image src={idle.imageUrl} alt={idle.name} width={88} height={88} style={{ objectFit: 'cover' }} />
              )}
            </div>

            <div className="idle-list__body">
              <p className="idle-list__name">{idle.name}</p>
              {idle.groupName && (
                <div className="idle-list__meta">
                  <span className="idle-list__nameRoma">{idle.groupName}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              className="idle-list__follow-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onToggleLike) {
                  onToggleLike(idle.id);
                }
              }}
              aria-label="フォロー解除"
            >
              <TwoPersonIcon />
            </button>
            <YajirushiSvg/>
          </a>
        </li>
      ))}

      <style jsx>{`
        .idle-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .idle-list__item {
          border-bottom: 1px solid #eee;
        }

        .idle-list__link {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 8px;
          text-decoration: none;
          color: inherit;
        }

        .idle-list__link:hover {
          background: #f9f9f9;
        }

        .idle-list__thumb {
          width: 88px;
          height: 88px;
          border-radius: 8px;
          background: #f0f0f0;
          flex-shrink: 0;
          overflow: hidden;
        }

        .idle-list__thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .idle-list__body {
          flex: 1;
          min-width: 0;
        }

        .idle-list__name {
          font-size: 16px;
          font-weight: 500;
          color: #222;
          margin: 0 0 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .idle-list__meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .idle-list__nameRoma {
          font-size: 13px;
          color: #999;
        }

        .idle-list__follow-btn {
          background: none;
          border: none;
          padding: 4px;
          color: #E8447A;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }

        .idle-list__follow-btn:hover {
          transform: scale(1.1);
        }

        .idle-list__chevron {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          color: #ccc;
        }
      `}</style>
    </ul>
  );
}
