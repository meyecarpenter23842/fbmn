/** Official profile destinations supplied or pending project-owner confirmation. */
export type SocialPlatform = "facebook" | "youtube" | "tiktok";
export type FooterSocialProfile = {
  platform: SocialPlatform;
  name: string;
  url: string | null;
};
export const footerSocialProfiles: readonly FooterSocialProfile[] = [
  { platform: "facebook", name: "Facebook", url: "https://www.facebook.com/futurebook.miennam" },
  { platform: "youtube", name: "YouTube", url: null },
  { platform: "tiktok", name: "TikTok", url: null },
];
/** Reject unsupported destinations before adding real social URLs. */
export function getVerifiedSocialUrl(profile: FooterSocialProfile): string | null {
  if (!profile.url) return null;
  try {
    const url = new URL(profile.url);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    const domains: Record<SocialPlatform, readonly string[]> = {
      facebook: ["facebook.com", "www.facebook.com"],
      youtube: ["youtube.com", "www.youtube.com", "youtu.be"],
      tiktok: ["tiktok.com", "www.tiktok.com"],
    };
    if (!domains[profile.platform].includes(url.hostname)) return null;
    return url.href;
  } catch {
    return null;
  }
}
