export const AVATAR_UPLOADS_PREFIX = "/site/uploads/avatars/";
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export function resolveAvatarUrl(url: string | null | undefined): string | null {
  return url || null;
}

/** Initials fallback shown when a user has no avatar. */
export function avatarInitials(name?: string | null, email?: string | null): string {
  const source = (name || email || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}
