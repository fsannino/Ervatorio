import Link from 'next/link';
import { Lock } from 'lucide-react';

const previewMaterials = [
  'Slides: Metodologia Quantitativa v2',
  'Template TCLE — ABNT atualizado',
  'Checklist submissão ao CEP',
  'Guia de Revisão Sistemática',
  'Planilha de análise estatística',
];

export function CTACadastro() {
  return (
    <section className="py-20" style={{ background: 'var(--color-academic)' }}>
      <div className="container-site">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          {/* Text */}
          <div className="flex flex-col gap-5 flex-1">
            <div
              className="inline-flex items-center gap-2 text-xs uppercase tracking-widest w-fit px-3 py-1.5 rounded"
              style={{ background: 'rgba(201,168,76,0.2)', color: 'var(--color-gold)', fontFamily: 'var(--font-dm-sans)' }}
            >
              <Lock size={12} />
              Acesso gratuito mediante cadastro
            </div>

            <h2 className="text-3xl md:text-4xl" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-chalk)' }}>
              Materiais exclusivos para sua pesquisa
            </h2>

            <p className="text-base" style={{ color: 'rgba(250,250,247,0.75)', fontFamily: 'var(--font-source-serif)' }}>
              Slides de aulas, templates ABNT, checklists de submissão ao CEP e modelos
              de documentos — todos disponíveis gratuitamente para pesquisadores cadastrados.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <Link
                href="/acesso/cadastro"
                className="inline-flex items-center justify-center px-6 py-3 rounded text-sm font-medium transition-opacity hover:opacity-90"
                style={{ background: 'var(--color-gold)', color: 'var(--color-ink)', fontFamily: 'var(--font-dm-sans)' }}
              >
                Criar conta gratuita →
              </Link>
              <Link
                href="/acesso/login"
                className="inline-flex items-center justify-center px-6 py-3 rounded text-sm font-medium border transition-opacity hover:opacity-80"
                style={{ borderColor: 'rgba(250,250,247,0.3)', color: 'var(--color-chalk)', fontFamily: 'var(--font-dm-sans)' }}
              >
                Já tenho conta
              </Link>
            </div>
          </div>

          {/* Preview materials */}
          <div
            className="flex-1 w-full rounded border p-6"
            style={{ borderColor: 'rgba(250,250,247,0.15)', background: 'rgba(250,250,247,0.05)' }}
          >
            <p
              className="text-xs uppercase tracking-widest mb-4"
              style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-dm-sans)' }}
            >
              Disponível para membros
            </p>
            <ul className="flex flex-col gap-3">
              {previewMaterials.map((m) => (
                <li
                  key={m}
                  className="flex items-center gap-3 text-sm py-2 px-3 rounded"
                  style={{ background: 'rgba(250,250,247,0.08)', color: 'rgba(250,250,247,0.6)' }}
                >
                  <Lock size={12} style={{ color: 'var(--color-gold)', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-source-serif)' }}>{m}</span>
                </li>
              ))}
            </ul>
            <p
              className="text-xs mt-4 text-center"
              style={{ color: 'rgba(250,250,247,0.4)', fontFamily: 'var(--font-dm-sans)' }}
            >
              + mais de 50 materiais no acervo
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
