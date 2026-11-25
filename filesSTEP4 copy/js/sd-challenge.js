// ============================================================
// sd-challenge.js — Captain Sigma Challenge System
// Displays random challenges with a "Check My Flight" button.
// Depends on: sd-state.js (heroes, getHeroStats)
// Call initChallenge() once on page load.
// updateChallenge() is kept as a no-op for compatibility.
// ============================================================

// ── Challenge definitions ─────────────────────────────────
// Each challenge has:
//   text    — what Captain Sigma says
//   hint    — shown below the goal while active
//   check() — returns array of { label, met } conditions
const CHALLENGES = [
  {
    text: "Make the standard deviation as small as possible — try to get σ below 5!",
    hint: "Fly your hero at a very consistent altitude across all checkpoints.",
    check: (s) => [
      { label: "σ < 5",        met: s.n >= 8 && s.sd < 5 },
      { label: "n ≥ 8 points", met: s.n >= 8 },
    ],
  },
  {
    text: "Make the mean as close to 50 as possible while keeping σ above 20.",
    hint: "Balance high and low altitudes evenly around the middle.",
    check: (s) => [
      { label: "Mean between 45–55", met: s.n >= 6 && s.mean >= 45 && s.mean <= 55 },
      { label: "σ > 20",             met: s.sd > 20 },
      { label: "n ≥ 6 points",       met: s.n >= 6 },
    ],
  },
  {
    text: "Create a dataset where σ is larger than the mean!",
    hint: "Use a mix of very low and very high altitudes.",
    check: (s) => [
      { label: "σ > mean",     met: s.n >= 6 && s.sd > s.mean },
      { label: "n ≥ 6 points", met: s.n >= 6 },
    ],
  },
  {
    text: "Make the mean as HIGH as possible — try to get it above 85!",
    hint: "Fly your hero at maximum altitude at every checkpoint.",
    check: (s) => [
      { label: "Mean > 85",    met: s.n >= 8 && s.mean > 85 },
      { label: "n ≥ 8 points", met: s.n >= 8 },
    ],
  },
  {
    text: "Make the mean as LOW as possible — try to get it below 20!",
    hint: "Fly your hero at minimum altitude at every checkpoint.",
    check: (s) => [
      { label: "Mean < 20",    met: s.n >= 8 && s.mean < 20 },
      { label: "n ≥ 8 points", met: s.n >= 8 },
    ],
  },
  {
    text: "Get σ above 30 — make your flight path as wild as possible!",
    hint: "Alternate between very high and very low altitudes.",
    check: (s) => [
      { label: "σ > 30",       met: s.n >= 6 && s.sd > 30 },
      { label: "n ≥ 6 points", met: s.n >= 6 },
    ],
  },
  {
    text: "Keep the mean between 60–70 AND σ below 10. Steady and high!",
    hint: "Fly consistently at a high altitude — small wobbles only.",
    check: (s) => [
      { label: "Mean between 60–70", met: s.n >= 8 && s.mean >= 60 && s.mean <= 70 },
      { label: "σ < 10",             met: s.sd < 10 },
      { label: "n ≥ 8 points",       met: s.n >= 8 },
    ],
  },
  {
    text: "Make σ roughly equal to the mean — within 5 units of each other.",
    hint: "This is tricky! Experiment with different flight patterns.",
    check: (s) => [
      { label: "σ ≈ mean (within 5)", met: s.n >= 6 && Math.abs(s.sd - s.mean) <= 5 },
      { label: "n ≥ 6 points",        met: s.n >= 6 },
    ],
  },
];

// ── State ─────────────────────────────────────────────────
let currentChallenge = null;
let challengeIndex   = -1;
let checked          = false; // has the user clicked "Check My Flight" yet?

// ── Pick a new random challenge (avoid repeating last) ────
function pickNewChallenge() {
  let idx;
  do { idx = Math.floor(Math.random() * CHALLENGES.length); }
  while (idx === challengeIndex && CHALLENGES.length > 1);
  challengeIndex   = idx;
  currentChallenge = CHALLENGES[idx];
  checked          = false;
  renderChallenge();
}

// ── Render the challenge card into #sigma-bubble ──────────
function renderChallenge() {
  const bubble = document.getElementById('sigma-bubble');
  if (!bubble) return;
  bubble.style.display = 'block';
  bubble.innerHTML = buildChallengeHTML();
  bindButtons();
}

// ── Bind all buttons after each render ───────────────────
function bindButtons() {
  const checkBtn = document.getElementById('ch-check');
  const skipBtn  = document.getElementById('ch-skip');
  const nextBtn  = document.getElementById('ch-next');

  if (checkBtn) checkBtn.addEventListener('click', checkFlight);
  if (skipBtn)  skipBtn.addEventListener('click',  () => { window.clearHeroes && window.clearHeroes(); pickNewChallenge(); });
  if (nextBtn)  nextBtn.addEventListener('click',  () => { window.clearHeroes && window.clearHeroes(); pickNewChallenge(); });
}

// ── Build the HTML for the challenge card ─────────────────
function buildChallengeHTML(checkedConditions) {
  if (!currentChallenge) return '';

  // Before checking: show neutral circles; after: show ✓/✗
  const condHTML = (checkedConditions || currentChallenge.check({ n: 0, sd: 0, mean: 0 }).map(c => ({ ...c, met: null })))
    .map(c => {
      const stateClass = c.met === null ? 'neutral' : c.met ? 'met' : 'unmet';
      const icon       = c.met === null ? '○'       : c.met ? '✓'   : '✗';
      return `
        <div class="ch-condition ${stateClass}">
          <span class="ch-icon">${icon}</span>
          <span>${c.label}</span>
        </div>
      `;
    }).join('');

  const bottomHTML = checkedConditions && checkedConditions.every(c => c.met) ? `
    <div class="ch-celebrate">🎉 Congratulations! Challenge complete!</div>
    <button class="ch-btn primary" id="ch-next">Next Challenge →</button>
  ` : `
    <div class="ch-hint">${currentChallenge.hint}</div>
    <div class="ch-actions">
      <button class="ch-btn primary" id="ch-check">Check My Flight ✈</button>
      <button class="ch-btn ghost"   id="ch-skip">Skip →</button>
    </div>
  `;

  return `
    <div class="sigma-name">🦸 CAPTAIN SIGMA — CHALLENGE</div>
    <div class="ch-text">"${currentChallenge.text}"</div>
    <div class="ch-conditions">${condHTML}</div>
    ${bottomHTML}
  `;
}

// ── Check My Flight: evaluate conditions and re-render ────
function checkFlight() {
  if (!currentChallenge) return;
  const stats      = getHeroStats();
  const conditions = currentChallenge.check(stats);
  checked          = true;

  // Re-render with checked results
  const bubble = document.getElementById('sigma-bubble');
  if (!bubble) return;
  bubble.innerHTML = buildChallengeHTML(conditions);
  bindButtons();

  // If all met, auto-advance to next challenge after 3 seconds
  if (conditions.every(c => c.met)) {
    setTimeout(() => {
      window.clearHeroes && window.clearHeroes();
      pickNewChallenge();
    }, 3000);
  }
}

// ── No-op — kept so any existing calls don't throw errors ─
function updateChallenge() {}

// ── Init — called on page load ────────────────────────────
function initChallenge() {
  pickNewChallenge();
}
