/* Shared behaviour: header/footer, nav, scroll reveals, helpers. */
(function () {
  const S = window.SITE;
  const META = window.IMAGE_META || {};

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ICON = {
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15M13 6l6 6-6 6"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12H5M11 6l-6 6 6 6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 3.5h3.5l1.6 4.4-2.2 1.5a11 11 0 0 0 6.7 6.7l1.5-2.2 4.4 1.6V19a2 2 0 0 1-2 2A17 17 0 0 1 3 5.5a2 2 0 0 1 2-2z"/></svg>',
    insta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".9" fill="currentColor"/></svg>',
    fb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14 8.5V7a1.5 1.5 0 0 1 1.5-1.5H17V2.5h-2.5A4.5 4.5 0 0 0 10 7v1.5H7.5v3H10V21.5h4v-10h2.5l.5-3z"/></svg>',
    zoom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.4 15.4 21 21"/></svg>',
    frame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5 6 8.5M12 2.5l6 6"/><rect x="3.5" y="8.5" width="17" height="12.5" rx="1"/></svg>',
    sofa: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="4.5" y="5" width="15" height="7" rx="2"/><rect x="1.5" y="9.5" width="4" height="8" rx="2"/><rect x="18.5" y="9.5" width="4" height="8" rx="2"/><rect x="5.5" y="11" width="13" height="6.5" rx="1.6"/><rect x="4.6" y="17" width="1.6" height="2.6" rx=".6"/><rect x="17.8" y="17" width="1.6" height="2.6" rx=".6"/></svg>',
    drag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 12h18M6 9l-3 3 3 3M18 9l3 3-3 3"/></svg>',
  };

  const Site = {
    $, $$, ICON, reduceMotion,
    thumb: (slug) => `images/thumb/${slug}.jpg`,
    full: (slug) => `images/full/${slug}.jpg`,
    meta: (slug) => META[slug] || [800, 600, "#8a8278"],
    ratio(slug) { const m = Site.meta(slug); return m[0] / m[1]; },
    color: (slug) => Site.meta(slug)[2],
    category: (id) => (window.CATEGORIES || []).find((c) => c.id === id),
    sizeText(w) {
      if (w.sizeLabel) return w.sizeLabel;
      if (!w.size) return null;
      return `${w.size[0]} × ${w.size[1]}″`;
    },
    statusText(w) {
      return { available: "Available", sold: "Sold", nfs: "Not for sale" }[w.status] || "";
    },
    esc: (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])),
  };
  window.Site = Site;

  /* Viewer-ready collections */
  Site.petItems = () => (window.PETS || []).map((p) => ({
    ...p, medium: "Acrylic on canvas",
    blurb: p.blurb || "A custom portrait painted from the owner's photos.",
    cta: { href: "contact.html?topic=pet", label: "Commission a pet portrait" },
  }));
  Site.keepsakeItems = () => (window.KEEPSAKES || []).map((k) => ({
    ...k, cta: k.status === "nfs" ? null : { href: "contact.html?topic=custom", label: "Ask about a custom piece" },
    note: undefined,
  }));
  Site.pastaItems = () => (window.PASTA || []).map((p) => ({
    ...p, object: true, kind: "Pasta & Paint",
    cta: { href: "contact.html?topic=pasta", label: "Plan your own party" },
  }));

  /* ---------- Header & footer ---------- */
  const page = document.body.dataset.page;
  const links = [
    ["index.html", "Home", "home"],
    ["gallery.html", "Gallery", "gallery"],
    ["commissions.html", "Commissions", "commissions"],
    ["pasta-and-paint.html", "Pasta & Paint", "pasta"],
    ["about.html", "About M.J.", "about"],
    ["contact.html", "Contact", "contact"],
  ];
  const mark = `<svg class="brand__mark" viewBox="0 0 48 48" aria-hidden="true">
      <path d="M24 4c11 0 20 8 20 18 0 7-5 10-10 10h-4c-2.5 0-4 1.8-4 4 0 1 .6 2 .6 3.2C26.6 42 25.4 44 23 44 12 44 4 35 4 24S13 4 24 4z" fill="#e8dcc6"/>
      <circle cx="15" cy="20" r="3.6" fill="#7d5f33"/><circle cx="23" cy="13" r="3.6" fill="#2c5b6b"/>
      <circle cx="33" cy="16" r="3.6" fill="#b58a45"/><circle cx="13" cy="30" r="3.6" fill="#8db3a7"/>
    </svg>`;
  const brand = `<a class="brand" href="index.html" aria-label="${Site.esc(S.brand)} home">${mark}
      <span class="brand__text"><span class="brand__name">${Site.esc(S.artist)}</span></span></a>`;

  const header = $("#site-header");
  if (header) {
    header.className = "site-header";
    header.innerHTML = `<div class="wrap site-header__inner">${brand}
      <button class="nav-toggle" aria-label="Menu" aria-expanded="false" aria-controls="nav"><span></span><span></span><span></span></button>
      <nav class="nav" id="nav">
        ${links.map(([href, label, key]) => `<a href="${href}"${key === page ? ' aria-current="page"' : ""}>${label}</a>`).join("")}
      </nav></div>`;
    const toggle = $(".nav-toggle", header);
    toggle.addEventListener("click", () => {
      const open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open);
    });
    $$(".nav a", header).forEach((a) => a.addEventListener("click", () => document.body.classList.remove("nav-open")));
    const onScroll = () => header.classList.toggle("is-scrolled", scrollY > 10);
    addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }

  const footer = $("#site-footer");
  if (footer) {
    const showCta = document.body.dataset.cta !== "off";
    footer.className = "site-footer";
    footer.innerHTML = `
      <svg class="edge" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 60V32c90-18 180-26 270-14s160 30 260 26 180-34 300-36 190 26 300 30 200-16 310-24v46z"/></svg>
      <div class="wrap">
        ${showCta ? `<div class="footer-cta reveal">
          <span class="eyebrow">Contact</span>
          <h2>Get in touch</h2>
          <p>Ask about a painting, a pet portrait, a custom piece or a Pasta &amp; Paint party.</p>
          <div class="btn-row"><a class="btn btn--light" href="contact.html">Get in touch ${ICON.arrow}</a><a class="btn btn--ghost-light" href="gallery.html#status=available">See available work</a></div>
        </div>` : ""}
        <div class="footer-grid">
          <div>${brand}<p style="margin-top:1.2rem;max-width:32ch;font-size:.92rem">Original paintings of the coast, gardens and home.</p></div>
          <div><h4>Explore</h4><ul>${links.map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join("")}</ul></div>
          <div><h4>Subjects</h4><ul>${(window.CATEGORIES || []).map((c) => `<li><a href="gallery.html#subject=${c.id}">${c.name}</a></li>`).join("")}</ul></div>
          <div><h4>Say hello</h4><ul>
            <li><a href="mailto:${S.email}">${S.email}</a></li>
            <li><a href="tel:${S.phone.replace(/[^\d+]/g, "")}">${S.phone}</a></li>
            <li><a href="https://instagram.com/${S.instagram}" target="_blank" rel="noopener">Instagram</a></li>
            ${S.facebook ? `<li><a href="${S.facebook}" target="_blank" rel="noopener">Facebook</a></li>` : ""}
            <li>${S.region}</li></ul></div>
        </div>
        <div class="footer-bottom"><span>© ${new Date().getFullYear()} ${Site.esc(S.brand)}. All artwork © the artist.</span></div>
      </div>`;
  }

  /* ---------- data-site placeholders ---------- */
  $$("[data-site]").forEach((el) => {
    const key = el.dataset.site; const v = S[key];
    if (v == null) return;
    if (el.tagName === "A") {
      if (key === "email") el.href = `mailto:${v}`;
      if (key === "phone") el.href = `tel:${v.replace(/[^\d+]/g, "")}`;
      if (key === "instagram") el.href = /^https?:/.test(v) ? v : `https://instagram.com/${v}`;
      if (key === "facebook") el.href = /^https?:/.test(v) ? v : `https://facebook.com/${v}`;
    }
    el.textContent = key === "instagram" ? `@${v}` : key === "facebook" ? "Facebook" : v;
  });

  /* ---------- Reveal on scroll ---------- */
  const io = "IntersectionObserver" in window && !reduceMotion
    ? new IntersectionObserver((entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 })
    : null;
  Site.observe = (root = document) => $$(".reveal:not(.is-in)", root).forEach((el) => io ? io.observe(el) : el.classList.add("is-in"));
  document.addEventListener("DOMContentLoaded", () => Site.observe());
  if (document.readyState !== "loading") Site.observe();

  /* ---------- Ampersands in the thematic beige ----------
     Wraps the "&" in h1 and h2 text, including headings rendered later, so the
     mark picks up .amp without every template having to remember the span. */
  const AMP_SKIP = /^(SCRIPT|STYLE|TEXTAREA|OPTION|SELECT|SVG)$/;
  const AMP_IN = "h1, h2";                          // big titles only
  function ampify(root) {
    if (!root || root.nodeType !== 1) return;
    $$(AMP_IN, root).forEach(ampifyOne);
    if (root.matches && root.matches(AMP_IN)) ampifyOne(root);
  }
  function ampifyOne(root) {
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(t) {
        if (!t.nodeValue.includes("&")) return NodeFilter.FILTER_REJECT;
        const p = t.parentElement;
        if (!p || AMP_SKIP.test(p.nodeName) || p.closest(".amp")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const hits = [];
    for (let t = walk.nextNode(); t; t = walk.nextNode()) hits.push(t);
    hits.forEach((t) => {
      const frag = document.createDocumentFragment();
      t.nodeValue.split("&").forEach((part, i) => {
        if (i) { const sp = document.createElement("span"); sp.className = "amp"; sp.textContent = "&"; frag.appendChild(sp); }
        if (part) frag.appendChild(document.createTextNode(part));
      });
      t.parentNode.replaceChild(frag, t);
    });
  }
  let ampQueued = false;
  const ampObserver = new MutationObserver(() => {
    if (ampQueued) return;
    ampQueued = true;
    requestAnimationFrame(() => {
      ampQueued = false;
      ampObserver.disconnect();                    // our own spans must not re-trigger this
      ampify(document.body);
      ampObserver.observe(document.body, { childList: true, subtree: true });
    });
  });
  const ampStart = () => {
    ampify(document.body);
    ampObserver.observe(document.body, { childList: true, subtree: true });
  };
  document.addEventListener("DOMContentLoaded", ampStart);
  if (document.readyState !== "loading") ampStart();

  /* ---------- Colour language, derived live from each painting ----------
     Samples the thumbnail, builds a saturation-weighted hue histogram and picks
     the strongest vivid hue. Works for any image, with nothing stored per painting. */
  const hsl = (h, s, l, a = 1) => `hsl(${(((h % 360) + 360) % 360).toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}% / ${a})`;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  Site.hsl = hsl;

  // sRGB 0-255 -> OKLab, a perceptual space where "how colourful" is comparable across hues
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  function oklab(r, g, b) {
    const R = lin(r), G = lin(g), B = lin(b);
    const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
    const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
    const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
  }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
    if (!d) return [0, 0, l];
    const s = d / (1 - Math.abs(2 * l - 1));
    let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [(h * 60 + 360) % 360, s, l];
  }

  function derivePalette(img) {
    let h = 38, s = 0.3, l = 0.55, vivid = 0, second = null, primaryArea = 1, secondArea = 0;
    if (img) {
      // sample the middle of the photo; the edges are often wall, table or frame
      const N = 64, cv = document.createElement("canvas");
      cv.width = cv.height = N;
      const ctx = cv.getContext("2d", { willReadFrequently: true });
      const iw = img.naturalWidth, ih = img.naturalHeight;
      ctx.drawImage(img, iw * 0.08, ih * 0.08, iw * 0.84, ih * 0.84, 0, 0, N, N);
      const px = ctx.getImageData(0, 0, N, N).data;
      const labs = [];
      for (let i = 0; i < px.length; i += 4) labs.push(oklab(px[i], px[i + 1], px[i + 2]));

      // white balance: phone photos add a warm (or cool) cast; estimate it from the
      // near-neutral pixels (clouds, whites, greys) and remove it before judging hue
      let ca = 0, cb = 0, cn = 0;
      for (const [L, a, bb] of labs) if (L > 0.45 && Math.hypot(a, bb) < 0.07) { ca += a; cb += bb; cn++; }
      // half strength: enough to undo a photo's tint without bleaching a genuinely warm painting
      if (cn > labs.length * 0.03) { ca = (ca / cn) * 0.5; cb = (cb / cn) * 0.5; } else { ca = 0; cb = 0; }

      const B = 24, W = new Float32Array(B), members = Array.from({ length: B }, () => []);
      let total = 0, count = 0;
      labs.forEach(([L, a0, b0], j) => {
        const a = a0 - ca, bb = b0 - cb, C = Math.hypot(a, bb);
        total++;
        // colourful enough to count (drops greys and sand), not near-black, and not a
        // near-white highlight: sunlit foam, bright sky and glare read as pale warm pixels
        // and, being numerous, used to outvote the water or foliage that carries the painting
        if (C < 0.045 || L < 0.25 || L > 0.85) return;
        count++;
        const hue = (Math.atan2(bb, a) * 180 / Math.PI + 360) % 360;
        const k = Math.floor(hue / (360 / B)) % B, i = j * 4;
        W[k] += C;                                   // area-weighted, nudged towards stronger colour
        members[k].push([C, px[i], px[i + 1], px[i + 2]]);
      });
      // blues and greens spread over neighbouring hues, so score a wider window
      const score = (k) => 0.35 * W[(k + B - 2) % B] + 0.7 * W[(k + B - 1) % B] + W[k] + 0.7 * W[(k + 1) % B] + 0.35 * W[(k + 2) % B];

      // A cluster's *average* drifts towards mud when a painting is many-coloured, so take
      // the most saturated quarter of it: a specific colour from the painting, not a blend.
      const pick = (centre) => {
        const pool = [];
        // ±1 bin: wide enough to have pixels to choose from, tight enough that the average
        // stays the winning cluster's colour instead of blending into its warm neighbours
        for (let o = -1; o <= 1; o++) pool.push(...members[(centre + o + B) % B]);
        if (!pool.length) return null;
        pool.sort((p, q) => q[0] - p[0]);
        const take = pool.slice(0, Math.max(8, Math.round(pool.length * 0.25)));
        let r = 0, g = 0, b = 0;
        for (const [, pr, pg, pb] of take) { r += pr; g += pg; b += pb; }
        return rgbToHsl(r / take.length, g / take.length, b / take.length);
      };

      let best = 0, bestScore = -1;
      for (let k = 0; k < B; k++) { const sc = score(k); if (sc > bestScore) { bestScore = sc; best = k; } }
      const primary = pick(best);
      if (primary) {
        [h, s, l] = primary;
        vivid = count / total;
        // a secondary colour at least 75 degrees away, for accents in the room
        let alt = -1, altScore = 0;
        for (let k = 0; k < B; k++) {
          const dist = Math.min((k - best + B) % B, (best - k + B) % B);
          if (dist < 5) continue;
          const sc = score(k);
          if (sc > altScore) { altScore = sc; alt = k; }
        }
        if (alt >= 0 && altScore > bestScore * 0.22) { second = pick(alt); secondArea = altScore; }
        primaryArea = bestScore;
      }
    }
    // The biggest colour area isn't always the one that makes the painting memorable:
    // a wide sand or sky can outvote the teal water that gives it its character. So the
    // glow takes whichever of the two clusters is more colourful, while the wall keeps
    // the dominant one, which is usually the quieter, more liveable tint.
    const vividness = (c) => (c ? c[1] * (1 - Math.abs(c[2] - 0.55) * 1.1) : -1);
    const primary = [h, s, l];
    // weigh how much of the painting a colour covers against how colourful it is, so a small
    // vivid patch can't outvote the sea, and a wide pale sand can't outvote the sea either
    const standing = (c, area) => (c ? Math.sqrt(Math.max(area, 0)) * vividness(c) : -1);
    const feature = standing(second, secondArea) > standing(primary, primaryArea) * 1.1 ? second : primary;
    const [fh, fs, fl] = feature;
    const other = feature === primary ? second : primary;
    const muted = vivid < 0.04 || fs < 0.15;
    return {
      h, s, l, muted, hFeature: fh,
      accent: hsl(fh, clamp(fs, 0.4, 0.78), clamp(fl, 0.42, 0.6)),
      accent2: other ? hsl(other[0], clamp(other[1], 0.4, 0.75), clamp(other[2], 0.42, 0.62)) : null,
      // back-glow in that colour; near-grey paintings get warm lamplight instead
      glow: muted ? hsl(38, 0.6, 0.72) : hsl(fh, clamp(fs * 1.25, 0.6, 0.9), clamp(fl * 0.75 + 0.22, 0.58, 0.72)),
      // the wall carries a clear hint of the painting without competing with it
      wall: muted ? hsl(38, 0.12, 0.9) : hsl(h, clamp(s * 0.8, 0.2, 0.42), h > 20 && h < 95 ? 0.9 : 0.885),
    };
  }
  const paletteCache = new Map();
  Site.palette = (slug) => {
    if (!paletteCache.has(slug)) {
      paletteCache.set(slug, new Promise((resolve) => {
        const img = new Image();
        img.onload = () => { try { resolve(derivePalette(img)); } catch (_) { resolve(derivePalette(null)); } };
        img.onerror = () => resolve(derivePalette(null));
        img.src = Site.thumb(slug);
      }));
    }
    return paletteCache.get(slug);
  };

  /* ---------- Hanging-canvas motion shared by the hero and the viewer ---------- */
  // gentle, slightly irregular pendulum sway in degrees
  Site.swing = (t) => Math.sin(t / 1500) * 0.7 + Math.sin(t / 3900 + 1.3) * 0.3;
  // light comes from the upper left, so the shadow falls down-right and slides as the canvas swings or tilts
  Site.castShadow = (el, a, rx, ry, k = 1) => {
    const dx = (10 + ry * 0.7 + a * 3) * k, dy = (15 - rx * 0.8) * k;
    el.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) rotate(${(a * 1.1).toFixed(3)}deg) scale(${(1 + Math.abs(ry) / 320).toFixed(4)})`;
  };

  /* ---------- Fade images in once loaded ---------- */
  Site.lazyFade = (img) => {
    if (img.complete && img.naturalWidth) img.classList.add("is-loaded");
    else img.addEventListener("load", () => img.classList.add("is-loaded"), { once: true });
  };
})();
