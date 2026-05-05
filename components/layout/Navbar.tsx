'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { navItems } from '@/lib/data/static';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMegaOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-200',
        scrolled ? 'bg-paper/95 backdrop-blur-sm shadow-card' : 'bg-paper'
      )}
      style={{ fontFamily: 'var(--font-dm-sans)' }}
    >
      <div className="container-site flex items-center justify-between h-16">
        {/* Logo */}
        <Link
          href="/"
          className="flex flex-col leading-tight"
          aria-label="Fabiano Sannino — página inicial"
        >
          <span
            className="text-lg font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-ink)' }}
          >
            Fabiano Sannino
          </span>
          <span className="text-xs" style={{ color: 'var(--color-gold)' }}>
            MCMP™ · CCMP™
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm" aria-label="Navegação principal">
          {navItems.map((item) =>
            item.children ? (
              <div key={item.href} className="relative">
                <button
                  onClick={() => setMegaOpen((v) => !v)}
                  onBlur={() => setTimeout(() => setMegaOpen(false), 150)}
                  className={cn(
                    'flex items-center gap-1 py-1 transition-colors hover:text-academic',
                    pathname.startsWith('/academico') ? 'text-academic font-medium' : 'text-ink'
                  )}
                  aria-expanded={megaOpen}
                >
                  {item.label}
                  <ChevronDown size={14} className={cn('transition-transform', megaOpen && 'rotate-180')} />
                </button>

                <AnimatePresence>
                  {megaOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-full mt-2 w-56 bg-chalk border rounded shadow-card py-1"
                      style={{ borderColor: 'var(--color-rule)' }}
                    >
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-2 text-sm hover:bg-paper transition-colors"
                          style={{ color: 'var(--color-ink)' }}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'py-1 transition-colors hover:text-academic',
                  pathname === item.href || pathname.startsWith(item.href + '/')
                    ? 'text-academic font-medium'
                    : 'text-ink'
                )}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/acesso/login"
            className="text-sm px-4 py-2 rounded transition-colors hover:bg-paper"
            style={{ color: 'var(--color-ink)', border: '1px solid var(--color-rule)' }}
          >
            Entrar
          </Link>
          <Link
            href="/contato"
            className="text-sm px-4 py-2 rounded text-paper transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-ink)' }}
          >
            Contato →
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 -mr-2 rounded"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden bg-paper border-t"
            style={{ borderColor: 'var(--color-rule)' }}
          >
            <nav className="container-site py-4 flex flex-col gap-1" aria-label="Navegação mobile">
              {navItems.map((item) => (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className="block py-2 text-sm font-medium"
                    style={{ color: 'var(--color-ink)' }}
                  >
                    {item.label}
                  </Link>
                  {item.children?.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block py-1.5 pl-4 text-sm"
                      style={{ color: 'var(--color-footnote)' }}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ))}
              <div className="pt-4 flex flex-col gap-2">
                <Link
                  href="/acesso/login"
                  className="text-center py-2.5 rounded text-sm border"
                  style={{ borderColor: 'var(--color-rule)', color: 'var(--color-ink)' }}
                >
                  Entrar
                </Link>
                <Link
                  href="/contato"
                  className="text-center py-2.5 rounded text-sm text-paper"
                  style={{ background: 'var(--color-ink)' }}
                >
                  Contato →
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
