# MUSIC FRONTLINE ER図・テーブル関連図

## ER図

```mermaid
erDiagram
    plans {
        uuid id PK
        text name
        int monthly_price
        numeric oshi_point_multiplier
        timestamptz created_at
        timestamptz updated_at
    }

    groups {
        uuid id PK
        text name
        text description
        text image_path
        timestamptz created_at
        timestamptz updated_at
    }

    juniors {
        uuid id PK
        text name
        text profile
        text catchphrase
        date birth_date
        text image_path
        uuid group_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    profiles {
        uuid id PK
        text name
        uuid plan_id FK
        uuid oshi_junior_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    songs {
        uuid id PK
        text title
        text audio_path
        text image_path
        int play_count
        timestamptz published_at
        timestamptz created_at
        timestamptz updated_at
    }

    song_juniors {
        uuid id PK
        uuid song_id FK
        uuid junior_id FK
        uuid group_id FK
        timestamptz created_at
    }

    song_likes {
        uuid id PK
        uuid user_id FK
        uuid song_id FK
        timestamptz created_at
    }

    song_comments {
        uuid id PK
        uuid user_id FK
        uuid song_id FK
        text body
        timestamptz created_at
        timestamptz updated_at
    }

    blog_posts {
        uuid id PK
        uuid junior_id FK
        text title
        text body
        int view_count
        timestamptz published_at
        timestamptz created_at
        timestamptz updated_at
    }

    blog_likes {
        uuid id PK
        uuid user_id FK
        uuid blog_posts_id FK
        timestamptz created_at
    }

    blog_comments {
        uuid id PK
        uuid user_id FK
        uuid blog_posts_id FK
        text body
        timestamptz created_at
        timestamptz updated_at
    }

    support_payments {
        uuid id PK
        uuid user_id FK
        uuid junior_id FK
        int amount
        text message
        timestamptz created_at
    }

    support_point_logs {
        uuid id PK
        uuid user_id FK
        uuid junior_id FK
        text action_type
        int points
        text source_type
        uuid source_id
        timestamptz created_at
    }

    ranking_scores {
        uuid id PK
        uuid junior_id FK
        text category
        int score
        int play_points
        int blog_view_points
        int like_points
        int comment_points
        int oshi_points
        int payment_points
        timestamptz calculated_at
        timestamptz created_at
        timestamptz updated_at
    }

    %% ── リレーション ──

    plans            ||--o{ profiles         : "plan_id"
    juniors          ||--o{ profiles         : "oshi_junior_id"
    groups           ||--o{ juniors          : "group_id"

    songs            ||--o{ song_juniors     : "song_id"
    juniors          ||--o{ song_juniors     : "junior_id"
    groups           ||--o{ song_juniors     : "group_id"

    profiles         ||--o{ song_likes       : "user_id"
    songs            ||--o{ song_likes       : "song_id"

    profiles         ||--o{ song_comments    : "user_id"
    songs            ||--o{ song_comments    : "song_id"

    juniors          ||--o{ blog_posts       : "junior_id"

    profiles         ||--o{ blog_likes       : "user_id"
    blog_posts       ||--o{ blog_likes       : "blog_posts_id"

    profiles         ||--o{ blog_comments    : "user_id"
    blog_posts       ||--o{ blog_comments    : "blog_posts_id"

    profiles         ||--o{ support_payments : "user_id"
    juniors          ||--o{ support_payments : "junior_id"

    profiles         ||--o{ support_point_logs : "user_id"
    juniors          ||--o{ support_point_logs : "junior_id"

    juniors          ||--o{ ranking_scores   : "junior_id"
```

## テーブル関連図（簡易版）

全体像をざっくり把握するための簡易図です。

```mermaid
flowchart LR
    subgraph 認証・ユーザー
        AUTH["auth.users<br/>(Supabase Auth)"]
        PROF[profiles]
        PLAN[plans]
    end

    subgraph アーティスト
        GRP[groups]
        JR[juniors]
    end

    subgraph 楽曲
        SONG[songs]
        SJ[song_juniors]
        SL[song_likes]
        SC[song_comments]
    end

    subgraph ブログ
        BP[blog_posts]
        BL[blog_likes]
        BC[blog_comments]
    end

    subgraph 応援・ランキング
        SP[support_payments]
        SPL[support_point_logs]
        RS[ranking_scores]
    end

    AUTH -->|トリガーで自動作成| PROF
    PLAN -->|plan_id| PROF
    JR -->|oshi_junior_id| PROF
    GRP -->|group_id| JR

    SONG --- SJ --- JR
    PROF -->|user_id| SL
    SONG -->|song_id| SL
    PROF -->|user_id| SC
    SONG -->|song_id| SC

    JR -->|junior_id| BP
    PROF -->|user_id| BL
    BP -->|blog_posts_id| BL
    PROF -->|user_id| BC
    BP -->|blog_posts_id| BC

    PROF -->|user_id| SP
    JR -->|junior_id| SP
    PROF -->|user_id| SPL
    JR -->|junior_id| SPL
    JR -->|junior_id| RS
```

## テーブル一覧（用途別）

| カテゴリ | テーブル | 説明 |
|---|---|---|
| **マスタ** | `plans` | 課金プラン（フリー/スタンダード/プレミアム） |
| **マスタ** | `groups` | グループ |
| **マスタ** | `juniors` | ジュニア（アーティスト） |
| **ユーザー** | `profiles` | ユーザープロフィール（auth.users と 1:1） |
| **楽曲** | `songs` | 楽曲 |
| **楽曲** | `song_juniors` | 楽曲 ↔ ジュニア 中間テーブル |
| **楽曲** | `song_likes` | 楽曲いいね（UNIQUE: user_id + song_id） |
| **楽曲** | `song_comments` | 楽曲コメント |
| **ブログ** | `blog_posts` | ブログ記事 |
| **ブログ** | `blog_likes` | ブログいいね（UNIQUE: user_id + blog_posts_id） |
| **ブログ** | `blog_comments` | ブログコメント |
| **応援** | `support_payments` | 応援課金（投げ銭） |
| **応援** | `support_point_logs` | 応援ポイントログ |
| **ランキング** | `ranking_scores` | ランキングスコア（UNIQUE: junior_id + category） |

## RPC 関数

| 関数名 | 引数 | 説明 |
|---|---|---|
| `increment_play_count` | `song_id: uuid` | 楽曲の再生回数を +1（競合安全） |
| `increment_blog_view` | `blog_id: uuid` | ブログの閲覧数を +1（競合安全） |

## トリガー

| トリガー名 | 対象 | タイミング | 説明 |
|---|---|---|---|
| `on_auth_user_created` | `auth.users` | AFTER INSERT | 新規ユーザー登録時に `profiles` を自動作成 |
