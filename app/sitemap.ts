import type { MetadataRoute } from 'next'

const siteUrl = 'https://evorupa.pages.dev'

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/map', '/report', '/auth/login', '/auth/signup']
  const now = new Date()

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === '' || route === '/map' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.7,
  }))
}
