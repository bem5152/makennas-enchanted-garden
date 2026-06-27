/* =========================================================================
   Audio engine — all sound is generated at runtime (zero audio files).
   - Web Speech API (speechSynthesis) for friendly voice narration
   - Web Audio API for tap/correct/win sound effects + a soft music loop
   - Everything unlocks on the first user tap (iOS autoplay policy)
   ========================================================================= */
window.App = window.App || {};

App.audio = (function () {
  let ctx = null;
  let master = null;     // master gain (mute affects this)
  let musicGain = null;  // background music sub-mix
  let unlocked = false;
  let muted = false;
  let musicTimer = null;
  let voices = [];

  /* ---- setup ---- */
  function ensureCtx() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.9;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.05;          // background music stays gentle
    musicGain.connect(master);
  }

  // Called from the very first user gesture so iOS allows audio + speech.
  function unlock() {
    ensureCtx();
    if (ctx && ctx.state === "suspended") ctx.resume();
    if (!unlocked) {
      unlocked = true;
      loadVoices();
      startMusic();
    }
  }

  /* ---- low-level tone ---- */
  function tone(opts) {
    ensureCtx();
    if (!ctx || muted) return;
    const o = Object.assign(
      { freq: 440, dur: 0.18, type: "sine", gain: 0.18, when: 0, glideTo: null, dest: master },
      opts
    );
    const t = ctx.currentTime + o.when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.type;
    osc.frequency.setValueAtTime(o.freq, t);
    if (o.glideTo) osc.frequency.exponentialRampToValueAtTime(o.glideTo, t + o.dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(o.gain, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    osc.connect(g);
    g.connect(o.dest);
    osc.start(t);
    osc.stop(t + o.dur + 0.06);
  }

  function arp(freqs, opts) {
    const base = opts || {};
    const step = base.step || 0.09;
    freqs.forEach((f, i) =>
      tone(Object.assign({}, base, { freq: f, when: (base.when || 0) + i * step }))
    );
  }

  /* ---- named sound effects ---- */
  const sfx = {
    tap:     () => tone({ freq: 680, dur: 0.1, type: "sine", gain: 0.14 }),
    pop:     () => tone({ freq: 480, glideTo: 820, dur: 0.12, type: "sine", gain: 0.15 }),
    flip:    () => tone({ freq: 420, glideTo: 640, dur: 0.12, type: "triangle", gain: 0.13 }),
    chime:   () => tone({ freq: 900 + Math.random() * 260, dur: 0.16, type: "sine", gain: 0.1 }),
    correct: () => arp([523, 659, 784], { dur: 0.22, type: "triangle", gain: 0.18 }),
    match:   () => arp([659, 784, 988], { dur: 0.22, type: "triangle", gain: 0.18 }),
    wrong:   () => tone({ freq: 330, glideTo: 240, dur: 0.28, type: "sine", gain: 0.12 }),
    win:     () => arp([523, 659, 784, 1047, 1319], { dur: 0.3, step: 0.12, type: "triangle", gain: 0.2 }),
  };
  function play(name) { if (sfx[name]) sfx[name](); }

  /* ---- gentle generated background music ---- */
  // A slow, soft pentatonic twinkle over a calm 4-chord loop. Pure ear candy.
  const CHORDS = [
    [261.63, 329.63, 392.0],  // C
    [220.0, 277.18, 329.63],  // Am
    [349.23, 440.0, 523.25],  // F
    [392.0, 493.88, 587.33],  // G
  ];
  const TWINKLE = [523.25, 587.33, 659.25, 783.99, 880.0];
  let bar = 0;
  function musicStep() {
    if (!ctx || muted) return;
    const chord = CHORDS[bar % CHORDS.length];
    // soft pad: long, quiet notes
    chord.forEach((f) =>
      tone({ freq: f, dur: 1.9, type: "sine", gain: 0.05, dest: musicGain })
    );
    // a couple of twinkles on top
    for (let i = 0; i < 2; i++) {
      const f = TWINKLE[Math.floor(Math.random() * TWINKLE.length)];
      tone({ freq: f, dur: 0.5, type: "triangle", gain: 0.035, when: 0.3 + i * 0.6, dest: musicGain });
    }
    bar++;
  }
  function startMusic() {
    if (musicTimer || !ctx) return;
    musicStep();
    musicTimer = setInterval(musicStep, 2000);  // one calm bar every 2s
  }

  /* ---- speech narration ---- */
  function loadVoices() {
    if (!("speechSynthesis" in window)) return;
    voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) {
      // iOS loads voices asynchronously
      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices() || [];
      };
    }
  }
  function pickVoice() {
    if (!voices.length) voices = (window.speechSynthesis.getVoices && window.speechSynthesis.getVoices()) || [];
    const en = voices.filter((v) => /^en(-|_|$)/i.test(v.lang));
    const pref = ["Samantha", "Karen", "Moira", "Tessa", "Google US English", "Victoria", "Female"];
    for (const name of pref) {
      const m = en.find((v) => v.name && v.name.indexOf(name) !== -1);
      if (m) return m;
    }
    return en[0] || voices[0] || null;
  }

  // speak(text, { rate, pitch, onend })
  function speak(text, opts) {
    opts = opts || {};
    if (muted || !("speechSynthesis" in window)) { if (opts.onend) setTimeout(opts.onend, 200); return; }
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text));
      u.rate = opts.rate != null ? opts.rate : 0.92;   // a touch slow for a toddler
      u.pitch = opts.pitch != null ? opts.pitch : 1.18; // bright, friendly
      u.volume = 1;
      const v = pickVoice();
      if (v) u.voice = v;
      if (opts.onend) u.onend = opts.onend;
      window.speechSynthesis.speak(u);
    } catch (e) {
      if (opts.onend) opts.onend();
    }
  }
  function stopSpeech() {
    try { window.speechSynthesis.cancel(); } catch (e) {}
  }

  /* ---- mute ---- */
  function setMuted(m) {
    muted = !!m;
    if (master) master.gain.value = muted ? 0 : 0.9;
    if (muted) stopSpeech();
  }
  function isMuted() { return muted; }

  return {
    unlock, play, tone, speak, stopSpeech,
    setMuted, isMuted,
    get unlocked() { return unlocked; },
  };
})();
