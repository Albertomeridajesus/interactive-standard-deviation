// ============================================================
// utils.js — Shared math utilities
// Used by all tools on the site.
// To use: add <script src="../js/utils.js"></script> to any page
// ============================================================

/**
 * Calculate mean, variance, standard deviation, and sum of squares
 * from an array of numbers.
 * @param {number[]} vals
 * @returns {{ mean, variance, sd, ss, n, vals }}
 */
function calcStats(vals) {
  if (!vals || vals.length === 0) {
    return { mean: 0, variance: 0, sd: 0, ss: 0, n: 0, vals: [] };
  }
  const n        = vals.length;
  const mean     = vals.reduce((a, b) => a + b, 0) / n;
  const ss       = vals.reduce((a, b) => a + (b - mean) ** 2, 0);
  const variance = ss / n;
  const sd       = Math.sqrt(variance);
  return { mean, variance, sd, ss, n, vals };
}

/**
 * Clamp a number between min and max.
 */
function clamp(val, lo, hi) {
  return Math.max(lo, Math.min(hi, val));
}

/**
 * Round a number to d decimal places.
 * Named roundTo to avoid conflict with p5.js built-in round()
 */
function roundTo(val, d = 2) {
  return parseFloat(val.toFixed(d));
}

/**
 * Convert a hex color string to an [r, g, b] array.
 * @param {string} hex  e.g. "#00d4ff"
 */
function hexToRGB(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

/**
 * Gaussian (normal distribution) probability density function.
 * @param {number} x
 * @param {number} mean
 * @param {number} sd   standard deviation (must be > 0)
 */
function gaussian(x, mean, sd) {
  return (
    (1 / (sd * Math.sqrt(2 * Math.PI))) *
    Math.exp(-0.5 * ((x - mean) / sd) ** 2)
  );
}
