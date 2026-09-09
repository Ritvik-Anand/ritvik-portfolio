/* Shared chrome: logo, nav, sound toggle, cursor label, loader.
   Call initChrome({ active, onNav, onLoaded }) from each page.
   - active: starting nav key ("home" | "projects" | "about")
   - onNav(key, ev): if provided, nav clicks call ev.preventDefault() and
     this instead of following the href — used on index.html so the three
     sections slide in place. Omit it (e.g. on project.html) to fall back
     to a normal navigation via the link's href.
   Returns { setActive(key) } so the caller can keep the nav in sync with
   whatever is actually showing (hash changes, swipes, etc). */

function initChrome(opts) {
  opts = opts || {};
  const root = document.body;
  let active = opts.active || "home";

  // logo
  const logo = document.createElement("a");
  logo.className = "gnd-logo";
  logo.href = "index.html";
  logo.textContent = SITE.person.logoMark;
  root.appendChild(logo);

  // nav
  const nav = document.createElement("nav");
  nav.className = "top-nav";
  const navLinks = {};
  SITE.nav.forEach((item, i) => {
    const a = document.createElement("a");
    a.href = item.href;
    a.dataset.key = item.key;
    a.innerHTML = `<span class="label">${item.label}</span><sup class="num">${i + 1}</sup>`;
    navLinks[item.key] = a;
    if (opts.onNav) {
      a.addEventListener("click", (ev) => {
        ev.preventDefault();
        opts.onNav(item.key, ev);
      });
    }
    nav.appendChild(a);
  });

  function paintNav() {
    SITE.nav.forEach((item) => {
      const a = navLinks[item.key];
      if (item.key === active) {
        a.classList.add("active");
      } else {
        a.classList.remove("active");
      }
    });
  }
  paintNav();
  root.appendChild(nav);

  // floating ultra-minimalist Apple Music player
  initMusicPlayer();

  // cursor label (desktop / hover-capable only)
  const cursor = document.createElement("div");
  cursor.className = "cursor-label";
  root.appendChild(cursor);
  window.__cursorLabel = cursor;
  window.addEventListener("pointermove", (e) => {
    cursor.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 14}px)`;
  });

  // loader
  if (opts.active !== "home") {
    document.body.classList.add("page-ready");
    document.body.classList.add("not-home");
    if (opts.onLoaded) opts.onLoaded();
  } else {
    document.body.classList.remove("page-ready");
    document.body.classList.remove("not-home");
    const loader = document.createElement("div");
    loader.className = "loader active";
    loader.innerHTML = `
      <div class="loader-count-wrap">
        <span class="loader-count-num">001</span>
      </div>
    `;
    root.appendChild(loader);

    const countEl = loader.querySelector(".loader-count-num");
    let pct = 0;
    const started = performance.now();
    const targetTime = 2100;

    function tick() {
      const elapsed = performance.now() - started;
      const timeFloor = Math.min(100, (elapsed / targetTime) * 100);
      pct = Math.round(timeFloor);
      countEl.textContent = String(pct).padStart(3, "0");

      if (elapsed < 2300) {
        requestAnimationFrame(tick);
      } else {
        countEl.textContent = "100";
        loader.classList.remove("active");
        loader.classList.add("hidden");
        document.body.classList.add("page-ready");
        setTimeout(() => loader.remove(), 350);
        if (opts.onLoaded) opts.onLoaded();
      }
    }
    requestAnimationFrame(tick);
  }

  // footer index — fixed, bottom centre, present on every page
  const foot = document.createElement("div");
  foot.className = "foot-index";
  foot.textContent = "001";
  root.appendChild(foot);

  return {
    setActive(key) {
      active = key;
      paintNav();
    },
  };
}

function setCursorLabel(text) {
  const cursor = window.__cursorLabel;
  if (!cursor) return;
  if (!text) {
    cursor.style.opacity = "0";
    return;
  }
  cursor.textContent = text;
  cursor.style.opacity = "1";
}

function attachLiquidGlassShader(canvas) {
  if (!canvas) return;
  try {
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return;

    const vsSource = `
      attribute vec2 position;
      varying vec2 v_uv;
      void main() {
        v_uv = (position + 1.0) * 0.5;
        v_uv.y = 1.0 - v_uv.y;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision mediump float;
      varying vec2 v_uv;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform float u_time;

      float sdRoundBox(vec2 p, vec2 b, float r) {
        vec2 q = abs(p) - b + r;
        return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
      }

      void main() {
        vec2 st = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
        vec2 mouse = (u_mouse - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
        
        float distToMouse = length(st - mouse);
        float ripple = sin(distToMouse * 22.0 - u_time * 4.5) * exp(-distToMouse * 3.5) * 0.035;

        vec2 aspect = u_resolution / min(u_resolution.x, u_resolution.y);
        vec2 boxSize = aspect * 0.44;
        float d = sdRoundBox(st, boxSize, 0.38);

        float eps = 0.005;
        float dx = sdRoundBox(st + vec2(eps, 0.0), boxSize, 0.38) - d;
        float dy = sdRoundBox(st + vec2(0.0, eps), boxSize, 0.38) - d;
        vec3 normal = normalize(vec3(dx, dy, eps * 2.0));

        float refractScale = smoothstep(0.05, -0.05, d) * 0.12 + ripple;
        vec3 lightDir = normalize(vec3(-0.5, 0.8, 1.0));
        float spec = pow(max(dot(normal, lightDir), 0.0), 28.0) * 1.5;
        float fresnel = pow(1.0 - max(0.0, normal.z), 2.5) * 0.75;

        vec3 glassBase = vec3(0.08, 0.08, 0.12);
        vec3 redRim = vec3(1.0, 0.22, 0.38) * fresnel;
        vec3 cyanRim = vec3(0.0, 0.85, 1.0) * (1.0 - normal.x) * fresnel * 0.45;

        vec3 finalColor = glassBase + vec3(spec) + redRim + cyanRim;
        float alpha = smoothstep(0.01, -0.01, d) * 0.65;

        gl_FragColor = vec4(finalColor, alpha);
      }
    `;

    function createShader(gl, type, source) {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, source);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        gl.deleteShader(s);
        return null;
      }
      return s;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(prog, "position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_resolution");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");
    const uTime = gl.getUniformLocation(prog, "u_time");

    let mouseX = 0, mouseY = 0;
    window.addEventListener("pointermove", (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = rect.height - (e.clientY - rect.top);
    });

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth * dpr;
      const h = canvas.clientHeight * dpr;
      if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    function render(time) {
      try {
        resize();
        if (canvas.width > 0 && canvas.height > 0 && uRes && uMouse && uTime) {
          gl.uniform2f(uRes, canvas.width, canvas.height);
          gl.uniform2f(uMouse, mouseX, mouseY);
          gl.uniform1f(uTime, time * 0.001);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
      } catch (err) {}
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  } catch (e) {}
}

const SVG_COVER_RAW = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f2c09d"/><stop offset="40%" stop-color="#ff833f"/><stop offset="80%" stop-color="#b24900"/><stop offset="100%" stop-color="#3f1300"/></linearGradient><linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#ffc8a8"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><circle cx="200" cy="175" r="95" fill="none" stroke="url(#glow)" stroke-width="3" opacity="0.7"/><circle cx="200" cy="175" r="70" fill="rgba(255,255,255,0.12)"/><path d="M200 125v90.55c-4.5-2.55-9.8-4.05-15.5-4.05-17.6 0-32 14.4-32 32s14.4 32 32 32 32-14.4 32-32V155h35v-30h-51.5z" fill="#ffffff"/><text x="200" y="318" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="24" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="3">RV .A</text><text x="200" y="348" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="12" font-weight="700" fill="rgba(255,255,255,0.85)" text-anchor="middle" letter-spacing="1.5">FADE OUT ON ELM • APPLE MUSIC</text></svg>`;
const APPLE_MUSIC_COVER = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SVG_COVER_RAW);

const PLAYLIST = [
  {
    title: "Stacks from All Sides",
    artist: "SKAI ISYOURGOD",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/95/32/3b/95323b31-1bdd-9bcc-8a6b-329a8d97ec03/749085368376.jpg/400x400bb.jpg",
    duration: "2:53",
    seconds: 173,
    audioSrc: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/66/22/95/66229552-ee2b-daa2-f0e9-631e04b1e738/mzaf_1239092761064522453.plus.aac.p.m4a",
  },
  {
    title: "FADE OUT ON ELM",
    artist: "Heavy Psychadelics",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/c0/07/84/c00784fc-2265-67af-818e-ee9823f4d604/612891031935.jpg/400x400bb.jpg",
    duration: "3:41",
    seconds: 221,
    audioSrc: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/eb/e6/13/ebe6131b-1ebe-11b4-5af4-fcbd20dccffd/mzaf_13671986323041336934.plus.aac.p.m4a",
  },
  {
    title: "ON DISPLAY",
    artist: "Heavy Psychadelics",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/98/8e/95/988e9557-656b-fce4-6b6c-a86ba3d3ebfa/663918912959.jpg/400x400bb.jpg",
    duration: "4:07",
    seconds: 247,
    audioSrc: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/d9/a7/e4/d9a7e4bd-31e4-17a4-7af1-618a7c9c537d/mzaf_6083303875439684787.plus.aac.p.m4a",
  },
  {
    title: "Lost in Yesterday",
    artist: "Tame Impala",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/65/e3/e7/65e3e740-b69f-f5cb-f2e6-7dedb5265ac9/19UMGIM96748.rgb.jpg/400x400bb.jpg",
    duration: "4:09",
    seconds: 249,
    audioSrc: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/34/79/40/34794034-6f06-1e3b-d7e4-fdffed149340/mzaf_7420643418625855928.plus.aac.p.m4a",
  },
  {
    title: "E85",
    artist: "Don Toliver",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/e8/e5/c6/e8e5c690-a958-622e-eb62-0dce6059300e/075679599360.jpg/400x400bb.jpg",
    duration: "2:33",
    seconds: 153,
    audioSrc: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/17/68/e1/1768e109-c034-115d-affc-01a97c427142/mzaf_4718121937950048317.plus.aac.p.m4a",
  },
  {
    title: "Phonk Thoma Thoma",
    artist: "Mc Gw & DJ REMIZEVOLUTION",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/dc/d5/2c/dcd52c04-358c-e1ac-994d-268e65a2050c/0.jpg/400x400bb.jpg",
    duration: "1:36",
    seconds: 96,
    audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    title: "Y Qué Fue?",
    artist: "Don Miguelo",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/88/9d/a6/889da6ac-8275-8194-da2a-cbf53f555e8f/755773116723.png/400x400bb.jpg",
    duration: "2:43",
    seconds: 163,
    audioSrc: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/c7/ea/58/c7ea58d9-4a69-373c-a6bc-cc584d24da47/mzaf_17003783755037898911.plus.aac.p.m4a",
  },
  {
    title: "BANDIT",
    artist: "Don Toliver",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/22/3c/5d/223c5d96-501e-040e-a34d-0608e6e5c4ff/075679638434.jpg/400x400bb.jpg",
    duration: "2:27",
    seconds: 147,
    audioSrc: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/a0/32/00/a0320028-02bd-feb1-644d-2937907c41b0/mzaf_1316463978077053807.plus.aac.p.m4a",
  },
];

function initMusicPlayer() {
  if (document.getElementById("music-player-widget")) return;

  try {
    const widget = document.createElement("div");
    widget.className = "music-player-widget";
    widget.id = "music-player-widget";

    widget.innerHTML = `
      <div class="music-pill" id="music-pill">
        <span class="music-note-icon">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        </span>
        <span class="pill-label">RV .A Playlist</span>
        <div class="sound-wave" id="pill-sound-wave">
          <span></span><span></span><span></span>
        </div>
      </div>

      <div class="music-card" id="music-card-wrapper">
        <div class="music-card-header">
          <button class="music-card-close" id="music-card-close" aria-label="Close Player">✕</button>
        </div>

        <div class="music-card-body">
          <div class="glass-album-wrap">
            <img src="" alt="Album Cover" class="glass-album-img" id="player-album-img" />
          </div>
          <div class="glass-track-info">
            <div class="track-meta">
              <h4 class="track-name" id="player-track-name"></h4>
              <p class="track-artist" id="player-track-artist"></p>
            </div>
            <div class="wave-visualizer paused" id="player-visualizer">
              <span></span><span></span><span></span><span></span>
            </div>
          </div>
          <div class="glass-progress-wrap">
            <div class="progress-bar-bg" id="progress-bar-bg">
              <div class="progress-bar-fill" id="progress-bar-fill" style="width: 0%;"></div>
            </div>
            <div class="progress-time">
              <span id="time-current">0:00</span>
              <span id="time-total">0:00</span>
            </div>
          </div>
          <div class="glass-controls">
            <button class="ctrl-btn prev" id="btn-prev" aria-label="Shuffle Track"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button>
            <button class="ctrl-btn play" id="btn-play" aria-label="Play/Pause">
              <svg class="icon-play" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              <svg class="icon-pause hidden" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            </button>
            <button class="ctrl-btn next" id="btn-next" aria-label="Shuffle Track"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button>
          </div>
          <a href="https://music.apple.com/in/playlist/rv-a/pl.u-WabZ6M3CelgzGVg" target="_blank" rel="noopener noreferrer" class="apple-music-link">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.64c.67-.82 1.13-1.96.99-3.14-1.02.04-2.26.68-2.98 1.53-.65.75-1.22 1.92-1.06 3.08 1.14.09 2.38-.63 3.05-1.47z"/>
            </svg>
            <span>Apple Music</span>
          </a>
        </div>
      </div>
    `;

    document.body.appendChild(widget);

    const pill = widget.querySelector("#music-pill");
    const closeBtn = widget.querySelector("#music-card-close");
    const albumImg = widget.querySelector("#player-album-img");
    const trackName = widget.querySelector("#player-track-name");
    const trackArtist = widget.querySelector("#player-track-artist");
    const visualizer = widget.querySelector("#player-visualizer");
    const progressBarBg = widget.querySelector("#progress-bar-bg");
    const progressFill = widget.querySelector("#progress-bar-fill");
    const timeCurrent = widget.querySelector("#time-current");
    const timeTotal = widget.querySelector("#time-total");
    const btnPlay = widget.querySelector("#btn-play");
    const btnPrev = widget.querySelector("#btn-prev");
    const btnNext = widget.querySelector("#btn-next");
    const iconPlay = btnPlay.querySelector(".icon-play");
    const iconPause = btnPlay.querySelector(".icon-pause");

    pill.addEventListener("click", (e) => {
      e.stopPropagation();
      widget.classList.add("expanded");
      saveMusicState();
    });
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      widget.classList.remove("expanded");
      saveMusicState();
    });
    document.addEventListener("pointerdown", (e) => {
      if (widget.classList.contains("expanded")) {
        if (!widget.contains(e.target)) {
          widget.classList.remove("expanded");
          saveMusicState();
        }
      }
    });

    let currentIdx = Math.floor(Math.random() * PLAYLIST.length);
    let isPlaying = false;
    let audioEl = new Audio();
    let synthTimer = null;
    let synthTime = 0;

    // Web Audio Procedural Synth Engine
    let synthCtx = null;
    let synthOsc = null;
    let synthGain = null;

    function saveMusicState() {
      try {
        sessionStorage.setItem("rv_music_track_idx", String(currentIdx));
        sessionStorage.setItem("rv_music_time", String(audioEl.currentTime || synthTime || 0));
        sessionStorage.setItem("rv_music_is_playing", isPlaying ? "true" : "false");
        sessionStorage.setItem("rv_music_expanded", widget.classList.contains("expanded") ? "true" : "false");
      } catch (e) {}
    }

    function getRandomShuffleIndex() {
      if (!PLAYLIST || PLAYLIST.length <= 1) return 0;
      let nextIdx;
      do {
        nextIdx = Math.floor(Math.random() * PLAYLIST.length);
      } while (nextIdx === currentIdx);
      return nextIdx;
    }

    function startSynth() {
      try {
        if (!synthCtx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) synthCtx = new AudioCtx();
        }
        if (synthCtx && synthCtx.state === "suspended") synthCtx.resume();
        if (!synthCtx) return;

        if (synthOsc) {
          try { synthOsc.stop(); } catch (e) {}
        }

        const now = synthCtx.currentTime;
        synthOsc = synthCtx.createOscillator();
        synthGain = synthCtx.createGain();

        const freqs = [220, 277.18, 329.63, 440];
        synthOsc.type = "sine";
        synthOsc.frequency.setValueAtTime(freqs[currentIdx % freqs.length], now);

        synthGain.gain.setValueAtTime(0.001, now);
        synthGain.gain.exponentialRampToValueAtTime(0.12, now + 0.1);

        synthOsc.connect(synthGain);
        synthGain.connect(synthCtx.destination);
        synthOsc.start(now);
      } catch (e) {}
    }

    function stopSynth() {
      if (synthGain && synthCtx) {
        try {
          synthGain.gain.exponentialRampToValueAtTime(0.0001, synthCtx.currentTime + 0.1);
          setTimeout(() => {
            if (synthOsc) { try { synthOsc.stop(); } catch (e) {} synthOsc = null; }
          }, 120);
        } catch (e) {}
      }
    }

    function loadTrack(idx) {
      if (!PLAYLIST || !PLAYLIST.length) return;
      currentIdx = (idx + PLAYLIST.length) % PLAYLIST.length;
      const t = PLAYLIST[currentIdx];
      if (albumImg) albumImg.src = t.cover;
      if (trackName) trackName.textContent = t.title;
      if (trackArtist) trackArtist.textContent = t.artist;
      if (timeTotal) timeTotal.textContent = t.duration;

      synthTime = 0;
      audioEl.pause();
      audioEl.src = t.audioSrc || "";
      audioEl.currentTime = 0;
      updateProgress();
      saveMusicState();
    }

    function updateProgress() {
      if (!PLAYLIST || !PLAYLIST[currentIdx]) return;
      let cur = audioEl.currentTime || synthTime || 0;
      let dur = audioEl.duration || PLAYLIST[currentIdx].seconds || 1;
      if (isNaN(dur) || dur <= 0) dur = PLAYLIST[currentIdx].seconds || 1;

      const pct = Math.min(100, Math.max(0, (cur / dur) * 100));
      if (progressFill) progressFill.style.width = pct + "%";
      const mins = Math.floor(cur / 60);
      const secs = String(Math.floor(cur % 60)).padStart(2, "0");
      if (timeCurrent) timeCurrent.textContent = `${mins}:${secs}`;
    }

    if (progressBarBg) {
      progressBarBg.style.cursor = "pointer";
      progressBarBg.addEventListener("click", (e) => {
        e.stopPropagation();
        const rect = progressBarBg.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const dur = audioEl.duration || PLAYLIST[currentIdx].seconds || 1;
        if (audioEl.duration && !isNaN(audioEl.duration)) {
          audioEl.currentTime = pct * dur;
        } else {
          synthTime = pct * dur;
        }
        updateProgress();
        saveMusicState();
      });
    }

    audioEl.addEventListener("timeupdate", updateProgress);
    audioEl.addEventListener("ended", () => {
      loadTrack(getRandomShuffleIndex());
      if (isPlaying) playAudio();
    });

    function playAudio() {
      isPlaying = true;
      iconPlay.classList.add("hidden");
      iconPause.classList.remove("hidden");
      visualizer.classList.remove("paused");

      if (synthTimer) clearInterval(synthTimer);
      synthTimer = setInterval(() => {
        if (!audioEl.currentTime || audioEl.paused) {
          synthTime += 1;
          if (synthTime >= PLAYLIST[currentIdx].seconds) {
            loadTrack(getRandomShuffleIndex());
          }
        }
        updateProgress();
      }, 1000);

      saveMusicState();

      const promise = audioEl.play();
      if (promise !== undefined) {
        promise.catch((err) => {
          console.log("HTML5 audio stream notice (using Web Audio synth):", err);
          startSynth();
        });
      }
    }

    function pauseAudio() {
      isPlaying = false;
      audioEl.pause();
      stopSynth();
      if (synthTimer) clearInterval(synthTimer);
      iconPlay.classList.remove("hidden");
      iconPause.classList.add("hidden");
      visualizer.classList.add("paused");
      saveMusicState();
    }

    function togglePlay() {
      if (isPlaying) {
        pauseAudio();
      } else {
        playAudio();
      }
    }

    btnPlay.addEventListener("click", (e) => { e.stopPropagation(); togglePlay(); });
    btnPrev.addEventListener("click", (e) => {
      e.stopPropagation();
      const wasPlaying = isPlaying;
      loadTrack(getRandomShuffleIndex());
      if (wasPlaying) playAudio();
    });
    btnNext.addEventListener("click", (e) => {
      e.stopPropagation();
      const wasPlaying = isPlaying;
      loadTrack(getRandomShuffleIndex());
      if (wasPlaying) playAudio();
    });

    window.addEventListener("beforeunload", saveMusicState);
    window.addEventListener("pagehide", saveMusicState);

    // Restore saved playback state across page transitions
    let savedPlaying = false;
    let savedTime = 0;
    try {
      const sPlaying = sessionStorage.getItem("rv_music_is_playing");
      const sIdx = sessionStorage.getItem("rv_music_track_idx");
      const sTime = sessionStorage.getItem("rv_music_time");
      const sExpanded = sessionStorage.getItem("rv_music_expanded");

      if (sPlaying === "true") savedPlaying = true;
      if (sIdx !== null && !isNaN(parseInt(sIdx, 10))) {
        currentIdx = parseInt(sIdx, 10) % PLAYLIST.length;
      }
      if (sTime !== null && !isNaN(parseFloat(sTime))) {
        savedTime = parseFloat(sTime);
      }
      if (sExpanded === "true") {
        widget.classList.add("expanded");
      }
    } catch (e) {}

    loadTrack(currentIdx);

    if (savedTime > 0) {
      try {
        audioEl.currentTime = savedTime;
      } catch (e) {}
      synthTime = savedTime;
      updateProgress();
    }

    if (savedPlaying) {
      playAudio();

      // If autoplay policy blocked audio on fresh page load, unlock on first user gesture (pointerdown, click, scroll, touch)
      const unlockOnGesture = () => {
        window.removeEventListener("pointerdown", unlockOnGesture, true);
        window.removeEventListener("click", unlockOnGesture, true);
        window.removeEventListener("scroll", unlockOnGesture, true);
        window.removeEventListener("pointermove", unlockOnGesture, true);
        window.removeEventListener("keydown", unlockOnGesture, true);
        window.removeEventListener("touchstart", unlockOnGesture, true);
        if (savedPlaying && audioEl.paused) {
          playAudio();
        }
      };

      window.addEventListener("pointerdown", unlockOnGesture, true);
      window.addEventListener("click", unlockOnGesture, true);
      window.addEventListener("scroll", unlockOnGesture, true);
      window.addEventListener("pointermove", unlockOnGesture, true);
      window.addEventListener("keydown", unlockOnGesture, true);
      window.addEventListener("touchstart", unlockOnGesture, true);
    }
  } catch (err) {
    console.warn("initMusicPlayer error:", err);
  }
}
