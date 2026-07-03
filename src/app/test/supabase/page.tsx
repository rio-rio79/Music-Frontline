/**
 * ============================================================
 * Supabase 接続テスト & データ取得サンプルページ
 * ============================================================
 *
 * ■ URL: http://localhost:3000/test/supabase
 *
 * ■ このファイルの目的:
 *   1. Supabase への接続が正しく動作するか確認する
 *   2. フロントエンドでのデータ取得パターンのサンプルコードとして参照する
 *
 * ■ セットアップ手順（初回のみ）:
 *   1. `npm install` を実行（@supabase/supabase-js が入る）
 *   2. `.env.example` をコピーして `.env.local` を作成
 *      $ cp .env.example .env.local
 *   3. `.env.local` に Supabase の URL と Publishable Key を記入
 *   4. `npm run dev` で開発サーバーを起動
 *
 * ■ Supabase クライアントの使い方:
 *   - `@/lib/supabase` から `supabase` をインポートするだけでOK
 *   - 型は自動的に効くので、テーブル名やカラム名はエディタ補完が使える
 *
 * ■ よく使うクエリパターン（コピペして使ってください）:
 *
 *   // ── 全件取得 ──
 *   const { data, error } = await supabase.from('songs').select('*')
 *
 *   // ── 条件付き取得 ──
 *   const { data, error } = await supabase
 *     .from('juniors')
 *     .select('*')
 *     .eq('group_id', 'some-uuid')         // WHERE group_id = 'some-uuid'
 *
 *   // ── 並び替え＆件数制限 ──
 *   const { data, error } = await supabase
 *     .from('songs')
 *     .select('*')
 *     .order('published_at', { ascending: false })  // 新しい順
 *     .limit(10)                                     // 10件まで
 *
 *   // ── リレーション（JOINのようなもの）──
 *   const { data, error } = await supabase
 *     .from('blog_posts')
 *     .select(`
 *       *,
 *       juniors ( name, image_path )
 *     `)
 *     // → data[0].juniors.name のようにアクセスできる
 *
 *   // ── 1件取得 ──
 *   const { data, error } = await supabase
 *     .from('songs')
 *     .select('*')
 *     .eq('id', songId)
 *     .single()                             // 1件だけ返す（配列ではなくオブジェクト）
 *
 *   // ── 件数のみ取得（データ本体は不要な場合）──
 *   const { count, error } = await supabase
 *     .from('songs')
 *     .select('*', { count: 'exact', head: true })
 *
 *   // ── RPC関数の呼び出し ──
 *   await supabase.rpc('increment_play_count', { song_id: 'some-uuid' })
 *
 *   // ── 型のインポート（必要に応じて）──
 *   import type { Tables } from '@/types/database.types'
 *   type Song = Tables<'songs'>       // songs テーブルの Row 型
 *   type Junior = Tables<'juniors'>   // juniors テーブルの Row 型
 */
import { supabase } from '@/lib/supabase'

export default async function SupabaseTestPage() {
  // ──────────────────────────────────────────────────────
  // 【パターン1】全件取得 + ソート
  // supabase.from('テーブル名').select('*') が基本形
  // .order() で並び替え、.limit() で件数制限ができる
  // ──────────────────────────────────────────────────────
  const { data: plans, error: plansError } = await supabase
    .from('plans')
    .select('*')
    .order('monthly_price', { ascending: true })

  // ──────────────────────────────────────────────────────
  // 【パターン2】件数のみ取得（head: true でデータ本体を返さない）
  // ダッシュボードやバッジ表示などで使える
  // ──────────────────────────────────────────────────────
  const tables = [
    'plans', 'groups', 'juniors', 'profiles', 'songs',
    'song_juniors', 'song_likes', 'song_comments',
    'blog_posts', 'blog_likes', 'blog_comments',
    'support_payments', 'support_point_logs', 'ranking_scores',
  ] as const

  const counts = await Promise.all(
    tables.map(async (table) => {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      return { table, count: count ?? 0, error: error?.message ?? null }
    })
  )

  // ──────────────────────────────────────────────────────
  // 以下はテスト結果の表示用UI（参考にしなくてOK）
  // ──────────────────────────────────────────────────────
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ borderBottom: '2px solid #333', paddingBottom: '0.5rem' }}>
        🔌 Supabase 接続テスト
      </h1>

      {/* 接続ステータス */}
      <section style={{ marginTop: '1.5rem' }}>
        <h2>接続ステータス</h2>
        {plansError ? (
          <p style={{ color: 'red', fontWeight: 'bold' }}>
            ❌ 接続失敗: {plansError.message}
          </p>
        ) : (
          <p style={{ color: 'green', fontWeight: 'bold' }}>
            ✅ 接続成功
          </p>
        )}
      </section>

      {/* Plans テーブルのデータ */}
      <section style={{ marginTop: '1.5rem' }}>
        <h2>📋 plans テーブル ({plans?.length ?? 0} 件)</h2>
        {plans && plans.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={thStyle}>name</th>
                <th style={thStyle}>monthly_price</th>
                <th style={thStyle}>point_multiplier</th>
                <th style={thStyle}>id</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id}>
                  <td style={tdStyle}>{plan.name}</td>
                  <td style={tdStyle}>¥{plan.monthly_price}</td>
                  <td style={tdStyle}>x{plan.point_multiplier}</td>
                  <td style={{ ...tdStyle, fontSize: '0.75rem', color: '#888' }}>
                    {plan.id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>データなし</p>
        )}
      </section>

      {/* 全テーブル件数 */}
      <section style={{ marginTop: '1.5rem' }}>
        <h2>📊 全テーブル件数</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={thStyle}>テーブル名</th>
              <th style={thStyle}>件数</th>
              <th style={thStyle}>ステータス</th>
            </tr>
          </thead>
          <tbody>
            {counts.map(({ table, count, error }) => (
              <tr key={table}>
                <td style={tdStyle}>{table}</td>
                <td style={tdStyle}>{count}</td>
                <td style={tdStyle}>
                  {error ? (
                    <span style={{ color: 'red' }}>❌ {error}</span>
                  ) : (
                    <span style={{ color: 'green' }}>✅</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer style={{ marginTop: '2rem', color: '#999', fontSize: '0.8rem' }}>
        このページは動作確認用です。確認後に削除してください。
      </footer>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '0.5rem',
  textAlign: 'left',
  borderBottom: '1px solid #ddd',
}

const tdStyle: React.CSSProperties = {
  padding: '0.5rem',
  borderBottom: '1px solid #eee',
}
