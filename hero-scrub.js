/** Native all-intra MP4 scrubbing. Scroll distance is owned by hero-scrub.css. */
export function initHeroScrub() {
  const root = document.querySelector('#home');
  const stage = root?.querySelector('.hero-stage');
  const video = root?.querySelector('#hero-video');
  if (!root || !stage || !video) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fps = Number(video.dataset.fps);
  const frameCount = Number(video.dataset.frames);
  const lastTime = (frameCount - 1) / fps;
  const epsilon = 1 / (fps * 4);
  const clamp = value => Math.max(0, Math.min(1, value));
  let start = 0, travel = 1, progress = 0, eased = 0, desired = 0;
  let raf = 0, previousTick = 0, inFlight = false, ready = false;
  let frameCallback = 0;
  let presentedTime = 0, requestedTime = 0, failed = false;

  function schedule() {
    if (!raf && ready && !failed && !reduced.matches && !document.hidden) raf = requestAnimationFrame(tick);
  }
  function measure() {
    // Header and film share one sticky stage and leave this section together.
    start = root.getBoundingClientRect().top + scrollY;
    travel = Math.max(1, root.offsetHeight - stage.offsetHeight);
    schedule();
  }
  function markFinalFrame() {
    root.dataset.finalFrame = 'true';
  }
  function watchFinalFrame() {
    if (!video.requestVideoFrameCallback || frameCallback) return;
    frameCallback = video.requestVideoFrameCallback((_, metadata) => {
      frameCallback = 0;
      if (metadata.mediaTime >= lastTime - epsilon && desired >= lastTime - epsilon) markFinalFrame();
      else if (desired >= lastTime - epsilon) watchFinalFrame();
    });
  }
  function seek() {
    // Complete the current native seek before submitting the newest destination.
    // Repeated currentTime writes while seeking can starve the decoder.
    if (!ready || failed || inFlight || video.seeking) return;
    if (Math.abs(presentedTime - desired) < epsilon) return;
    requestedTime = desired;
    inFlight = true;
    if (requestedTime >= lastTime - epsilon) watchFinalFrame();
    try { video.currentTime = requestedTime; }
    catch { inFlight = false; fail(); }
  }
  function tick(now) {
    raf = 0;
    if (reduced.matches || failed || document.hidden) return;
    progress = clamp((scrollY - start) / travel);
    // The last 12% of the short runner holds the last frame before section exit.
    const target = clamp(progress / .88);
    const dt = previousTick ? Math.min(64, now - previousTick) : 16.67;
    previousTick = now;
    eased = target === 0 || target === 1 ? target : eased + (target - eased) * (1 - Math.exp(-dt / 55));
    if (Math.abs(target - eased) < .001) eased = target;
    desired = Math.round(eased * (frameCount - 1)) / fps;
    if (desired < lastTime - epsilon) {
      root.dataset.finalFrame = 'false';
      if (frameCallback) video.cancelVideoFrameCallback?.(frameCallback);
      frameCallback = 0;
    }
    // Media callbacks report presentation only. CSS sticky always ends at the
    // section boundary, including when a mobile decoder never reports a frame.
    root.style.setProperty('--hero-progress', progress.toFixed(5));
    root.dataset.targetFrame = String(Math.round(desired * fps) + 1);
    seek();
    if (Math.abs(target - eased) > .001) schedule();
  }
  function fail() {
    failed = true;
    ready = false;
    root.classList.remove('is-scroll-ready', 'has-native-frame');
    root.dataset.renderState = 'fallback';
  }
  video.addEventListener('seeked', () => {
    inFlight = false;
    presentedTime = requestedTime;
    root.dataset.frame = String(Math.round(presentedTime * fps) + 1);
    root.classList.add('has-native-frame');
    if (presentedTime >= lastTime - epsilon && !video.requestVideoFrameCallback) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (desired >= lastTime - epsilon) markFinalFrame();
      }));
    }
    schedule();
  });
  video.addEventListener('loadeddata', () => {
    if (reduced.matches || failed) return;
    ready = true;
    presentedTime = video.currentTime;
    root.dataset.frame = String(Math.round(presentedTime * fps) + 1);
    root.dataset.renderState = 'ready';
    root.classList.add('has-native-frame');
    measure();
  });
  video.addEventListener('error', fail);
  video.addEventListener('canplay', schedule);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  document.addEventListener('visibilitychange', () => { previousTick = 0; measure(); });
  function configure() {
    video.pause();
    ready = false;
    previousTick = 0;
    if (frameCallback) video.cancelVideoFrameCallback?.(frameCallback);
    frameCallback = 0;
    inFlight = false;
    root.dataset.finalFrame = 'false';
    presentedTime = requestedTime = desired = eased = 0;
    if (reduced.matches) {
      ready = false;
      root.classList.remove('is-scroll-ready', 'has-native-frame');
      video.removeAttribute('src');
      video.load();
      root.dataset.renderState = 'reduced-motion';
    } else {
      failed = false;
      root.classList.add('is-scroll-ready');
      root.dataset.renderState = 'loading';
      video.src = video.dataset.src;
      video.load();
      measure();
    }
  }
  reduced.addEventListener('change', configure);
  // Some iOS versions require one user gesture to initialize their video decoder.
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios) root.addEventListener('pointerdown', () => {
    if (reduced.matches || failed) return;
    const result = video.play();
    result?.then(() => { video.pause(); schedule(); }).catch(() => {});
  }, { once: true, passive: true });
  configure();
}
