// 开场：3D 老电视机（10-30）。可拖动旋转、缩放，点击电视推进屏幕后进入主页。
// 同一浏览器只自动播放一次；点左上角名字可以回来看；带 #research 这类直达链接时不播放。
// 现在的电视是代码搭的，以后有混元模型时只替换 buildTV()。3D 库只在开场显示时才加载。
(() => {
  const root = document.documentElement;
  const EN = root.lang === "en";
  const T = EN
    ? { hint: "Drag to rotate · Scroll or pinch to zoom · Click the TV to enter", skip: "Skip", enter: "Click to enter", name: "Yue Chen", sub: "陈悦", aria: "A 3D old television. Click it to enter the site." }
    : { hint: "拖动旋转 · 滚轮或双指缩放 · 点击电视进入", skip: "跳过", enter: "点击进入", name: "陈悦", sub: "Yue Chen", aria: "一台可以旋转的 3D 老电视机，点击进入网站" };
  const V = "assets/vendor/three/";
  const remember = () => { try { localStorage.setItem("intro-seen", "1"); } catch (e) {} };
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const roundedRect = (THREE, w, h, r, Cls = THREE.Shape) => {
    const s = new Cls(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  };

  // 屏幕：雪花噪点、扫描线和名字，画在 canvas 上当贴图
  const makeScreen = THREE => {
    const c = document.createElement("canvas"); c.width = 640; c.height = 480;
    const g = c.getContext("2d");
    const noise = document.createElement("canvas"); noise.width = noise.height = 256;
    const n = noise.getContext("2d"), d = n.createImageData(256, 256);
    for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    n.putImageData(d, 0, 0);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const font = '"PingFang SC","Microsoft YaHei",Inter,Arial,sans-serif';
    let last = 0;
    const draw = (t, level = 0) => {
      if (t - last < 66 && !level) return; last = t;
      g.fillStyle = "#0b0c0c"; g.fillRect(0, 0, 640, 480);
      g.globalAlpha = .2 + level * .7;
      const ox = Math.random() * 256 | 0, oy = Math.random() * 256 | 0;
      for (let x = -ox; x < 640; x += 256) for (let y = -oy; y < 480; y += 256) g.drawImage(noise, x, y);
      g.globalAlpha = 1;
      g.fillStyle = "rgba(0,0,0,.28)"; for (let y = 0; y < 480; y += 4) g.fillRect(0, y, 640, 2);
      const band = (t / 22) % 560 - 40; g.fillStyle = "rgba(255,255,255,.05)"; g.fillRect(0, band, 640, 40);
      g.textAlign = "center"; g.textBaseline = "middle"; g.shadowColor = "rgba(255,255,255,.6)"; g.shadowBlur = 14;
      g.fillStyle = "#f4f4f2"; g.font = `600 76px ${font}`; g.fillText(T.name, 320, 196);
      g.shadowBlur = 6; g.fillStyle = "#b9b9b6"; g.font = `400 28px ${font}`; g.fillText(T.sub, 320, 256);
      if (Math.floor(t / 650) % 2 === 0) { g.fillStyle = "#f4f4f2"; g.font = `400 26px ${font}`; g.fillText("▶  " + T.enter, 320, 346); }
      g.shadowBlur = 0;
      if (level) { g.fillStyle = `rgba(255,255,255,${level})`; g.fillRect(0, 0, 640, 480); }
      tex.needsUpdate = true;
    };
    draw(0);
    return { tex, draw };
  };

  // 代码搭的电视机：银色机身、弧面屏、右侧旋钮和喇叭栅、后壳、顶上的摄像头（呼应《库里肖夫的实验》）
  const buildTV = (THREE, RoundedBox, screenTex) => {
    const tv = new THREE.Group();
    const silver = new THREE.MeshStandardMaterial({ color: 0xb9b9b4, metalness: .88, roughness: .36 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x1b1b1c, metalness: .25, roughness: .6 });
    const plate = new THREE.MeshStandardMaterial({ color: 0x8d8d89, metalness: .8, roughness: .42 });
    const black = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: .2, roughness: .45 });
    const steel = new THREE.MeshStandardMaterial({ color: 0xd8d8d4, metalness: .95, roughness: .22 });
    const add = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); tv.add(m); return m; };

    const W = 4.6, H = 3.2, FRONT = 1.0;
    add(new RoundedBox(W, H, 1.3, 6, .16), silver, 0, 0, FRONT - .65);
    add(new RoundedBox(W * .78, H * .8, 1.5, 4, .22), dark, 0, -.03, -.75);
    for (let i = 0; i < 7; i++) add(new THREE.BoxGeometry(2.3, .035, .02), black, 0, .55 - i * .17, -1.51);

    // 屏幕框：圆角矩形挖洞后挤出
    const SX = -.62, SW = 2.9, SH = 2.34;
    const frame = roundedRect(THREE, SW + .36, SH + .36, .26);
    frame.holes.push(roundedRect(THREE, SW, SH, .34, THREE.Path));
    const frameGeo = new THREE.ExtrudeGeometry(frame, { depth: .1, bevelEnabled: true, bevelThickness: .05, bevelSize: .04, bevelSegments: 4, curveSegments: 12 });
    add(frameGeo, black, SX, 0, FRONT - .08);

    // 弧面屏：中间微微鼓起，四角由屏幕框遮住
    const scr = new THREE.PlaneGeometry(SW + .1, SH + .1, 32, 24), p = scr.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) / ((SW + .1) / 2), v = p.getY(i) / ((SH + .1) / 2);
      p.setZ(i, .055 * (1 - u * u) * (1 - v * v));
    }
    scr.computeVertexNormals();
    add(scr, new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }), SX, 0, FRONT + .005);

    // 右侧控制面板
    const PX = 1.62;
    add(new RoundedBox(1.0, 2.76, .06, 3, .03), plate, PX, 0, FRONT + .01);
    const dial = (y, r) => {
      const d = add(new THREE.CylinderGeometry(r, r * 1.06, .16, 40), dark, PX, y, FRONT + .1); d.rotation.x = Math.PI / 2;
      const cap = add(new THREE.CylinderGeometry(r * .68, r * .68, .02, 32), steel, PX, y, FRONT + .19); cap.rotation.x = Math.PI / 2;
      add(new THREE.BoxGeometry(.03, r * .95, .02), black, PX, y + r * .35, FRONT + .205);
    };
    dial(1.0, .3); dial(.34, .22);
    for (let i = 0; i < 4; i++) add(new RoundedBox(.16, .09, .05, 2, .02), i ? dark : steel, PX - .27 + i * .18, -.03, FRONT + .05);
    for (let i = 0; i < 10; i++) add(new THREE.BoxGeometry(.78, .045, .025), black, PX, -.3 - i * .1, FRONT + .045);
    const led = add(new THREE.CircleGeometry(.03, 16), new THREE.MeshBasicMaterial({ color: 0xe03a2f }), PX + .36, 1.27, FRONT + .045);
    led.name = "led";

    // 脚和顶上的摄像头
    for (const x of [-1.7, 1.7]) add(new THREE.CylinderGeometry(.14, .18, .18, 20), dark, x, -H / 2 - .08, .3);
    add(new RoundedBox(1.15, .2, .26, 4, .09), black, 0, H / 2 + .2, FRONT - .3);
    add(new THREE.BoxGeometry(.3, .1, .22), dark, 0, H / 2 + .05, FRONT - .3);
    const lens = add(new THREE.CylinderGeometry(.075, .085, .05, 24), steel, 0, H / 2 + .2, FRONT - .15); lens.rotation.x = Math.PI / 2;
    const glass = add(new THREE.CylinderGeometry(.05, .05, .012, 24), new THREE.MeshStandardMaterial({ color: 0x10131a, metalness: .9, roughness: .08 }), 0, H / 2 + .2, FRONT - .12); glass.rotation.x = Math.PI / 2;
    return tv;
  };

  let running = false;

  const show = async () => {
    if (running) return; running = true;
    root.classList.add("intro");
    const stage = document.createElement("div"); stage.className = "intro-stage"; stage.dataset.runtime = "";
    const hint = Object.assign(document.createElement("p"), { className: "intro-hint", textContent: T.hint });
    const skip = Object.assign(document.createElement("button"), { type: "button", className: "intro-skip", textContent: T.skip });
    stage.append(hint, skip); document.body.append(stage);

    let cleanup = () => {};
    const finish = () => {
      remember(); cleanup();
      root.classList.remove("intro"); stage.classList.add("off");
      setTimeout(() => { stage.remove(); running = false; }, calm ? 0 : 520);
    };
    skip.addEventListener("click", finish);

    let THREE, OrbitControls, RoomEnvironment, RoundedBox;
    try {
      [THREE, { OrbitControls }, { RoomEnvironment }, { RoundedBoxGeometry: RoundedBox }] = await Promise.all(
        ["three.module.min.js", "OrbitControls.js", "RoomEnvironment.js", "RoundedBoxGeometry.js"].map(f => import(new URL(V + f, document.baseURI).href)));
    } catch (e) { finish(); return; }
    if (!stage.isConnected || stage.classList.contains("off")) return;

    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
    catch (e) { finish(); return; } // 设备不支持 WebGL 时直接进主页

    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    const canvas = renderer.domElement; canvas.setAttribute("role", "button"); canvas.setAttribute("aria-label", T.aria); canvas.tabIndex = 0;
    stage.prepend(canvas);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
    scene.environmentIntensity = .75;
    const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(4, 6, 7); scene.add(key);

    const { tex, draw } = makeScreen(THREE);
    const tv = buildTV(THREE, RoundedBox, tex); scene.add(tv);

    // 地面上的柔和阴影
    const sc = document.createElement("canvas"); sc.width = sc.height = 256;
    const sg = sc.getContext("2d"), gr = sg.createRadialGradient(128, 128, 10, 128, 128, 128);
    gr.addColorStop(0, "rgba(255,255,255,.2)"); gr.addColorStop(1, "rgba(255,255,255,0)"); sg.fillStyle = gr; sg.fillRect(0, 0, 256, 256);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(9, 5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, -1.78, 0); scene.add(floor);

    const camera = new THREE.PerspectiveCamera(32, 1, .1, 60);
    const controls = new OrbitControls(camera, canvas);
    controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = .07;
    controls.minPolarAngle = .75; controls.maxPolarAngle = 1.75;
    controls.target.set(0, .05, 0);
    controls.autoRotate = !calm; controls.autoRotateSpeed = .7;

    const fit = () => {
      const w = stage.clientWidth, h = stage.clientHeight;
      renderer.setSize(w, h, false); canvas.style.width = "100%"; canvas.style.height = "100%";
      camera.aspect = w / h; camera.updateProjectionMatrix();
      const needW = 3.0 / (Math.tan(camera.fov * Math.PI / 360) * camera.aspect), needH = 2.35 / Math.tan(camera.fov * Math.PI / 360);
      const dist = Math.max(needW, needH) + 1.2;
      controls.minDistance = dist * .55; controls.maxDistance = dist * 1.7;
      return dist;
    };
    const dist = fit();
    camera.position.set(-dist * .38, dist * .14, dist * .91);
    addEventListener("resize", fit);

    // 点击电视：按下和松开几乎没移动才算点击，拖动只是旋转
    const ray = new THREE.Raycaster(), hitTV = e => {
      const r = canvas.getBoundingClientRect();
      ray.setFromCamera({ x: (e.clientX - r.left) / r.width * 2 - 1, y: -(e.clientY - r.top) / r.height * 2 + 1 }, camera);
      return ray.intersectObject(tv, true).length > 0;
    };
    let down = null, entering = 0, enterStart = 0, from = null;
    const stopSpin = () => { controls.autoRotate = false; };
    const onDown = e => { down = { x: e.clientX, y: e.clientY }; stopSpin(); };
    const onUp = e => {
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6 && hitTV(e)) enter();
      down = null;
    };
    const onMove = e => { if (!entering && e.pointerType === "mouse" && !e.buttons) canvas.style.cursor = hitTV(e) ? "pointer" : "grab"; };
    const onKey = e => { if (e.key === "Escape") finish(); else if ((e.key === "Enter" || e.key === " ") && document.activeElement === canvas) { e.preventDefault(); enter(); } };
    canvas.addEventListener("pointerdown", onDown); addEventListener("pointerup", onUp); canvas.addEventListener("pointermove", onMove); canvas.addEventListener("wheel", stopSpin, { passive: true }); addEventListener("keydown", onKey);

    function enter() {
      if (entering) return;
      if (calm) { finish(); return; }
      entering = 1; enterStart = performance.now(); hint.classList.add("off"); skip.classList.add("off");
      controls.enabled = false; controls.autoRotate = false; canvas.style.cursor = "default";
      from = { pos: camera.position.clone(), tgt: controls.target.clone() };
    }
    const ENTER_MS = 1150, toPos = new THREE.Vector3(-.62, 0, 2.15), toTgt = new THREE.Vector3(-.62, 0, 1);
    const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    let raf = 0;
    const loop = now => {
      raf = requestAnimationFrame(loop);
      if (entering) {
        const t = Math.min(1, (now - enterStart) / ENTER_MS), k = ease(t);
        camera.position.lerpVectors(from.pos, toPos, k);
        controls.target.lerpVectors(from.tgt, toTgt, k);
        camera.lookAt(controls.target);
        draw(now, Math.max(0, (t - .55) / .45));
        if (t >= 1) { renderer.render(scene, camera); cancelAnimationFrame(raf); finish(); return; }
      } else { controls.update(); draw(now); }
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(loop);
    stage.classList.add("ready");

    cleanup = () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", fit); removeEventListener("pointerup", onUp); removeEventListener("keydown", onKey);
      controls.dispose(); pmrem.dispose();
      scene.traverse(o => { o.geometry?.dispose(); o.material?.map?.dispose?.(); o.material?.dispose?.(); });
      renderer.dispose(); renderer.forceContextLoss?.();
    };
  };

  if (root.classList.contains("intro")) show();
  // 点左上角名字回到电视机（编辑时不触发）
  document.addEventListener("click", e => {
    if (e.target.closest(".brand") && !document.body.classList.contains("ed-on")) show();
  });
})();
