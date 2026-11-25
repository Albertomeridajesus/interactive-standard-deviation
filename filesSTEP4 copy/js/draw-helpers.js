// ============================================================
// draw-helpers.js — Shared p5.js drawing functions
// Used by every tool on the site.
// Load order: utils.js → draw-helpers.js → sd-state.js → sd-step1..5.js
// ============================================================

// ── Canvas constants ──────────────────────────────────────
const W = 680;
const H = 400;

// ── Canvas ↔ value conversion ────────────────────────────
// Values range 0–100. Canvas Y: 40=top(100) to H-40=bottom(0)
function yToVal(y) { return parseFloat((100 * (1 - (y - 40) / (H - 80))).toFixed(1)); }
function valToY(v) { return 40 + (H - 80) * (1 - v / 100); }

// ── Sky background with clouds ────────────────────────────
// Used in step 1 instead of the plain grid
function drawSky() {
  // Sky gradient layers
  noStroke();
  for (let y = 0; y < H; y += 2) {
    const t = y / H;
    fill(
      lerp(8,  13, t),
      lerp(20, 28, t),
      lerp(45, 55, t)
    );
    rect(0, y, W, 2);
  }

  // Subtle horizontal altitude lines
  stroke(30, 50, 80, 60); strokeWeight(1);
  for (let v = 0; v <= 100; v += 20) {
    const y = valToY(v);
    setLineDash([6, 6]);
    line(16, y, W - 16, y);
    setLineDash([]);
  }

  // Altitude labels on left
  for (let v = 0; v <= 100; v += 20) {
    const y = valToY(v);
    noStroke(); fill(40, 65, 100);
    textSize(9); textFont('monospace');
    text(v, 2, y + 4);
  }

  // Soft cloud shapes (decorative, fixed positions)
  drawCloud(120, 70,  60, 20, 30);
  drawCloud(380, 50,  80, 25, 20);
  drawCloud(560, 110, 50, 18, 25);
  drawCloud(60,  160, 40, 14, 20);
  drawCloud(480, 170, 65, 20, 15);
}

function drawCloud(x, y, w, h, op) {
  noStroke();
  fill(200, 220, 255, op);
  ellipse(x,          y,     w,     h);
  ellipse(x + w*0.25, y - 4, w*0.6, h * 1.2);
  ellipse(x - w*0.2,  y + 2, w*0.5, h * 0.8);
}

// ── Standard grid (used in steps 2–5) ────────────────────
function drawGrid() {
  stroke(30, 44, 68); strokeWeight(1);
  for (let y = 40; y < H - 20; y += 60) line(16, y, W - 16, y);
  for (let v = 0; v <= 100; v += 20) {
    const y = valToY(v);
    noStroke(); fill(50, 70, 100);
    textSize(9); textFont('monospace');
    text(v, 2, y + 4);
  }
}

// ── Dashed mean line with label ───────────────────────────
function drawMeanLine(meanVal, overrideY) {
  const y = overrideY !== undefined ? overrideY : valToY(meanVal);
  stroke(6, 214, 160); strokeWeight(2);
  setLineDash([8, 5]); line(20, y, W - 20, y); setLineDash([]);
  noStroke(); fill(6, 214, 160);
  textSize(11); textFont('monospace');
  text('avg altitude = ' + meanVal.toFixed(1), W - 140, y - 7);
}

// ── Flying hero character ─────────────────────────────────
// x, y  = centre of body
// col   = [r,g,b] accent color (suit color)
// size  = scale multiplier (1.0 = normal, 0.6 = small)
// trail = draw motion trail behind hero
function drawFlyingHero(x, y, col, size, trail) {
  const s = size || 1.0;

  // Motion trail
  if (trail) {
    for (let i = 1; i <= 5; i++) {
      fill(col[0], col[1], col[2], 20 * (6 - i));
      noStroke();
      ellipse(x - i * 10 * s, y, 14 * s * (1 - i * 0.15), 10 * s * (1 - i * 0.15));
    }
  }

  // Cape — flows behind (left) since hero flies right
  fill(180, 0, 0, 220); noStroke();
  beginShape();
  vertex(x - 2  * s, y - 4 * s);
  vertex(x - 22 * s, y + 8 * s);
  vertex(x - 18 * s, y - 2 * s);
  vertex(x - 8  * s, y - 8 * s);
  endShape(CLOSE);

  // Body (horizontal flying pose)
  fill(col[0], col[1], col[2]); noStroke();
  ellipse(x, y, 22 * s, 14 * s);

  // Head
  ellipse(x + 12 * s, y - 2 * s, 16 * s, 16 * s);

  // Mask
  fill(clamp(col[0]-40,0,255), clamp(col[1]-40,0,255), clamp(col[2]-40,0,255));
  ellipse(x + 13 * s, y - 4 * s, 12 * s, 6 * s);

  // Eye
  fill(255, 255, 255);
  ellipse(x + 15 * s, y - 4 * s, 4 * s, 3 * s);
  fill(13, 18, 32);
  ellipse(x + 16 * s, y - 4 * s, 2 * s, 2 * s);

  // Outstretched arm (pointing forward/right)
  stroke(col[0], col[1], col[2]); strokeWeight(3 * s);
  line(x + 10 * s, y + 1 * s, x + 22 * s, y - 4 * s);

  // Legs trailing behind
  line(x - 4 * s, y + 4 * s, x - 14 * s, y + 12 * s);
  line(x - 4 * s, y + 4 * s, x - 14 * s, y + 2  * s);

  // Chest symbol (star)
  fill(255, 215, 50); noStroke();
  drawStar(x + 2 * s, y, 4 * s, 2 * s, 5);
}

