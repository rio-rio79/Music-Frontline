'use client'
import { useState } from 'react';

import { 
  CrownSvg, 
  TrophySvg, 
  ChevronRightSvg, 
  ChevronDownSvg
} from '../../components/Svgs';


const DATA = {
  hot: [
    { rank: 1, name: "アイドル", pt: 3250, avatar: "/images/avatar_a.png" },
    { rank: 2, name: "アイドル", pt: 2840, avatar: "/images/avatar_b.png" },
    { rank: 3, name: "アイドル", pt: 2120, avatar: "/images/avatar_c.png" },
    { rank: 4, name: "アイドル", pt: 1870, avatar: "/images/avatar_d.png" },
    { rank: 5, name: "アイドル", pt: 1540, avatar: "/images/avatar_e.png" },
    { rank: 6, name: "アイドル", pt: 1320, avatar: "/images/avatar_f.png" },
    { rank: 7, name: "アイドル", pt: 1180, avatar: "/images/avatar_g.png" },
    { rank: 8, name: "アイドル", pt: 990, avatar: "/images/avatar_h.png" },
    { rank: 9, name: "アイドル", pt: 840, avatar: "/images/avatar_i.png" },
    { rank: 10, name: "アイドル", pt: 710, avatar: "/images/avatar_j.png" },
  ],
  song: [
    { rank: 1, name: "アイドル楽曲A", target: "〇〇グループ", pt: 5400, avatar: "/images/song_a.png" },
    { rank: 2, name: "アイドル楽曲B", target: "〇〇グループ", pt: 4980, avatar: "/images/song_b.png" },
    { rank: 3, name: "アイドル楽曲C", target: "△△グループ", pt: 4310, avatar: "/images/song_c.png" },
    { rank: 4, name: "アイドル楽曲D", target: "△△グループ", pt: 3760, avatar: "/images/song_d.png" },
    { rank: 5, name: "アイドル楽曲E", target: "□□グループ", pt: 3300, avatar: "/images/song_e.png" },
    { rank: 6, name: "アイドル楽曲F", target: "□□グループ", pt: 2890, avatar: "/images/song_f.png" },
    { rank: 7, name: "アイドル楽曲G", target: "〇〇グループ", pt: 2410, avatar: "/images/song_g.png" },
    { rank: 8, name: "アイドル楽曲H", target: "△△グループ", pt: 1980, avatar: "/images/song_h.png" },
  ],
  group: [
    { rank: 1, name: "〇〇グループ", target: "メンバー12名", pt: 12400, avatar: "/images/group_a.png" },
    { rank: 2, name: "△△グループ", target: "メンバー9名", pt: 10820, avatar: "/images/group_b.png" },
    { rank: 3, name: "□□グループ", target: "メンバー7名", pt: 9330, avatar: "/images/group_c.png" },
    { rank: 4, name: "◇◇グループ", target: "メンバー5名", pt: 7650, avatar: "/images/group_d.png" },
    { rank: 5, name: "☆☆グループ", target: "メンバー6名", pt: 6120, avatar: "/images/group_e.png" },
    { rank: 6, name: "◎◎グループ", target: "メンバー8名", pt: 5280, avatar: "/images/group_f.png" },
  ],
};

const oshi_name = "中村嶺亜";
const my_oshi_point = 500;

const PAGE_SIZE = 5;
type TabType = 'hot' | 'song' | 'group';

