export const COMMENT_FILTER_MODES = [
  "all",
  "hide_same_oshi",
  "self_only",
] as const;

export type CommentFilterMode = (typeof COMMENT_FILTER_MODES)[number];

export const DEFAULT_COMMENT_FILTER_MODE: CommentFilterMode = "all";
export const PREMIUM_PLAN_MONTHLY_PRICE = 1000;

export const COMMENT_FILTER_LABELS: Record<CommentFilterMode, string> = {
  all: "すべて表示",
  hide_same_oshi: "同担コメントを非表示",
  self_only: "自分のコメントのみ表示",
};

export const COMMENT_FILTER_DESCRIPTIONS: Record<CommentFilterMode, string> = {
  all: "自分と他のユーザーのコメントをすべて表示します。",
  hide_same_oshi:
    "コメント閲覧時点で、自分と同じジュニアを推し登録しているユーザーのコメントを非表示にします。",
  self_only: "自分が投稿したコメントだけを表示します。",
};

export type CommentFilterProfile = {
  comment_filter_mode?: string | null;
  oshi_junior_id?: string | null;
  plan?: { monthly_price?: number | null } | null;
} | null;

export type FilterableComment = {
  user_id: string;
  profiles?: { oshi_junior_id?: string | null } | null;
};

export function isCommentFilterMode(value: unknown): value is CommentFilterMode {
  return (
    typeof value === "string" &&
    COMMENT_FILTER_MODES.includes(value as CommentFilterMode)
  );
}

export function normalizeCommentFilterMode(value: unknown): CommentFilterMode {
  return isCommentFilterMode(value) ? value : DEFAULT_COMMENT_FILTER_MODE;
}

export function isPremiumPlan(monthlyPrice: number | null | undefined) {
  return (monthlyPrice ?? 0) >= PREMIUM_PLAN_MONTHLY_PRICE;
}

export function getEffectiveCommentFilterMode(
  profile: CommentFilterProfile,
): CommentFilterMode {
  if (!isPremiumPlan(profile?.plan?.monthly_price)) {
    return DEFAULT_COMMENT_FILTER_MODE;
  }

  return normalizeCommentFilterMode(profile?.comment_filter_mode);
}

export function filterCommentsForViewer<T extends FilterableComment>({
  comments,
  mode,
  viewerId,
  viewerOshiJuniorId,
}: {
  comments: T[];
  mode: CommentFilterMode;
  viewerId: string | null | undefined;
  viewerOshiJuniorId: string | null | undefined;
}) {
  if (mode === "all" || !viewerId) return comments;

  if (mode === "self_only") {
    return comments.filter((comment) => comment.user_id === viewerId);
  }

  if (!viewerOshiJuniorId) return comments;

  return comments.filter((comment) => {
    if (comment.user_id === viewerId) return true;
    return comment.profiles?.oshi_junior_id !== viewerOshiJuniorId;
  });
}
