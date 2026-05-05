'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export function Hero() {
  return (
    <section
      className="min-h-[85vh] flex items-center py-24"
      style={{ background: 'var(--color-ink)' }}
    >
      <div className="container-site w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text column */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="flex flex-col gap-6"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <p
                className="text-xs uppercase tracking-widest mb-6"
                style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-dm-sans)' }}
              >
                Consultor · Pesquisador · Educador
              </p>
            </motion.div>

            <h1
              className="text-4xl md:text-5xl lg:text-6xl leading-tight"
              style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-chalk)' }}
            >
              Pesquisa com rigor.{' '}
              <em style={{ color: 'var(--color-gold)', fontStyle: 'italic' }}>
                Transformação
              </em>{' '}
              com propósito.
            </h1>

            <p
              className="text-lg leading-relaxed max-w-lg"
              style={{ color: 'rgba(250,250,247,0.7)', fontFamily: 'var(--font-source-serif)' }}
            >
              Metodologia, Ética e Gestão da Mudança para quem pesquisa e quem transforma.
              20+ anos de experiência em projetos de alto impacto — nas salas de conselho
              e nas bancas de defesa.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-3 pt-2"
            >
              <Link
                href="/servicos"
                className="inline-flex items-center justify-center px-7 py-3.5 rounded text-sm font-medium transition-opacity hover:opacity-90"
                style={{
                  background: 'var(--color-gold)',
                  color: 'var(--color-ink)',
                  fontFamily: 'var(--font-dm-sans)',
                }}
              >
                Ver Serviços
              </Link>
              <Link
                href="/academico"
                className="inline-flex items-center justify-center px-7 py-3.5 rounded text-sm font-medium border transition-opacity hover:opacity-80"
                style={{
                  borderColor: 'rgba(250,250,247,0.3)',
                  color: 'var(--color-chalk)',
                  fontFamily: 'var(--font-dm-sans)',
                }}
              >
                Acervo Acadêmico →
              </Link>
            </motion.div>

            {/* Trust signals */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex flex-wrap gap-x-6 gap-y-2 pt-4"
              style={{ borderTop: '1px solid rgba(250,250,247,0.1)' }}
            >
              {['MCMP™ Certified', 'CCMP™ Certified', 'LaMarsh LATAM', 'FEA-USP'].map((cred) => (
                <span
                  key={cred}
                  className="text-xs"
                  style={{ color: 'rgba(250,250,247,0.45)', fontFamily: 'var(--font-dm-sans)' }}
                >
                  {cred}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Photo column */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="flex justify-center lg:justify-end"
          >
            <div
              className="relative w-72 h-96 lg:w-80 lg:h-[28rem] rounded overflow-hidden"
              style={{
                border: '2px solid var(--color-gold)',
                boxShadow: '8px 8px 0px rgba(201,168,76,0.2)',
              }}
            >
              {/* Placeholder — replace with next/image when photo is available */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-end pb-8"
                style={{ background: 'linear-gradient(160deg, #0F3460 0%, #1A1A2E 100%)' }}
              >
                {/* Monogram */}
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl select-none opacity-10"
                  style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-gold)' }}
                  aria-hidden="true"
                >
                  FS
                </div>
                <p
                  className="text-sm relative z-10"
                  style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-dm-sans)' }}
                >
                  Fabiano Sannino
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
