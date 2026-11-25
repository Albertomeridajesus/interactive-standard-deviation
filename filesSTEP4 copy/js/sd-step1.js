// ============================================================
// sd-step1.js — Step 1: Record the Hero's Altitude
//
// The canvas is the sky. One superhero flies left to right
// following your mouse. At each of NUM_COLS fixed intervals,
// their altitude is instantly recorded as a bar.
// Flying back over a column updates it to the new altitude.
//
// Reads from: HERO_COLS[], HERO_NAMES[] (sd-state.js)
// Draws with: drawSky(), drawMeanLine(), drawFlyingHero() (draw-helpers.js)
// ============================================================

// ── Configuration ─────────────────────────────────────────
const NUM_COLS    = 16;                  // number of altitude checkpoints
const HERO_COLOR  = [0, 212, 255];       // hero suit color (cyan) — change freely
const HERO_COLOR2 = [255, 107, 107];     // (legacy) default bar color

// One distinct color per checkpoint. A column keeps its color in steps 1-4.
// Neighbouring colors are deliberately different; green is avoided
// because the mean line is green.
const BAR_COLORS = [
  [255, 107, 107], // t1  coral
  [ 56, 189, 248], // t2  sky blue
  [255, 209, 102], // t3  yellow
  [167, 119, 255], // t4  purple
  [255, 159,  67], // t5  orange
  [255, 105, 180], // t6  pink
  [ 96, 125, 255], // t7  blue
  [190, 230,  70], // t8  lime
  [232, 121, 249], // t9  magenta
  [214, 170, 100], // t10 tan
  [230,  60,  70], // t11 red
  [220, 220, 240], // t12 silver
  [255, 190, 160], // t13 peach
  [ 45, 212, 191], // t14 teal
  [240, 230, 140], // t15 khaki
  [140, 220, 230], // t16 ice
];

// ── Step 1 state ──────────────────────────────────────────
let altitudes   = new Array(NUM_COLS).fill(null); // recorded altitudes
let selectedCol = -1;   // clicked column index (-1 = none)
let previewVal  = -1;   // ghost bar from typed input
let activeCol   = -1;   // column hero is currently flying over
let flightTrail = [];   // recent hero positions for smooth trail

// ── Column geometry ───────────────────────────────────────
function colSpacing()  { return (W - 80) / NUM_COLS; }
function colBarWidth() { return colSpacing() - 4; }
function colCentreX(i) { return 40 + i * colSpacing() + colSpacing() / 2; }
function xToCol(x) {
  if (x < 40 || x > W - 40) return -1;
  return clamp(floor((x - 40) / colSpacing()), 0, NUM_COLS - 1);
}

// Sync global heroes[] from altitudes[] so stats work in all steps
function syncHeroesFromAltitudes() {
  heroes = [];
  altitudes.forEach((val, i) => {
    if (val !== null) {
      heroes.push({
        val,
        col:  BAR_COLORS[i % BAR_COLORS.length],
        name: 't' + (i + 1),
      });
    }
  });
}

