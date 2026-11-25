// ============================================================
// character.js — The interactive guide character
//
// TO SWAP THE CHARACTER: only edit this file.
// Nothing in sd-step1.js, sd-state.js, or the HTML needs
// to change when you replace this character.
//
// HOW IT WORKS:
// 1. CHARACTER defines who they are (name, colors, personality)
// 2. RESPONSES defines what they say in each situation
// 3. drawCharacter() draws them in the dialogue box
// 4. character.say() is called from sd-step1.js with a trigger key
// 5. character.draw() renders the dialogue box on the canvas
// ============================================================

// ── WHO IS THE CHARACTER? ────────────────────────────────
// Change everything in this block to swap characters completely
const CHARACTER = {
  name:       'Captain Sigma',
  role:       'Your flight analyst superhero',
  color:      [0, 212, 255],     // suit color [r, g, b]
  accentColor:[255, 215, 50],    // star / highlight color
  capeColor:  [180, 0, 0],       // cape color
  emoji:      '🦸',              // used in HTML dialogue box
};

// ── WHAT DOES THE CHARACTER SAY? ────────────────────────
// Each key is a trigger. Call character.say('key') to show it.
// You can add as many triggers as you want.
// Use {sd}, {mean}, {n} as placeholders — they get replaced
// with the student's actual live values automatically.
const RESPONSES = {

  // ── Opening / greeting ──────────────────────────────
  greeting: [
    "Welcome, recruit! I'm Captain Sigma — your flight analyst. Fly your hero across the sky and I'll track their altitude. Ready for takeoff? 🚀",
    "Captain Sigma here! Every great hero needs a data analyst. Fly across those checkpoints and let's see what your numbers look like!",
  ],

  // ── Encouraging while flying ─────────────────────────
  flying: [
    "Nice moves! Keep going — hit all the checkpoints!",
    "Looking good up there! Don't miss any checkpoints!",
    "That's it! Fly across the whole sky to get full data.",
  ],

  // ── First bar recorded ───────────────────────────────
  first_bar: [
    "First altitude recorded! Now keep flying — I need more data points to calculate anything useful.",
    "Checkpoint t1 locked in! Keep going — I need at least 2 readings to start my analysis.",
  ],

  // ── Enough data to show stats ────────────────────────
  has_data: [
    "Now we're talking! I'm calculating your stats. Your average altitude (μ) is {mean}. Can you guess what σ means?",
    "Flight data incoming! Mean altitude = {mean}. Now here's a question — what does σ = {sd} tell us about your flight?",
  ],

  // ── σ is very small (tight flight) ──────────────────
  sd_small: [
    "Whoa, σ = {sd}! That's an incredibly smooth flight path. You barely changed altitude at all. What does that tell you about your hero?",
    "σ = {sd} — that's nearly a straight line! In statistics, a small σ means your data is very... what's the word you'd use?",
  ],

  // ── σ is medium ──────────────────────────────────────
  sd_medium: [
    "σ = {sd} — moderate turbulence! Your hero is bobbing around a bit. How could you reduce that number?",
    "Not bad! σ = {sd} means there's some variation in altitude. What would happen if you tried to fly in a perfectly straight line?",
  ],

  // ── σ is large (erratic flight) ──────────────────────
  sd_large: [
    "σ = {sd}?! That's a wild ride! Your hero is all over the sky. What do you think is causing such a large standard deviation?",
    "Turbulence alert! σ = {sd} means your altitudes are very spread out from the average. Can you smooth out the flight path?",
  ],

  // ── All checkpoints filled ───────────────────────────
  all_filled: [
    "Full flight recorded! {n} checkpoints captured. σ = {sd}. Now click Next to see what those altitude differences actually look like plotted out.",
    "Mission data complete! Your hero flew {n} checkpoints with σ = {sd}. Head to Step 2 to see the deviations visualized!",
  ],

  // ── Student clicks Next before enough data ───────────
  not_enough: [
    "Hold on, recruit! I need at least 3 altitude readings before we can calculate a meaningful standard deviation. Keep flying!",
    "Not enough data yet! Fly across more checkpoints — I'd recommend at least 5 for a good analysis.",
  ],

  // ── Hint questions (Socratic — never give the answer) ─
  question_sd_small: [
    "Here's a challenge: how would you fly to make σ as SMALL as possible? Try it and see what happens!",
    "Think about it — if σ measures spread, what kind of flight path would give you the smallest possible σ?",
  ],

  question_sd_meaning: [
    "Quick question: if two heroes both have a mean altitude of 50, but one has σ=5 and the other has σ=40 — what's different about their flights?",
    "σ = {sd} for your flight. In plain English, what would you say that number means about how your hero flew?",
  ],

  // ── Celebration ──────────────────────────────────────
  great_job: [
    "Excellent analysis, recruit! You're thinking like a statistician. Onward to Step 2!",
    "That's exactly right! σ measures spread — and you figured it out from the flight path. Captain Sigma approves! ✅",
  ],

  // ── Fallback ─────────────────────────────────────────
  fallback: [
    "Interesting flight pattern! Keep exploring — the data will tell its own story.",
    "Every data point matters! Keep recording those altitudes.",
  ],
};

