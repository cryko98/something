/* ============================================================
   SOMETHING COIN — coin.js
   A real 3D coin: polished acid metal, black wordmark, drag to spin.
   Falls back to a flat CSS coin if WebGL / three.js is absent.
   ============================================================ */

const mount = document.getElementById("coin3d");
const canvas = document.getElementById("coinCanvas");
const hint = document.getElementById("coinHint");

if (mount && canvas) {
  try {
    const THREE = await import("three");
    boot(THREE);
  } catch (err) {
    console.warn("[coin] 3D unavailable, using fallback:", err);
    mount.classList.add("is-fallback");
  }
}

function boot(THREE) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ACID_HEX = 0xc0f913;
  const FACE_GREEN = "#b4ee0a";   // a shade under the page, so the coin separates
  const WORD = "something.";
  const FACE_FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';

  /* ---------- renderer ---------- */
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 4.35);

  /* ---------- studio environment (monochrome) ---------- */
  const env = (() => {
    const c = document.createElement("canvas");
    c.width = 512; c.height = 256;
    const x = c.getContext("2d");
    // the lower half is a green bounce, not black — the coin sits on an acid
    // page, and a black floor turned the metal rim muddy along its bottom edge
    const g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0.00, "#ffffff");
    g.addColorStop(0.35, "#c8c8c8");
    g.addColorStop(0.52, "#7d8a3c");
    g.addColorStop(1.00, "#54710c");
    x.fillStyle = g; x.fillRect(0, 0, 512, 256);
    // soft key + rim highlights so the black body catches light
    const blob = (cx, cy, r, a) => {
      const rg = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      rg.addColorStop(0, `rgba(255,255,255,${a})`);
      rg.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = rg; x.fillRect(cx - r, cy - r, r * 2, r * 2);
    };
    blob(120, 60, 130, 1);
    blob(400, 96, 90, .8);
    blob(260, 210, 150, .16);
    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const rt = pmrem.fromEquirectangular(tex);
    pmrem.dispose(); tex.dispose();
    return rt.texture;
  })();
  scene.environment = env;

  /* ---------- face texture ---------- */
  // The mark struck into the inset face: acid field, black wordmark.
  // Both faces use it as-is — turning the back disc 180° about Y already
  // brings its local +x back around to world +x once the coin is flipped.
  function faceTexture() {
    const S = 1024;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const x = c.getContext("2d");

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const draw = () => {
      x.fillStyle = FACE_GREEN;
      x.fillRect(0, 0, S, S);

      x.fillStyle = "#000";
      x.textAlign = "center";
      x.textBaseline = "middle";
      // fit the word to ~76% of the disc so it clears the bezel on both sides
      let size = 170;
      x.font = `700 ${size}px ${FACE_FONT}`;
      size = Math.round(size * (S * 0.76) / x.measureText(WORD).width);
      x.font = `700 ${size}px ${FACE_FONT}`;
      x.fillText(WORD, S / 2, S / 2);

      tex.needsUpdate = true;
    };

    draw();
    // redraw once webfonts settle, in case the stack fell back while loading
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    return tex;
  }

  /* ---------- reeded edge ---------- */
  const edgeBump = (() => {
    const c = document.createElement("canvas");
    c.width = 512; c.height = 8;
    const x = c.getContext("2d");
    x.fillStyle = "#000"; x.fillRect(0, 0, 512, 8);
    x.fillStyle = "#fff";
    for (let i = 0; i < 512; i += 8) x.fillRect(i, 0, 4, 8);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 1);
    return t;
  })();

  /* ---------- coin ----------
     A polished acid-metal blank with the faces inset slightly, so the ring
     left over between the disc and the edge reads as a raised bezel. */
  const R = 1, H = 0.19, FACE_R = 0.87;
  const geo = new THREE.CylinderGeometry(R, R, H, 160, 1, false);
  geo.rotateX(Math.PI / 2);                 // faces look at the camera

  // the milled edge
  const edgeMat = new THREE.MeshPhysicalMaterial({
    color: ACID_HEX,
    metalness: 1,
    roughness: 0.34,
    clearcoat: 1,
    clearcoatRoughness: 0.22,
    bumpMap: edgeBump,
    bumpScale: 0.016,
    envMapIntensity: 1.5
  });

  // the bezel ring: the most polished surface on the coin, so it throws the
  // hard highlights that separate it from the page behind
  const bezelMat = new THREE.MeshPhysicalMaterial({
    color: ACID_HEX,
    metalness: 1,
    roughness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.35
  });

  // CylinderGeometry material order: [side, top, bottom]
  const blank = new THREE.Mesh(geo, [edgeMat, bezelMat, bezelMat]);

  // the flat struck faces, sunk just below the bezel
  const faceGeo = new THREE.CircleGeometry(FACE_R, 128);
  // Mostly self-lit. A purely diffuse face went olive wherever the studio
  // fell off, and the brand green has to hold across the whole disc; the
  // emissive map carries the colour, the thin clearcoat keeps it from
  // looking like flat vector art.
  const faceMat = () => {
    const tex = faceTexture();
    return new THREE.MeshPhysicalMaterial({
      color: 0x000000,        // kill diffuse entirely...
      emissive: 0xffffff,     // ...so the emissive map alone sets the colour
      emissiveMap: tex,
      emissiveIntensity: 1,
      metalness: 0,
      roughness: 0.62,
      clearcoat: 0.12,        // any more and the sheen greys out the wordmark
      clearcoatRoughness: 0.36,
      envMapIntensity: 0.05
    });
  };

  // sat just proud of the cap: what is left of the cap outside FACE_R is the bezel
  const front = new THREE.Mesh(faceGeo, faceMat());
  front.position.z = H / 2 + 0.002;

  const back = new THREE.Mesh(faceGeo, faceMat());
  back.position.z = -(H / 2 + 0.002);
  back.rotation.y = Math.PI;

  const coin = new THREE.Group();
  coin.add(blank, front, back);

  const group = new THREE.Group();
  group.add(coin);
  group.rotation.x = -0.14;
  scene.add(group);
  window.__coin = group;

  /* ---------- lights ----------
     Kept low: the metal rim takes its brightness from the environment map,
     while these would land on the diffuse face and bleach the green. */
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  const key = new THREE.DirectionalLight(0xffffff, 1.3);
  key.position.set(-2.4, 3.0, 3.2);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xffffff, 1.4);
  rim.position.set(3.0, -1.4, -2.2);
  scene.add(rim);

  const fill = new THREE.DirectionalLight(0xffffff, 0.45);
  fill.position.set(2.2, 1.2, 2.4);
  scene.add(fill);

  /* ---------- interaction ---------- */
  let velY = reduced ? 0 : 0.0042;
  let velX = 0;
  let dragging = false, lastX = 0, lastY = 0, moved = 0;
  const IDLE = reduced ? 0 : 0.0042;

  const down = (e) => {
    dragging = true; moved = 0;
    lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture?.(e.pointerId);
    mount.classList.add("is-touched");
  };
  const move = (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    velY = dx * 0.0075;
    velX = dy * 0.0055;
    group.rotation.y += velY;
    group.rotation.x = clamp(group.rotation.x + velX, -1.15, 1.15);
  };
  const up = (e) => {
    if (!dragging) return;
    dragging = false;
    canvas.releasePointerCapture?.(e.pointerId);
    if (moved < 4) velY += 0.42;            // a tap gives it a flick
  };

  canvas.addEventListener("pointerdown", down);
  addEventListener("pointermove", move, { passive: true });
  addEventListener("pointerup", up);
  addEventListener("pointercancel", up);
  canvas.addEventListener("dblclick", () => { velY += 0.85; });

  // subtle look-at drift when the pointer is elsewhere on the page
  let px = 0, py = 0;
  if (!reduced) {
    addEventListener("pointermove", (e) => {
      px = (e.clientX / innerWidth - 0.5) * 2;
      py = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- resize ---------- */
  function resize() {
    const r = mount.getBoundingClientRect();
    const s = Math.max(1, Math.min(r.width, r.height));
    renderer.setSize(s, s, false);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(mount);

  /* ---------- loop ---------- */
  let visible = true, t0 = performance.now();
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 }).observe(mount);

  function frame(t) {
    requestAnimationFrame(frame);
    if (!visible) return;
    const dt = Math.min((t - t0) / 16.666, 3); t0 = t;

    if (!dragging) {
      group.rotation.y += velY * dt;
      group.rotation.x = clamp(group.rotation.x + velX * dt, -1.15, 1.15);
      velY += (IDLE - velY) * 0.012 * dt;    // settle back to the idle spin
      velX *= Math.pow(0.94, dt);
      // ease the tilt toward the pointer
      const targetX = -0.14 + py * 0.16;
      group.rotation.x += (targetX - group.rotation.x) * 0.02 * dt;
      group.position.x += (px * 0.06 - group.position.x) * 0.03 * dt;
    }
    group.position.y = reduced ? 0 : Math.sin(t * 0.0009) * 0.045;

    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  // hide the hint once the user has clearly interacted
  setTimeout(() => hint && (hint.style.opacity = ""), 100);
}