// ============================================================
// DRAW STEP 1
// ============================================================
function drawStep1(stats) {
  // ── Update altitude for current column instantly ─────────
  if (mouseX >= 40 && mouseX <= W - 40 && mouseY > 30 && mouseY < H - 30
      && currentSection === 1) {
    const ci = xToCol(mouseX);
    if (ci >= 0) {
      activeCol      = ci;
      altitudes[ci]  = clamp(yToVal(mouseY), 2, 98);
    }
  } else {
    activeCol = -1;
  }

  // Track trail positions
  if (mouseX > 0 && mouseX < W && currentSection === 1) {
    flightTrail.push({ x: mouseX, y: mouseY });
    if (flightTrail.length > 12) flightTrail.shift();
  }

  syncHeroesFromAltitudes();

  const filled = altitudes.filter(v => v !== null).length;

  // ── Draw sky background ──────────────────────────────────
  drawSky();

  // ── Mean altitude line ───────────────────────────────────
  if (filled >= 2) drawMeanLine(stats.mean);

  const bw = colBarWidth();

  // ── Draw altitude bars ───────────────────────────────────
  altitudes.forEach((val, i) => {
    const cx = colCentreX(i);
    const bc = BAR_COLORS[i % BAR_COLORS.length];

    if (val === null) {
      // Unvisited checkpoint — faint marker at bottom
      stroke(40, 60, 90, 80); strokeWeight(1); noFill();
      setLineDash([3, 4]);
      rect(cx - bw / 2, H - 50, bw, 10, 2);
      setLineDash([]);

      // Checkpoint label
      noStroke(); fill(40, 60, 90, 100);
      textSize(8); textFont('monospace'); textAlign(CENTER);
      text('t' + (i + 1), cx, H - 36);
      textAlign(LEFT);
      return;
    }

    const by    = valToY(val);
    const isSel = (i === selectedCol);
    const isAct = (i === activeCol);

    // Bar — glows when active
    const alpha = isAct ? 130 : isSel ? 110 : 60;
    fill(bc[0], bc[1], bc[2], alpha);
    noStroke();
    rect(cx - bw / 2, by, bw, H - 45 - by, 3, 3, 0, 0);

    // Bar border
    stroke(
      isAct ? 255 : isSel ? 0   : bc[0],
      isAct ? 215 : isSel ? 212 : bc[1],
      isAct ? 50  : isSel ? 255 : bc[2],
      isAct ? 255 : isSel ? 255 : 140
    );
    strokeWeight(isAct ? 2 : isSel ? 2 : 1);
    noFill();
    rect(cx - bw / 2, by, bw, H - 45 - by, 3, 3, 0, 0);

    // Dotted line from bar top up to where hero was
    stroke(HERO_COLOR[0], HERO_COLOR[1], HERO_COLOR[2], 60);
    strokeWeight(1);
    setLineDash([3, 3]);
    line(cx, by - 2, cx, 30);
    setLineDash([]);

    // Altitude label
    noStroke();
    fill(255, 255, 255, isAct ? 240 : 180);
    textSize(max(8, min(10, bw * 0.5)));
    textFont('monospace'); textAlign(CENTER);
    text(val.toFixed(0), cx, by - 6);

    // Time label below bar
    fill(80, 120, 160, 180);
    textSize(8);
    text('t' + (i + 1), cx, H - 36);
    textAlign(LEFT);

    // Selected: arrows + highlight
    if (isSel) {
      fill(0, 212, 255, 220); noStroke();
      triangle(cx, by - 18, cx - 7, by - 8, cx + 7, by - 8);
      fill(255, 107, 107, 220);
      triangle(cx, by + 6, cx - 7, by - 4, cx + 7, by - 4);
      noFill(); stroke(0, 212, 255, 180); strokeWeight(2);
      rect(cx - bw / 2 - 2, by - 2, bw + 4, H - 43 - by, 4);
    }

    // Small hero marker at the recorded altitude point
    drawFlyingHero(cx, by - 2, HERO_COLOR, 0.45, false);
  });

  // ── Ghost bar from typed input ───────────────────────────
  if (previewVal >= 0) {
    const cx = W - 24;
    const by = valToY(previewVal);
    fill(HERO_COLOR[0], HERO_COLOR[1], HERO_COLOR[2], 25); noStroke();
    rect(cx - bw / 2, by, bw, H - 45 - by, 3, 3, 0, 0);
    stroke(HERO_COLOR[0], HERO_COLOR[1], HERO_COLOR[2], 80); strokeWeight(1);
    setLineDash([5, 4]); noFill();
    rect(cx - bw / 2, by, bw, H - 45 - by, 3, 3, 0, 0);
    setLineDash([]);
    noStroke(); fill(HERO_COLOR[0], HERO_COLOR[1], HERO_COLOR[2], 150);
    textSize(10); textFont('monospace'); textAlign(CENTER);
    text(previewVal.toFixed(0), cx, by - 6);
    textAlign(LEFT);
  }

  // ── Progress indicator ───────────────────────────────────
  if (filled === 0) {
    noStroke(); fill(80, 120, 170, 200);
    textSize(14); textFont('monospace'); textAlign(CENTER);
    text('🦸 Fly your hero across the sky', W / 2, H / 2 - 12);
    fill(60, 90, 130, 160); textSize(11);
    text('Move left → right to record altitude at each checkpoint', W / 2, H / 2 + 12);
    textAlign(LEFT);
  } else {
    // Progress bar
    const prog = filled / NUM_COLS;
    noStroke(); fill(15, 25, 45);
    rect(16, H - 24, W - 32, 6, 3);
    fill(0, 212, 255, 160);
    rect(16, H - 24, (W - 32) * prog, 6, 3);
    noStroke(); fill(50, 80, 120);
    textSize(9); textFont('monospace');
    text(filled + '/' + NUM_COLS + ' checkpoints recorded', 16, H - 28);
  }

  // ── Character update + dialogue bubble ──────────────────
  updateCharacter(stats, filled, NUM_COLS);
  character.drawBubble(W, H);
}

