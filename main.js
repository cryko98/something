/* ============================================================
   something. — main.js
   ------------------------------------------------------------
   EDIT THESE THREE LINES AS THE LAUNCH GOES LIVE:
   ============================================================ */
const CONFIG = {
  X_URL: "https://x.com/somethingonhood",
  BUY_URL: "https://www.ponsfamily.com/launchpad/0x59da048bbfcefb98609d588dbf4fa64d171acfd6",
  CONTRACT: "0x59da048bbfcefb98609d588dbf4fa64d171acfd6"
};
/* ========================================================== */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse  = window.matchMedia("(hover: none), (pointer: coarse)").matches;
const lerp = (a, b, t) => a + (b - a) * t;

/* ------------------------------------------------------------
   CONFIG APPLY
------------------------------------------------------------ */
(function applyConfig () {
  // With a URL configured the link goes out to it in a new tab; without one it
  // falls back — the buy buttons still scroll to the instructions, the X links
  // go inert until the account exists.
  const link = (sel, url, fallback, inert) => $$(sel).forEach(a => {
    if (url) {
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";
      return;
    }
    a.href = fallback;
    a.removeAttribute("target");
    if (!inert) return;
    a.setAttribute("aria-disabled", "true");
    a.title = "Coming soon";
    a.addEventListener("click", e => e.preventDefault());
  });

  link(".x-link", CONFIG.X_URL, "#", true);
  link(".buy-link", CONFIG.BUY_URL, "#buy", false);

  // No contract yet: the boxes say so and stop pretending to be copyable.
  const pending = !CONFIG.CONTRACT;
  $$("[data-ca]").forEach(el => { el.textContent = CONFIG.CONTRACT || "coming soon"; });
  $$(".ca").forEach(box => {
    box.classList.toggle("is-pending", pending);
    const btn = box.querySelector(".ca__value");
    if (!btn) return;
    btn.disabled = pending;
    btn.title = pending ? "Contract not live yet" : "Copy contract address";
  });

  const y = $("#year");
  if (y) y.textContent = new Date().getFullYear();
})();

/* ------------------------------------------------------------
   INTRO — the word lands one letter at a time, then the
   screen tears open in vertical bars.
------------------------------------------------------------ */
(function intro () {
  const box   = $("#intro");
  const word  = $("#introWord");
  const count = $("#introCount");
  if (!box || !word) { document.body.classList.add("is-ready"); heroIntro(); return; }

  const WORD = "something.";
  const STEP = 118;                       // ms between letters
  const timers = [];
  const after = (ms, fn) => timers.push(setTimeout(fn, ms));

  document.body.classList.add("is-locked");

  /* build the letters */
  const letters = [...WORD].map(ch => {
    const s = document.createElement("span");
    s.className = "ltr";
    const b = document.createElement("b");
    b.textContent = ch;
    s.appendChild(b);
    word.appendChild(s);
    return s;
  });

  let done = false;

  function end () {
    if (done) return;
    done = true;
    timers.forEach(clearTimeout);
    // whatever is still pending, the word leaves the screen complete
    letters.forEach(l => l.classList.add("is-arm", "is-on"));
    box.classList.add("is-out", "is-wipe");
    document.body.classList.remove("is-locked");
    document.body.classList.add("is-ready");
    heroIntro();
    setTimeout(() => box.classList.add("is-gone"), 1700);
  }

  /* skip on click or any key */
  const skip = () => { if (!done) { box.classList.add("is-flash"); setTimeout(end, 120); } };
  box.addEventListener("click", skip);
  addEventListener("keydown", skip, { once: true });

  /* reduced motion: show the word, then get out of the way */
  if (reduced) {
    letters.forEach(l => l.classList.add("is-arm", "is-on"));
    box.classList.add("is-live", "is-tight");
    count.textContent = "100";
    after(700, end);
    return;
  }

  requestAnimationFrame(() => box.classList.add("is-live"));

  /* counter runs alongside the letters */
  const total = 460 + letters.length * STEP;
  const t0 = performance.now();
  (function tickCount (t) {
    if (done) return;
    const k = Math.min(((t || t0) - t0) / total, 1);
    count.textContent = String(Math.round(k * 100)).padStart(3, "0");
    if (k < 1) requestAnimationFrame(tickCount);
  })();

  /* each cell stamps down as a white block, then lifts off the glyph.
     The glyph itself is never substituted — whatever the machine's frame
     rate, the only thing that can ever be on screen is SOMETHING. */
  letters.forEach((l, i) => {
    const at = 460 + i * STEP;
    after(at, () => l.classList.add("is-arm"));
    after(at + 130, () => l.classList.add("is-on"));
  });

  /* kern collapse, flash, tear */
  const settled = 460 + letters.length * STEP + 420;
  after(settled, () => box.classList.add("is-tight"));
  after(settled + 980, () => box.classList.add("is-flash"));
  after(settled + 1120, end);

  /* hard failsafe */
  setTimeout(end, 9000);
})();

