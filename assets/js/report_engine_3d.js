/* =====================================================================================
   Interactive 2D + Draggable Three.js (r187) 3D Relationship Report Engine
   Driven entirely by `window.REPORT`. Works offline (via bundled Three.js) and online.
   ===================================================================================== */
(function () {
  "use strict";
  const REPORT = window.REPORT;
  if (!REPORT) return;

  const STYLES = ["Emotional", "Assertive", "Thoughtful", "Logical"];
  const ICON = {
    heart: '<path d="M12 20.5s-7.5-4.6-9.3-9.3C1.4 7.6 3.6 4.5 6.9 4.5c2.1 0 3.6 1.1 5.1 3 1.5-1.9 3-3 5.1-3 3.3 0 5.5 3.1 4.2 6.7-1.8 4.7-9.3 9.3-9.3 9.3z"/>',
    bolt: '<path d="M13.5 2.5 5 13.5h6l-1.5 8 8.5-11h-6l1.5-8z"/>',
    sprout: '<path d="M12 21v-8M12 13c0-4-3-6.5-7.5-6.5 0 4 3 6.5 7.5 6.5zM12 11c0-3.6 2.6-6 6.8-6 0 3.7-2.6 6-6.8 6z"/>',
    brain: '<path d="M9.5 4.5a2.8 2.8 0 0 0-2.8 2.4A3 3 0 0 0 4.5 10a3 3 0 0 0 .8 4.3A2.9 2.9 0 0 0 8 18.6c.4 1.2 1.4 1.9 2.5 1.9V4.5zM14.5 4.5a2.8 2.8 0 0 1 2.8 2.4 3 3 0 0 1 2.2 3.1 3 3 0 0 1-.8 4.3 2.9 2.9 0 0 1-2.7 4.3c-.4 1.2-1.4 1.9-2.5 1.9V4.5z"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
    sparkle: '<path d="M12 3.5c.6 3.9 2.2 5.5 6 6.1-3.8.6-5.4 2.2-6 6.1-.6-3.9-2.2-5.5-6-6.1 3.8-.6 5.4-2.2 6-6.1zM18.5 15c.3 1.8 1 2.5 2.7 2.8-1.7.3-2.4 1-2.7 2.7-.3-1.7-1-2.4-2.7-2.7 1.7-.3 2.4-1 2.7-2.8z"/>',
    book: '<path d="M4 5.5c2.6-1 5.3-1 8 .8 2.7-1.8 5.4-1.8 8-.8v13c-2.6-1-5.3-1-8 .8-2.7-1.8-5.4-1.8-8-.8z M12 6.3v13"/>',
    users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.6-3.4 2.8-5.2 5.5-5.2s4.9 1.8 5.5 5.2"/><circle cx="16.8" cy="9.4" r="2.5"/><path d="M15.6 13.9c2.5-.3 4.4 1.3 4.9 4.6"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>'
  };
  const STYLE_LOOK = {
    Emotional:  { color: "#d96c91", throat: "#9e204e", ink: "#8f2249", soft: "#fbe4ec", angle: 135, icon: ICON.heart },
    Assertive:  { color: "#e8895b", throat: "#b8471a", ink: "#a8461d", soft: "#fdf0e8", angle: 45,  icon: ICON.bolt },
    Thoughtful: { color: "#5da594", throat: "#256e5e", ink: "#246b5b", soft: "#e4f4f0", angle: 225, icon: ICON.sprout },
    Logical:    { color: "#668bd1", throat: "#2f54a0", ink: "#2d529e", soft: "#e6eefb", angle: 315, icon: ICON.brain }
  };
  const STONE_LOOK = {
    4: { color: "#784a9d", size: 1.0 },
    3: { color: "#a37bc3", size: 0.82 },
    2: { color: "#ccb7e2", size: 0.66 },
    1: { color: "#efe8f7", size: 0.52 }
  };
  const THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.187.0/three.module.min.js";

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const fill = (tpl, map) => String(tpl).replace(/\{(\w+)\}/g, (m, k) => (k in map ? map[k] : m));
  // A score of 0 is shown as a dash, never as "0%". The Teammates report shows every % with two decimals
  // (37.5 → 37.50%, 46.875 → 46.88%, 75 → 75.00%); the other reports keep at most one decimal.
  const pc = v => {
    if (REPORT.pool === "teammates") { const r = Math.round(v * 100) / 100; return r === 0 ? "–" : `${r.toFixed(2)}%`; }
    const r = Math.round(v * 10) / 10; return r === 0 ? "–" : r + "%";
  };
  const noZero = s => String(s).replace(/(^|[^\d.])0(?:\.0+)?%/g, "$1–");
  const svg = (path, cls) => `<svg class="${cls || ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  // Banker's rounding (round half to even) matches authoritative report PDF arithmetic
  const rEven = x => {
    const f = Math.floor(x), d = x - f;
    if (Math.abs(d - 0.5) < 1e-9) return f % 2 === 0 ? f : f + 1;
    return Math.round(x);
  };

  const T = REPORT.text, PPL = REPORT.people, AREAS = REPORT.areas, KEYS = ["a", "b"], TH = REPORT.theme;
  const areaSums = k => [0, 1, 2].map(i => REPORT.stones[k].slice(i * 4, i * 4 + 4).reduce((x, y) => x + y, 0));
  const count4 = k => REPORT.stones[k].filter(v => v === 4).length;
  const levelOf = v => (v >= 4 ? 4 : v <= 1 ? 1 : Math.round(v));

  /* ---------------------------------------------------------------- gender-based character selection & enforcement
     Relationship type + user-selected genders work together to determine character illustrations.
     Fixed family/romantic pairs enforce exact valid gender combinations; Friends, Best Friends,
     Business Partners & Teammates dynamically support MF, FM, MM and FF. */
  const GENDER_COMBOS = [
    { code: "MF", short: "♂·♀", full: "Male · Female", gA: "male",   gB: "female" },
    { code: "FM", short: "♀·♂", full: "Female · Male", gA: "female", gB: "male" },
    { code: "MM", short: "♂·♂", full: "Male · Male",   gA: "male",   gB: "male" },
    { code: "FF", short: "♀·♀", full: "Female · Female", gA: "female", gB: "female" }
  ];
  const TYPE_GENDER_RULES = {
    "boyfriend & girlfriend":  { slug: "01_Boyfriend_Girlfriend", selectable: false, allowed: ["MF"], def: "MF" },
    "girlfriend & boyfriend":  { slug: "01_Boyfriend_Girlfriend", selectable: false, allowed: ["FM"], def: "FM" },
    "husband & wife":          { slug: "02_Husband_Wife",         selectable: false, allowed: ["MF"], def: "MF" },
    "wife & husband":          { slug: "02_Husband_Wife",         selectable: false, allowed: ["FM"], def: "FM" },
    "mother & father":         { slug: "02_Husband_Wife",         selectable: false, allowed: ["FM"], def: "FM" },
    "father & mother":         { slug: "02_Husband_Wife",         selectable: false, allowed: ["MF"], def: "MF" },
    "brother & sister":        { slug: "03_Brother_Sister",       selectable: false, allowed: ["MF"], def: "MF" },
    "sister & brother":        { slug: "03_Brother_Sister",       selectable: false, allowed: ["FM"], def: "FM" },
    "brother & brother":       { slug: "04_Brother_Brother",      selectable: false, allowed: ["MM"], def: "MM" },
    "sister & sister":         { slug: "05_Sister_Sister",        selectable: false, allowed: ["FF"], def: "FF" },
    "mother & daughter":       { slug: "06_Mother_Daughter",      selectable: false, allowed: ["FF"], def: "FF" },
    "mother & son":            { slug: "07_Mother_Son",           selectable: false, allowed: ["FM"], def: "FM" },
    "father & daughter":       { slug: "08_Father_Daughter",      selectable: false, allowed: ["MF"], def: "MF" },
    "father & son":            { slug: "09_Father_Son",           selectable: false, allowed: ["MM"], def: "MM" },
    "best friends":            { slug: "10_Best_Friends",         selectable: true,  allowed: ["FF", "MM", "MF", "FM"], def: "FF" },
    "friends":                 { slug: "11_Friends",              selectable: true,  allowed: ["MM", "FF", "MF", "FM"], def: "MM" },
    "business partners":       { slug: "12_Business_Partners",    selectable: true,  allowed: ["MM", "FF", "MF", "FM"], def: "MM" },
    "teammates":               { slug: "13_Teammates",            selectable: true,  allowed: ["FM", "MF", "MM", "FF"], def: "FM" }
  };

  function normGenderChar(g) {
    if (!g) return "";
    const s = String(g).trim().toLowerCase();
    if (s === "m" || s === "male" || s === "man" || s === "boy") return "M";
    if (s === "f" || s === "female" || s === "woman" || s === "girl") return "F";
    return "";
  }
  function getGenderRule() {
    const normType = String(REPORT.type || "").trim().toLowerCase().replace(/\s*[–—-]\s*/g, " & ");
    if (TYPE_GENDER_RULES[normType]) return TYPE_GENDER_RULES[normType];
    const bySlug = Object.values(TYPE_GENDER_RULES).find(r => r.slug === REPORT.slug);
    return bySlug || { slug: REPORT.slug || "11_Friends", selectable: true, allowed: ["MF", "FM", "MM", "FF"], def: "MF" };
  }
  function resolveValidGenderCode(requestedCode) {
    const rule = getGenderRule();
    const clean = String(requestedCode || "").toUpperCase();
    if (rule.allowed.includes(clean)) return clean;
    return rule.def;
  }
  function variantPathsFor(slug, code) {
    const custom = REPORT.characterVariants && REPORT.characterVariants[code];
    if (custom) return custom;
    const base = `assets/images/${slug}/variants/${code}`;
    return {
      code,
      coverPair: `${base}/cover_pair.png`,
      harmony: `${base}/scene_harmony.png`,
      bustA: `${base}/person_a_bust.png`,
      bustB: `${base}/person_b_bust.png`,
      faceA: `${base}/person_a_face.png`,
      faceB: `${base}/person_b_face.png`,
      seatedA: `${base}/person_a_seated.png`,
      seatedB: `${base}/person_b_seated.png`,
      scenes: [
        `${base}/scene_talking.png`,
        `${base}/scene_disagreements.png`,
        `${base}/scene_care.png`
      ]
    };
  }

  let activeGenderCode = "";
  function detectInitialGenderCode() {
    try {
      const sp = new URLSearchParams(window.location.search);
      const qCode = (sp.get("genders") || "").toUpperCase();
      if (qCode.length === 2) return resolveValidGenderCode(qCode);
      const qA = normGenderChar(sp.get("genderA")), qB = normGenderChar(sp.get("genderB"));
      if (qA && qB) return resolveValidGenderCode(qA + qB);
    } catch (_) {}
    if (REPORT.selectedGenderCode) return resolveValidGenderCode(REPORT.selectedGenderCode);
    const pA = normGenderChar(PPL.a && PPL.a.gender), pB = normGenderChar(PPL.b && PPL.b.gender);
    if (pA && pB) return resolveValidGenderCode(pA + pB);
    return getGenderRule().def;
  }

  function applyGenderCodeToData(code) {
    const rule = getGenderRule();
    const valid = resolveValidGenderCode(code);
    activeGenderCode = valid;
    const vp = variantPathsFor(rule.slug, valid);
    REPORT.images.coverPair = vp.coverPair;
    REPORT.images.harmony = vp.harmony;
    PPL.a.gender = valid[0] === "M" ? "male" : "female";
    PPL.b.gender = valid[1] === "M" ? "male" : "female";
    PPL.a.his = valid[0] === "M" ? "his" : "her";
    PPL.b.his = valid[1] === "M" ? "his" : "her";
    PPL.a.bust = vp.bustA; PPL.b.bust = vp.bustB;
    PPL.a.face = vp.faceA; PPL.b.face = vp.faceB;
    PPL.a.seated = vp.seatedA; PPL.b.seated = vp.seatedB;
    AREAS.forEach((ar, i) => { if (vp.scenes[i]) ar.scene = vp.scenes[i]; });
    return valid;
  }

  function syncGenderDomImages() {
    document.querySelectorAll('img[data-char-slot="cover"]').forEach(im => (im.src = REPORT.images.coverPair));
    document.querySelectorAll('img[data-char-slot="harmony"]').forEach(im => (im.src = REPORT.images.harmony));
    document.querySelectorAll('img[data-char-slot="bust-a"]').forEach(im => (im.src = PPL.a.bust));
    document.querySelectorAll('img[data-char-slot="bust-b"]').forEach(im => (im.src = PPL.b.bust));
    document.querySelectorAll('img[data-char-slot="face-a"]').forEach(im => (im.src = PPL.a.face));
    document.querySelectorAll('img[data-char-slot="face-b"]').forEach(im => (im.src = PPL.b.face));
    document.querySelectorAll('img[data-char-slot="seated-a"]').forEach(im => (im.src = PPL.a.seated));
    document.querySelectorAll('img[data-char-slot="seated-b"]').forEach(im => (im.src = PPL.b.seated));
    AREAS.forEach((ar, i) => {
      document.querySelectorAll(`img[data-char-slot="scene-${i}"]`).forEach(im => (im.src = ar.scene));
    });
  }

  function renderGenderBar() {
    const topbar = document.querySelector(".topbar");
    if (!topbar) return;
    let barEl = document.getElementById("gender-bar");
    if (!barEl) {
      barEl = document.createElement("div");
      barEl.id = "gender-bar";
      barEl.className = "gender-bar";
      barEl.setAttribute("role", "group");
      barEl.setAttribute("aria-label", "Character gender selection");
      const navEl = document.getElementById("nav");
      topbar.insertBefore(barEl, navEl || null);
    }
    const rule = getGenderRule();
    if (rule.selectable) {
      barEl.innerHTML = `<span class="g-lbl">Genders:</span>` + GENDER_COMBOS.map(c => {
        const on = c.code === activeGenderCode;
        return `<button type="button" class="g-btn${on ? " on" : ""}" data-gcode="${c.code}" aria-pressed="${on}" title="${esc(PPL.a.name)}: ${c.gA}, ${esc(PPL.b.name)}: ${c.gB}"><span>${c.short}</span><span class="g-full">${c.full}</span></button>`;
      }).join("");
      barEl.querySelectorAll("button.g-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const next = btn.getAttribute("data-gcode");
          window.setReportGenders(next[0], next[1]);
        });
      });
    } else {
      const cur = GENDER_COMBOS.find(c => c.code === activeGenderCode) || GENDER_COMBOS[0];
      barEl.innerHTML = `<span class="g-lbl">Genders:</span>`
        + `<span class="g-lock-pill" title="Automatically locked by ${esc(REPORT.type)}">${svg(ICON.lock)}<span>${cur.short} ${cur.full}</span></span>`;
    }
  }

  window.setReportGenders = function (genderA, genderB) {
    const code = (normGenderChar(genderA) || "M") + (normGenderChar(genderB) || "F");
    const valid = applyGenderCodeToData(code);
    syncGenderDomImages();
    renderGenderBar();
    if (POOL) refreshPool();
    try {
      const u = new URL(window.location.href);
      if (getGenderRule().selectable) u.searchParams.set("genders", valid);
      else u.searchParams.delete("genders");
      window.history.replaceState(null, "", u.toString());
    } catch (_) {}
    return valid;
  };
  window.getReportGenderState = function () {
    const rule = getGenderRule();
    return {
      relationshipType: REPORT.type,
      genderSelectable: rule.selectable,
      allowedCodes: rule.allowed.slice(),
      activeCode: activeGenderCode,
      personA: PPL.a.gender,
      personB: PPL.b.gender
    };
  };

  applyGenderCodeToData(detectInitialGenderCode());

  /* ---------------------------------------------------------------- line bank (wording from Line_Bank.pdf)
     {A} = the person the line is about, {B} = the other person, {S} = B’s main style,
     {H} / {L} = the person with the higher / lower %. Bands: 0–30, 31–45, 46–60, 61–75, 76–90, 91–100. */
  const LINES = {
    talk: [
      "{A} mostly talks and listens in {A}’s own way. Trying {B}’s style more often will help {B} feel more understood.",
      "{A} sometimes talks in {B}’s style. A few more of these moments will make conversations feel easier for {B}.",
      "{A} talks in {B}’s style about half the time, so {B} often feels heard.",
      "{A} often talks in {B}’s style, which helps {B} feel understood in most conversations.",
      "{A} usually talks in {B}’s style, so {B} feels heard and understood most of the time.",
      "{A} almost always talks in {B}’s style. {B} is likely to feel deeply understood."
    ],
    conflict: [
      "When there’s a disagreement, {A} mostly responds in {A}’s own way. Trying {B}’s style will help disagreements settle sooner.",
      "In disagreements, {A} sometimes responds in {B}’s style. A little more of this will help you find common ground faster.",
      "In disagreements, {A} responds in {B}’s style about half the time, which helps many disagreements settle well.",
      "In disagreements, {A} often responds in {B}’s style, so most disagreements calm down well.",
      "In disagreements, {A} usually responds in {B}’s style, which helps {B} feel respected even when you don’t agree.",
      "In disagreements, {A} almost always responds in {B}’s style. That’s a real strength when things get tense."
    ],
    care: [
      "{A} mostly shows care in {A}’s own way. Showing it in {B}’s style will help {B} feel it more.",
      "{A} sometimes shows care in {B}’s style. A few more of these moments will help {B} feel cared for.",
      "{A} shows care in {B}’s style about half the time, so {B} often feels it.",
      "{A} often shows care in {B}’s style, so {B} usually feels supported.",
      "{A} usually shows care in exactly the way {B} values most.",
      "{A} almost always shows care in {B}’s style, so {B} feels truly cared for."
    ],
    support: [
      "{A} mostly supports {B} in {A}’s own way. Supporting {B} in {B}’s style will make it more noticeable to {B}.",
      "{A} sometimes supports {B} in {B}’s style. A few more of these moments will help {B} feel backed up.",
      "{A} supports {B} in {B}’s style about half the time, so {B} often feels backed up.",
      "{A} often supports {B} in {B}’s style, so {B} usually feels valued at work.",
      "{A} usually supports and appreciates {B} in the way {B} values most.",
      "{A} almost always supports {B} in {B}’s style, so {B} feels fully backed up."
    ],
    together: [
      "You each mostly use your own style here. This is the area with the most room to learn from each other.",
      "You meet in each other’s style now and then. Small changes will show quickly here.",
      "You meet in each other’s style about half the time.",
      "You meet in each other’s style more often than not.",
      "You meet in each other’s style most of the time. This area is a strength.",
      "You almost always meet in each other’s style. This area is a real strength."
    ],
    gap: [
      "You’re reaching towards each other about equally here.",
      "{H} is reaching a little more here. When {L} meets {H} halfway, it will feel even more balanced.",
      "Right now {H} is doing most of the reaching here. Small steps from {L} will make this area feel easier for both of you."
    ],
    overallTogether: [
      "You each mostly respond in your own style for now. That’s a starting point, and every small step towards each other will show.",
      "You’re starting to meet each other in each other’s style, a few moments at a time.",
      "You meet each other in each other’s style about half the time.",
      "You meet each other in each other’s style more often than not.",
      "You meet each other in each other’s style most of the time.",
      "You almost always meet each other in each other’s style."
    ],
    overallPerson: [
      "{A} mostly answers in {A}’s own style, which is natural. Trying {B}’s style in one area is a good first step.",
      "{A} answers in {B}’s style in some moments. A few more will make a clear difference.",
      "{A} answers in {B}’s style about half the time.",
      "{A} answers in {B}’s style more often than not.",
      "{A} answers in {B}’s style most of the time, a real effort to meet {B} halfway.",
      "{A} almost always answers in {B}’s style."
    ],
    barLabel: "How often {A} answered in {B}’s style ({S})",
    tip: {
      Assertive: "Be clear and brief, and end with a next step.",
      Emotional: "Name the feeling first, then talk about solutions.",
      Thoughtful: "Give {B} time, ask gently, and check in later.",
      Logical: "Share your reasons calmly and clearly."
    }
  };
  const lineBand = v => (v <= 30 ? 0 : v <= 45 ? 1 : v <= 60 ? 2 : v <= 75 ? 3 : v <= 90 ? 4 : 5);
  const otherKey = k => (k === "a" ? "b" : "a");
  const lineNames = k => ({ A: PPL[k].name, B: PPL[otherKey(k)].name, S: PPL[otherKey(k)].style });
  const areaKind = (ar, i) => (/talk/i.test(ar.name) ? "talk" : /disagree|conflict/i.test(ar.name) ? "conflict"
    : /apprec/i.test(ar.name) ? "support" : /care/i.test(ar.name) ? "care" : ["talk", "conflict", "care"][i] || "care");
  const barLabel = k => fill(LINES.barLabel, lineNames(k));
  const personLine = (ar, i, k) => fill(LINES[areaKind(ar, i)][lineBand(ar[k])], lineNames(k));
  const togetherLine = ar => LINES.together[lineBand(ar.together)];
  const gapLine = ar => {
    const gap = Math.abs(ar.a - ar.b), hi = ar.a >= ar.b ? "a" : "b";
    return fill(LINES.gap[gap < 15 ? 0 : gap < 35 ? 1 : 2], { H: PPL[hi].name, L: PPL[otherKey(hi)].name });
  };
  const overallTogetherLine = () => LINES.overallTogether[lineBand(REPORT.overall.together)];
  const overallPersonLine = k => fill(LINES.overallPerson[lineBand(REPORT.overall[k])], lineNames(k));
  // The lowest area has the lowest "together" % (a tie goes to the earlier area, matching "Room to grow").
  // Its tip is for the person with the lower % there, based on the other person's main style.
  function lowestArea() {
    let index = 0;
    AREAS.forEach((ar, i) => { if (ar.together < AREAS[index].together) index = i; });
    const ar = AREAS[index];
    const k = ar.a < ar.b ? "a" : ar.b < ar.a ? "b" : REPORT.overall.a <= REPORT.overall.b ? "a" : "b";
    const tpl = LINES.tip[PPL[otherKey(k)].style];
    return { index, k, tip: tpl ? fill(tpl, lineNames(k)) : "" };
  }

  /* ---------------------------------------------------------------- Teammates line pool (Line Pool: Teammates PDF)
     Used only when REPORT.pool is "teammates"; every other report keeps the wording above.
     Scores come from the answers: area = points ÷ 16, overall = points ÷ 48 (so 25% to 100%), together = the
     average of you both, heart = the average of the two overall scores as a whole number.
     Every % is rounded to a whole number before its range is looked up. */
  const POOL = REPORT.pool === "teammates" ? "teammates" : "";
  const TEAM = {
    levels: ["Getting started", "Starting to connect", "Growing together", "Mostly in tune", "In sync"],
    headline: [
      "You’re early in learning each other’s working style as teammates, and every good team starts here.",
      "You’re starting to work in each other’s style as teammates.",
      "You’re growing as teammates, meeting each other’s style more often than not.",
      "You’re mostly in tune as teammates: you usually work in a way the other appreciates.",
      "You’re in sync as teammates: you understand each other’s working style almost every time."
    ],
    chips: {
      best: { label: "YOU CONNECT BEST IN", c: "c1", ic: "sun" },
      next: { label: "YOUR NEXT STEP TOGETHER", c: "c2", ic: "sprout" },
      well: { label: "GOING WELL", c: "c3", ic: "sparkle" }
    },
    flowers: {
      Assertive: { leads: "leads with action", strength: "Gets things moving when everyone is stuck", need: "people are clear and direct", gift: "energy and decisiveness" },
      Emotional: { leads: "leads with heart", strength: "Notices how everyone is really feeling", need: "feelings are heard first", gift: "warmth and openness" },
      Thoughtful: { leads: "leads with calm", strength: "Keeps the peace and remembers the small things", need: "people are patient and gentle", gift: "calm and kindness" },
      Logical: { leads: "leads with reason", strength: "Sees the full picture and plans well", need: "things are explained with reasons", gift: "clear thinking and good plans" }
    },
    areaLine: {
      talk: [
        "Teammates often communicate differently. Agreeing how you’ll share updates is a great first step.",
        "You’re starting to understand how your teammate likes to share ideas and feedback.",
        "You often understand each other in stand-ups, chats and quick calls.",
        "You usually communicate in a way your teammate finds clear and easy.",
        "You understand each other quickly. Work flows smoothly between you."
      ],
      conflict: [
        "Teammates will disagree about priorities and approach. Talking it through openly is the first step.",
        "You’re starting to handle work disagreements without tension lingering.",
        "You often settle disagreements well and get back on track quickly.",
        "Most disagreements end with a plan you’re both happy with.",
        "You handle disagreements constructively, and they make your work better."
      ],
      support: [
        "You both work hard. Recognising each other’s effort in the right way is the next step.",
        "You’re starting to notice what kind of support your teammate values.",
        "Your support often reaches your teammate in the way they value.",
        "You usually back and appreciate your teammate in their style.",
        "You support and appreciate each other in exactly the way each of you values."
      ]
    },
    // tips[area][the other person's main style] = [own score 25–55%, 56–85%, 86–100%]
    tips: {
      talk: {
        Assertive: ["Get to the point first, then add detail if asked.", "End your chats with one clear next step.", "Keep being clear and brief; it’s working."],
        Emotional: ["Ask how they feel before sharing your view.", "Name the feeling you hear: “That sounds frustrating.”", "Keep making room for feelings; it’s noticed."],
        Thoughtful: ["Slow down and leave pauses so they can speak.", "Ask one gentle question and wait for the answer.", "Keep giving them time; it helps them open up."],
        Logical: ["Give the reason behind what you say.", "Share facts and examples, not just impressions.", "Keep explaining your thinking; they value it."]
      },
      conflict: {
        Assertive: ["Say clearly what you want, instead of hinting.", "Agree on a decision and a deadline together.", "Keep being direct and fair; it settles things fast."],
        Emotional: ["Acknowledge their feelings before arguing your point.", "Start with “I can see this matters to you.”", "Keep putting feelings first; it calms things down."],
        Thoughtful: ["Lower your voice and give them time to respond.", "Suggest a short break, then come back calmly.", "Keep your calm approach; it helps them feel safe."],
        Logical: ["Explain your reasons instead of repeating your point.", "Look at the options together, pros and cons.", "Keep being reasonable; they trust it."]
      },
      support: {
        Assertive: ["Recognise their results, briefly and directly.", "Help clear their blockers so they can move fast.", "Keep backing their decisions."],
        Emotional: ["Thank them warmly, and say how their work helped.", "Check in on how they’re doing, not just the task.", "Keep appreciating them personally."],
        Thoughtful: ["Thank them privately for steady, behind-the-scenes work.", "Offer help quietly, before they have to ask.", "Keep your thoughtful support."],
        Logical: ["Appreciate the quality of their thinking, with specifics.", "Give them clear information and time to do it well.", "Keep giving clear, specific recognition."]
      }
    },
    didYouKnow: [
      "Even the best teams start out learning each other’s habits. Try this: share one ‘how I like to work’ tip each this week.",
      "Most teams find their rhythm only after a few projects together. Try this: after your next task, ask each other ‘What worked well for us?’",
      "Knowing each other’s working style can save a lot of back-and-forth messages. Try this: agree on one thing to keep and one thing to change in how you work.",
      "Saying ‘thank you’ takes about two seconds, and it’s one of the easiest ways to brighten a teammate’s day. Try this: thank each other for one specific thing this Friday.",
      "Great pairs work like a relay team: the baton rarely drops. Try this: celebrate one shared win together this week."
    ],
    mountainsLede: "The goal is the flag at the top of each mountain. You climb together: wherever you are now, every step towards each other’s style takes you both higher.",
    opening: [
      "This mountain has the most room to grow, and that’s a good thing: small steps here will feel big.",
      "You’re well on your way up this one. Keep climbing side by side.",
      "You’re close to the top here. The aim now is to stay there together."
    ],
    // climb[area] = rows for together 25–55%, 56–85%, 86–100%: [step 1, step 2, try this week]
    climb: {
      talk: [
        ["Agree on one channel and a fixed time for daily updates.", "Repeat back the key point before replying, so nothing gets lost.", "Agree on one channel and time for quick daily updates."],
        ["Confirm next steps at the end of each discussion.", "Ask questions before giving feedback.", "Ask your teammate: “How do you like to get feedback?”"],
        ["Share how you two like to work with new teammates.", "Keep a quick weekly catch-up, even when things are smooth.", "Keep communicating the way you do; it works."]
      ],
      conflict: [
        ["Write down both views before deciding.", "Agree that you can disagree about the work, never the person.", "When you disagree, write down both options and their pros and cons."],
        ["Keep disagreements about the work, never the person.", "Agree on who decides when you can’t agree.", "Ask “What would make this work for you?” before pushing your view."],
        ["Use your disagreements to test ideas; you do it well.", "Share with the wider team how you two settle things.", "Keep disagreeing openly and kindly."]
      ],
      support: [
        ["Notice one thing your teammate did well each day.", "Offer help on small tasks before big deadlines.", "Ask: “What’s one thing I could do that would help your work?”"],
        ["Offer help before a deadline, not after.", "Thank your teammate in front of others.", "Give one specific shout-out this week for your teammate’s work."],
        ["Keep recognising each other in team meetings.", "Pass the habit on: thank others in the team too.", "Keep celebrating each other’s wins."]
      ]
    },
    whereToStart: [
      "Every mountain is close to the top. Keep doing what you’re doing, and check in again in a few months.",
      "Your three mountains are at a similar height. Pick the one that matters most to you both right now, and climb it together.",
      "<b>Start with {AREA}.</b> It has the most room to grow, so small steps there will make the biggest difference, and they’ll lift the other two areas as well."
    ],
    balanceLede: "Each seesaw tips towards the person who is doing more of the reaching in that area. A level seesaw means you both reach equally.",
    balanceLabel: ["perfectly balanced", "nearly balanced", "leaning towards {H}", "mostly {H} reaching"],
    scoreSentence: [
      "This is where small steps will make the biggest difference for you both.",
      "You already meet in the middle here quite often.",
      "This is one of your strongest areas."
    ],
    balanceEven: "You reach towards each other {EQ} here, so neither of you is carrying this area alone. {A} brings {GA}, {B} brings {GB}, and you’re both making room for the other’s way {WHERE}. To keep it balanced, notice when the other adjusts for you, and say so.",
    balanceLean: "{H} is doing {MORE} of the reaching {WHERE}, often answering the way {L} likes: {LIKES}. {L} tend{LS} to stay closer to {LHIS} own {LSTYLE} way here, which is completely natural. To level the seesaw, {L} can {STEP}; {H}’s {HSTYLE} style values {VALUES}. One or two moments like that will make this area feel more even.",
    where: { talk: "in conversations", conflict: "when you don’t agree", support: "in how you back each other up at work" },
    style: {
      Assertive: { gift: "energy and decisiveness", likes: "clear, direct and to the point", values: "clarity and action", step: "be clear and brief, and end with a next step." },
      Emotional: { gift: "warmth and openness", likes: "warm and feelings-first", values: "warmth and being heard", step: "name the feeling first, then talk about solutions." },
      Thoughtful: { gift: "calm and kindness", likes: "gentle and patient", values: "patience and kindness", step: "give {NAME} time, ask gently, and check in later." },
      Logical: { gift: "clear thinking and good plans", likes: "calm and well reasoned", values: "reasons and fairness", step: "share your reasons calmly and clearly." }
    },
    footstepsLede: "Each stone is one of your answers. Bigger, deeper-purple stones = closer to the other person’s style; small, pale stones = you answered in your own comfortable way.",
    footVerb: { talk: ["talks and listens", "talk and listen"], conflict: ["handles disagreements", "handle disagreements"], support: ["offers support and thanks", "offer support and thanks"] },
    scoreNote: "<b>How the scores work:</b> in Section 2, each answer that fits the other person’s style earns the most points, and an answer in your own style earns the fewest. Each area score shows how much of the top score you reached, so it can go from 25% to 100%. ‘Together’ is the average of you both, and ‘Overall’ uses all your answers. Style flowers come from your Section 1 choices."
  };
  const KEY_ORDER = ["Assertive", "Emotional", "Thoughtful", "Logical"];
  const band5 = v => { const r = Math.round(v); return r <= 40 ? 0 : r <= 55 ? 1 : r <= 70 ? 2 : r <= 85 ? 3 : 4; };
  const band3 = v => { const r = Math.round(v); return r <= 55 ? 0 : r <= 85 ? 1 : 2; };
  const diffBand = d => { const r = Math.round(d); return r === 0 ? 0 : r <= 10 ? 1 : r <= 25 ? 2 : 3; };
  const howOften = n => (n >= 10 ? "almost always" : n >= 7 ? "usually" : n >= 5 ? "often" : n >= 3 ? "sometimes" : "now and then");
  const picksOf = k => Object.fromEntries(STYLES.map(st => [st, Math.round((REPORT.styles[k][st] || 0) / 100 * (REPORT.picksTotal || 8))]));
  // Petal %: (times picked in Section 1 + 1) ÷ 12, so no style shows 0%. Shown with two decimals (41.67%).
  const petalPct = (k, st) => (POOL ? (picksOf(k)[st] + 1) / 12 * 100 : REPORT.styles[k][st]);
  const splitTitle = s => { const i = s.lastIndexOf(" "); return i > 0 ? [s.slice(0, i + 1), s.slice(i + 1)] : ["", s]; };
  function pro(k) {
    const g = String(PPL[k].gender || "").toLowerCase(), h = String(PPL[k].his || "").toLowerCase();
    if (g === "male" || (!g && h === "his")) return { He: "He", he: "he", His: "His", his: "his", s: "s" };
    if (g === "female" || (!g && h === "her")) return { He: "She", he: "she", His: "Her", his: "her", s: "s" };
    return { He: "They", he: "they", His: "Their", his: "their", s: "" };
  }
  if (POOL) {
    const area = k => areaSums(k).map(x => x / 16 * 100), A = area("a"), B = area("b");
    AREAS.forEach((ar, i) => { ar.a = A[i]; ar.b = B[i]; ar.together = (A[i] + B[i]) / 2; });
    const overall = k => REPORT.stones[k].reduce((x, y) => x + y, 0) / 48 * 100;
    REPORT.overall.a = overall("a"); REPORT.overall.b = overall("b");
    REPORT.overall.together = Math.round((REPORT.overall.a + REPORT.overall.b) / 2);
  }
  const stepFor = k => TEAM.style[PPL[k].style].step.replace("{NAME}", PPL[k].name);
  const higherOf = ar => (ar.a >= ar.b ? "a" : "b");
  const balanceLabel = ar => fill(TEAM.balanceLabel[diffBand(Math.abs(ar.a - ar.b))], { H: PPL[higherOf(ar)].name });
  const teamTip = (ar, i, k) => TEAM.tips[areaKind(ar, i)][PPL[otherKey(k)].style][band3(ar[k])];
  function teamChips() {
    const tg = AREAS.map(ar => ar.together), max = Math.max(...tg), min = Math.min(...tg);
    const hi = tg.indexOf(max), lo = tg.indexOf(min), flat = max - min < 5;
    return AREAS.map((ar, i) => {
      const c = TEAM.chips[flat ? "well" : i === hi ? "best" : i === lo ? "next" : "well"];
      return { c: c.c, ic: ICON[c.ic], label: c.label, value: ar.name };
    });
  }
  function whereToStart() {
    const tg = AREAS.map(ar => ar.together), min = Math.min(...tg);
    if (tg.every(v => Math.round(v) >= 86)) return esc(TEAM.whereToStart[0]);
    if (Math.max(...tg) - min < 5) return esc(TEAM.whereToStart[1]);
    return TEAM.whereToStart[2].replace("{AREA}", esc(AREAS[tg.indexOf(min)].name));
  }
  function teamReading(k) {
    const p = PPL[k], st = p.style, F = TEAM.flowers[st], pk = picksOf(k), n = pk[st], pr = pro(k);
    const how = n >= 6 ? "strongly" : n >= 4 ? "mostly" : "a blend, leaning towards";
    const rest = KEY_ORDER.filter(x => x !== st).sort((x, y) => pk[y] - pk[x] || KEY_ORDER.indexOf(x) - KEY_ORDER.indexOf(y));
    const [n1, n2, n3] = rest.map(x => pk[x]), art = x => (x === "Assertive" || x === "Emotional" ? "an" : "a");
    const side = n1 === n3 ? "with a little of every other style"
      : n1 === n2 ? `with <b>${rest[0]}</b> and <b>${rest[1]}</b> sides`
      : `with ${art(rest[0])} <b>${rest[0]}</b> side`;
    return `<b>${esc(p.name)}</b> ${F.leads}: ${how} <b>${st}</b>, ${side}. ${F.strength}. ${pr.He} feel${pr.s} most understood when ${F.need}, and bring${pr.s} ${F.gift} to your teamwork.`;
  }
  // Page 3 card (Teammates): heading and area line on top; the picture with the hanging overlap diagram on the
  // left; each person's bar (name in a hand-drawn oval, exact %) with their line, then a tip for each person.
  // The line under each bar keeps the Line Bank wording, picked from the 0–100% answer scale as before.
  const lineBankScore = (k, i) => rEven((areaSums(k)[i] - 4) / 12 * 100);
  const teamPersonLine = (ar, i, k) => fill(LINES[areaKind(ar, i)][lineBand(lineBankScore(k, i))], lineNames(k));
  const OVAL = {
    a: "M20 8C46 1 92 2 110 13C121 21 110 37 72 40C38 42 6 35 5 22C4 12 24 5 52 4",
    b: "M16 11C40 2 88 1 108 10C120 17 114 35 76 39C40 43 8 37 6 24C4 13 20 6 46 5"
  };
  const hangBar = (ar, i, k) => `<div class="bar ${k}"><span class="who"><svg viewBox="0 0 120 44" preserveAspectRatio="none" aria-hidden="true"><path d="${OVAL[k]}"/></svg>${esc(PPL[k].name)}</span><i><b style="width:${Math.max(0, Math.min(100, ar[k]))}%"></b></i><em>${pc(ar[k])}</em></div>
            <p class="bar-line">${esc(teamPersonLine(ar, i, k))}</p>`;
  function teamOverlapCard(ar, i) {
    return `<article class="area hang" data-i="${i}">
        <div class="area-head"><img class="icon" src="${esc(ar.icon)}" alt="" width="64" height="64"><div><h3>${esc(ar.name)}</h3><span class="status">${esc(TEAM.levels[band5(ar.together)])}</span></div></div>
        <p class="area-line">${esc(TEAM.areaLine[areaKind(ar, i)][band5(ar.together)])}</p>
        <div class="area-visual">
          <div class="scene-frame"><img class="scene" data-char-slot="scene-${i}" src="${esc(ar.scene)}" alt="${esc(ar.sceneAlt)}" width="480" height="320"></div>
          ${hangVenn(ar, i)}
        </div>
        <div class="area-body">
          <div class="bars">${KEYS.map(k => hangBar(ar, i, k)).join("")}</div>
          <div class="tips">${KEYS.map(k => `<p class="area-tip"><b>Tip for ${esc(PPL[k].name)}:</b> ${esc(teamTip(ar, i, k))}</p>`).join("")}</div>
        </div>
      </article>`;
  }
  // The text under each mountain; its "try this week" idea is listed under "Where to start" instead.
  function teamClimb(ar, i) {
    const b = band3(ar.together), [s1, s2] = TEAM.climb[areaKind(ar, i)][b];
    return `<p class="climb">${esc(TEAM.opening[b])} ${esc(s1)} ${esc(s2)}</p>`;
  }
  const teamTryThisWeek = (ar, i) => TEAM.climb[areaKind(ar, i)][band3(ar.together)][2];
  function teamBalance(ar, i) {
    const kind = areaKind(ar, i), db = diffBand(Math.abs(ar.a - ar.b)), hk = higherOf(ar), lk = otherKey(hk), H = PPL[hk], L = PPL[lk];
    const main = db <= 1
      ? fill(TEAM.balanceEven, { EQ: db === 0 ? "equally" : "almost equally", A: esc(PPL.a.name), B: esc(PPL.b.name), GA: TEAM.style[PPL.a.style].gift, GB: TEAM.style[PPL.b.style].gift, WHERE: TEAM.where[kind] })
      : fill(TEAM.balanceLean, { H: esc(H.name), L: esc(L.name), MORE: db === 3 ? "most" : "a little more", WHERE: TEAM.where[kind], LIKES: TEAM.style[L.style].likes,
          LS: pro(lk).s, LHIS: pro(lk).his, LSTYLE: L.style, STEP: esc(stepFor(hk)).replace(/\.$/, ""), HSTYLE: H.style, VALUES: TEAM.style[H.style].values });
    return `<b>${esc(ar.name)}: ${esc(balanceLabel(ar))}.</b> ${TEAM.scoreSentence[band3(ar.together)]} ${main}`;
  }
  function teamFootsteps() {
    const out = KEYS.map(k => {
      const o = otherKey(k), p = PPL[k], q = PPL[o], st = REPORT.stones[k], pr = pro(k);
      const sc = AREAS.map(ar => ar[k]), hiI = sc.indexOf(Math.max(...sc));
      const ones = [0, 1, 2].map(i => st.slice(i * 4, i * 4 + 4).filter(v => v === 1).length), loI = ones.indexOf(Math.max(...ones));
      const verb = TEAM.footVerb[areaKind(AREAS[hiI], hiI)][pr.s ? 0 : 1];
      const comfort = Math.max(...ones) > 0
        ? `${pr.His} comfort-zone moments came mostly in ${esc(AREAS[loI].name)}, which is the most natural place to stretch next.`
        : `${pr.He} never fell back on ${pr.his} own style, which shows real effort.`;
      return `<b>${esc(p.name)}</b> ${howOften(st.filter(v => v >= 3).length)} met ${esc(q.name)}’s style or came close to it. ${pr.His} biggest steps were in <b>${esc(AREAS[hiI].name)}</b>, where ${pr.he} usually ${verb} the way ${esc(q.name)} likes. ${comfort} A simple next step: ${esc(stepFor(o))}`;
    });
    const fours = (REPORT.stones.a.filter(v => v === 4).length + REPORT.stones.b.filter(v => v === 4).length) / 2;
    out.push(`<b>Together:</b> you ${howOften(Math.round(fours))} answered fully in each other’s style. Pale stones aren’t mistakes; they simply show where a small stretch would mean the most.`);
    return out;
  }
  // Sentences with he/she change when the genders are switched, so they are redrawn in place.
  function refreshPool() {
    const put = (sel, items) => document.querySelectorAll(sel).forEach(el => (el.innerHTML = items.map(h => `<li><span>${h}</span></li>`).join("")));
    put('[data-pool="reading"]', KEYS.map(teamReading));
    put('[data-pool="balance"]', AREAS.map((ar, i) => teamBalance(ar, i)));
    put('[data-pool="footsteps"]', teamFootsteps());
  }

  /* ---------------------------------------------------------------- data self-check */
  function checkData() {
    const out = [], totals = {};
    for (const k of KEYS) {
      const p = PPL[k], st = REPORT.stones[k];
      if (st.length !== 12 || st.some(v => ![1, 2, 3, 4].includes(v)))
        out.push(`${p.name}: stepping stones must be 12 answers, each 1, 2, 3 or 4.`);
      const sums = areaSums(k); totals[k] = sums.reduce((x, y) => x + y, 0);
      if (!POOL) {                                 // pool scores are worked out from the stones, so they always agree
        AREAS.forEach((ar, i) => {
          const c = rEven((sums[i] - 4) / 12 * 100);
          if (Math.abs(c - ar[k]) > 1) out.push(`${p.name}, ${ar.name}: shown as ${ar[k]}%, but stones give ${c}%.`);
        });
        const ov = rEven((totals[k] - 12) / 36 * 100);
        if (Math.abs(ov - REPORT.overall[k]) > 1) out.push(`${p.name}: overall shown as ${REPORT.overall[k]}%, but stones give ${ov}%.`);
      }
      if (count4(k) !== REPORT.inStyle[k])
        out.push(`${p.name}: “answers in the other’s style” shown as ${REPORT.inStyle[k]} of 12, but ${count4(k)} stones are level 4.`);
      const sum = STYLES.reduce((x, s) => x + REPORT.styles[k][s], 0);
      if (Math.abs(sum - 100) > 0.5) out.push(`${p.name}: style scores add up to ${sum}, not 100.`);
      const maxVal = Math.max(...STYLES.map(s => REPORT.styles[k][s]));
      if (REPORT.styles[k][p.style] < maxVal - 0.01)
        out.push(`${p.name}: style is “${p.style}” but a bigger petal exists.`);
    }
    if (POOL) return out;
    AREAS.forEach((ar, i) => {
      const t = rEven((areaSums("a")[i] + areaSums("b")[i] - 8) / 24 * 100);
      if (Math.abs(t - ar.together) > 1) out.push(`${ar.name}: together shown as ${ar.together}%, but stones give ${t}%.`);
    });
    const tOv = rEven((totals.a + totals.b - 24) / 72 * 100);
    if (Math.abs(tOv - REPORT.overall.together) > 1)
      out.push(`Overall together shown as ${REPORT.overall.together}%, but all 24 stones give ${tOv}%.`);
    return out;
  }

  /* ---------------------------------------------------------------- 2D helpers */
  const title = (parts, tag, id) => `<${tag} id="${id}">${esc(parts[0])}<em>${esc(parts[1])}</em></${tag}>`;
  // A centred lede shown as two lines, broken after its semicolon (the text itself is unchanged).
  function twoLines(text) {
    const at = text.indexOf("; ");
    if (at < 0) return `<p class="lede">${esc(text)}</p>`;
    return `<p class="lede two-line"><span>${esc(text.slice(0, at + 1))}</span> <span>${esc(text.slice(at + 2))}</span></p>`;
  }
  // Teammates page 6: the overall Together score in a small box filled to that score, with two slowly moving
  // waves in the page 1 heart's liquid colours. The waves stop when reduced motion is on (CSS).
  function waveChip(v) {
    const fill = Math.max(0, Math.min(100, v));
    const wave = cls => `<svg class="wave ${cls}" viewBox="0 0 1600 40" preserveAspectRatio="none"><path d="M0 20Q100 4 200 20T400 20T600 20T800 20T1000 20T1200 20T1400 20T1600 20V40H0Z"/></svg>`;
    return `<span class="wave-chip" style="--fill:${fill}%;--w-top:${TH.heartTop};--w-light:${TH.heartLight}">`
      + `<span class="wave-clip" aria-hidden="true"><span class="wave-water">${wave("back")}${wave("front")}</span></span>${pc(v)}</span>`;
  }
  function stage(kind, label, fallback, cls, ar, arMobile) {
    return `<div class="stage ${cls || ""}" data-stage="${kind}" style="--ar:${ar};--ar-m:${arMobile || ar}" role="img" tabindex="0"
      aria-label="${esc(label)} Use the left and right arrow keys, or drag sideways, to turn it.">
      <div class="ov" aria-hidden="true"></div>
      <div class="fb" aria-hidden="true">${fallback}<span class="why">3D view unavailable.</span></div></div>`;
  }
  function bar(k, labelText, v) {
    return `<div class="bar ${k}"><span>${esc(labelText)}</span><i><b style="width:${Math.max(0, Math.min(100, v))}%"></b></i><em>${pc(v)}</em></div>`;
  }
  // Teammates page 3 diagram: the two circles overlap by the together score, and a sign with that score and the
  // word "together" hangs from the white box on two chains. The whole diagram floats a little and the sign swings
  // gently (CSS animation). H is the drawing's height: a taller picture card gets longer chains (see fitHangs).
  const HANG_H0 = 204, HANG_HMAX = 380;
  function hangVenn(ar, i, H) {
    H = Math.round(Math.max(HANG_H0, Math.min(HANG_HMAX, H || HANG_H0)));
    const r = 34, cx = 80, cy = 56, f = Math.max(0, Math.min(1, ar.together / 100)), n1 = v => v.toFixed(1);
    const lens = d => (d >= 2 * r ? 0 : (2 * r * r * Math.acos(d / (2 * r)) - (d / 2) * Math.sqrt(4 * r * r - d * d)) / (Math.PI * r * r));
    let lo = 0, hi = 2 * r;
    for (let n = 0; n < 50; n++) { const m = (lo + hi) / 2; if (lens(m) > f) lo = m; else hi = m; }
    const d = (lo + hi) / 2, ax = cx - d / 2, bx = cx + d / 2, id = "hang" + i;
    const pillW = 112, pillH = 50, pillY = H - pillH - 6, spread = 24;
    const panelH = cy + r + 12, edge = 2 + panelH;   // the white box behind the circles, and its bottom edge
    // Each chain hooks onto a small ring on the white box's bottom edge, 24 units either side of the middle,
    // and hangs down into the sign. A chain always starts and ends with a ring link.
    const chains = [cx - spread, cx + spread].map(x => {
      const y0 = edge + 2.5, y1 = pillY + 3;
      let n = Math.max(5, Math.round((y1 - y0) / 8)); if (n % 2 === 0) n++;
      const step = (y1 - y0) / n;
      let links = "";
      for (let j = 0; j < n; j++) {
        const y = y0 + step * (j + 0.5);
        links += j % 2
          ? `<rect x="${n1(x - 1.2)}" y="${n1(y - step * 0.6)}" width="2.4" height="${n1(step * 1.2)}" rx="1.2"/>`
          : `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="3.3" ry="${n1(step * 0.62)}"/>`;
      }
      return { x, links, L: y1 - (y0 - step * 0.12) };   // from the top of the first link (where it swings) to the sign
    });
    const L = (chains[0].L + chains[1].L) / 2;
    // The sign sways about 12 units either way (at most 10°), and each swing takes about 2.4 s. Longer chains
    // swing through a smaller angle and a little more slowly, like a real pendulum.
    const swing = Math.min(10, Math.asin(Math.min(1, 12 / L)) * 180 / Math.PI), period = 2.4 * Math.pow(L / 40, 0.25);
    const heart = 2 * r - d > 16 ? `<path transform="translate(${n1(cx)} ${cy}) scale(.55) translate(-12 -12)" d="M12 20.5s-7.5-4.6-9.3-9.3C1.4 7.6 3.6 4.5 6.9 4.5c2.1 0 3.6 1.1 5.1 3 1.5-1.9 3-3 5.1-3 3.3 0 5.5 3.1 4.2 6.7-1.8 4.7-9.3 9.3-9.3 9.3z" fill="#fff"/>` : "";
    return `<figure class="hang" data-h="${H}" style="--hang:${TH.deep};--sw:${swing.toFixed(2)}deg;--sx:${n1(L * Math.sin(swing * Math.PI / 180))}px;--st:${period.toFixed(2)}s;--d:${n1(-i * 0.9)}s">
      <svg viewBox="0 0 160 ${H}" role="img" aria-label="${esc(PPL.a.name)} and ${esc(PPL.b.name)}: ${pc(ar.together)} together">
        <defs><clipPath id="${id}"><circle cx="${n1(ax)}" cy="${cy}" r="${r}"/></clipPath></defs>
        <g class="hang-float">
          <rect class="hang-panel" x="6" y="2" width="148" height="${panelH}" rx="18"/>
          <text class="hang-ini" x="${n1(ax - r * 0.55)}" y="${cy - r - 5}">${esc(PPL.a.name[0])}</text>
          <text class="hang-ini" x="${n1(bx + r * 0.55)}" y="${cy - r - 5}">${esc(PPL.b.name[0])}</text>
          <circle cx="${n1(ax)}" cy="${cy}" r="${r}" fill="${TH.a}" fill-opacity=".42"/>
          <circle cx="${n1(bx)}" cy="${cy}" r="${r}" fill="${TH.b}" fill-opacity=".42"/>
          <circle cx="${n1(bx)}" cy="${cy}" r="${r}" fill="${TH.deep}" clip-path="url(#${id})"/>${heart}
          ${chains.map(c => `<circle class="hang-eye" cx="${n1(c.x)}" cy="${n1(edge + 0.5)}" r="3"/>`).join("")}
          ${chains.map(c => `<g class="hang-chain">${c.links}</g>`).join("")}
          <g class="hang-sign">
            <rect class="hang-pill" x="${cx - pillW / 2}" y="${pillY}" width="${pillW}" height="${pillH}" rx="18"/>
            <text class="hang-num" x="${cx}" y="${pillY + 24}">${pc(ar.together)}</text>
            <text class="hang-cap" x="${cx}" y="${pillY + 40}">together</text>
          </g>
        </g>
      </svg></figure>`;
  }
  // On wide screens the Teammates picture card is as tall as the text beside it (CSS), so each diagram is redrawn
  // with chains long enough for the sign to hang near the card's bottom. Below 960px the picture sits above the
  // text (CSS) and the diagram keeps its own size.
  function fitHangs() {
    if (!POOL) return;
    const phone = () => window.matchMedia && matchMedia("(max-width:959px)").matches;
    const fit = () => document.querySelectorAll("#p3 .area.hang").forEach(card => {
      const i = +card.dataset.i, fig = card.querySelector("figure.hang");
      if (!fig || !AREAS[i]) return;
      const w = fig.clientWidth, h = fig.clientHeight;
      const H = phone() || !w || !h ? HANG_H0 : Math.round(Math.max(HANG_H0, Math.min(HANG_HMAX, 160 * h / w)));
      if (H !== +fig.dataset.h) fig.outerHTML = hangVenn(AREAS[i], i, H);
    });
    let raf = 0;
    const soon = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; fit(); }); };
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(soon);
      document.querySelectorAll("#p3 .area.hang .area-visual").forEach(el => ro.observe(el));
    } else window.addEventListener("resize", soon);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(soon);
    soon();
  }
  function venn(ar, i) {
    const r = 30, f = Math.max(0, Math.min(1, ar.together / 100));
    const lens = d => (d >= 2 * r ? 0 : (2 * r * r * Math.acos(d / (2 * r)) - (d / 2) * Math.sqrt(4 * r * r - d * d)) / (Math.PI * r * r));
    let lo = 0, hi = 2 * r;
    for (let n = 0; n < 50; n++) { const m = (lo + hi) / 2; if (lens(m) > f) lo = m; else hi = m; }
    const d = (lo + hi) / 2, ax = 70 - d / 2, bx = 70 + d / 2, id = "lens" + i;
    const heart = 2 * r - d > 15 ? `<path transform="translate(70 40) scale(.5) translate(-12 -12)" d="M12 20.5s-7.5-4.6-9.3-9.3C1.4 7.6 3.6 4.5 6.9 4.5c2.1 0 3.6 1.1 5.1 3 1.5-1.9 3-3 5.1-3 3.3 0 5.5 3.1 4.2 6.7-1.8 4.7-9.3 9.3-9.3 9.3z" fill="#fff"/>` : "";
    return `<figure class="venn"><svg viewBox="0 0 140 80" role="img" aria-label="${esc(PPL.a.name)} and ${esc(PPL.b.name)} circles overlapping">
      <defs><clipPath id="${id}"><circle cx="${ax.toFixed(2)}" cy="40" r="${r}"/></clipPath></defs>
      <circle cx="${ax.toFixed(2)}" cy="40" r="${r}" fill="${TH.a}" fill-opacity=".42"/>
      <circle cx="${bx.toFixed(2)}" cy="40" r="${r}" fill="${TH.b}" fill-opacity=".42"/>
      <circle cx="${bx.toFixed(2)}" cy="40" r="${r}" fill="${TH.deep}" clip-path="url(#${id})"/>${heart}
      <text x="${(ax - r + 4).toFixed(1)}" y="13" font-size="10" font-weight="800" fill="${TH.deep}">${esc(PPL.a.name[0])}</text>
      <text x="${(bx + r - 11).toFixed(1)}" y="13" font-size="10" font-weight="800" fill="${TH.deep}">${esc(PPL.b.name[0])}</text>
    </svg></figure>`;
  }

  /* ---------------------------------------------------------------- render report DOM */
  function render() {
    const A = PPL.a, B = PPL.b;
    const issues = checkData();
    document.documentElement.classList.toggle("team", !!POOL);   // Teammates-only layout rules in the CSS
    const fallbackStones = k => AREAS.map((ar, i) => `${ar.short}: ${REPORT.stones[k].slice(i * 4, i * 4 + 4).map(v => T.levels[levelOf(v)]).join(", ")}`).join(". ");

    const nav = [["p1", "Heart"], ["p2", "Flowers"], ["p3", "Overlap"], ["p4", "Mountains"], ["p5", "Balance"], ["p6", POOL ? "Scores" : "Method"], ["p7", "Research"]];
    const heart = REPORT.overall.together, level = TEAM.levels[band5(heart)];
    document.getElementById("nav").innerHTML = nav.map(([id, l], i) => `<a href="#${id}" aria-label="${i + 1}/7 ${l}"><b>${i + 1}</b><span>${l}</span></a>`).join("");

    const switcher = document.getElementById("rel-switcher");
    if (switcher && Array.isArray(REPORT.allReports)) {
      switcher.innerHTML = REPORT.allReports.map(r =>
        `<option value="${esc(r.href)}"${r.slug === REPORT.slug ? " selected" : ""}>${esc(r.num)}. ${esc(r.type)} (${esc(r.names)})</option>`
      ).join("");
      switcher.addEventListener("change", e => { if (e.target.value) window.location.href = e.target.value; });
    }
    renderGenderBar();

    const pctAssetSlug = v => {
      const snaps = [0, 10, 12.5, 20, 25, 30, 37.5, 40, 50, 60, 62.5, 70, 75, 80, 87.5, 90, 100];
      let best = snaps[0];
      for (const s of snaps) if (Math.abs(v - s) < Math.abs(v - best)) best = s;
      return Math.abs(best - Math.round(best)) < 1e-6 ? String(Math.round(best)) : String(best).replace(".", "_");
    };
    const flowerFallbackHtml = k => {
      return `<div class="flower-stack-fb">`
        + `<img src="assets/flowers/components/foliage_backdrop.png" alt="">`
        + STYLES.map(st => {
          const sk = st.toLowerCase();
          return `<img src="assets/flowers/components/quad_${sk}/quad_${sk}_${pctAssetSlug(petalPct(k, st))}.png" alt="">`;
        }).join("")
        + `<img src="assets/flowers/components/stamen_center.png" alt="">`
        + `</div>`;
    };

    const html = [];
    if (issues.length) html.push(`<div class="check" role="status"><b>Data check: some numbers don’t agree</b>${issues.map(esc).join("<br>")}</div>`);

    /* Page 1 — Relationship Overview + 3D Glass Heart */
    html.push(`<section class="page" id="p1" aria-labelledby="p1-t"><span class="pg">1/7</span>
      <p class="kicker">${esc(T.kicker)}</p>
      <p class="pill"><img class="emblem" src="${esc(REPORT.images.emblem)}" alt="">${esc(REPORT.type)}</p>
      <p class="names">${esc(A.name)} &amp; ${esc(B.name)}</p>
      ${title(POOL ? splitTitle(level) : T.heroTitle, "h1", "p1-t")}
      <p class="lede">${esc(POOL ? TEAM.headline[band5(heart)] : T.heroLine)}</p>
      <div class="hero-row">
        <div class="couple-wrap">
          <img class="couple" data-char-slot="cover" src="${esc(REPORT.images.coverPair)}" width="580" height="460" alt="${esc(A.name)} and ${esc(B.name)} together">
        </div>
        ${stage("heart", `A 3D glass heart filled to ${pc(REPORT.overall.together)}, with the words ${T.heartWords}.`, `<b style="font-size:2rem;font-family:var(--serif)">${pc(REPORT.overall.together)}</b><br>${esc(T.heartWords)}`, "", "1/1")}
      </div>
      ${POOL ? "" : `<p class="note">${esc(overallTogetherLine())}</p>
      <div class="note-people">${KEYS.map(k => `<p>${esc(overallPersonLine(k))}</p>`).join("")}</div>`}
      <div class="chips">${POOL
        ? teamChips().map(c => `<div class="chip ${c.c}">${svg(c.ic)}<small>${esc(c.label)}</small><b>${esc(c.value)}</b></div>`).join("")
        : `<div class="chip c1">${svg(ICON.sun)}<small>${esc(T.highlights[0].label)}</small><b>${esc(T.highlights[0].value)}</b></div>
        <div class="chip c2">${svg(ICON.sprout)}<small>${esc(T.highlights[1].label)}</small><b>${esc(T.highlights[1].value)}</b></div>
        <div class="chip c3">${svg(ICON.sparkle)}<small>${esc(T.highlights[2].label)}</small><b>${esc(T.highlights[2].value)}</b></div>`}
      </div></section>`);

    /* Page 2 — Your Style Flowers */
    const flowerCard = k => {
      const p = PPL[k];
      const label = `${p.name}’s style flower: ` + STYLES.map(x => `${x} ${pc(petalPct(k, x))}`).join(", ") + ".";
      return `<figure class="flower">${stage("flower-" + k, label, flowerFallbackHtml(k) + `<p>${esc(label)}</p>`, "", "1/1")}
        <figcaption class="person"><img data-char-slot="bust-${k}" src="${esc(p.bust)}" alt="${esc(p.name)} portrait" width="120" height="120">
          <div><h3>${esc(p.name)} · ${esc(p.style)}</h3><p>${esc(POOL ? TEAM.flowers[p.style].strength : p.line + ".")}</p></div>
        </figcaption></figure>`;
    };
    html.push(`<section class="page" id="p2" aria-labelledby="p2-t"><span class="pg">2/7</span>
      ${title(T.flowersTitle, "h2", "p2-t")}${POOL ? "" : `<p class="lede">${esc(T.flowersLede)}</p>`}
      <div class="flowers">${flowerCard("a")}${flowerCard("b")}</div>
      <div class="box"><h3>${esc(T.readingTitle)}</h3><ul class="dots"${POOL ? ' data-pool="reading"' : ""}>${(POOL ? KEYS.map(teamReading) : T.readingHtml).map(r => `<li><span>${r}</span></li>`).join("")}</ul></div>
    </section>`);

    /* Page 3 — Overlap in Every Area. Teammates: teamOverlapCard (hanging diagram layout).
       Other reports: character scene, a line under each bar, together + gap lines next to the Venn, tip inside the lowest area's box. */
    const low = lowestArea();
    const tipHtml = low.tip ? `<p class="area-tip"><b>Tip for ${esc(PPL[low.k].name)}:</b> ${esc(low.tip)}</p>` : "";
    html.push(`<section class="page" id="p3" aria-labelledby="p3-t"><span class="pg">3/7</span>
      ${title(T.overlapTitle, "h2", "p3-t")}${POOL ? "" : `<p class="lede">${esc(T.overlapLede)}</p>`}
      ${AREAS.map((ar, i) => POOL ? teamOverlapCard(ar, i) : `<article class="area">
        <div class="scene-frame">
          <img class="scene" data-char-slot="scene-${i}" src="${esc(ar.scene)}" alt="${esc(ar.sceneAlt)}" width="480" height="320">
        </div>
        <div class="area-body">
          <div class="area-head"><img class="icon" src="${esc(ar.icon)}" alt="" width="64" height="64"><div><h3>${esc(ar.name)}</h3><span class="status">${esc(ar.status)}</span></div></div>
          <div class="bars">${KEYS.map(k => `${bar(k, barLabel(k), ar[k])}<p class="bar-line">${esc(personLine(ar, i, k))}</p>`).join("")}</div>
          <div class="area-data">
            ${venn(ar, i)}
            <div class="together"><p>${esc(togetherLine(ar))}</p><p>${esc(gapLine(ar))}</p></div>
          </div>
          ${i === low.index ? tipHtml : ""}
        </div></article>`).join("")}
      <div class="know"><b>${esc(T.didYouKnowTitle)}</b><span>${esc(POOL ? TEAM.didYouKnow[band5(heart)] : T.didYouKnow)}</span></div>
    </section>`);

    /* Page 4 — Three Mountains to Climb (flag ALWAYS at summit + circular face pins).
       Teammates: every mountain has its own small stage with its name and text right below it, in its own panel
       (.trio-item), and the "try this week" ideas are plain dot points under "Where to start". */
    const mLabel = "Three mountains. " + AREAS.map(ar => `${ar.name}: summit flag at top, ${A.name} at ${pc(ar.a)}, ${B.name} at ${pc(ar.b)}.`).join(" ");
    const oneMountain = ar => `${ar.name} mountain: summit flag at the top, ${A.name} at ${pc(ar.a)}, ${B.name} at ${pc(ar.b)}.`;
    html.push(`<section class="page" id="p4" aria-labelledby="p4-t"><span class="pg">4/7</span>
      ${title(T.mountainsTitle, "h2", "p4-t")}<p class="lede">${esc(POOL ? TEAM.mountainsLede : T.mountainsLede)}</p>
      ${POOL ? `<div class="trio">${AREAS.map((ar, i) => `<div class="trio-item">
          ${stage("mountain-" + i, oneMountain(ar), `<p><b>${esc(ar.name)}</b></p>`, "solo", "1/1.08")}
          <div class="trio-text"><h3>${esc(ar.name)}</h3>${teamClimb(ar, i)}</div>
        </div>`).join("")}</div>
      <div class="box"><h3>Where to start</h3><ul class="dots"><li><span>${whereToStart()}</span></li>${AREAS.map((ar, i) => `<li class="dot"><span>${esc(teamTryThisWeek(ar, i))}</span></li>`).join("")}</ul></div>`
      : `${stage("mountains", mLabel, AREAS.map(ar => `<p><b>${esc(ar.name)}</b>: ${esc(A.name)} ${pc(ar.a)}, ${esc(B.name)} ${pc(ar.b)}</p>`).join(""), "wide", "16/7.2", "3/5.6")}
      <div class="cards3">${AREAS.map(ar => `<div class="card"><img src="${esc(ar.icon)}" alt="" width="64" height="64"><b>${esc(ar.name)}</b><span>${esc(ar.status)}</span></div>`).join("")}</div>
      <div class="box"><h3>${esc(T.mountainsBox)}</h3><ul class="dots">${T.mountainsBulletsHtml.map(b => `<li><span>${b}</span></li>`).join("")}</ul></div>`}
    </section>`);

    /* Page 5 — Balance and Footsteps (both participants seated on 3D seesaws + 3D stepping stones).
       Teammates: the same layout as the mountains, with the area name right below each seesaw, and the
       footsteps text split into two lines at its semicolon. */
    const tiltOf = ar => (POOL ? balanceLabel(ar) : ar.tilt);
    const sLabel = "Three seesaws. " + AREAS.map(ar => `${ar.name}: ${ar.tilt} (${A.name} ${pc(ar.a)}, ${B.name} ${pc(ar.b)}).`).join(" ");
    const oneSeesaw = ar => `${ar.name} seesaw: ${tiltOf(ar)}. ${A.name} sits on the left and ${B.name} on the right.`;
    html.push(`<section class="page" id="p5" aria-labelledby="p5-t"><span class="pg">5/7</span>
      ${title(T.balanceTitle, "h2", "p5-t")}<p class="lede">${esc(POOL ? TEAM.balanceLede : T.balanceLede)}</p>
      ${POOL ? `<div class="trio">${AREAS.map((ar, i) => `<div class="trio-item">
          ${stage("seesaw-" + i, oneSeesaw(ar), `<p><b>${esc(ar.name)}</b>: ${esc(tiltOf(ar))}</p>`, "solo", "21/20")}
          <div class="trio-text"><h3>${esc(ar.name)}</h3></div>
        </div>`).join("")}</div>
      <div class="box"><h3>What your balance means</h3><ul class="dots" data-pool="balance">${AREAS.map((ar, i) => `<li><span>${teamBalance(ar, i)}</span></li>`).join("")}</ul></div>`
      : `${stage("seesaws", sLabel, AREAS.map(ar => `<p><b>${esc(ar.name)}</b>: ${esc(ar.tilt)} (${esc(A.name)} ${pc(ar.a)}, ${esc(B.name)} ${pc(ar.b)})</p>`).join(""), "wide", "16/6.6", "3/4.8")}
      <div class="cards3">${AREAS.map(ar => `<div class="card"><img src="${esc(ar.icon)}" alt="" width="64" height="64"><b>${esc(ar.name)}</b><span class="tilt">${esc(ar.tilt)}</span></div>`).join("")}</div>`}
      <h3 class="sub">${esc(POOL ? "Footsteps" : T.stonesTitle)}</h3>${POOL ? twoLines(TEAM.footstepsLede) : `<p class="lede">${esc(T.stonesLede)}</p>`}
      <ul class="legend">${[4, 3, 2, 1].map(v => `<li><i style="background:${STONE_LOOK[v].color}"></i>${esc(T.levels[v])}</li>`).join("")}</ul>
      ${stage("stones", `Stepping stones. ${A.name}: ${fallbackStones("a")}. ${B.name}: ${fallbackStones("b")}.`, KEYS.map(k => `<p><b>${esc(PPL[k].name)}</b>: ${esc(fallbackStones(k))}</p>`).join(""), "wide", "16/6.6", "3/3.9")}
      <div class="box"><h3>${esc(T.footstepsTitle)}</h3><ul class="dots"${POOL ? ' data-pool="footsteps"' : ""}>${(POOL ? teamFootsteps() : T.footstepsBulletsHtml).map(b => `<li><span>${b}</span></li>`).join("")}</ul></div>
    </section>`);

    /* Page 6 — How We Worked This Out (scoring table + colour key + disclaimer).
       Teammates: Area | person A | person B | Together, with the overall scores in the last row; the overall
       Together score there sits in a small box with slowly moving waves filled to that score (like the page 1 heart).
       A row with fewer cells than the header stretches its last cell across the remaining columns.
       A cell given as { html } is inserted as it is; every other cell is text. */
    const headers = POOL ? [T.tableHeaders[0] || "Area", A.name, B.name, "Together"] : T.tableHeaders;
    const cols = headers.length;
    const rowCells = row => row.map((c, i) => {
      const span = i === row.length - 1 ? cols - i : 1;
      const content = c !== null && typeof c === "object" ? c.html : esc(noZero(c));
      return `<td${span > 1 ? ` colspan="${span}"` : ""}>${content}</td>`;
    }).join("");
    const tableRows = POOL
      ? [...AREAS.map(ar => [ar.name, pc(ar.a), pc(ar.b), pc(ar.together)]), ["Overall", pc(REPORT.overall.a), pc(REPORT.overall.b), { html: waveChip(heart) }]]
      : T.tableRows;
    html.push(`<section class="page" id="p6" aria-labelledby="p6-t"><span class="pg">6/7</span>
      ${title(POOL ? ["Your ", "Scores"] : T.methodTitle, "h2", "p6-t")}${POOL ? "" : `<p class="lede">${esc(T.methodLede)}</p>`}
      <div class="table-wrap">
        <table class="score-table">
          <thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead>
          <tbody>
            ${tableRows.map(row => `<tr class="${row[0] === "Overall" || row[0] === "Together" ? "overall-row" : ""}">${rowCells(row)}</tr>`).join("")}
          </tbody>
        </table>
      </div>
      ${POOL ? `<p class="lede score-note">${TEAM.scoreNote}</p>` : ""}
      <div class="box keys"><b>${esc(T.keyTitle)}</b>
        <ul class="legend">${["Assertive", "Emotional", "Thoughtful", "Logical"].map(x => `<li><span class="ic" style="background:${STYLE_LOOK[x].color}">${svg(STYLE_LOOK[x].icon)}</span>${x}</li>`).join("")}</ul>
        ${POOL ? "" /* Teammates: the stone colours are explained on page 5 only */
          : `<span></span><ul class="legend">${[4, 3, 2, 1].map(v => `<li><i style="background:${STONE_LOOK[v].color}"></i>${esc(T.levels[v])}</li>`).join("")}</ul>`}
        ${T.sameStyleNote ? `<p class="same-note">${esc(T.sameStyleNote)}</p>` : ""}
      </div>
      <div class="remember">
        <div><h3>${esc(T.rememberTitle)}</h3><p>${T.rememberHtml}</p></div>
        <img class="harmony" data-char-slot="harmony" src="${esc(REPORT.images.harmony)}" alt="${esc(A.name)} and ${esc(B.name)}">
      </div>
    </section>`);

    /* Page 7 — Research Behind Your Report */
    let lastGroup = "";
    html.push(`<section class="page" id="p7" aria-labelledby="p7-t"><span class="pg">7/7</span>
      ${title(T.researchTitle, "h2", "p7-t")}<p class="lede">${esc(T.researchLede)}</p>
      <div class="studies">${T.studies.map(st => {
        const head = st.group !== lastGroup ? `<h3>${esc(st.group)}</h3>` : "";
        lastGroup = st.group;
        const ic = st.icon
          ? `<img src="${esc(st.icon)}" alt="" width="64" height="64">`
          : `<span class="dot">${svg(st.group === "The four styles" ? ICON.sparkle : st.finding.startsWith("Siblings") ? ICON.users : ICON.book)}</span>`;
        return `${head}<article class="study">${ic}<div><p>${esc(st.finding)}</p><cite>${esc(st.cite)}</cite></div></article>`;
      }).join("")}</div>
      <p class="good"><b>${esc(T.goodToKnow[0])}</b> ${esc(T.goodToKnow[1])}</p>
    </section>`);

    document.getElementById("report").innerHTML = html.join("");
    document.getElementById("foot").innerHTML = `${esc(A.name)} &amp; ${esc(B.name)} · ${esc(REPORT.type)} · <a href="index.html">All 13 Relationship Reports</a><br>${esc(T.footer)}`;
  }

  /* ---------------------------------------------------------------- sticky nav observer */
  function watchNav() {
    const links = [...document.querySelectorAll("#nav a")];
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) links.forEach(a => {
        const on = a.getAttribute("href") === "#" + e.target.id;
        a.classList.toggle("on", on);
        if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
      });
    }), { rootMargin: "-38% 0px -55% 0px" });
    document.querySelectorAll("section.page").forEach(s => io.observe(s));
  }

  /* ---------------------------------------------------------------- Three.js 3D bootstrap */
  function no3D(msg) {
    document.documentElement.classList.add("no3d");
    document.querySelectorAll(".stage .why").forEach(el => (el.textContent = msg));
    document.querySelectorAll(".stage").forEach(el => {
      el.removeAttribute("tabindex");
      el.querySelector(".fb").removeAttribute("aria-hidden");
      el.removeAttribute("role");
      el.removeAttribute("aria-label");
    });
  }

  function start3D() {
    let ok = false;
    try {
      const c = document.createElement("canvas"), g = c.getContext("webgl2") || c.getContext("webgl");
      ok = !!g;
      if (g) { const x = g.getExtension("WEBGL_lose_context"); if (x) x.loseContext(); }
    } catch (_) { ok = false; }
    if (!ok) return no3D("3D view unavailable: WebGL is turned off or not supported in this browser.");

    const waitFonts = document.fonts
      ? Promise.race([
          Promise.all([document.fonts.load('400 100px "DM Serif Display"'), document.fonts.load('800 40px "Nunito Sans"')]),
          new Promise(r => setTimeout(r, 1200))
        ])
      : Promise.resolve();

    if (window.THREE && window.THREE.WebGLRenderer) {
      waitFonts.then(() => init3D(window.THREE));
    } else {
      import(THREE_URL)
        .then(mod => waitFonts.then(() => init3D(mod)))
        .catch(err => { console.warn(err); no3D("3D view unavailable: the 3D library could not load."); });
    }
  }

  /* ---------------------------------------------------------------- Three.js 3D stages */
  function init3D(THREE) {
    const RMQ = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
    let RM = RMQ.matches;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" }); }
    catch (_) { return no3D("3D view unavailable: WebGL could not start."); }
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);
    const glCanvas = renderer.domElement;
    let glW = 0, glH = 0, raf = 0, last = 0, lost = false;
    const stages = [];
    const V3 = THREE.Vector3, tmpV = new V3(), tmpN = new V3(), tmpQ = new THREE.Quaternion();
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
    const col = hex => new THREE.Color(hex);
    const srgb = hex => { const c = parseInt(hex.slice(1), 16); return new V3((c >> 16 & 255) / 255, (c >> 8 & 255) / 255, (c & 255) / 255); };
    const hexInt = hex => parseInt(hex.slice(1), 16);
    const std = (color, o) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.75, metalness: 0 }, o || {}));
    function rng(seed) {
      let s = seed >>> 0;
      return () => {
        s = (s + 0x6D2B79F5) >>> 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    function lights(scene, k) {
      scene.add(new THREE.HemisphereLight(0xffffff, hexInt(TH.soft), 2.1 * (k || 1)));
      const d = new THREE.DirectionalLight(0xffffff, 2.3 * (k || 1)); d.position.set(3, 6, 5); scene.add(d);
      const f = new THREE.DirectionalLight(hexInt(TH.soft), 0.75 * (k || 1)); f.position.set(-4, 2, 3); scene.add(f);
    }
    function blobShadow(w, d, alpha) {
      const c = document.createElement("canvas"); c.width = c.height = 128;
      const g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
      gr.addColorStop(0, `rgba(${TH.shadowRgb},${alpha})`);
      gr.addColorStop(1, `rgba(${TH.shadowRgb},0)`);
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.renderOrder = -1; return m;
    }
    function pin(s, anchor, inner, cls, opts) {
      const el = document.createElement("div"); el.className = "pin " + (cls || ""); el.innerHTML = `<div>${inner}</div>`;
      s.ov.appendChild(el);
      s.pins.push(Object.assign({ el, anchor, dx: 0, dy: 0 }, opts || {}));
    }
    function link(s, from, to, color, bend, withDot) {
      const NS = "http://www.w3.org/2000/svg";
      if (!s.svg) { s.svg = document.createElementNS(NS, "svg"); s.svg.setAttribute("class", "links"); s.svg.setAttribute("aria-hidden", "true"); s.ov.prepend(s.svg); }
      const p = document.createElementNS(NS, "path"); p.setAttribute("stroke", color); s.svg.appendChild(p);
      let dot = null;
      if (withDot) {
        dot = document.createElementNS(NS, "circle");
        dot.setAttribute("class", "link-dot");
        dot.setAttribute("r", "3.4");
        dot.setAttribute("fill", color);
        s.svg.appendChild(dot);
      }
      s.links.push({ from, to, p, bend, dot });
    }
    function fitCamera(s, halfW, halfH, center, elev) {
      const cam = s.camera, t = Math.tan(cam.fov * Math.PI / 360);
      const d = Math.max(halfH / t, halfW / (t * cam.aspect)) * 1.04 + (s.pad || 0);
      cam.position.set(center.x, center.y + Math.sin(elev) * d, center.z + Math.cos(elev) * d);
      cam.lookAt(center); cam.updateProjectionMatrix();
    }

    function makeStage(el, builder) {
      const canvas = document.createElement("canvas"); el.prepend(canvas);
      const s = {
        el, canvas, ctx: canvas.getContext("2d"), ov: el.querySelector(".ov"),
        scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(30, 1, 0.1, 200),
        pins: [], links: [], svg: null, yaw: 0, targetYaw: 0, pitch: 0, targetPitch: 0,
        maxYaw: 0.9, maxPitch: 0.3, visible: false, dirty: true, started: -1,
        cw: 0, ch: 0, pw: 0, ph: 0, update: null, layout: null
      };
      lights(s.scene);
      builder(s);
      const io = new IntersectionObserver(es => es.forEach(e => {
        s.visible = e.isIntersecting;
        if (s.visible) { if (s.started < 0) s.started = performance.now(); s.dirty = true; kick(); }
      }), { rootMargin: "160px 0px" });
      io.observe(el);

      let drag = null;
      el.addEventListener("pointerdown", e => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        if (s.press && s.press(e)) { kick(); return; }   // the scene used this press itself (a seesaw grab)
        drag = { id: e.pointerId, x: e.clientX, y: e.clientY, yaw: s.targetYaw, pitch: s.targetPitch, mouse: e.pointerType === "mouse" };
        try { el.setPointerCapture(e.pointerId); } catch (_) {}
        el.classList.add("grabbing"); kick();
      });
      el.addEventListener("pointermove", e => {
        if (!drag || drag.id !== e.pointerId) return;
        const k = 3.2 / Math.max(280, s.cw);
        s.targetYaw = clamp(drag.yaw + (e.clientX - drag.x) * k, -s.maxYaw, s.maxYaw);
        if (drag.mouse) s.targetPitch = clamp(drag.pitch + (e.clientY - drag.y) * k * 0.5, -s.maxPitch, s.maxPitch);
        kick();
      });
      const end = e => { if (drag && drag.id === e.pointerId) { drag = null; el.classList.remove("grabbing"); kick(); } };
      el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end); el.addEventListener("lostpointercapture", end);
      el.addEventListener("keydown", e => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          s.targetYaw = clamp(s.targetYaw + (e.key === "ArrowLeft" ? -0.18 : 0.18), -s.maxYaw, s.maxYaw);
          e.preventDefault(); kick();
        } else if (e.key === "Home") {
          s.targetYaw = 0; s.targetPitch = 0; e.preventDefault(); kick();
        }
      });
      stages.push(s);
      return s;
    }

    function sizeAll() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let w = 1, h = 1;
      for (const s of stages) {
        s.cw = s.el.clientWidth; s.ch = s.el.clientHeight;
        s.pw = Math.max(1, Math.round(s.cw * dpr)); s.ph = Math.max(1, Math.round(s.ch * dpr));
        if (s.canvas.width !== s.pw || s.canvas.height !== s.ph) { s.canvas.width = s.pw; s.canvas.height = s.ph; }
        s.camera.aspect = s.cw / Math.max(1, s.ch);
        if (s.layout) s.layout(s.camera.aspect);
        s.camera.updateProjectionMatrix();
        w = Math.max(w, s.pw); h = Math.max(h, s.ph); s.dirty = true;
      }
      w = Math.min(w, 4096); h = Math.min(h, 4096);
      if (w !== glW || h !== glH) { glW = w; glH = h; renderer.setSize(glW, glH, false); }
      kick();
    }

    function draw(s) {
      const w = Math.min(s.pw, glW), h = Math.min(s.ph, glH);
      renderer.setViewport(0, 0, w, h); renderer.setScissor(0, 0, w, h); renderer.setScissorTest(true);
      renderer.render(s.scene, s.camera);
      s.ctx.clearRect(0, 0, s.pw, s.ph);
      s.ctx.drawImage(glCanvas, 0, glH - h, w, h, 0, 0, s.pw, s.ph);
      const camPos = s.camera.position;
      for (const p of s.pins) {
        p.anchor.getWorldPosition(tmpV);
        let behind = false;
        if (p.normal) {
          tmpN.copy(p.normal).applyQuaternion(p.anchor.parent.getWorldQuaternion(tmpQ));
          behind = tmpN.dot(new V3().subVectors(camPos, tmpV)) < 0;
        }
        tmpV.project(s.camera);
        const x = (tmpV.x * 0.5 + 0.5) * s.cw + p.dx, y = (-tmpV.y * 0.5 + 0.5) * s.ch + p.dy;
        if (!isFinite(x) || !isFinite(y)) continue;
        p.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
        p.el.classList.toggle("behind", behind);
      }
      for (const L of s.links) {
        L.from.getWorldPosition(tmpV).project(s.camera); const x1 = (tmpV.x * 0.5 + 0.5) * s.cw, y1 = (-tmpV.y * 0.5 + 0.5) * s.ch;
        L.to.getWorldPosition(tmpV).project(s.camera); const x2 = (tmpV.x * 0.5 + 0.5) * s.cw, y2 = (-tmpV.y * 0.5 + 0.5) * s.ch;
        if (![x1, y1, x2, y2].every(isFinite)) continue;
        const b = 0.24 * L.bend, cx = (x1 + x2) / 2 - (y2 - y1) * b, cy = (y1 + y2) / 2 + (x2 - x1) * b;
        L.p.setAttribute("d", `M${x1.toFixed(1)} ${y1.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`);
        if (L.dot) { L.dot.setAttribute("cx", x2.toFixed(1)); L.dot.setAttribute("cy", y2.toFixed(1)); }
      }
    }

    function kick() { if (!raf && !lost) raf = requestAnimationFrame(frame); }
    function frame(now) {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60; last = now;
      let again = false;
      for (const s of stages) {
        if (!s.cw) continue;
        if (!s.visible) {
          if (s.dirty) {
            if (s.update) s.update(0, 1, 0);
            draw(s);
            s.dirty = false;
          }
          continue;
        }
        const k = 1 - Math.exp(-dt * (RM ? 30 : 9));
        s.yaw += (s.targetYaw - s.yaw) * k; s.pitch += (s.targetPitch - s.pitch) * k;
        const moving = Math.abs(s.targetYaw - s.yaw) > 0.0005 || Math.abs(s.targetPitch - s.pitch) > 0.0005 || s.el.classList.contains("grabbing");
        const t = (now - s.started) / 1000;
        const intro = RM ? 1 : ease(t / 1.8);
        if (s.update) s.update(RM ? 0 : t, intro, dt);
        if (s.dirty || moving || !RM) { draw(s); s.dirty = false; }
        if (moving || !RM) again = true;
      }
      if (again) kick(); else last = 0;
    }

    /* ---------- 1. 3D Crystal Glass Heart (coordinated per-relationship liquid & rim) ---------- */
    let HR = null;
    function heartRadii() {
      if (HR) return HR;
      const N = 720, pts = [];
      for (let i = 0; i < N; i++) {
        const t = i / N * Math.PI * 2;
        pts.push([Math.pow(Math.sin(t), 3), (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t) + 1.5) / 16]);
      }
      const M = 512; HR = new Float32Array(M);
      for (let j = 0; j < M; j++) {
        const a = j / M * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a); let best = 2;
        for (let i = 0; i < N; i++) {
          const p = pts[i], q = pts[(i + 1) % N], ex = q[0] - p[0], ey = q[1] - p[1], den = dx * ey - dy * ex;
          if (Math.abs(den) < 1e-12) continue;
          const t = (p[0] * ey - p[1] * ex) / den, u = (p[0] * dy - p[1] * dx) / den;
          if (t > 1e-6 && u >= 0 && u <= 1 && t < best) best = t;
        }
        HR[j] = best;
      }
      return HR;
    }
    function heartGeometry(scale, thick) {
      const R = heartRadii(), M = R.length, SU = 144, SV = 64, pos = [0, 0, thick], idx = [];
      const rAt = a => { const f = (((a / (Math.PI * 2)) % 1) + 1) % 1 * M, i = Math.floor(f), w = f - i; return R[i % M] * (1 - w) + R[(i + 1) % M] * w; };
      for (let j = 1; j < SV; j++) {
        const v = j / SV * Math.PI, rho = Math.sin(v), z = Math.cos(v) * thick;
        for (let i = 0; i < SU; i++) { const a = i / SU * Math.PI * 2, r = rho * rAt(a) * scale; pos.push(Math.cos(a) * r, Math.sin(a) * r, z); }
      }
      pos.push(0, 0, -thick);
      const ring = j => 1 + (j - 1) * SU, back = 1 + (SV - 1) * SU;
      for (let i = 0; i < SU; i++) idx.push(0, ring(1) + i, ring(1) + (i + 1) % SU);
      for (let j = 1; j < SV - 1; j++) for (let i = 0; i < SU; i++) {
        const a = ring(j) + i, b = ring(j) + (i + 1) % SU, c = ring(j + 1) + (i + 1) % SU, d = ring(j + 1) + i;
        idx.push(a, d, c, a, c, b);
      }
      for (let i = 0; i < SU; i++) idx.push(ring(SV - 1) + i, back, ring(SV - 1) + (i + 1) % SU);
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      return g;
    }
    const VS = `varying vec3 vW; varying vec3 vN; varying vec3 vV;
      void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vV = cameraPosition - w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
    function liquidMaterial() {
      return new THREE.ShaderMaterial({
        uniforms: {
          uLevel: { value: 0 }, uTime: { value: 0 }, uAmp: { value: 1 },
          cDeep: { value: srgb(TH.heartDeep) },
          cLight: { value: srgb(TH.heartLight) },
          cTop: { value: srgb(TH.heartTop) }
        },
        vertexShader: VS, side: THREE.DoubleSide,
        fragmentShader: `uniform float uLevel; uniform float uTime; uniform float uAmp; uniform vec3 cDeep; uniform vec3 cLight; uniform vec3 cTop;
          varying vec3 vW; varying vec3 vN; varying vec3 vV;
          void main(){
            float wave = uLevel + uAmp * (0.03 * sin(vW.x * 5.2 + uTime * 2.2) + 0.016 * sin(vW.x * 9.0 - uTime * 1.7 + vW.z * 4.0));
            if (vW.y > wave) discard;
            if (!gl_FrontFacing) { gl_FragColor = vec4(cTop * (0.92 + 0.08 * sin(vW.x * 7.0 + uTime)), 1.0); return; }
            vec3 N = normalize(vN), V = normalize(vV), L = normalize(vec3(-0.4, 0.8, 0.6));
            float fr = pow(1.0 - max(dot(N, V), 0.0), 2.0);
            vec3 c = mix(cDeep, cLight, clamp(0.35 + (vW.y - uLevel) * 0.6 + 0.5 * N.y, 0.0, 1.0));
            c *= 0.72 + 0.32 * max(dot(N, L), 0.0);
            c += vec3(1.0) * (pow(max(dot(reflect(-L, N), V), 0.0), 30.0) * 0.35 + fr * 0.16);
            c = mix(c, cTop, smoothstep(0.045, 0.0, wave - vW.y) * 0.65);
            gl_FragColor = vec4(c, 1.0);
          }`
      });
    }
    function glassMaterial(side, k) {
      return new THREE.ShaderMaterial({
        uniforms: { cRim: { value: srgb(TH.heartRim) }, uK: { value: k } },
        vertexShader: VS, side, transparent: true, depthWrite: false,
        fragmentShader: `uniform vec3 cRim; uniform float uK; varying vec3 vW; varying vec3 vN; varying vec3 vV;
          void main(){
            vec3 N = normalize(vN), V = normalize(vV); if (!gl_FrontFacing) N = -N;
            float fr = pow(1.0 - max(dot(N, V), 0.0), 2.4);
            vec3 L1 = normalize(vec3(-0.55, 0.7, 0.6)), L2 = normalize(vec3(0.6, 0.25, 0.75));
            float s1 = pow(max(dot(reflect(-L1, N), V), 0.0), 70.0), s2 = pow(max(dot(reflect(-L2, N), V), 0.0), 16.0);
            vec3 c = mix(vec3(0.99, 0.96, 0.98), cRim, clamp(fr * 0.9, 0.0, 1.0));
            c = mix(c, vec3(1.0), clamp(s1 * 1.3 + s2 * 0.35, 0.0, 1.0));
            gl_FragColor = vec4(c, clamp((0.08 + fr * 0.6 + s1 * 0.95 + s2 * 0.22) * uK, 0.0, 0.96));
          }`
      });
    }
    function heartLabel(pct) {
      const c = document.createElement("canvas"); c.width = 600; c.height = 420; const g = c.getContext("2d");
      g.textAlign = "center"; g.fillStyle = "#fff";
      g.shadowColor = `rgba(${TH.shadowRgb},0.72)`; g.shadowBlur = 18; g.shadowOffsetY = 3;
      // Longer numbers (e.g. "70.00%") get a smaller font so they still fit inside the heart.
      const num = pc(pct); let size = 190;
      g.font = `400 ${size}px "DM Serif Display", Georgia, serif`;
      const wide = g.measureText(num).width;
      if (wide > 430) { size = Math.floor(size * 430 / wide); g.font = `400 ${size}px "DM Serif Display", Georgia, serif`; }
      g.fillText(num, 300, 205);
      g.font = '800 42px "Nunito Sans", system-ui, sans-serif';
      if ("letterSpacing" in g) g.letterSpacing = "5px";
      g.fillText(T.heartWords, 300, 272);
      if ("letterSpacing" in g) g.letterSpacing = "0px";
      g.shadowBlur = 10; g.strokeStyle = "#fff"; g.lineWidth = 5; g.lineCap = g.lineJoin = "round";
      g.beginPath(); g.moveTo(130, 335); g.lineTo(220, 335); g.lineTo(236, 312); g.lineTo(252, 356); g.lineTo(264, 335); g.lineTo(276, 335); g.stroke();
      g.beginPath(); g.moveTo(324, 335); g.lineTo(336, 335); g.lineTo(348, 312); g.lineTo(362, 356); g.lineTo(378, 335); g.lineTo(470, 335); g.stroke();
      g.beginPath(); g.moveTo(300, 362); g.bezierCurveTo(282, 350, 274, 338, 280, 328); g.bezierCurveTo(286, 318, 298, 322, 300, 331); g.bezierCurveTo(302, 322, 314, 318, 320, 328); g.bezierCurveTo(326, 338, 318, 350, 300, 362); g.stroke();
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
    }
    function buildHeart(s) {
      s.maxYaw = 1.1; s.pad = 0.2;
      const frac = clamp(REPORT.overall.together / 100, 0, 1);
      const root = new THREE.Group(); s.scene.add(root);
      const gGeo = heartGeometry(1, 0.5), lGeo = heartGeometry(0.9, 0.34);
      lGeo.computeBoundingBox(); const lb = lGeo.boundingBox;
      const liqMat = liquidMaterial();
      const glassBack = new THREE.Mesh(gGeo, glassMaterial(THREE.BackSide, 0.75)); glassBack.renderOrder = 1;
      const liquid = new THREE.Mesh(lGeo, liqMat);
      const text = new THREE.Mesh(new THREE.PlaneGeometry(1.06, 0.742), new THREE.MeshBasicMaterial({ map: heartLabel(REPORT.overall.together), transparent: true, depthWrite: false }));
      text.position.set(0, -0.2, 0.37); text.renderOrder = 2;
      const glassFront = new THREE.Mesh(gGeo, glassMaterial(THREE.FrontSide, 1)); glassFront.renderOrder = 3;
      const heart = new THREE.Group(); heart.add(glassBack, liquid, text, glassFront); root.add(heart);
      const sh = blobShadow(1.9, 0.5, 0.3); sh.position.y = -1.13; root.add(sh);
      s.layout = () => fitCamera(s, 1.16, 1.16, new V3(0, -0.06, 0), 0.06);
      s.update = (t, intro) => {
        heart.position.y = t ? Math.sin(t * 1.15) * 0.035 : 0;
        root.rotation.y = s.yaw + (t ? Math.sin(t * 0.55) * 0.18 : 0);
        root.rotation.x = s.pitch;
        liqMat.uniforms.uLevel.value = heart.position.y + lb.min.y + frac * intro * (lb.max.y - lb.min.y);
        liqMat.uniforms.uTime.value = t;
        liqMat.uniforms.uAmp.value = frac > 0.995 || frac < 0.005 ? 0 : 1;
      };
    }

    /* ---------- 2. Realistic Botanical 3D Style Flowers (percentage colour filling from centre outward) ---------- */
    const PETAL_HALF = 0.87; // ~50 deg half-angle (~100 deg lush overlapping hibiscus petal fan)
    function petalRim(u, phase) {
      const prof = Math.pow(Math.max(0, Math.cos(u * Math.PI / 2)), 0.32);
      const r = 1.03 * prof * (1 + 0.020 * Math.sin(u * Math.PI * 3.0 + phase) * prof + 0.010 * Math.cos(u * Math.PI * 5.0 - 0.4) * prof - 0.012 * Math.exp(-((u / 0.16) ** 2)));
      return { x: r * Math.sin(u * PETAL_HALF), y: r * Math.cos(u * PETAL_HALF) };
    }
    function petalShape(phase) {
      const p = new THREE.Shape(), N = 80;
      p.moveTo(0, 0);
      for (let i = 1; i < N; i++) { const q = petalRim(i / N * 2 - 1, phase); p.lineTo(q.x, q.y); }
      p.lineTo(0, 0);
      p.rim = u => petalRim(u, phase);
      return p;
    }
    const rgbOf = hex => [hex >> 16 & 255, hex >> 8 & 255, hex & 255];

    // Serrated, herringbone-veined botanical hibiscus leaf shape & high-res procedural leaf texture
    function botanicalLeafShape() {
      const p = new THREE.Shape(), N = 64;
      p.moveTo(0, 0);
      for (let i = 1; i <= N; i++) {
        const t = i / (N + 1);
        const bw = 0.38 * Math.pow(Math.max(0, Math.sin(t * Math.PI)), 0.72) * (1 - 0.18 * t);
        const ser = t > 0.15 && t < 0.96 ? 1 + 0.045 * Math.abs(Math.sin(t * Math.PI * 13)) - 0.022 : 1;
        p.lineTo(-bw * ser, t);
      }
      p.lineTo(0, 1.0);
      for (let i = N; i >= 1; i--) {
        const t = i / (N + 1);
        const bw = 0.38 * Math.pow(Math.max(0, Math.sin(t * Math.PI)), 0.72) * (1 - 0.18 * t);
        const ser = t > 0.15 && t < 0.96 ? 1 + 0.045 * Math.abs(Math.sin(t * Math.PI * 13)) - 0.022 : 1;
        p.lineTo(bw * ser, t);
      }
      p.lineTo(0, 0);
      return p;
    }
    function botanicalLeafTexture(shape) {
      const S = 320, M = 6, pts = shape.getPoints(64), xs = pts.map(p => p.x), ys = pts.map(p => p.y);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const kx = (S - 2 * M) / (x1 - x0), ky = (S - 2 * M) / (y1 - y0);
      const tx = x => M + (x - x0) * kx, ty = y => S - M - (y - y0) * ky;
      const c = document.createElement("canvas"); c.width = c.height = S;
      const g = c.getContext("2d", { willReadFrequently: true });
      const outline = () => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(tx(p.x), ty(p.y)) : g.moveTo(tx(p.x), ty(p.y)))); g.closePath(); };
      outline(); g.fillStyle = "#000"; g.fill();
      const mask = g.getImageData(0, 0, S, S).data, img = g.createImageData(S, S), o = img.data;
      const cDeep = [52, 102, 36], cMid = [88, 148, 60], cLight = [138, 190, 92], cVein = [178, 216, 128];
      for (let j = 0, n = 0; j < S; j++) for (let i = 0; i < S; i++, n++) {
        const al = mask[n * 4 + 3];
        if (!al) continue;
        const X = x0 + (i + 0.5 - M) / kx, Y = clamp(y0 + (S - M - j - 0.5) / ky, 0, 1);
        const hw = Math.max(1e-4, 0.38 * Math.pow(Math.max(0, Math.sin(Y * Math.PI)), 0.72) * (1 - 0.18 * Y));
        const u = Math.min(1, Math.abs(X) / hw);
        const midrib = Math.exp(-((X / 0.014) ** 2)) * clamp(1.05 - Y, 0, 1);
        const lat = Math.pow(0.5 + 0.5 * Math.cos((Y * 9.5 - u * 2.15) * Math.PI * 2), 10) * (1 - 0.25 * u) * clamp(Y * 5, 0, 1);
        const sl = clamp((X >= 0 ? 0.58 : 0.36) + 0.28 * Y - 0.18 * u * u, 0, 1);
        const mg = clamp((u - 0.55) / 0.45, 0, 1) * 0.42;
        const vm = clamp(0.72 * midrib + 0.36 * lat, 0, 0.82);
        for (let ch = 0; ch < 3; ch++) {
          let v = cDeep[ch] * (1 - sl) + cMid[ch] * sl;
          v = v * (1 - mg) + cLight[ch] * mg;
          v = v * (1 - vm) + cVein[ch] * vm;
          o[n * 4 + ch] = v;
        }
        o[n * 4 + 3] = al;
      }
      g.putImageData(img, 0, 0);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      return { t, uv: (x, y) => [tx(x) / S, 1 - ty(y) / S] };
    }

    // Realistic hibiscus petal texture: creamy-pearl veined white at 0%, smooth radial blush from centre outward to `frac`
    function petalTexture(shape, baseHex, throatHex, frac, seed) {
      const S = 400, M = 6, pts = shape.getPoints(80), xs = pts.map(p => p.x), ys = pts.map(p => p.y);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const kx = (S - 2 * M) / (x1 - x0), ky = (S - 2 * M) / (y1 - y0);
      const tx = x => M + (x - x0) * kx, ty = y => S - M - (y - y0) * ky;
      const c = document.createElement("canvas"); c.width = c.height = S;
      const g = c.getContext("2d", { willReadFrequently: true });
      const outline = () => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(tx(p.x), ty(p.y)) : g.moveTo(tx(p.x), ty(p.y)))); g.closePath(); };
      outline(); g.fillStyle = "#000"; g.fill();
      const mask = g.getImageData(0, 0, S, S).data;
      const baseRGB = rgbOf(baseHex), throatRGB = rgbOf(throatHex);
      const paperWarm = [253.5, 251.5, 250.5], pearlShadow = [231, 226, 225];
      const veinCenters = Array.from({ length: 13 }, (_, v) => -0.84 + v / 12 * 1.68);
      const img = g.createImageData(S, S), o = img.data, rnd = rng(seed);
      const reach = frac > 0.0001 ? Math.pow(frac, 0.70) * 0.96 : 0;
      const feather = Math.max(0.14, Math.min(0.32, 0.46 * reach + 0.08));

      for (let j = 0, n = 0; j < S; j++) for (let i = 0; i < S; i++, n++) {
        const al = mask[n * 4 + 3];
        if (!al) continue;
        const X = x0 + (i + 0.5 - M) / kx, Y = y0 + (S - M - j - 0.5) / ky;
        const r = Math.hypot(X, Y);
        const uc = clamp(Math.atan2(X, Math.max(Y, 1e-5)) / PETAL_HALF, -1, 1);
        const rimPt = shape.rim(uc), rRim = Math.max(1e-4, Math.hypot(rimPt.x, rimPt.y));
        const qn = clamp(r / rRim, 0, 1);

        const pleat = 0.55 * Math.sin(uc * Math.PI * 4.5 + 0.25) * (0.25 + 0.75 * qn)
          + 0.30 * Math.sin(uc * Math.PI * 9.5 - 0.6) * (0.35 + 0.65 * qn)
          + 0.15 * Math.sin(uc * Math.PI * 22.0 + qn * 2.5);
        let vf = 0;
        for (let vi = 0; vi < 13; vi++) {
          const bend = 0.05 * Math.sin(vi * 1.9) * Math.pow(qn, 1.4);
          const du = (uc - (veinCenters[vi] + bend)) / (0.022 + 0.010 * qn);
          vf += Math.exp(-0.5 * du * du) * (0.92 - 0.35 * qn);
        }
        const micro = 0.32 * Math.pow(0.5 + 0.5 * Math.sin(uc * Math.PI * 34.0 + 0.8 * Math.sin(qn * 6.0)), 4) * (0.85 - 0.3 * qn);
        const vTot = Math.min(1.35, vf + micro);

        const light = 1.0 + 0.042 * pleat * (1 - 0.25 * qn) - 0.055 * Math.pow(1 - qn, 2.2) - 0.032 * vTot - 0.045 * Math.pow(qn, 5) - 0.022 * uc;
        const shT = clamp((1.02 - light) / 0.16, 0, 1);

        let fw = 0;
        if (frac >= 0.999) fw = 1;
        else if (frac > 0.0001) {
          const wick = 1 + 0.026 * vf + 0.014 * Math.sin(uc * 4.0 + 0.4);
          const z = clamp((reach + feather * 0.52 - qn / wick) / feather, 0, 1);
          fw = z * z * (3 - 2 * z);
        }

        const thT = Math.pow(clamp(1 - qn / Math.max(0.28, 0.55 * (frac + 0.15)), 0, 1), 1.55);
        const spec = 0.14 * Math.exp(-(((uc + 0.24) / 0.38) ** 2 + ((qn - 0.56) / 0.28) ** 2));
        const jit = (rnd() - 0.5) * 2.2;

        for (let ch = 0; ch < 3; ch++) {
          const wCol = paperWarm[ch] * (1 - shT) + pearlShadow[ch] * shT;
          let pCol = baseRGB[ch] * (1 - 0.58 * thT) + throatRGB[ch] * (0.58 * thT);
          pCol = pCol * (0.96 + 0.075 * pleat - 0.085 * vTot);
          pCol = pCol + (255 - pCol) * spec;
          o[n * 4 + ch] = clamp(wCol * (1 - fw) + pCol * fw + jit, 0, 255);
        }
        o[n * 4 + 3] = al;
      }
      g.putImageData(img, 0, 0);
      outline(); g.globalCompositeOperation = "multiply"; g.lineWidth = 2.4; g.strokeStyle = "rgba(218,208,208,0.72)"; g.stroke();
      g.globalCompositeOperation = "source-over";
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      return { t, uv: (x, y) => [tx(x) / S, 1 - ty(y) / S] };
    }
    function washGeometry(shape, wash, cup) {
      const g = new THREE.ShapeGeometry(shape, 30), p = g.attributes.position, uv = g.attributes.uv;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), [u, v] = wash.uv(x, y); uv.setXY(i, u, v); p.setZ(i, cup * (x * x * 1.1 + y * y * 0.35)); }
      g.computeVertexNormals(); return g;
    }
    function buildHibiscusBud3D() {
      const g = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.55, 8), std(0x4f8636, { roughness: 0.75 }));
      stem.position.y = 0.27; g.add(stem);
      const calyx = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.22, 10), std(0x558f3b, { roughness: 0.7 }));
      calyx.rotation.x = Math.PI; calyx.position.y = 0.58; g.add(calyx);
      const budTip = new THREE.Mesh(new THREE.ConeGeometry(0.088, 0.34, 14), std(0xd96c91, { roughness: 0.55 }));
      budTip.position.y = 0.72; g.add(budTip);
      return g;
    }

    let sharedLeafGeo = null, sharedLeafMat = null;
    function getSharedLeaf() {
      if (!sharedLeafGeo) {
        const ls = botanicalLeafShape(), lw = botanicalLeafTexture(ls);
        sharedLeafGeo = washGeometry(ls, lw, 0.11);
        sharedLeafMat = new THREE.MeshBasicMaterial({ map: lw.t, transparent: true, side: THREE.DoubleSide, depthWrite: false });
      }
      return { geo: sharedLeafGeo, mat: sharedLeafMat };
    }

    function buildFlower(s, k) {
      s.maxYaw = 1.1; s.pad = 0.15;
      const root = new THREE.Group(); s.scene.add(root);
      const flower = new THREE.Group(); flower.rotation.x = -0.34; root.add(flower);
      const sh = blobShadow(4.4, 4.4, 0.12); sh.rotation.x = 0; sh.position.z = -0.3; flower.add(sh);
      const vals = REPORT.styles[k], seed0 = k === "a" ? 0 : 50;
      const L = 1.52, r0 = 0.05;

      // 4 cardinal veined serrated hibiscus leaves + 2 side leafy sprigs + 1 top-right unopened bud
      const { geo: leafGeo, mat: leafMat } = getSharedLeaf();
      [0, 90, 180, 270].forEach((deg, i) => {
        const a = deg * Math.PI / 180, m = new THREE.Mesh(leafGeo, leafMat);
        m.rotation.z = a - Math.PI / 2;
        m.position.set(Math.cos(a) * 0.44, Math.sin(a) * 0.44, -0.11);
        m.scale.setScalar(1.38 + (i % 2) * 0.08);
        m.renderOrder = 1; flower.add(m);
      });
      // Delicate side sprigs peeking behind left & right leaves
      [-1, 1].forEach(side => {
        [[-0.22, 0.52, 0.25], [0.18, 0.52, -0.22]].forEach(([dy, sc, tiltAng]) => {
          const sp = new THREE.Mesh(leafGeo, leafMat);
          const baseA = side < 0 ? Math.PI : 0;
          sp.rotation.z = baseA - Math.PI / 2 + tiltAng * side;
          sp.position.set(side * 1.32, dy - 0.16, -0.14);
          sp.scale.setScalar(sc);
          sp.renderOrder = 0; flower.add(sp);
        });
      });
      // Unopened rose-tipped hibiscus bud peeking out at top-right (~65 deg)
      const topBud = buildHibiscusBud3D();
      topBud.position.set(0.56, 1.12, -0.09);
      topBud.rotation.z = -0.42;
      flower.add(topBud);

      const order = STYLES.slice().sort((x, y) => vals[x] - vals[y]);
      STYLES.forEach((st, si) => {
        const look = STYLE_LOOK[st], a = look.angle * Math.PI / 180, rank = order.indexOf(st);
        const shape = petalShape(0.4 + si * 1.4 + seed0 * 0.02);
        const fill = petalTexture(shape, hexInt(look.color), hexInt(look.throat), clamp(petalPct(k, st) / 100, 0, 1), 3 + si * 7 + seed0);
        const arm = new THREE.Group(); arm.rotation.z = a - Math.PI / 2; flower.add(arm);
        const tilt = new THREE.Group(); tilt.position.y = r0; tilt.rotation.x = 0.20; arm.add(tilt);
        const petal = new THREE.Mesh(washGeometry(shape, fill, 0.26), new THREE.MeshBasicMaterial({ map: fill.t, transparent: true, opacity: 0.99, side: THREE.DoubleSide, depthWrite: false }));
        petal.scale.setScalar(L); petal.position.z = 0.02 + rank * 0.025; petal.renderOrder = 2 + rank; tilt.add(petal);
        const tipAt = new THREE.Object3D(); tipAt.position.set(0, L * 0.78, 0.06 + rank * 0.025); tilt.add(tipAt);
        const labAt = new THREE.Object3D(); labAt.position.set(Math.cos(a) * 2.24, Math.sin(a) * 2.24, 0.2); flower.add(labAt);
        link(s, labAt, tipAt, look.ink, look.angle === 45 || look.angle === 225 ? 1 : -1, true);
        pin(s, labAt, `<div class="lab"><span class="lab-ic" style="color:${look.color};font-size:1em">${svg(look.icon)}</span><b>${st}</b><span style="color:${look.ink}">${pc(petalPct(k, st))}</span></div>`, "mid");
      });

      // Realistic golden hibiscus stamen cluster & central stigma tip
      const r = rng(21 + seed0), fil = new THREE.CylinderGeometry(0.006, 0.009, 1, 5), dot = new THREE.SphereGeometry(0.032, 10, 8), up = new V3(0, 1, 0);
      fil.translate(0, 0.5, 0);
      const stalk = std(0xebb844, { roughness: 0.55 }), gold = std(0xe07b1c, { roughness: 0.42 });
      for (let n = 0; n < 28; n++) {
        const ang = n / 28 * Math.PI * 2 + r() * 0.18, len = 0.22 + r() * 0.21, dir = new V3(Math.cos(ang) * len, Math.sin(ang) * len, 0.11 + r() * 0.12), l = dir.length();
        dir.normalize();
        const m = new THREE.Mesh(fil, stalk); m.scale.y = l; m.quaternion.setFromUnitVectors(up, dir); m.position.z = 0.14; flower.add(m);
        const d = new THREE.Mesh(dot, gold); d.position.copy(dir).multiplyScalar(l); d.position.z += 0.14; flower.add(d);
      }
      const bud = new THREE.Mesh(new THREE.SphereGeometry(0.095, 20, 14), std(0xf2c64b, { roughness: 0.6 })); bud.scale.z = 0.65; bud.position.z = 0.15; flower.add(bud);
      for (let pIdx = 0; pIdx < 5; pIdx++) {
        const pa = pIdx * Math.PI * 2 / 5;
        const pad = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), std(0xd9681e, { roughness: 0.5 }));
        pad.position.set(Math.cos(pa) * 0.055, Math.sin(pa) * 0.055, 0.20);
        flower.add(pad);
      }
      s.layout = () => fitCamera(s, 2.38, 2.34, new V3(0, 0.02, 0), 0.05);
      s.update = t => { root.rotation.y = s.yaw + (t ? Math.sin(t * 0.6 + (k === "a" ? 0 : 1.7)) * 0.18 : 0); root.rotation.x = s.pitch; flower.rotation.z = t ? Math.sin(t * 0.4) * 0.04 : 0; };
    }

    /* ---------- 4. Three 3D Mountains (flag ALWAYS at summit + circular face portraits) ---------- */
    function mRadius(phi, h, R, seed) {
      const n = 0.09 * Math.sin(3 * phi + seed) + 0.06 * Math.sin(7 * phi - seed * 2 + h * 4) + 0.04 * Math.sin(12 * phi + h * 9 + seed);
      return R * Math.pow(Math.max(0, 1 - h), 0.92) * (1 + n * (0.35 + 0.65 * (1 - h)));
    }
    const H_M = 2.9, R_M = 1.42;
    function pathPoint(t, seed, off) {
      const h = Math.min(0.955, 0.03 + clamp(t, 0, 1) * 0.925), phi = Math.PI / 2 + 0.8 * Math.sin(clamp(t, 0, 1) * Math.PI * 3);
      const r = mRadius(phi, h, R_M, seed) + off;
      return { p: new V3(Math.cos(phi) * r, -H_M / 2 + h * H_M, Math.sin(phi) * r), n: new V3(Math.cos(phi), 0.35, Math.sin(phi)).normalize() };
    }
    function mountainGeometry(seed) {
      const g = new THREE.ConeGeometry(1, H_M, 30, 18, true); g.rotateY(Math.PI);
      const p = g.attributes.position, cols = new Float32Array(p.count * 3), c = new THREE.Color(), r = rng(seed * 1000);
      const grass = col(0xa7cf8c), rock = col(0xc8b3ae), rock2 = col(0xe2d2d0), top = col(0xfcf7f8);
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i), h = (y + H_M / 2) / H_M, phi = Math.atan2(z, x), rr = mRadius(phi, h, R_M, seed);
        p.setXYZ(i, Math.cos(phi) * rr, y, Math.sin(phi) * rr);
        const j = (r() - 0.5) * 0.08;
        if (h < 0.14) c.copy(grass); else if (h < 0.24) c.copy(grass).lerp(rock, (h - 0.14) / 0.1); else if (h < 0.8) c.copy(rock).lerp(rock2, (h - 0.24) / 0.56); else c.copy(rock2).lerp(top, (h - 0.8) / 0.2);
        c.offsetHSL(0, 0, j); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
      }
      g.setAttribute("color", new THREE.BufferAttribute(cols, 3)); g.computeVertexNormals();
      return g;
    }
    function flag(colorHex) {
      const g = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.62, 8), std(0x7a4a32)); pole.position.y = 0.31; g.add(pole);
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0.38, -0.105); sh.lineTo(0, -0.22);
      const cloth = new THREE.Mesh(new THREE.ShapeGeometry(sh), std(colorHex, { side: THREE.DoubleSide, roughness: 0.52 })); cloth.position.set(0.012, 0.61, 0); g.add(cloth);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 8), std(0xf6c34a, { roughness: 0.4 })); knob.position.y = 0.625; g.add(knob);
      g.userData.cloth = cloth; return g;
    }
    function declutter(s, groups, flags) {
      if (!s.cw) return;
      const gap = 5, ps = s.pins;
      groups.forEach(g => g.rotation.set(0, 0, 0)); s.scene.updateMatrixWorld(true); s.camera.updateMatrixWorld(true);
      const scr = o => { o.getWorldPosition(tmpV).project(s.camera); return [(tmpV.x * 0.5 + 0.5) * s.cw, (-tmpV.y * 0.5 + 0.5) * s.ch]; };
      ps.forEach(p => {
        if (p.dx0 === undefined) { p.dx0 = p.dx; p.dy0 = p.dy; }
        const d = p.el.firstElementChild; p.w = d.offsetWidth; p.h = d.offsetHeight;
        [p.bx, p.by] = scr(p.anchor); p.x = p.bx + p.dx0; p.y = p.by + p.dy0;
      });
      const box = p => ({ l: p.x - p.w / 2 - gap / 2, r: p.x + p.w / 2 + gap / 2, t: p.y - p.h - gap / 2, b: p.y + gap / 2 });
      const hit = (a, b) => Math.min(a.r, b.r) > Math.max(a.l, b.l) && Math.min(a.b, b.b) > Math.max(a.t, b.t);
      const flagBoxes = flags.map(f => { const [a, b] = f.userData.box.map(scr); return { l: Math.min(a[0], b[0]), r: Math.max(a[0], b[0]), t: Math.min(a[1], b[1]), b: Math.max(a[1], b[1]) }; });
      for (let it = 0; it < 3; it++) {
        ps.forEach((P, i) => ps.slice(i + 1).forEach(Q => {
          if (P.group !== Q.group || !hit(box(P), box(Q))) return;
          const L = P.x < Q.x - 0.5 || (Math.abs(P.x - Q.x) <= 0.5 && P.key === "a") ? P : Q, R = L === P ? Q : P, d = (box(L).r - box(R).l) / 2;
          L.x -= d; R.x += d;
        }));
        flagBoxes.forEach((o, gi) => {
          const on = ps.filter(p => p.group === gi && hit(box(p), o));
          on.forEach(p => { const left = on.length > 1 ? p.key === "a" : p.x < (o.l + o.r) / 2; p.x = left ? o.l - gap - p.w / 2 : o.r + gap + p.w / 2; });
        });
      }
      ps.forEach(p => { p.x = clamp(p.x, p.w / 2 + 2, s.cw - p.w / 2 - 2); p.dx = p.x - p.bx; p.dy = p.y - p.by; });
    }
    // All three mountains in one stage, or (only = area index) just that area's mountain in its own stage.
    function buildMountains(s, only) {
      s.maxYaw = 0.75;
      const solo = only !== undefined, groups = [], flags = [], phase = [];
      AREAS.forEach((ar, i) => {
        if (solo && i !== only) return;
        const gi = groups.length, seed = 1.3 + i * 2.1, g = new THREE.Group(); s.scene.add(g); groups.push(g); phase.push(i);
        g.add(new THREE.Mesh(mountainGeometry(seed), std(0xffffff, { vertexColors: true, flatShading: true, roughness: 0.95 })));
        const ground = new THREE.Mesh(new THREE.CircleGeometry(1.75, 40), std(hexInt(TH.soft), { roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -H_M / 2 - 0.005; g.add(ground);
        const sh = blobShadow(3.6, 3.6, 0.18); sh.position.y = -H_M / 2; g.add(sh);
        const r = rng(77 + i);
        for (let n = 0; n < 7; n++) {
          const a = Math.PI * (0.15 + 0.7 * r()) + (n % 2 ? Math.PI : 0), d = 1.45 + r() * 0.25;
          const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 5), std(0x86bf6f));
          tuft.position.set(Math.cos(a) * d, -H_M / 2 + 0.1, Math.sin(a) * d); g.add(tuft);
        }
        for (let n = 0; n < 3; n++) {
          const cl = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), std(0xffffff, { roughness: 1, transparent: true, opacity: 0.85 }));
          cl.scale.set(1.5, 0.45, 0.8); cl.position.set(-1.1 + n * 1.1, -H_M / 2 + 0.06, 1.25 - Math.abs(n - 1) * 0.25); g.add(cl);
        }
        const pts = []; for (let n = 0; n <= 90; n++) pts.push(pathPoint(n / 90, seed, 0.04).p);
        g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, 0.028, 6, false), std(0xf8ebd8, { roughness: 0.8 })));
        // Summit flag ALWAYS planted at the very top of each mountain (never middle, never divided)
        const f = flag(hexInt(TH.deep)); f.position.set(0, H_M / 2 - 0.04, 0); g.add(f); flags.push(f);
        const fA = new THREE.Object3D(), fB = new THREE.Object3D(); fA.position.set(-0.05, 0, 0); fB.position.set(0.42, 0.68, 0); f.add(fA, fB);
        f.userData.box = [fA, fB];
        // Participant circular face portraits climbing along the trail at exact %
        KEYS.forEach(k => {
          const pp = pathPoint(ar[k] / 100, seed, 0.12), at = new THREE.Object3D(); at.position.copy(pp.p); g.add(at);
          pin(s, at, `<img data-char-slot="face-${k}" src="${esc(PPL[k].face)}" alt="${esc(PPL[k].name)}"><span class="t ${k}">${esc(PPL[k].name)}${POOL ? "" : " " + pc(ar[k])}</span>`, "face-pin", { normal: pp.n, dy: 8, group: gi, key: k });
        });
      });
      const spread = () => { declutter(s, groups, flags); s.dirty = true; kick(); };
      s.layout = aspect => {
        if (solo) { groups[0].position.set(0, 0, 0); fitCamera(s, 1.9, 2.2, new V3(0, 0.1, 0), 0.1); }   // flag to base clouds in view
        else if (aspect < 0.95) { groups.forEach((g, i) => g.position.set(0, (1 - i) * 3.45, 0)); fitCamera(s, 2.05, 6.0, new V3(0, 0.75, 0), 0.1); }
        else { groups.forEach((g, i) => g.position.set((i - 1) * 3.75, 0, 0)); fitCamera(s, 6.0, 2.05, new V3(0, 0.25, 0), 0.1); }
        declutter(s, groups, flags);
      };
      s.ov.querySelectorAll("img").forEach(im => { if (!im.complete) im.addEventListener("load", spread); });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(spread);
      s.update = t => {
        groups.forEach((g, i) => { g.rotation.y = s.yaw + (t ? Math.sin(t * 0.45 + phase[i]) * 0.08 : 0); g.rotation.x = s.pitch * 0.5; });
        flags.forEach((f, i) => { f.userData.cloth.rotation.y = t ? Math.sin(t * 3 + phase[i]) * 0.35 : 0; });
      };
    }

    /* ---------- 5a. Three 3D Seesaws (both participants actually sitting on the seesaw ends) ---------- */
    // All three seesaws in one stage, or (only = area index) just that area's seesaw in its own stage.
    function buildSeesaws(s, only) {
      s.maxYaw = 0.7;
      /* Interactive: grab either side (the rider, or that half of the plank) and lift or push it.
         Only the dragged person's % changes and the other person's stays fixed, so the plank angle always
         matches the two numbers shown. On release a damped spring takes the plank back to its real angle and
         the real results come back. The riders feel gravity, so a quick flick makes them hop off the seat.
         This is only a temporary interaction: nothing in REPORT changes. */
      const TILT = 0.42, ARM = 1.38, HALF = 1.675, GROUND = 0.55;   // angle per 100 points, seat, plank end, ground contact
      // Teammates pool: the seesaw dips towards the person reaching more (no numbers at rest; scores run 25%–100%).
      // Other reports: whoever reaches more sits higher (scores run 0%–100%).
      const SGN = POOL ? 1 : -1, MINV = POOL ? 25 : 0;
      const G = 16, VMAX = 2.4, SUB = 1 / 240;                       // rider gravity, top launch speed, physics step
      const solo = only !== undefined, groups = [], rigs = [], phase = [];
      AREAS.forEach((ar, i) => {
        if (solo && i !== only) return;
        const g = new THREE.Group(); s.scene.add(g); groups.push(g); phase.push(i);
        const ground = new THREE.Mesh(new THREE.CircleGeometry(1.9, 40), std(hexInt(TH.soft), { roughness: 1 })); ground.rotation.x = -Math.PI / 2; g.add(ground);
        const sh = blobShadow(3.4, 1.6, 0.22); sh.position.y = 0.005; g.add(sh);
        const r = rng(31 + i);
        for (let n = 0; n < 5; n++) {
          const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16 + r() * 0.12, 0), std(0xcdb9b3, { flatShading: true, roughness: 1 }));
          rock.position.set((r() - 0.5) * 1.0, 0.08, (r() - 0.5) * 0.7); rock.rotation.set(r() * 3, r() * 3, r() * 3); g.add(rock);
        }
        for (let n = 0; n < 6; n++) {
          const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 5), std(0x86bf6f));
          const a = r() * Math.PI * 2, d = 1.1 + r() * 0.6; tuft.position.set(Math.cos(a) * d, 0.1, Math.sin(a) * d * 0.6); g.add(tuft);
        }
        const tri = new THREE.Shape(); tri.moveTo(-0.42, 0); tri.lineTo(0.42, 0); tri.lineTo(0.07, 0.86); tri.lineTo(-0.07, 0.86); tri.lineTo(-0.42, 0);
        const ful = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.42, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 }), std(0x9c6a45, { roughness: 0.85 }));
        ful.position.z = -0.21; g.add(ful);
        const pv = new THREE.Group(); pv.position.y = 0.93; g.add(pv);
        const plank = new THREE.Mesh(new THREE.BoxGeometry(3.35, 0.12, 0.52), std(0xcc8f59, { roughness: 0.8 })); pv.add(plank);
        [-1, 1].forEach(sd => {
          const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.28, 8), std(0x8a5a3a)); hd.position.set(sd * 1.02, 0.19, 0); pv.add(hd);
          const barM = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.34, 8), std(0x8a5a3a)); barM.rotation.x = Math.PI / 2; barM.position.set(sd * 1.02, 0.33, 0); pv.add(barM);
        });
        const rig = { g, pv, ar, rest: SGN * clamp((ar.a - ar.b) / 100, -1, 1) * TILT, ang: 0, vel: 0, mode: "intro", drag: null, key: null, riders: {} };
        rig.ang = rig.rest;
        KEYS.forEach(k => {
          const sx = k === "a" ? -ARM : ARM, at = new THREE.Object3D(); at.position.set(sx, 0.07, 0.04); pv.add(at);
          const text = POOL ? PPL[k].name : `${PPL[k].name} ${pc(ar[k])}`;
          pin(s, at, `<span class="t ${k}">${esc(text)}</span><img class="sitter" data-char-slot="seated-${k}" src="${esc(PPL[k].seated)}" alt="${esc(PPL[k].name)} sitting on seesaw">`, "rider-pin");
          const el = s.pins[s.pins.length - 1].el;
          rig.riders[k] = { k, at, sx, el, box: el.firstElementChild, label: el.querySelector(".t"), shown: text, y: 0, v: 0, sy: 0 };
        });
        rigs.push(rig);
      });
      s.layout = aspect => {
        if (solo) { groups[0].position.set(0, 0, 0); fitCamera(s, 2.1, 1.9, new V3(0, 1.2, 0), 0.2); }    // room above for a lifted rider's label
        else if (aspect < 0.95) { groups.forEach((g, i) => g.position.set(0, (1 - i) * 2.95 - 0.55, 0)); fitCamera(s, 2.2, 4.65, new V3(0, 0.35, 0), 0.2); }
        else { groups.forEach((g, i) => g.position.set((i - 1) * 4.2, 0, 0)); fitCamera(s, 6.15, 1.72, new V3(0, 1.02, 0), 0.2); }
      };
      // The angle where person k has value v (the other person keeps their real value), and the reverse.
      const angleFor = (rig, k, v) => SGN * clamp(((k === "a" ? v : rig.ar.a) - (k === "b" ? v : rig.ar.b)) / 100, -1, 1) * TILT;
      // Teammates shows the live value with two decimals; the other reports round it to a whole number.
      const valueAt = (rig, k, ang) => { const v = k === "b" ? rig.ar.a - SGN * ang / TILT * 100 : rig.ar.b + SGN * ang / TILT * 100; return clamp(POOL ? v : Math.round(v), MINV, 100); };
      const limitOf = v => (v >= 100 ? 100 : v <= MINV ? MINV : null);
      const soft = x => 0.07 * (1 - Math.exp(-x / 0.07));          // gentle resistance past the lowest or highest score
      // Teammates: the label above each rider shows the name only, never a %, even while it is moved.
      // Other reports: the name and the live % (the real % at rest).
      function show(R, v) {
        const text = POOL ? PPL[R.k].name : `${PPL[R.k].name} ${pc(v)}`;
        if (R.shown !== text) { R.shown = text; R.label.textContent = text; }
      }
      function seat(rig, R) { R.sy = R.y = R.sx * Math.sin(rig.ang) + 0.07 * Math.cos(rig.ang); R.v = 0; }
      function settle(rig) {
        rig.ang = rig.rest; rig.vel = 0; rig.mode = "rest"; rig.key = null; rig.pv.rotation.z = rig.ang;
        KEYS.forEach(k => { const R = rig.riders[k]; show(R, rig.ar[k]); R.at.position.set(R.sx, 0.07, 0.04); });
      }
      function bump(R) {
        R.label.classList.remove("pop"); void R.label.offsetWidth; R.label.classList.add("pop");
        if (!RM && navigator.vibrate) try { navigator.vibrate(8); } catch (_) {}
      }

      // Hit test in screen space: a rider (label + picture), or the plank between the middle and one end.
      const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(), hp = new V3(), hn = new V3(), sp = new V3();
      const P0 = { x: 0, y: 0 }, P1 = { x: 0, y: 0 };
      const origin = () => { const r = s.el.getBoundingClientRect(); return { x: r.left + s.el.clientLeft, y: r.top + s.el.clientTop }; };
      const screenOf = (obj, x, out) => { sp.set(x, 0, 0); obj.localToWorld(sp).project(s.camera); out.x = (sp.x * 0.5 + 0.5) * s.cw; out.y = (-sp.y * 0.5 + 0.5) * s.ch; };
      function hitTest(cx, cy, coarse) {
        const o = origin(), px = cx - o.x, py = cy - o.y, pad = coarse ? 10 : 4, tol = coarse ? 20 : 11;
        let best = null;
        rigs.forEach(rig => KEYS.forEach(k => {
          const b = rig.riders[k].box.getBoundingClientRect();
          if (cx >= b.left - pad && cx <= b.right + pad && cy >= b.top - pad && cy <= b.bottom + pad) {
            const d = 0.01 * Math.hypot(cx - (b.left + b.right) / 2, cy - (b.top + b.bottom) / 2);
            if (!best || d < best.d) best = { rig, k, d };
          }
          screenOf(rig.pv, 0, P0); screenOf(rig.pv, k === "a" ? -HALF : HALF, P1);
          const ex = P1.x - P0.x, ey = P1.y - P0.y, u = ((px - P0.x) * ex + (py - P0.y) * ey) / (ex * ex + ey * ey || 1);
          if (u < 0.18 || u > 1.08) return;
          const d = Math.hypot(px - P0.x - u * ex, py - P0.y - u * ey);
          if (d <= tol && (!best || d < best.d)) best = { rig, k, d };
        }));
        return best;
      }
      // Where the pointer is in the seesaw's own plane, relative to the pivot (world units).
      function inPlane(rig, cx, cy) {
        const o = origin();
        ndc.set((cx - o.x) / Math.max(1, s.cw) * 2 - 1, 1 - (cy - o.y) / Math.max(1, s.ch) * 2);
        s.camera.updateMatrixWorld(); ray.setFromCamera(ndc, s.camera);
        rig.g.updateMatrixWorld(true); hn.set(0, 0, 1).transformDirection(rig.g.matrixWorld);
        rig.pv.getWorldPosition(hp); plane.setFromNormalAndCoplanarPoint(hn, hp);
        if (!ray.ray.intersectPlane(plane, hp)) return null;
        rig.g.worldToLocal(hp);
        return { x: hp.x - rig.pv.position.x, y: hp.y - rig.pv.position.y };
      }

      let hot = null, touchDrags = 0;
      function hover(hit) {
        const R = hit ? hit.rig.riders[hit.k] : null;
        if (R === hot) return;
        if (hot) hot.el.classList.remove("hot");
        hot = R; if (hot) hot.el.classList.add("hot");
      }
      s.press = e => {                                   // called by the stage before its own drag-to-turn
        const hit = hitTest(e.clientX, e.clientY, e.pointerType !== "mouse");
        if (!hit) return false;
        const rig = hit.rig;
        if (rig.drag) return true;                       // already held by another finger
        const p = inPlane(rig, e.clientX, e.clientY);
        if (!p) return false;
        const sg = hit.k === "b" ? 1 : -1, r = clamp(Math.abs(p.x), 0.7, HALF), a0 = angleFor(rig, hit.k, MINV), a1 = angleFor(rig, hit.k, 100);
        if (rig.mode === "intro" || rig.mode === "rest") KEYS.forEach(k => seat(rig, rig.riders[k]));
        if (rig.key && rig.key !== hit.k) show(rig.riders[rig.key], rig.ar[rig.key]);
        rig.drag = { id: e.pointerId, k: hit.k, sg, r, y0: p.y, h0: sg * r * Math.sin(rig.ang), lo: Math.min(a0, a1), hi: Math.max(a0, a1),
          cx: e.clientX, cy: e.clientY, goal: rig.ang, touch: e.pointerType === "touch", limit: limitOf(valueAt(rig, hit.k, rig.ang)) };
        rig.key = hit.k; rig.mode = "drag";
        if (rig.drag.touch) touchDrags++;
        try { s.el.setPointerCapture(e.pointerId); } catch (_) {}
        s.el.classList.add("grabbing");
        rig.riders[hit.k].el.classList.add("held");
        return true;
      };
      s.el.addEventListener("pointermove", e => {
        const rig = rigs.find(r => r.drag && r.drag.id === e.pointerId);
        if (rig) { rig.drag.cx = e.clientX; rig.drag.cy = e.clientY; kick(); }
        else if (e.pointerType === "mouse" && !e.buttons) hover(hitTest(e.clientX, e.clientY, false));
      });
      s.el.addEventListener("pointerleave", () => hover(null));
      const release = e => {
        const rig = rigs.find(r => r.drag && r.drag.id === e.pointerId);
        if (!rig) return;
        if (rig.drag.touch) touchDrags = Math.max(0, touchDrags - 1);
        rig.riders[rig.drag.k].el.classList.remove("held");
        rig.drag = null; rig.mode = "spring";
        if (!rigs.some(r => r.drag)) s.el.classList.remove("grabbing");
        if (RM) settle(rig);
        s.dirty = true; kick();
      };
      ["pointerup", "pointercancel", "lostpointercapture"].forEach(n => s.el.addEventListener(n, release));
      // While a finger holds a seesaw, stop the page scrolling under it. Some browsers send touchstart
      // before pointerdown, so a touch that lands on a seesaw side is also caught here.
      const noScroll = e => {
        if (!e.cancelable) return;
        const t = e.type === "touchstart" && e.changedTouches[0];
        if (touchDrags > 0 || (t && hitTest(t.clientX, t.clientY, true))) e.preventDefault();
      };
      s.el.addEventListener("touchstart", noScroll, { passive: false });
      s.el.addEventListener("touchmove", noScroll, { passive: false });

      // A rider sits on the seat but is pulled down by gravity, so they leave it when it drops or stops fast.
      function fly(rig, R, h) {
        const sy = R.sx * Math.sin(rig.ang) + 0.07 * Math.cos(rig.ang), sv = (sy - R.sy) / h; R.sy = sy;
        R.v -= G * h; R.y += R.v * h;
        if (R.y <= sy) { R.y = sy; R.v = Math.min(sv, VMAX); }
      }
      function step(rig, dt) {
        const D = rig.drag;
        let goal = rig.rest, k = 55, c = 5.4;            // released: a lively spring back to the real angle
        if (D) {
          const p = inPlane(rig, D.cx, D.cy);
          if (p) {
            const raw = D.sg * Math.asin(clamp((D.h0 + p.y - D.y0) / D.r, -0.96, 0.96));
            D.goal = raw > D.hi ? D.hi + soft(raw - D.hi) : raw < D.lo ? D.lo - soft(D.lo - raw) : raw;
          }
          goal = D.goal; k = 700; c = 50;                // held: follow the pointer closely
        }
        if (RM) { if (D) { rig.ang = goal; rig.vel = 0; } else settle(rig); }
        else {
          const n = Math.max(1, Math.ceil(dt / SUB)), h = dt / n;
          for (let j = 0; j < n; j++) {
            rig.vel += (-k * (rig.ang - goal) - c * rig.vel) * h;
            rig.ang += rig.vel * h;
            if (Math.abs(rig.ang) > GROUND) { rig.ang = Math.sign(rig.ang) * GROUND; if (rig.ang * rig.vel > 0) rig.vel *= -0.35; }  // the plank end bumps the ground
            fly(rig, rig.riders.a, h); fly(rig, rig.riders.b, h);
          }
          KEYS.forEach(kk => { const R = rig.riders[kk], hop = R.y - R.sy; R.at.position.set(R.sx + hop * Math.sin(rig.ang), 0.07 + hop * Math.cos(rig.ang), 0.04); });
          if (!D && Math.abs(rig.ang - goal) < 0.002 && Math.abs(rig.vel) < 0.02 && KEYS.every(kk => rig.riders[kk].y - rig.riders[kk].sy < 0.002)) settle(rig);
        }
        if (D) {                                         // a small pop when the dragged person reaches 0% or 100%
          const lim = limitOf(valueAt(rig, D.k, rig.ang));
          if (lim !== null && lim !== D.limit) bump(rig.riders[D.k]);
          D.limit = lim;
        }
      }

      s.update = (t, intro, dt) => {                   // dt comes from the shared animation loop
        dt = dt || 0;
        groups.forEach((g, i) => { g.rotation.y = s.yaw + (t ? Math.sin(t * 0.4 + phase[i]) * 0.06 : 0); g.rotation.x = s.pitch * 0.4; });
        rigs.forEach((rig, i) => {
          if (rig.mode === "intro" || rig.mode === "rest") {
            const ang = rig.mode === "intro" && t && !RM ? rig.rest * (1 - Math.exp(-3 * t) * Math.cos(5.5 * t + phase[i] * 0.3)) : rig.rest;
            rig.vel = dt ? clamp((ang - rig.ang) / dt, -6, 6) : 0; rig.ang = ang;
          } else if (dt || RM) step(rig, dt);
          rig.pv.rotation.z = rig.ang;
          if (rig.key) show(rig.riders[rig.key], valueAt(rig, rig.key, rig.ang));
        });
      };
    }

    /* ---------- 5b. 3D Sculpted Stepping Stones ---------- */
    function buildStones(s) {
      s.maxYaw = 0.35; s.maxPitch = 0.15;
      const root = new THREE.Group(); s.scene.add(root);
      const meshes = { a: [], b: [] }, r = rng(5);
      const mats = {}; [1, 2, 3, 4].forEach(v => (mats[v] = std(STONE_LOOK[v].color, { flatShading: true, roughness: 0.85 })));
      KEYS.forEach(k => REPORT.stones[k].forEach(v => {
        const g = new THREE.IcosahedronGeometry(0.5, 1), p = g.attributes.position;
        for (let j = 0; j < p.count; j++) { const n = 1 + (r() - 0.5) * 0.16; p.setXYZ(j, p.getX(j) * n, p.getY(j) * n, p.getZ(j) * n); }
        g.computeVertexNormals();
        const lv = levelOf(v), m = new THREE.Mesh(g, mats[lv]), sz = STONE_LOOK[lv].size;
        m.scale.set(sz * 1.08, sz * 0.5, sz * 0.92); m.rotation.y = r() * Math.PI; root.add(m); meshes[k].push(m);
      }));
      const lines = {}, labels = [];
      KEYS.forEach(k => {
        const ln = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: hexInt(TH.deep), dashSize: 0.12, gapSize: 0.1 }));
        root.add(ln); lines[k] = ln;
        const at = new THREE.Object3D(); root.add(at);
        pin(s, at, `<img data-char-slot="face-${k}" src="${esc(PPL[k].face)}" alt="${esc(PPL[k].name)}"><span class="t ${k}">${esc(PPL[k].name)}</span>`, "face-pin stone-face mid");
        labels.push({ k, at });
      });
      const areaPins = [];
      for (let row = 0; row < 6; row++) {
        const at = new THREE.Object3D(); root.add(at); const ai = row % 3;
        pin(s, at, `<span class="t">${esc(AREAS[ai].short)}</span>`, "mid");
        areaPins.push(at);
      }
      const ground = blobShadow(16, 6, 0.12); ground.position.y = -0.2; root.add(ground);
      s.layout = aspect => {
        const grid = aspect < 1.25;
        KEYS.forEach((k, pi) => {
          const pts = [];
          meshes[k].forEach((m, i) => {
            let x, z;
            if (grid) { const a = Math.floor(i / 4), j = i % 4; x = 0.1 + j * 1.02; z = (pi * 3 + a) * 1.12 + pi * 0.9 - 3.1; }
            else { const a = Math.floor(i / 4); x = -6.1 + i * 1.02 + a * 0.32 + 0.9; z = (pi ? 1.2 : -1.2) + Math.sin(i * 0.9 + pi * 1.6) * 0.22; }
            m.position.set(x, 0, z); pts.push(new V3(x, -0.08, z));
          });
          lines[k].geometry.dispose();
          lines[k].geometry = new THREE.BufferGeometry().setFromPoints(grid ? pts : new THREE.CatmullRomCurve3(pts).getPoints(160));
          lines[k].computeLineDistances(); lines[k].visible = !grid;
          const first = meshes[k][0].position;
          labels[pi].at.position.set(grid ? -1.45 : first.x - 1.2, 0.2, grid ? first.z - 1.0 : first.z);
        });
        areaPins.forEach((at, row) => {
          const pi = row < 3 ? 0 : 1, ai = row % 3, k = KEYS[pi];
          const ms = meshes[k].slice(ai * 4, ai * 4 + 4);
          if (grid) { at.position.set(-1.45, 0.15, ms[0].position.z); at.visible = true; }
          else { const cx = (ms[0].position.x + ms[3].position.x) / 2; at.position.set(cx, 0.15, pi ? 2.1 : -2.05); at.visible = true; }
        });
        s.pins.forEach(p => (p.el.style.display = p.anchor.visible === false ? "none" : ""));
        if (grid) fitCamera(s, 3.35, 3.75, new V3(0.65, 0, -0.4), 1.05); else fitCamera(s, 7.9, 1.75, new V3(0.15, 0, 0), 0.95);
      };
      s.update = t => { root.rotation.y = s.yaw; root.rotation.x = s.pitch; root.position.y = t ? Math.sin(t * 0.9) * 0.03 : 0; };
    }

    const builders = {
      heart: buildHeart,
      "flower-a": s => buildFlower(s, "a"),
      "flower-b": s => buildFlower(s, "b"),
      mountains: s => buildMountains(s),
      seesaws: s => buildSeesaws(s),
      stones: buildStones
    };
    // Teammates pages 4 and 5: one small stage per area ("mountain-0", "seesaw-2", …)
    AREAS.forEach((_, i) => {
      builders["mountain-" + i] = s => buildMountains(s, i);
      builders["seesaw-" + i] = s => buildSeesaws(s, i);
    });
    document.querySelectorAll(".stage[data-stage]").forEach(el => {
      const b = builders[el.dataset.stage];
      if (b) makeStage(el, b);
    });
    let rz = 0;
    const ro = new ResizeObserver(() => { if (!rz) rz = requestAnimationFrame(() => { rz = 0; sizeAll(); }); });
    stages.forEach(s => ro.observe(s.el));
    sizeAll();
    const onRM = () => { RM = RMQ.matches; stages.forEach(s => (s.dirty = true)); kick(); };
    if (RMQ.addEventListener) RMQ.addEventListener("change", onRM);
    glCanvas.addEventListener("webglcontextlost", e => { e.preventDefault(); lost = true; if (raf) cancelAnimationFrame(raf); raf = 0; });
    glCanvas.addEventListener("webglcontextrestored", () => { lost = false; stages.forEach(s => (s.dirty = true)); kick(); });
  }

  render();
  fitHangs();
  watchNav();
  start3D();
})();
