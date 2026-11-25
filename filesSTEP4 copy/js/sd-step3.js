// ============================================================
// sd-step3.js — Step 3: Square Each Difference
//
// - Residual plot shown (bars + mean + residual lines + heroes)
// - One active red dot at a time at the hero's position
// - User drags dot LEFT or RIGHT — square grows from residual line
// - Snaps when drag width ≈ pixel length of residual
// - On snap → square animates down to bottom thumbnail row,
//             disappears from mean line, next dot activates
// - Hover over thumbnail → shows square on mean line
// - All snapped → Next button unlocks
// ============================================================

// ── State ─────────────────────────────────────────────────
let step3Squares   = [];
let step3Active    = 0;
let step3Dragging  = false;
let step3DragX     = 0;
let step3Initted   = false;
let step3HoverIdx  = -1;
let step3ShowBars  = true;
let c3 = [255, 209, 102];   // color of the square currently being drawn

const S3_SNAP_TOL  = 18;
const S3_DOT_R     = 7;
const S3_THUMB_Y   = 330;
const S3_MAX_THUMB = 44;
const S3_MIN_THUMB = 10;

function initStep3() {
  const stats = getHeroStats();
  if (stats.n < 2) return;
  const sp     = (W - 80) / stats.n;
  const maxRes = Math.max(...heroes.map(h => Math.abs(h.val - stats.mean)));

  step3Squares = heroes.map((h, i) => {
    const x         = 50 + i * sp;
    const meanY     = valToY(stats.mean);
    const heroY     = clamp(valToY(h.val), 28, H - 80);
    const res       = h.val - stats.mean;
    const side      = Math.abs(heroY - meanY);
    const thumbSide = maxRes > 0
      ? clamp((Math.abs(res) / maxRes) * S3_MAX_THUMB, S3_MIN_THUMB, S3_MAX_THUMB)
      : S3_MIN_THUMB;
    return { x, heroY, meanY, res, side, snapped: false,
             thumbSide, animating: false, animT: 0,
             thumbX: 0, thumbY: S3_THUMB_Y, col: h.col,
             dragDir: 1 }; // 1 = right, -1 = left
  });

  // Space thumbnails evenly
  const spread = (W - 60) / step3Squares.length;
  step3Squares.forEach((s, i) => {
    s.thumbX = 30 + i * spread + spread / 2 - s.thumbSide / 2;
  });

  step3Active   = 0;
  step3Dragging = false;
  step3DragX    = 0;
  step3Initted  = true;
  step3HoverIdx = -1;
  updateStep3NextBtn();
}

function updateStep3NextBtn() {
  const btn = document.getElementById('step3-next');
  if (!btn) return;
  const allDone = step3Squares.length > 0 && step3Squares.every(s => s.snapped);
  btn.disabled      = !allDone;
  btn.style.opacity = allDone ? '1'       : '0.35';
  btn.style.cursor  = allDone ? 'pointer' : 'not-allowed';
}

// Toggle bars — called from HTML button
window.toggleStep3Bars = function() {
  step3ShowBars = !step3ShowBars;
  const btn = document.getElementById('step3-bars-btn');
  if (btn) btn.textContent = step3ShowBars ? 'Hide bars' : 'Show bars';
};

// ── p5 mouse events ────────────────────────────────────────
function step3MousePressed() {
  if (currentSection !== 3 || !step3Initted) return;
  const s = step3Squares[step3Active];
  if (!s || s.snapped) return;
  const dx = mouseX - s.x, dy = mouseY - s.heroY;
  if (Math.sqrt(dx*dx + dy*dy) < S3_DOT_R + 8) {
    step3Dragging = true;
    step3DragX    = s.x;
  }
}

function step3MouseReleased() {
  if (step3Dragging && step3Initted) {
    const active = step3Squares[step3Active];
    if (active && !active.snapped) {
      const dragWidth = Math.abs(step3DragX - active.x);
      if (Math.abs(dragWidth - active.side) < S3_SNAP_TOL) {
        active.snapped   = true;
        active.animating = true;
        active.animT     = 0;
        // Advance to next unsnapped
        for (let i = step3Active + 1; i < step3Squares.length; i++) {
          if (!step3Squares[i].snapped) { step3Active = i; break; }
        }
        updateStep3NextBtn();
      }
    }
  }
  step3Dragging = false;
}

const _s3OrigPressed  = window.mousePressed  || function(){};
const _s3OrigReleased = window.mouseReleased || function(){};
window.mousePressed  = function() { step3MousePressed();  _s3OrigPressed(); };
window.mouseReleased = function() { step3MouseReleased(); _s3OrigReleased(); };

