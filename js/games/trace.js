/* =========================================================================
   GAME 2 — Princess Trace
   A fairy guides her finger along a glowing dotted path (letters A/B/C and
   shapes circle/star/heart). Glitter follows the finger; chimes as she goes;
   big celebration when the whole path is traced. Pointer events for iPad.
   ========================================================================= */
(function () {
  window.App = window.App || {};
  App.games = App.games || [];

  /* ---- figure geometry (normalized 0..1 inside a centered square) ---- */
  function circlePts() {
    const p = [];
    for (let a = -90; a <= 270; a += 16) { const r = (a * Math.PI) / 180; p.push([0.5 + 0.4 * Math.cos(r), 0.5 + 0.4 * Math.sin(r)]); }
    return p;
  }
  function starPts() {
    const p = [], cx = 0.5, cy = 0.54;
    for (let i = 0; i <= 10; i++) { const a = (-90 + i * 36) * Math.PI / 180, r = i % 2 === 0 ? 0.46 : 0.19; p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    return p;
  }
  function heartPts() {
    const p = [];
    for (let t = 0; t <= Math.PI * 2 + 0.001; t += Math.PI / 18) {
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      p.push([0.5 + x / 42, 0.44 - y / 42]);
    }
    return p;
  }
  const FIGS = [
    { key: "A", label: "A", name: "letter A", verts: [[0.15, 0.92], [0.5, 0.08], [0.85, 0.92], [0.71, 0.55], [0.29, 0.55]] },
    { key: "B", label: "B", name: "letter B", verts: [[0.27, 0.92], [0.27, 0.08], [0.6, 0.12], [0.7, 0.29], [0.6, 0.46], [0.3, 0.5], [0.64, 0.54], [0.74, 0.73], [0.62, 0.9], [0.27, 0.92]] },
    { key: "C", label: "C", name: "letter C", verts: (function () { const p = []; for (let a = 60; a <= 300; a += 15) { const r = (a * Math.PI) / 180; p.push([0.5 + 0.4 * Math.cos(r), 0.5 - 0.4 * Math.sin(r)]); } return p; })() },
    { key: "circle", label: "⚪", name: "circle", verts: circlePts() },
    { key: "star", label: "⭐", name: "star", verts: starPts() },
    { key: "heart", label: "❤️", name: "heart", verts: heartPts() },
  ];

  // Walk a polyline and emit evenly-spaced checkpoints (uniform difficulty).
  function densify(verts, spacing) {
    const out = [verts[0].slice()];
    for (let i = 1; i < verts.length; i++) {
      const a = verts[i - 1], b = verts[i];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const len = Math.hypot(dx, dy);
      const steps = Math.max(1, Math.round(len / spacing));
      for (let s = 1; s <= steps; s++) out.push([a[0] + (dx * s) / steps, a[1] + (dy * s) / steps]);
    }
    return out;
  }

  let running = false, raf = null, canvas = null, c2d = null, bubble = null, chips = null;
  let figIndex = 0, cps = [], visited = [], index = 0, particles = [], done = false;
  let down = false, side = 0, ox = 0, oy = 0, dpr = 1;

  const toPx = (pt) => [ox + pt[0] * side, oy + pt[1] * side];

  function resize() {
    if (!canvas) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr; canvas.height = h * dpr;
    c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    side = Math.min(w, h) * 0.78;
    ox = (w - side) / 2; oy = (h - side) / 2;
  }

  function loadFigure(i) {
    figIndex = ((i % FIGS.length) + FIGS.length) % FIGS.length;
    const fig = FIGS[figIndex];
    cps = densify(fig.verts, 0.05);
    visited = cps.map(() => false);
    index = 0; done = false; particles = [];
    if (chips) [...chips.children].forEach((ch, k) => ch.classList.toggle("is-on", k === figIndex));
    App.audio.speak(`Let's trace the ${fig.name}! Follow the sparkles with your finger.`);
  }

  function addGlitter(x, y) {
    for (let i = 0; i < 3; i++) {
      particles.push({
        x: x + App.fx.rand(-8, 8), y: y + App.fx.rand(-8, 8),
        vx: App.fx.rand(-0.4, 0.4), vy: App.fx.rand(-0.8, -0.1),
        life: 1, r: App.fx.rand(3, 8),
        hue: App.fx.pick(["#ffd93b", "#ff9ec4", "#b78bff", "#6fb4ff", "#fff"]),
      });
    }
  }

  function handleMove(e) {
    if (!down || done) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left, py = e.clientY - rect.top;
    addGlitter(px, py);
    const thr = side * 0.14;
    let advanced = false;
    while (index < cps.length) {
      const [tx, ty] = toPx(cps[index]);
      if (Math.hypot(px - tx, py - ty) < thr) { visited[index] = true; index++; advanced = true; }
      else break;
    }
    if (advanced && index % 4 === 0) App.audio.play("chime");
    if (index >= cps.length && !done) complete();
  }

  function complete() {
    done = true; down = false;
    const fig = FIGS[figIndex];
    // sparkle along the whole path
    for (let i = 0; i < cps.length; i += 2) {
      const [px, py] = toPx(cps[i]);
      const rect = canvas.getBoundingClientRect();
      setTimeout(() => App.fx.sparkleBurst(rect.left + px, rect.top + py, 3), i * 14);
    }
    App.fx.celebrate({
      message: "You traced the " + fig.name + "!",
      emoji: fig.label.length === 1 ? "🌟" : fig.label,
      ondone: () => { if (running) loadFigure(figIndex + 1); },
    });
  }

  function render() {
    if (!running) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    c2d.clearRect(0, 0, w, h);

    // guide path (soft dashed)
    c2d.lineCap = "round"; c2d.lineJoin = "round";
    c2d.strokeStyle = "rgba(183,139,255,0.35)";
    c2d.lineWidth = side * 0.085;
    c2d.setLineDash([2, side * 0.07]);
    c2d.beginPath();
    cps.forEach((p, i) => { const [x, y] = toPx(p); i ? c2d.lineTo(x, y) : c2d.moveTo(x, y); });
    c2d.stroke();
    c2d.setLineDash([]);

    // traced portion (bright gold)
    if (index > 0) {
      c2d.strokeStyle = "#ffcf5c";
      c2d.lineWidth = side * 0.09;
      c2d.beginPath();
      for (let i = 0; i < index; i++) { const [x, y] = toPx(cps[i]); i ? c2d.lineTo(x, y) : c2d.moveTo(x, y); }
      c2d.stroke();
    }

    // start marker + pulsing "next" target
    if (!done) {
      const t = (Date.now() % 900) / 900;
      const [nx, ny] = toPx(cps[Math.min(index, cps.length - 1)]);
      c2d.beginPath();
      c2d.fillStyle = "rgba(255,159,67,0.85)";
      c2d.arc(nx, ny, side * 0.05 * (1 + 0.3 * Math.sin(t * Math.PI * 2)), 0, Math.PI * 2);
      c2d.fill();
      // start flag
      if (index === 0) {
        const [sx, sy] = toPx(cps[0]);
        c2d.font = (side * 0.1) + "px serif"; c2d.textAlign = "center"; c2d.textBaseline = "middle";
        c2d.fillText("✨", sx, sy);
      }
    }

    // glitter particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.life -= 0.03;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      c2d.globalAlpha = Math.max(0, p.life);
      c2d.fillStyle = p.hue;
      c2d.beginPath();
      c2d.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
      c2d.fill();
    }
    c2d.globalAlpha = 1;

    raf = requestAnimationFrame(render);
  }

  function start(root) {
    running = true;

    const fairy = App.fx.el("div", { class: "host__char", text: "🧚", onpointerdown: () => loadFigure(figIndex) });
    bubble = App.fx.el("div", { class: "host__bubble", text: "Trace me!" });
    const host = App.fx.el("div", { class: "host" }, [fairy, bubble]);

    const wrap = App.fx.el("div", { class: "trace-wrap" });
    canvas = App.fx.el("canvas", { id: "trace-canvas" });
    wrap.appendChild(canvas);

    chips = App.fx.el("div", { class: "choice-row" });
    FIGS.forEach((f, i) => {
      chips.appendChild(App.fx.el("button", {
        class: "chip", text: f.label,
        onpointerdown: (e) => { e.preventDefault(); App.audio.play("tap"); loadFigure(i); },
      }));
    });

    root.appendChild(host);
    root.appendChild(wrap);
    root.appendChild(chips);

    c2d = canvas.getContext("2d");
    window.addEventListener("resize", resize);
    // wait one frame so the canvas has size
    requestAnimationFrame(() => { resize(); loadFigure(0); render(); });

    canvas.addEventListener("pointerdown", (e) => { e.preventDefault(); down = true; try { canvas.setPointerCapture(e.pointerId); } catch (x) {} handleMove(e); });
    canvas.addEventListener("pointermove", (e) => { e.preventDefault(); handleMove(e); });
    canvas.addEventListener("pointerup", () => { down = false; });
    canvas.addEventListener("pointercancel", () => { down = false; });
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    window.removeEventListener("resize", resize);
    canvas = null; c2d = null; particles = [];
  }

  App.games.push({
    id: "trace",
    name: "Princess Trace",
    icon: "🧚",
    tileBg: "linear-gradient(160deg, #ffd6e8, #e7dcff)",
    start, stop,
  });
})();
