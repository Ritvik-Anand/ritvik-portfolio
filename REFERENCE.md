# gionatannese.com — teardown & replication plan

Captured 2026-09-07 by walking every route and reading the server payloads.

---

## 1. Stack (what it actually is)

| Layer | What they use |
|---|---|
| Framework | Next.js App Router (Turbopack), deployed on Vercel |
| CMS | Sanity (`cdn.sanity.io`, project `3dmz0m4k`) |
| Rendering | **One full-screen `<canvas>` (WebGL2) per page** — three.js / React Three Fiber |
| Animation | GSAP |
| DOM | Only nav, cursor label, project-info card, and hidden SEO text |
| Media | `.webp` images, `.webm` video, all same-origin or Sanity CDN |

The visible page is almost entirely WebGL. The DOM carries a hidden `<main>` with
headings/paragraphs purely for search engines. That is why the site feels like it
has no chrome — there almost isn't any.

## 2. Routes

| Path | Title | Notes |
|---|---|---|
| `/` | Gionatan Nese — Multi-Disciplinary Designer | "Creative Space" — the drifting field |
| `/projects` | Projects — Gionatan Nese | 6-tile grid incl. 2 "coming soon" |
| `/projects/<slug>` | `<seo.title>` — Gionatan Nese | Full-bleed scrolling case |
| `/about` | About — Gionatan Nese | Chapters + awards + contact |
| 404 | — | Black bg, `404` top centre, "You're not supposed to be here…" |

Slugs: `gionatannese`, `anchor`, `erica-basile`, `ferrari`.

## 3. Design system — the entire thing

**Colour** (the whole palette, from the compiled CSS):
`#fff` background · `#000` text · `#EDEDED` nav chip / hover pill ·
`#ededed80` · `#0000001a` hairlines · `#ffffff80`, `#ffffffe6` overlays.

That's it. No brand colour. **All colour in the site comes from the work itself.**

**Type** — two families, four sizes:
- `LayGrotesk Medium 500` (sans) — logo 14px, nav numerals 11px/140%, captions 12px/140%, cursor label 13px/120%
- `Teodor Light 300 / Regular 400` (serif) — nav labels 15px/110%, categories 13px/1.4, counter 16px, body 14px

Nothing on the site is larger than 16px except imagery. The scale is deliberately tiny.

**Geometry**: `border-radius: 4px` (`--radius-sm: .25rem`) on chips and the info card;
`999px` pills; `blur(40px)` for frosted glass. Easing: `cubic-bezier(.65,0,.35,1)`,
~450ms.

**Aspect ratio**: every single tile, on the field and in the grid, is **3:4 portrait**
(`ar: 0.7504` — 938×1250, 940×1256, 1876×2508). No exceptions. Detail blocks are 16:9
desktop / 3:4 mobile.

## 4. Chrome (present on every route)

- **Logo** `GN .D` — fixed top-left in the DOM but *transform-positioned* to centre;
  `mix-blend-exclusion` so it inverts over any artwork. Links home.
- **Nav** — centred, `top: 8px`, three chips. The **active** chip shows its label plus
  a superscript index (`Creative Space ¹`); the **inactive** ones show only the numeral
  (`2`, `3`). Hover gives a `#EDEDED` pill. On route change the label text wipes open /
  collapses while the chips resize — that sliding chip animation is the signature move.
- **Sound toggle** — top-right, `hidden` below 1025px.
- **Cursor label** — a `pointer-events-none` element at `top-8 left-8` driven by
  `transform`, `text-white mix-blend-difference`, 13px. Text is contextual:
  `View` over an open case image, `Close` anywhere else, `View Case` on touch.

## 5. Loader (runs on every hard navigation)

1. White screen. The letters `G N . D` fly in from scattered positions and settle
   into the wordmark at centre.
2. A `000 → 100` counter in Teodor 16px at bottom centre, tied to asset progress.
   `/Preloader.mp4` (1.7s) is **scrubbed** by that progress rather than played.
3. As it approaches 100 the field tiles animate in from the centre outward, then
   spread to their resting positions.

## 6. `/` — Creative Space

- **18 tiles**, all 3:4 portrait, scattered across the viewport in an
  irregular constellation — denser near the centre, sparse at the edges.
  Some are `.webm` video, some `.webp` still.