// ── Thumbnail hover check ──────────────────────────────────
function checkStep3Hover() {
  step3HoverIdx = -1;
  for (let i = 0; i < step3Squares.length; i++) {
    const s = step3Squares[i];
    if (!s.snapped) continue;
    if (mouseX >= s.thumbX && mouseX <= s.thumbX + s.thumbSide &&
        mouseY >= s.thumbY && mouseY <= s.thumbY + s.thumbSide) {
      step3HoverIdx = i;
      break;
    }
  }
}

// ============================================================
// DRAW STEP 3
// ============================================================
function drawStep3(stats) {
  if (stats.n < 2) { drawNotEnough(); return; }
  if (!step3Initted || step3Squares.length !== stats.n) initStep3();

  // ── Update drag ──────────────────────────────────────────
  const active = step3Squares[step3Active];
  if (active && !active.snapped && step3Dragging) {
    step3DragX = mouseX;
    // Track which direction user is dragging
    active.dragDir = step3DragX < active.x ? -1 : 1;
  }

  // ── Advance animations ───────────────────────────────────
  step3Squares.forEach(s => {
    if (s.animating) {
      s.animT = min(s.animT + 0.04, 1);
      if (s.animT >= 1) s.animating = false;
    }
  });

  checkStep3Hover();

  // ── Sky + bars ───────────────────────────────────────────
  drawSky();
  const sp = (W - 80) / stats.n;
  const bw = sp - 4;

  heroes.forEach((h, i) => {
    const cx  = 50 + i * sp;
    const by  = valToY(h.val);
    const hc  = h.col;
    const dim = (i !== step3Active && !step3Squares[i].snapped) ? 0.35 : 1;

    if (step3ShowBars) {
      fill(hc[0], hc[1], hc[2], 60 * dim); noStroke();
      rect(cx - bw/2, by, bw, H - 45 - by, 3, 3, 0, 0);
      stroke(hc[0], hc[1], hc[2], 140 * dim);
      strokeWeight(1); noFill();
      rect(cx - bw/2, by, bw, H - 45 - by, 3, 3, 0, 0);

      noStroke(); fill(255, 255, 255, 180 * dim);
      textSize(max(8, min(10, bw * 0.5))); textFont('monospace'); textAlign(CENTER);
      text(h.val.toFixed(0), cx, by - 6);
    }
    fill(80, 120, 160, 180); textSize(8);
    text('t' + (i + 1), cx, H - 56);
    textAlign(LEFT);

    drawFlyingHero(cx, by - 2, [0, 212, 255], 0.45 * dim, false);
  });

  // ── Mean line ────────────────────────────────────────────
  const meanY = valToY(stats.mean);
  stroke(6, 214, 160, 40); strokeWeight(10);
  line(20, meanY, W - 20, meanY);
  stroke(6, 214, 160, 255); strokeWeight(3);
  setLineDash([10, 6]); line(20, meanY, W - 20, meanY); setLineDash([]);
  noStroke(); fill(6, 214, 160);
  textSize(12); textFont('monospace');
  text('μ = ' + stats.mean.toFixed(1), 22, meanY - 9);

  // ── Residual lines ───────────────────────────────────────
  step3Squares.forEach((s, i) => {
    const dim = (i !== step3Active && !s.snapped) ? 0.3 : 1;
    stroke(s.col[0], s.col[1], s.col[2], 200 * dim); strokeWeight(2);
    line(s.x, s.meanY, s.x, s.heroY);
  });

  // ── Hover: show square on mean line ──────────────────────
  if (step3HoverIdx >= 0) {
    const s   = step3Squares[step3HoverIdx];
    c3 = s.col;
    const sqX = s.dragDir === -1 ? s.x - s.side : s.x;
    const sqY = s.res >= 0 ? s.meanY - s.side : s.meanY;
    fill(c3[0], c3[1], c3[2], 35); noStroke();
    rect(sqX, sqY, s.side, s.side, 3);
    stroke(c3[0], c3[1], c3[2], 180); strokeWeight(1.5); noFill();
    rect(sqX, sqY, s.side, s.side, 3);
    noStroke(); fill(c3[0], c3[1], c3[2], 200);
    textSize(10); textFont('monospace'); textAlign(CENTER);
    // Place label above the square so the green dot never overlaps it
    text((s.res**2).toFixed(1), sqX + s.side/2, sqY - 8);
    textAlign(LEFT);
  }

  // ── Active drag square ───────────────────────────────────
  if (active && !active.snapped) {
    c3 = active.col;
    const dragWidth = step3Dragging ? Math.abs(mouseX - active.x) : 0;
    const sqX = active.dragDir === -1 ? active.x - dragWidth : active.x;
    const sqY = active.res >= 0 ? active.meanY - dragWidth : active.meanY;

    if (dragWidth > 2) {
      fill(c3[0], c3[1], c3[2], 30); noStroke();
      rect(sqX, sqY, dragWidth, dragWidth, 3);
      stroke(c3[0], c3[1], c3[2], 160); strokeWeight(1.5); noFill();
      rect(sqX, sqY, dragWidth, dragWidth, 3);

      // Live size label
      noStroke(); fill(c3[0], c3[1], c3[2], 200);
      textSize(10); textFont('monospace'); textAlign(CENTER);
      const liveVal = Math.abs(yToVal(active.meanY) - yToVal(active.meanY - dragWidth));
      text(liveVal.toFixed(1), sqX + dragWidth/2, sqY - 6);
      textAlign(LEFT);
    }

    // Dashed target outline — show in both directions as hints
    const tSqY = active.res >= 0 ? active.meanY - active.side : active.meanY;
    stroke(c3[0], c3[1], c3[2], 45); strokeWeight(1); noFill();
    setLineDash([4, 4]);
    rect(active.x - active.side, tSqY, active.side, active.side, 3); // left hint
    rect(active.x,               tSqY, active.side, active.side, 3); // right hint
    setLineDash([]);

    // Active dot — red
    fill(active.col[0], active.col[1], active.col[2]); stroke(255, 255, 255, 200); strokeWeight(1.5);
    ellipse(active.x, active.heroY, S3_DOT_R * 2, S3_DOT_R * 2);

    // Both-direction arrow hints
    noStroke(); fill(255, 255, 255, 70);
    triangle(active.x - S3_DOT_R - 10, active.heroY,
             active.x - S3_DOT_R - 3,  active.heroY - 5,
             active.x - S3_DOT_R - 3,  active.heroY + 5);
    triangle(active.x + S3_DOT_R + 10, active.heroY,
             active.x + S3_DOT_R + 3,  active.heroY - 5,
             active.x + S3_DOT_R + 3,  active.heroY + 5);
  }

  // ── Snapped dots (green) ─────────────────────────────────
  step3Squares.forEach(s => {
    if (!s.snapped) return;
    fill(s.col[0], s.col[1], s.col[2]); noStroke();
    ellipse(s.x, s.heroY, S3_DOT_R * 2, S3_DOT_R * 2);
  });

  // ── Thumbnail divider ────────────────────────────────────
  stroke(30, 44, 68); strokeWeight(1);
  line(16, S3_THUMB_Y - 14, W - 16, S3_THUMB_Y - 14);
  noStroke(); fill(50, 75, 110);
  textSize(9); textFont('monospace');
  text('squared residuals', 18, S3_THUMB_Y - 3);

  // ── Thumbnails ───────────────────────────────────────────
  step3Squares.forEach((s, i) => {
    const isHov = (i === step3HoverIdx);
    c3 = s.col;

    if (!s.snapped && !s.animating) {
      stroke(30, 44, 68); strokeWeight(1); noFill();
      setLineDash([3, 3]);
      rect(s.thumbX, s.thumbY, s.thumbSide, s.thumbSide, 2);
      setLineDash([]);
      return;
    }

    // Animate falling into place
    let ty    = s.thumbY;
    let alpha = 1;
    if (s.animating) {
      ty    = lerp(s.heroY, s.thumbY, easeOut(s.animT));
      alpha = s.animT;
    }

    fill(c3[0], c3[1], c3[2], (isHov ? 60 : 30) * alpha); noStroke();
    rect(s.thumbX, ty, s.thumbSide, s.thumbSide, 2);
    stroke(c3[0], c3[1], c3[2], (isHov ? 255 : 180) * alpha);
    strokeWeight(isHov ? 2 : 1.5); noFill();
    rect(s.thumbX, ty, s.thumbSide, s.thumbSide, 2);

    if (s.thumbSide > 16) {
      noStroke(); fill(c3[0], c3[1], c3[2], 200 * alpha);
      textSize(8); textFont('monospace'); textAlign(CENTER);
      text((s.res**2).toFixed(0), s.thumbX + s.thumbSide/2, ty + s.thumbSide/2 + 3);
      textAlign(LEFT);
    }
  });

  // ── Progress ─────────────────────────────────────────────
  const done = step3Squares.filter(s => s.snapped).length;
  noStroke(); fill(80, 110, 160, 180);
  textSize(10); textFont('monospace'); textAlign(CENTER);
  text(done + ' / ' + stats.n + ' squares drawn', W / 2, H - 8);
  textAlign(LEFT);
}

function easeOut(t) { return 1 - (1 - t) * (1 - t); }

// Reset only when going back before step 3 (hero data may have changed)
window._s3OrigGoToSection = window.goToSection;
window.goToSection = function(s) {
  if (s < 3) step3Initted = false;
  if (window._s3OrigGoToSection) window._s3OrigGoToSection(s);
};