export default function Ranking() {
  // 現在アクティブなタブを管理
  const [currentTab, setCurrentTab] = useState<TabType>('hot');
  
  // 各タブの現在の表示件数を管理
  const [visibleCounts, setVisibleCounts] = useState<Record<TabType, number>>({
    hot: PAGE_SIZE,
    song: PAGE_SIZE,
    group: PAGE_SIZE,
  });

  // 「もっと見る」ボタンのハンドラー
  const handleMoreClick = () => {
    setVisibleCounts((prev) => ({
      ...prev,
      [currentTab]: Math.min(prev[currentTab] + PAGE_SIZE, DATA[currentTab].length),
    }));
  };

  // 順位に応じたマーク（SVG共通コンポーネント）または数値を返す関数
  const renderRankMarker = (rank: number) => {
    if (rank >= 1 && rank <= 3) {
      return <CrownSvg rank={rank} />;
    }
    return rank;
  };

  const currentListData = DATA[currentTab];
  const shownCount = visibleCounts[currentTab];
  const hasMore = shownCount < currentListData.length;

  return (
    <section className="page">
      <style>{`
        :root{
          --pink: #FF69B4;
          --pink-dark: #F0459B;
          --pink-pale: #FFF0F6;
          --gold: #F5B942;
          --silver: #B8BEC7;
          --bronze: #C97B3D;
          --text-main: #1A1A2E;
          --text-sub: #9A9AA8;
          --border: #ECECF2;
          --bg: #FFFFFF;
        }
        .page{
          max-width: 640px;
          margin: 0 auto;
          padding: 40px 24px 64px;
        }
        .heading{ margin-bottom: 32px; }
        .heading h1{ font-size: 34px; font-weight: 800; margin: 0 0 12px; letter-spacing: 0.5px; }
        .heading .underline{ width: 64px; height: 4px; background: var(--pink); border-radius: 2px; }
        .summary{ text-align: center; padding: 8px 0 36px; }
        .trophy-wrap{ position: relative; display: inline-block; margin-bottom: 8px; }
        .trophy-wrap svg{ display:block; }
        .summary .label{ font-size: 15px; color: var(--text-main); margin: 4px 0 8px; }
        .summary .pt{ font-size: 48px; font-weight: 800; color: var(--pink); letter-spacing: 1px; }
        .tabs{ display: flex; background: #F4F4F7; border-radius: 999px; padding: 4px; margin-bottom: 8px; }
        .tab{ flex: 1; text-align: center; padding: 12px 0; font-size: 15px; font-weight: 700; color: var(--text-sub); border-radius: 999px; cursor: pointer; transition: background .2s ease, color .2s ease; user-select: none; }
        .tab.active{ background: var(--pink-pale); color: var(--pink); }
        .list{ border-top: 1px solid var(--border); }
        .row{ display: flex; align-items: center; gap: 14px; padding: 18px 4px; border-bottom: 1px solid var(--border); animation: fadeIn .35s ease both; }
        .rank{ width: 28px; flex-shrink: 0; text-align: center; font-size: 17px; font-weight: 700; color: var(--text-main); }
        .rank svg{ display:block; margin: 0 auto; }
        
        /* imgタグ向けに、画像が歪まないよう object-fit を追加 */
        .avatar{ width: 48px; height: 48px; border-radius: 50%; background: #E2E2E8; flex-shrink: 0; object-fit: cover; }
        
        .info{ flex: 1; min-width: 0; }
        .info .name{ font-size: 16px; font-weight: 700; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .info .target{ font-size: 13px; color: var(--text-sub); }
        .score{ font-size: 18px; font-weight: 800; color: var(--pink); white-space: nowrap; margin-left: 4px; }
        .score span{ font-size: 13px; font-weight: 600; margin-left: 2px; }
        .chevron{ flex-shrink: 0; color: var(--text-sub); margin-left: 4px; }
        @keyframes fadeIn{ from{ opacity: 0; transform: translateY(6px); } to{ opacity: 1; transform: translateY(0); } }
        .more-wrap{ text-align: center; margin-top: 28px; }
        .more-btn{ display: inline-flex; align-items: center; gap: 8px; padding: 13px 32px; border: 1.5px solid var(--pink); color: var(--pink); background: #fff; border-radius: 999px; font-size: 15px; font-weight: 700; cursor: pointer; transition: background .2s ease, color .2s ease, transform .1s ease; }
        .more-btn:hover{ background: var(--pink-pale); }
        .more-btn:active{ transform: scale(0.97); }
        .more-btn svg{ transition: transform .25s ease; }
        .footer-deco{ display: flex; justify-content: space-between; align-items: flex-end; margin-top: 64px; padding: 0 8px; opacity: 0.55; }
        .footer-deco svg{ display:block; }
        @media (max-width: 480px){
          .page{ padding: 28px 18px 48px; }
          .heading h1{ font-size: 28px; }
          .summary .pt{ font-size: 38px; }
          .footer-deco{ display:none; }
        }
      `}</style>

      {/* Heading */}
      <div className="heading">
        <h1>Ranking</h1>
        <div className="underline"></div>
      </div>

      {/* Trophy summary */}
      <div className="summary">
        <div className="trophy-wrap">
          <TrophySvg />
        </div>
        <div className="label">あなたの{oshi_name}くんへの総応援pt数</div>
        <div className="pt">{my_oshi_point}pt</div>
      </div>

      {/* Tabs */}
      <div className="tabs" role="tablist">
        <div className={`tab ${currentTab === 'hot' ? 'active' : ''}`} onClick={() => setCurrentTab('hot')} role="tab">急上昇</div>
        <div className={`tab ${currentTab === 'song' ? 'active' : ''}`} onClick={() => setCurrentTab('song')} role="tab">曲</div>
        <div className={`tab ${currentTab === 'group' ? 'active' : ''}`} onClick={() => setCurrentTab('group')} role="tab">グループ</div>
      </div>

      {/* Panel / List */}
      <div className="panel active">
        <div className="list">
          {currentListData.slice(0, shownCount).map((item) => (
            <div className="row" key={`${currentTab}-${item.rank}`}>
              <div className="rank">{renderRankMarker(item.rank)}</div>
              
              {/* === ここを img タグに変更しました === */}
              <img 
                className="avatar" 
                src={item.avatar} 
                alt={`${item.name}のアバター`} 
              />
              
              <div className="info">
                <div className="name">{item.name}</div>
              </div>
              <div className="score">{item.pt.toLocaleString()}<span>pt</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* More button */}
      {hasMore && (
        <div className="more-wrap">
          <button className="more-btn" onClick={handleMoreClick}>
            <span>もっと見る</span>
            <ChevronDownSvg />
          </button>
        </div>
      )}

    </section>
  );
}