import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const STATIC_PATHS: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/featured", priority: 0.7, changeFrequency: "weekly" },
  { path: "/search", priority: 0.5, changeFrequency: "weekly" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
  { path: "/shipping", priority: 0.4, changeFrequency: "monthly" },
  { path: "/stay-connected", priority: 0.4, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((s) => ({
    url: `${base}${s.path}`,
    lastModified: now,
    changeFrequency: s.changeFrequency,
    priority: s.priority,
  }));

  try {
    const [products, categories, industries] = await Promise.all([
      prisma.product.findMany({
        where: { status: "ACTIVE" },
        select: { slug: true, updatedAt: true },
      }),
      prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
      prisma.industry.findMany({ select: { slug: true, updatedAt: true } }),
    ]);

    for (const p of products) {
      entries.push({
        url: `${base}/products/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
    for (const c of categories) {
      entries.push({
        url: `${base}/categories/${c.slug}`,
        lastModified: c.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    for (const i of industries) {
      entries.push({
        url: `${base}/industries/${i.slug}`,
        lastModified: i.updatedAt,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch {
    // Database unavailable (e.g. during build) — return static entries only.
  }

  return entries;
}
