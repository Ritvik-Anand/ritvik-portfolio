/* ===========================================================
   Web Audio API & Haptics Engine.
   Provides subtle, real-time synthesized SFX and haptic vibration
   feedback across desktop and mobile.
   =========================================================== */

(function () {
  let audioCtx = null;
  let isEnabled = true; // Always enabled by default

  try {
    sessionStorage.removeItem("rv_sound_enabled");
  } catch (e) {}

  function getAudioContext() {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtx = new AudioCtx();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Auto-resume AudioContext on any user interaction (browser gesture compliance)
  function unlockAudio() {
    getAudioContext();
  }
  document.addEventListener("pointerdown", unlockAudio);
  document.addEventListener("pointerenter", unlockAudio, true);
  document.addEventListener("keydown", unlockAudio);

  function triggerHaptic(pattern) {
    if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  }

  // Synthesize subtle UI SFX using Web Audio API
  function playSFX(type) {
    if (!isEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === "hover") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(850, now);
      osc.frequency.exponentialRampToValueAtTime(1250, now + 0.03);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.032);
    } else if (type === "click") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(550, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);
    } else if (type === "chime-on") {
      const notes = [523.25, 783.99]; // C5 -> G5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.07;
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.10, start);
        gain.gain.exponentialRampToValueAtTime(0.0005, start + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.16);
      });
    } else if (type === "chime-off") {
      const notes = [783.99, 523.25]; // G5 -> C5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.07;
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.0005, start + 0.14);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.15);
      });
    } else if (type === "riser") {
      const freqs = [130.81, 196.0, 261.63]; // C3, G3, C4 warm chord
      freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.2, now + 0.28);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      });
    }
  }

  function updateToggleButton(btn) {
    if (!btn) return;
    if (isEnabled) {
      btn.classList.add("active", "on");
      btn.classList.remove("muted", "off");
      btn.setAttribute("aria-label", "Disable sound and haptics");
      btn.innerHTML = `
        <span class="bars">
          <span class="bar b1"></span>
          <span class="bar b2"></span>
          <span class="bar b3"></span>
        </span>
        <span class="snd-txt">Sound: On</span>
      `;
    } else {
      btn.classList.remove("active", "on");
      btn.classList.add("muted", "off");
      btn.setAttribute("aria-label", "Enable sound and haptics");
      btn.innerHTML = `
        <span class="dot"></span>
        <span class="snd-txt">Sound: Off</span>
      `;
    }
  }

  function toggleSound(btn) {
    isEnabled = !isEnabled;
    try {
      sessionStorage.setItem("rv_sound_enabled", isEnabled ? "true" : "false");
    } catch (e) {}

    if (isEnabled) {
      getAudioContext();
      playSFX("chime-on");
      triggerHaptic([15, 40, 15]);
    } else {
      playSFX("chime-off");
      triggerHaptic(20);
    }

    updateToggleButton(btn);
  }

  function initAudioEvents() {
    const soundBtn = document.querySelector(".sound-toggle");
    if (soundBtn) {
      updateToggleButton(soundBtn);
      soundBtn.addEventListener("click", (e) => {
        e.preventDefault();
        toggleSound(soundBtn);
      });
    }

    let currentHoveredEl = null;

    document.addEventListener(
      "pointerenter",
      (e) => {
        const target = e.target;
        if (!target || typeof target.closest !== "function") return;

        const el = target.closest(".tile, .proj-card, .top-nav a, .tool-pill, .info-btn, .info-trigger, .case-end a");
        if (!el) {
          currentHoveredEl = null;
          return;
        }

        if (currentHoveredEl === el) return;
        currentHoveredEl = el;

        playSFX("hover");
        triggerHaptic(6);
      },
      true
    );

    document.addEventListener(
      "pointerleave",
      (e) => {
        const target = e.target;
        if (!target || typeof target.closest !== "function") return;
        const el = target.closest(".tile, .proj-card, .top-nav a, .tool-pill, .info-btn, .info-trigger, .case-end a");
        if (el && el === currentHoveredEl) {
          const related = e.relatedTarget;
          if (!related || !el.contains(related)) {
            currentHoveredEl = null;
          }
        }
      },
      true
    );

    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!target || typeof target.closest !== "function") return;

      if (target.closest(".sound-toggle")) return;

      if (target.closest(".tile") || target.closest(".proj-card")) {
        playSFX("riser");
        triggerHaptic([12, 35, 12]);
        return;
      }

      if (target.closest("a, button, .info-btn, .info-trigger, .tool-pill")) {
        playSFX("click");
        triggerHaptic(12);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAudioEvents);
  } else {
    initAudioEvents();
  }

  // Export global controls
  window.__audioEngine = {
    isEnabled: () => isEnabled,
    toggle: toggleSound,
    playSFX: playSFX,
    triggerHaptic: triggerHaptic,
  };
})();
