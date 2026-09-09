# Replication plan — ritvikanand.com

Target: reproduce the structure, mechanics and restraint of gionatannese.com
(see REFERENCE.md) with Ritvik Anand's work. Built from scratch, in steps,
with a checkpoint you approve before the next one starts.

---

## Stack

Plain HTML / CSS / JS. No framework, no build step.

- `index.html` — Creative Space
- `projects.html` — grid
- `project.html?p=<slug>` — one template for every case
- `about.html`
- `404.html`
- `data.js` — the single source of truth (projects, tiles, about copy)
- `assets/` — images and video
- `css/site.css`, `js/*.js`
- Served by the existing local server on `:8471`

**DOM, not WebGL.** The reference renders in three.js. Every mechanism it uses is
reproducible with absolutely-positioned elements and CSS transforms: the drift is a
rAF loop, the case-open is a FLIP transform from tile rect to centre rect, the
"other tiles fade to white" is opacity, the frosted card is `backdrop-filter`.
Two libraries from CDN: **GSAP** (timelines + FLIP easing) and **Lenis** (smooth
scroll on case pages). This is honest about the trade: it will not be a
pixel-for-pixel clone of a WebGL renderer, but every interaction will be there and
it will be maintainable by you without a toolchain.

---

## Step 0 — Content (blocked on you)

Nothing gets built until this exists, because the last attempt failed by inventing
structure around content that wasn't decided.

Needed:

1. **Cases** — 3 to 5 real projects, each with: name, category line
   (e.g. "Creative Direction, Motion"), one paragraph (60–80 words), credits, and
   an optional live URL. Red Bull F1, Plena Finance and Noah.AI are the obvious
   three; tell me the real scope of each.
2. **Explorations** — the remaining graphics, each with a title, a category, and
   two sentences.
3. **About** — four one-word chapters with two short paragraphs each; where you
   work now; awards or notable clients; contact links.
4. **Positioning line** — the equivalent of "Multi-Disciplinary Designer".

Deliverable: `data.js` filled in and reviewed by you. No design work yet.

## Step 0b — Assets

The single hardest constraint in the reference, and the one that makes it cohere:
**every tile is 3:4 portrait**. Your source images are mixed aspect.

- Crop every tile asset to 3:4 at ~940×1250, export `.webp`
- Case hero blocks: 16:9 at ~2880w desktop, 3:4 at ~1600w mobile
- Hover loops: 2–4s `.webm`, muted, ~1MB each
- Total budget: keep the field under ~4MB so the loader doesn't stall
  (the reference itself stalls — do not copy that)

I can do the cropping; I need you to confirm the subject of each crop.

## Step 1 — Foundation

Palette (`#fff`, `#000`, `#EDEDED`, `#0000001a`), the two type families, the
4px radius, the easing curve. Then the chrome that appears on every page:

- Logo, `mix-blend-exclusion`, centre-top, links home
- Three nav chips with the active-label / inactive-numeral behaviour and the
  sliding label wipe on route change
- The cursor label (`View` / `Close`)
- The loader: scattered letters settling, `000 → 100` counter

**Fonts.** LayGrotesk and Teodor are both commercial. Free substitutes that hold
the same character: **Geist** or **Inter Tight** for the sans, **Instrument Serif**
or **Newsreader Light** for the serif — all on Google Fonts. We pick in this step;
you can license the real pair later and swap two lines.

*Checkpoint: chrome and loader on a blank white page.*

## Step 2 — Creative Space

- 16–20 tiles, 3:4, scattered in an irregular constellation, denser at centre
- Continuous independent drift, `prefers-reduced-motion` respected
- Hover swaps the still to its loop video
- Identity marquee crossing the vertical centre
- No page scroll at any viewport

*Checkpoint: the field, live, at desktop and phone.*

## Step 3 — The case-open overlay

- Tile scales to ~69% viewport height, centred, via FLIP
- Every other tile fades toward white, still drifting
- Caption pair at bottom centre, crossfading on change
- Cursor label switches `View` / `Close`
- Click image → `/project.html?p=slug`; click outside / Esc → close
- Explorations show their paragraph instead, with no onward link

*Checkpoint: open, read, close, navigate — on both pointer and touch.*

## Step 4 — Case page

- Smooth scroll, `full` and `pair` blocks only, 6px margins, 8px gaps
- Centred title on entry: name over category
- `Project Info` → frosted card, 460px, `blur(40px)`, radius 4px, top-left,
  with description and credits; label flips to `Close`
- `All projects` at the end

*Checkpoint: one complete case end to end.*

## Step 5 — Projects grid
3:4 tiles with name + category, hover→video, coming-soon entries non-clickable.

## Step 6 — About
Four chapters as two-column paragraph pairs, awards, contact links.

## Step 7 — Mobile
Sound toggle hidden, `View Case` tap affordance, 44px minimum touch targets,
mobile crops used for hero blocks, every tile reachable without scrolling.

## Step 8 — Finish
404, favicon, OG images, meta and JSON-LD, Lighthouse pass, deploy.

---

## What I am deliberately not copying

- **The 30-second cold load.** The reference stalls badly. Ours preloads only what
  the first screen needs.
- **Desaturating the work.** Their tiles are in full colour on white; only the
  *unselected* tiles fade during a case-open. Colour stays.
- **Text below 12px.** Their 11px numerals are a genuine accessibility problem.
