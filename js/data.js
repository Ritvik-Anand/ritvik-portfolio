/* ===========================================================
   Single source of truth for content. Edit this file to
   customise copy, credits and media — the pages just render it.
   =========================================================== */

const SITE = {
  person: {
    name: "Ritvik Anand",
    logoMark: "RV .A",
    role: "Creative Director",
    email: "ritvikanand@icloud.com",
    phone: "+91 90187 71122",
    currentlyAt: "Independent — available for select work",
  },

  nav: [
    { label: "Creative Space", href: "index.html#home", key: "home" },
    { label: "Projects", href: "index.html#projects", key: "projects" },
    { label: "About", href: "index.html#about", key: "about" },
  ],

  cases: [
    {
      slug: "red-bull-f1",
      name: "Red Bull",
      category: "Creative Direction, Championship Campaign",
      tileImage: "images/rb-cover.png?v=14",
      description:
        "Creative Director for Red Bull's campaign celebrating Max Verstappen's historic 2021 World Championship victory, producing championship-winning marketing collateral and key campaign art. Due to an NDA signed with the agency that commissioned the work, full campaign details cannot be shared publicly. Additional information and work samples are available on request.",
      credits: [
        "R.V. Anand, Creative Direction",
        "Commissioned Agency NDA",
      ],
      website: null,
      blocks: [
        { type: "full", src: "images/redbull-racing1.png" },
      ],
    },
    {
      slug: "plena-finance",
      name: "Plena Finance",
      category: "Graphic Design, Marketing Content",
      tileImage: "images/pl-cover.png?v=14",
      description:
        "Graphic Designer in collaboration with Creaet Studio — a content agency for AI, tech, and SaaS companies — producing marketing content and graphic assets for Plena Finance. Details available on request due to NDA.",
      credits: [
        "R.V. Anand, Graphic Designer",
        "Creaet Studio, Content Agency",
      ],
      website: null,
      blocks: [
        { type: "full", src: "images/frame-488.png" },
        { type: "video", src: "images/0010.mp4" },
        { type: "pair", files: ["images/frame-489.png", "images/frame-495.png"] },
        {
          type: "asymmetric",
          main: "images/0056.png",
          stacked: ["images/0002.png", "images/0051.png"],
          position: "left",
          ratio: "0.9fr 1fr",
        },
        { type: "pair", files: ["images/0039.png", "images/0043.png"] },
        {
          type: "asymmetric",
          main: "images/0028.png",
          stacked: ["images/0007.png", "images/frame-550.png"],
          position: "left",
          ratio: "0.85fr 1fr",
        },
        {
          type: "asymmetric",
          main: "images/Plena wallet.jpg",
          stacked: ["images/0053.png", "images/frame-495.png"],
          position: "right",
          ratio: "1fr 0.9fr",
        },
      ],
    },
    {
      slug: "noah-ai",
      name: "Noah.AI",
      category: "Graphic Design, Launch Content",
      tileImage: "images/no-cover.png",
      description:
        "Graphic Designer in collaboration with Creaet Studio, creating marketing content, launch visual assets, and promotional graphics for Noah.AI. Details available on request due to NDA.",
      credits: [
        "R.V. Anand, Graphic Designer",
        "Creaet Studio, Content Agency",
      ],
      website: null,
      blocks: [
        { type: "full", src: "images/Grid.png" },
        {
          type: "asymmetric",
          main: "images/Frame 2147224543.png",
          stacked: ["images/image (25).png", "images/image (27).png"],
          position: "left",
          ratio: "0.9fr 1fr",
        },
        { type: "pair", files: ["images/Frame 2087331506.png", "images/Frame 2147224485.svg"] },
        { type: "pair", files: ["images/frame-538.png", "images/frame-547.png"] },
        { type: "pair", files: ["images/Frame 2147224480.png", "images/Frame 2147224518.png"] },
        { type: "pair", files: ["images/image (30).png", "images/34.png"] },
      ],
    },
    {
      slug: "unconventional-club",
      name: "Unconventional Club",
      category: "Brand Design & Exploration",
      tileImage: "images/1.png",
      description:
        "An exploration for a premium and luxury clothing and accessories brand for men.",
      credits: [
        "R.V. Anand, Creative Direction & Concept",
      ],
      website: null,
      blocks: [
        { type: "full", src: "images/1.png" },
        { type: "pair", files: ["images/2.png", "images/4.png"] },
        { type: "pair", files: ["images/5.png", "images/6.png"] },
        { type: "full", src: "images/7.png" },
      ],
    },
    {
      slug: "worknation",
      name: "WorkNation",
      category: "Brand Content & Motion",
      comingSoon: true,
    },
    {
      slug: "coming-soon",
      name: "Coming Soon",
      category: "Exploration",
      comingSoon: true,
    },
  ],

  // Tiles scattered across the Creative Space (home). Uncropped intrinsic ratios.
  tiles: [
    { case: "red-bull-f1", src: "images/redbull-racing1.png", ratio: 1.3333 },
    { case: "red-bull-f1", src: "images/carcomp.png", ratio: 0.75 },
    { case: "unconventional-club", src: "images/1.png", ratio: 0.8 },
    { case: "unconventional-club", src: "images/2.png", ratio: 0.8 },
    { case: "unconventional-club", src: "images/4.png", ratio: 0.75 },
    { case: "unconventional-club", src: "images/7.png", ratio: 0.75 },
    { case: "noah-ai", src: "images/no-cover.png", ratio: 0.75 },
    { case: "noah-ai", src: "images/Grid.png", ratio: 1.3333 },
    { case: "noah-ai", src: "images/Frame 2147224543.png", ratio: 0.8 },
    { case: "noah-ai", src: "images/Frame 2087331506.png", ratio: 2.1117 },
    { case: "plena-finance", src: "images/frame-488.png", ratio: 1.7778 },
    { case: "plena-finance", src: "images/0002.png", ratio: 1.7778 },
    { case: "plena-finance", src: "images/0007.png", ratio: 1.0000 },
    { case: "plena-finance", src: "images/0028.png", ratio: 0.6667 },
    { case: "plena-finance", src: "images/Plena wallet.jpg", ratio: 0.8000 },
  ],

  about: {
    currentlyAt: "Independent — available for select work",
    chapters: [
      {
        heading: "Direction",
        left:
          "I don't start from a template. Every project gets read on its own terms first — what the product actually is, who it's for, what it's competing with for attention — before a single frame gets made.",
        right:
          "That's slower than opening a moodboard, but it's the only way the work ends up looking like it belongs to the brand instead of to whichever tool made it.",
      },
      {
        heading: "Speed",
        left:
          "Web3 and AI move on release-cycle time, not campaign time. I've run launch content on 48-hour turnarounds without the visual system falling apart between drops.",
        right:
          "That discipline — a system that holds under pressure — matters more than any single hero image. It's what makes a brand recognisable across a hundred fast, small pieces of content instead of five polished ones.",
      },
      {
        heading: "Tools",
        tools: [
          {
            name: "Higgsfield AI",
            logo: "images/logo-higgsfield.svg",
            desc: "An all-round tool used to create AI images, AI scenes, video generation, and creative visual explorations.",
          },
          {
            name: "Claude AI",
            logo: "images/logo-claude.svg",
            desc: "Used for MCP, building landing pages, building campaign pages, tracking progress, and structural planning.",
          },
          {
            name: "Photoshop",
            logo: "images/logo-photoshop.svg",
            desc: "Key visual editing, photo manipulation, asset composition, and image retouching.",
          },
          {
            name: "After Effects",
            logo: "images/logo-aftereffects.svg",
            desc: "Motion graphics, campaign animations, video compositing, and dynamic transitions.",
          },
          {
            name: "Illustrator",
            logo: "images/logo-illustrator.svg",
            desc: "Vector graphics, brand iconography, typography layout, and scalable logo marks.",
          },
        ],
      },
    ],
    contact: {
      email: "ritvikanand@icloud.com",
      phone: "+91 90187 71122",
      instagram: null,
      twitter: null,
      linkedin: null,
    },
  },
};
