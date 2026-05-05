import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Fabiano Sannino',
    short_name: 'Sannino',
    description: 'Hub acadêmico e profissional de Fabiano Sannino — Gestão da Mudança, Pesquisa Aplicada e Metodologia.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F5F0E8',
    theme_color: '#1A1A2E',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
