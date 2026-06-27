/* =========================================================================
   GAME 5 — Animal Sounds Parade
   A parade of cute animals. Tap any one to hear a playful synthesized
   animal sound + its spoken name + a bounce animation. No wrong answers.

   Sticker book: tapping an animal for the first time "collects" it
   (persisted). Collecting the whole set triggers a big celebration.
   ========================================================================= */
(function () {
  window.App = window.App || {};
  App.games = App.games || [];

  // Each `sound` is a function using the audio engine's tone/noiseBurst/
  // vibratoTone primitives — no audio files, just charming synthesized
  // textures that read as "that kind of animal" rather than literal speech.
  const ANIMALS = [
    { e: "🐱", n: "Cat", sound: () => {
        App.audio.vibratoTone({ freq: 540, glideTo: 760, dur: 0.32, vibFreq: 9, vibDepth: 25, type: "sine", gain: 0.2 });
        App.audio.tone({ freq: 700, glideTo: 480, dur: 0.16, when: 0.3, type: "sine", gain: 0.14 });
    }},
    { e: "🐶", n: "Dog", sound: () => {
        App.audio.noiseBurst({ dur: 0.1, filterFreq: 320, filterSweepTo: 180, q: 2, gain: 0.3, filterType: "lowpass" });
        App.audio.tone({ freq: 160, dur: 0.12, type: "square", gain: 0.18 });
        App.audio.noiseBurst({ dur: 0.1, filterFreq: 320, filterSweepTo: 180, q: 2, gain: 0.28, when: 0.2, filterType: "lowpass" });
        App.audio.tone({ freq: 150, dur: 0.12, when: 0.2, type: "square", gain: 0.17 });
    }},
    { e: "🐰", n: "Bunny", sound: () => {
        App.audio.tone({ freq: 700, dur: 0.07, type: "sine", gain: 0.14 });
        App.audio.tone({ freq: 900, dur: 0.07, when: 0.1, type: "sine", gain: 0.15 });
        App.audio.tone({ freq: 1100, dur: 0.08, when: 0.2, type: "sine", gain: 0.13 });
    }},
    { e: "🐘", n: "Elephant", sound: () => {
        App.audio.vibratoTone({ freq: 140, glideTo: 280, dur: 0.55, vibFreq: 15, vibDepth: 45, type: "sawtooth", gain: 0.22 });
    }},
    { e: "🦆", n: "Duck", sound: () => {
        App.audio.noiseBurst({ dur: 0.09, filterFreq: 950, filterSweepTo: 480, q: 3, gain: 0.26 });
        App.audio.noiseBurst({ dur: 0.09, filterFreq: 950, filterSweepTo: 480, q: 3, gain: 0.24, when: 0.16 });
    }},
    { e: "🐴", n: "Horse", sound: () => {
        App.audio.vibratoTone({ freq: 520, glideTo: 300, dur: 0.4, vibFreq: 19, vibDepth: 65, type: "sawtooth", gain: 0.2 });
    }},
    { e: "🦉", n: "Owl", sound: () => {
        App.audio.tone({ freq: 340, dur: 0.3, type: "sine", gain: 0.18 });
        App.audio.tone({ freq: 300, dur: 0.35, when: 0.32, type: "sine", gain: 0.18 });
    }},
    { e: "🦋", n: "Butterfly", sound: () => {
        App.audio.tone({ freq: 900, dur: 0.07, type: "triangle", gain: 0.12 });
        App.audio.tone({ freq: 1100, dur: 0.07, when: 0.06, type: "triangle", gain: 0.12 });
        App.audio.tone({ freq: 1300, dur: 0.08, when: 0.13, type: "triangle", gain: 0.11 });
    }},
    { e: "🐮", n: "Cow", sound: () => {
        App.audio.vibratoTone({ freq: 165, glideTo: 110, dur: 0.55, vibFreq: 6, vibDepth: 12, type: "sawtooth", gain: 0.22 });
    }},
    { e: "🐷", n: "Pig", sound: () => {
        App.audio.noiseBurst({ dur: 0.09, filterFreq: 500, filterSweepTo: 700, q: 4, gain: 0.24 });
        App.audio.noiseBurst({ dur: 0.09, filterFreq: 500, filterSweepTo: 700, q: 4, gain: 0.22, when: 0.14 });
    }},
    { e: "🦁", n: "Lion", sound: () => {
        App.audio.noiseBurst({ dur: 0.45, filterFreq: 220, filterSweepTo: 140, q: 1, gain: 0.26, filterType: "lowpass" });
        App.audio.vibratoTone({ freq: 110, dur: 0.45, vibFreq: 5, vibDepth: 15, type: "sawtooth", gain: 0.18 });
    }},
    { e: "🐑", n: "Sheep", sound: () => {
        App.audio.vibratoTone({ freq: 390, glideTo: 430, dur: 0.4, vibFreq: 12, vibDepth: 35, type: "sawtooth", gain: 0.2 });
    }},
    { e: "🐔", n: "Rooster", sound: () => {
        App.audio.tone({ freq: 600, glideTo: 950, dur: 0.18, type: "square", gain: 0.18 });
        App.audio.tone({ freq: 900, dur: 0.12, when: 0.2, type: "square", gain: 0.16 });
        App.audio.tone({ freq: 500, glideTo: 700, dur: 0.25, when: 0.34, type: "square", gain: 0.18 });
    }},
    { e: "🐵", n: "Monkey", sound: () => {
        [500, 650, 500, 650].forEach((f, i) => App.audio.tone({ freq: f, dur: 0.1, type: "triangle", gain: 0.16, when: i * 0.13 }));
    }},
    { e: "🐸", n: "Frog", sound: () => {
        App.audio.noiseBurst({ dur: 0.08, filterFreq: 250, q: 5, gain: 0.2 });
        App.audio.tone({ freq: 180, dur: 0.12, when: 0.07, type: "square", gain: 0.16 });
    }},
    { e: "🐦", n: "Bird", sound: () => {
        [1400, 1800, 1500].forEach((f, i) => App.audio.tone({ freq: f, dur: 0.06, type: "sine", gain: 0.13, when: i * 0.07 }));
    }},
  ];

  let foundSet = new Set();
  let stickerRow = null;

  function loadFound() {
    const saved = App.state.get("animalsFound") || [];
    foundSet = new Set(saved);
  }
  function saveFound() {
    App.state.set("animalsFound", Array.from(foundSet));
  }
  function updateStickerRow() {
    if (stickerRow) stickerRow.textContent = "📷 " + foundSet.size + " / " + ANIMALS.length + " found";
  }

  function onTap(el, a) {
    el.classList.remove("boing");
    void el.offsetWidth; // restart the bounce animation
    el.classList.add("boing");
    App.fx.sparkleAt(el, 8);
    a.sound();
    App.audio.speak(a.n + "!");

    const isNew = !foundSet.has(a.n);
    if (isNew) {
      foundSet.add(a.n);
      saveFound();
      updateStickerRow();
      el.classList.add("is-found");
      const badge = App.fx.el("div", { class: "new-badge", text: "New!" });
      el.appendChild(badge);
      setTimeout(() => badge.remove(), 1300);

      if (foundSet.size === ANIMALS.length) {
        setTimeout(() => {
          App.fx.celebrate({
            message: "You found every animal in the parade!",
            emoji: "🏆",
            duration: 3200,
          });
        }, 500);
      }
    }
  }

  function start(root) {
    loadFound();
    const parade = App.fx.el("div", { class: "scene parade" });

    const bannerText = "🎉 🌸 🦋 ⭐ 🎈 ".repeat(20);
    parade.appendChild(App.fx.el("div", { class: "parade__banner", text: bannerText }));

    stickerRow = App.fx.el("div", { class: "sticker-row" });
    updateStickerRow();
    parade.appendChild(stickerRow);

    const row = App.fx.el("div", { class: "parade__row" });
    ANIMALS.forEach((a) => {
      const critter = App.fx.el("button", {
        class: "critter" + (foundSet.has(a.n) ? " is-found" : ""),
        text: a.e, "aria-label": a.n,
      });
      critter.addEventListener("pointerdown", (e) => { e.preventDefault(); onTap(critter, a); });
      row.appendChild(critter);
    });
    parade.appendChild(row);
    root.appendChild(parade);

    setTimeout(() => App.audio.speak("Tap an animal to hear its sound!"), 300);
  }

  function stop() { stickerRow = null; }

  App.games.push({
    id: "animals",
    name: "Animal Parade",
    icon: "🐘",
    tileBg: "linear-gradient(160deg, #cfe8ff, #cdf3df)",
    start, stop,
  });
})();
