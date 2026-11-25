// ============================================================
// sd-step4.js — Step 4: Build the Sum of Squares
//
// Canvas is split into two panels:
//   LEFT  (1/3): Scrollable column of squared-residual tiles
//                from Step 3. Click one to add it to the sum.
//   RIGHT (2/3): A single square whose AREA equals the running
//                total of clicked tiles. Side = √(running Σ).
//                When all tiles are added → Next button unlocks.
//
// Reads from: heroes[], step3Squares[] (sd-step3.js), divAnim (sd-state.js)
// ============================================================

// ── Layout constants ────────────────────────────────────────
const S4_LEFT_W   = Math.floor(W * 0.33);   // left panel width
const S4_RIGHT_X  = S4_LEFT_W + 12;          // right panel start x
const S4_RIGHT_W  = W - S4_RIGHT_X - 16;    // right panel width
const S4_PAD      = 10;                      // inner padding
const S4_TILE_H   = 44;                      // height of each left tile
const S4_TILE_GAP = 7;                       // gap between tiles
const S4_MAX_VIS  = 5;                       // tiles visible without scrolling

// ── Step 4 state ────────────────────────────────────────────
let s4Tiles      = [];    // { val, res, thumbSide, added, animT, animating, startX, startY }
let s4ScrollOff  = 0;     // scroll offset in tiles
let s4RunningSum = 0;     // Σ(x−μ)² so far
let s4Initted    = false;
let s4AllAdded   = false;

// Flying particle animations: { x, y, tx, ty, t, val }
let s4Particles  = [];

// ── Max square side (fits right panel) ─────────────────────
function s4MaxSide() {
  return Math.min(S4_RIGHT_W, H - 80) - 20;
}

// ── Init tiles from step3Squares data ──────────────────────
function initStep4() {
  // step3Squares may not exist if user skipped step 3 — fallback to hero stats
  let tiles = [];
  if (typeof step3Squares !== 'undefined' && step3Squares.length > 0) {
    tiles = step3Squares.map(s => ({
      val:       s.res ** 2,
      res:       s.res,
      thumbSide: s.thumbSide,
      col:       s.col,
    }));
  } else {
    const stats = getHeroStats();
    tiles = heroes.map(h => {
      const res = h.val - stats.mean;
      return { val: res ** 2, res, thumbSide: 28, col: h.col };
    });
  }

  s4Tiles = tiles.map(t => ({
    ...t,
    added:     false,
    animating: false,
    animT:     0,
    startX:    0,
    startY:    0,
  }));

  s4ScrollOff  = 0;
  s4RunningSum = 0;
  s4AllAdded   = false;
  s4Particles  = [];
  s4Initted    = true;
  updateStep4NextBtn();
}

function updateStep4NextBtn() {
  const btn = document.getElementById('step4-next');
  if (!btn) return;
  s4AllAdded = s4Tiles.length > 0 && s4Tiles.every(t => t.added);
  btn.disabled      = !s4AllAdded;
  btn.style.opacity = s4AllAdded ? '1'        : '0.35';
  btn.style.cursor  = s4AllAdded ? 'pointer'  : 'not-allowed';
}

// ── Tile geometry helpers ───────────────────────────────────
function s4TileY(idx) {
  // Y centre of tile idx in the left panel (accounting for scroll)
  return S4_PAD + (idx - s4ScrollOff) * (S4_TILE_H + S4_TILE_GAP) + S4_TILE_H / 2 + 36;
}

function s4TileVisible(idx) {
  const y = s4TileY(idx);
  return y - S4_TILE_H / 2 > 28 && y + S4_TILE_H / 2 < H - 16;
}

// ── Target position for flying particle (centre of right square) ─
function s4TargetPos(currentSum) {
  const maxSide = s4MaxSide();
  const side    = currentSum > 0 ? Math.min(Math.sqrt(currentSum / 100) * maxSide, maxSide) : 0;
  const cx      = S4_RIGHT_X + S4_RIGHT_W / 2;
  const cy      = 50 + (H - 80) / 2;
  return { cx, cy, side };
}

