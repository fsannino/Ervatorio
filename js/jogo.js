// ════════════════════════════════════════
// JOGO BOTÂNICO — Ervatório
// Identifique a erva a partir das pistas
// ════════════════════════════════════════

const JOGO_TOTAL_ROUNDS = 10;
const JOGO_MAX_CLUES    = 4;

let jogoState = {
  active:      false,
  round:       0,
  score:       0,
  clueIdx:     0,   // 0-based; points = JOGO_MAX_CLUES - clueIdx
  herb:        null,
  options:     [],
  answered:    false,
  wrongCount:  0,
  history:     [],
};

// ─── Entry point ───
function initJogo() {
  const el = document.getElementById('jogoContainer');
  if (!el) return;
  const best = parseInt(localStorage.getItem('erb_jogo_best') || '0', 10);
  el.innerHTML = `
    <div class="jogo-intro">
      <div class="jogo-leaf">🌿</div>
      <div class="jogo-title">Jogo Botânico</div>
      <div class="jogo-lead">Identifique ervas brasileiras a partir de pistas. Quanto menos pistas usar, mais pontos você ganha.</div>
      <div class="jogo-rules">
        <div class="jogo-rule"><span class="jogo-rule-pts">+4</span> pts — acertar na 1ª pista</div>
        <div class="jogo-rule"><span class="jogo-rule-pts">+3</span> pts — acertar na 2ª pista</div>
        <div class="jogo-rule"><span class="jogo-rule-pts">+2</span> pts — acertar na 3ª pista</div>
        <div class="jogo-rule"><span class="jogo-rule-pts">+1</span> pt &nbsp;— acertar na 4ª pista</div>
        <div class="jogo-rule"><span style="color:var(--muted)">0</span> pts — errar todas as pistas</div>
      </div>
      <div class="jogo-meta">${JOGO_TOTAL_ROUNDS} rodadas · máximo ${JOGO_TOTAL_ROUNDS * JOGO_MAX_CLUES} pontos</div>
      ${best > 0 ? `<div class="jogo-best">Seu recorde: <strong>${best}</strong> pts</div>` : ''}
      <button class="jogo-start-btn" onclick="jogoStart()">Iniciar jogo</button>
    </div>`;
}

function jogoStart() {
  jogoState = { active:true, round:0, score:0, clueIdx:0, herb:null, options:[], answered:false, wrongCount:0, history:[] };
  jogoNextRound();
}

