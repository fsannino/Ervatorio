import Link from 'next/link';

const footerLinks = {
  Serviços: [
    { label: 'Gestão da Mudança', href: '/servicos/gestao-mudanca' },
    { label: 'Transformação Organizacional', href: '/servicos/transformacao-organizacional' },
    { label: 'PMO & Governança', href: '/servicos/pmo-governanca' },
    { label: 'Integração M&A', href: '/servicos/integracao-ma' },
    { label: 'Research-as-a-Service', href: '/servicos/research-as-a-service' },
  ],
  Acadêmico: [
    { label: 'Base de Conhecimento', href: '/academico/base-conhecimento' },
    { label: 'Ética em Pesquisa', href: '/academico/etica-pesquisa' },
    { label: 'Pesquisa por Área', href: '/academico/pesquisa-por-area' },
    { label: 'Metodômetro', href: '/academico/metodometro' },
    { label: 'Materiais', href: '/academico/materiais' },
  ],
  Legal: [
    { label: 'Política de Privacidade', href: '/legal/privacidade' },
    { label: 'Termos de Uso', href: '/legal/termos' },
    { label: 'LGPD', href: '/legal/lgpd' },
  ],
  Contato: [
    { label: 'Fale comigo', href: '/contato' },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/fabianosannino' },
    { label: 'Lattes', href: 'http://lattes.cnpq.br/' },
    { label: 'Pesquisa', href: '/pesquisa' },
  ],
};

export function Footer() {
  return (
    <footer
      className="border-t mt-20 pt-12 pb-8"
      style={{
        borderColor: 'var(--color-rule)',
        background: 'var(--color-chalk)',
        fontFamily: 'var(--font-dm-sans)',
      }}
    >
      <div className="container-site">
        {/* Top row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-3">
            <p
              className="text-xl font-bold"
              style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-ink)' }}
            >
              Fabiano Sannino
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-footnote)' }}>
              Pesquisa com rigor.
              <br />
              Transformação com propósito.
            </p>
          </div>

          {/* Links columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <p
                className="text-xs uppercase tracking-widest mb-3 font-medium"
                style={{ color: 'var(--color-gold)' }}
              >
                {category}
              </p>
              <ul className="flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors hover:text-academic"
                      style={{ color: 'var(--color-footnote)' }}
                      {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Credentials strip */}
        <div
          className="flex flex-wrap gap-x-6 gap-y-1 py-4 border-t border-b text-xs"
          style={{ borderColor: 'var(--color-rule)', color: 'var(--color-footnote)' }}
        >
          <span style={{ color: 'var(--color-gold)' }}>MCMP™</span>
          <span style={{ color: 'var(--color-gold)' }}>CCMP™</span>
          <span style={{ color: 'var(--color-gold)' }}>LaMarsh Certified</span>
          <span>Pós-Doutor FEA-USP</span>
          <span>Pós-Doutor UNICAMP (em andamento)</span>
        </div>

        {/* Bottom row */}
        <div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-4 text-xs"
          style={{ color: 'var(--color-footnote)' }}
        >
          <p>© {new Date().getFullYear()} Fabiano Sannino. Todos os direitos reservados.</p>
          <p>
            <Link href="/legal/privacidade" className="hover:underline">
              Privacidade
            </Link>
            {' · '}
            <Link href="/legal/termos" className="hover:underline">
              Termos
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
