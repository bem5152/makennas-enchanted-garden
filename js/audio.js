/* =========================================================================
   Audio engine — all sound is generated at runtime (zero audio files).
   - Web Speech API (speechSynthesis) for friendly voice narration
   - Web Audio API for tap/correct/win SFX, richer noise/vibrato textures
     for animal sounds, and a soft music loop
   - Everything unlocks on the first user tap (iOS autoplay policy)
   - Volume is a 0..1 float (not a boolean mute) so it can be slider-driven
   ========================================================================= */
window.App = window.App || {};

App.audio = (function () {
  let ctx = null;
  let master = null;     // master gain — driven by `volume`
  let musicGain = null;  // background music sub-mix
  let unlocked = false;
  let volume = 0.85;     // 0..1
  let musicTimer = null;
  let voices = [];
  let voiceName = null;  // user-picked voice name, or null = auto-pick best
  let noiseBuf = null;

  /* ---- setup ---- */
  function ensureCtx() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.06;          // background music stays gentle
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
    if (!ctx || volume <= 0) return;
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

  /* ---- noise + vibrato primitives (richer, more "animal-like" textures) ---- */
  function getNoiseBuffer() {
    ensureCtx();
    if (!ctx) return null;
    if (noiseBuf) return noiseBuf;
    const len = Math.floor(ctx.sampleRate * 1.2);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    noiseBuf = buf;
    return buf;
  }

  // A filtered burst of noise — good for barks, quacks, growls, snorts.
  function noiseBurst(opts) {
    ensureCtx();
    if (!ctx || volume <= 0) return;
    const o = Object.assign(
      { dur: 0.18, filterFreq: 800, filterSweepTo: null, q: 1.5, gain: 0.22, when: 0, filterType: "bandpass", dest: master },
      opts
    );
    const t = ctx.currentTime + o.when;
    const src = ctx.createBufferSource();
    src.buffer = getNoiseBuffer();
    src.loop = true;
    const filt = ctx.createBiquadFilter();
    filt.type = o.filterType;
    filt.frequency.setValueAtTime(o.filterFreq, t);
    if (o.filterSweepTo) filt.frequency.exponentialRampToValueAtTime(o.filterSweepTo, t + o.dur);
    filt.Q.value = o.q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(o.gain, t + Math.min(0.03, o.dur / 4));
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    src.connect(filt);
    filt.connect(g);
    g.connect(o.dest);
    src.start(t);
    src.stop(t + o.dur + 0.05);
  }

  // A tone with pitch wobble (vibrato/warble) — good for moos, neighs, baas, roars.
  function vibratoTone(opts) {
    ensureCtx();
    if (!ctx || volume <= 0) return;
    const o = Object.assign(
      { freq: 440, dur: 0.4, type: "sine", gain: 0.18, when: 0, vibFreq: 7, vibDepth: 18, glideTo: null, dest: master },
      opts
    );
    const t = ctx.currentTime + o.when;
    const osc = ctx.createOscillator();
    osc.type = o.type;
    osc.frequency.setValueAtTime(o.freq, t);
    if (o.glideTo) osc.frequency.exponentialRampToValueAtTime(o.glideTo, t + o.dur);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = o.vibFreq;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = o.vibDepth;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(o.gain, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    osc.connect(g);
    g.connect(o.dest);
    lfo.start(t);
    osc.start(t);
    lfo.stop(t + o.dur + 0.05);
    osc.stop(t + o.dur + 0.05);
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
    levelup: () => arp([659, 784, 988, 1319], { dur: 0.26, step: 0.1, type: "triangle", gain: 0.2 }),
  };
  function play(name) { if (sfx[name]) sfx[name](); }

  /* ---- gentle generated background music ---- */
  const CHORDS = [
    [261.63, 329.63, 392.0],  // C
    [220.0, 277.18, 329.63],  // Am
    [349.23, 440.0, 523.25],  // F
    [392.0, 493.88, 587.33],  // G
  ];
  const TWINKLE = [523.25, 587.33, 659.25, 783.99, 880.0];
  let bar = 0;
  function musicStep() {
    if (!ctx || volume <= 0) return;
    const chord = CHORDS[bar % CHORDS.length];
    chord.forEach((f) =>
      tone({ freq: f, dur: 1.9, type: "sine", gain: 0.05, dest: musicGain })
    );
    for (let i = 0; i < 2; i++) {
      const f = TWINKLE[Math.floor(Math.random() * TWINKLE.length)];
      tone({ freq: f, dur: 0.5, type: "triangle", gain: 0.035, when: 0.3 + i * 0.6, dest: musicGain });
    }
    bar++;
  }
  function startMusic() {
    if (musicTimer || !ctx) return;
    musicStep();
    musicTimer = setInterval(musicStep, 2000);
  }

  /* ---- speech narration ---- */
  function loadVoices() {
    if (!("speechSynthesis" in window)) return;
    voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) {
      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices() || [];
      };
    }
  }

  // Voices flagged "Enhanced"/"Premium" (iOS) sound dramatically less robotic
  // than the default "Compact" voices — prefer those first.
  function pickVoice() {
    if (!voices.length) voices = (window.speechSynthesis.getVoices && window.speechSynthesis.getVoices()) || [];
    const en = voices.filter((v) => /^en(-|_|$)/i.test(v.lang));
    const enhanced = en.find((v) => /enhanced|premium|neural/i.test(v.name));
    if (enhanced) return enhanced;
    const pref = ["Samantha", "Ava", "Karen", "Moira", "Tessa", "Google US English", "Victoria", "Female"];
    for (const name of pref) {
      const m = en.find((v) => v.name && v.name.indexOf(name) !== -1);
      if (m) return m;
    }
    return en[0] || voices[0] || null;
  }

  function listVoices() {
    if (!("speechSynthesis" in window)) return [];
    voices = window.speechSynthesis.getVoices() || [];
    return voices
      .filter((v) => /^en(-|_|$)/i.test(v.lang))
      .map((v) => ({ name: v.name, lang: v.lang }));
  }
  function setVoiceByName(name) { voiceName = name || null; }
  function getVoiceName() { return voiceName; }

  function resolveVoice() {
    if (!voices.length) voices = (window.speechSynthesis.getVoices && window.speechSynthesis.getVoices()) || [];
    if (voiceName) {
      const exact = voices.find((v) => v.name === voiceName);
      if (exact) return exact;
    }
    return pickVoice();
  }

  // speak(text, { rate, pitch, onend })
  function speak(text, opts) {
    opts = opts || {};
    if (volume <= 0 || !("speechSynthesis" in window)) { if (opts.onend) setTimeout(opts.onend, 200); return; }
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text));
      // Near-natural pitch/rate — pitch-shifting away from 1.0 is what makes
      // synthetic voices sound robotic, so we stay close to neutral.
      u.rate = opts.rate != null ? opts.rate : 0.97;
      u.pitch = opts.pitch != null ? opts.pitch : 1.04;
      u.volume = Math.max(0, Math.min(1, volume));
      const v = resolveVoice();
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

  /* ---- volume ---- */
  function setVolume(v) {
    volume = Math.max(0, Math.min(1, v));
    if (master) master.gain.value = volume;
    if (volume <= 0) stopSpeech();
  }
  function getVolume() { return volume; }

  return {
    unlock, play, tone, noiseBurst, vibratoTone, speak, stopSpeech,
    setVolume, getVolume, listVoices, setVoiceByName, getVoiceName,
    get unlocked() { return unlocked; },
  };
})();
