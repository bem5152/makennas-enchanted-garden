# Makenna's Game — Context

> **⚙️ How to use this file — standing instruction for Claude:**
> 1. **Read this file first** at the start of any session working in this folder.
> 2. **Auto-log on completion:** whenever real work is finished in this folder (code changes, build, deploy), append a dated entry to the **Changelog** (newest first) and update *Last updated* — automatically, every time, without being asked.
> 3. Keep the top sections current; demote finished items into the Changelog.
> 4. Per CLAUDE.md: propose a plan and wait for Bret's approval before creating or editing files.

*Last updated: June 27, 2026*

---

## Purpose
**Makenna's Enchanted Garden** — a collection of 5 educational mini-games for Bret's daughter Makenna (age 3). Disney-storybook themed, ad-free, no install required — opens directly in an iPad browser. A personal build, not a commercial venture.

## Status
**Built and verified.** All 5 games fully playable, navigation working, audio confirmed, localStorage persistence confirmed. Not yet deployed to a live URL — sitting locally pending Bret's GitHub Pages / Vercel push.

## Tech Stack
- Pure HTML/CSS/vanilla JavaScript — **no framework, no build step.** Static files only.
- Voice narration via Web Speech API (`speechSynthesis`); sound effects + background music generated live via Web Audio API. No image or audio asset files — art is emoji + CSS/SVG.
- Progress (unlocked letters, memory difficulty level, mute state) persisted in `localStorage` under key `mge_state_v1`.

## Folder Map
| Path | Purpose |
|------|---------|
| `index.html` | App shell — home screen, tap-to-start audio-unlock veil, celebration overlay |
| `css/styles.css` | Pastel storybook theme, layout, all animations |
| `js/app.js` | Router (home ⇄ games), persistent state, home tile grid, mute toggle |
| `js/audio.js` | Speech narration + generated SFX + soft background music loop |
| `js/effects.js` | Sparkles, confetti, celebration overlay, shared DOM helper, praise phrases |
| `js/games/letters.js` | Game 1 — Letter Forest (catch falling letters, phonics) |
| `js/games/trace.js` | Game 2 — Princess Trace (finger-trace letters/shapes on canvas) |
| `js/games/memory.js` | Game 3 — Royal Memory Match (flip-card memory, 4→6 pairs) |
| `js/games/color.js` | Game 4 — Color Kingdom (find the color/shape) |
| `js/games/animals.js` | Game 5 — Animal Sounds Parade (tap-and-delight, no wrong answers) |
| `manifest.webmanifest` | Full-screen "Add to Home Screen" support on iPad |
| `README.md` | Deploy instructions (GitHub Pages primary, Vercel alternative) |
| `.claude/launch.json` | Local dev-server launch config (`npx serve`) used for browser-preview testing |

## Open Items
1. **Deploy** to GitHub Pages (or Vercel) and do a real on-device check in iPad Safari — touch + audio behave differently on real hardware than in a desktop preview.
2. Optional: rename the app away from the placeholder title (currently "Makenna's Enchanted Garden" — already personalized, may not need changing).
3. Optional: add more letters/levels content over time as Makenna's skills grow (framework already supports unlocking).

## Changelog
- **[2026-06-27]** Built and verified all 5 games end-to-end (Letter Forest, Princess Trace, Royal Memory Match, Color Kingdom, Animal Sounds Parade) plus home screen, router, audio engine, and effects engine. Found and fixed a real CSS bug during testing: `[hidden]` attribute was being overridden by component `display` rules, causing the celebration overlay and back button to render even when "hidden." Added a `[hidden] { display: none !important }` reset. Verified in browser preview at both 1024×768 and 768×1024, confirmed zero console errors, and confirmed localStorage persistence survives a reload. Not yet deployed — local only. CONTEXT.md created.
