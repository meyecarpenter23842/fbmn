import type {MetadataRoute} from "next";

// Only the public website is crawlable; private APIs and back-office URLs are not.
export default function robots():MetadataRoute.Robots {
 return {
  rules:{userAgent:"*",
   // Public product images, editorial covers and catalogue media must remain crawlable.
   allow:["/","/api/catalogue-image/","/api/cms-image","/api/catalogue-books"],
   disallow:["/api/","/admin/","/ceo/"]},
  sitemap:"https://www.fbmn.vn/sitemap.xml",
 };
}
