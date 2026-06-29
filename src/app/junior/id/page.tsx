"use client";

import { useState } from "react";
import "../../globals.css";


export default function Page() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <>
      

      <main className="idol-detail-page">
        {/* タブ */}
        <section className="idol-tab">
          <button
            className={activeTab === "profile" ? "active" : ""}
            onClick={() => setActiveTab("profile")}
          >
            プロフィール
          </button>

          <button
            className={activeTab === "blog" ? "active" : ""}
            onClick={() => setActiveTab("blog")}
          >
            ブログ
          </button>
        </section>

        {activeTab === "profile" && (
          <>
            {/* プロフィール */}
            <section className="idol-profile-card">
              <div className="idol-image">
                <img src="/images/sample①.jpg" alt="アイドル画像" />
              </div>

              <div className="idol-info">
                <h1>苗字　名前</h1>
                <p className="idol-english-name">Namae Myouji</p>

                <div className="idol-detail-list">
                  <p>
                    <span>入所日</span>
                    2021/6/26
                  </p>

                  <p>
                    <span>誕生日</span>
                    2010/5/21
                  </p>

                  <p>
                    <span>身長</span>
                    183cm
                    <span className="second-label">出身地</span>
                    東京都
                  </p>

                  <p>
                    <span>所属</span>
                    関西ジュニア
                  </p>

                  <p>
                    <span>キャッチフレーズ</span>
                  </p>
                </div>
              </div>
            </section>

            {/* MUSIC */}
            <section className="music-section">
              <h2>MUSIC</h2>

              <div className="music-list">
                {[1, 2, 3, 4].map((item) => (
                  <div className="music-card" key={item}>
                    <div className="music-thumbnail">
                      <img src="/images/sample②.jpg" alt="楽曲画像" />
                    </div>

                    <div className="music-text">
                      <h3>楽曲のタイトル</h3>
                      <p>歌手</p>
                    </div>

                    <button className="play-button">▶</button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {activeTab === "blog" && (
          <section className="blog-section">
            <h2 className="blog-title">BLOG</h2>

            <div className="blog-list">
              {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                <div className="blog-card" key={item}>
                  <img src="/images/sample③.jpg" className="blog-image" />

                  <div className="blog-text">
                    <h3>ブログタイトル</h3>
                    <p>日付</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="blog-pagination">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>・・・</span>
              <span>&gt;</span>
              <span>&gt;&gt;</span>
            </div>
          </section>
        )}
      </main>

      <style jsx>{`
     

.idol-detail-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 20px 100px;
}

.idol-tab {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.idol-tab button {
  width: 360px;
  height: 56px;
  border: none;
  border-bottom: 2px solid #d9d9d9;
  background: transparent;
  font-size: 40px;
  cursor: pointer;
}

.idol-tab button.active {
  border-bottom: 2px solid #000;
}


.idol-profile-card {
  border: 1px solid #222;
  padding: 40px;
  display: flex;
  gap: 50px;
  margin-bottom: 80px;
  background: white;
}

.idol-image {
  width: auto;
  height: 500px;
  flex-shrink: 0;
  overflow: hidden;
  background: #ececec;
  margin-right: 100px;
}

.idol-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.idol-info {
  flex: 1;
}

.idol-info h1 {
  font-size: 54px;
  margin-bottom: 10px;
  font-weight: 500;
}

.idol-english-name {
  font-size: 20px;
  margin-bottom: 40px;
}

.idol-detail-list p {
  font-size: 22px;
  margin-bottom: 15px;
  line-height: 1.7;
}

.idol-detail-list span {
  display: inline-block;
  width: 110px;
  font-weight: 500;
}

.second-label {
  width: auto !important;
  margin-left: 50px;
  margin-right: 20px;
}


.music-section h2 {
  text-align: center;
  font-size: 56px;
  font-weight: 500;
  margin-bottom: 40px;
}

.music-list {
  max-width: 900px;
  margin: 0 auto;
}

.music-card {
  display: flex;
  align-items: center;
  border: 1px solid #222;
  min-height: 140px;
  padding: 20px;
}

.music-thumbnail {
  width: 120px;
  height: 120px;
  border-radius: 18px;
  overflow: hidden;
  background: #ececec;
  flex-shrink: 0;
}

.music-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.music-text {
  margin-left: 30px;
  flex: 1;
}

.music-text h3 {
  font-size: 28px;
  margin-bottom: 10px;
  font-weight: 500;
}

.music-text p {
  font-size: 22px;
}

.play-button {
  width: 70px;
  height: 70px;
  border: none;
  background: transparent;
  font-size: 40px;
  color: #d9d9d9;
  cursor: pointer;
}

/* ==========================
   BLOG
========================== */

.blog-section {
  text-align: center;
  font-size: 30px;
  font-weight: 500;
  margin-bottom: 40px;
}

.blog-title {
  text-align: center;
  font-size: 40px;
  font-weight: 500;
  margin-bottom: 35px;
}


.blog-card{
    display:flex;
    align-items:center;

    height:140px;

    border:1px solid #222;
}

.blog-image{
    width:120px;
    height:120px;

    margin-left:20px;

    object-fit:cover;

    border-radius:18px;

    flex-shrink:0;
}

.blog-text{
    margin-left:30px;
}

.blog-text h3{
    font-size:30px;
    margin-bottom:10px;
}

.blog-text p{
    font-size:22px;
}

.blog-pagination{
    margin-top:30px;
    font-size:22px;
    letter-spacing: 1.5em;
    }


/* ==========================
   レスポンシブ
========================== */

@media (max-width: 768px) {
  .idol-profile-card {
    flex-direction: column;
    align-items: center;
  }

  .idol-image {
    width: 220px;
    height: 300px;
  }

  .idol-info h1 {
    font-size: 38px;
  }

  .idol-tab button {
    font-size: 28px;
    width: 50%;
  }

  .music-section h2 {
    font-size: 40px;
  }

  .music-text h3 {
    font-size: 22px;
  }

  .music-text p {
    font-size: 18px;
  }
  
}
    `}</style>
      
    </>
  );
}