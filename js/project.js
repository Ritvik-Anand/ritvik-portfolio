(function () {
  function getSlug() {
    return new URLSearchParams(window.location.search).get("p");
  }

  function blockNode(block, index) {
    if (block.type === "full") {
      const div = document.createElement("div");
      div.className = index === 0 ? "block-full block-banner" : "block-full";
      const img = document.createElement("img");
      img.src = block.src;
      img.alt = "";
      img.loading = "lazy";
      div.appendChild(img);
      return div;
    }
    if (block.type === "video") {
      const div = document.createElement("div");
      div.className = index === 0 ? "block-full block-banner" : "block-full";
      const vid = document.createElement("video");
      vid.src = block.src;
      vid.autoplay = true;
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      div.appendChild(vid);
      return div;
    }
    if (block.type === "pair") {
      const div = document.createElement("div");
      div.className = "block-pair";
      block.files.forEach((src) => {
        const piece = document.createElement("div");
        piece.className = "piece";
        const img = document.createElement("img");
        img.src = src;
        img.alt = "";
        img.loading = "lazy";
        piece.appendChild(img);
        div.appendChild(piece);
      });
      return div;
    }
    if (block.type === "asymmetric") {
      const div = document.createElement("div");
      div.className = `block-asymmetric ${block.position === "right" ? "right-portrait" : "left-portrait"}`;
      if (block.ratio) {
        div.style.gridTemplateColumns = block.ratio;
      }

      const mainCol = document.createElement("div");
      mainCol.className = "main-piece";
      const mainImg = document.createElement("img");
      mainImg.src = block.main;
      mainImg.alt = "";
      mainImg.loading = "lazy";
      mainCol.appendChild(mainImg);

      const stackCol = document.createElement("div");
      stackCol.className = "stacked-pieces";
      block.stacked.forEach((src) => {
        const piece = document.createElement("div");
        piece.className = "piece";
        const img = document.createElement("img");
        img.src = src;
        img.alt = "";
        img.loading = "lazy";
        piece.appendChild(img);
        stackCol.appendChild(piece);
      });

      if (block.position === "right") {
        div.appendChild(stackCol);
        div.appendChild(mainCol);
      } else {
        div.appendChild(mainCol);
        div.appendChild(stackCol);
      }
      return div;
    }
    return document.createComment("unknown block");
  }

  function render() {
    const slug = getSlug();
    const proj = (SITE.cases && SITE.cases.find((c) => c.slug === slug)) || (SITE.cases && SITE.cases[0]);
    if (!proj) return;

    if (SITE.person && SITE.person.name) {
      document.title = `${proj.name} — ${SITE.person.name}`;
    }

    const nEl = document.querySelector(".case-hero .n");
    if (nEl) nEl.textContent = proj.name || "";

    const cEl = document.querySelector(".case-hero .c") || document.querySelector(".case-hero .cat");
    if (cEl) cEl.textContent = proj.category || "";

    const heroDesc = document.querySelector(".case-hero .d");
    if (heroDesc) heroDesc.textContent = proj.description || "";

    const blocksEl = document.querySelector(".blocks");
    if (blocksEl && proj.blocks) {
      blocksEl.innerHTML = "";
      proj.blocks.forEach((b, i) => blocksEl.appendChild(blockNode(b, i)));
    }

    // info card
    const card = document.querySelector(".info-card");
    if (card) {
      const h2 = card.querySelector("h2");
      if (h2) h2.textContent = proj.name || "";
      const cat = card.querySelector(".cat") || card.querySelector(".c");
      if (cat) cat.textContent = proj.category || "";
      const desc = card.querySelector(".desc");
      if (desc) desc.textContent = proj.description || "";
      const ul = card.querySelector(".credits ul");
      if (ul && proj.credits) {
        ul.innerHTML = "";
        proj.credits.forEach((c) => {
          const li = document.createElement("li");
          li.textContent = c;
          ul.appendChild(li);
        });
      }
    }

    const trigger = document.querySelector(".info-trigger");
    if (trigger && card) {
      let open = false;
      function setOpen(v) {
        open = v;
        card.classList.toggle("open", open);
        trigger.textContent = open ? "Close" : "Project Info";
      }
      trigger.addEventListener("click", () => setOpen(!open));
      setOpen(false);
    }

    const endLink = document.querySelector(".case-end a");
    if (endLink) {
      endLink.textContent = "All projects";
      endLink.href = "index.html#projects";
    }
  }

  window.__initProject = render;
})();
