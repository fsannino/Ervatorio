import Link from 'next/link';
import { Briefcase, FlaskConical, GraduationCap, type LucideProps } from 'lucide-react';
import { tresPilares } from '@/lib/data/static';
import { FadeInSection } from '@/components/shared/FadeInSection';

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  Briefcase,
  FlaskConical,
  GraduationCap,
};

export function TresPilares() {
  return (
    <section className="py-20" style={{ background: 'var(--color-chalk)' }}>
      <div className="container-site">
        <div className="text-center mb-12">
          <p
            className="text-xs uppercase tracking-widest mb-3"
            style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-dm-sans)' }}
          >
            Quem sou eu
          </p>
          <h2 className="text-3xl md:text-4xl" style={{ fontFamily: 'var(--font-playfair)' }}>
            Três dimensões, uma missão
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tresPilares.map((pilar, i) => {
            const Icon = iconMap[pilar.icon];
            return (
              <FadeInSection key={pilar.title} delay={i * 0.1}>
                <div
                  className="p-8 rounded border flex flex-col gap-4"
                  style={{ borderColor: 'var(--color-rule)', background: 'var(--color-paper)' }}
                >
                  <div
                    className="w-10 h-10 rounded flex items-center justify-center"
                    style={{ background: 'var(--color-gold)', color: 'var(--color-ink)' }}
                  >
                    {Icon && <Icon size={20} strokeWidth={1.5} />}
                  </div>

                  <div>
                    <p
                      className="text-4xl font-bold leading-none mb-1"
                      style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-gold)' }}
                    >
                      {pilar.stats}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-footnote)', fontFamily: 'var(--font-dm-sans)' }}>
                      {pilar.statsLabel}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl mb-2" style={{ fontFamily: 'var(--font-spectral)' }}>
                      {pilar.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-footnote)' }}>
                      {pilar.description}
                    </p>
                  </div>

                  <Link
                    href={pilar.href}
                    className="mt-auto text-sm font-medium transition-colors hover:text-academic"
                    style={{ color: 'var(--color-academic)', fontFamily: 'var(--font-dm-sans)' }}
                  >
                    Ver mais →
                  </Link>
                </div>
              </FadeInSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}
