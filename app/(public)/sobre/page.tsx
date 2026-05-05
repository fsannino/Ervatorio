import type { Metadata } from 'next';
import Link from 'next/link';
import { credenciais } from '@/lib/data/static';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Sobre',
  description:
    'Conheça Fabiano Sannino — consultor MCMP™/CCMP™, pesquisador pós-doutor e educador com 20+ anos em gestão da mudança e transformação organizacional.',
};

const stats = [
  { value: '20+', label: 'anos de experiência' },
  { value: '50+', label: 'projetos realizados' },
  { value: '6', label: 'países atendidos' },
  { value: '5k+', label: 'pesquisadores no hub' },
];

const educacao = [
  { periodo: 'Em andamento', titulo: 'Pós-Doutorado em Administração', instituicao: 'UNICAMP — Faculdade de Ciências Aplicadas (FCA)', area: 'Blockchain, IA e Regulação Sanitária' },
  { periodo: '2022', titulo: 'Pós-Doutorado em Administração', instituicao: 'FEA-USP — Universidade de São Paulo', area: 'Gestão da Mudança e Transformação Organizacional' },
  { periodo: '2018', titulo: 'Doutorado em Administração', instituicao: 'FEA-USP', area: 'Change Management em Fusões e Aquisições' },
];

const subNav = [
  { label: 'Trajetória', href: '/sobre/trajetoria', active: true },
  { label: 'Publicações', href: '/sobre/publicacoes', active: false },
  { label: 'Imprensa', href: '/sobre/imprensa', active: false },
];

