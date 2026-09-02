# Something Coin — $SOMETHING

Landing page for **Something Coin**, ticker **$SOMETHING**, launching on **Robinhood**.
Static site: no build step, no dependencies to install. Deploys to Vercel as-is.

```
index.html      markup
styles.css      the acid/ink design system
main.js         intro, cursor, reveals, counters, copy, FAQ, video facade
coin.js         three.js 3D coin (drag to spin) with a CSS fallback
newlogo.jpg     source logo — acid disc, white $
favicon.png     the logo clipped to a transparent circle (256px)
icon-512.png    same, 512px, used as the apple-touch-icon
og.png          1200x630 social card
logo.jpg        the previous black/white logo, kept for reference
```

## Design

Acid green `#c0f913` and ink black, sampled straight from the logo. The wordmark
is lowercase `something.` set in Helvetica/Arial Bold with tight tracking — it is
the logo, so it appears at every scale: the intro, the hero, the coin faces and
the giant footer word.

Every component is written against `--bg` / `--fg` / `--line` custom properties,
so adding `.inv` to a section flips it to acid-on-black with nothing else to
change. The video section, the CTA and the footer use it, which gives the page
its light/dark rhythm.

## Things to fill in

Everything editable lives at the top of **`main.js`**:

```js
const CONFIG = {
  X_URL: "https://x.com/somethingonhood",
  BUY_URL: "",        // token page / DEX link — empty: Buy scrolls to the steps
  CONTRACT: ""        // mint address — empty: both boxes read "coming soon"
};
```

- `X_URL` — every X link (nav, buy section, CTA, footer).
- `BUY_URL` — every Buy button. While it is empty they scroll to How to Buy
  instead of linking out.
- `CONTRACT` — while it is empty, both contract boxes read **coming soon**, the
  copy buttons are disabled and a live dot pulses in place of the copy icon.
  Fill it in and the boxes become real, copyable addresses with no other change.

The same values are also written into `index.html` so the page still works with
JavaScript disabled. Change both when they change.

## The intro

A full-screen title sequence runs on load, roughly three seconds: black field,
hairline rules, then **something.** lands one letter at a time — each cell stamps
down as a solid acid block, lifts away, and the letter slides up behind it.
Glyphs are never substituted, so nothing but the wordmark can ever be on screen.
The tracking then collapses, the screen flashes, and eight vertical bars tear
upward to reveal the acid page underneath.

Click or press any key to skip. Timing is the `STEP` constant in the `intro()`
block; reduced-motion visitors get the finished word and a quick cut.

## The 3D coin

`coin.js` builds a cylinder in three.js (loaded from jsDelivr via an import map),
draws the wordmark onto both faces on a canvas, and gives the edge a reeded bump
map. Drag to spin, release for inertia, click for a flick, double-click for a
hard spin; it settles back to a slow idle rotation. If WebGL or the CDN is
unavailable it falls back to a flat rotating disc.

## Local preview

Needs a real HTTP server — `coin.js` is an ES module, so `file://` will not work.

```bash
npx serve .
```

## Deploy

Vercel → New Project → import this repo → Framework preset **Other** → Deploy.
No build command, no output directory.