// ── Mouse click handler ─────────────────────────────────────
function step4MousePressed() {
  if (currentSection !== 4 || !s4Initted) return;

  for (let i = 0; i < s4Tiles.length; i++) {
    if (!s4TileVisible(i)) continue;
    const t  = s4Tiles[i];
    if (t.added || t.animating) continue;

    const ty = s4TileY(i);
    const tx = S4_LEFT_W / 2;
    if (mouseX >= S4_PAD && mouseX <= S4_LEFT_W - S4_PAD &&
        mouseY >= ty - S4_TILE_H / 2 && mouseY <= ty + S4_TILE_H / 2) {

      // Launch particle from tile centre toward right square
      const { cx, cy } = s4TargetPos(s4RunningSum);
      s4Particles.push({
        x: tx, y: ty,
        tx: cx, ty: cy,
        t: 0, val: t.val, col: t.col,
        idx: i,
      });
      t.animating = true;
      t.animT     = 0;
      return;
    }
  }
}

// ── Scroll handler ──────────────────────────────────────────
function step4MouseWheel(event) {
  if (currentSection !== 4) return;
  if (mouseX > S4_LEFT_W) return; // only scroll left panel
  const maxScroll = Math.max(0, s4Tiles.length - S4_MAX_VIS);
  s4ScrollOff = clamp(s4ScrollOff + (event.delta > 0 ? 1 : -1), 0, maxScroll);
  return false; // prevent page scroll
}

// Hook into p5 events
const _s4OrigPressed = window.mousePressed || function(){};
window.mousePressed = function() { step4MousePressed(); _s4OrigPressed(); };

// p5 mouseWheel global
window.mouseWheel = function(event) {
  if (typeof step4MouseWheel === 'function') return step4MouseWheel(event);
};

// ============================================================
// DRAW STEP 4
// ============================================================
function drawStep4(stats) {
  if (stats.n < 2) { drawNotEnough(); return; }
  if (!s4Initted || s4Tiles.length !== stats.n) initStep4();

  // ── Update particle animations ──────────────────────────
  const SPEED = 0.045;
  s4Particles = s4Particles.filter(p => {
    p.t = Math.min(p.t + SPEED, 1);

    if (p.t >= 1) {
      // Land — mark tile as added, update sum
      s4Tiles[p.idx].added     = true;
      s4Tiles[p.idx].animating = false;
      s4RunningSum += p.val;
      updateStep4NextBtn();
      return false; // remove particle
    }
    return true;
  });

  // ── Background ──────────────────────────────────────────
  background(13, 18, 32);

  // ── Divider line ────────────────────────────────────────
  stroke(30, 50, 80, 120); strokeWeight(1);
  line(S4_LEFT_W, 0, S4_LEFT_W, H);

  // ── LEFT PANEL — tile list ───────────────────────────────
  drawStep4Left(stats);

  // ── RIGHT PANEL — growing square ────────────────────────
  drawStep4Right(stats);

  // ── Flying particles ─────────────────────────────────────
  s4Particles.forEach(p => {
    const ease = 1 - Math.pow(1 - p.t, 3); // ease-out cubic
    const px   = lerp(p.x, p.tx, ease);
    const py   = lerp(p.y, p.ty, ease);
    const sz   = lerp(18, 6, ease);
    const al   = lerp(255, 0, Math.max(0, p.t - 0.7) / 0.3);

    fill(p.col[0], p.col[1], p.col[2], al); noStroke();
    rect(px - sz / 2, py - sz / 2, sz, sz, 3);
    noStroke(); fill(p.col[0], p.col[1], p.col[2], al * 0.6);
    textSize(9); textFont('monospace'); textAlign(CENTER);
    text(p.val.toFixed(1), px, py - sz / 2 - 4);
    textAlign(LEFT);
  });
}

