# 🌸 Makenna's Enchanted Garden

A collection of five gentle, ad-free educational mini-games for a 3-year-old,
built to open on an iPad in Safari with **no installation**. Everything is
self-contained — no external services, no audio/image files, no tracking.

## The games
1. **Letter Forest** 🦉 — catch falling letters as an owl names each letter and its sound. Starts A–E and unlocks more as she plays.
2. **Princess Trace** 🧚 — trace glowing letters and shapes with a finger; glitter follows along.
3. **Royal Memory** 🃏 — flip-card memory with cute animal cards; grows from 4 to 6 pairs.
4. **Color Kingdom** 🌈 — friendly characters ask her to find a color or a shape.
5. **Animal Parade** 🐘 — tap any animal to hear its name and sound. No wrong answers.

## How it works
- **Pure HTML/CSS/vanilla JavaScript — no build step.** Just static files.
- **Voice** uses the browser's built-in speech (Web Speech API); **sounds and music**
  are generated live with the Web Audio API. That's why there are no media files.
- Audio unlocks on the first tap (the "Tap to Begin" screen) — this satisfies iPad's
  autoplay rules. There's a 🔊/🔇 button in the top-right to mute.
- Progress (unlocked letters, memory level) is saved in the browser via `localStorage`.

## Run it locally (optional)
Because the app uses separate JavaScript files, open it through a tiny local server
rather than double-clicking `index.html`:

```bash
# from this folder
python -m http.server 8000
# then visit http://localhost:8000 in a browser
```

## Deploy — Option A: GitHub Pages (recommended, easiest)
1. Create a new repository on GitHub and upload all of these files (keep `index.html`
   at the **root** of the repo).
2. In the repo: **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Set **Branch** to `main` and **Folder** to `/ (root)`, then **Save**.
5. Wait ~1 minute, then open the URL it shows (e.g. `https://yourname.github.io/your-repo/`).
6. On the iPad, open that URL in Safari → **Share → Add to Home Screen** for a full-screen,
   app-like icon.

## Deploy — Option B: Vercel (drag-and-drop)
1. Go to [vercel.com](https://vercel.com) and sign in.
2. **Add New → Project**, then either import the GitHub repo or drag this whole folder in.
3. No framework / no build command needed — it's a static site. Click **Deploy**.
4. Open the generated URL on the iPad and **Add to Home Screen**.

## Customizing
- **Rename the app:** edit one line near the top of `js/app.js`:
  `App.TITLE = "Makenna's Enchanted Garden";`
- **Colors & look:** the pastel palette lives in the `:root` block at the top of `css/styles.css`.
- **Reset progress:** clear the site's data in Safari, or in the browser console run
  `localStorage.removeItem("mge_state_v1")`.

## iPad notes
- Best in Safari on iOS/iPadOS 15+.
- Works in both landscape and portrait.
- Fully offline once loaded (no network calls at runtime).
