import Link from 'next/link';
import { latestArticles } from '@/lib/data/static';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FadeInSection } from '@/components/shared/FadeInSection';

export function UltimosArtigos() {
  return (
    <section className="py-20" style={{ background: 'var(--color-paper)' }}>
      <div className="container-site">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p
              className="text-xs uppercase tracking-widest mb-2"
              style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-dm-sans)' }}
            >
              Do blog
            </p>
            <h2 className="text-3xl" style={{ fontFamily: 'var(--font-playfair)' }}>
              Últimos artigos
            </h2>
          </div>
          <Link
            href="/blog"
            className="hidden sm:inline text-sm transition-colors hover:text-academic"
            style={{ color: 'var(--color-footnote)', fontFamily: 'var(--font-dm-sans)' }}
          >
            Ver todos →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {latestArticles.map((article, i) => (
            <FadeInSection key={article.slug} delay={i * 0.1}>
              <Link href={article.href} className="block h-full group">
                <Card className="h-full flex flex-col transition-shadow hover:shadow-card">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline">{article.category}</Badge>
                      <span
                        className="text-xs"
                        style={{ color: 'var(--color-footnote)', fontFamily: 'var(--font-dm-sans)' }}
                      >
                        {article.readingTimeMinutes} min
                      </span>
                    </div>
                    <CardTitle className="group-hover:text-academic transition-colors leading-snug">
                      {article.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 pt-3">
                    <CardDescription className="leading-relaxed">{article.excerpt}</CardDescription>
                  </CardContent>
                  <CardFooter>
                    <time
                      dateTime={article.publishedAt}
                      className="text-xs"
                      style={{ color: 'var(--color-footnote)', fontFamily: 'var(--font-dm-sans)' }}
                    >
                      {formatDate(article.publishedAt)}
                    </time>
                  </CardFooter>
                </Card>
              </Link>
            </FadeInSection>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/blog"
            className="text-sm"
            style={{ color: 'var(--color-academic)', fontFamily: 'var(--font-dm-sans)' }}
          >
            Ver todos os artigos →
          </Link>
        </div>
      </div>
    </section>
  );
}