- **No page scroll.** `scrollHeight === innerHeight`. Everything happens in place.
- Tiles **drift continuously** — slow, independent, never repeating.
- **Hover a tile → it swaps to a short looping video** (`overview.hover.file`).
- **Identity marquee**: `Gionatan Nese` (sans 14px) and `Multi-Disciplinary Designer`
  (serif 14px) travel horizontally across the vertical centre of the viewport,
  continuously, passing behind the tiles.

### Click a tile → the case opens *in place*
- The tile scales up to ~373×498 (≈69% of viewport height), dead centre.
- **Every other tile fades toward white** and keeps drifting behind it.
- Bottom centre: `Ferrari` (sans 12px) + `Design Exploration` (serif 13px). The
  previous caption crossfades upward as the new one arrives.
- Cursor label reads `View` over the image, `Close` outside it.
- Click the image → navigates to `/projects/<slug>`, the image morphing into the
  detail page's first block.
- Tiles flagged `case: false` are *explorations* — they open the same way but show a
  paragraph instead, with no onward link.

Tile data model:
```json
{ "slug", "src", "type": "image|video", "title", "subtitle",
  "case": true, "paragraph": null,
  "firstBlockMedia": { "d": "…desktop", "m": "…mobile" } }
```
A project can contribute several tiles (Ferrari has 3, Verniciatura Rosa has 3).

## 7. `/projects` — the grid

Six tiles, 3:4, each with name + category, hover→video. Two are
`comingSoon: true` and are not clickable. Order interleaves them:
`gionatannese, verniciatura-rosa, ferrari, erica-basile, neshamah, anchor`.

## 8. `/projects/<slug>` — the case

- **No native page scroll** — virtual/smooth scroll driving the canvas.
- Opens with the project title centred: name (sans 14px) over category (serif 15px).
- Then a vertical run of **7–12 full-bleed blocks**, ~6px side margin, ~8px gaps.
  Only two block types exist:
  - `full` — edge-to-edge, 16:9 desktop / 3:4 mobile
  - `pair` — two portrait pieces side by side
- **`Project Info` button, top-left.** Click → a frosted card expands:
  `460×236px`, `rgba(216,216,216,.5)`, `backdrop-filter: blur(40px)`, `radius 4px`,
  at `8px, 8px`. Contains name, category, description, and credit lists. The button
  label flips to `Close`.
- Ends with `All projects` → `/projects`.

Project data model:
```json
{ "name", "slug", "subtitle", "case", "comingSoon", "order",
  "seo": { "title", "description", "ogImage" },
  "tileImage",
  "creativeSpacePieces": [ { "type", "src" } ],
  "overview": { "file", "type", "category", "ar": 0.7504,
                "hover": { "type": "video", "file" } },
  "firstBlockMedia": { "d", "m" },
  "detail": { "blocks": [ {"type":"full","file":{"d","m"},"ar":1.777},
                          {"type":"pair","files":[a,b],"ars":[…]} ],
              "title", "description",
              "sections": [ { "heading": "Credits", "items": […] } ],
              "isWebsite", "website", "websiteLabel" } }
```

## 9. `/about`

```json
{ "currentlyAt": "DashDigital® Studio", "studioUrl": "…",
  "chapters": [ { "leftText", "rightText" } ]   // ×4: Quality, Feel, Purpose, Obsession
  "awards": ["Awwwards x4","DDA x2","CSSDA x2","The FWA x2"],
  "contactLinks": { "email", "instagram", "twitter", "linkedin", "cosmos" } }
```
Each chapter is a two-column pair of paragraphs under a one-word heading.

## 10. The seven mechanisms worth stealing

1. **Work as the only colour.** Two-colour UI; every pixel of colour is the portfolio.
2. **Nothing scrolls on the landing page.** The work arranges itself and drifts.
3. **Radical smallness of type.** Nothing above 16px. The imagery carries all scale.
4. **Near-absent chrome.** One logo, three chips, one cursor word.
5. **The case opens in place.** No page change until you commit a second click.
6. **Earned entry.** A counting loader that makes arrival feel like a threshold.
7. **One aspect ratio everywhere.** 3:4 for every tile — instant visual coherence.
