import { footerSocialProfiles, getVerifiedSocialUrl } from "@/lib/content/social-profiles";
import type { SocialPlatform } from "@/lib/content/social-profiles";

/** Official social network brand vector silhouettes, from Simple Icons (CC0). */
const brandPaths: Readonly<Record<SocialPlatform, string>> = {
  "facebook": "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z",
  "youtube": "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  "tiktok": "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"
};

function SocialBrandIcon({ platform }: { platform: SocialPlatform }) {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true" focusable="false">
    <path d={brandPaths[platform]} />
  </svg>;
}

export function FooterSocialLinks() {
  return <div className="site-footer__social" aria-label="Mạng xã hội Futurebook Miền Nam">
    <strong className="site-footer__social-title">Kết nối với chúng tôi</strong>
    <div className="site-footer__social-list">
      {footerSocialProfiles.map(profile => {
        const href = getVerifiedSocialUrl(profile);
        const className = "site-footer__social-icon site-footer__social-icon--" + profile.platform;
        return href ? (
          <a
            key={profile.platform}
            className={className}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={profile.name + " Futurebook Miền Nam (mở tab mới)"}
            title={profile.name + " Futurebook Miền Nam"}
          ><SocialBrandIcon platform={profile.platform}/></a>
        ) : (
          <span
            key={profile.platform}
            role="img"
            aria-label={profile.name + " — sắp cập nhật đường dẫn"}
            title={profile.name + " — sắp cập nhật"}
            className={className + " site-footer__social-icon--pending"}
          ><SocialBrandIcon platform={profile.platform}/></span>
        );
      })}
    </div>
  </div>;
}
