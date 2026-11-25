// ============================================================
// sd-step5.js — Step 5: Standard Deviation
// Interactive pad: number line with ±1/2/3σ bands + red σ arrow
// Reads from: heroes[], sdAnim (sd-state.js)
// ============================================================

function drawStep5(stats) {
  if (stats.n < 2) { drawNotEnough(); return; }

  const a  = sdAnim; // animation 0→1 from sd-state.js
  const lx = 40, rx = W - 40, ly = H / 2 + 10;

  // Title
  noStroke(); fill(0, 212, 255, 200 * a);
  textSize(12); textFont('monospace');
  text('STANDARD DEVIATION  =  √variance  =  σ', 20, 28);

  // Number line
  stroke(50, 70, 100); strokeWeight(2);
  line(lx, ly, rx, ly);

  // Mean marker (green tick)
  const mx = lx + (rx - lx) / 2;
  stroke(6, 214, 160); strokeWeight(2);
  line(mx, ly - 14, mx, ly + 14);
  noStroke(); fill(6, 214, 160);
  textSize(10); textFont('monospace'); textAlign(CENTER);
  text('μ', mx, ly + 26);
  textAlign(LEFT);

  // ±1σ, ±2σ, ±3σ shaded bands
  // Each band animates out from centre via sdAnim
  const sc = (rx - lx) / (stats.sd * 9); // scale factor: σ → canvas pixels
  [[1, '#00d4ff', 0.22, 170], [2, '#ffd166', 0.10, 100], [3, '#ff6b6b', 0.06, 60]]
    .forEach(([m, hex, fillA, strokeA]) => {
      const c  = hexToRGB(hex);
      const x1 = mx - stats.sd * sc * m * a;
      const x2 = mx + stats.sd * sc * m * a;

      // Shaded band
      fill(c[0], c[1], c[2], fillA * 255 * a); noStroke();
      rect(x1, ly - 6, x2 - x1, 12, 3);

      // Band edge lines
      stroke(c[0], c[1], c[2], strokeA * a);
      strokeWeight(m === 1 ? 2 : 1.2); noFill();
      line(x1, ly - 10, x1, ly + 10);
      line(x2, ly - 10, x2, ly + 10);

      // Labels on ±1σ only
      if (m === 1) {
        noStroke(); fill(c[0], c[1], c[2], 180 * a);
        textSize(9); textFont('monospace'); textAlign(CENTER);
        text('−σ', x1, ly - 14);
        text('+σ', x2, ly - 14);
        textAlign(LEFT);
      }
    });

  // Heroes positioned on line by their actual value
  const minV = min(stats.vals), maxV = max(stats.vals), rng = maxV - minV || 1;
  heroes.forEach((h, i) => {
    const x   = lx + ((h.val - minV) / rng) * (rx - lx - 40) + 20;
    const col = h.col;
    const z   = (h.val - stats.mean) / stats.sd;

    drawSmiley(x, ly - 30, col, false, true);

    stroke(col[0], col[1], col[2], 80); strokeWeight(1);
    line(x, ly - 12, x, ly + 8);

    // Red warning ring around outliers (beyond ±2σ)
    if (abs(z) > 2) {
      noFill(); stroke(255, 107, 107, 160); strokeWeight(2);
      ellipse(x, ly - 30, 22, 22);
    }
  });

  // Red σ arrow from mean to +1σ
  const sx2 = mx + stats.sd * sc * a;
  stroke(255, 107, 107, 220 * a); strokeWeight(3);
  line(mx, ly - 4, sx2, ly - 4);
  fill(255, 107, 107, 220 * a); noStroke();
  triangle(sx2, ly - 8, sx2, ly, sx2 + 7, ly - 4);
  textSize(11); textFont('monospace'); textAlign(CENTER);
  text('σ', (mx + sx2) / 2, ly - 12);
  textAlign(LEFT);

  // Final answer
  fill(0, 212, 255, 230 * a);
  textSize(22); textFont('monospace'); textAlign(CENTER);
  text('σ = ' + stats.sd.toFixed(2), W / 2, H - 28);
  fill(80, 110, 160, 180 * a); textSize(11);
  text('√' + stats.variance.toFixed(2) + '  =  ' + stats.sd.toFixed(4), W / 2, H - 10);
  textAlign(LEFT);
}
