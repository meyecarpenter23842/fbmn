import type {MetadataRoute} from "next";

// Only the public website is crawlable; private APIs and back-office URLs are not.
export default function robots():MetadataRoute.Robots {
 return {
  rules:{userAgent:"*",allow:"/",disallow:["/api/","/admin/","/ceo/"]},
  sitemap:"https://www.fbmn.vn/sitemap.xml",
 };
}
