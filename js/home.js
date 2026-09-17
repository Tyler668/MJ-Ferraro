/* Home page: hero slideshow, coverflow, subjects, teasers */
(function () {
  const { $, $$, esc, thumb, full, ratio, sizeText, reduceMotion } = window.Site;
  const WORKS = window.WORKS;
  const byId = (id) => WORKS.find((w) => w.id === id);
  const available = WORKS.filter((w) => w.status === "available")
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  $("#stat-available").textContent = available.length;
  $("#stat-total").textContent = WORKS.length;

  /* ---------------- Hero: hanging canvas slideshow ---------------- */
  const heroWorks = ["a-storm-is-brewing", "boardwalk-to-paradise", "birdhouses-of-dauphin-island", "kaleidoscope-beach", "walking-on-top-of-the-world", "blue-heron-family"].map(byId);
  const canvas = $("#hero-canvas"), dots = $("#hero-dots"), cap = $("#hero-caption");
  const DUR = 6500;
  let heroIdx = 0, heroTimer = 0;

  dots.innerHTML = heroWorks.map((w, i) => `<button type="button" role="tab" aria-label="${esc(w.title)}" style="--dur:${DUR}ms"></button>`).join("");
  heroWorks.forEach((w) => { const i = new Image(); i.src = full(w.img); });

  function showHero(i, first) {
    heroIdx = (i + heroWorks.length) % heroWorks.length;
    const w = heroWorks[heroIdx];
    const img = new Image();
    img.src = full(w.img); img.alt = w.title;
    img.className = first ? "is-current" : "is-entering";
    canvas.appendChild(img);
    const old = $$("img", canvas).slice(0, -1);
    setTimeout(() => old.forEach((o) => o.remove()), first ? 0 : 1600);

    window.Site.palette(w.img).then((p) => { if (heroWorks[heroIdx] === w) $("#hero-hang").style.setProperty("--glow", p.glow); });
    if (!first && !reduceMotion) { m.kick = 1.6; m.kickT = performance.now() + 500; }

    cap.classList.add("is-out");
    setTimeout(() => {
      $(".hero__caption-title", cap).textContent = w.title;
      $(".hero__caption-meta", cap).textContent = [sizeText(w), w.medium].filter(Boolean).join(" · ");
      cap.classList.remove("is-out");
    }, first ? 0 : 450);

    $$("button", dots).forEach((b, j) => {
      b.classList.remove("is-active"); void b.offsetWidth;
      b.classList.toggle("is-active", j === heroIdx);
      b.setAttribute("aria-selected", j === heroIdx);
    });
    clearTimeout(heroTimer);
    if (!reduceMotion) heroTimer = setTimeout(() => showHero(heroIdx + 1), DUR);
  }
  $$("button", dots).forEach((b, j) => b.addEventListener("click", () => showHero(j)));
  showHero(0, true);

  const openHero = () => { clearTimeout(heroTimer); window.Viewer.open(heroWorks, heroIdx, $$("img", canvas).pop()); };
  canvas.addEventListener("click", openHero);
  canvas.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openHero(); } });

  // sway, cursor tilt and a cast shadow that follows both
  const art = $(".hero__art"), hangEl = $("#hanging"), heroHang = $("#hero-hang");
  const [farShadow, nearShadow] = $$(".cast-shadow", heroHang);
  const m = { rx: 0, ry: 0, trx: 0, try: 0, kick: 0, kickT: 0 };
  art.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const r = art.getBoundingClientRect();
    m.try = ((e.clientX - r.left) / r.width - 0.5) * 14;
    m.trx = -((e.clientY - r.top) / r.height - 0.5) * 8;
  });
  art.addEventListener("pointerleave", () => { m.trx = 0; m.try = 0; });

  let heroVisible = true, heroRaf = 0;
  function heroTick(t) {
    m.rx += (m.trx - m.rx) * 0.06;
    m.ry += (m.try - m.ry) * 0.06;
    const since = Math.max(0, t - m.kickT);
    const a = (reduceMotion ? 0 : window.Site.swing(t)) + m.kick * Math.exp(-since / 1000) * Math.sin(since / 260);
    hangEl.style.transform = `rotateZ(${a.toFixed(3)}deg) rotateX(${m.rx.toFixed(2)}deg) rotateY(${m.ry.toFixed(2)}deg)`;
    window.Site.castShadow(farShadow, a, m.rx, m.ry, 1.5);
    window.Site.castShadow(nearShadow, a, m.rx, m.ry, 0.25);
    heroRaf = heroVisible ? requestAnimationFrame(heroTick) : 0;
  }
  new IntersectionObserver(([e]) => {
    heroVisible = e.isIntersecting;
    if (heroVisible && !heroRaf) heroRaf = requestAnimationFrame(heroTick);
  }).observe(art);

  /* ---------------- Marquee ---------------- */
  const words = [...window.CATEGORIES.map((c) => [c.name, `gallery.html#subject=${c.id}`]), ["Pet Portraits", "commissions.html"], ["Pasta & Paint", "pasta-and-paint.html"], ["Painted Keepsakes", "commissions.html#keepsakes"]];
  const run = words.map(([t, h]) => `<span class="marquee__item"><a href="${h}" tabindex="-1">${esc(t)}</a><i class="marquee__dot"></i></span>`).join("");
  $("#marquee").innerHTML = run + run;

  /* ---------------- Coverflow ---------------- */
  const flow = $("#flow"), stage = $(".flow__stage", flow);
  const n = available.length;
  let pos = 0, target = 0, boxH = 300, anim = 0, lastIdx = -1;

  stage.innerHTML = available.map((w, i) => `
    <button class="flow__item" type="button" data-i="${i}" aria-label="${esc(w.title)}">
      <span class="flow__canvas"><img src="${thumb(w.img)}" alt="${esc(w.title)}" loading="${i < 6 || i > n - 4 ? "eager" : "lazy"}" draggable="false"></span>
    </button>`).join("");
  const cards = $$(".flow__item", stage);

  function sizeCards() {
    boxH = Math.min(flow.clientHeight * 0.62, 360, innerWidth * 0.5);
    flow.style.setProperty("--bh", boxH + "px");
    flow.style.setProperty("--bw", boxH * 1.6 + "px");
    cards.forEach((c, i) => {
      const r = ratio(available[i].img);
      let h = boxH, w = h * r;
      if (w > boxH * 1.6) { w = boxH * 1.6; h = w / r; }
      const cv = $(".flow__canvas", c);
      cv.style.width = w + "px"; cv.style.height = h + "px";
    });
    render();
  }

  function render() {
    cards.forEach((c, i) => {
      let o = i - pos;
      o = ((o % n) + n) % n; if (o > n / 2) o -= n;
      const a = Math.abs(o), s = Math.sign(o), t = Math.min(a, 1), extra = Math.max(0, a - 1);
      const x = s * (t * boxH * 0.95 + extra * boxH * 0.42);
      const z = 80 - t * 230 - extra * 90;
      const ry = -s * t * 52;
      c.style.transform = `translate3d(${x}px,0,${z}px) rotateY(${ry}deg)`;
      c.style.opacity = a > 4.2 ? 0 : a > 3.2 ? 4.2 - a : 1;
      c.style.zIndex = 100 - Math.round(a * 10);
      c.style.pointerEvents = a > 3.5 ? "none" : "auto";
      const cv = c.firstElementChild;
      cv.style.setProperty("--dim", Math.min(0.7, t * 0.38 + extra * 0.08).toFixed(2));
      c.classList.toggle("is-near", a < 1.6);
      cv.style.setProperty("--sheen", (1 - t).toFixed(2));
      c.tabIndex = a < 0.5 ? 0 : -1;
    });
    const idx = ((Math.round(pos) % n) + n) % n;
    if (idx !== lastIdx) { lastIdx = idx; caption(idx); }
  }

  const capEl = $("#flow-caption");
  let capTimer = 0;
  function caption(i) {
    const w = available[i];
    capEl.classList.add("is-out");
    clearTimeout(capTimer);
    capTimer = setTimeout(() => {
      $("h3", capEl).textContent = w.title;
      $("p", capEl).textContent = [sizeText(w), w.medium].filter(Boolean).join("  ·  ");
      capEl.classList.remove("is-out");
    }, 220);
    $("#flow-progress").style.transform = `scaleX(${(i + 1) / n})`;
  }

  function loop() {
    pos += (target - pos) * 0.1;
    if (Math.abs(target - pos) < 0.0005) pos = target;
    render();
    anim = pos !== target || dragging ? requestAnimationFrame(loop) : 0;
  }
  const kick = () => { if (!anim) anim = requestAnimationFrame(loop); };
  const go = (d) => { target = Math.round(target) + d; kick(); };

  $("#flow-prev").addEventListener("click", () => { go(-1); pauseAuto(); });
  $("#flow-next").addEventListener("click", () => { go(1); pauseAuto(); });
  flow.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { go(1); pauseAuto(); }
    if (e.key === "ArrowLeft") { go(-1); pauseAuto(); }
  });

  let dragging = false, startX = 0, startPos = 0, moved = 0, lastX = 0, vel = 0, lastT = 0;
  flow.addEventListener("pointerdown", (e) => {
    dragging = true; moved = 0; startX = lastX = e.clientX; startPos = pos; vel = 0; lastT = performance.now();
    flow.classList.add("is-dragging"); kick();
  });
  addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX; moved = Math.max(moved, Math.abs(dx));
    if (moved > 6 && !flow.hasPointerCapture(e.pointerId)) { try { flow.setPointerCapture(e.pointerId); } catch (_) {} }
    const now = performance.now();
    vel = (e.clientX - lastX) / Math.max(1, now - lastT); lastX = e.clientX; lastT = now;
    pos = target = startPos - dx / (boxH * 0.7);
    render();
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false; flow.classList.remove("is-dragging");
    target = Math.round(pos - vel * 2.2);
    pauseAuto(); kick();
  };
  addEventListener("pointerup", endDrag);
  addEventListener("pointercancel", endDrag);

  cards.forEach((c, i) => c.addEventListener("click", (e) => {
    if (moved > 6) { e.preventDefault(); return; }
    let o = i - Math.round(target); o = ((o % n) + n) % n; if (o > n / 2) o -= n;
    if (o === 0) { pauseAuto(); window.Viewer.open(available, i, $("img", c)); }
    else { target = Math.round(target) + o; kick(); pauseAuto(); }
  }));

  // autoplay while visible and untouched
  let autoTimer = 0, inView = false, pausedUntil = 0;
  const pauseAuto = () => (pausedUntil = performance.now() + 9000);
  new IntersectionObserver(([e]) => (inView = e.isIntersecting), { threshold: 0.4 }).observe(flow);
  flow.addEventListener("pointerenter", () => (pausedUntil = Infinity));
  flow.addEventListener("pointerleave", () => (pausedUntil = performance.now() + 2000));
  if (!reduceMotion) autoTimer = setInterval(() => {
    const viewerOpen = document.querySelector(".viewer.is-open");
    if (inView && !dragging && !viewerOpen && !document.hidden && performance.now() > pausedUntil) go(1);
  }, 4200);

  addEventListener("resize", sizeCards);
  sizeCards();

  /* ---------------- Rooms ---------------- */
  $("#subjects").innerHTML = window.CATEGORIES.map((c, i) => {
    const inCat = WORKS.filter((w) => w.category === c.id);
    const avail = inCat.filter((w) => w.status === "available").length;
    return `<a class="subject-card reveal" style="--d:${i * 0.08}s" href="gallery.html#subject=${c.id}">
      <div class="subject-card__fan">${c.cover.map((s) => `<span><img src="${thumb(s)}" alt="" loading="lazy"></span>`).join("")}</div>
      <h3>${esc(c.name)}</h3>
      <p>${esc(c.blurb)}</p>
      <div class="subject-card__foot"><span>${inCat.length} works · ${avail} available</span>
        <span class="subject-card__arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15M13 6l6 6-6 6"/></svg></span></div>
    </a>`;
  }).join("");

  /* ---------------- Pasta polaroids ---------------- */
  const pasta = window.Site.pastaItems();
  const picks = ["pp-waves", "pp-sunset", "pp-chef", "pp-pomodoro"].map((id) => pasta.findIndex((p) => p.id === id));
  $("#pp-polaroids").innerHTML = picks.map((i) => `
    <button class="polaroid polaroid--plain" type="button" data-i="${i}"><img src="${thumb(pasta[i].img)}" alt="${esc(pasta[i].caption)}" loading="lazy"></button>`).join("");
  $$("#pp-polaroids .polaroid").forEach((b) => b.addEventListener("click", () => window.Viewer.open(pasta, +b.dataset.i, $("img", b))));

  /* ---------------- Pet rail ---------------- */
  const pets = window.Site.petItems();
  const railPicks = ["pet-hydrangea", "pet-dapper", "pet-doodle", "pet-cat", "pet-spaniel"];
  const widths = [170, 200, 160, 210, 175];
  $("#pet-rail").innerHTML = railPicks.map((id, k) => {
    const i = pets.findIndex((p) => p.id === id), p = pets[i];
    return `<button class="hang" type="button" data-i="${i}" style="--w:${widths[k]}px;--ar:${ratio(p.img).toFixed(3)};--delay:${-k * 1.3}s">
      <span class="hang__art"><img src="${thumb(p.img)}" alt="${esc(p.title)}" loading="lazy"></span>
      <span class="hang__label">${esc(p.title)}</span></button>`;
  }).join("");
  $$("#pet-rail .hang").forEach((b) => b.addEventListener("click", () => window.Viewer.open(pets, +b.dataset.i, $("img", b))));

  window.Site.observe();
})();
