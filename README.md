## 起動方法

①npm install
②npm run dev

## ファイル構成

src ---- app ---- blog_src ⇐ ブログページのコード
↓ ↓
↓ ↓
↓ ↓ ---- music_src ⇐ 音楽配信サイト関連ページのコード（ただし、トップページはapp/page.tsxに実装）
↓
↓ ---- components ⇐ 全ページ共通部分（ヘッダー、フッター、ハンバーガーメニューなど）

## `src/app` のディレクトリ構造

```text
src/app/
├─ page.tsx                    # トップページ（/）
├─ layout.tsx                  # 全ページ共通のレイアウト
├─ globals.css                 # 全ページ共通のスタイル
├─ favicon.ico                 # ファビコン
│
├─ music/
│  ├─ page.tsx                 # 楽曲一覧（/music）
│  └─ [id]/
│     └─ page.tsx              # 楽曲詳細（/music/:id）
│
├─ junior/
│  ├─ page.tsx                 # ジュニア一覧（/junior）
│  └─ [id]/
│     └─ page.tsx              # ジュニア詳細（/junior/:id）
│
├─ blog/
│  ├─ page.tsx                 # ブログ一覧（/blog）
│  └─ [id]/
│     └─ page.tsx              # ブログ詳細（/blog/:id）
│
├─ ranking/
│  └─ page.tsx                 # ランキング（/ranking）
│
├─ contact/
│  └─ page.tsx                 # お問い合わせ（/contact）
│
├─ login/
│  └─ page.tsx                 # ログイン（/login）
│
├─ my/
│  ├─ profile/
│  │  └─ page.tsx              # マイプロフィール（/my/profile）
│  └─ setting/
│     └─ page.tsx              # 設定（/my/setting）
│
└─ support/
   ├─ music-unlock/
   │  └─ page.tsx              # 楽曲解放の案内（/support/music-unlock）
   └─ tip/
      └─ page.tsx              # 使い方・ヒント（/support/tip）

[id] は動的ルートです。たとえば /music/1 にアクセスすると、music/[id]/page.tsx が表示されます。
```

## その他・フロントエンドについて

・css
現状は、globals.cssにまとめる形で良いが、共通部分のcss、音楽サイト関連ページのcss、ブログページのcssのように分けるのもあり。

・js
スライドショーの実装で使用する可能性あり。基本的には1つのjsファイルにまとめる。

・画像データは全てpublic/imagesに格納。publicフォルダはsrcの外に配置済み。
