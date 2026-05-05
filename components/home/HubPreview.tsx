import Link from 'next/link';
import { BookOpen, Scale, Layers, Compass, type LucideProps } from 'lucide-react';
import { hubCards } from '@/lib/data/static';
import { Badge } from '@/components/ui/badge';
import { FadeInSection } from '@/components/shared/FadeInSection';

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  BookOpen,
  Scale,
  Layers,
  Compass,
};

export function HubPreview() {
  return (
    <section className="py-20" style={{ background: 'var(--color-paper)' }}>
      <div className="container-site">
        <div className="text-center mb-12">
          <p
            className="text-xs uppercase tracking-widest mb-3"
            style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-dm-sans)' }}
          >
            Para pesquisadores e educadores
          </p>
          <h2 className="text-3xl md:text-4xl mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>
            Hub Acadêmico
          </h2>
          <p
            className="max-w-xl mx-auto text-base"
            style={{ color: 'var(--color-footnote)', fontFamily: 'var(--font-source-serif)' }}
          >
            Metodologia, ética e ferramentas para pesquisadores de todas as áreas.
            Conteúdo gratuito, materiais exclusivos mediante cadastro.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {hubCards.map((card, i) => {
            const Icon = iconMap[card.icon];
            return (
              <FadeInSection key={card.id} delay={i * 0.08}>
                <Link
                  href={card.href}
                  className="group flex flex-col gap-4 p-6 rounded border transition-all hover:shadow-card hover:-translate-y-0.5"
                  style={{
                    borderColor: 'var(--color-rule)',
                    background: 'var(--color-chalk)',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="w-10 h-10 rounded flex items-center justify-center"
                      style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--color-gold)' }}
                    >
                      {Icon && <Icon size={18} strokeWidth={1.5} />}
                    </div>
                    {card.badge && (
                      <Badge variant="gold" className="text-xs">
                        {card.badge}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h3
                      className="text-base mb-1 group-hover:text-academic transition-colors"
                      style={{ fontFamily: 'var(--font-spectral)' }}
                    >
                      {card.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-footnote)' }}>
                      {card.description}
                    </p>
                  </div>
                </Link>
              </FadeInSection>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/academico"
            className="inline-flex items-center gap-2 px-6 py-3 rounded text-sm font-medium border transition-colors hover:bg-ink hover:text-paper hover:border-ink"
            style={{
              borderColor: 'var(--color-ink)',
              color: 'var(--color-ink)',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            Explorar o Hub Acadêmico →
          </Link>
        </div>
      </div>
    </section>
  );
}
