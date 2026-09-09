/* ============================================================
   SOMETHING COIN — coin.js
   The logo struck as a real coin: green blank, cream ring, and
   an extruded cream S standing proud of the face. Drag to spin.
   Falls back to the flat logo if WebGL / three.js is absent.
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

  // sampled straight out of logo3.jpg
  const GREEN = 0xbad621;
  const CREAM = 0xfffcf0;

  /* ---------- renderer ---------- */
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.88;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 4.35);

  /* ---------- environment ----------
     The logo is a matte illustration, so this is a soft, evenly lit box
     rather than a studio: a hard falloff would shade the green into olive
     and lose the flatness the mark depends on. */
  const env = (() => {
    const c = document.createElement("canvas");
    c.width = 512; c.height = 256;
    const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0.00, "#f2f2f2");
    g.addColorStop(0.45, "#c4c4c4");
    g.addColorStop(0.75, "#a8b47a");
    g.addColorStop(1.00, "#8a9a50");
    x.fillStyle = g; x.fillRect(0, 0, 512, 256);
    const blob = (cx, cy, r, a) => {
      const rg = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      rg.addColorStop(0, `rgba(255,255,255,${a})`);
      rg.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = rg; x.fillRect(cx - r, cy - r, r * 2, r * 2);
    };
    blob(150, 70, 150, .55);
    blob(390, 110, 110, .3);
    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const rt = pmrem.fromEquirectangular(tex);
    pmrem.dispose(); tex.dispose();
    return rt.texture;
  })();
  scene.environment = env;

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
    return t;
  })();

  /* ---------- materials ---------- */
  const greenMat = new THREE.MeshPhysicalMaterial({
    color: GREEN,
    metalness: 0,
    roughness: 0.62,
    clearcoat: 0.25,
    clearcoatRoughness: 0.4,
    envMapIntensity: 0.4
  });

  const edgeMat = new THREE.MeshPhysicalMaterial({
    color: GREEN,
    metalness: 0,
    roughness: 0.5,
    clearcoat: 0.4,
    clearcoatRoughness: 0.35,
    bumpMap: edgeBump,
    bumpScale: 0.014,
    envMapIntensity: 0.45
  });

  const creamMat = new THREE.MeshPhysicalMaterial({
    color: CREAM,
    metalness: 0,
    roughness: 0.55,
    clearcoat: 0.3,
    clearcoatRoughness: 0.35,
    envMapIntensity: 0.38
  });

  /* ---------- the blank ---------- */
  const R = 1, H = 0.2;
  const blankGeo = new THREE.CylinderGeometry(R, R, H, 160, 1, false);
  blankGeo.rotateX(Math.PI / 2);            // faces look at the camera
  const blank = new THREE.Mesh(blankGeo, [edgeMat, greenMat, greenMat]);

  const coin = new THREE.Group();
  coin.add(blank);

  /* ---------- one face: the ring, and the letter that goes in it ----------
     Proportions come off the logo, where the ring spans 72% of the square. */
  const RING_R = 0.72, RING_TUBE = 0.022, LETTER_H = 0.8, RELIEF = 0.075;

  const faces = [];
  for (const sign of [1, -1]) {
    const face = new THREE.Group();

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(RING_R, RING_TUBE, 20, 180),
      creamMat
    );
    ring.position.z = H / 2 - RING_TUBE * 0.35;   // sunk a touch into the face
    face.add(ring);

    face.rotation.y = sign > 0 ? 0 : Math.PI;
    coin.add(face);
    faces.push(face);
  }

  const group = new THREE.Group();
  group.add(coin);
  group.rotation.x = -0.14;
  scene.add(group);
  window.__coin = group;

  /* ---------- the extruded S ----------
     Loaded after the coin is already on screen, so a slow or blocked font
     fetch costs the ring and the blank nothing. */
  (async () => {
    const [{ FontLoader }, { TextGeometry }] = await Promise.all([
      import("three/addons/loaders/FontLoader.js"),
      import("three/addons/geometries/TextGeometry.js")
    ]);
    const font = await new FontLoader().loadAsync(
      "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json"
    );

    const geo = new TextGeometry("S", {
      font,
      size: 1,
      height: RELIEF,
      curveSegments: 24,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.008,
      bevelSegments: 4
    });
    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    const scale = LETTER_H / (bb.max.y - bb.min.y);
    geo.scale(scale, scale, 1);
    geo.computeBoundingBox();
    // centre it on the face; the extrusion runs from z=0 outward
    geo.translate(
      -(geo.boundingBox.max.x + geo.boundingBox.min.x) / 2,
      -(geo.boundingBox.max.y + geo.boundingBox.min.y) / 2,
      0
    );

    for (const face of faces) {
      const s = new THREE.Mesh(geo, creamMat);
      s.position.z = H / 2 - 0.004;
      face.add(s);
    }
  })().catch(err => console.warn("[coin] letter unavailable:", err));

  /* ---------- lights ---------- */
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));

  const key = new THREE.DirectionalLight(0xffffff, 1.05);
  key.position.set(2.6, 3.0, 3.0);          // upper right, as in the logo
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 0.35);
  fill.position.set(-2.6, -1.0, 2.4);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffffff, 0.45);
  rim.position.set(-1.6, 1.4, -2.6);
  scene.add(rim);

  /* ---------- interaction ---------- */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const IDLE = reduced ? 0 : 0.0042;
  let velY = IDLE, velX = 0;
  let dragging = false, lastX = 0, lastY = 0, moved = 0;

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

  let px = 0, py = 0;
  if (!reduced) {
    addEventListener("pointermove", (e) => {
      px = (e.clientX / innerWidth - 0.5) * 2;
      py = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });
  }

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
      const targetX = -0.14 + py * 0.16;
      group.rotation.x += (targetX - group.rotation.x) * 0.02 * dt;
      group.position.x += (px * 0.06 - group.position.x) * 0.03 * dt;
    }
    group.position.y = reduced ? 0 : Math.sin(t * 0.0009) * 0.045;

    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  setTimeout(() => hint && (hint.style.opacity = ""), 100);
}
