import type { ApprovedMedia } from "./r2";

/**
 * ZERO assets are approved for website use today.
 * Future Web Admin must publish metadata atomically via Workers API/Neon.
 * Never put mockup images or internal pricing PDFs here.
 */
export const approvedSiteMedia: Readonly<{
  brandLogo: ApprovedMedia | null;
  heroBanner: ApprovedMedia | null;
}> = {
  brandLogo: null,
  heroBanner: null,
};
