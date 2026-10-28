/* Typographic solids sliced into physical lamellae. The renderer projects actual
   box geometry, sorts the visible faces by depth and lights each face separately. */
export async function initTypeSculpture(root = document.querySelector('.type-art')) {
  if (!root) return;
  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  const title = root.closest('section').querySelector('h2');
  const controls = [...root.querySelectorAll('[data-type-mode]')];
  const randomControl = root.querySelector('[data-type-random]');
  const poster = root.querySelector('.type-poster');
  const label = root.querySelector('.type-caption-label');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const modes = [
    { word: 'САЙТ', label: 'Веб-дизайн' },
    { word: 'РОСТ', label: 'Маркетинг' },
    { word: 'СИСТЕМА', label: 'Автоматизация' }
  ];
  const columns = 156, slots = 4, worldWidth = 6.5;
  const unit = worldWidth / columns;
  const count = columns * slots;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = t => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
  let w = 1, h = 1, scale = 1, frame = 0, lastTime = 0, visible = false;
  let selected = 0, changedAt = -10000, introduction = performance.now();
  let hover = 0, hoverTarget = 0, pointerX = 0, pointerY = 0, aimX = 0, aimY = 0;
  let dragYaw = 0, targetYaw = 0, dragPitch = 0, targetPitch = 0;
  let dragging = false, dragStart = null, lastPointer = null;
  let current = new Float32Array(count * 2), from = new Float32Array(count * 2), target;
  let profiles = [], settledFrames = 0;
  const faces = [], shapes = [];
  const shadow = document.createElement('canvas');
  const sx = shadow.getContext('2d');

  try { await document.fonts.ready; } catch { /* System font is a readable fallback. */ }
  const family = getComputedStyle(title).fontFamily;
  const mask = document.createElement('canvas'); mask.width = 960; mask.height = 320;
  const mx = mask.getContext('2d', { willReadFrequently: true });
  function profile(word) {
    mx.clearRect(0, 0, mask.width, mask.height);
    mx.font = '800 240px ' + family;
    const size = Math.min(240, 852 / mx.measureText(word).width * 240);
    mx.font = '800 ' + size + 'px ' + family;
    mx.textAlign = 'center'; mx.textBaseline = 'alphabetic'; mx.fillStyle = '#000';
    const metrics = mx.measureText(word);
    const base = (mask.height + metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
    mx.fillText(word, mask.width / 2, base);
    const pixels = mx.getImageData(0, 0, mask.width, mask.height).data;
    const data = new Float32Array(count * 2);
    for (let c = 0; c < columns; c++) {
      const x = Math.round((c + .5) / columns * (mask.width - 1));
      const runs = []; let start = -1;
      for (let y = 0; y <= mask.height; y++) {
        const ink = y < mask.height && pixels[(y * mask.width + x) * 4 + 3] > 110;
        if (ink && start < 0) start = y;
        if (!ink && start >= 0) {
          if (y - start >= 2) runs.push({ top: start, bottom: y });
          start = -1;
        }
      }
      runs.sort((a, b) => a.top - b.top);
      for (let s = 0; s < slots; s++) {
        const i = (c * slots + s) * 2, run = runs[s];
        if (run) {
          data[i] = (mask.height / 2 - (run.top + run.bottom) / 2) / mask.width * worldWidth;
          data[i + 1] = (run.bottom - run.top) / mask.width * worldWidth;
        }
      }
    }
    return data;
  }
  profiles = modes.map(mode => profile(mode.word));
  target = profiles[0]; current.set(target); from.set(target);
  for (let i = 0; i < count; i++) shapes.push({ i, column: Math.floor(i / slots), points: [], height: 0 });

  function resize() {
    const bounds = root.getBoundingClientRect();
    w = bounds.width; h = bounds.height;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    scale = Math.min(w / 7.05, h / 4.6);
    shadow.width = Math.max(1, Math.round(w)); shadow.height = Math.max(1, Math.round(h));
    makeShadow(); request();
  }
  function makeShadow() {
    sx.clearRect(0, 0, w, h);
    sx.save(); sx.translate(w * .52, h * .66); sx.scale(1, .18);
    const g = sx.createRadialGradient(0, 0, 0, 0, 0, w * .37);
    g.addColorStop(0, '#24242124'); g.addColorStop(.4, '#35352f10'); g.addColorStop(1, '#35352f00');
    sx.fillStyle = g; sx.fillRect(-w * .4, -w * .4, w * .8, w * .8); sx.restore();
  }
  function select(index) {
    index = clamp(index, 0, 2);
    if (index === selected) return;
    selected = index; from.set(current); target = profiles[index]; changedAt = performance.now();
    controls.forEach(control => {
      const active = Number(control.dataset.typeMode) === index;
      control.classList.toggle('is-active', active);
      control.setAttribute('aria-pressed', String(active));
    });
    label.textContent = modes[index].label;
    root.dataset.word = modes[index].word;
    root.setAttribute('aria-label', 'Интерактивная типографика: ' + modes[index].word);
    if (poster) poster.textContent = modes[index].word;
    if (reduce.matches) current.set(target);
    request();
  }
  function randomize() { select((selected + 1 + Math.floor(Math.random() * (modes.length - 1))) % modes.length); }
  randomControl?.addEventListener('click', randomize);
  controls.forEach(control => {
    const index = Number(control.dataset.typeMode);
    control.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') select(index); });
    control.addEventListener('focus', () => select(index));
    control.addEventListener('click', () => select(index));
    control.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
      const group = control.closest('[data-type-controls]');
      group.querySelector('[data-type-mode="' + next + '"]').focus();
    });
  });

  // Rigid-body orientation and perspective projection shared by all the plates.
  function orient(x, y, z, yaw, pitch) {
    const a = x * Math.cos(yaw) + z * Math.sin(yaw);
    const b = -x * Math.sin(yaw) + z * Math.cos(yaw);
    return { x: a, y: y * Math.cos(pitch) - b * Math.sin(pitch), z: y * Math.sin(pitch) + b * Math.cos(pitch) };
  }
  function project(point) {
    const distance = 12, perspective = distance / (distance - point.z);
    const fit = 1 - hover * .20;
    return { x: w * .51 + point.x * scale * fit * perspective, y: h * .47 - point.y * scale * fit * perspective, z: point.z };
  }
  const faceDefinitions = [
    { corners: [0, 1, 2, 3], normal: [0, 0, 1], material: 'ink' },
    { corners: [5, 4, 7, 6], normal: [0, 0, -1], material: 'ink' },
    { corners: [4, 0, 3, 7], normal: [-1, 0, 0], material: 'edge' },
    { corners: [1, 5, 6, 2], normal: [1, 0, 0], material: 'edge' },
    { corners: [3, 2, 6, 7], normal: [0, 1, 0], material: 'cut' },
    { corners: [4, 5, 1, 0], normal: [0, -1, 0], material: 'cut' }
  ];
  function material(normal, kind, column) {
    const light = Math.max(0, normal.x * -.44 + normal.y * .75 + normal.z * .49);
    const grain = Math.sin(column * 1.73) * 1.1;
    let value = kind === 'ink' ? 22 + light * 17 : kind === 'edge' ? 105 + light * 95 : 160 + light * 57;
    value += grain;
    return 'rgb(' + Math.round(value) + ',' + Math.round(value * .991) + ',' + Math.round(value * .967) + ')';
  }
  function geometry(now) {
    faces.length = 0;
    const transition = reduce.matches ? 3 : (now - changedAt) / 1000;
    const intro = reduce.matches ? 1 : smooth((now - introduction) / 1150);
    const yaw = -.29 + pointerX * .14 + dragYaw;
    const pitch = .26 - pointerY * .09 + dragPitch;
    for (const shape of shapes) {
      const c = shape.column, i = shape.i * 2;
      const t = clamp((transition - c / (columns - 1) * .25) / .80), e = smooth(t);
      const center = mix(from[i], target[i], e), height = mix(from[i + 1], target[i + 1], e);
      current[i] = center; current[i + 1] = height;
      if (height < .006) continue;
      const nx = (c + .5) / columns * 2 - 1;
      const field = Math.exp(-Math.pow((nx - pointerX * .8) / .30, 2));
      const wave = Math.sin(t * Math.PI) ** 2;
      const spread = hover * .20;
      const x = ((c + .5) / columns - .5) * worldWidth * (1 + spread);
      const z = hover * field * .53 + wave * .74;
      const depth = mix(.10, .92, intro) + hover * (.36 + field * .62);
      const localAngle = hover * Math.sin((nx - pointerX * .8) * 2.5) * .13 + wave * .18;
      const half = unit * .365, bottom = center - height / 2, top = center + height / 2;
      const raw = [[-half,bottom,depth/2],[half,bottom,depth/2],[half,top,depth/2],[-half,top,depth/2],[-half,bottom,-depth/2],[half,bottom,-depth/2],[half,top,-depth/2],[-half,top,-depth/2]];
      const points = raw.map(p => {
        const xx = p[0] * Math.cos(localAngle) + p[2] * Math.sin(localAngle);
        const zz = -p[0] * Math.sin(localAngle) + p[2] * Math.cos(localAngle);
        return orient(x + xx, p[1], z + zz, yaw, pitch);
      });
      for (const face of faceDefinitions) {
        const n = face.normal;
        const nxLocal = n[0] * Math.cos(localAngle) + n[2] * Math.sin(localAngle);
        const nzLocal = -n[0] * Math.sin(localAngle) + n[2] * Math.cos(localAngle);
        const normal = orient(nxLocal, n[1], nzLocal, yaw, pitch);
        const vertices = face.corners.map(k => points[k]);
        const center = { x: 0, y: 0, z: 0 };
        vertices.forEach(v => { center.x += v.x / 4; center.y += v.y / 4; center.z += v.z / 4; });
        if (normal.x * -center.x + normal.y * -center.y + normal.z * (12 - center.z) <= 0) continue;
        faces.push({ points: vertices.map(project), z: center.z, color: material(normal, face.material, c) });
      }
    }
    faces.sort((a, b) => a.z - b.z);
    return transition < 1.08 || intro < 1;
  }
  function paint(now) {
    frame = 0;
    if (!visible || document.hidden) return;
    const dt = lastTime ? clamp((now - lastTime) / 16.67, .25, 2) : 1;
    lastTime = now;
    const damping = 1 - Math.pow(.88, dt);
    const old = [hover, pointerX, pointerY, dragYaw, dragPitch];
    hover += ((reduce.matches ? 0 : hoverTarget) - hover) * damping;
    pointerX += (aimX - pointerX) * damping; pointerY += (aimY - pointerY) * damping;
    dragYaw += (targetYaw - dragYaw) * damping; dragPitch += (targetPitch - dragPitch) * damping;
    ctx.clearRect(0, 0, w, h); ctx.drawImage(shadow, 0, 0, w, h);
    const changing = geometry(now);
    for (const face of faces) {
      const p = face.points;
      ctx.beginPath(); ctx.moveTo(p[0].x, p[0].y); ctx.lineTo(p[1].x, p[1].y);
      ctx.lineTo(p[2].x, p[2].y); ctx.lineTo(p[3].x, p[3].y); ctx.closePath();
      ctx.fillStyle = face.color; ctx.fill();
    }
    const movement = Math.abs(hover-old[0])+Math.abs(pointerX-old[1])+Math.abs(pointerY-old[2])+Math.abs(dragYaw-old[3])+Math.abs(dragPitch-old[4]);
    settledFrames = !changing && movement < .0003 ? settledFrames + 1 : 0;
    root.classList.add('type-ready');
    root.dataset.motion = settledFrames < 4 ? "moving" : "idle";
    if (settledFrames < 4) request();
  }
  function request() { if (!frame && visible && !document.hidden) frame = requestAnimationFrame(paint); }
  function stop() { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
  function point(event) {
    const r = canvas.getBoundingClientRect();
    aimX = clamp((event.clientX - r.left) / r.width * 2 - 1, -1, 1);
    aimY = clamp((event.clientY - r.top) / r.height * 2 - 1, -1, 1);
  }
  canvas.addEventListener('pointerenter', event => { if (!reduce.matches && event.pointerType !== 'touch') { hoverTarget = 1; point(event); request(); } });
  canvas.addEventListener('pointermove', event => {
    if (reduce.matches) return;
    point(event);
    if (dragging && lastPointer) {
      const dx = event.clientX - lastPointer.x, dy = event.clientY - lastPointer.y;
      targetYaw = clamp(targetYaw + dx / w * 1.7, -.68, .68);
      targetPitch = clamp(targetPitch + dy / h * .5, -.16, .22);
      root.classList.add('is-dragging');
    }
    lastPointer = { x: event.clientX, y: event.clientY };
    request();
  });
  canvas.addEventListener('pointerdown', event => {
    if (reduce.matches) return;
    dragging = true; hoverTarget = 1; dragStart = { x: event.clientX, y: event.clientY };
    lastPointer = dragStart; canvas.setPointerCapture(event.pointerId); request();
  });
  function release(event) {
    if (dragStart && event.type === 'pointerup' && Math.hypot(event.clientX-dragStart.x,event.clientY-dragStart.y)<7) randomize();
    dragging = false; lastPointer = null; dragStart = null;
    targetYaw = 0; targetPitch = 0; root.classList.remove('is-dragging');
    if (event.pointerType === 'touch' || event.type === 'pointercancel') hoverTarget = 0;
    request();
  }
  canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('pointerleave', () => { if (!dragging) { hoverTarget = 0; aimX = 0; aimY = 0; targetYaw = 0; targetPitch = 0; request(); } });
  reduce.addEventListener('change', () => {
    hoverTarget = hover = aimX = aimY = pointerX = pointerY = 0;
    dragYaw = targetYaw = dragPitch = targetPitch = 0; dragging = false;
    root.classList.remove('is-dragging');
    current.set(target); from.set(target); changedAt = -10000; request();
  });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) request(); else stop(); }).observe(root);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else request(); });
  new ResizeObserver(resize).observe(root);
  root.dataset.word = modes[0].word;
  resize();
}
