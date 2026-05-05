interface SectionDividerProps {
  symbol?: '§' | '◆' | '—';
}

export function SectionDivider({ symbol = '§' }: SectionDividerProps) {
  return (
    <div
      className="flex items-center justify-center py-8 text-2xl select-none"
      style={{ color: 'var(--color-rule)' }}
      aria-hidden="true"
    >
      {symbol}
    </div>
  );
}
