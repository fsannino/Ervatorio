import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRightLeft, Building2, LayoutDashboard, Merge, FlaskConical, Check, type LucideProps,
} from 'lucide-react';
import { services } from '@/lib/data/static';
import { FadeInSection } from '@/components/shared/FadeInSection';

export const metadata: Metadata = {
  title: 'Serviços',
  description:
    'Consultoria em Gestão da Mudança, Transformação Organizacional, PMO, Integração M&A e Research-as-a-Service com Fabiano Sannino — MCMP™ CCMP™.',
};

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  ArrowRightLeft,
  Building2,
  LayoutDashboard,
  Merge,
  FlaskConical,
};

export default function ServicosPage() {
  return (
    <>
      {/* Hero interno */}
      <section className="py-16 border-b" style={{ background: 'var(--color-chalk)', borderColor: 'var(--color-rule)' }}>
        <div className="container-site">
          <nav className="text-xs mb-6" style={{ color: 'var(--color-footnote)', fontFamily: 'var(--font-dm-sans)' }}>
            <Link href="/" className="hover:underline">Home</Link>
            <span className="mx-2">›</span>
            <span>Serviços</span>
          </nav>
          <div className="max-w-2xl">
            <p
              className="text-xs uppercase tracking-widest mb-4"
              style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-dm-sans)' }}
            >
              O que eu faço
            </p>
            <h1 className="text-4xl md:text-5xl mb-5" style={{ fontFamily: 'var(--font-playfair)' }}>
              Serviços de Consultoria
            </h1>
            <p
              className="text-lg leading-relaxed"
              style={{ color: 'var(--color-footnote)', fontFamily: 'var(--font-source-serif)' }}
            >
              Cada projeto começa com diagnóstico rigoroso e termina com resultados mensuráveis.
              Trabalho com executivos e suas equipes para garantir que a mudança aconteça — e permaneça.
            </p>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20" style={{ background: 'var(--color-paper)' }}>
        <div className="container-site">
          <div className="flex flex-col gap-12">
            {services.map((service, i) => {
              const Icon = iconMap[service.icon];
              const isEven = i % 2 === 0;

              return (
                <FadeInSection key={service.id} delay={i * 0.05}>
                  <div
                    className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 rounded border"
                    style={{
                      borderColor: 'var(--color-rule)',
                      background: isEven ? 'var(--color-chalk)' : 'var(--color-paper)',
                    }}
                  >
                    {/* Icon + title */}
                    <div className={`flex flex-col gap-4 ${isEven ? '' : 'md:order-2'}`}>
                      <div
                        className="w-12 h-12 rounded flex items-center justify-center"
                        style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--color-gold)' }}
                      >
                        {Icon && <Icon size={22} strokeWidth={1.5} />}
                      </div>
                      <div>
                        <p
                          className="text-xs uppercase tracking-widest mb-1"
                          style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-dm-sans)' }}
                        >
                          {service.subtitle}
                        </p>
                        <h2 className="text-2xl md:text-3xl" style={{ fontFamily: 'var(--font-playfair)' }}>
                          {service.title}
                        </h2>
                      </div>
                      <p
                        className="text-base leading-relaxed"
                        style={{ color: 'var(--color-footnote)', fontFamily: 'var(--font-source-serif)' }}
                      >
                        {service.description}
                      </p>
                      <Link
                        href={service.ctaHref}
                        className="inline-flex items-center gap-2 text-sm font-medium mt-2 w-fit transition-colors hover:text-academic"
                        style={{ color: 'var(--color-academic)', fontFamily: 'var(--font-dm-sans)' }}
                      >
                        {service.ctaLabel} →
                      </Link>
                    </div>

                    {/* Features */}
                    <div className={`flex flex-col justify-center gap-4 ${isEven ? '' : 'md:order-1'}`}>
                      <p
                        className="text-xs uppercase tracking-widest"
                        style={{ color: 'var(--color-footnote)', fontFamily: 'var(--font-dm-sans)' }}
                      >
                        O que inclui
                      </p>
                      <ul className="flex flex-col gap-3">
                        {service.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-3">
                            <Check
                              size={16}
                              strokeWidth={2}
                              className="mt-0.5 shrink-0"
                              style={{ color: 'var(--color-forest)' }}
                            />
                            <span
                              className="text-sm leading-relaxed"
                              style={{ fontFamily: 'var(--font-source-serif)', color: 'var(--color-ink)' }}
                            >
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </FadeInSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 text-center" style={{ background: 'var(--color-ink)' }}>
        <div className="container-site">
          <p
            className="text-xs uppercase tracking-widest mb-4"
            style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-dm-sans)' }}
          >
            Vamos trabalhar juntos?
          </p>
          <h2 className="text-3xl md:text-4xl mb-5" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-chalk)' }}>
            Fale sobre seu projeto
          </h2>
          <p
            className="max-w-lg mx-auto mb-8 text-base"
            style={{ color: 'rgba(250,250,247,0.65)', fontFamily: 'var(--font-source-serif)' }}
          >
            Cada engajamento começa com uma conversa sem compromisso. Conte-me sobre o
            desafio que sua organização enfrenta.
          </p>
          <Link
            href="/contato"
            className="inline-flex items-center px-8 py-3.5 rounded text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-gold)', color: 'var(--color-ink)', fontFamily: 'var(--font-dm-sans)' }}
          >
            Agendar uma conversa →
          </Link>
        </div>
      </section>
    </>
  );
}
