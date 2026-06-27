/* =========================================================================
   App controller: title, persistent state, router (home <-> games),
   mute toggle, and the first-tap audio unlock veil.
   Games self-register by pushing onto App.games (see js/games/*.js).
   ========================================================================= */
window.App = window.App || {};
App.games = App.games || [];

// ---- One-line title (change this to rename the app) ----
App.TITLE = "Makenna's Enchanted Garden";

/* ---------------- Persistent state (localStorage) ---------------- */
App.state = (function () {
  const KEY = "mge_state_v1";
  const DEFAULTS = {
    muted: false,
    letters: ["A", "B", "C", "D", "E"], // Letter Forest unlocked set
    memoryLevel: 4,                      // pairs in Royal Memory Match
  };
  let data;
  try {
    data = Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(KEY) || "{}"));
  } catch (e) {
    data = Object.assign({}, DEFAULTS);
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }
  return {
    get: (k) => data[k],
    set: (k, v) => { data[k] = v; save(); },
    all: () => data,
  };
})();

/* ---------------- Router ---------------- */
App.router = (function () {
  let current = null; // active game object

  const homeEl = document.getElementById("home");
  const gameScreen = document.getElementById("game-screen");
  const gameRoot = document.getElementById("game-root");
  const backBtn = document.getElementById("back-btn");

  function stopCurrent() {
    if (current && typeof current.stop === "function") {
      try { current.stop(); } catch (e) {}
    }
    current = null;
    gameRoot.innerHTML = "";
    App.audio.stopSpeech();
  }

  function showHome() {
    stopCurrent();
    gameScreen.classList.remove("is-active");
    homeEl.classList.add("is-active");
    backBtn.hidden = true;
    App.audio.play("pop");
  }

  function openGame(id) {
    const game = App.games.find((g) => g.id === id);
    if (!game) return;
    homeEl.classList.remove("is-active");
    gameScreen.classList.add("is-active");
    backBtn.hidden = false;
    gameRoot.innerHTML = "";
    App.audio.play("pop");
    current = game;
    try {
      game.start(gameRoot);
    } catch (e) {
      console.error("Game failed to start:", id, e);
    }
  }

  backBtn.addEventListener("click", showHome);
  return { showHome, openGame };
})();

/* ---------------- Home screen build ---------------- */
(function buildHome() {
  document.getElementById("app-title").textContent = App.TITLE;
  document.title = App.TITLE;

  const grid = document.getElementById("home-grid");
  App.games.forEach((g) => {
    const tile = App.fx.el(
      "button",
      {
        class: "tile",
        style: { "--tile-bg": g.tileBg || "linear-gradient(160deg, var(--pink), var(--lav))" },
        "aria-label": g.name,
        onclick: () => {
          App.audio.play("tap");
          App.router.openGame(g.id);
        },
      },
      [
        App.fx.el("div", { class: "tile__icon", text: g.icon }),
        App.fx.el("div", { class: "tile__name", text: g.name }),
      ]
    );
    grid.appendChild(tile);
  });
})();

/* ---------------- Mute toggle ---------------- */
(function muteSetup() {
  const btn = document.getElementById("mute-btn");
  const icon = document.getElementById("mute-icon");
  function apply() {
    const muted = App.state.get("muted");
    App.audio.setMuted(muted);
    icon.textContent = muted ? "🔇" : "🔊";
  }
  btn.addEventListener("click", () => {
    App.state.set("muted", !App.state.get("muted"));
    apply();
    if (!App.state.get("muted")) App.audio.play("tap");
  });
  apply();
})();

/* ---------------- First-tap audio unlock ---------------- */
(function tapToStart() {
  const veil = document.getElementById("tap-veil");
  const startBtn = document.getElementById("start-btn");
  let started = false;
  function begin() {
    if (started) return;
    started = true;
    App.audio.unlock();
    App.audio.setMuted(App.state.get("muted"));
    veil.classList.add("hide");
    setTimeout(() => (veil.style.display = "none"), 600);
    App.audio.play("win");
    App.audio.speak("Welcome to the enchanted garden! Pick a game to play.");
  }
  startBtn.addEventListener("click", begin);
  veil.addEventListener("pointerdown", begin);
})();

/* ---------------- Drifting background sparkles ---------------- */
(function bgSparkles() {
  const wrap = document.getElementById("bg-sparkles");
  const chars = ["✨", "⭐", "🌸", "💫", "🦋", "🌟"];
  const N = 14;
  for (let i = 0; i < N; i++) {
    const s = App.fx.el("div", { class: "twinkle", text: App.fx.pick(chars) });
    s.style.left = App.fx.rand(0, 100) + "vw";
    s.style.fontSize = App.fx.rand(14, 30) + "px";
    const dur = App.fx.rand(14, 30);
    s.style.animationDuration = dur + "s, " + App.fx.rand(2, 4) + "s";
    s.style.animationDelay = -App.fx.rand(0, dur) + "s, 0s";
    wrap.appendChild(s);
  }
})();
