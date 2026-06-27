/* =========================================================================
   Visual effects + shared UI helpers: sparkles, confetti, celebration,
   praise phrases, and a tiny DOM builder used by every game.
   ========================================================================= */
window.App = window.App || {};

App.fx = (function () {
  /* ---- tiny DOM builder ---- */
  // el("div", { class:"x", onclick:fn, ... }, [children|strings])
  function el(tag, props, kids) {
    const node = document.createElement(tag);
    if (props) {
      for (const k in props) {
        if (k === "class") node.className = props[k];
        else if (k === "html") node.innerHTML = props[k];
        else if (k === "text") node.textContent = props[k];
        else if (k === "style" && typeof props[k] === "object") Object.assign(node.style, props[k]);
        else if (k.slice(0, 2) === "on" && typeof props[k] === "function") {
          node.addEventListener(k.slice(2).toLowerCase(), props[k]);
        } else if (props[k] != null && props[k] !== false) {
          node.setAttribute(k, props[k]);
        }
      }
    }
    (kids || []).forEach((c) => node.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return node;
  }

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  const PRAISE = [
    "Yay! Great job!", "You did it!", "Wonderful!", "So smart!",
    "Hooray!", "Amazing!", "Beautiful!", "You're a star!",
    "Perfect!", "Well done, princess!", "Magical!", "Super!",
  ];
  const TRY_AGAIN = ["Try again!", "Almost!", "Ooh, try another!", "You can do it!"];
  function praise() { return pick(PRAISE); }
  function tryAgain() { return pick(TRY_AGAIN); }

  const SPARKLE_CHARS = ["✨", "⭐", "🌟", "💫", "🌸", "💖"];

  /* ---- sparkle burst at a screen point ---- */
  function sparkleBurst(x, y, count) {
    count = count || 12;
    for (let i = 0; i < count; i++) {
      const s = el("div", { class: "sparkle", text: pick(SPARKLE_CHARS) });
      s.style.left = x + "px";
      s.style.top = y + "px";
      s.style.fontSize = rand(16, 34) + "px";
      document.body.appendChild(s);
      const ang = rand(0, Math.PI * 2);
      const dist = rand(40, 130);
      const dx = Math.cos(ang) * dist;
      const dy = Math.sin(ang) * dist;
      const anim = s.animate(
        [
          { transform: "translate(-50%,-50%) scale(0.3)", opacity: 1 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1.2)`, opacity: 1, offset: 0.7 },
          { transform: `translate(calc(-50% + ${dx * 1.3}px), calc(-50% + ${dy * 1.3}px)) scale(0.4)`, opacity: 0 },
        ],
        { duration: rand(700, 1100), easing: "cubic-bezier(.2,.8,.3,1)" }
      );
      anim.onfinish = () => s.remove();
    }
  }

  // sparkle centered on an element
  function sparkleAt(node, count) {
    const r = node.getBoundingClientRect();
    sparkleBurst(r.left + r.width / 2, r.top + r.height / 2, count);
  }

  /* ---- confetti shower ---- */
  const CONFETTI_COLORS = ["#ff9ec4", "#ffd93b", "#74d39a", "#6fb4ff", "#b78bff", "#ff9f43"];
  function confetti(amount) {
    amount = amount || 80;
    const W = window.innerWidth;
    for (let i = 0; i < amount; i++) {
      const c = el("div", { class: "confetti" });
      const size = rand(8, 16);
      c.style.width = size + "px";
      c.style.height = size * rand(0.5, 1) + "px";
      c.style.left = rand(0, W) + "px";
      c.style.background = pick(CONFETTI_COLORS);
      if (Math.random() < 0.3) c.style.borderRadius = "50%";
      document.body.appendChild(c);
      const anim = c.animate(
        [
          { transform: `translateY(-20px) rotate(0deg)`, opacity: 1 },
          { transform: `translateY(${window.innerHeight + 40}px) rotate(${rand(360, 1080)}deg)`, opacity: 1 },
        ],
        { duration: rand(1800, 3200), easing: "cubic-bezier(.3,.6,.5,1)", delay: rand(0, 400) }
      );
      anim.onfinish = () => c.remove();
    }
  }

  /* ---- big celebration overlay (confetti + emoji + spoken praise) ---- */
  let celebrateTimer = null;
  function celebrate(opts) {
    opts = opts || {};
    const overlay = document.getElementById("celebrate");
    const emojiEl = document.getElementById("celebrate-emoji");
    const msgEl = document.getElementById("celebrate-msg");
    const message = opts.message || praise();
    emojiEl.textContent = opts.emoji || pick(["🌟", "🎉", "👑", "🦋", "🌈", "💖"]);
    msgEl.textContent = message;
    overlay.hidden = false;
    confetti(opts.amount || 110);
    App.audio.play("win");
    App.audio.speak(message);

    clearTimeout(celebrateTimer);
    celebrateTimer = setTimeout(() => {
      overlay.hidden = true;
      if (opts.ondone) opts.ondone();
    }, opts.duration || 2600);
  }

  return { el, rand, pick, praise, tryAgain, sparkleBurst, sparkleAt, confetti, celebrate };
})();