function jogoNextRound() {
  if (jogoState.round >= JOGO_TOTAL_ROUNDS) { jogoShowFinal(); return; }
  jogoState.round++;
  jogoState.clueIdx  = 0;
  jogoState.answered = false;
  jogoState.wrongCount = 0;

  // Pick a random herb not recently seen
  const pool = (typeof HERBS !== 'undefined' ? HERBS : []).filter(h => !jogoState.history.includes(h.id));
  if (!pool.length) jogoState.history = [];
  const herb = pool[Math.floor(Math.random() * pool.length)];
  jogoState.herb = herb;
  jogoState.history.push(herb.id);

  // Build 4 options (correct + 3 wrong)
  const wrong = (typeof HERBS !== 'undefined' ? HERBS : [])
    .filter(h => h.id !== herb.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  jogoState.options = [herb, ...wrong].sort(() => Math.random() - 0.5);

  jogoRender();
}

// ─── Clue definitions ───
function jogoGetClues(herb) {
  return [
    { label: 'Efeitos', icon: '✦', text: (herb.ef || []).join(' · ') || herb.tagline },
    { label: 'Categoria & momento', icon: '🕐', text: `${herb.cat || '—'}${herb.momento ? ' — melhor uso: ' + herb.momento : ''}` },
    { label: 'Dica sensorial', icon: '👃', text: herb.tagline },
    { label: 'Nome científico', icon: '🔬', text: herb.lat || '—' },
  ];
}

// ─── Main render ───
function jogoRender() {
  const el = document.getElementById('jogoContainer');
  if (!el) return;
  const { round, score, clueIdx, herb, options } = jogoState;
  const clues = jogoGetClues(herb);
  const visibleClues = clues.slice(0, clueIdx + 1);
  const pts = JOGO_MAX_CLUES - clueIdx; // points available for correct answer
  const canReveal = clueIdx < JOGO_MAX_CLUES - 1 && !jogoState.answered;

  el.innerHTML = `
    <div class="jogo-hud">
      <div class="jogo-hud-item">Rodada <strong>${round}</strong>/${JOGO_TOTAL_ROUNDS}</div>
      <div class="jogo-hud-pts">⬡ ${score} pts</div>
      <div class="jogo-hud-item">Vale <strong style="color:var(--gold)">${jogoState.answered ? '—' : pts + ' pt' + (pts !== 1 ? 's' : '')}</strong></div>
    </div>

    <div class="jogo-clue-box">
      <div class="jogo-clue-label">Pistas reveladas (${clueIdx + 1}/${JOGO_MAX_CLUES})</div>
      ${visibleClues.map((c, i) => `
        <div class="jogo-clue${i === clueIdx && !jogoState.answered ? ' jogo-clue-new' : ''}">
          <span class="jogo-clue-icon">${c.icon}</span>
          <span><strong style="color:var(--gold2);font-size:.7rem;letter-spacing:.06em;text-transform:uppercase">${c.label}:</strong> ${esc ? esc(c.text) : c.text}</span>
        </div>`).join('')}
    </div>

    ${!jogoState.answered ? `
    <div class="jogo-options">
      ${options.map(o => `
        <button class="jogo-opt" onclick="jogoAnswer('${o.id}')">
          <span class="jogo-opt-icon">${o.icon || '🌿'}</span>
          <span class="jogo-opt-name">${o.n}</span>
          <span class="jogo-opt-lat">${o.lat || ''}</span>
        </button>`).join('')}
    </div>
    ${canReveal ? `<button class="jogo-reveal-btn" onclick="jogoRevealClue()">▸ Revelar próxima pista <span style="color:var(--muted);font-size:.72rem">(-1 pt)</span></button>` : ''}
    ` : jogoRenderFeedback()}`;
}

function jogoRenderFeedback() {
  const { herb, wrongCount } = jogoState;
  const correct = wrongCount === 0 || jogoState._lastCorrect;
  return `
    <div class="jogo-feedback ${jogoState._lastCorrect ? 'jogo-feedback-ok' : 'jogo-feedback-err'}">
      <div class="jogo-feedback-emoji">${jogoState._lastCorrect ? '✓' : '✗'}</div>
      <div class="jogo-feedback-msg">${jogoState._lastCorrect
        ? `Correto! <strong>+${jogoState._ptsEarned}</strong> ponto${jogoState._ptsEarned !== 1 ? 's' : ''}`
        : `Era <strong>${herb.n}</strong> — ${herb.tagline}`}</div>
      <div class="jogo-feedback-detail">${herb.n} · ${herb.lat || ''}</div>
    </div>
    <button class="jogo-next-btn" onclick="jogoNextRound()">
      ${jogoState.round < JOGO_TOTAL_ROUNDS ? 'Próxima rodada →' : 'Ver resultado →'}
    </button>`;
}

// ─── Actions ───
function jogoRevealClue() {
  if (jogoState.answered || jogoState.clueIdx >= JOGO_MAX_CLUES - 1) return;
  jogoState.clueIdx++;
  jogoRender();
}

function jogoAnswer(herbId) {
  if (jogoState.answered) return;
  const correct = herbId === jogoState.herb.id;
  if (correct) {
    const pts = JOGO_MAX_CLUES - jogoState.clueIdx;
    jogoState.score += pts;
    jogoState._ptsEarned = pts;
    jogoState._lastCorrect = true;
    jogoState.answered = true;
    jogoRender();
  } else {
    jogoState.wrongCount++;
    jogoState._lastCorrect = false;
    // Reveal next clue or end round if out of clues
    if (jogoState.clueIdx < JOGO_MAX_CLUES - 1) {
      jogoState.clueIdx++;
      jogoShakeWrong(herbId);
      jogoRender();
    } else {
      jogoState._ptsEarned = 0;
      jogoState.answered = true;
      jogoRender();
    }
  }
}

function jogoShakeWrong(herbId) {
  // Visual shake is handled via CSS animation triggered on re-render
}

// ─── Final screen ───
function jogoShowFinal() {
  const el = document.getElementById('jogoContainer');
  if (!el) return;
  const { score } = jogoState;
  const max = JOGO_TOTAL_ROUNDS * JOGO_MAX_CLUES;
  const pct = Math.round((score / max) * 100);
  if (typeof trackAction === 'function') trackAction('jogo-complete', { pct });

  const best = parseInt(localStorage.getItem('erb_jogo_best') || '0', 10);
  const newBest = score > best;
  if (newBest) localStorage.setItem('erb_jogo_best', score);

  const rating = pct >= 85 ? { emoji:'🏆', msg:'Mestre Botânico', desc:'Você conhece as ervas como ninguém.' }
               : pct >= 65 ? { emoji:'🌟', msg:'Herborista Experiente', desc:'Excelente domínio das plantas medicinais.' }
               : pct >= 45 ? { emoji:'🌿', msg:'Aprendiz de Chazeiro', desc:'Você está no bom caminho.' }
               :             { emoji:'🫖', msg:'Iniciante Curioso', desc:'Explore mais o catálogo e volte para melhorar.' };

  el.innerHTML = `
    <div class="jogo-final">
      <div class="jogo-final-emoji">${rating.emoji}</div>
      <div class="jogo-final-rating">${rating.msg}</div>
      <div class="jogo-final-score">${score} <span style="font-size:1rem;color:var(--muted)">/ ${max} pts</span></div>
      <div class="jogo-final-pct">${pct}% de aproveitamento</div>
      ${newBest ? '<div class="jogo-final-best">✦ Novo recorde pessoal!</div>' : ''}
      <div class="jogo-final-desc">${rating.desc}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:1.5rem">
        <button class="jogo-start-btn" onclick="jogoStart()">Jogar novamente</button>
        <button class="jogo-action-btn" onclick="goPage('ervatorio',null)">📖 Explorar catálogo</button>
        <button class="jogo-action-btn" onclick="goPage('quiz',null)">🌿 Fazer o Quiz</button>
      </div>
    </div>`;
}
