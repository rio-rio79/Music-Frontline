export const DEFAULT_MUSIC_COVER_PATH = "default_music_cover.png";

function isResolvedUrl(path: string) {
  return path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/");
}

export function resolveMusicCoverUrl(
  imagePath: string | null | undefined,
  getPublicUrl: (path: string) => string,
) {
  const storagePath = imagePath?.trim() || DEFAULT_MUSIC_COVER_PATH;

  if (isResolvedUrl(storagePath)) {
    return storagePath;
  }

  return getPublicUrl(storagePath);
}