// ── CHARACTER STATE ───────────────────────────────────────
const character = {
  currentMessage: null,  // the message currently displayed
  messageTimer:   0,     // how long to show the message (frames)
  lastTrigger:    null,  // prevents the same trigger repeating immediately
  bubbleAnim:     0,     // 0→1 pop-in animation
  messageQueue:   [],    // queued messages if one is already showing

  // ── Say something ──────────────────────────────────
  // trigger = key from RESPONSES above
  // stats   = current { mean, sd, variance, n } object
  say(trigger, stats) {
    // Don't repeat the same trigger back to back
    if (trigger === this.lastTrigger) return;
    this.lastTrigger = trigger;

    const options = RESPONSES[trigger] || RESPONSES.fallback;
    let msg = options[floor(random(options.length))];

    // Replace placeholders with live stats
    if (stats) {
      msg = msg
        .replace('{sd}',   stats.sd       ? stats.sd.toFixed(1)       : '—')
        .replace('{mean}', stats.mean     ? stats.mean.toFixed(1)     : '—')
        .replace('{var}',  stats.variance ? stats.variance.toFixed(1) : '—')
        .replace('{n}',    stats.n        ? stats.n                   : '—');
    }

    this.currentMessage = msg;
    this.messageTimer   = 280;  // show for ~4.5 seconds at 60fps
  },

  // ── Update each frame ─────────────────────────────
  update() {
    if (this.messageTimer > 0) {
      this.messageTimer--;
      if (this.messageTimer === 0) {
        this.currentMessage = null;
        this.lastTrigger    = null;
      }
    }
  },

  // ── Update HTML dialogue box outside the canvas ───
  drawBubble(canvasW, canvasH) {
    const bubble = document.getElementById('sigma-bubble');
    const msgEl  = document.getElementById('sigma-msg');
    if (!bubble || !msgEl) return;
    if (!this.currentMessage || this.messageTimer === 0) {
      bubble.style.display = 'none';
      return;
    }
    bubble.style.display = 'block';
    msgEl.textContent = this.currentMessage;
  },
};

// ── TRIGGER LOGIC ────────────────────────────────────────
// Called from sd-step1.js every frame with current stats.
// Decides which message to show based on what's happening.
// You can add new conditions here freely.
function updateCharacter(stats, filledCount, numCols) {
  character.update();

  // Don't spam messages — only trigger when no message is showing
  if (character.messageTimer > 60) return;

  const sd = stats.sd || 0;
  const n  = stats.n  || 0;

  // Priority order — first match wins
  if (filledCount === 0) {
    // Do nothing — greeting is shown on page load separately
  } else if (filledCount === 1) {
    character.say('first_bar', stats);
  } else if (filledCount === numCols) {
    character.say('all_filled', stats);
  } else if (n >= 2 && sd > 0 && sd < 8) {
    character.say('sd_small', stats);
  } else if (n >= 2 && sd >= 8 && sd < 25) {
    character.say('sd_medium', stats);
  } else if (n >= 2 && sd >= 25) {
    character.say('sd_large', stats);
  } else if (n >= 2 && filledCount >= 3) {
    character.say('has_data', stats);
  }
}