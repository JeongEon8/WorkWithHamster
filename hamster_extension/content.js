(() => {
  // ── 이미 삽입된 경우 중복 방지 ──────────────────────────
  if (document.getElementById("hamster-overlay-container")) return;

  // ── 상태 ────────────────────────────────────────────────
  const STATE_RUNNING = "running";
  const STATE_SLOWING = "slowing";
  const STATE_IDLE    = "idle";

  const SLOW_DELAY  = 2000;  // ms
  const IDLE_DELAY  = 6000;  // ms

  // 프레임 이미지 경로 (익스텐션 내부)
  const FRAMES = {
    [STATE_RUNNING]: [
      chrome.runtime.getURL("images/run1.png"),
      chrome.runtime.getURL("images/run2.png"),
      chrome.runtime.getURL("images/run3.png"),
      chrome.runtime.getURL("images/run4.png"),
    ],
    [STATE_SLOWING]: [
      chrome.runtime.getURL("images/slow.png"),
    ],
    [STATE_IDLE]: [
      chrome.runtime.getURL("images/flat.png"),
    ],
  };

  // 프레임 속도 (ms)
  const FRAME_INTERVAL = {
    [STATE_RUNNING]: 120,
    [STATE_SLOWING]: 300,
    [STATE_IDLE]:    1000,
  };

  // ── DOM 생성 ────────────────────────────────────────────
  const container = document.createElement("div");
  container.id = "hamster-overlay-container";

  const img = document.createElement("img");
  img.src = FRAMES[STATE_IDLE][0];
  img.draggable = false;
  container.appendChild(img);
  document.body.appendChild(container);

  // ── 드래그 이동 ─────────────────────────────────────────
  let dragStartX = 0, dragStartY = 0;
  let elemStartX = 0, elemStartY = 0;
  let isDragging = false;

  container.addEventListener("mousedown", (e) => {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    const rect = container.getBoundingClientRect();
    elemStartX = rect.left;
    elemStartY = rect.top;
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    container.style.left   = (elemStartX + dx) + "px";
    container.style.top    = (elemStartY + dy) + "px";
    container.style.right  = "auto";
    container.style.bottom = "auto";
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });

  // ── 상태 관리 ───────────────────────────────────────────
  let state      = STATE_IDLE;
  let frameIdx   = 0;
  let lastKeyT   = 0;
  let animTimer  = null;

  function getNewState() {
    const delta = Date.now() - lastKeyT;
    if (delta < SLOW_DELAY) return STATE_RUNNING;
    if (delta < IDLE_DELAY) return STATE_SLOWING;
    return STATE_IDLE;
  }

  function scheduleNext() {
    if (animTimer) clearTimeout(animTimer);
    animTimer = setTimeout(tick, FRAME_INTERVAL[state]);
  }

  function tick() {
    const newState = getNewState();

    if (newState !== state) {
      state    = newState;
      frameIdx = 0;
    }

    const frames = FRAMES[state];
    img.src = frames[frameIdx % frames.length];
    frameIdx = (frameIdx + 1) % frames.length;

    scheduleNext();
  }

  // ── 키보드 감지 ─────────────────────────────────────────
  document.addEventListener("keydown", () => {
    lastKeyT = Date.now();
    if (state !== STATE_RUNNING) {
      state    = STATE_RUNNING;
      frameIdx = 0;
    }
  }, true);

  // ── 시작 ────────────────────────────────────────────────
  scheduleNext();
})();
