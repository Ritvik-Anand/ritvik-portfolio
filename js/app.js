/* Orchestrates the single-page slide between Creative Space / Projects /
   About — no full navigation between the three top-level views. */

(function () {
  const ORDER = ["home", "projects", "about"];
  const TITLES = {
    home: `${SITE.person.name} — ${SITE.person.role}`,
    projects: `Projects — ${SITE.person.name}`,
    about: `About — ${SITE.person.name}`,
  };

  const track = document.getElementById("track");
  let current = keyFromHash();

  function keyFromHash() {
    const h = (location.hash || "").replace("#", "");
    return ORDER.includes(h) ? h : "home";
  }

  function place(key, animate) {
    const idx = ORDER.indexOf(key);
    if (!animate) track.classList.add("no-anim");
    track.style.transform = `translateX(-${idx * 100}vw)`;
    if (!animate) {
      // eslint-disable-next-line no-unused-expressions
      track.offsetWidth; // force reflow so the next change transitions
      track.classList.remove("no-anim");
    }
    document.title = TITLES[key] || TITLES.home;
    window.__activeView = key;
    document.body.classList.toggle("not-home", key !== "home");
  }

  function goToView(key, opts) {
    opts = opts || {};
    if (key === current && !opts.force) return;
    current = key;
    place(key, true);
    chromeApi.setActive(key);
    if (!opts.silent) {
      const url = key === "home" ? "index.html" : `index.html#${key}`;
      history.pushState({ key }, "", url);
    }
  }

  window.addEventListener("popstate", () => {
    const key = keyFromHash();
    current = key;
    place(key, true);
    chromeApi.setActive(key);
  });

  const chromeApi = initChrome({
    active: current,
    onNav: (key) => goToView(key),
  });

  // build all three views right away — the loader is still covering the
  // screen at this point, so image/video requests fire during that time
  // instead of after it, and the sphere is animating underneath already
  try { if (window.__initProjects) window.__initProjects(); } catch (err) { console.error("Error in initProjects:", err); }
  try { if (window.__initAbout) window.__initAbout(); } catch (err) { console.error("Error in initAbout:", err); }
  try { if (window.__initHome) window.__initHome(); } catch (err) { console.error("Error in initHome:", err); }

  // land on the right view instantly — no slide-in on first paint
  place(current, false);

  document.querySelector(".gnd-logo").addEventListener("click", (e) => {
    e.preventDefault();
    goToView("home");
  });
})();