export default function SobrePage() {
  return (
    <>
      {/* Hero interno */}
      <section className="py-16 border-b" style={{ background: 'var(--color-chalk)', borderColor: 'var(--color-rule)' }}>
        <div className="container-site">
          <nav className="text-xs mb-6" style={{ color: 'var(--color-footnote)', fontFamily: 'var(--font-dm-sans)' }}>
            <Link href="/" className="hover:underline">Home</Link>
            <span className="mx-2">›</span>
            <span>Sobre</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div className="flex flex-col gap-5">
              <p
                className="text-xs uppercase tracking-widest"
                style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-dm-sans)' }}
              >
                Sobre mim
              </p>
              <h1 className="text-4xl md:text-5xl" style={{ fontFamily: 'var(--font-playfair)' }}>
                Fabiano Sannino
              </h1>
              <p
                className="text-lg leading-relaxed"
                style={{ color: 'var(--color-footnote)', fontFamily: 'var(--font-source-serif)' }}
              >
                Consultor sênior em Gestão da Mudança e Transformação Organizacional, pesquisador
                pós-doutor e educador. Há mais de 20 anos, apoio organizações a navegar mudanças
                complexas com rigor metodológico e foco em resultados sustentáveis.
              </p>
              <div className="flex flex-wrap gap-2">
                {credenciais.map((c) => (
                  <Badge key={c.code} variant="gold">
                    {c.code}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Photo placeholder */}
            <div className="flex justify-center lg:justify-end">
              <div
                className="w-64 h-80 rounded overflow-hidden relative"
                style={{ border: '2px solid var(--color-gold)', boxShadow: '6px 6px 0px rgba(201,168,76,0.15)' }}
              >
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: 'linear-gradient(160deg, #0F3460 0%, #1A1A2E 100%)' }}
                >
                  <span
                    className="text-8xl opacity-10 select-none"
                    style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-gold)' }}
                    aria-hidden="true"
                  >
                    FS
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sub-navegação */}
      <div className="border-b sticky top-16 z-40" style={{ background: 'var(--color-paper)', borderColor: 'var(--color-rule)' }}>
        <div className="container-site">
          <nav className="flex gap-0" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {subNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-3 text-sm border-b-2 transition-colors"
                style={{
                  borderBottomColor: item.active ? 'var(--color-academic)' : 'transparent',
                  color: item.active ? 'var(--color-academic)' : 'var(--color-footnote)',
                  fontWeight: item.active ? 500 : 400,
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Stats */}
      <section className="py-14" style={{ background: 'var(--color-paper)' }}>
        <div className="container-site">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center flex flex-col gap-1">
                <p
                  className="text-5xl font-bold"
                  style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-gold)' }}
                >
                  {s.value}
                </p>
                <p className="text-sm" style={{ color: 'var(--color-footnote)', fontFamily: 'var(--font-dm-sans)' }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Bio */}
      <section className="py-14" style={{ background: 'var(--color-paper)' }}>
        <div className="container-content">
          <h2 className="text-2xl mb-6" style={{ fontFamily: 'var(--font-playfair)' }}>Trajetória</h2>
          <div
            className="flex flex-col gap-5 text-base leading-relaxed"
            style={{ fontFamily: 'var(--font-source-serif)', color: 'var(--color-ink)' }}
          >
            <p>
              Ao longo de mais de duas décadas, acumulei experiência em projetos de transformação
              organizacional em empresas de diversos portes e setores no Brasil e no exterior —
              de reestruturações corporativas a fusões bilionárias, passando por implantações de
              sistemas e redesenhos de cultura organizacional.
            </p>
            <p>
              Sou certificado MCMP™ (Master Certified Management Professional) e CCMP™ (Certified
              Change Management Professional) pela ACMP — as mais altas certificações internacionais
              em gestão da mudança — e LaMarsh Certified Change Manager pela LaMarsh Global para
              a América Latina.
            </p>
            <p>
              No plano acadêmico, realizei meu Pós-Doutorado na FEA-USP e atualmente desenvolvo
              pesquisa de Pós-Doutoramento na UNICAMP/FCA, investigando o papel de tecnologias
              blockchain e inteligência artificial na modernização da regulação sanitária brasileira
              (ANVISA).
            </p>
            <p>
              Fundei o Hub Acadêmico de Sannino.com.br para democratizar o acesso à metodologia
              científica rigorosa — porque boa pesquisa transforma organizações tanto quanto
              boa consultoria.
            </p>
          </div>
        </div>
      </section>

      <Separator />

      {/* Educação */}
      <section className="py-14" style={{ background: 'var(--color-chalk)' }}>
        <div className="container-content">
          <h2 className="text-2xl mb-8" style={{ fontFamily: 'var(--font-playfair)' }}>Formação Acadêmica</h2>
          <ol className="flex flex-col gap-0">
            {educacao.map((edu, i) => (
              <li key={i} className="flex gap-6 pb-8 relative">
                {/* Timeline line */}
                {i < educacao.length - 1 && (
                  <div
                    className="absolute left-[19px] top-8 bottom-0 w-px"
                    style={{ background: 'var(--color-rule)' }}
                    aria-hidden="true"
                  />
                )}
                {/* Dot */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xs font-medium z-10"
                  style={{
                    background: 'var(--color-gold)',
                    color: 'var(--color-ink)',
                    fontFamily: 'var(--font-dm-sans)',
                  }}
                >
                  {edu.periodo === 'Em andamento' ? '…' : edu.periodo.slice(-2)}
                </div>
                {/* Content */}
                <div className="flex flex-col gap-1 pt-1.5">
                  <p
                    className="text-xs uppercase tracking-widest"
                    style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-dm-sans)' }}
                  >
                    {edu.periodo}
                  </p>
                  <p className="font-medium" style={{ fontFamily: 'var(--font-spectral)' }}>
                    {edu.titulo}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--color-academic)', fontFamily: 'var(--font-dm-sans)' }}>
                    {edu.instituicao}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--color-footnote)', fontFamily: 'var(--font-source-serif)' }}>
                    {edu.area}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center" style={{ background: 'var(--color-paper)' }}>
        <div className="container-site">
          <h2 className="text-2xl mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>
            Vamos conversar?
          </h2>
          <p className="mb-8 text-base" style={{ color: 'var(--color-footnote)', fontFamily: 'var(--font-source-serif)' }}>
            Seja para um projeto de consultoria, colaboração acadêmica ou uma entrevista para imprensa.
          </p>
          <Link
            href="/contato"
            className="inline-flex items-center px-7 py-3.5 rounded text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-ink)', color: 'var(--color-chalk)', fontFamily: 'var(--font-dm-sans)' }}
          >
            Entrar em contato →
          </Link>
        </div>
      </section>
    </>
  );
}
