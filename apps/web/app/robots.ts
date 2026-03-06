import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.stockpulse.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/auth/login", "/auth/signup"],
        disallow: [
          "/dashboard",
          "/products",
          "/product-packages",
          "/product-categories",
          "/stock",
          "/sales",
          "/stores",
          "/suppliers",
          "/customers",
          "/users",
          "/permissions",
          "/attributes",
          "/reports",
          "/chat",
          "/auth/callback",
          "/auth/forgot-password",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
