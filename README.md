# Something Coin — $SOMETHING

Landing page for **Something Coin**, ticker **$SOMETHING**, launching on **Robinhood**.
Static site: no build step, no dependencies to install. Deploys to Vercel as-is.

```
index.html      markup
styles.css      the acid/ink design system
main.js         intro, cursor, reveals, counters, copy, FAQ, video facade
coin.js         three.js 3D coin (drag to spin) with a CSS fallback
logo3.jpg       source logo — green field, cream ring, extruded S
favicon.png     the logo, squared off (128px)
icon-192.png    same, 192px, used as the apple-touch-icon
og.png          1200x630 social card
logo.jpg, logo2.jpg, newlogo.jpg   earlier marks, kept for reference
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
  BUY_URL: "https://www.ponsfamily.com/launchpad/0x59da04…cfd6",
  CONTRACT: "0x59da048bbfcefb98609d588dbf4fa64d171acfd6"
};
```

- `X_URL` — every X link (nav, buy section, CTA, footer).
- `BUY_URL` — every Buy button, opened in a new tab. If it is ever emptied they scroll to How to Buy
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

`coin.js` strikes `logo3.jpg` as an actual coin in three.js (loaded from jsDelivr
via an import map): a green blank in the logo's own `#bad621`, a cream torus for
the ring, and a real extruded **S** standing proud of each face, built with
`TextGeometry` from Helvetiker Bold. Proportions come off the logo, where the
ring spans 72% of the square. The edge carries a reeded bump map.

Drag to spin, release for inertia, click for a flick, double-click for a hard
spin; it settles back to a slow idle rotation. The letter is loaded after the
coin is already on screen, so a slow font fetch costs the rest nothing, and if
WebGL or the CDN is unavailable the whole thing falls back to the flat logo.

## Local preview

Needs a real HTTP server — `coin.js` is an ES module, so `file://` will not work.

```bash
npx serve .
```

## Deploy

Vercel → New Project → import this repo → Framework preset **Other** → Deploy.
No build command, no output directory.
