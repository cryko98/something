# Something Coin — $SOMETHING

Premium monochrome landing page for **Something Coin**, an ERC-20 token on Base.
Static site: no build step, no dependencies to install. Deploys to Vercel as-is.

```
index.html    markup
styles.css    all styling (black & white system)
main.js       intro, cursor, reveals, counters, copy, FAQ, video facade
coin.js       three.js 3D coin (drag to spin) with a CSS fallback
logo.jpg      logo + favicon source
```

## The intro

A full-screen title sequence runs on load, roughly three seconds:

1. hairline rules open above and below the stage, corner type fades up
2. **SOMETHING** lands one letter at a time — each cell stamps down as a solid
   white block, then the block lifts away and the letter slides up into place.
   Glyphs are never substituted, so no frame rate and no interruption can put
   anything other than SOMETHING on screen; skipping the intro snaps the word
   complete before it exits.
3. the tracking collapses to its final kerning and `$SOMETHING` fades in
4. two hard white flashes, then the screen tears open in eight vertical bars
   that lift away to reveal the hero

Click or press any key to skip it. Timing lives in `STEP` at the top of the
`intro()` block in `main.js`; reduced-motion visitors get the finished word and
a quick cut instead.

## Things to fill in before launch

Everything editable lives at the top of **`main.js`**:

```js
const CONFIG = {
  X_URL: "https://x.com/_somethingcoin",
  BUY_URL: "https://app.uniswap.org/explore/tokens/base/0xb200…c301",
  CONTRACT: "0xb200000000000000000000268115e19679e2c301"
};
```

- `X_URL` — every X link (nav, CTA, footer). Empty leaves them inert and marked
  "Coming soon".
- `BUY_URL` — every Buy button (nav, hero, buy section, CTA), opened in a new
  tab. Empty makes them scroll to the How to Buy section instead.
  **Currently a generic Uniswap-on-Base token page — swap it for the real
  launch venue if the token trades somewhere else.**
- `CONTRACT` — fills both contract boxes and the copy-to-clipboard buttons.

The same values are also written into `index.html`, so the page still shows the
real address and links with JavaScript disabled. Change both when they change.

## The 3D coin

`coin.js` builds a real cylinder in three.js (loaded from jsDelivr via an import map),
textures both faces from `logo.jpg`, and gives the edge a reeded bump map.

- drag to spin, release for inertia
- click or tap for a flick, double-click for a hard spin
- it settles back into a slow idle rotation
- if WebGL or the CDN is unavailable it falls back to a flat rotating logo

## Local preview

Needs a real HTTP server — `coin.js` is an ES module, so `file://` will not work.
Any static server does, for example:

```bash
npx serve .
```

## Deploy

Vercel → New Project → import this repo → Framework preset **Other** → Deploy.
No build command, no output directory.
