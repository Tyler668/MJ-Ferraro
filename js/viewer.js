/* The pop-out viewer: the painting hangs from a nail on a softly lit wall
   (matching the home page), with an "in a room" to-scale view whose colours are
   derived from the painting, and a details panel.
   Usage: Viewer.open(items, index, sourceElement)                            */
(function () {
  const { $, $$, ICON, esc, thumb, full, ratio, color, sizeText, statusText, reduceMotion, hsl } = window.Site;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  // null = colours matched to the painting

  let el, items = [], index = 0, source = null, sourceIndex = -1, lastFocus = null;
  let mode = "close", geo = null, roomGeo = null, raf = 0, open = false, pal = null, layoutRetry = 0;
  const m = { rx: 0, ry: 0, trx: 0, try: 0, hover: false, kick: 0, kickT: 0 };

  function build() {
    el = document.createElement("div");
    el.className = "viewer";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-labelledby", "viewer-title");
    el.innerHTML = `
      <div class="viewer__backdrop"></div>
      <div class="viewer__room">
        <div class="viewer__stage">
          <div class="hangview">
            <div class="hang-glow" aria-hidden="true"></div>
            <div class="zoom-layer">
              <div class="shadow-wrap">
                <div class="cast-shadow" aria-hidden="true"></div>
                <div class="cast-shadow is-near" aria-hidden="true"></div>
              </div>
              <span class="nail" aria-hidden="true"></span>
              <div class="rig-wrap">
              <div class="rig">
                <svg class="wire" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 60L50 0L100 60"/></svg>
                <div class="slab">
                  <div class="slab__face slab__back"></div>
                  <div class="slab__face slab__side slab__left"></div>
                  <div class="slab__face slab__side slab__right"></div>
                  <div class="slab__face slab__cap slab__top"></div>
                  <div class="slab__face slab__cap slab__bottom"></div>
                  <div class="slab__face slab__front"><img alt=""></div>
                </div>
                <span class="rig__tape" aria-hidden="true"></span>
                </div>
              </div>
            </div>
          </div>
          <div class="roomview" aria-hidden="true">
            <div class="roomview__scene"></div>
            <div class="roomview__note"></div>
          </div>
          <div class="loupe" aria-hidden="true"></div>
          <button class="stage-nav stage-nav--prev" type="button" aria-label="Previous painting">${ICON.left}</button>
          <button class="stage-nav stage-nav--next" type="button" aria-label="Next painting">${ICON.arrow}</button>
          <div class="viewer__modes" role="group" aria-label="View">
            <button type="button" data-mode="close" aria-pressed="true" aria-label="Up close" title="Up close">${ICON.zoom}</button>
            <button type="button" data-mode="room" aria-pressed="false" aria-label="In a room" title="In a room">${ICON.sofa}</button>
          </div>
          <p class="viewer__hint">${ICON.zoom} Hover the painting to magnify</p>
        </div>
        <aside class="viewer__info"></aside>
      </div>
      <button class="viewer__close" type="button" aria-label="Close">${ICON.close}</button>`;
    document.body.appendChild(el);

    $(".viewer__close", el).addEventListener("click", close);
    $(".stage-nav--prev", el).addEventListener("click", () => step(-1));
    $(".stage-nav--next", el).addEventListener("click", () => step(1));
    // in the room view, clicking the painting on the wall comes back up close
    $(".viewer__stage", el).addEventListener("click", (e) => {
      if (mode !== "room" || e.target.closest("button")) return;
      if (overPainting(e)) setMode("close");
    });
    $$(".viewer__modes button", el).forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));

    const stage = $(".viewer__stage", el);
    stage.addEventListener("pointerenter", () => (m.hover = true));
    stage.addEventListener("pointerleave", () => { m.hover = false; loupe(null); });
    stage.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const r = stage.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      if (mode === "room") {
        stage.style.cursor = overPainting(e) ? "zoom-in" : "";
        return;
      }
      // over the painting: hold it nearly still and magnify; elsewhere: lean towards the cursor
      const onArt = loupe(e);
      m.try = nx * (onArt ? 3 : 16); m.trx = -ny * (onArt ? 1.5 : 7);
    });

    document.addEventListener("keydown", (e) => { if (open) onKey(e); });
    addEventListener("resize", () => { if (open) { layout(true); renderRoom(); setMode(mode, false); } });

    let touchX = null; // swipe between pieces on the details panel
    const info = $(".viewer__info", el);
    info.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
    info.addEventListener("touchend", (e) => {
      if (touchX == null) return;
      const dx = e.changedTouches[0].clientX - touchX; touchX = null;
      if (Math.abs(dx) > 70) step(dx < 0 ? 1 : -1);
    });
  }

  function onKey(e) {
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "Tab") { // keep focus inside the dialog
      const f = $$("button, a[href]", el).filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  }

  /* ---------- how should this piece be presented? ---------- */
  function kindOf(it) {
    if (it.object) return "print";
    const md = (it.medium || "").toLowerCase();
    if (md.includes("framed")) return "framed";
    if (md.includes("watercolor") || md.includes("paper")) return "paper";
    return "canvas";
  }

  /* ---------- up-close geometry ---------- */
  function layout(keepImage) {
    const it = items[index];
    const stage = $(".viewer__stage", el);
    const sw = stage.clientWidth, sh = stage.clientHeight;
    // The stage is display:none until .is-open, so a zero here means the browser has
    // not settled yet. Sizing from it would give a 0x0 painting, so try again next
    // frame instead; `open` stops this retrying against a closed viewer.
    if ((!sw || !sh) && open) { cancelAnimationFrame(layoutRetry); layoutRetry = requestAnimationFrame(() => layout(keepImage)); return; }
    if (!sw || !sh) return;
    const kind = kindOf(it), isPrint = kind === "print";
    const r = ratio(it.currentImg || it.img);

    // fit the wall, nudged by real-world size so an 8x10 reads smaller than a 36x48
    const longest = it.size ? Math.max(...it.size) : 22;
    const f = isPrint ? 0.95 : clamp(0.86 + longest / 250, 0.88, 1);
    const top0 = sw < 600 ? 52 : 54, bottom0 = 78;
    const wire = isPrint ? 0 : Math.round(clamp(sh * 0.055, 28, 50));
    const availH = sh - top0 - bottom0 - wire;
    // FIT leaves a little more wall around the painting, so it reads as hung rather than filling the frame
    const FIT = 0.9165;                                // 16% less area than the space it could take
    const maxW = sw * (sw < 600 ? 0.86 : 0.8) * f * FIT, maxH = availH * 0.98 * f * FIT;
    const mat = kind === "paper" ? Math.round(clamp(Math.min(maxW, maxH) * 0.075, 14, 30)) : 0;
    const frame = kind === "framed" ? Math.round(clamp(Math.min(maxW, maxH) * 0.035, 8, 18)) : 0;
    const pad = (mat + frame) * 2;
    let iw = maxW - pad, ih = iw / r;
    if (ih > maxH - pad) { ih = maxH - pad; iw = ih * r; }
    const cw = Math.round(iw + pad), ch = Math.round(ih + pad);
    const pxPerIn = it.size ? cw / it.size[0] : 0;
    const d = isPrint ? 3 : kind === "framed" ? 20 : kind === "paper" ? 8 : clamp(Math.round(pxPerIn * 1.5), 10, 20);
    const top = Math.round(top0 + wire + (availH - ch) / 2);

    geo = { sw, sh, cw, ch, d, kind, top };
    const view = $(".hangview", el);
    const set = (k, v) => view.style.setProperty(k, v);
    set("--cw", cw + "px"); set("--ch", ch + "px"); set("--d", d + "px");
    set("--wire", wire + "px"); set("--top", top + "px");
    set("--mat", mat + "px"); set("--frame", frame + "px");
    view.classList.toggle("is-print", isPrint);

    const slab = $(".slab", el);
    slab.classList.toggle("slab--framed", kind === "framed");
    slab.classList.toggle("slab--paper", kind === "paper");
    slab.classList.toggle("slab--print", isPrint);
    $(".rig", el).classList.toggle("rig--print", isPrint);

    if (!keepImage) setImage(it.currentImg || it.img);
  }

  function setImage(slug) {
    const front = $(".slab__front", el), img = $("img", front);
    front.style.setProperty("--c", color(slug));
    $$(".slab__side, .slab__cap", el).forEach((face) => (face.style.backgroundImage = `url("${thumb(slug)}")`));
    img.src = thumb(slug);
    img.alt = items[index].title || "";
    const hi = new Image();
    hi.onload = () => { if (open && (items[index].currentImg || items[index].img) === slug) img.src = hi.src; };
    hi.src = full(slug);

    const it = items[index];
    window.Site.palette(slug).then((p) => {
      if (items[index] !== it) return;
      pal = p;
      const stage = $(".viewer__stage", el);
      stage.style.setProperty("--glow", p.glow);
      stage.style.setProperty("--wall", p.wall);
      renderRoom();
    });
  }

  /* ---------- magnifier: a round loupe onto the full-resolution image ---------- */
  const ZOOM = 2.34;
  function loupe(e) {
    const lens = $(".loupe", el);
    if (!e || stepping) {
      lens.classList.remove("is-on");
      $(".viewer__stage", el).classList.remove("is-magnifying");
      return false;
    }
    const img = $(".slab__front img", el), ir = img.getBoundingClientRect();
    const inside = e.clientX >= ir.left && e.clientX <= ir.right && e.clientY >= ir.top && e.clientY <= ir.bottom;
    lens.classList.toggle("is-on", inside);
    $(".viewer__stage", el).classList.toggle("is-magnifying", inside);
    if (!inside) return false;
    const sr = $(".viewer__stage", el).getBoundingClientRect();
    const size = lens.offsetWidth;
    const x = e.clientX - ir.left, y = e.clientY - ir.top;
    const slug = items[index].currentImg || items[index].img;
    lens.style.left = e.clientX - sr.left + "px";
    lens.style.top = e.clientY - sr.top + "px";
    lens.style.backgroundImage = `url("${full(slug)}")`;
    lens.style.backgroundSize = `${ir.width * ZOOM}px ${ir.height * ZOOM}px`;
    lens.style.backgroundPosition = `${-(x * ZOOM - size / 2)}px ${-(y * ZOOM - size / 2)}px`;
    return true;
  }

  /* ---------- "in a room": a to-scale living room, coloured from the painting ---------- */
  function renderRoom() {
    const it = items[index];
    const scene = $(".roomview__scene", el);
    if (!it.size || it.object || !pal || !geo) { scene.innerHTML = ""; roomGeo = null; return; }
    const { sw, sh } = geo;
    const [W, H] = it.size;
    const { h, muted } = pal;
    const sat = (x) => (muted ? x * 0.35 : x);
    const kind = kindOf(it);

    // everything is drawn in inches; ppi maps inches to screen pixels
    const floorFrac = 0.84, topRoom = 118;
    const ppi = Math.min((sw * 0.96) / Math.max(140, W + 30), (sh * floorFrac - topRoom) / (34 + 8 + H));
    const VW = sw / ppi, VH = sh / ppi, cx = VW / 2, fy = VH * floorFrac;

    const wall = hsl(h, sat(0.2), 0.89);
    const sofa = (l, s = 0.16) => hsl(h + 180, sat(s), l);
    const accent = pal.accent, accentDeep = hsl(h, sat(0.5), 0.42);
    // a second colour drawn from the painting, for the striped pillow and the lamp
    const accentAlt = pal.accent2 || hsl(h + 180, sat(0.4), 0.5);
    const cream = hsl(h, sat(0.25), 0.93), throwC = hsl(h + 28, sat(0.3), 0.78), throwD = hsl(h + 28, sat(0.28), 0.66);
    const rug = hsl(h, sat(0.12), 0.84), rugBorder = hsl(h, sat(0.16), 0.7), rugInner = hsl(h + 180, sat(0.08), 0.76);
    const lampBase = accentAlt;
    const books = [accent, sofa(0.45, 0.25), hsl(h + 40, sat(0.35), 0.66), "#ece4d4"];
    const wood = "#8c6a4c", woodDark = "#5b4331";

    // the painting itself is the live element, positioned here by setMode
    roomGeo = { ppi, cx: cx * ppi, cy: (fy - 34 - 8 - H / 2) * ppi, w: W * ppi };

    // plant leaves: [x offset, height, angle]
    const leaves = [[-1, 44, -20], [3, 47, 25], [-5, 38, -50], [5, 39, 55], [-2, 33, -10], [4, 30, 35], [-6, 27, -60], [1, 24, 10], [6, 22, 70], [-4, 19, -35], [2, 51, 5]];
    const plantX = cx - 56, tableX = cx + 57;
    const n = (v) => v.toFixed(2);
    const pillow = (w2, h2) => `M${-w2} ${-h2} Q0 ${-h2 - 1.3} ${w2} ${-h2} Q${w2 + 1.1} 0 ${w2} ${h2} Q0 ${h2 + 1.1} ${-w2} ${h2} Q${-w2 - 1.1} 0 ${-w2} ${-h2} z`;

    scene.innerHTML = `
    <svg viewBox="0 0 ${n(VW)} ${n(VH)}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="rv-light" x1="0" y1="0" x2="1" y2="0.4"><stop offset="0" stop-color="#fff" stop-opacity=".42"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <linearGradient id="rv-shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
        <linearGradient id="rv-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a5a40"/><stop offset="1" stop-color="#a07c5a"/></linearGradient>
        <linearGradient id="rv-cushion" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></linearGradient>
        <radialGradient id="rv-lamp"><stop offset="0" stop-color="#ffe7b8" stop-opacity=".75"/><stop offset="1" stop-color="#ffe7b8" stop-opacity="0"/></radialGradient>
        <pattern id="rv-stripe" width="1.6" height="1.6" patternUnits="userSpaceOnUse"><rect width="1.6" height="1.6" fill="${cream}"/><rect width=".55" height="1.6" fill="${accentAlt}" opacity=".75"/></pattern>
        <filter id="rv-shadow" x="-20%" y="-20%" width="150%" height="150%"><feDropShadow dx=".7" dy="1.4" stdDeviation="1.1" flood-color="#2a1d12" flood-opacity=".35"/></filter>
        <filter id="rv-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.4"/></filter>
        <filter id="rv-haze" x="-30%" y="-10%" width="160%" height="120%"><feGaussianBlur stdDeviation="5"/></filter>
      </defs>

      <!-- wall, window light, trim -->
      <rect width="${n(VW)}" height="${n(fy)}" fill="${wall}"/>
      <polygon points="${n(VW * 0.02)},0 ${n(VW * 0.34)},0 ${n(VW * 0.52)},${n(fy)} ${n(VW * 0.14)},${n(fy)}" fill="url(#rv-light)" opacity="0.9" filter="url(#rv-haze)"/>
      <rect width="${n(VW)}" height="${n(fy)}" fill="url(#rv-shade)" opacity=".5"/>
      <rect y="${n(fy - 5)}" width="${n(VW)}" height="5" fill="#f5f0e6"/>
      <rect y="${n(fy - 5)}" width="${n(VW)}" height=".35" fill="#000" opacity=".08"/>

      <!-- floor -->
      <rect y="${n(fy)}" width="${n(VW)}" height="${n(VH - fy)}" fill="url(#rv-floor)"/>
      ${[0.12, 0.3, 0.55, 0.85].map((k) => `<rect y="${n(fy + (VH - fy) * k)}" width="${n(VW)}" height=".18" fill="#000" opacity=".12"/>`).join("")}
      ${[0.1, 0.27, 0.46, 0.63, 0.81, 0.95].map((k, i) => `<rect x="${n(VW * k)}" y="${n(fy + (VH - fy) * [0, 0.12, 0.3, 0.55, 0.12, 0.3][i])}" width=".18" height="${n((VH - fy) * 0.2)}" fill="#000" opacity=".08"/>`).join("")}

      <!-- rug -->
      <polygon points="${n(cx - 48)},${n(fy + 1.2)} ${n(cx + 48)},${n(fy + 1.2)} ${n(cx + 58)},${n(fy + (VH - fy) * 0.78)} ${n(cx - 58)},${n(fy + (VH - fy) * 0.78)}" fill="${rug}"/>
      <polygon points="${n(cx - 44.5)},${n(fy + 2.6)} ${n(cx + 44.5)},${n(fy + 2.6)} ${n(cx + 53)},${n(fy + (VH - fy) * 0.7)} ${n(cx - 53)},${n(fy + (VH - fy) * 0.7)}" fill="none" stroke="${rugBorder}" stroke-width=".9"/>
      <polygon points="${n(cx - 40)},${n(fy + 4)} ${n(cx + 40)},${n(fy + 4)} ${n(cx + 46.5)},${n(fy + (VH - fy) * 0.6)} ${n(cx - 46.5)},${n(fy + (VH - fy) * 0.6)}" fill="none" stroke="${rugInner}" stroke-width=".45" stroke-dasharray="1.4 1"/>
      ${Array.from({ length: 29 }, (_, i) => `<path d="M${n(cx - 58 + i * (116 / 28))} ${n(fy + (VH - fy) * 0.78)} v1.2" stroke="${rugBorder}" stroke-width=".25"/>`).join("")}

      <!-- fiddle-leaf fig -->
      <ellipse cx="${n(plantX)}" cy="${n(fy + 0.4)}" rx="8" ry="1.1" fill="#000" opacity=".16" filter="url(#rv-soft)"/>
      ${leaves.map(([dx, hy]) => `<path d="M${n(plantX)} ${n(fy - 12)} Q ${n(plantX + dx * 0.4)} ${n(fy - hy * 0.6)} ${n(plantX + dx)} ${n(fy - hy)}" stroke="#5c4a33" stroke-width=".35" fill="none"/>`).join("")}
      ${leaves.map(([dx, hy, ang], i) => `<g transform="translate(${n(plantX + dx)} ${n(fy - hy)}) rotate(${ang})">
          <ellipse cx="0" cy="-3.6" rx="${i % 3 ? 2.9 : 3.3}" ry="${i % 3 ? 4.4 : 5}" fill="${["#56733f", "#688a4b", "#4a6537", "#7a9a57"][i % 4]}"/>
          <path d="M0 0 L0 -7.6" stroke="#dfe8c9" stroke-width=".18" opacity=".6"/></g>`).join("")}
      <path d="M${n(plantX - 7)} ${n(fy - 13)} h14 l-1.8 13 h-10.4 z" fill="#efe8dc"/>
      <path d="M${n(plantX - 7)} ${n(fy - 13)} h14 l-1.8 13 h-10.4 z" fill="url(#rv-shade)"/>
      <rect x="${n(plantX - 7.6)}" y="${n(fy - 14)}" width="15.2" height="1.6" rx=".5" fill="#e3dbcd"/>
      <path d="M${n(plantX - 6.4)} ${n(fy - 8)} h12.8" stroke="${accentDeep}" stroke-width=".6" opacity=".55"/>

      <!-- side table, books and lamp -->
      <ellipse cx="${n(tableX)}" cy="${n(fy + 0.4)}" rx="12" ry="1" fill="#000" opacity=".14" filter="url(#rv-soft)"/>
      <circle cx="${n(tableX)}" cy="${n(fy - 44)}" r="20" fill="url(#rv-lamp)"/>
      <polygon points="${n(tableX - 9)},${n(fy - 23)} ${n(tableX - 7.6)},${n(fy - 23)} ${n(tableX - 9.2)},${n(fy)} ${n(tableX - 10.4)},${n(fy)}" fill="${woodDark}"/>
      <polygon points="${n(tableX + 7.6)},${n(fy - 23)} ${n(tableX + 9)},${n(fy - 23)} ${n(tableX + 10.4)},${n(fy)} ${n(tableX + 9.2)},${n(fy)}" fill="${woodDark}"/>
      <rect x="${n(tableX - 9.6)}" y="${n(fy - 8.6)}" width="19.2" height="1.1" fill="${wood}"/>
      ${books.map((b, i) => `<rect x="${n(tableX - 7 + i * 0.3)}" y="${n(fy - 9.8 - i * 1.25)}" width="${n(12 - i * 1.4)}" height="1.2" rx=".15" fill="${b}"/>`).join("")}
      <rect x="${n(tableX - 11)}" y="${n(fy - 24.6)}" width="22" height="1.8" rx=".4" fill="${wood}"/>
      <rect x="${n(tableX - 11)}" y="${n(fy - 23.2)}" width="22" height=".4" fill="#000" opacity=".2"/>
      <path d="M${n(tableX - 3)} ${n(fy - 24.6)} c-3.4 -1 -4 -6.5 -1.2 -9 h8.4 c2.8 2.5 2.2 8 -1.2 9 z" fill="${lampBase}"/>
      <path d="M${n(tableX - 3)} ${n(fy - 24.6)} c-3.4 -1 -4 -6.5 -1.2 -9 h8.4 c2.8 2.5 2.2 8 -1.2 9 z" fill="url(#rv-cushion)"/>
      <rect x="${n(tableX - 0.25)}" y="${n(fy - 39)}" width=".5" height="5.6" fill="#b58a45"/>
      <polygon points="${n(tableX - 6)},${n(fy - 48)} ${n(tableX + 6)},${n(fy - 48)} ${n(tableX + 8.4)},${n(fy - 38.6)} ${n(tableX - 8.4)},${n(fy - 38.6)}" fill="#f7efdf"/>
      <polygon points="${n(tableX - 6)},${n(fy - 48)} ${n(tableX + 6)},${n(fy - 48)} ${n(tableX + 8.4)},${n(fy - 38.6)} ${n(tableX - 8.4)},${n(fy - 38.6)}" fill="url(#rv-shade)" opacity=".6"/>
      <rect x="${n(tableX - 9.5)}" y="${n(fy - 26.2)}" width="3.6" height="1.6" rx=".3" fill="${accent}" opacity=".85"/>

      <!-- sofa -->
      <ellipse cx="${n(cx)}" cy="${n(fy + 0.6)}" rx="44" ry="1.4" fill="#000" opacity=".22" filter="url(#rv-soft)"/>
      ${[-39, -14, 14, 39].map((x) => `<polygon points="${n(cx + x - 0.9)},${n(fy - 5)} ${n(cx + x + 0.9)},${n(fy - 5)} ${n(cx + x + 0.45)},${n(fy)} ${n(cx + x - 0.45)},${n(fy)}" fill="${woodDark}"/>`).join("")}
      <rect x="${n(cx - 39)}" y="${n(fy - 34)}" width="78" height="22" rx="4" fill="${sofa(0.5)}"/>
      ${[cx - 35.6, cx + 0.4].map((bx) => `<rect x="${n(bx)}" y="${n(fy - 31.4)}" width="35.2" height="15" rx="3.2" fill="${sofa(0.6)}"/>
         <rect x="${n(bx)}" y="${n(fy - 31.4)}" width="35.2" height="15" rx="3.2" fill="url(#rv-cushion)"/>
         ${[0.25, 0.5, 0.75].map((k) => [0.35, 0.7].map((j) => `<circle cx="${n(bx + 35.2 * k)}" cy="${n(fy - 31.4 + 15 * j)}" r=".42" fill="${sofa(0.38)}"/>`).join("")).join("")}`).join("")}
      <rect x="${n(cx - 39)}" y="${n(fy - 14)}" width="78" height="9" rx="1.6" fill="${sofa(0.46)}"/>
      ${[cx - 34.6, cx + 0.3].map((bx) => `<rect x="${n(bx)}" y="${n(fy - 18.6)}" width="34.3" height="7" rx="2" fill="${sofa(0.62)}"/>
         <rect x="${n(bx)}" y="${n(fy - 18.6)}" width="34.3" height="7" rx="2" fill="url(#rv-cushion)"/>
         <rect x="${n(bx)}" y="${n(fy - 12)}" width="34.3" height=".35" fill="#000" opacity=".12"/>`).join("")}
      ${[cx - 43, cx + 33].map((ax) => `<rect x="${n(ax)}" y="${n(fy - 25)}" width="10" height="20" rx="4" fill="${sofa(0.52)}"/>
          <rect x="${n(ax)}" y="${n(fy - 25)}" width="10" height="20" rx="4" fill="url(#rv-cushion)"/>
          <ellipse cx="${n(ax + 5)}" cy="${n(fy - 22.4)}" rx="4.6" ry="2.2" fill="#fff" opacity=".07"/>
          <path d="M${n(ax + 1.4)} ${n(fy - 19)} v12.5" stroke="${sofa(0.4)}" stroke-width=".3" opacity=".6"/>`).join("")}
      <rect x="${n(cx - 43)}" y="${n(fy - 6.4)}" width="86" height="1.6" rx=".6" fill="${sofa(0.36)}"/>

      <!-- throw pillows -->
      <g transform="translate(${n(cx - 28)} ${n(fy - 25)}) rotate(-9)">
        <path d="${pillow(7.6, 6.2)}" fill="${accent}"/><path d="${pillow(7.6, 6.2)}" fill="url(#rv-cushion)"/>
        <circle r=".6" fill="${accentDeep}"/>
      </g>
      <g transform="translate(${n(cx - 13)} ${n(fy - 22.5)}) rotate(4)">
        <rect x="-6.5" y="-3.8" width="13" height="7.6" rx="2.4" fill="${cream}"/>
        <rect x="-6.5" y="-3.8" width="13" height="7.6" rx="2.4" fill="url(#rv-cushion)"/>
        <path d="M-5 0 h10" stroke="${throwD}" stroke-width=".5" stroke-dasharray=".8 .6"/>
      </g>
      <g transform="translate(${n(cx + 22)} ${n(fy - 24.6)}) rotate(8)">
        <path d="${pillow(7.2, 6)}" fill="url(#rv-stripe)"/><path d="${pillow(7.2, 6)}" fill="url(#rv-cushion)"/>
      </g>

      <!-- knit throw over the right arm -->
      <path d="M${n(cx + 30)} ${n(fy - 25.5)} q6 -1.6 13.2 .4 q.9 7 -.4 14.8 l-1.2 1.2 l-1.2 -1.1 l-1.2 1.3 l-1.2 -1.2 l-1.2 1.2 l-1.2 -1.1 q-1.4 -6 -3.2 -8.8 q-1.8 -3 -2.4 -6.7 z" fill="${throwC}"/>
      <path d="M${n(cx + 34)} ${n(fy - 25.8)} q2 6 1.6 13.6 M${n(cx + 38.4)} ${n(fy - 25.6)} q1.2 7 .6 14.4" stroke="${throwD}" stroke-width=".35" fill="none"/>
      ${Array.from({ length: 9 }, (_, i) => `<path d="M${n(cx + 35.2 + i * 0.9)} ${n(fy - 10.2)} v1.4" stroke="${throwD}" stroke-width=".2"/>`).join("")}
    </svg>`;

    const note = $(".roomview__note", el);
    note.textContent = `Shown to scale · ${sizeText(it)} above an 84″ sofa`;
  }

  function overPainting(e) {
    const r = $(".slab", el).getBoundingClientRect();
    return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  }

  /* Where the painting and the room sit in each mode. The painting is one element
     throughout, so the zoom is a single continuous move with nothing to cross-fade. */
  function zoomStates() {
    if (!geo || !roomGeo) return null;
    const closeX = geo.sw / 2, closeY = geo.top + geo.ch / 2;
    const s = roomGeo.w / geo.cw;                     // painting: close size -> size on the wall
    const dx = roomGeo.cx - closeX, dy = roomGeo.cy - closeY;
    return {
      origin: `${closeX}px ${closeY}px`,
      roomOrigin: `${roomGeo.cx}px ${roomGeo.cy}px`,
      onWall: `translate(${dx}px, ${dy}px) scale(${s})`,
      roomZoomed: `translate(${-dx / s}px, ${-dy / s}px) scale(${1 / s})`,
    };
  }

  function setMode(md, animate = true) {
    const same = md === mode;
    mode = md;
    $$(".viewer__modes button", el).forEach((b) => b.setAttribute("aria-pressed", b.dataset.mode === md));
    const roomEl = $(".roomview", el), hangEl = $(".hangview", el), zoom = $(".zoom-layer", el);
    const stage = $(".viewer__stage", el);
    $(".viewer__hint", el).style.display = md === "room" ? "none" : "";
    hangEl.classList.toggle("is-room", md === "room");   // fades the wire, nail and glow
    stage.style.cursor = "";
    loupe(null);

    roomEl.getAnimations().forEach((a) => a.cancel());
    zoom.getAnimations().forEach((a) => a.cancel());

    const z = zoomStates();
    if (!z) { roomEl.classList.toggle("is-on", md === "room"); return; }
    zoom.style.transformOrigin = z.origin;
    roomEl.style.transformOrigin = z.roomOrigin;

    const settle = () => {
      zoom.style.transform = md === "room" ? z.onWall : "none";
      roomEl.style.transform = md === "room" ? "none" : z.roomZoomed;
      roomEl.classList.toggle("is-on", md === "room");
    };
    if (same || !animate || reduceMotion) { settle(); return; }

    const ease = "cubic-bezier(.4,0,.2,1)", dur = 900;
    roomEl.classList.add("is-on");                       // stays rendered for the whole zoom
    const from = md === "room" ? "none" : z.onWall;
    const to = md === "room" ? z.onWall : "none";
    const roomFrom = md === "room" ? z.roomZoomed : "none";
    const roomTo = md === "room" ? "none" : z.roomZoomed;
    zoom.animate([{ transform: from }, { transform: to }], { duration: dur, easing: ease });
    roomEl.animate(
      md === "room"
        ? [{ transform: roomFrom, opacity: 0 }, { opacity: 1, offset: 0.4 }, { transform: roomTo, opacity: 1 }]
        : [{ transform: roomFrom, opacity: 1 }, { opacity: 1, offset: 0.5 }, { transform: roomTo, opacity: 0 }],
      { duration: dur, easing: ease },
    ).onfinish = settle;
    settleTransform(zoom, to);
  }

  // hold the end state without a fill, so later measurements stay honest
  function settleTransform(elm, value) {
    setTimeout(() => { if (open) elm.style.transform = value; }, 880);
  }

  /* ---------- details panel ---------- */
  function renderInfo() {
    const it = items[index];
    const info = $(".viewer__info", el);
    const size = sizeText(it);
    const specs = [
      size && ["Size", size],
      it.medium && ["Medium", esc(it.medium)],
      it.status === "available" && it.price && ["Price", `$${it.price.toLocaleString("en-US")}`],
      it.status && ["Status", `<span class="status status--${it.status}">${statusText(it)}</span>`],
    ].filter(Boolean);

    let cta = it.cta;
    if (!cta && it.status === "available") cta = { href: `contact.html?piece=${it.id}`, label: "Inquire about this piece", note: it.price ? null : "Price on request." };
    if (!cta && it.status === "sold") cta = { href: `contact.html?topic=commission&like=${it.id}`, label: "Ask about something similar", note: "This painting has sold. Commissions for similar work are available on request." };

    const alts = it.alts && it.alts.length ? [it.img, ...it.alts] : null;
    info.innerHTML = `
      <span class="eyebrow">${esc(it.kind || "Original painting")}</span>
      <h2 id="viewer-title">${esc(it.title)}</h2>
      ${it.subtitle ? `<div class="viewer__subtitle">${esc(it.subtitle)}</div>` : ""}
      ${it.place ? `<div class="viewer__place">${ICON.pin}${esc(it.place)}</div>` : ""}
      ${specs.length ? `<dl class="specs">${specs.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>` : ""}
      ${alts ? `<div class="viewer__alts">${alts.map((s, i) => `<button type="button" aria-label="Photo ${i + 1}" aria-pressed="${(it.currentImg || it.img) === s}" data-slug="${s}"><img src="${thumb(s)}" alt=""></button>`).join("")}</div>` : ""}
      ${it.blurb || it.caption ? `<p class="viewer__blurb">${esc(it.blurb || it.caption)}</p>` : ""}
      <div class="viewer__actions">
        ${cta ? `<a class="btn" href="${cta.href}">${esc(cta.label)} ${ICON.arrow}</a>${cta.note ? `<p class="viewer__note">${esc(cta.note)}</p>` : ""}` : ""}
        ${items.length > 1 ? `<div class="viewer__nav">
          <button class="round-btn" type="button" data-step="-1" aria-label="Previous">${ICON.left}</button>
          <span>${String(index + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}</span>
          <button class="round-btn" type="button" data-step="1" aria-label="Next">${ICON.arrow}</button></div>` : ""}
      </div>`;
    $$("[data-step]", info).forEach((b) => b.addEventListener("click", () => step(+b.dataset.step)));
    $$(".viewer__alts button", info).forEach((b) => b.addEventListener("click", () => {
      it.currentImg = b.dataset.slug;
      $$(".viewer__alts button", info).forEach((x) => x.setAttribute("aria-pressed", x === b));
      layout(); kick(1.4);
    }));

    $$(".stage-nav", el).forEach((b) => (b.style.display = items.length > 1 ? "" : "none"));
    const canRoom = !!(it.size && !it.object);
    $(".viewer__modes", el).style.display = canRoom ? "" : "none";
    if (!canRoom && mode === "room") setMode("close", false);
  }

  /* ---------- sway, tilt and shadow ---------- */
  const kick = (amt) => { if (!reduceMotion) { m.kick = amt; m.kickT = performance.now(); } };
  function tick(t) {
    if (!open) return;
    if (mode === "room") { m.try = 0; m.trx = 0; }
    else if (!m.hover) { m.try = Math.sin(t / 2800) * 5; m.trx = Math.sin(t / 3600) * 1.5; }
    m.ry = lerp(m.ry, m.try, 0.06);
    m.rx = lerp(m.rx, m.trx, 0.06);
    const since = Math.max(0, t - m.kickT);
    const isPrint = geo && geo.kind === "print";
    const sway = reduceMotion || mode === "room" ? 0 : window.Site.swing(t) * (isPrint ? 0.6 : 1);
    const a = sway + m.kick * Math.exp(-since / 1100) * Math.sin(since / 280);
    $(".rig", el).style.transform = `rotateZ(${a.toFixed(3)}deg) rotateX(${m.rx.toFixed(2)}deg) rotateY(${m.ry.toFixed(2)}deg)`;
    const [far, near] = $$(".cast-shadow", el);
    const depth = geo ? geo.d / 14 : 1;
    window.Site.castShadow(far, a, m.rx, m.ry, 1.3 * depth);
    window.Site.castShadow(near, a, m.rx, m.ry, 0.22 * depth);
    raf = requestAnimationFrame(tick);
  }

  /* ---------- open / close / step ---------- */
  function flight(fromRect, toRect, src, dur, easing) {
    return new Promise((resolve) => {
      const fl = document.createElement("img");
      fl.className = "flyer"; fl.src = src;
      Object.assign(fl.style, { left: toRect.left + "px", top: toRect.top + "px", width: toRect.width + "px", height: toRect.height + "px" });
      document.body.appendChild(fl);
      const sx = fromRect.width / toRect.width, sy = fromRect.height / toRect.height;
      fl.animate([
        { transform: `translate(${fromRect.left - toRect.left}px, ${fromRect.top - toRect.top}px) scale(${sx}, ${sy})` },
        { transform: "none" },
      ], { duration: dur, easing, fill: "forwards" }).onfinish = () => resolve(fl);
    });
  }
  const visible = (r) => r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  const sourceImg = (s) => (s && (s.tagName === "IMG" ? s : s.querySelector("img"))) || s;

  function openViewer(list, i, src) {
    if (!el) build();
    items = list.map((x) => ({ ...x })); index = i; source = src || null; sourceIndex = i;
    lastFocus = document.activeElement;
    open = true; setMode("close", false);
    Object.assign(m, { rx: 0, ry: 0, trx: 0, try: 0, kick: 0 });
    $(".viewer__hint", el).style.opacity = "";
    document.documentElement.style.overflow = "hidden";
    el.classList.add("is-open");
    renderInfo();
    layout();
    $(".rig", el).style.transform = "none";
    cancelAnimationFrame(raf);

    const slab = $(".slab", el);
    const s = sourceImg(source);
    const fromRect = s && s.getBoundingClientRect();
    if (!reduceMotion && fromRect && visible(fromRect)) {
      slab.classList.add("is-waiting");
      if (source) source.style.visibility = "hidden";
      const toRect = $(".slab__front img", el).getBoundingClientRect();
      requestAnimationFrame(() => el.classList.add("is-shown"));
      flight(fromRect, toRect, s.currentSrc || s.src || thumb(items[i].img), 900, "cubic-bezier(.2,.9,.25,1)").then((fl) => {
        slab.classList.remove("is-waiting");
        fl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220 }).onfinish = () => fl.remove();
        kick(2.2);
        raf = requestAnimationFrame(tick);
      });
    } else {
      requestAnimationFrame(() => el.classList.add("is-shown"));
      raf = requestAnimationFrame(tick);
    }
    setTimeout(() => $(".viewer__close", el).focus({ preventScroll: true }), 60);
  }

  function close() {
    if (!open) return;
    open = false;
    cancelAnimationFrame(raf);
    const slab = $(".slab", el);
    const s = sourceImg(source);
    const back = !reduceMotion && s && index === sourceIndex && mode === "close" && visible(s.getBoundingClientRect());
    const finish = () => {
      el.classList.remove("is-open");
      slab.classList.remove("is-waiting");
      document.documentElement.style.overflow = "";
      if (source) source.style.visibility = "";
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    };
    el.classList.remove("is-shown");
    if (back) {
      $(".rig", el).style.transform = "none";
      const img = $(".slab__front img", el);
      const fromRect = img.getBoundingClientRect();
      slab.classList.add("is-waiting");
      flight(fromRect, s.getBoundingClientRect(), img.src, 650, "cubic-bezier(.5,0,.2,1)").then((fl) => { finish(); fl.remove(); });
    } else {
      setTimeout(finish, 550);
    }
  }

  let stepping = false;
  function step(dir) {
    if (!open || stepping || items.length < 2) return;
    stepping = true;
    const wrap = $(".rig-wrap", el), shadows = $(".shadow-wrap", el), info = $(".viewer__info", el), scene = $(".roomview__scene", el);
    // The nail travels with the painting, so the taut wire never flies in without its
    // pin. In the room view there is no pin on show, and an animation's keyframes beat
    // the stylesheet that hides it, so leave the nail alone there.
    const nail = mode === "room" ? null : $(".nail", el);
    const outT = reduceMotion ? 1 : 320;
    loupe(null);
    // lift the painting off the nail...
    const outKf = [{ transform: "none", opacity: 1 }, { transform: `translate(${-dir * 40}px, -26px)`, opacity: 0 }];
    const outOpt = { duration: outT, easing: "cubic-bezier(.5,0,.75,0)", fill: "forwards" };
    wrap.animate(outKf, outOpt);
    if (nail) nail.animate(outKf, outOpt);
    scene.animate([{ opacity: 1 }, { opacity: 0 }], { duration: outT, fill: "forwards" });
    shadows.animate([{ opacity: 1 }, { opacity: 0 }], { duration: outT, fill: "forwards" });
    info.classList.add("is-swapping");
    setTimeout(() => {
      index = (index + dir + items.length) % items.length;
      renderInfo(); layout(); renderRoom(); setMode(mode, false);
      wrap.getAnimations().forEach((a) => a.cancel());
      if (nail) nail.getAnimations().forEach((a) => a.cancel());
      scene.getAnimations().forEach((a) => a.cancel());
      shadows.getAnimations().forEach((a) => a.cancel());
      shadows.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700, easing: "ease-in" });
      // ...and hang the next one, which swings a little as it settles
      const inKf = [{ transform: `translate(${dir * 40}px, -30px)`, opacity: 0 }, { transform: "none", opacity: 1 }];
      const inOpt = { duration: reduceMotion ? 1 : 560, easing: "cubic-bezier(.16,1,.3,1)" };
      wrap.animate(inKf, inOpt);
      if (nail) nail.animate(inKf, inOpt);
      scene.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500 });
      kick(dir * 2.6);
      requestAnimationFrame(() => info.classList.remove("is-swapping"));
      info.scrollTop = 0;
      stepping = false;
    }, outT);
  }

  window.Viewer = { open: openViewer, close };
})();
