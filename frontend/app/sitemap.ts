import { MetadataRoute } from 'next';

const BASE_URL = 'https://learn.knowlyticshub.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/courses`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/community`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ];

  // Fetch published courses dynamically
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`, {
      next: { revalidate: 3600 }, // revalidate every hour
    });
    if (res.ok) {
      const data = await res.json();
      const courses = Array.isArray(data) ? data : (data.courses || []);
      const coursePages: MetadataRoute.Sitemap = courses
        .filter((c: any) => c.is_published)
        .map((course: any) => ({
          url: `${BASE_URL}/courses/${course.id}`,
          lastModified: new Date(course.updated_at || course.created_at || Date.now()),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }));
      return [...staticPages, ...coursePages];
    }
  } catch {
    // fallback to static pages only
  }

  return staticPages;
}