// Helper: draw a star shape
function drawStar(x, y, r1, r2, pts) {
  const angle = TWO_PI / pts;
  beginShape();
  for (let i = 0; i < TWO_PI; i += angle) {
    vertex(x + cos(i - HALF_PI) * r1, y + sin(i - HALF_PI) * r1);
    vertex(x + cos(i - HALF_PI + angle/2) * r2, y + sin(i - HALF_PI + angle/2) * r2);
  }
  endShape(CLOSE);
}

// ── Smiley (kept for steps 2–5) ──────────────────────────
function drawSmiley(x, y, col, cape, small) {
  const s = small ? 0.65 : 1.0;
  const r = 11 * s;

  if (cape) {
    fill(180, 0, 0, 200); noStroke();
    beginShape();
    vertex(x + 3  * s, y + r);
    vertex(x + 16 * s, y + r + 14 * s);
    vertex(x + 5  * s, y + r + 8  * s);
    endShape(CLOSE);
  }

  fill(col[0], col[1], col[2]); noStroke();
  ellipse(x, y, r * 2, r * 2);
  fill(13, 18, 32);
  ellipse(x - 3.5 * s, y - 2 * s, 3 * s, 3 * s);
  ellipse(x + 3.5 * s, y - 2 * s, 3 * s, 3 * s);
  stroke(13, 18, 32); strokeWeight(1.2 * s); noFill();
  arc(x, y + 1 * s, 7 * s, 5 * s, 0, PI);
  stroke(col[0], col[1], col[2]); strokeWeight(1.8 * s);
  line(x,          y + r,          x,          y + r + 14 * s);
  line(x - 10 * s, y + r + 5  * s, x + 10 * s, y + r + 5  * s);
  line(x,          y + r + 14 * s, x - 7  * s, y + r + 24 * s);
  line(x,          y + r + 14 * s, x + 7  * s, y + r + 24 * s);
}

// ── Small bell curve inset (steps 2–5) ───────────────────
function drawMiniBell(stats, bx, by, bw, bh) {
  if (stats.sd < 0.5) return;
  const mean = stats.mean, sd = stats.sd;
  const xMin = mean - 3.5 * sd, xMax = mean + 3.5 * sd;
  const pts  = [];
  for (let i = 0; i <= 80; i++) {
    const v = xMin + (i / 80) * (xMax - xMin);
    pts.push({ v, g: gaussian(v, mean, sd) });
  }
  const maxG = Math.max(...pts.map(p => p.g));
  const sx   = v => bx + ((v - xMin) / (xMax - xMin)) * bw;
  const sy   = g => by + bh - (g / maxG) * bh;

  [[3,'rgba(255,107,107,0.07)'],[2,'rgba(255,209,102,0.12)'],[1,'rgba(0,212,255,0.2)']].forEach(([m, col]) => {
    const rp = pts.filter(p => p.v >= mean - m * sd && p.v <= mean + m * sd);
    if (rp.length < 2) return;
    drawingContext.fillStyle = col;
    beginShape();
    vertex(sx(mean - m * sd), by + bh);
    rp.forEach(p => vertex(sx(p.v), sy(p.g)));
    vertex(sx(mean + m * sd), by + bh);
    endShape(CLOSE);
  });

  noFill();
  const grad = drawingContext.createLinearGradient(bx, 0, bx + bw, 0);
  grad.addColorStop(0, '#ff6b6b'); grad.addColorStop(0.5, '#00d4ff'); grad.addColorStop(1, '#ff6b6b');
  drawingContext.strokeStyle = grad;
  strokeWeight(1.5);
  beginShape();
  pts.forEach(p => vertex(sx(p.v), sy(p.g)));
  endShape();
  stroke(0, 212, 255);
  stroke(6, 214, 160, 180); strokeWeight(1);
  setLineDash([4, 3]); line(sx(mean), by, sx(mean), by + bh); setLineDash([]);
}

// ── Not enough data message ───────────────────────────────
function drawNotEnough() {
  noStroke(); fill(70, 100, 150, 180);
  textSize(14); textFont('monospace'); textAlign(CENTER);
  text('Go to Step 1 and record at least 2 altitude readings first!', W / 2, H / 2);
  textAlign(LEFT);
}

// ── Line dash helper ──────────────────────────────────────
function setLineDash(list) { drawingContext.setLineDash(list); }