/* =========================================================================
   GAME 1 — Letter Forest
   Letters drift down like leaves. An owl names the target letter + its sound.
   Tap the matching letter to catch it. Unlocks A-E first, more as she plays.
   ========================================================================= */
(function () {
  window.App = window.App || {};
  App.games = App.games || [];

  const PHON = {
    A: "ah", B: "buh", C: "kuh", D: "duh", E: "eh", F: "ff", G: "guh", H: "huh",
    I: "ih", J: "juh", K: "kuh", L: "ll", M: "mm", N: "nn", O: "awe", P: "puh",
    Q: "kwuh", R: "rr", S: "sss", T: "tuh", U: "uh", V: "vv", W: "wuh", X: "ks",
    Y: "yuh", Z: "zz",
  };
  const COLORS = ["#ff8fab", "#ffae33", "#8ac926", "#4cc9f0", "#b388ff", "#ff7b54", "#06d6a0", "#f15bb5"];
  const ALL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  let running = false, raf = null, scene = null, bubble = null, scoreEl = null;
  let fallers = [], target = null, lastSpawn = 0, correctCount = 0, caught = 0, busy = false;

  const letters = () => App.state.get("letters");
  const fallerSize = () => Math.max(74, Math.min(scene.clientWidth * 0.15, 112));
  const place = (f) => { f.el.style.transform = `translate(${f.x}px, ${f.y}px)`; };

  function announce() {
    const ph = PHON[target] || target.toLowerCase();
    bubble.textContent = target;
    App.audio.speak(`Find the letter ${target}. ${target} says ${ph}.`);
  }

  function targetPresent() { return fallers.some((f) => f.letter === target); }

  function spawn(forceTarget) {
    if (!scene) return;
    const set = letters();
    let L = forceTarget ? target : (Math.random() < 0.4 ? target : App.fx.pick(set));
    const w = fallerSize();
    const f = {
      letter: L,
      x: App.fx.rand(6, Math.max(8, scene.clientWidth - w - 6)),
      y: -w - 10,
      vy: App.fx.rand(0.0024, 0.0044) * scene.clientHeight,
      el: App.fx.el("div", { class: "faller", text: L, style: { background: COLORS[ALL.indexOf(L) % COLORS.length] } }),
    };
    f.el.style.width = f.el.style.height = w + "px";
    f.el.addEventListener("pointerdown", (e) => { e.preventDefault(); onTap(f); });
    scene.appendChild(f.el);
    place(f);
    fallers.push(f);
  }

  function removeFaller(f) {
    f.el.remove();
    const i = fallers.indexOf(f);
    if (i !== -1) fallers.splice(i, 1);
  }

  function maybeUnlock() {
    const set = letters();
    if (correctCount > 0 && correctCount % 5 === 0 && set.length < ALL.length) {
      const next = ALL[set.length];
      set.push(next);
      App.state.set("letters", set);
      App.audio.speak(`You unlocked a new letter! ${next}.`);
      return true;
    }
    return false;
  }

  function newTarget() {
    const set = letters();
    let t = App.fx.pick(set);
    let tries = 0;
    while (t === target && set.length > 1 && tries++ < 8) t = App.fx.pick(set);
    target = t;
  }

  function onTap(f) {
    if (!running || busy) return;
    const r = f.el.getBoundingClientRect();
    if (f.letter === target) {
      busy = true;
      App.audio.play("correct");
      App.fx.sparkleBurst(r.left + r.width / 2, r.top + r.height / 2, 16);
      removeFaller(f);
      caught++;
      correctCount++;
      scoreEl.textContent = "🌟 " + caught;
      const unlocked = maybeUnlock();
      App.audio.speak(App.fx.praise());
      setTimeout(() => {
        if (!running) return;
        newTarget();
        if (!unlocked) announce(); else setTimeout(announce, 1200);
        busy = false;
      }, unlocked ? 1400 : 650);
    } else {
      App.audio.play("wrong");
      const base = f.el.style.transform;
      f.el.animate(
        [{ transform: base }, { transform: base + " rotate(-12deg) scale(0.94)" }, { transform: base + " rotate(10deg)" }, { transform: base }],
        { duration: 340 }
      );
      App.audio.speak(`That's ${f.letter}. Find ${target}.`, { rate: 0.95 });
    }
  }

  function frame(ts) {
    if (!running) return;
    if (ts - lastSpawn > 1100 && fallers.length < 5) {
      spawn(!targetPresent());
      lastSpawn = ts;
    }
    for (const f of fallers) { f.y += f.vy; place(f); }
    for (let i = fallers.length - 1; i >= 0; i--) {
      if (fallers[i].y > scene.clientHeight + 24) removeFaller(fallers[i]);
    }
    raf = requestAnimationFrame(frame);
  }

  function start(root) {
    running = true; fallers = []; correctCount = 0; caught = 0; lastSpawn = 0; busy = false;

    scene = App.fx.el("div", { class: "scene forest" });
    const owl = App.fx.el("div", { class: "host__char", text: "🦉", onpointerdown: announce });
    bubble = App.fx.el("div", { class: "host__bubble", text: "?" });
    const host = App.fx.el("div", { class: "host" }, [owl, bubble]);
    scoreEl = App.fx.el("div", { class: "scoreboard", text: "🌟 0" });

    // decorative trees
    ["🌳", "🌲", "🌳"].forEach((t, i) => {
      const tree = App.fx.el("div", { class: "tree", text: t });
      tree.style.left = i === 0 ? "-2%" : i === 1 ? "44%" : "auto";
      tree.style.right = i === 2 ? "-2%" : "auto";
      scene.appendChild(tree);
    });

    root.appendChild(scoreEl);
    root.appendChild(host);
    root.appendChild(scene);

    newTarget();
    // a few starter letters, then announce
    setTimeout(() => { if (running) spawn(true); }, 200);
    setTimeout(() => { if (running) spawn(false); }, 700);
    setTimeout(() => { if (running) announce(); }, 600);
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null; fallers = []; scene = null; bubble = null;
  }

  App.games.push({
    id: "letters",
    name: "Letter Forest",
    icon: "🦉",
    tileBg: "linear-gradient(160deg, #cdeecb, #d6f0ff)",
    start, stop,
  });
})();
