// ============================================================
// sd-step2.js — Step 2: Plot the Deviations
// Sky + bars (read-only). A draggable dot sits on the mean line
// for each bar. Drag it to the hero to reveal the residual.
// All must be snapped before Next is unlocked.
// ============================================================

// ── State ─────────────────────────────────────────────────
let step2Dots       = [];   // { x, dragY, snapped, targetY, res }
let step2Dragging   = -1;   // index of dot being dragged (-1 = none)
let step2DragOffY   = 0;    // offset from dot centre when drag started
let step2Initted    = false;// has initStep2Dots() run for this dataset?
let step2ShowBars   = true; // toggle bars on/off

const SNAP_RADIUS   = 22;   // px — how close before snapping
const DOT_R         = 7;    // draggable dot radius
const BLUE          = [0, 212, 255]; // unified color for dots + lines

// Call this whenever entering step 2 or heroes change
function initStep2Dots() {
  const stats = getHeroStats();
  if (stats.n < 2) return;
  const meanY = valToY(stats.mean);
  const sp    = (W - 80) / stats.n;

  step2Dots = heroes.map((h, i) => {
    const x       = 50 + i * sp;
    const targetY = clamp(valToY(h.val), 28, H - 60);
    const res     = h.val - stats.mean;
    return { x, dragY: meanY, snapped: false, targetY, res, col: h.col };
  });
  step2Dragging = -1;
  step2Initted  = true;
  updateStep2NextBtn();
}

// Enable / disable the Next button based on snap progress
function updateStep2NextBtn() {
  const btn = document.getElementById('step2-next');
  if (!btn) return;
  const allSnapped = step2Dots.length > 0 && step2Dots.every(d => d.snapped);
  btn.disabled       = !allSnapped;
  btn.style.opacity  = allSnapped ? '1'        : '0.35';
  btn.style.cursor   = allSnapped ? 'pointer'  : 'not-allowed';
}

// Toggle bars — called from HTML button
window.toggleStep2Bars = function() {
  step2ShowBars = !step2ShowBars;
  const btn = document.getElementById('step2-bars-btn');
  if (btn) btn.textContent = step2ShowBars ? 'Hide bars' : 'Show bars';
};

// ── p5 mouse events (only active in section 2) ────────────
function step2MousePressed() {
  if (currentSection !== 2 || step2Dots.length === 0) return;
  for (let i = 0; i < step2Dots.length; i++) {
    const d = step2Dots[i];
    if (d.snapped) continue;
    const dx = mouseX - d.x, dy = mouseY - d.dragY;
    if (Math.sqrt(dx*dx + dy*dy) < DOT_R + 6) {
      step2Dragging = i;
      step2DragOffY = dy;
      return;
    }
  }
}

function step2MouseReleased() {
  step2Dragging = -1;
}

// Hook into p5 global events
const _s2OrigPressed  = window.mousePressed  || function(){};
const _s2OrigReleased = window.mouseReleased || function(){};

window.mousePressed = function() {
  step2MousePressed();
  _s2OrigPressed();
};
window.mouseReleased = function() {
  step2MouseReleased();
  _s2OrigReleased();
};