/* ------------------------------------------------------------
   HERO TITLE — split + staggered reveal
------------------------------------------------------------ */
$$("[data-split]").forEach(el => {
  const text = el.textContent;
  el.textContent = "";
  [...text].forEach(ch => {
    const s = document.createElement("span");
    s.className = "char";
    s.textContent = ch === " " ? " " : ch;
    s.style.transform = "translateY(150%) rotate(6deg)";
    s.style.opacity = "0";
    el.appendChild(s);
  });
});

function heroIntro () {
  const chars = $$(".hero__title .char");
  chars.forEach((c, i) => {
    c.style.transition = "transform 1.05s cubic-bezier(.16,1,.3,1) " + (i * 26 + 120) + "ms, opacity .8s ease " + (i * 26 + 120) + "ms";
    requestAnimationFrame(() => {
      c.style.transform = "translateY(0) rotate(0deg)";
      c.style.opacity = "1";
    });
  });
}

/* ------------------------------------------------------------
   CURSOR + SPOTLIGHT
------------------------------------------------------------ */
if (!coarse) {
  const cur  = $("#cursor");
  const spot = $("#spot");
  let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;

  addEventListener("pointermove", e => {
    mx = e.clientX; my = e.clientY;
    spot.style.setProperty("--mx", mx + "px");
    spot.style.setProperty("--my", my + "px");
  }, { passive: true });

  addEventListener("pointerdown", () => cur.classList.add("is-down"));
  addEventListener("pointerup",   () => cur.classList.remove("is-down"));

  (function loop () {
    cx = lerp(cx, mx, .2); cy = lerp(cy, my, .2);
    cur.style.transform = `translate3d(${cx}px,${cy}px,0)`;
    requestAnimationFrame(loop);
  })();

  const hoverables = "a, button, [data-magnetic], .acc__q, .ca__value, .coin3d";
  document.addEventListener("pointerover", e => {
    if (e.target.closest(hoverables)) cur.classList.add("is-hover");
  });
  document.addEventListener("pointerout", e => {
    if (e.target.closest(hoverables)) cur.classList.remove("is-hover");
  });
}

