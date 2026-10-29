/**
 * App Store destinations are intentionally unset until the project owner
 * confirms actual iOS and Android listing URLs. No demo or redirect URLs.
 * Publishing through Admin can later replace this configuration.
 */
export type AppPlatform = "ios" | "android";
export const appStoreLinks: Readonly<Record<AppPlatform, string | null>> = {
  ios: null,
  android: null,
};

export function getAppStoreLink(platform: AppPlatform): string | null {
  const raw = appStoreLinks[platform];
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    if (platform === "ios" && url.hostname !== "apps.apple.com") return null;
    if (platform === "android" &&
        (url.hostname !== "play.google.com" || !url.pathname.startsWith("/store/apps/details"))) return null;
    return url.toString();
  } catch {
    return null;
  }
}
