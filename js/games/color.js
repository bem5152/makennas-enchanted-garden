/* =========================================================================
   GAME 4 — Color Kingdom
   A rotating cast of characters asks her to find a color or a shape.
   "Can you find something BLUE?" — she taps a matching object in the scene.
   Gentle "try again!" on a miss; sparkle + praise on a hit.
   ========================================================================= */
(function () {
  window.App = window.App || {};
  App.games = App.games || [];

  const COLORS = [
    { name: "red", hex: "#ff5b6e" }, { name: "blue", hex: "#4d9bff" },
    { name: "yellow", hex: "#ffd23b" }, { name: "green", hex: "#54c878" },
    { name: "purple", hex: "#a86cff" }, { name: "orange", hex: "#ff9636" },
  ];
  const SHAPES = [
    { key: "circle", name: "circle" }, { key: "square", name: "square" },
    { key: "star", name: "star" }, { key: "heart", name: "heart" },
  ];
  const HOSTS = ["🐰", "🦊", "🐻", "🐸", "🦁", "🐼", "👑", "🧚", "🐱", "🐨"];

  let kingdom = null, bubble = null, hostChar = null, scoreEl = null;
  let mode = "color", target = null, locked = false, score = 0;

  const pick = App.fx.pick;
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function makeThing(color, shapeKey) {
    const inner = App.fx.el("div", { class: "thing__shape shape-" + shapeKey, style: { background: color.hex } });
    const t = App.fx.el("div", { class: "thing", "aria-label": color.name + " " + shapeKey }, [inner]);
    t._data = { color, shape: shapeKey };
    t.addEventListener("pointerdown", (e) => { e.preventDefault(); onTap(t); });
    return t;
  }

  function ask() {
    if (mode === "color") { bubble.textContent = "Find " + target.name + "!"; App.audio.speak("Can you find something " + target.name + "?"); }
    else { bubble.textContent = "Find a " + target.name + "!"; App.audio.speak("Can you find a " + target.name + "?"); }
  }

  function round() {
    locked = false;
    hostChar.textContent = pick(HOSTS);
    mode = Math.random() < 0.5 ? "color" : "shape";
    const N = 5;
    const correctN = Math.random() < 0.5 ? 1 : 2;
    let things = [];

    if (mode === "color") {
      target = pick(COLORS);
      const others = COLORS.filter((c) => c.name !== target.name);
      for (let i = 0; i < N; i++) things.push({ color: i < correctN ? target : pick(others), shape: pick(SHAPES).key });
    } else {
      target = pick(SHAPES);
      const others = SHAPES.filter((s) => s.key !== target.key);
      for (let i = 0; i < N; i++) things.push({ color: pick(COLORS), shape: i < correctN ? target.key : pick(others).key });
    }
    shuffle(things);

    kingdom.innerHTML = "";
    things.forEach((d) => kingdom.appendChild(makeThing(d.color, d.shape)));
    setTimeout(ask, 250);
  }

  function onTap(t) {
    if (locked) return;
    const ok = mode === "color" ? t._data.color.name === target.name : t._data.shape === target.key;
    if (ok) {
      locked = true;
      App.audio.play("correct");
      App.fx.sparkleAt(t, 14);
      score++;
      scoreEl.textContent = "⭐ " + score;
      App.audio.speak(App.fx.praise());
      setTimeout(() => { round(); }, 1200);
    } else {
      App.audio.play("wrong");
      t.classList.remove("wiggle");
      void t.offsetWidth; // restart animation
      t.classList.add("wiggle");
      App.audio.speak(App.fx.tryAgain());
    }
  }

  function start(root) {
    score = 0;
    hostChar = App.fx.el("div", { class: "host__char", text: "🐰", onpointerdown: ask });
    bubble = App.fx.el("div", { class: "host__bubble", text: "Let's play!" });
    root.appendChild(App.fx.el("div", { class: "host" }, [hostChar, bubble]));

    scoreEl = App.fx.el("div", { class: "scoreboard", text: "⭐ 0" });
    root.appendChild(scoreEl);

    kingdom = App.fx.el("div", { class: "scene kingdom", style: { background: "linear-gradient(180deg,#fff0f7,#eef0ff 60%,#eafaf0)" } });
    root.appendChild(kingdom);

    round();
  }

  function stop() { kingdom = null; locked = false; }

  App.games.push({
    id: "color",
    name: "Color Kingdom",
    icon: "🌈",
    tileBg: "linear-gradient(160deg, #ffe2c7, #fff1ad)",
    start, stop,
  });
})();
