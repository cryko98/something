# Something Coin — $SOMETHING

Premium monochrome landing page for **Something Coin**, an SPL token on Solana.
Static site: no build step, no dependencies to install. Deploys to Vercel as-is.

```
index.html    markup
styles.css    all styling (black & white system)
main.js       preloader, cursor, reveals, counters, copy, FAQ, video facade
coin.js       three.js 3D coin (drag to spin) with a CSS fallback
logo.jpg      logo + favicon source
```

## Things to fill in before launch

Everything editable lives at the top of **`main.js`**:

```js
const CONFIG = {
  X_URL: "",                                   // e.g. "https://x.com/somethingcoin"
  CONTRACT: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"    // the Solana mint address
};
```

- `X_URL` — while it is empty, every X link is inert and marked "Coming soon".
  Set it once and all three links (nav, CTA, footer) update.
- `CONTRACT` — fills both contract boxes and the copy-to-clipboard buttons.

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
