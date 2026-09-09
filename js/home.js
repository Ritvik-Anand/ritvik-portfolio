/* Creative Space — a draggable 3D sphere of work, a bento-grid gallery
   of every piece, and the case-open overlay shared by both. */

(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DEG = Math.PI / 180;

  function buildHome() {
    const view = document.getElementById("view-home");

    const stage = document.createElement("div");
    stage.className = "sphere-stage";

    const sphere = document.createElement("div");
    sphere.className = "sphere";
    stage.appendChild(sphere);
    view.appendChild(stage);

    document.querySelectorAll(".home-hero-sides").forEach((el) => el.remove());
    document.querySelectorAll(".center-preloader-mark").forEach((el) => el.remove());

    const sideHero = document.createElement("div");
    sideHero.className = "home-hero-sides";
    sideHero.innerHTML = `
      <div class="side-left">
        <span class="clip"><span>Ritvik</span></span>
        <span class="clip"><span>Anand</span></span>
      </div>
      <div class="side-right">
        <span class="clip"><span>Creative</span></span>
        <span class="clip"><span>Director</span></span>
      </div>
    `;
    const isPageReady = document.body.classList.contains("page-ready");
    if (isPageReady) {
      sideHero.classList.add("collapsed", "fade-out");
    }
    document.body.appendChild(sideHero);

    const centerMark = document.createElement("div");
    centerMark.className = "center-preloader-mark";
    if (isPageReady) {
      centerMark.classList.add("fade-out");
    } else {
      setupCenterInitials(centerMark, SITE.person.logoMark || "RV .A");
    }
    document.body.appendChild(centerMark);

    const overlay = document.createElement("div");
    overlay.className = "case-overlay";
    overlay.innerHTML = `
      <div class="veil"></div>
    `;
    document.body.appendChild(overlay);

    const tiles = SITE.tiles.map((t, i) => makeTile(t, i));
    tiles.forEach((t) => sphere.appendChild(t.node));

    layoutSphere(tiles, stage);
    window.addEventListener("resize", debounce(() => layoutSphere(tiles, stage), 150));

    const spin = setupSphereInteraction(stage, sphere, tiles, reduceMotion);
    setupCaseOverlay(tiles, overlay, spin, sphere);

    return { spin };
  }

  function makeTile(data, index) {
    const node = document.createElement("div");
    node.className = "tile";
    node.dataset.case = data.case;
    node.dataset.index = index;
    node.tabIndex = 0;
    node.setAttribute("role", "button");

    window.__assetProgress = window.__assetProgress || { loaded: 0, total: 0 };
    window.__assetProgress.total++;
    const markLoaded = () => window.__assetProgress.loaded++;

    const isVidSrc = data.isVideo || (data.src && data.src.endsWith(".mp4"));

    if (isVidSrc) {
      const vid = document.createElement("video");
      vid.className = "still";
      vid.autoplay = true;
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      vid.src = data.src;
      vid.addEventListener("loadeddata", markLoaded, { once: true });
      vid.addEventListener("error", markLoaded, { once: true });
      node.appendChild(vid);
    } else {
      const img = document.createElement("img");
      img.className = "still";
      img.alt = "";
      img.draggable = false;
      img.addEventListener("load", markLoaded, { once: true });
      img.addEventListener("error", markLoaded, { once: true });
      img.src = data.src;
      node.appendChild(img);
    }

    if (data.loop) {
      const vid = document.createElement("video");
      vid.className = "loop";
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      vid.preload = "none";
      node.appendChild(vid);
      node.addEventListener("pointerenter", () => {
        if (!vid.src) vid.src = data.loop;
        vid.play().catch(() => {});
      });
      node.addEventListener("pointerleave", () => vid.pause());
    }

    const tag = document.createElement("span");
    tag.className = "view-case-tag";
    tag.textContent = "View Case";
    node.appendChild(tag);

    node.addEventListener("click", (e) => {
      e.stopPropagation();
      const tileObj = { node, data, index, ratio: data.ratio || 1.0 };
      if (window.__homeOpenCase) {
        window.__homeOpenCase(tileObj);
      }
    });

    return { node, data, index, ratio: data.ratio || 1.0 };
  }

  // even distribution of N points on a sphere (Fibonacci sphere)
  function fibonacciSphere(n, R) {
    const pts = [];
    const offset = 2 / n;
    const increment = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = i * offset - 1 + offset / 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const phi = i * increment;
      pts.push({ x: Math.cos(phi) * r * R, y: y * R, z: Math.sin(phi) * r * R });
    }
    return pts;
  }

  function layoutSphere(tiles, stage) {
    const vw = stage.clientWidth || window.innerWidth;
    const vh = stage.clientHeight || window.innerHeight;
    const R = clamp(Math.min(vw, vh) * 0.27, 130, 260); // sphere radius
    const baseWidth = clamp(vw * 0.08, 65, 140); // larger image tile sizes

    const pts = fibonacciSphere(tiles.length, R);
    tiles.forEach((t, i) => {
      const sizeMul = i % 5 === 0 ? 1.15 : i % 3 === 0 ? 0.85 : 1.0;
      let w = baseWidth * sizeMul;
      let h = w / t.ratio; // uncropped intrinsic shape
      const TOUCH_MIN = 45;
      if (Math.min(w, h) < TOUCH_MIN) {
        if (w < h) { w = TOUCH_MIN; h = w / t.ratio; }
        else { h = TOUCH_MIN; w = h * t.ratio; }
      }
      t.w = w;
      t.h = h;
      t.base = pts[i];
      t.driftOffset = i * 1.37 + (i % 4) * 0.8;
      t.driftSpeed = 0.0008 + (i % 3) * 0.0004;
      t.node.style.width = w + "px";
      t.node.style.height = h + "px";
      t.node.style.marginLeft = -w / 2 + "px";
      t.node.style.marginTop = -h / 2 + "px";
    });
  }

  // 3x3 matrix rotation around arbitrary 3D axis (Rodrigues formula)
  function rotateMatrix3D(M, ax, ay, az, angle) {
    const len = Math.hypot(ax, ay, az);
    if (len < 1e-6 || Math.abs(angle) < 1e-6) return M;
    ax /= len; ay /= len; az /= len;
    const c = Math.cos(angle), s = Math.sin(angle), t = 1 - c;
    const R = [
      [t * ax * ax + c,      t * ax * ay - s * az,  t * ax * az + s * ay],
      [t * ax * ay + s * az,  t * ay * ay + c,      t * ay * az - s * ax],
      [t * ax * az - s * ay,  t * ay * az + s * ax,  t * az * az + c]
    ];
    const out = [[0,0,0],[0,0,0],[0,0,0]];
    for (let r = 0; r < 3; r++) {
      for (let col = 0; col < 3; col++) {
        out[r][col] = R[r][0] * M[0][col] + R[r][1] * M[1][col] + R[r][2] * M[2][col];
      }
    }
    return out;
  }

  function setupSphereInteraction(stage, sphere, tiles, reduceMotion) {
    const state = {
      matrix: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
      ],
      vAx: 0,
      vAy: 1,
      vAngle: reduceMotion ? 0 : 0.0012,
      dragging: false,
      frozen: false,
      lastX: 0,
      lastY: 0,
      moved: 0,
      autoSpeed: reduceMotion ? 0 : 0.001,
      explodeT: 0,
    };
    let pointerId = null;
    const R = { current: 220 };

    let downX = 0, downY = 0;
    let isCapturing = false;
    let downTileNode = null;

    let downTime = 0;
    stage.addEventListener("dragstart", (e) => e.preventDefault());

    stage.addEventListener("pointerdown", (e) => {
      state.dragging = true;
      state.moved = 0;
      downTime = Date.now();
      downX = e.clientX;
      downY = e.clientY;
      state.lastX = e.clientX;
      state.lastY = e.clientY;
      pointerId = e.pointerId;
      isCapturing = false;
      downTileNode = e.target && e.target.closest ? e.target.closest(".tile") : null;
    });

    stage.addEventListener("pointermove", (e) => {
      if (!state.dragging) return;
      const dx = e.clientX - state.lastX;
      const dy = e.clientY - state.lastY;
      state.lastX = e.clientX;
      state.lastY = e.clientY;

      const totalDist = Math.hypot(e.clientX - downX, e.clientY - downY);
      state.moved = totalDist;

      const isTouch = e.pointerType === "touch" || ("ontouchstart" in window);
      const dragThreshold = isTouch ? 18 : 6;

      if (totalDist > dragThreshold && !isCapturing && pointerId != null) {
        isCapturing = true;
        try { stage.setPointerCapture(pointerId); } catch (err) {}
        stage.classList.add("dragging");
      }

      const dist = Math.hypot(dx, dy);
      if (dist > 0.01 && totalDist > dragThreshold) {
        // Natural trackball: drag down -> front moves down, drag right -> front moves right
        const ax = -dy;
        const ay = dx;
        const angle = dist * 0.0045;
        state.matrix = rotateMatrix3D(state.matrix, ax, ay, 0, angle);
        state.vAx = ax;
        state.vAy = ay;
        state.vAngle = angle;
      }
    });

    function endDrag(e) {
      if (!state.dragging) return;
      const totalMoved = state.moved;
      const duration = Date.now() - downTime;
      state.dragging = false;
      stage.classList.remove("dragging");
      if (isCapturing && pointerId != null) {
        try { stage.releasePointerCapture(pointerId); } catch (err) {}
      }
      isCapturing = false;
      pointerId = null;

      const isTouch = e && (e.pointerType === "touch" || ("ontouchstart" in window));
      const maxMove = isTouch ? 28 : 12;

      // Tap / click detection on pointerup
      if ((totalMoved < maxMove || duration < 300) && e) {
        let clientX = e.clientX;
        let clientY = e.clientY;
        if ((!clientX || !clientY) && e.changedTouches && e.changedTouches[0]) {
          clientX = e.changedTouches[0].clientX;
          clientY = e.changedTouches[0].clientY;
        }
        let hitEl = e.target && e.target.closest ? e.target.closest(".tile") : null;
        if (!hitEl && document.elementFromPoint && clientX && clientY) {
          const ptEl = document.elementFromPoint(clientX, clientY);
          if (ptEl) hitEl = ptEl.closest(".tile");
        }
        const targetNode = hitEl || downTileNode;
        if (targetNode) {
          const tileObj = tiles.find((t) => t.node === targetNode);
          if (tileObj && window.__homeOpenCase) {
            window.__homeOpenCase(tileObj);
          }
        }
      }
    }
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);

    stage.addEventListener(
      "click",
      (e) => {
        const isTouch = e.pointerType === "touch" || ("ontouchstart" in window);
        const maxMove = isTouch ? 28 : 8;
        if (state.moved > maxMove) {
          e.stopPropagation();
          e.preventDefault();
        }
      },
      true
    );

    let startTime = null;
    let ringAngle = 0;
    let lastTime = null;

    function frame(now) {
      const time = now || performance.now();
      if (!startTime) {
        startTime = document.body.classList.contains("page-ready") ? time - 7000 : time;
      }
      if (!lastTime) lastTime = time;
      const elapsed = time - startTime;
      const delta = time - lastTime;
      lastTime = time;

      const idle = window.__activeView && window.__activeView !== "home";

      if (!state.frozen && !idle) {
        // Keyframes matching gionatannese.com 1:1:
        // 0ms - 2000ms: Phase 0 (Text scramble + side text reveal. Image tiles hidden)
        // 2000ms - 3300ms: Phase 1 (10-tile 240px ring reveal & pop-in around center mark)
        // 3300ms - 4100ms: Phase 2 (Fast spin acceleration up to 7.3x speed)
        // 4100ms - 6000ms: Phase 3 (Spiral collapse to center stack + logo fade out + side text slide up out of view)
        // 6000ms+: Phase 4 (3D Fibonacci sphere explosion outward + nav drop down)

        const REVEAL_DELAY = 2000;
        const FAST_SPIN_START = 3300;
        const COLLAPSE_START = 4100;
        const COLLAPSE_DUR = 1250;
        const EXPLODE_START = 6000;
        const EXPLODE_DUR = 1000;

        const isMobile = window.innerWidth <= 640;
        const rBase = isMobile ? 180 : 240;

        // Dynamic ring spin angle matching gionatannese.com:
        // spinSpeedMult ramps from 1.0 to 7.3x during fast spin phase (3300ms - 5350ms)
        let spinSpeedMult = 1.0;
        if (elapsed > FAST_SPIN_START && elapsed < COLLAPSE_START + COLLAPSE_DUR) {
          const rampT = clamp((elapsed - FAST_SPIN_START) / 1000, 0, 1);
          const rampEase = rampT * rampT; // power2.in ease
          spinSpeedMult = 1.0 + (7.3 - 1.0) * rampEase;
        }
        const deltaFrames = delta / 16.666;
        const baseSpeed = 0.5 * (Math.PI / 180); // 0.5 deg/frame
        ringAngle += baseSpeed * spinSpeedMult * deltaFrames;

        const centerMark = document.querySelector(".center-preloader-mark");
        const sideHero = document.querySelector(".home-hero-sides");

        // Side hero text initial reveal at 500ms
        if (elapsed > 500 && sideHero && !sideHero.classList.contains("revealed") && !sideHero.classList.contains("collapsed")) {
          sideHero.classList.add("revealed");
        }

        if (elapsed < REVEAL_DELAY) {
          // --- PHASE 0: INITIAL TEXT ANIMATION PHASE ---
          // Center logo text + side text. Image tiles remain hidden.
          tiles.forEach((t) => {
            t.node.style.opacity = "0";
            t.node.style.transform = `translate3d(0px, 0px, 0px) scale(0.01)`;
          });

        } else if (elapsed < COLLAPSE_START) {
          // --- PHASE 1 & 2: RING POP-IN & FAST SPIN ---
          tiles.forEach((t, i) => {
            if (i >= 10) {
              t.node.style.opacity = "0";
              t.node.style.transform = `translate3d(0px, 0px, 0px) scale(0.01)`;
              return;
            }

            const popDelay = REVEAL_DELAY + i * 100;
            const tPop = clamp((elapsed - popDelay) / 1000, 0, 1);
            // back.out(1.7) ease for tile pop-in
            const easePop = tPop === 1 ? 1 : 1 + 2.7 * Math.pow(tPop - 1, 3) + 1.7 * Math.pow(tPop - 1, 2);
            const opacity = clamp((elapsed - popDelay) / 600, 0, 1);

            const startAngle = (-90 + i * 36) * (Math.PI / 180);
            const currentAngle = startAngle + ringAngle;
            const px = Math.cos(currentAngle) * rBase;
            const py = Math.sin(currentAngle) * rBase;
            const pz = 0;
            const scale = 0.85 * easePop;

            t.node.style.transform = `translate3d(${px}px, ${py}px, ${pz}px) scale(${scale})`;
            t.node.style.opacity = String(opacity);
            t.node.style.zIndex = String(i);
          });

        } else if (elapsed < EXPLODE_START) {
          // --- PHASE 3: EXACT GIONATANNESE.COM SPIRAL COLLAPSE TO CENTER STACK ---
          if (centerMark) {
            centerMark.classList.add("fade-out");
          }

          if (sideHero && !sideHero.classList.contains("collapsed")) {
            sideHero.classList.remove("revealed");
            sideHero.classList.add("collapsed");
          }

          tiles.forEach((t, i) => {
            if (i >= 10) {
              t.node.style.opacity = "0";
              t.node.style.transform = `translate3d(0px, 0px, 0px) scale(0.01)`;
              return;
            }

            const colDelay = COLLAPSE_START + i * 50;
            const tCol = clamp((elapsed - colDelay) / COLLAPSE_DUR, 0, 1);
            // power2.inOut ease matching gionatannese.com exactly:
            const easeCol = tCol < 0.5 ? 2 * tCol * tCol : 1 - Math.pow(-2 * tCol + 2, 2) / 2;

            const startAngle = (-90 + i * 36) * (Math.PI / 180);
            const currentAngle = startAngle + ringAngle;
            const currentRadius = rBase * (1 - easeCol);

            // Exact gionatannese.com math: position = (1 - easeCol) * ringPosition
            const px = Math.cos(currentAngle) * currentRadius;
            const py = Math.sin(currentAngle) * currentRadius;
            const pz = i * 1.5 * easeCol;
            const scale = lerp(0.85, 0.2, easeCol);
            const opacity = lerp(1, 0.4, easeCol);

            t.node.style.transform = `translate3d(${px}px, ${py}px, ${pz}px) scale(${scale})`;
            t.node.style.opacity = String(opacity);
            t.node.style.zIndex = String(20 + i);
          });

        } else {
          // --- PHASE 3: EXPLOSION OUTWARD TO 3D SPHERE ---
          if (!document.body.classList.contains("page-ready")) {
            document.body.classList.add("page-ready");
            try { sessionStorage.setItem("hasVisited", "true"); } catch (err) {}
          }

          if (centerMark) {
            centerMark.classList.add("fade-out");
          }

          if (sideHero) {
            sideHero.classList.add("collapsed");
            sideHero.classList.add("fade-out");
          }

          const explodeT = clamp((elapsed - EXPLODE_START) / EXPLODE_DUR, 0, 1);
          // power3.out ease: 1 - (1 - t)^3
          const easeExplode = 1 - Math.pow(1 - explodeT, 3);
          const overshoot = 1 + 0.1 * Math.sin(Math.PI * explodeT);

          if (!state.dragging) {
            if (state.vAngle > 0.00015) {
              state.matrix = rotateMatrix3D(state.matrix, state.vAx, state.vAy, 0, state.vAngle);
              state.vAngle *= 0.95;
            } else if (state.autoSpeed > 0) {
              state.matrix = rotateMatrix3D(state.matrix, 0.2, 0.9, 0, state.autoSpeed);
            }
          }

          const M = state.matrix;

          tiles.forEach((t, i) => {
            if (t.selected || t.node.classList.contains("dim")) return;
            const b = t.base;

            // Target position on rotated 3D sphere
            const targetPx = M[0][0] * b.x + M[0][1] * b.y + M[0][2] * b.z;
            const targetPy = M[1][0] * b.x + M[1][1] * b.y + M[1][2] * b.z;
            const targetPz = M[2][0] * b.x + M[2][1] * b.y + M[2][2] * b.z;

            // Start position in center collapsed stack
            const startPx = 0;
            const startPy = 0;
            const startPz = (i % 10) * 1.5;

            const px = lerp(startPx, targetPx, easeExplode) * overshoot;
            const py = lerp(startPy, targetPy, easeExplode) * overshoot;
            const pz = lerp(startPz, targetPz, easeExplode);

            const norm = clamp((pz + R.current) / (R.current * 2), 0, 1);
            const targetScale = 0.64 + norm * 0.46;
            const scale = lerp(0.2, targetScale, easeExplode);
            const opacity = lerp(0.4, 0.35 + norm * 0.65, easeExplode);

            const floatY = Math.sin(time * t.driftSpeed + t.driftOffset) * 8 * easeExplode;
            const floatX = Math.cos(time * t.driftSpeed * 0.75 + t.driftOffset) * 6 * easeExplode;

            t.node.style.transform = `translate3d(${px + floatX}px, ${py + floatY}px, ${pz}px) scale(${scale})`;
            t.node.style.opacity = String(opacity);
            t.node.style.zIndex = String(Math.round(norm * 100));
          });
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // keep R in sync with layout for depth mapping
    const ro = new ResizeObserver(() => {
      R.current = clamp(Math.min(stage.clientWidth, stage.clientHeight) * 0.27, 130, 260);
    });
    ro.observe(stage);
    R.current = clamp(Math.min(stage.clientWidth, stage.clientHeight) * 0.27, 130, 260);

    return {
      freeze() { state.frozen = true; },
      unfreeze() { state.frozen = false; },
    };
  }

  function setupCaseOverlay(tiles, overlay, spin, sphere) {
    let openTile = null;

    function openCase(tile, fromRect) {
      if (openTile === tile) {
        closeCase();
        return;
      }
      if (openTile) closeCase(true);

      const rect = fromRect || tile.node.getBoundingClientRect();
      tile.openRect = rect;

      openTile = tile;
      tile.selected = true;
      tiles.forEach((t) => {
        if (t !== tile) t.node.classList.add("dim");
      });
      spin.freeze();

      document.body.appendChild(tile.node);

      tile.node.style.margin = "0";
      tile.node.style.transform = "none";
      tile.node.style.opacity = "1";
      tile.node.style.position = "fixed";
      tile.node.style.left = rect.left + "px";
      tile.node.style.top = rect.top + "px";
      tile.node.style.width = rect.width + "px";
      tile.node.style.height = rect.height + "px";
      tile.node.style.zIndex = "250";
      tile.node.classList.add("selected");

      void tile.node.offsetWidth;

      let targetH = Math.min(window.innerHeight * 0.70, 580);
      let targetW = targetH * tile.ratio;
      if (targetW > window.innerWidth * 0.88) {
        targetW = window.innerWidth * 0.88;
        targetH = targetW / tile.ratio;
      }
      const left = (window.innerWidth - targetW) / 2;
      const top = (window.innerHeight - targetH) / 2;

      tile.node.style.transition =
        "left .5s var(--ease), top .5s var(--ease), width .5s var(--ease), height .5s var(--ease)";
      tile.node.style.left = left + "px";
      tile.node.style.top = top + "px";
      tile.node.style.width = targetW + "px";
      tile.node.style.height = targetH + "px";

      overlay.classList.add("open");
      if (typeof setCursorLabel === "function") {
        setCursorLabel("Close");
      }
    }

    function closeCase(immediate) {
      if (!openTile) return;
      const tile = openTile;
      openTile = null;
      tile.selected = false;

      const back = tile.openRect || { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 100, height: 100 };
      tile.node.style.transition = immediate ? "none" : tile.node.style.transition;
      tile.node.style.left = back.left + "px";
      tile.node.style.top = back.top + "px";
      tile.node.style.width = back.width + "px";
      tile.node.style.height = back.height + "px";

      overlay.classList.remove("open");
      tiles.forEach((t) => t.node.classList.remove("dim"));
      if (typeof setCursorLabel === "function") {
        setCursorLabel("");
      }

      const settle = () => {
        tile.node.style.position = "";
        tile.node.style.left = "";
        tile.node.style.top = "";
        tile.node.style.width = tile.w ? tile.w + "px" : "";
        tile.node.style.height = tile.h ? tile.h + "px" : "";
        tile.node.style.margin = tile.w ? -tile.w / 2 + "px" : "";
        tile.node.style.marginTop = tile.h ? -tile.h / 2 + "px" : "";
        tile.node.style.transition = "";
        tile.node.style.zIndex = "";
        tile.node.style.transform = "";
        tile.node.style.opacity = "";
        tile.node.classList.remove("selected");
        sphere.appendChild(tile.node);
        spin.unfreeze();
      };
      if (immediate) settle();
      else setTimeout(settle, 520);
    }

    tiles.forEach((tile) => {
      tile.node.addEventListener("click", (e) => {
        e.stopPropagation();
        openCase(tile);
      });
      tile.node.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openCase(tile);
        }
      });
    });

    document.addEventListener("click", (e) => {
      if (!openTile) return;
      closeCase();
    });

    const veil = overlay.querySelector(".veil");
    if (veil) {
      veil.addEventListener("click", (e) => {
        e.stopPropagation();
        closeCase();
      });
    }

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeCase();
    });

    window.__homeOpenCase = openCase;
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function debounce(fn, ms) {
    let id;
    return (...args) => {
      clearTimeout(id);
      id = setTimeout(() => fn(...args), ms);
    };
  }

  function setupCenterInitials(centerMark, targetText) {
    const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789./&";
    const target = (targetText || "RV .A").split("");

    centerMark.innerHTML = target
      .map((ch, i) => `<span class="char-span char-${i}">${ch === " " ? "&nbsp;" : ch}</span>`)
      .join("");

    const charSpans = centerMark.querySelectorAll(".char-span");
    const lockTimes = [300, 600, 800, 1050, 1350]; // ms when each character locks into place
    const locked = target.map(() => false);
    let startTime = null;
    let lastScramble = 0;

    function tick(now) {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const shouldScramble = now - lastScramble > 40;
      if (shouldScramble) lastScramble = now;

      charSpans.forEach((span, i) => {
        if (elapsed >= (lockTimes[i] || 1200)) {
          if (!locked[i]) {
            locked[i] = true;
            span.textContent = target[i] === " " ? "\u00A0" : target[i];
            span.classList.add("locked");
          }
        } else if (shouldScramble) {
          if (target[i] === " ") {
            span.textContent = "\u00A0";
          } else {
            const randChar = glyphs[Math.floor(Math.random() * glyphs.length)];
            span.textContent = randChar;
          }
        }
      });

      if (!locked.every(Boolean)) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }

  window.__initHome = buildHome;
})();
