(function () {
  function render() {
    const a = SITE.about;
    document.querySelector(".currently").textContent = `Currently: ${a.currentlyAt}`;

    const chapters = document.querySelector(".chapters");
    chapters.innerHTML = "";
    a.chapters.forEach((ch) => {
      const div = document.createElement("div");
      div.className = "chapter";

      let paragraphs = "";
      if (ch.left || ch.right) {
        paragraphs = `
          <p>${ch.left || ""}</p>
          <p>${ch.right || ""}</p>
        `;
      }

      let toolsMarkup = "";
      if (ch.tools && ch.tools.length > 0) {
        div.classList.add("chapter-tools");
        const pills = ch.tools
          .map(
            (t, idx) => `
          <div class="tool-pill" data-index="${idx}" tabindex="0" role="button">
            <img src="${t.logo}" alt="${t.name}" loading="lazy" />
            <span>${t.name}</span>
          </div>`
          )
          .join("");

        toolsMarkup = `
          <div class="tools-wrapper">
            <div class="tools-grid">${pills}</div>
            <div class="tool-desc-box">
              <div class="desc-content">
                <span class="hint">Hover over a tool to see how it's used</span>
              </div>
            </div>
          </div>
        `;
      }

      div.innerHTML = `
        <h3>${ch.heading}</h3>
        ${paragraphs}
        ${toolsMarkup}
      `;
      chapters.appendChild(div);

      if (ch.tools && ch.tools.length > 0) {
        const wrapper = div.querySelector(".tools-wrapper");
        const pills = div.querySelectorAll(".tool-pill");
        const descBox = div.querySelector(".desc-content");

        function showTool(index) {
          const tool = ch.tools[index];
          pills.forEach((p, i) => p.classList.toggle("active", i === index));
          descBox.style.opacity = "0";
          descBox.style.transform = "translateY(4px)";
          setTimeout(() => {
            descBox.innerHTML = `
              <div class="active-tool-header">
                <img src="${tool.logo}" alt="" class="tool-icon" />
                <span class="tool-name">${tool.name}</span>
              </div>
              <p class="tool-text">${tool.desc}</p>
            `;
            descBox.style.opacity = "1";
            descBox.style.transform = "translateY(0)";
          }, 100);
        }

        function resetTool() {
          pills.forEach((p) => p.classList.remove("active"));
          descBox.style.opacity = "0";
          descBox.style.transform = "translateY(4px)";
          setTimeout(() => {
            descBox.innerHTML = `<span class="hint">Hover over a tool to see how it's used</span>`;
            descBox.style.opacity = "1";
            descBox.style.transform = "translateY(0)";
          }, 100);
        }

        pills.forEach((pill) => {
          const idx = parseInt(pill.dataset.index, 10);
          pill.addEventListener("pointerenter", () => showTool(idx));
          pill.addEventListener("focus", () => showTool(idx));
        });

        wrapper.addEventListener("pointerleave", resetTool);
      }
    });

    const contactUl = document.querySelector(".contact ul");
    if (contactUl) {
      contactUl.innerHTML = "";
      const links = [
        a.contact.email && ["Email", `mailto:${a.contact.email}`, a.contact.email],
        a.contact.phone && ["Contact Number", `tel:${a.contact.phone.replace(/\s+/g, "")}`, a.contact.phone],
        a.contact.instagram && ["Instagram", a.contact.instagram, "Instagram"],
        a.contact.twitter && ["Twitter", a.contact.twitter, "Twitter"],
        a.contact.linkedin && ["Linkedin", a.contact.linkedin, "Linkedin"],
      ].filter(Boolean);
      links.forEach(([label, href, text]) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${label}:</span> <a href="${href}">${text}</a>`;
        contactUl.appendChild(li);
      });
    }
  }
  window.__initAbout = render;
})();
