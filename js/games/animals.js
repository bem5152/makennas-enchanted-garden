/* =========================================================================
   GAME 5 — Animal Sounds Parade
   A parade of cute animals. Tap any one to hear its name + sound, see it
   bounce, and get a playful musical note. No wrong answers — pure joy.
   ========================================================================= */
(function () {
  window.App = window.App || {};
  App.games = App.games || [];

  const ANIMALS = [
    { e: "🐱", n: "Cat", s: "Meow meow", notes: [[760, 0], [560, 0.13]], type: "sine" },
    { e: "🐶", n: "Dog", s: "Woof woof", notes: [[260, 0], [180, 0.14]], type: "square" },
    { e: "🐰", n: "Bunny", s: "Hop hop", notes: [[520, 0], [780, 0.1]], type: "sine" },
    { e: "🐘", n: "Elephant", s: "Pa-rooo", notes: [[150, 0], [110, 0.28]], type: "sawtooth" },
    { e: "🦆", n: "Duck", s: "Quack quack", notes: [[620, 0], [500, 0.12], [620, 0.24]], type: "square" },
    { e: "🐴", n: "Horse", s: "Neigh", notes: [[470, 0], [410, 0.1], [540, 0.2]], type: "sawtooth" },
    { e: "🦉", n: "Owl", s: "Hoo hoo", notes: [[360, 0], [300, 0.22]], type: "sine" },
    { e: "🦋", n: "Butterfly", s: "Flutter flutter", notes: [[900, 0], [1100, 0.08], [1300, 0.16]], type: "triangle" },
  ];

  function playSound(a) {
    a.notes.forEach(([f, w]) => App.audio.tone({ freq: f, when: w, dur: 0.24, type: a.type, gain: 0.16 }));
  }

  function onTap(el, a) {
    el.classList.remove("boing");
    void el.offsetWidth; // restart the bounce animation
    el.classList.add("boing");
    App.fx.sparkleAt(el, 8);
    playSound(a);
    App.audio.speak(a.n + "! " + a.s + "!");
  }

  function start(root) {
    const parade = App.fx.el("div", { class: "scene parade" });

    const bannerText = "🎉 🌸 🦋 ⭐ 🎈 ".repeat(20);
    parade.appendChild(App.fx.el("div", { class: "parade__banner", text: bannerText }));

    const row = App.fx.el("div", { class: "parade__row" });
    ANIMALS.forEach((a) => {
      const critter = App.fx.el("button", { class: "critter", text: a.e, "aria-label": a.n });
      critter.addEventListener("pointerdown", (e) => { e.preventDefault(); onTap(critter, a); });
      row.appendChild(critter);
    });
    parade.appendChild(row);
    root.appendChild(parade);

    setTimeout(() => App.audio.speak("Tap an animal to hear its sound!"), 300);
  }

  function stop() {}

  App.games.push({
    id: "animals",
    name: "Animal Parade",
    icon: "🐘",
    tileBg: "linear-gradient(160deg, #cfe8ff, #cdf3df)",
    start, stop,
  });
})();
