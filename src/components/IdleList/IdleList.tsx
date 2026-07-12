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
              {(idle.affiliation || idle.groupName) && (
                <div className="idle-list__meta">
                  <span className="idle-list__nameRoma">{idle.affiliation || idle.groupName}</span>
                </div>
              )}
            </div>
          </a>

          <button
            type="button"
            className="idle-list__unfollow-btn"
            onClick={() => {
              if (onToggleLike) {
                onToggleLike(idle.id);
              }
            }}
            aria-label={`${idle.name}のフォローを解除`}
          >
            <span className="idle-list__unfollow-icon" aria-hidden="true">
              <TwoPersonIcon />
            </span>
            <span className="idle-list__unfollow-text">解除</span>
          </button>

          <a href={`/junior/${idle.id}`} className="idle-list__chevron-link" aria-label={`${idle.name}の詳細へ`}>
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
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid #eee;
        }

        .idle-list__link {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
          min-width: 0;
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

        .idle-list__unfollow-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          min-width: 72px;
          height: 32px;
          padding: 0 10px;
          border: 1px solid #f0d8e8;
          border-radius: 999px;
          background: #fff8fb;
          color: #8f3157;
          cursor: pointer;
          font: inherit;
          font-size: 12px;
          font-weight: 800;
          transition: background-color 0.2s, border-color 0.2s, color 0.2s, transform 0.2s;
          white-space: nowrap;
        }

        .idle-list__unfollow-btn:hover {
          border-color: #e8a6c2;
          background: #ffeaf3;
          color: #E8447A;
          transform: translateY(-1px);
        }

        .idle-list__unfollow-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 17px;
          height: 17px;
          color: currentColor;
        }

        .idle-list__unfollow-icon svg {
          width: 17px;
          height: 17px;
          display: block;
        }

        .idle-list__chevron-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 40px;
          color: #ccc;
          text-decoration: none;
        }

        .idle-list__chevron {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          color: #ccc;
        }

        @media (max-width: 420px) {
          .idle-list__item {
            gap: 6px;
          }

          .idle-list__link {
            gap: 12px;
            padding-left: 0;
          }

          .idle-list__thumb {
            width: 72px;
            height: 72px;
          }

          .idle-list__unfollow-btn {
            min-width: 58px;
            padding: 0 8px;
          }

          .idle-list__unfollow-icon {
            display: none;
          }
        }
      `}</style>
    </ul>
  );
}
