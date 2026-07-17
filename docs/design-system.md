# Design System — Ervatório (Onda 12 · backlog #99, v0)

Formalização dos tokens que já existem em `css/main.css` (`:root` = tema escuro padrão; `body.light` = claro). A auditoria apontou a identidade visual como um dos maiores ativos da marca — este doc é a referência para não diluí-la ao escalar o time. As páginas estáticas (`/erva/`, legais) usam uma paleta derivada (pergaminho/verde) definida inline nos geradores.

## Cores (tema escuro — padrão)

| Token | Valor | Uso |
|---|---|---|
| `--bg` / `--bg2` / `--bg3` | `#1a3a2a` / `#1f4a32` / `#152f22` | Fundos (verde-profundo da marca) |
| `--gold` / `--gold2` / `--goldf` | `#c8a84b` / `#e6c96e` / `#f0d98a` | Acentos, CTAs, preços |
| `--cream` / `--cream2` | `#f5ede0` / `#d4cbb8` | Texto primário / secundário |
| `--muted` | `#8a9a8e` | Texto terciário — ⚠ auditar contraste AA em tamanhos <12px (pendência 9.2) |
| `--faint` | `#2d5440` | Bordas sutis |
| `--green`/`--green2`, `--red`/`--red2`, `--blue`/`--blue2` | ver main.css | Semânticos por categoria |
| `--safe-*` / `--warn-*` / `--avoid-*` | ver main.css | Selos de segurança das ervas (seguro/cautela/evitar) |

Tema claro (`body.light`) redefine os mesmos tokens — nunca usar cor hardcoded em componente novo; sempre token.

## Tipografia

| Papel | Família | Uso |
|---|---|---|
| Display/editorial | `Cormorant Garamond` | Títulos, nomes de erva, preços |
| Editorial alternativa | `EB Garamond` | Textos longos editoriais |
| UI | `Jost` | Botões, labels, navegação, uppercase espaçado |
| Corpo | `Inter` | Texto de interface |

Padrão de rótulo de seção: `Jost`, `.7–.78rem`, `letter-spacing:.08em+`, uppercase, cor `--muted`.

## Forma e elevação

- Raios: `--r-lg:16px` (cards/sheets), `--r-md:10px`, `--r-sm:6px` (chips/inputs)
- Sombra: `--shadow` (suave, esverdeada no escuro)
- Chips/badges: fundo `--chip-bg`, borda `--chip-border` (ouro translúcido)
- Overlays: `--overlay` + bottom-sheet no mobile (max-width 540px)

## Componentes recorrentes (inventário)

`mkt-card` (vitrine), bottom-sheet de detalhe, `cart-overlay`/`cart-panel`, `ck-input`/`ck-label` (checkout), `ficha-section`/`ficha-dl` (Ervopédia), banner de consentimento (`#ervConsent`), diálogos (`a11yDialog` aplica role/foco/ESC — Onda 9).

## Regras

1. Componente novo usa tokens — nada de hex solto.
2. Interativos são `<button>`/`<a>` reais (a delegação da Onda 9 é rede de segurança, não desculpa).
3. Contraste AA mínimo; `--muted` sobre `--bg` só em ≥14px até a auditoria 9.2.
4. Dark e light sempre juntos: se definir token novo, defina nos dois temas.

## Evolução

v1 (futuro, com bundler da Onda 12 completa): extrair tokens para arquivo próprio, documentar componentes com exemplos e estados, e alinhar as páginas estáticas ao mesmo arquivo de tokens.
