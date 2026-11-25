// ============================================================
// sd-state.js — Standard Deviation: shared state + p5.js core
// Load order: utils.js → draw-helpers.js → sd-state.js → sd-step1..5.js
// ============================================================

// ── Hero data ─────────────────────────────────────────────
// Populated every frame by syncHeroesFromColumns() in sd-step1.js
let heroes = [];

// ── Section routing ───────────────────────────────────────
let currentSection = 1;  // which step is active (1–5)

// ── Animation progress (0 → 1) ───────────────────────────
let bigSqAnim = 0;  // step 2 squares animate in
let divAnim   = 0;  // step 4 variance slices animate in
let sdAnim    = 0;  // step 5 σ bands animate in

// ── Hero names + colors (shared by all steps) ────────────
const HERO_NAMES = [
  'John','Emma','Liam','Sophia','Noah','Aria','Lucas','Mia','Ethan','Zoe',
  'Omar','Luna','Kai','Iris','Rex','Nora','Finn','Jade','Cole','Vera',
  'Hugo','Mila','Ace','Pia','Eli','Faye','Remy','Tess','Axel','Isla',
  'Beau','Cleo','Dex','Esme','Fox','Gwen','Hiro','Juno','Kit','Lux',
  'Max','Nova','Orion','Pearl','Quinn','Rio','Sage','Theo','Uma','Wren'
];
const HERO_COLS = [
  [0,212,255],[255,107,107],[255,209,102],[6,214,160],[180,130,255],
  [255,165,0],[100,220,100],[255,100,180],[80,200,255],[220,180,80],
  [140,230,180],[255,130,130],[130,190,255],[210,255,140],[255,80,120],
  [80,255,200],[200,150,255],[255,200,80],[80,180,255],[160,255,100],
  [255,120,80],[120,220,255],[220,255,120],[255,160,200],[160,200,255],
  [200,255,160],[255,140,100],[100,200,255],[200,255,100],[255,180,140],
  [0,180,220],[220,80,80],[220,180,0],[0,180,130],[150,100,230],
  [220,130,0],[80,190,80],[220,80,160],[60,170,220],[190,150,60],
  [110,200,160],[220,100,100],[100,160,220],[180,220,100],[220,130,180],
  [130,170,220],[220,220,100],[100,220,180],[220,160,100],[160,220,220]
];

// ── Constants ─────────────────────────────────────────────
const MAX_HEROES     = 50;  // max data points
const HIDE_SMILEY_AT = 20;  // hide stick figures when n exceeds this

// ── Get stats for current hero data ──────────────────────
function getHeroStats() {
  return calcStats(heroes.map(h => h.val));
}

// ============================================================
// p5.js CORE — setup() runs once, draw() runs 60x per second
// ============================================================

function setup() {
  const c = createCanvas(W, H);
  c.parent('p5-canvas-container');
  c.elt.style.cursor = 'none'; // step 1 hides cursor (flying hero replaces it)
  frameRate(60);
  // Show character greeting on load
  setTimeout(() => { if (window.character) character.say('greeting', {}); }, 800);
}

function draw() {
  background(13, 18, 32);

  const stats = getHeroStats();

  if (window.updateStats) window.updateStats(stats);

  if (currentSection >= 2) bigSqAnim = min(bigSqAnim + 0.05, 1);
  if (currentSection >= 4) divAnim   = min(divAnim   + 0.04, 1);
  if (currentSection >= 5) sdAnim    = min(sdAnim    + 0.03, 1);

  if      (currentSection === 1) drawStep1(stats);
  else if (currentSection === 2) drawStep2(stats);
  else if (currentSection === 3) drawStep3(stats);
  else if (currentSection === 4) drawStep4(stats);
  else if (currentSection === 5) drawStep5(stats);

  if (currentSection === 1) drawHeroCursor();
}

// ============================================================
// EXTERNAL API — called from standard-deviation.html
// Note: clearHeroes, addHeroVal, removeLastHero, setPreviewVal,
// and clearPreview are all overridden by sd-step1.js
// ============================================================

window.goToSection = function(s) {
  currentSection = s;
  if (s < 2) { bigSqAnim = 0; divAnim = 0; sdAnim = 0; }
  if (s < 4) { divAnim = 0; }
  if (s < 5) { sdAnim = 0; }
  // Cursor: visible for drag steps (2, 3), hidden for step 1 (flying hero)
  const canvas = document.querySelector('#p5-canvas-container canvas');
  if (canvas) canvas.style.cursor = (s === 1) ? 'none' : 'default';
};

window.setStep2Mode = function(m) { step2Mode = m; };