/* ------------------------------------------------------------
   DUST FIELD
------------------------------------------------------------ */
(function dust () {
  const cv = $("#dust");
  if (!cv || reduced) return;
  const ctx = cv.getContext("2d");
  let w, h, dpr, pts = [];

  function build () {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = cv.width  = innerWidth  * dpr;
    h = cv.height = innerHeight * dpr;
    cv.style.width = innerWidth + "px";
    cv.style.height = innerHeight + "px";
    const n = Math.min(150, Math.round(innerWidth * innerHeight / 16000));
    pts = Array.from({ length: n }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      z: Math.random() * .8 + .2,
      r: (Math.random() * 1.5 + .3) * dpr,
      s: (Math.random() * .22 + .05) * dpr
    }));
  }

  function frame () {
    ctx.clearRect(0, 0, w, h);
    for (const p of pts) {
      p.y -= p.s; p.x += Math.sin(p.y * .0016) * .12 * dpr;
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,0,0,${p.z * .22})`;
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }

  build(); frame();
  let t; addEventListener("resize", () => { clearTimeout(t); t = setTimeout(build, 180); });
})();

/* ------------------------------------------------------------
   NAV + SCROLL PROGRESS
------------------------------------------------------------ */
(function nav () {
  const bar = $("#progressBar");
  const el  = $("#nav");
  let last = 0;

  const onScroll = () => {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    el.classList.toggle("is-stuck", y > 40);
    el.classList.toggle("is-hidden", y > 420 && y > last && !$("#navLinks").classList.contains("is-open"));
    last = y;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const burger = $("#burger");
  const links  = $("#navLinks");
  burger?.addEventListener("click", () => {
    const open = links.classList.toggle("is-open");
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("is-locked", open);
  });
  $$("#navLinks a").forEach(a => a.addEventListener("click", () => {
    links.classList.remove("is-open");
    burger.classList.remove("is-open");
    document.body.classList.remove("is-locked");
  }));
})();

/* ------------------------------------------------------------
   REVEAL ON SCROLL
------------------------------------------------------------ */
(function reveal () {
  const items = $$(".reveal");
  if (!("IntersectionObserver" in window) || reduced) {
    items.forEach(i => i.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en, i) => {
      if (!en.isIntersecting) return;
      const sibs = Array.from(en.target.parentElement.children).indexOf(en.target);
      en.target.style.transitionDelay = Math.min(sibs, 6) * 70 + "ms";
      en.target.classList.add("is-in");
      io.unobserve(en.target);
    });
  }, { threshold: .12, rootMargin: "0px 0px -8% 0px" });
  items.forEach(i => io.observe(i));
})();

/* ------------------------------------------------------------
   MAGNETIC BUTTONS
------------------------------------------------------------ */
if (!coarse && !reduced) {
  $$("[data-magnetic]").forEach(el => {
    let rx = 0, ry = 0, tx = 0, ty = 0, raf = null;
    const run = () => {
      rx = lerp(rx, tx, .18); ry = lerp(ry, ty, .18);
      el.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      if (Math.abs(rx - tx) > .1 || Math.abs(ry - ty) > .1) raf = requestAnimationFrame(run);
      else raf = null;
    };
    el.addEventListener("pointermove", e => {
      const r = el.getBoundingClientRect();
      tx = (e.clientX - (r.left + r.width / 2)) * .3;
      ty = (e.clientY - (r.top + r.height / 2)) * .45;
      if (!raf) raf = requestAnimationFrame(run);
    });
    el.addEventListener("pointerleave", () => {
      tx = 0; ty = 0;
      if (!raf) raf = requestAnimationFrame(run);
    });
  });
}

/* ------------------------------------------------------------
   TEXT SCRAMBLE
------------------------------------------------------------ */
(function scramble () {
  if (reduced) return;
  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ$#%&/\\<>*+";
  $$("[data-scramble]").forEach(el => {
    const original = el.textContent;
    let raf = null, running = false;

    const play = () => {
      if (running) return;
      running = true;
      const len = original.length;
      let frame = 0;
      const queue = [...original].map((ch, i) => ({ ch, start: i * 2, end: i * 2 + 8 + Math.random() * 10 }));
      cancelAnimationFrame(raf);
      const step = () => {
        let out = "", done = 0;
        queue.forEach(q => {
          if (q.ch === " ") { out += " "; done++; return; }
          if (frame >= q.end) { out += q.ch; done++; }
          else if (frame >= q.start) out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          else out += q.ch;
        });
        el.textContent = out;
        frame++;
        if (done < len) raf = requestAnimationFrame(step);
        else { el.textContent = original; running = false; }
      };
      step();
    };

    el.addEventListener("pointerenter", play);
    if (el.classList.contains("sec-title")) {
      const io = new IntersectionObserver(en => {
        if (en[0].isIntersecting) { play(); io.disconnect(); }
      }, { threshold: .6 });
      io.observe(el);
    }
  });
})();

/* ------------------------------------------------------------
   COUNTERS
------------------------------------------------------------ */
(function counters () {
  const nums = $$(".count");
  if (!nums.length) return;
  const fmt = n => n.toLocaleString("en-US");

  const run = el => {
    const to = parseFloat(el.dataset.to);
    if (reduced || to === 0) { el.textContent = fmt(to); return; }
    const dur = 1700, t0 = performance.now();
    const step = t => {
      const k = Math.min((t - t0) / dur, 1);
      const e = 1 - Math.pow(1 - k, 4);
      el.textContent = fmt(Math.round(to * e));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver(en => {
    en.forEach(x => { if (x.isIntersecting) { run(x.target); io.unobserve(x.target); } });
  }, { threshold: .5 });
  nums.forEach(n => io.observe(n));
})();

/* ------------------------------------------------------------
   COPY CONTRACT
------------------------------------------------------------ */
(function copy () {
  const toast = $("#toast");
  let t;
  const show = msg => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("is-on");
    clearTimeout(t);
    t = setTimeout(() => toast.classList.remove("is-on"), 1900);
  };

  $$("[data-copy]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const value = CONFIG.CONTRACT;
      if (!value) return;                       // nothing to copy until it is live
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = value; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); } catch {}
        ta.remove();
      }
      btn.closest(".ca")?.classList.add("is-copied");
      setTimeout(() => btn.closest(".ca")?.classList.remove("is-copied"), 700);
      show("Contract address copied");
    });
  });
})();

/* ------------------------------------------------------------
   ACCORDION
------------------------------------------------------------ */
$$(".acc__q").forEach(q => {
  q.addEventListener("click", () => {
    const item = q.parentElement;
    const open = item.classList.contains("is-open");
    $$(".acc__item").forEach(i => {
      i.classList.remove("is-open");
      i.querySelector(".acc__q")?.setAttribute("aria-expanded", "false");
    });
    if (!open) { item.classList.add("is-open"); q.setAttribute("aria-expanded", "true"); }
  });
});

/* ------------------------------------------------------------
   YOUTUBE FACADE
------------------------------------------------------------ */
(function video () {
  const box = $("#player");
  if (!box) return;
  const facade = box.querySelector(".player__facade");
  const thumb  = box.querySelector("img");

  // fall back to the standard thumbnail if maxres is missing
  thumb?.addEventListener("error", () => {
    thumb.src = `https://i.ytimg.com/vi/${box.dataset.video}/hqdefault.jpg`;
  }, { once: true });

  facade?.addEventListener("click", () => {
    const f = document.createElement("iframe");
    f.src = `https://www.youtube-nocookie.com/embed/${box.dataset.video}?start=${box.dataset.start || 0}&autoplay=1&rel=0&modestbranding=1&playsinline=1`;
    f.title = "Something Coin — origin story";
    f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    f.allowFullscreen = true;
    facade.remove();
    box.appendChild(f);
  });
})();

/* ------------------------------------------------------------
   PARALLAX (hero coin drift on scroll)
------------------------------------------------------------ */
if (!reduced) {
  const coin = $("#coin3d");
  if (coin) {
    let raf = null;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        if (innerWidth <= 1100) {          // stacked layout: leave it alone
          coin.style.transform = "";
          coin.style.opacity = "";
          return;
        }
        const y = Math.min(scrollY, innerHeight);
        coin.style.transform = `translateY(${y * .12}px)`;
        coin.style.opacity = String(Math.max(0, 1 - y / (innerHeight * .95)));
      });
    };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
  }
}
