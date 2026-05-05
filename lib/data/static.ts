import type { Article, Service, HubCard, Credencial, Pilar, NavItem } from './types';

// TODO(CMS): Replace with payload.find({ collection: 'articles', limit: 3, sort: '-publishedAt' })
export const latestArticles: Article[] = [
  {
    slug: 'gestao-mudanca-pos-fusao',
    title: 'Gestão da Mudança no Pós-Fusão: Lições de 20 Anos de Prática',
    excerpt:
      'Fusões e aquisições falham principalmente por causas humanas. Veja como estruturar uma abordagem de change management que protege o valor da transação.',
    category: 'Gestão da Mudança',
    publishedAt: '2026-04-15',
    readingTimeMinutes: 9,
    href: '/blog/gestao-mudanca-pos-fusao',
  },
  {
    slug: 'etica-pesquisa-ia-2026',
    title: 'Ética em Pesquisa com IA: O Que Mudou em 2026 e o Que Ainda Falta',
    excerpt:
      'A proliferação de ferramentas de IA na pesquisa acadêmica levanta questões éticas que os comitês de ética ainda não conseguem responder. Um panorama prático.',
    category: 'Ética em Pesquisa',
    publishedAt: '2026-03-28',
    readingTimeMinutes: 12,
    href: '/blog/etica-pesquisa-ia-2026',
  },
  {
    slug: 'metodologia-mista-quando-usar',
    title: 'Metodologia Mista: Quando Usar e Como Não Errar na Triangulação',
    excerpt:
      'A pesquisa de métodos mistos é poderosa, mas frequentemente mal aplicada. Um guia para mestrandos que precisam justificar a escolha metodológica para a banca.',
    category: 'Metodologia',
    publishedAt: '2026-03-10',
    readingTimeMinutes: 8,
    href: '/blog/metodologia-mista-quando-usar',
  },
];

// TODO(CMS): Replace with payload.find({ collection: 'services' })
export const services: Service[] = [
  {
    id: 'gestao-mudanca',
    title: 'Gestão da Mudança',
    subtitle: 'Change Management Estruturado',
    description:
      'Planejamento e execução de iniciativas de mudança com metodologia MCMP™, garantindo adoção, sustentabilidade e ROI da transformação.',
    features: [
      'Diagnóstico de prontidão organizacional',
      'Estratégia de comunicação e engajamento',
      'Treinamento e capacitação de líderes',
    ],
    ctaLabel: 'Saiba mais',
    ctaHref: '/servicos/gestao-mudanca',
    icon: 'ArrowRightLeft',
  },
  {
    id: 'transformacao-organizacional',
    title: 'Transformação Organizacional',
    subtitle: 'Design e Implementação',
    description:
      'Redesenho de estruturas, processos e cultura organizacional para suportar novos modelos de negócio e objetivos estratégicos.',
    features: [
      'Assessment de maturidade organizacional',
      'Redesenho de estrutura e governança',
      'Gestão de stakeholders e resistências',
    ],
    ctaLabel: 'Saiba mais',
    ctaHref: '/servicos/transformacao-organizacional',
    icon: 'Building2',
  },
  {
    id: 'pmo-governanca',
    title: 'PMO & Governança',
    subtitle: 'Escritório de Projetos e Portfólio',
    description:
      'Estruturação e operação de PMOs com foco em priorização de portfólio, governança de projetos e dashboards executivos.',
    features: [
      'Implantação e maturação de PMO',
      'Metodologias ágeis e híbridas',
      'Ferramentas e KPIs de portfólio',
    ],
    ctaLabel: 'Saiba mais',
    ctaHref: '/servicos/pmo-governanca',
    icon: 'LayoutDashboard',
  },
  {
    id: 'integracao-ma',
    title: 'Integração M&A',
    subtitle: 'Fusões e Aquisições',
    description:
      'Gestão da integração pós-fusão com foco em preservação de valor, integração cultural e manutenção de talentos críticos.',
    features: [
      'Due diligence cultural e organizacional',
      'Plano de integração 100 dias',
      'Retenção de talentos e gestão de incerteza',
    ],
    ctaLabel: 'Saiba mais',
    ctaHref: '/servicos/integracao-ma',
    icon: 'Merge',
  },
  {
    id: 'research-as-a-service',
    title: 'Research-as-a-Service',
    subtitle: 'Pesquisa Aplicada para Empresas',
    description:
      'Pesquisa acadêmica rigorosa com aplicação prática: levantamentos, sínteses de literatura e estudos de caso para suportar decisões estratégicas.',
    features: [
      'Revisão sistemática e scoping review',
      'Pesquisa quantitativa e qualitativa',
      'Relatórios executivos e técnicos',
    ],
    ctaLabel: 'Saiba mais',
    ctaHref: '/servicos/research-as-a-service',
    icon: 'FlaskConical',
  },
];

