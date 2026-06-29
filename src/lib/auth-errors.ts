/**
 * Supabase Authのエラーメッセージを分かりやすい日本語に翻訳するヘルパー
 */
export function translateAuthError(message: string): string {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes('invalid login credentials')) {
        return 'メールアドレスまたはパスワードが正しくありません。'
    }
    if (lowerMessage.includes('user already registered') || lowerMessage.includes('email already in use')) {
        return 'このメールアドレスは既に登録されています。'
    }
    if (lowerMessage.includes('password should be at least')) {
        return 'パスワードは6文字以上で入力してください。'
    }
    if (lowerMessage.includes('email address is invalid') || lowerMessage.includes('unable to validate email address')) {
        return '無効なメールアドレス形式です。'
    }
    if (lowerMessage.includes('email not confirmed')) {
        return 'メールアドレスが確認されていません。メール内の確認リンクをクリックしてください。'
    }
    if (lowerMessage.includes('rate limit')) {
        return '短時間に多くのリクエストが送信されました。しばらく時間を置いてから再度お試しください。'
    }

    // デフォルトは元のメッセージか汎用メッセージ
    return message || '認証エラーが発生しました。'
}
