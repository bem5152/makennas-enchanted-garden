/* =========================================================================
   GAME 3 — Royal Memory Match
   Flip-card memory with cute animal/princess emoji. Starts at 4 pairs and
   grows to 6 as she succeeds. Cards are named aloud when flipped; matches
   sparkle and stay up; full clear is celebrated. Level saved in localStorage.
   ========================================================================= */
(function () {
  window.App = window.App || {};
  App.games = App.games || [];

  const DECK = [
    { e: "🐰", n: "bunny" }, { e: "🐱", n: "kitty" }, { e: "🦉", n: "owl" },
    { e: "🦋", n: "butterfly" }, { e: "🐶", n: "puppy" }, { e: "🦆", n: "duck" },
    { e: "👑", n: "crown" }, { e: "🧚", n: "fairy" }, { e: "🌸", n: "flower" },
    { e: "🦄", n: "unicorn" }, { e: "🐝", n: "bee" }, { e: "🐸", n: "frog" },
  ];
  const BACK = "🎀";

  let grid = null, scoreEl = null, bubble = null;
  let first = null, lock = false, matched = 0, pairs = 4;

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function columns(n) { return n <= 8 ? 4 : n === 12 ? 4 : 5; }

  function build(root, isRoot) {
    pairs = Math.max(4, Math.min(6, App.state.get("memoryLevel") || 4));
    matched = 0; first = null; lock = false;

    const chosen = shuffle(DECK.slice()).slice(0, pairs);
    const cards = shuffle(chosen.concat(chosen).map((c, i) => ({ ...c, uid: i })));

    if (isRoot) {
      const owl = App.fx.el("div", { class: "host__char", text: "🐱" });
      bubble = App.fx.el("div", { class: "host__bubble", text: "Find the matching pairs!" });
      root.appendChild(App.fx.el("div", { class: "host" }, [owl, bubble]));
      scoreEl = App.fx.el("div", { class: "scoreboard", text: "💞 0 / " + pairs });
      root.appendChild(scoreEl);
      grid = App.fx.el("div", { class: "memory-grid" });
      root.appendChild(grid);
    } else {
      grid.innerHTML = "";
    }
    scoreEl.textContent = "💞 0 / " + pairs;
    grid.style.gridTemplateColumns = "repeat(" + columns(cards.length) + ", minmax(70px, 1fr))";
    grid.style.maxWidth = Math.min(columns(cards.length) * 160, 900) + "px";
    grid.style.margin = "0 auto";

    cards.forEach((card) => {
      const front = App.fx.el("div", { class: "card__face card__front", text: card.e });
      const back = App.fx.el("div", { class: "card__face card__back", text: BACK });
      const inner = App.fx.el("div", { class: "card__inner" }, [back, front]);
      const cardEl = App.fx.el("div", { class: "card" }, [inner]);
      cardEl._data = card;
      cardEl.addEventListener("pointerdown", (e) => { e.preventDefault(); onFlip(cardEl); });
      grid.appendChild(cardEl);
    });
  }

  function onFlip(cardEl) {
    if (lock) return;
    if (cardEl.classList.contains("is-flipped") || cardEl.classList.contains("is-matched")) return;

    cardEl.classList.add("is-flipped");
    App.audio.play("flip");
    App.audio.speak("A " + cardEl._data.n + "!");

    if (!first) { first = cardEl; return; }

    lock = true;
    const isMatch = first._data.e === cardEl._data.e;
    if (isMatch) {
      setTimeout(() => {
        first.classList.add("is-matched");
        cardEl.classList.add("is-matched");
        App.audio.play("match");
        App.fx.sparkleAt(cardEl, 10);
        App.fx.sparkleAt(first, 10);
        matched++;
        scoreEl.textContent = "💞 " + matched + " / " + pairs;
        first = null; lock = false;
        if (matched === pairs) win();
      }, 380);
    } else {
      setTimeout(() => {
        first.classList.remove("is-flipped");
        cardEl.classList.remove("is-flipped");
        first = null; lock = false;
      }, 950);
    }
  }

  function win() {
    // bump difficulty toward 6 pairs for next round
    const nextLevel = Math.min(6, pairs + 1);
    App.state.set("memoryLevel", nextLevel);
    App.fx.celebrate({
      message: "You found them all!",
      emoji: "👑",
      ondone: () => { if (grid && grid.isConnected) build(null, false); },
    });
  }

  function start(root) { build(root, true); }
  function stop() { grid = null; first = null; lock = false; }

  App.games.push({
    id: "memory",
    name: "Royal Memory",
    icon: "🃏",
    tileBg: "linear-gradient(160deg, #e7dcff, #ffd6e8)",
    start, stop,
  });
})();