// TODO(CMS): Replace with payload.find({ collection: 'hubCards' })
export const hubCards: HubCard[] = [
  {
    id: 'metodologia',
    title: 'Base de Conhecimento',
    description: 'Guias completos sobre metodologia quantitativa, qualitativa e mista.',
    href: '/academico/base-conhecimento',
    icon: 'BookOpen',
  },
  {
    id: 'etica',
    title: 'Ética em Pesquisa',
    description: 'CEP/CONEP, integridade acadêmica, IA e ética por área de conhecimento.',
    href: '/academico/etica-pesquisa',
    icon: 'Scale',
  },
  {
    id: 'por-area',
    title: 'Pesquisa por Área',
    description: 'Orientação específica para Administração, Direito, Engenharia, Saúde e mais.',
    href: '/academico/pesquisa-por-area',
    icon: 'Layers',
  },
  {
    id: 'metodometro',
    title: 'Metodômetro',
    description: 'Descubra a metodologia ideal para sua pesquisa em 7 perguntas.',
    href: '/academico/metodometro',
    icon: 'Compass',
    badge: 'Ferramenta',
  },
];

// TODO(CMS): Replace with payload.find({ collection: 'credentials' })
export const credenciais: Credencial[] = [
  { code: 'MCMP™', label: 'Master Certified Management Professional', issuer: 'ACMP' },
  { code: 'CCMP™', label: 'Certified Change Management Professional', issuer: 'ACMP' },
  { code: 'LaMarsh', label: 'LaMarsh Certified Change Manager', issuer: 'LaMarsh Global — LATAM' },
  { code: 'FEA-USP', label: 'Pós-Doutor', issuer: 'Universidade de São Paulo' },
  { code: 'UNICAMP', label: 'Pós-Doutor em andamento', issuer: 'Universidade Estadual de Campinas' },
];

// TODO(CMS): Replace with payload.find({ collection: 'pillars' })
export const tresPilares: Pilar[] = [
  {
    title: 'Consultor',
    description:
      'Soluções de change management e transformação organizacional para empresas que enfrentam mudanças complexas — fusões, reestruturações ou transformações digitais.',
    stats: '20+',
    statsLabel: 'anos de experiência',
    icon: 'Briefcase',
    href: '/servicos',
  },
  {
    title: 'Pesquisador',
    description:
      'Pós-doutor em andamento na UNICAMP/FCA, com pesquisa em blockchain, IA e regulação sanitária. Integra o rigor acadêmico à aplicação prática nos projetos de consultoria.',
    stats: '50+',
    statsLabel: 'projetos realizados',
    icon: 'FlaskConical',
    href: '/pesquisa',
  },
  {
    title: 'Educador',
    description:
      'Hub acadêmico com conteúdo de metodologia, ética em pesquisa e ferramentas práticas para mestrandos, doutorandos e pesquisadores de todas as áreas.',
    stats: '5k+',
    statsLabel: 'pesquisadores atendidos',
    icon: 'GraduationCap',
    href: '/academico',
  },
];

// Navigation structure
export const navItems: NavItem[] = [
  { label: 'Sobre', href: '/sobre' },
  { label: 'Serviços', href: '/servicos' },
  {
    label: 'Acadêmico',
    href: '/academico',
    children: [
      { label: 'Base de Conhecimento', href: '/academico/base-conhecimento' },
      { label: 'Ética em Pesquisa', href: '/academico/etica-pesquisa' },
      { label: 'Pesquisa por Área', href: '/academico/pesquisa-por-area' },
      { label: 'Metodômetro', href: '/academico/metodometro' },
      { label: 'Materiais', href: '/academico/materiais' },
      { label: 'Glossário', href: '/academico/glossario' },
    ],
  },
  { label: 'Blog', href: '/blog' },
  { label: 'Contato', href: '/contato' },
];
