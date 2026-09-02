/* ============================================================
   SOMETHING COIN — coin.js
   A real 3D coin: black body, acid mark, drag to spin.
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
  const ACID = "#c0f913";
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
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 4.35);

  /* ---------- studio environment (monochrome) ---------- */
  const env = (() => {
    const c = document.createElement("canvas");
    c.width = 512; c.height = 256;
    const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0.00, "#ffffff");
    g.addColorStop(0.35, "#8a8a8a");
    g.addColorStop(0.52, "#151515");
    g.addColorStop(1.00, "#000000");
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

  /* ---------- face texture from logo.jpg ---------- */
  // The mark, struck into the face: black field, acid wordmark.
  function faceTexture() {
    const S = 1024;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const x = c.getContext("2d");

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    // Cylinder cap UVs run 90° off from the screen axes on both ends —
    // one quarter turn puts the mark upright on the front and the back.
    tex.center.set(0.5, 0.5);
    tex.rotation = Math.PI / 2;

    const draw = () => {
      x.fillStyle = "#000";
      x.fillRect(0, 0, S, S);

      x.fillStyle = ACID;
      x.textAlign = "center";
      x.textBaseline = "middle";
      // fit the word to ~72% of the cap so it clears the rim on both sides
      let size = 170;
      x.font = `700 ${size}px ${FACE_FONT}`;
      const target = S * 0.72;
      size = Math.round(size * target / x.measureText(WORD).width);
      x.font = `700 ${size}px ${FACE_FONT}`;
      x.fillText(WORD, S / 2, S / 2);

      // hairline rules above and below, echoing the intro
      x.strokeStyle = "rgba(192,249,19,.34)";
      x.lineWidth = 3;
      const w = target * 0.86, y = size * 0.72;
      x.beginPath();
      x.moveTo((S - w) / 2, S / 2 - y); x.lineTo((S + w) / 2, S / 2 - y);
      x.moveTo((S - w) / 2, S / 2 + y); x.lineTo((S + w) / 2, S / 2 + y);
      x.stroke();

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

  /* ---------- coin ---------- */
  const R = 1, H = 0.13;
  const geo = new THREE.CylinderGeometry(R, R, H, 160, 1, false);
  geo.rotateX(Math.PI / 2);                 // faces look at the camera

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0x0d0d0d,
    metalness: 0.95,
    roughness: 0.28,
    clearcoat: 1,
    clearcoatRoughness: 0.18,
    bumpMap: edgeBump,
    bumpScale: 0.012,
    envMapIntensity: 1.35
  });

  // Lower metalness than the rim so the acid mark stays a flat, loud green
  // instead of turning into polished metal.
  const faceMat = () => new THREE.MeshPhysicalMaterial({
    map: faceTexture(),
    color: 0xffffff,
    metalness: 0.15,
    roughness: 0.42,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    envMapIntensity: 0.85
  });

  // CylinderGeometry material order: [side, top, bottom]
  const coin = new THREE.Mesh(geo, [bodyMat, faceMat(), faceMat()]);

  const group = new THREE.Group();
  group.add(coin);
  group.rotation.x = -0.14;
  scene.add(group);
  window.__coin = group;

  /* ---------- lights ---------- */
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));

  const key = new THREE.DirectionalLight(0xffffff, 3.4);
  key.position.set(-2.4, 3.0, 3.2);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xffffff, 2.6);
  rim.position.set(3.0, -1.4, -2.2);
  scene.add(rim);

  const fill = new THREE.DirectionalLight(0xffffff, 1.1);
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
