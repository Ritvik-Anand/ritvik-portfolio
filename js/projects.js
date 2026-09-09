(function () {
  function render() {
    const grid = document.querySelector(".proj-grid");
    if (!grid) return;
    grid.innerHTML = "";
    SITE.cases.forEach((proj) => {
      if (proj.comingSoon) {
        const div = document.createElement("div");
        div.className = "proj-card soon";

        const frame = document.createElement("div");
        frame.className = "frame";
        frame.innerHTML = `<span>Coming Soon</span>`;

        const meta = document.createElement("div");
        meta.className = "meta";
        meta.innerHTML = `<div class="name">${proj.name || "Coming Soon"}</div><div class="cat">${proj.category || "Exploration"}</div>`;

        div.appendChild(frame);
        div.appendChild(meta);
        grid.appendChild(div);
        return;
      }

      const a = document.createElement("a");
      a.className = "proj-card";
      a.href = `project.html?p=${encodeURIComponent(proj.slug)}`;

      const frame = document.createElement("div");
      frame.className = "frame";
      const img = document.createElement("img");
      img.src = proj.tileImage;
      img.alt = proj.name;
      frame.appendChild(img);

      const hoverBlock = proj.blocks && proj.blocks.find((b) => b.type === "video");
      if (hoverBlock) {
        const vid = document.createElement("video");
        vid.className = "loop";
        vid.muted = true;
        vid.loop = true;
        vid.playsInline = true;
        vid.preload = "none";
        frame.appendChild(vid);
        a.addEventListener("pointerenter", () => {
          if (!vid.src) vid.src = hoverBlock.src;
          vid.play().catch(() => {});
        });
        a.addEventListener("pointerleave", () => vid.pause());
      }

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.innerHTML = `<div class="name">${proj.name}</div><div class="cat">${proj.category}</div>`;

      a.appendChild(frame);
      a.appendChild(meta);
      grid.appendChild(a);
    });
  }
  window.__initProjects = render;
})();
