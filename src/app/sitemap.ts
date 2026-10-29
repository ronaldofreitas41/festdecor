import type { MetadataRoute } from "next";
import { getPublishedProjects } from "@/lib/data/public";
import { SITE } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getPublishedProjects();
  return [
    { url: `${SITE.url}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/portfolio`, changeFrequency: "weekly", priority: 0.8 },
    ...projects.map((p) => ({ url: `${SITE.url}/portfolio/${p.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