// ============================================================
// DRAW STEP 2
// ============================================================
function drawStep2(stats) {
  if (stats.n < 2) { drawNotEnough(); return; }

  // Re-init if heroes changed (e.g. user went back to step 1)
  if (!step2Initted || step2Dots.length !== stats.n) initStep2Dots();

  // ── Update dragged dot ───────────────────────────────────
  if (step2Dragging >= 0) {
    const d = step2Dots[step2Dragging];
    d.dragY = clamp(mouseY - step2DragOffY, 20, H - 20);

    // Snap check
    if (Math.abs(d.dragY - d.targetY) < SNAP_RADIUS) {
      d.dragY   = d.targetY;
      d.snapped = true;
      step2Dragging = -1;
      updateStep2NextBtn();
    }
  }

  // ── Sky background (same as step 1) ─────────────────────
  drawSky();

  const meanY = valToY(stats.mean);
  const sp    = (W - 80) / stats.n;
  const bw    = sp - 4;

  // ── Bars (optional) ──────────────────────────────────────
  heroes.forEach((h, i) => {
    const cx = 50 + i * sp;
    const by = valToY(h.val);
    const hc = h.col;

    if (step2ShowBars) {
      fill(hc[0], hc[1], hc[2], 60); noStroke();
      rect(cx - bw/2, by, bw, H - 45 - by, 3, 3, 0, 0);
      stroke(hc[0], hc[1], hc[2], 140);
      strokeWeight(1); noFill();
      rect(cx - bw/2, by, bw, H - 45 - by, 3, 3, 0, 0);

      // Altitude label
      noStroke(); fill(255, 255, 255, 180);
      textSize(max(8, min(10, bw * 0.5)));
      textFont('monospace'); textAlign(CENTER);
      text(h.val.toFixed(0), cx, by - 6);
    }

    // Time label always visible
    noStroke(); fill(80, 120, 160, 180); textSize(8);
    textFont('monospace'); textAlign(CENTER);
    text('t' + (i + 1), cx, H - 36);
    textAlign(LEFT);

    // Hero at top of bar
    drawFlyingHero(cx, by - 2, [0, 212, 255], 0.45, false);
  });

  // ── Mean line (prominent) ────────────────────────────────
  stroke(6, 214, 160, 40); strokeWeight(10);
  line(20, meanY, W - 20, meanY);
  stroke(6, 214, 160, 255); strokeWeight(3);
  setLineDash([10, 6]); line(20, meanY, W - 20, meanY); setLineDash([]);
  // Label on the LEFT side
  noStroke(); fill(6, 214, 160);
  textSize(12); textFont('monospace');
  text('μ = ' + stats.mean.toFixed(1), 22, meanY - 9);

  // ── Dots + residual lines ────────────────────────────────
  const snappedCount = step2Dots.filter(d => d.snapped).length;

  step2Dots.forEach((d, i) => {
    if (d.snapped) {
      // Locked residual line — blue
      stroke(d.col[0], d.col[1], d.col[2], 200); strokeWeight(2.5);
      line(d.x, meanY, d.x, d.targetY);

      // Residual label — blue
      noStroke(); fill(d.col[0], d.col[1], d.col[2], 230);
      textSize(11); textFont('monospace'); textAlign(CENTER);
      const labelY = d.res >= 0 ? d.targetY - 36 : d.targetY + 48;
      text((d.res >= 0 ? '+' : '') + d.res.toFixed(1), d.x, labelY);
      textAlign(LEFT);

      // Green snap dot on mean line
      fill(6, 214, 160); noStroke();
      ellipse(d.x, meanY, DOT_R * 1.4, DOT_R * 1.4);

    } else {
      // Live drag line (dashed) — blue
      if (d.dragY !== meanY) {
        stroke(d.col[0], d.col[1], d.col[2], 130); strokeWeight(2);
        setLineDash([5, 4]);
        line(d.x, meanY, d.x, d.dragY);
        setLineDash([]);

        // Live distance readout — blue
        const liveDist = yToVal(meanY) - yToVal(d.dragY);
        noStroke(); fill(d.col[0], d.col[1], d.col[2], 200);
        textSize(10); textFont('monospace'); textAlign(CENTER);
        text((liveDist >= 0 ? '+' : '') + liveDist.toFixed(1), d.x + 22, (meanY + d.dragY) / 2);
        textAlign(LEFT);
      }

      // Draggable dot — blue, yellow when actively dragging
      const isActive = step2Dragging === i;
      fill(isActive ? 255 : d.col[0], isActive ? 215 : d.col[1], isActive ? 50 : d.col[2]);
      stroke(255, 255, 255, isActive ? 220 : 120); strokeWeight(isActive ? 2.5 : 1.5);
      ellipse(d.x, d.dragY, DOT_R * 2, DOT_R * 2);

      // Up/down arrow hints when dot is still on mean line
      if (d.dragY === meanY) {
        noStroke(); fill(255, 255, 255, 90);
        triangle(d.x, meanY - DOT_R - 8, d.x - 5, meanY - DOT_R - 2, d.x + 5, meanY - DOT_R - 2);
        triangle(d.x, meanY + DOT_R + 8, d.x - 5, meanY + DOT_R + 2, d.x + 5, meanY + DOT_R + 2);
      }
    }
  });

  // ── Progress counter ─────────────────────────────────────
  noStroke(); fill(80, 110, 160, 180);
  textSize(10); textFont('monospace'); textAlign(CENTER);
  text(snappedCount + ' / ' + stats.n + ' residuals found', W / 2, H - 10);
  textAlign(LEFT);
}

// Reset dots only when going back to step 1 (hero data may have changed)
window._s2OrigGoToSection = window.goToSection;
window.goToSection = function(s) {
  if (s < 2) step2Initted = false;
  if (window._s2OrigGoToSection) window._s2OrigGoToSection(s);
};