// ============================================================
function drawHeroCursor() {
  if (mouseX < 0 || mouseX > W || mouseY < 0 || mouseY > H) return;

  // Flight trail
  for (let i = 0; i < flightTrail.length - 1; i++) {
    const t   = i / flightTrail.length;
    const pt  = flightTrail[i];
    stroke(HERO_COLOR[0], HERO_COLOR[1], HERO_COLOR[2], t * 60);
    strokeWeight(lerp(1, 3, t));
    if (i > 0) line(flightTrail[i-1].x, flightTrail[i-1].y, pt.x, pt.y);
  }

  const x = mouseX, y = mouseY;

  // Altitude guide line (dotted, down to ground)
  stroke(HERO_COLOR[0], HERO_COLOR[1], HERO_COLOR[2], 40);
  strokeWeight(1);
  setLineDash([4, 4]);
  line(x, y + 10, x, H - 40);
  setLineDash([]);

  // Column highlight
  const ci = xToCol(x);
  if (ci >= 0) {
    const cx = colCentreX(ci);
    const bw = colBarWidth();
    noFill();
    stroke(HERO_COLOR[0], HERO_COLOR[1], HERO_COLOR[2], 40);
    strokeWeight(1);
    rect(cx - bw / 2 - 1, 28, bw + 2, H - 68, 3);
  }

  // Flying hero at cursor
  drawFlyingHero(x, y, HERO_COLOR, 1.0, true);

  // Altitude readout
  noStroke(); fill(255, 215, 50, 230);
  textSize(12); textFont('monospace');
  const alt = clamp(yToVal(y), 0, 100).toFixed(0);
  text('alt: ' + alt, x + 22, y - 10);
}

// ============================================================
// MOUSE & KEYBOARD
// ============================================================
function mousePressed() {
  if (currentSection !== 1) return;
  const ci = xToCol(mouseX);
  selectedCol = (ci >= 0 && altitudes[ci] !== null)
    ? (ci === selectedCol ? -1 : ci)
    : -1;
}

function keyPressed() {
  if (currentSection !== 1 || selectedCol < 0 || altitudes[selectedCol] === null) return;
  const step = keyIsDown(SHIFT) ? 5 : 1;
  if      (keyCode === UP_ARROW)                    altitudes[selectedCol] = clamp(altitudes[selectedCol] + step, 1, 99);
  else if (keyCode === DOWN_ARROW)                  altitudes[selectedCol] = clamp(altitudes[selectedCol] - step, 1, 99);
  else if (keyCode === ESCAPE || keyCode === ENTER) selectedCol = -1;
  return false;
}

// ============================================================
// EXTERNAL API
// ============================================================
window.clearHeroes = function() {
  altitudes   = new Array(NUM_COLS).fill(null);
  heroes      = [];
  selectedCol = -1;
  previewVal  = -1;
  activeCol   = -1;
  flightTrail = [];
};

window.addHeroVal = function(val) {
  const next = altitudes.findIndex(v => v === null);
  if (next === -1) return;
  altitudes[next] = clamp(val, 1, 99);
};

window.removeLastHero = function() {
  for (let i = NUM_COLS - 1; i >= 0; i--) {
    if (altitudes[i] !== null) { altitudes[i] = null; break; }
  }
};

window.setPreviewVal = function(val) {
  previewVal = (val !== null && !isNaN(val)) ? clamp(val, 1, 99) : -1;
};

window.clearPreview = function() { previewVal = -1; };