// ── Left panel ──────────────────────────────────────────────
function drawStep4Left(stats) {
  // Panel label
  noStroke(); fill(80, 110, 160, 200);
  textSize(9); textFont('monospace');
  text('SQUARED RESIDUALS', S4_PAD, 22);
  fill(50, 75, 110); textSize(8);
  text('click to add →', S4_PAD, 34);

  // Scroll arrows
  const maxScroll = Math.max(0, s4Tiles.length - S4_MAX_VIS);
  if (maxScroll > 0) {
    fill(80, 110, 160, s4ScrollOff > 0 ? 200 : 60); noStroke();
    triangle(S4_LEFT_W / 2, 40, S4_LEFT_W / 2 - 7, 50, S4_LEFT_W / 2 + 7, 50);
    fill(80, 110, 160, s4ScrollOff < maxScroll ? 200 : 60);
    triangle(S4_LEFT_W / 2, H - 8, S4_LEFT_W / 2 - 7, H - 18, S4_LEFT_W / 2 + 7, H - 18);
  }

  // Tiles
  s4Tiles.forEach((t, i) => {
    if (!s4TileVisible(i)) return;

    const ty    = s4TileY(i);
    const c4    = t.col;
    const tx    = S4_PAD;
    const tw    = S4_LEFT_W - S4_PAD * 2;
    const ty0   = ty - S4_TILE_H / 2;
    const isHov = mouseX >= tx && mouseX <= tx + tw &&
                  mouseY >= ty0 && mouseY <= ty0 + S4_TILE_H &&
                  !t.added && !t.animating && currentSection === 4;

    // Tile background
    if (t.added) {
      fill(6, 214, 160, 18); stroke(6, 214, 160, 80); strokeWeight(1);
    } else if (t.animating) {
      fill(c4[0], c4[1], c4[2], 12); stroke(c4[0], c4[1], c4[2], 60); strokeWeight(1);
      setLineDash([3, 3]);
    } else if (isHov) {
      fill(c4[0], c4[1], c4[2], 25); stroke(c4[0], c4[1], c4[2], 180); strokeWeight(1.5);
    } else {
      fill(20, 30, 50); stroke(30, 50, 80); strokeWeight(1);
    }
    rect(tx, ty0, tw, S4_TILE_H, 6);
    setLineDash([]);

    // Mini square icon on left
    const iconSide = clamp(t.thumbSide * 0.55, 8, 28);
    const iconX    = tx + 8;
    const iconY    = ty - iconSide / 2;

    if (t.added) {
      fill(c4[0], c4[1], c4[2], 70); stroke(c4[0], c4[1], c4[2], 220); strokeWeight(1.5);
    } else if (t.animating) {
      fill(c4[0], c4[1], c4[2], 20); stroke(c4[0], c4[1], c4[2], 80); strokeWeight(1);
      setLineDash([2, 2]);
    } else {
      fill(c4[0], c4[1], c4[2], 30); stroke(c4[0], c4[1], c4[2], 160); strokeWeight(1.5);
    }
    rect(iconX, iconY, iconSide, iconSide, 2);
    setLineDash([]);

    // Value label
    noStroke();
    fill(t.added ? 100 : t.animating ? 100 : 220, t.added ? 180 : 180, t.added ? 120 : 102, t.added ? 140 : 220);
    textSize(10); textFont('monospace');
    text(t.val.toFixed(1), tx + iconSide + 14, ty - 4);

    // Residual sub-label
    fill(80, 110, 160, 160); textSize(8);
    text('(' + (t.res >= 0 ? '+' : '') + t.res.toFixed(1) + ')²', tx + iconSide + 14, ty + 8);

    // Status
    if (t.added) {
      fill(6, 214, 160, 180); textSize(8);
      text('✓ added', tw - 12, ty + 4);
    } else if (!t.animating) {
      fill(c4[0], c4[1], c4[2], isHov ? 220 : 80); textSize(8);
      text(isHov ? 'click!' : '+ add', tw - 4, ty + 4);
    }
  });

  // Progress
  const addedCount = s4Tiles.filter(t => t.added).length;
  noStroke(); fill(80, 110, 160, 160);
  textSize(9); textFont('monospace'); textAlign(CENTER);
  text(addedCount + ' / ' + s4Tiles.length, S4_LEFT_W / 2, H - 4);
  textAlign(LEFT);
}

