export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string; // ISO date
  readingTimeMinutes: number;
  href: string;
}

export interface Service {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  icon: string; // Lucide icon name
}

export interface HubCard {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string; // Lucide icon name
  badge?: string;
}

export interface Credencial {
  code: string;
  label: string;
  issuer: string;
}

export interface Pilar {
  title: string;
  description: string;
  stats: string;
  statsLabel: string;
  icon: string; // Lucide icon name
  href: string;
}

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}
