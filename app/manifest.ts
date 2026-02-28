import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Null Chat',
    short_name: 'NullChat',
    description: 'Realtime AI Chat',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
