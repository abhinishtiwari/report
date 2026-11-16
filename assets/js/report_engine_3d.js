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
    users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.6-3.4 2.8-5.2 5.5-5.2s4.9 1.8 5.5 5.2"/><circle cx="16.8" cy="9.4" r="2.5"/><path d="M15.6 13.9c2.5-.3 4.4 1.3 4.9 4.6"/>'
  };
  const STYLE_LOOK = {
    Emotional:  { color: "#d67090", soft: "#fbd9e7", angle: 135, icon: ICON.heart },
    Assertive:  { color: "#de8658", soft: "#fbe3d4", angle: 45,  icon: ICON.bolt },
    Thoughtful: { color: "#64a491", soft: "#dcf0ea", angle: 225, icon: ICON.sprout },
    Logical:    { color: "#6b8dd0", soft: "#dde6f9", angle: 315, icon: ICON.brain }
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
  const pc = v => (Math.round(v * 10) / 10) + "%";
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

  /* ---------------------------------------------------------------- data self-check */
  function checkData() {
    const out = [], totals = {};
    for (const k of KEYS) {
      const p = PPL[k], st = REPORT.stones[k];
      if (st.length !== 12 || st.some(v => ![1, 2, 3, 4].includes(v)))
        out.push(`${p.name}: stepping stones must be 12 answers, each 1, 2, 3 or 4.`);
      const sums = areaSums(k); totals[k] = sums.reduce((x, y) => x + y, 0);
      AREAS.forEach((ar, i) => {
        const c = rEven((sums[i] - 4) / 12 * 100);
        if (Math.abs(c - ar[k]) > 1) out.push(`${p.name}, ${ar.name}: shown as ${ar[k]}%, but stones give ${c}%.`);
      });
      const ov = rEven((totals[k] - 12) / 36 * 100);
      if (Math.abs(ov - REPORT.overall[k]) > 1) out.push(`${p.name}: overall shown as ${REPORT.overall[k]}%, but stones give ${ov}%.`);
      if (count4(k) !== REPORT.inStyle[k])
        out.push(`${p.name}: “answers in the other’s style” shown as ${REPORT.inStyle[k]} of 12, but ${count4(k)} stones are level 4.`);
      const sum = STYLES.reduce((x, s) => x + REPORT.styles[k][s], 0);
      if (Math.abs(sum - 100) > 0.5) out.push(`${p.name}: style scores add up to ${sum}, not 100.`);
      const maxVal = Math.max(...STYLES.map(s => REPORT.styles[k][s]));
      if (REPORT.styles[k][p.style] < maxVal - 0.01)
        out.push(`${p.name}: style is “${p.style}” but a bigger petal exists.`);
    }
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
  function stage(kind, label, fallback, cls, ar, arMobile) {
    return `<div class="stage ${cls || ""}" data-stage="${kind}" style="--ar:${ar};--ar-m:${arMobile || ar}" role="img" tabindex="0"
      aria-label="${esc(label)} Use the left and right arrow keys, or drag sideways, to turn it.">
      <div class="ov" aria-hidden="true"></div>
      <div class="fb" aria-hidden="true">${fallback}<span class="why">3D view unavailable.</span></div>
      <span class="hint" aria-hidden="true">${esc(T.dragHint)}</span></div>`;
  }
  function bar(k, labelText, v) {
    return `<div class="bar ${k}"><span>${esc(labelText)}</span><i><b style="width:${Math.max(0, Math.min(100, v))}%"></b></i><em>${v}%</em></div>`;
  }
  function venn(ar, i) {
    const r = 30, f = Math.max(0, Math.min(1, ar.together / 100));
    const lens = d => (d >= 2 * r ? 0 : (2 * r * r * Math.acos(d / (2 * r)) - (d / 2) * Math.sqrt(4 * r * r - d * d)) / (Math.PI * r * r));
    let lo = 0, hi = 2 * r;
    for (let n = 0; n < 50; n++) { const m = (lo + hi) / 2; if (lens(m) > f) lo = m; else hi = m; }
    const d = (lo + hi) / 2, ax = 70 - d / 2, bx = 70 + d / 2, id = "lens" + i;
    const heart = 2 * r - d > 15 ? `<path transform="translate(70 40) scale(.5) translate(-12 -12)" d="M12 20.5s-7.5-4.6-9.3-9.3C1.4 7.6 3.6 4.5 6.9 4.5c2.1 0 3.6 1.1 5.1 3 1.5-1.9 3-3 5.1-3 3.3 0 5.5 3.1 4.2 6.7-1.8 4.7-9.3 9.3-9.3 9.3z" fill="#fff"/>` : "";
    return `<figure class="venn"><svg viewBox="0 0 140 80" role="img" aria-label="${esc(PPL.a.name)} and ${esc(PPL.b.name)} circles overlap ${ar.together} percent">
      <defs><clipPath id="${id}"><circle cx="${ax.toFixed(2)}" cy="40" r="${r}"/></clipPath></defs>
      <circle cx="${ax.toFixed(2)}" cy="40" r="${r}" fill="${TH.a}" fill-opacity=".42"/>
      <circle cx="${bx.toFixed(2)}" cy="40" r="${r}" fill="${TH.b}" fill-opacity=".42"/>
      <circle cx="${bx.toFixed(2)}" cy="40" r="${r}" fill="${TH.deep}" clip-path="url(#${id})"/>${heart}
      <text x="${(ax - r + 4).toFixed(1)}" y="13" font-size="10" font-weight="800" fill="${TH.deep}">${esc(PPL.a.name[0])}</text>
      <text x="${(bx + r - 11).toFixed(1)}" y="13" font-size="10" font-weight="800" fill="${TH.deep}">${esc(PPL.b.name[0])}</text>
    </svg><figcaption>Overlap ${ar.together}%</figcaption></figure>`;
  }

  /* ---------------------------------------------------------------- render report DOM */
  function render() {
    const A = PPL.a, B = PPL.b;
    const issues = checkData();
    const fallbackStones = k => AREAS.map((ar, i) => `${ar.short}: ${REPORT.stones[k].slice(i * 4, i * 4 + 4).map(v => T.levels[levelOf(v)]).join(", ")}`).join(". ");

    const nav = [["p1", "Heart"], ["p2", "Flowers"], ["p3", "Overlap"], ["p4", "Mountains"], ["p5", "Balance"], ["p6", "Method"], ["p7", "Research"]];
    document.getElementById("nav").innerHTML = nav.map(([id, l], i) => `<a href="#${id}" aria-label="${i + 1}/7 ${l}"><b>${i + 1}</b><span>${l}</span></a>`).join("");

    const switcher = document.getElementById("rel-switcher");
    if (switcher && Array.isArray(REPORT.allReports)) {
      switcher.innerHTML = REPORT.allReports.map(r =>
        `<option value="${esc(r.href)}"${r.slug === REPORT.slug ? " selected" : ""}>${esc(r.num)}. ${esc(r.type)} (${esc(r.names)})</option>`
      ).join("");
      switcher.addEventListener("change", e => { if (e.target.value) window.location.href = e.target.value; });
    }

    const html = [];
    if (issues.length) html.push(`<div class="check" role="status"><b>Data check: some numbers don’t agree</b>${issues.map(esc).join("<br>")}</div>`);

    /* Page 1 — Relationship Overview + 3D Glass Heart */
    html.push(`<section class="page" id="p1" aria-labelledby="p1-t"><span class="pg">1/7</span>
      <p class="kicker">${esc(T.kicker)}</p>
      <p class="pill"><img class="emblem" src="${esc(REPORT.images.emblem)}" alt="">${esc(REPORT.type)}</p>
      <p class="names">${esc(A.name)} &amp; ${esc(B.name)}</p>
      ${title(T.heroTitle, "h1", "p1-t")}
      <p class="lede">${esc(T.heroLine)}</p>
      <div class="hero-row">
        <div class="couple-wrap">
          <img class="couple" src="${esc(REPORT.images.coverPair)}" width="580" height="460" alt="${esc(A.name)} and ${esc(B.name)} together">
        </div>
        ${stage("heart", `A 3D glass heart filled to ${REPORT.overall.together}%, with the words ${T.heartWords}.`, `<b style="font-size:2rem;font-family:var(--serif)">${REPORT.overall.together}%</b><br>${esc(T.heartWords)}`, "", "1/1")}
      </div>
      <p class="note">${esc(T.heartNote)}</p>
      <div class="chips">
        <div class="chip c1">${svg(ICON.sun)}<small>${esc(T.highlights[0].label)}</small><b>${esc(T.highlights[0].value)}</b></div>
        <div class="chip c2">${svg(ICON.sprout)}<small>${esc(T.highlights[1].label)}</small><b>${esc(T.highlights[1].value)}</b></div>
        <div class="chip c3">${svg(ICON.sparkle)}<small>${esc(T.highlights[2].label)}</small><b>${esc(T.highlights[2].value)}</b></div>
      </div></section>`);

    /* Page 2 — Your Style Flowers */
    const flowerCard = k => {
      const p = PPL[k], s = REPORT.styles[k];
      const label = `${p.name}’s style flower: ` + STYLES.map(x => `${x} ${pc(s[x])}`).join(", ") + ".";
      return `<figure class="flower">${stage("flower-" + k, label, esc(label), "", "1/1")}
        <figcaption class="person"><img src="${esc(p.bust)}" alt="${esc(p.name)} portrait" width="120" height="120">
          <div><h3>${esc(p.name)} <span class="role-tag">(${esc(p.role)})</span> · ${esc(p.style)}</h3><p>${esc(p.line)}.</p></div>
        </figcaption></figure>`;
    };
    html.push(`<section class="page" id="p2" aria-labelledby="p2-t"><span class="pg">2/7</span>
      ${title(T.flowersTitle, "h2", "p2-t")}<p class="lede">${esc(T.flowersLede)}</p>
      <div class="flowers">${flowerCard("a")}${flowerCard("b")}</div>
      <div class="box"><h3>${esc(T.readingTitle)}</h3><ul class="dots">${T.readingHtml.map(r => `<li><span>${r}</span></li>`).join("")}</ul></div>
    </section>`);

    /* Page 3 — Overlap in Every Area (character emotion scenes + compact side Venn) */
    html.push(`<section class="page" id="p3" aria-labelledby="p3-t"><span class="pg">3/7</span>
      ${title(T.overlapTitle, "h2", "p3-t")}<p class="lede">${esc(T.overlapLede)}</p>
      ${AREAS.map((ar, i) => `<article class="area">
        <div class="scene-frame">
          <img class="scene" src="${esc(ar.scene)}" alt="${esc(ar.sceneAlt)}" width="480" height="320" loading="lazy">
        </div>
        <div class="area-body">
          <div class="area-head"><img class="icon" src="${esc(ar.icon)}" alt="" width="64" height="64"><div><h3>${esc(ar.name)}</h3><span class="status">${esc(ar.status)}</span></div></div>
          <p>${esc(ar.line)}</p>
          <div class="area-data">
            <div class="bars">${bar("a", ar.reachA, ar.a)}${bar("b", ar.reachB, ar.b)}<span class="cite-mini">${esc(ar.citation)}</span></div>
            ${venn(ar, i)}
          </div>
        </div></article>`).join("")}
      <div class="know"><b>${esc(T.didYouKnowTitle)}</b><span>${esc(T.didYouKnow)}</span></div>
    </section>`);

    /* Page 4 — Three Mountains to Climb (flag ALWAYS at summit + circular face pins) */
    const mLabel = "Three mountains. " + AREAS.map(ar => `${ar.name}: summit flag at top, ${A.name} at ${ar.a}%, ${B.name} at ${ar.b}%.`).join(" ");
    html.push(`<section class="page" id="p4" aria-labelledby="p4-t"><span class="pg">4/7</span>
      ${title(T.mountainsTitle, "h2", "p4-t")}<p class="lede">${esc(T.mountainsLede)}</p>
      ${stage("mountains", mLabel, AREAS.map(ar => `<p><b>${esc(ar.name)}</b>: Together ${ar.together}% (${esc(A.name)} ${ar.a}%, ${esc(B.name)} ${ar.b}%)</p>`).join(""), "wide", "16/7.2", "3/5.6")}
      <div class="cards3">${AREAS.map(ar => `<div class="card"><img src="${esc(ar.icon)}" alt="" width="64" height="64"><b>${esc(ar.name)}</b><span class="together-pill">Together · ${ar.together}%</span><span>${esc(ar.status)}</span></div>`).join("")}</div>
      <div class="box"><h3>${esc(T.mountainsBox)}</h3><ul class="dots">${T.mountainsBulletsHtml.map(b => `<li><span>${b}</span></li>`).join("")}</ul></div>
    </section>`);

    /* Page 5 — Balance and Footsteps (both participants seated on 3D seesaws + 3D stepping stones) */
    const sLabel = "Three seesaws. " + AREAS.map(ar => `${ar.name}: ${ar.tilt} (${A.name} ${ar.a}%, ${B.name} ${ar.b}%).`).join(" ");
    html.push(`<section class="page" id="p5" aria-labelledby="p5-t"><span class="pg">5/7</span>
      ${title(T.balanceTitle, "h2", "p5-t")}<p class="lede">${esc(T.balanceLede)}</p>
      ${stage("seesaws", sLabel, AREAS.map(ar => `<p><b>${esc(ar.name)}</b>: ${esc(ar.tilt)} (${esc(A.name)} ${ar.a}%, ${esc(B.name)} ${ar.b}%)</p>`).join(""), "wide", "16/6.6", "3/4.8")}
      <div class="cards3">${AREAS.map(ar => `<div class="card"><img src="${esc(ar.icon)}" alt="" width="64" height="64"><b>${esc(ar.name)}</b><span class="tilt">${esc(ar.tilt)}</span></div>`).join("")}</div>
      <h3 class="sub">${esc(T.stonesTitle)}</h3><p class="lede">${esc(T.stonesLede)}</p>
      <ul class="legend">${[4, 3, 2, 1].map(v => `<li><i style="background:${STONE_LOOK[v].color}"></i>${esc(T.levels[v])}</li>`).join("")}</ul>
      ${stage("stones", `Stepping stones. ${A.name}: ${fallbackStones("a")}. ${B.name}: ${fallbackStones("b")}.`, KEYS.map(k => `<p><b>${esc(PPL[k].name)}</b>: ${esc(fallbackStones(k))}</p>`).join(""), "wide", "16/6.6", "3/3.9")}
      <div class="box"><h3>${esc(T.footstepsTitle)}</h3><ul class="dots">${T.footstepsBulletsHtml.map(b => `<li><span>${b}</span></li>`).join("")}</ul></div>
    </section>`);

    /* Page 6 — How We Worked This Out (scoring table + colour key + disclaimer) */
    html.push(`<section class="page" id="p6" aria-labelledby="p6-t"><span class="pg">6/7</span>
      ${title(T.methodTitle, "h2", "p6-t")}<p class="lede">${esc(T.methodLede)}</p>
      <div class="table-wrap">
        <table class="score-table">
          <thead><tr>${T.tableHeaders.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead>
          <tbody>
            ${T.tableRows.map(row => `<tr class="${row[0] === "Overall" ? "overall-row" : ""}">${row.map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
      </div>
      <div class="box keys"><b>${esc(T.keyTitle)}</b>
        <ul class="legend">${["Assertive", "Emotional", "Thoughtful", "Logical"].map(x => `<li><span class="ic" style="background:${STYLE_LOOK[x].color}">${svg(STYLE_LOOK[x].icon)}</span>${x}</li>`).join("")}</ul>
        <span></span><ul class="legend">${[4, 3, 2, 1].map(v => `<li><i style="background:${STONE_LOOK[v].color}"></i>${esc(T.levels[v])}</li>`).join("")}</ul>
        ${T.sameStyleNote ? `<p class="same-note">${esc(T.sameStyleNote)}</p>` : ""}
      </div>
      <div class="remember">
        <div><h3>${esc(T.rememberTitle)}</h3><p>${T.rememberHtml}</p></div>
        <img class="harmony" src="${esc(REPORT.images.harmony)}" alt="${esc(A.name)} and ${esc(B.name)}" loading="lazy">
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
    function link(s, from, to, color, bend) {
      const NS = "http://www.w3.org/2000/svg";
      if (!s.svg) { s.svg = document.createElementNS(NS, "svg"); s.svg.setAttribute("class", "links"); s.svg.setAttribute("aria-hidden", "true"); s.ov.prepend(s.svg); }
      const p = document.createElementNS(NS, "path"); p.setAttribute("stroke", color); s.svg.appendChild(p);
      s.links.push({ from, to, p, bend });
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
            if (s.update) s.update(0, 1);
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
        if (s.update) s.update(RM ? 0 : t, intro);
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
      g.font = '400 190px "DM Serif Display", Georgia, serif'; g.fillText(pct + "%", 300, 205);
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

    /* ---------- 2. 3D Watercolour Style Flowers ---------- */
    function petalShape() {
      const p = new THREE.Shape();
      p.moveTo(0, 0);
      p.bezierCurveTo(-0.46, 0.08, -0.62, 0.62, -0.34, 0.9);
      p.bezierCurveTo(-0.2, 1.04, -0.05, 1.0, 0, 0.9);
      p.bezierCurveTo(0.05, 1.0, 0.2, 1.04, 0.34, 0.9);
      p.bezierCurveTo(0.62, 0.62, 0.46, 0.08, 0, 0);
      return p;
    }
    const rgbOf = hex => [hex >> 16 & 255, hex >> 8 & 255, hex & 255];
    const mixRGB = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
    const rgba = (c, a) => `rgba(${c.map(Math.round).join(",")},${a})`;
    function washTexture(shape, hex, strength, seed, veins) {
      const S = 256, M = 6, pts = shape.getPoints(48), xs = pts.map(p => p.x), ys = pts.map(p => p.y);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const tx = x => M + (x - x0) / (x1 - x0) * (S - 2 * M), ty = y => S - M - (y - y0) / (y1 - y0) * (S - 2 * M);
      const c = document.createElement("canvas"); c.width = c.height = S; const g = c.getContext("2d");
      const paper = [253, 249, 246], full = rgbOf(hex);
      const deep = mixRGB(paper, full, strength), mid = mixRGB(paper, full, strength * 0.5), tip = mixRGB(paper, full, strength * 0.78);
      const outline = () => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(tx(p.x), ty(p.y)) : g.moveTo(tx(p.x), ty(p.y)))); g.closePath(); };
      outline(); g.save(); g.clip();
      const lg = g.createLinearGradient(0, S, 0, 0);
      lg.addColorStop(0, rgba(deep, 1)); lg.addColorStop(0.5, rgba(mid, 1)); lg.addColorStop(1, rgba(tip, 1));
      g.fillStyle = lg; g.fillRect(0, 0, S, S);
      const r = rng(seed);
      for (let i = 0; i < 16; i++) {
        const x = r() * S, y = r() * S, rad = 18 + r() * 70, cc = r() < 0.55 ? deep : paper;
        const rg = g.createRadialGradient(x, y, 0, x, y, rad); rg.addColorStop(0, rgba(cc, 0.14 + r() * 0.14)); rg.addColorStop(1, rgba(cc, 0));
        g.fillStyle = rg; g.fillRect(0, 0, S, S);
      }
      const sheen = g.createRadialGradient(S * 0.42, S * 0.36, 4, S * 0.42, S * 0.36, S * 0.42);
      sheen.addColorStop(0, "rgba(255,255,255,0.32)"); sheen.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = sheen; g.fillRect(0, 0, S, S);
      g.strokeStyle = rgba(mixRGB(deep, [70, 25, 60], 0.3), 0.2); g.lineWidth = 1.3;
      for (let i = 0; i < veins; i++) {
        const o = veins === 1 ? 0 : (i / (veins - 1) - 0.5) * 2;
        g.beginPath(); g.moveTo(tx(0), ty(y0) - 2); g.quadraticCurveTo(tx(o * 0.12), S * 0.45, tx(o * 0.3), S * 0.14 + Math.abs(o) * 28); g.stroke();
      }
      g.restore();
      outline(); g.lineWidth = 6; g.strokeStyle = rgba(deep, 0.42); g.stroke();
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      return { t, uv: (x, y) => [tx(x) / S, 1 - ty(y) / S] };
    }
    function washGeometry(shape, wash, cup) {
      const g = new THREE.ShapeGeometry(shape, 28), p = g.attributes.position, uv = g.attributes.uv;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), [u, v] = wash.uv(x, y); uv.setXY(i, u, v); p.setZ(i, cup * (x * x * 1.1 + y * y * 0.35)); }
      g.computeVertexNormals(); return g;
    }
    function buildFlower(s, k) {
      s.maxYaw = 1.1; s.pad = 0.15;
      const root = new THREE.Group(); s.scene.add(root);
      const flower = new THREE.Group(); flower.rotation.x = -0.36; root.add(flower);
      const sh = blobShadow(4.4, 4.4, 0.12); sh.rotation.x = 0; sh.position.z = -0.3; flower.add(sh);
      const vals = REPORT.styles[k], vmax = Math.max(1e-6, ...STYLES.map(st => vals[st])), seed0 = k === "a" ? 0 : 50;
      const shape = petalShape(), L = 1.5, r0 = 0.12;
      const leafShape = new THREE.Shape(); leafShape.moveTo(0, 0); leafShape.quadraticCurveTo(-0.3, 0.42, 0, 0.98); leafShape.quadraticCurveTo(0.3, 0.42, 0, 0);
      const leafWash = washTexture(leafShape, 0x86ad72, 0.85, 11 + seed0, 1), leafGeo = washGeometry(leafShape, leafWash, 0.12);
      const leafMat = new THREE.MeshBasicMaterial({ map: leafWash.t, transparent: true, side: THREE.DoubleSide, depthWrite: false });
      [0, 90, 180, 270].forEach((deg, i) => {
        const a = deg * Math.PI / 180, m = new THREE.Mesh(leafGeo, leafMat);
        m.rotation.z = a - Math.PI / 2; m.position.set(Math.cos(a) * 0.55, Math.sin(a) * 0.55, -0.1); m.scale.setScalar(0.9 + (i % 2) * 0.15); m.renderOrder = 1; flower.add(m);
      });
      const order = STYLES.slice().sort((x, y) => vals[x] - vals[y]);
      STYLES.forEach((st, si) => {
        const look = STYLE_LOOK[st], rel = clamp(vals[st] / vmax, 0, 1), a = look.angle * Math.PI / 180, rank = order.indexOf(st);
        const size = 0.55 + 0.45 * rel, wash = washTexture(shape, hexInt(look.color), 0.3 + 0.62 * rel, 3 + si * 7 + seed0, 5);
        const arm = new THREE.Group(); arm.rotation.z = a - Math.PI / 2; flower.add(arm);
        const tilt = new THREE.Group(); tilt.position.y = r0; tilt.rotation.x = 0.22; arm.add(tilt);
        const petal = new THREE.Mesh(washGeometry(shape, wash, 0.3), new THREE.MeshBasicMaterial({ map: wash.t, transparent: true, opacity: 0.95, side: THREE.DoubleSide, depthWrite: false }));
        petal.scale.setScalar(L * size); petal.position.z = 0.02 + rank * 0.03; petal.renderOrder = 2 + rank; tilt.add(petal);
        const tipAt = new THREE.Object3D(); tipAt.position.set(0, L * size * 0.84, 0.06 + rank * 0.03); tilt.add(tipAt);
        const labAt = new THREE.Object3D(); labAt.position.set(Math.cos(a) * 2.2, Math.sin(a) * 2.2, 0.2); flower.add(labAt);
        link(s, labAt, tipAt, TH.deep, look.angle === 45 || look.angle === 225 ? 1 : -1);
        pin(s, labAt, `<div class="lab">${svg(look.icon)}<b>${st}</b><span>${pc(vals[st])}</span></div>`, "mid");
      });
      const r = rng(21 + seed0), fil = new THREE.CylinderGeometry(0.006, 0.009, 1, 5), dot = new THREE.SphereGeometry(0.03, 10, 8), up = new V3(0, 1, 0);
      fil.translate(0, 0.5, 0);
      const stalk = std(0xe6c56c, { roughness: 0.6 }), gold = std(0xcf9a35, { roughness: 0.45 });
      for (let n = 0; n < 26; n++) {
        const ang = n / 26 * Math.PI * 2 + r() * 0.2, len = 0.22 + r() * 0.2, dir = new V3(Math.cos(ang) * len, Math.sin(ang) * len, 0.1 + r() * 0.12), l = dir.length();
        dir.normalize();
        const m = new THREE.Mesh(fil, stalk); m.scale.y = l; m.quaternion.setFromUnitVectors(up, dir); m.position.z = 0.14; flower.add(m);
        const d = new THREE.Mesh(dot, gold); d.position.copy(dir).multiplyScalar(l); d.position.z += 0.14; flower.add(d);
      }
      const bud = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 14), std(0xf0d78a, { roughness: 0.7 })); bud.scale.z = 0.6; bud.position.z = 0.14; flower.add(bud);
      s.layout = () => fitCamera(s, 2.35, 2.3, new V3(0, 0, 0), 0.05);
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
    function buildMountains(s) {
      s.maxYaw = 0.75;
      const groups = [], flags = [];
      AREAS.forEach((ar, i) => {
        const seed = 1.3 + i * 2.1, g = new THREE.Group(); s.scene.add(g); groups.push(g);
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
          pin(s, at, `<img src="${esc(PPL[k].face)}" alt="${esc(PPL[k].name)}"><span class="t ${k}">${esc(PPL[k].name)} ${ar[k]}%</span>`, "face-pin", { normal: pp.n, dy: 8, group: i, key: k });
        });
      });
      const spread = () => { declutter(s, groups, flags); s.dirty = true; kick(); };
      s.layout = aspect => {
        if (aspect < 0.95) { groups.forEach((g, i) => g.position.set(0, (1 - i) * 3.45, 0)); fitCamera(s, 2.05, 6.0, new V3(0, 0.75, 0), 0.1); }
        else { groups.forEach((g, i) => g.position.set((i - 1) * 3.75, 0, 0)); fitCamera(s, 6.0, 2.05, new V3(0, 0.25, 0), 0.1); }
        declutter(s, groups, flags);
      };
      s.ov.querySelectorAll("img").forEach(im => { if (!im.complete) im.addEventListener("load", spread); });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(spread);
      s.update = t => {
        groups.forEach((g, i) => { g.rotation.y = s.yaw + (t ? Math.sin(t * 0.45 + i) * 0.08 : 0); g.rotation.x = s.pitch * 0.5; });
        flags.forEach((f, i) => { f.userData.cloth.rotation.y = t ? Math.sin(t * 3 + i) * 0.35 : 0; });
      };
    }

    /* ---------- 5a. Three 3D Seesaws (both participants actually sitting on the seesaw ends) ---------- */
    function buildSeesaws(s) {
      s.maxYaw = 0.7;
      const groups = [], pivots = [];
      AREAS.forEach((ar, i) => {
        const g = new THREE.Group(); s.scene.add(g); groups.push(g);
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
        const pv = new THREE.Group(); pv.position.y = 0.93; g.add(pv); pivots.push(pv);
        const plank = new THREE.Mesh(new THREE.BoxGeometry(3.35, 0.12, 0.52), std(0xcc8f59, { roughness: 0.8 })); pv.add(plank);
        [-1, 1].forEach(sd => {
          const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.28, 8), std(0x8a5a3a)); hd.position.set(sd * 1.02, 0.19, 0); pv.add(hd);
          const barM = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.34, 8), std(0x8a5a3a)); barM.rotation.x = Math.PI / 2; barM.position.set(sd * 1.02, 0.33, 0); pv.add(barM);
        });
        KEYS.forEach(k => {
          const at = new THREE.Object3D(); at.position.set(k === "a" ? -1.38 : 1.38, 0.07, 0.04); pv.add(at);
          pin(s, at, `<span class="t ${k}">${esc(PPL[k].name)} ${ar[k]}%</span><img class="sitter" src="${esc(PPL[k].seated)}" alt="${esc(PPL[k].name)} sitting on seesaw">`, "rider-pin");
        });
        pv.userData.target = -clamp((ar.a - ar.b) / 100, -1, 1) * 0.42;
      });
      s.layout = aspect => {
        if (aspect < 0.95) { groups.forEach((g, i) => g.position.set(0, (1 - i) * 2.95 - 0.55, 0)); fitCamera(s, 2.2, 4.65, new V3(0, 0.35, 0), 0.2); }
        else { groups.forEach((g, i) => g.position.set((i - 1) * 4.2, 0, 0)); fitCamera(s, 6.15, 1.72, new V3(0, 1.02, 0), 0.2); }
      };
      s.update = t => {
        groups.forEach((g, i) => { g.rotation.y = s.yaw + (t ? Math.sin(t * 0.4 + i) * 0.06 : 0); g.rotation.x = s.pitch * 0.4; });
        pivots.forEach((pv, i) => { const spring = t ? 1 - Math.exp(-3 * t) * Math.cos(5.5 * t + i * 0.3) : 1; pv.rotation.z = pv.userData.target * (RM ? 1 : spring); });
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
        pin(s, at, `<img src="${esc(PPL[k].face)}" alt="${esc(PPL[k].name)}"><span class="t ${k}">${esc(PPL[k].name)}</span>`, "face-pin stone-face mid");
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
      mountains: buildMountains,
      seesaws: buildSeesaws,
      stones: buildStones
    };
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
  watchNav();
  start3D();
})();
