/* =========================================================================
   GAME 4 — Color Kingdom
   A rotating cast of characters asks her to find a color or a shape.
   "Can you find something BLUE?" — she taps a matching object in the scene.
   Gentle "try again!" on a miss; sparkle + praise on a hit.

   Progression: score builds a level (every 4 correct = +1 level, up to 5).
   From level 3+, prompts sometimes combine both attributes ("find the BLUE
   STAR"), raising the challenge. Best level reached is persisted.
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
  const MAX_LEVEL = 5;
  const SCORE_PER_LEVEL = 4;

  let kingdom = null, bubble = null, hostChar = null, scoreEl = null, levelPill = null, levelFill = null;
  let mode = "color", target = null, locked = false, score = 0, level = 1;

  const pick = App.fx.pick;
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function makeThing(color, shapeKey) {
    const inner = App.fx.el("div", { class: "thing__shape shape-" + shapeKey, style: { background: color.hex } });
    const t = App.fx.el("div", { class: "thing", "aria-label": color.name + " " + shapeKey }, [inner]);
    t._data = { color, shape: shapeKey };
    t.addEventListener("pointerdown", (e) => { e.preventDefault(); onTap(t); });
    return t;
  }

  function updateLevelUI() {
    const within = score % SCORE_PER_LEVEL;
    levelPill.textContent = "👑 Level " + level;
    levelFill.style.width = Math.round((within / SCORE_PER_LEVEL) * 100) + "%";
  }

  function ask() {
    if (mode === "color") {
      bubble.textContent = "Find " + target.name + "!";
      App.audio.speak("Can you find something " + target.name + "?");
    } else if (mode === "shape") {
      bubble.textContent = "Find a " + target.name + "!";
      App.audio.speak("Can you find a " + target.name + "?");
    } else {
      bubble.textContent = "Find the " + target.color.name + " " + target.shape.name + "!";
      App.audio.speak("Can you find the " + target.color.name + " " + target.shape.name + "?");
    }
  }

  function pickMode() {
    if (level >= 3 && Math.random() < 0.5) return "both";
    return Math.random() < 0.5 ? "color" : "shape";
  }

  function round() {
    locked = false;
    hostChar.textContent = pick(HOSTS);
    mode = pickMode();
    const N = 5;
    let things = [];

    if (mode === "color") {
      target = pick(COLORS);
      const others = COLORS.filter((c) => c.name !== target.name);
      const correctN = Math.random() < 0.5 ? 1 : 2;
      for (let i = 0; i < N; i++) things.push({ color: i < correctN ? target : pick(others), shape: pick(SHAPES).key });
    } else if (mode === "shape") {
      target = pick(SHAPES);
      const others = SHAPES.filter((s) => s.key !== target.key);
      const correctN = Math.random() < 0.5 ? 1 : 2;
      for (let i = 0; i < N; i++) things.push({ color: pick(COLORS), shape: i < correctN ? target.key : pick(others).key });
    } else {
      const tColor = pick(COLORS), tShape = pick(SHAPES);
      target = { color: tColor, shape: tShape };
      const otherColors = COLORS.filter((c) => c.name !== tColor.name);
      const otherShapes = SHAPES.filter((s) => s.key !== tShape.key);
      // exactly one true match; the rest share only one attribute (harder to scan)
      things.push({ color: tColor, shape: tShape.key });
      things.push({ color: tColor, shape: pick(otherShapes).key });        // right color, wrong shape
      things.push({ color: pick(otherColors), shape: tShape.key });        // right shape, wrong color
      things.push({ color: pick(otherColors), shape: pick(otherShapes).key });
      things.push({ color: pick(otherColors), shape: pick(otherShapes).key });
    }
    shuffle(things);

    kingdom.innerHTML = "";
    things.forEach((d) => kingdom.appendChild(makeThing(d.color, d.shape)));
    setTimeout(ask, 250);
  }

  function isMatch(t) {
    if (mode === "color") return t._data.color.name === target.name;
    if (mode === "shape") return t._data.shape === target.key;
    return t._data.color.name === target.color.name && t._data.shape === target.shape.key;
  }

  function onTap(t) {
    if (locked) return;
    if (isMatch(t)) {
      locked = true;
      App.audio.play("correct");
      App.fx.sparkleAt(t, 14);
      score++;

      const newLevel = Math.min(MAX_LEVEL, 1 + Math.floor(score / SCORE_PER_LEVEL));
      const leveledUp = newLevel > level;
      level = newLevel;
      if (leveledUp) {
        const best = Math.max(App.state.get("colorBestLevel") || 1, level);
        App.state.set("colorBestLevel", best);
      }
      scoreEl.textContent = "⭐ " + score;
      updateLevelUI();

      if (leveledUp) {
        App.audio.play("levelup");
        App.fx.celebrate({ message: "Level " + level + "!", emoji: "👑", duration: 1500, ondone: () => round() });
      } else {
        App.audio.speak(App.fx.praise());
        setTimeout(() => { round(); }, 1200);
      }
    } else {
      App.audio.play("wrong");
      t.classList.remove("wiggle");
      void t.offsetWidth;
      t.classList.add("wiggle");
      App.audio.speak(App.fx.tryAgain());
    }
  }

  function start(root) {
    score = 0; level = 1;
    hostChar = App.fx.el("div", { class: "host__char", text: "🐰", onpointerdown: ask });
    bubble = App.fx.el("div", { class: "host__bubble", text: "Let's play!" });
    root.appendChild(App.fx.el("div", { class: "host" }, [hostChar, bubble]));

    scoreEl = App.fx.el("div", { class: "scoreboard", text: "⭐ 0" });
    root.appendChild(scoreEl);

    levelPill = App.fx.el("div", { class: "level-pill", text: "👑 Level 1" });
    levelFill = App.fx.el("div", { class: "level-bar__fill" });
    const levelBar = App.fx.el("div", { class: "level-bar" }, [levelFill]);
    const levelRow = App.fx.el("div", { class: "choice-row", style: { marginTop: "2px" } }, [levelPill, levelBar]);
    root.appendChild(levelRow);

    kingdom = App.fx.el("div", { class: "scene kingdom", style: { background: "linear-gradient(180deg,#fff0f7,#eef0ff 60%,#eafaf0)" } });
    root.appendChild(kingdom);

    updateLevelUI();
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