// ── Right panel ─────────────────────────────────────────────
function drawStep4Right(stats) {
  // Panel label
  noStroke(); fill(0, 212, 255, 180);
  textSize(9); textFont('monospace');
  text('TOTAL AREA  =  Σ(x−μ)²', S4_RIGHT_X + S4_PAD, 22);

  const maxSide    = s4MaxSide();
  const totalSS    = stats.ss;  // the true total for reference
  const dispSum    = s4RunningSum + s4Particles.reduce((a, p) => a + p.val * p.t, 0); // smooth growth during flight
  const frac       = totalSS > 0 ? clamp(dispSum / totalSS, 0, 1) : 0;
  const side       = frac * maxSide;
  const cx         = S4_RIGHT_X + S4_RIGHT_W / 2;
  const cy         = 44 + (H - 60) / 2;
  const sqX        = cx - side / 2;
  const sqY        = cy - side / 2;

  // Ghost outline — full size (the target)
  if (side < maxSide - 4) {
    noFill(); stroke(30, 50, 80, 100); strokeWeight(1.5);
    setLineDash([5, 5]);
    const gSide = maxSide;
    rect(cx - gSide / 2, cy - gSide / 2, gSide, gSide, 6);
    setLineDash([]);
  }

  // Growing square fill
  if (side > 2) {
    // Glow layer
    fill(255, 209, 102, 8); noStroke();
    rect(sqX - 6, sqY - 6, side + 12, side + 12, 10);
    fill(255, 209, 102, 14); noStroke();
    rect(sqX - 2, sqY - 2, side + 4, side + 4, 8);

    // Main fill
    fill(255, 209, 102, 28); noStroke();
    rect(sqX, sqY, side, side, 6);

    // Border
    stroke(255, 209, 102, 220); strokeWeight(2); noFill();
    rect(sqX, sqY, side, side, 6);

    // Side length label (left edge)
    noStroke(); fill(255, 209, 102, 200);
    textSize(10); textFont('monospace'); textAlign(CENTER);
    push();
    translate(sqX - 14, cy);
    rotate(-HALF_PI);
    text('side = √' + dispSum.toFixed(1), 0, 0);
    pop();
    textAlign(LEFT);

    // Area label inside square (when big enough)
    if (side > 60) {
      noStroke(); fill(255, 209, 102, 180);
      textSize(side > 100 ? 13 : 10); textFont('monospace'); textAlign(CENTER);
      text('Σ(x−μ)²', cx, cy - 10);
      textSize(side > 100 ? 17 : 12);
      text('= ' + dispSum.toFixed(1), cx, cy + 12);
      textAlign(LEFT);
    }
  } else {
    // Empty state hint
    noStroke(); fill(40, 65, 100, 160);
    textSize(12); textFont('monospace'); textAlign(CENTER);
    text('← click a tile to start', cx, cy);
    textAlign(LEFT);
  }

  // Formula reminder at bottom
  noStroke(); fill(80, 110, 160, 160);
  textSize(9); textFont('monospace'); textAlign(CENTER);
  text('area of square = sum of all (x−μ)²', cx, H - 4);
  textAlign(LEFT);

  // Completion flash
  if (s4AllAdded) {
    noStroke(); fill(6, 214, 160, 200);
    textSize(12); textFont('monospace'); textAlign(CENTER);
    text('✓ Σ(x−μ)² = ' + totalSS.toFixed(2) + '  →  ready to divide by n!', cx, 38);
    textAlign(LEFT);
  }
}

// Reset when going back before step 4
window._s4OrigGoToSection = window.goToSection;
window.goToSection = function(s) {
  if (s < 4) s4Initted = false;
  if (window._s4OrigGoToSection) window._s4OrigGoToSection(s);
};
