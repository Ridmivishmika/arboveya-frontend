import { MetadataRoute } from "next";
import { getProducts, getPublishedBlogs } from "@/lib/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rawBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://arboveya.com";
  const baseUrl = rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
  const now = new Date();

  // 1. Static Core Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms-and-conditions`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // 2. Dynamic Product Pages
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await getProducts();
    if (Array.isArray(products)) {
      productRoutes = products
        .filter((p) => p && p.id && (!p.approvalStatus || p.approvalStatus === "Approved"))
        .map((product) => {
          const dateStr = product.updatedAt || product.createdAt;
          const parsedDate = dateStr ? new Date(dateStr) : now;
          const validDate = isNaN(parsedDate.getTime()) ? now : parsedDate;

          return {
            url: `${baseUrl}/shop/${product.id}`,
            lastModified: validDate,
            changeFrequency: "weekly" as const,
            priority: 0.8,
          };
        });
    }
  } catch (error) {
    console.warn("Failed to generate dynamic product sitemap entries:", error);
  }

  // 3. Dynamic Blog Pages
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const blogs = await getPublishedBlogs();
    if (Array.isArray(blogs)) {
      blogRoutes = blogs
        .filter((b) => b && b.id && (b.isPublished !== false) && (b.isApproved !== false))
        .map((blog) => {
          const dateStr = blog.updatedAt || blog.createdAt;
          const parsedDate = dateStr ? new Date(dateStr) : now;
          const validDate = isNaN(parsedDate.getTime()) ? now : parsedDate;

          return {
            url: `${baseUrl}/blog/${blog.id}`,
            lastModified: validDate,
            changeFrequency: "weekly" as const,
            priority: 0.7,
          };
        });
    }
  } catch (error) {
    console.warn("Failed to generate dynamic blog sitemap entries:", error);
  }

  return [...staticRoutes, ...productRoutes, ...blogRoutes];
}
