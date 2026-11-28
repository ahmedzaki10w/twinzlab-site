/* TwinzLab contact map — square pixel world, subtle peach waves, Wroclaw mark. */
(function () {
  const PEACH = [0xea, 0xab, 0x78];
  const BLUE = [0xc1, 0xd9, 0xff];
  const GREY = [0x5a, 0x53, 0x4c]; /* slightly dimmer warm grey */
  const OCEAN = [0x32, 0x2b, 0x24];

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function mixC(a, b, t) {
    return [
      Math.round(lerp(a[0], b[0], t)),
      Math.round(lerp(a[1], b[1], t)),
      Math.round(lerp(a[2], b[2], t)),
    ];
  }
  function rgb(c, a) {
    return a == null ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  }
  function hash(c, r, s) {
    let n = (c * 73856093) ^ (r * 19349663) ^ (s * 83492791);
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  function lightOf(cell, t) {
    const n = hash(cell.c, cell.r, 1);
    const n2 = hash(cell.c, cell.r, 2);
    const period = 6.2 + n * 5.2;
    const phase = ((t / period) + n) % 1;
    let pulse = 0;
    const win = 0.16;
    if (phase < win) pulse = Math.sin((phase / win) * Math.PI);
    const wave = 0.5 + 0.5 * Math.sin(t * 0.52 + cell.c * 0.068 - cell.r * 0.035);
    const wave2 = 0.5 + 0.5 * Math.sin(t * 0.33 - cell.c * 0.04 + cell.r * 0.07 + 2.1);
    const gate = 0.28 + 0.72 * (wave * wave * 0.65 + wave2 * 0.35);
    const active = n2 > 0.32 ? 1 : 0.18;
    return clamp(pulse * gate * active, 0, 1);
  }

  function revealOf(cell, t, col0, nCols, rows) {
    const delay = ((cell.c - col0) / nCols) * 0.9 + (cell.r / rows) * 0.07;
    return easeOut(clamp((t - delay) / 0.38, 0, 1));
  }

  function accentOf(cell) {
    return hash(cell.c, cell.r, 3) < 0.11 ? BLUE : PEACH;
  }

  function pickLayout(available, data) {
    const cols = data.cols;
    const rows = data.rows;
    if (available >= 1320) {
      return { col0: 0, col1: cols, cell: 12, tile: 9, gap: 3 };
    }
    /* Mobile / narrow: crop to Europe–Africa–Asia–Australia, integer cells. */
    if (available < 700) {
      const col0 = 50; /* ~16°W, west Africa / Iberia */
      const col1 = 108; /* ~170°E, Japan / Australia / NZ */
      const n = col1 - col0;
      const cell = Math.max(4, Math.floor(available / n));
      const tile = Math.max(3, cell - 1);
      return { col0, col1, cell, tile, gap: cell - tile };
    }
    /* Mid widths: full world, largest integer cell that fits. */
    const cell = Math.max(6, Math.floor(available / cols));
    const tile = Math.max(4, cell - Math.round(cell / 4));
    return { col0: 0, col1: cols, cell, tile, gap: cell - tile };
  }

  window.TwinzMap = {
    async mount(root, dataUrl) {
      let data = window.__MAP_DATA;
      if (!data) {
        const res = await fetch(dataUrl || "assets/map-data.json");
        data = await res.json();
      }
      const { cols, rows, land, wroclaw } = data;
      const canvas = root.querySelector("canvas");
      const chip = root.querySelector(".map-chip");
      const wrap = root.parentElement || root;

      let layout, ocean, cssW, cssH, dpr;
      let start = performance.now();
      let frozen = null;

      function availableWidth() {
        const w = wrap.clientWidth || root.clientWidth || window.innerWidth;
        return Math.max(200, Math.floor(w));
      }

      function rebuildOcean() {
        ocean = document.createElement("canvas");
        ocean.width = canvas.width;
        ocean.height = canvas.height;
        const octx = ocean.getContext("2d");
        octx.setTransform(dpr, 0, 0, dpr, 0, 0);
        octx.fillStyle = rgb(OCEAN, 0.7);
        const landSet = new Set(land.map((c) => c.c + "," + c.r));
        const { col0, col1, cell } = layout;
        const dot = cell >= 8 ? 2 : cell >= 6 ? 1.5 : 1;
        for (let r = 0; r < rows; r++) {
          for (let c = col0; c < col1; c++) {
            if (landSet.has(c + "," + r)) continue;
            if (hash(c, r, 4) < 0.18) continue;
            const x = (c - col0) * cell + cell / 2;
            const y = r * cell + cell / 2;
            octx.fillRect(x - dot / 2, y - dot / 2, dot, dot);
          }
        }
      }

      function placeChip() {
        if (!chip) return;
        const { col0, col1, cell } = layout;
        const markX = (wroclaw.c - col0) * cell + cell / 2;
        const markY = wroclaw.r * cell + cell / 2;
        const cw = chip.offsetWidth || 280;
        const ch = chip.offsetHeight || 34;
        const mobile = col0 > 0;
        let left, top;
        if (mobile) {
          /* Sit below the marker, inset so it never clips. */
          left = clamp(markX - cw / 2, 8, cssW - 8 - cw);
          top = markY + Math.max(16, cell + 8);
          if (top + ch > cssH - 8) top = Math.max(8, markY - 14 - ch);
        } else {
          left = markX - 14 - cw;
          top = markY - ch / 2;
          if (left < 8) left = markX + 14;
          if (top < 8) top = 8;
          if (top + ch > cssH - 8) top = cssH - 8 - ch;
        }
        chip.style.left = Math.round(left) + "px";
        chip.style.top = Math.round(top) + "px";
      }

      function applyLayout() {
        layout = pickLayout(availableWidth(), data);
        const { col0, col1, cell } = layout;
        cssW = (col1 - col0) * cell;
        cssH = rows * cell;
        dpr = Math.min(3, window.devicePixelRatio || 1);
        root.style.width = cssW + "px";
        root.style.height = cssH + "px";
        canvas.style.width = cssW + "px";
        canvas.style.height = cssH + "px";
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);
        const ctx = canvas.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        rebuildOcean();
        requestAnimationFrame(placeChip);
        return ctx;
      }

      let ctx = applyLayout();

      function render(t) {
        const motion = reduced || t < 0;
        const time = motion ? 99 : t;
        const { col0, col1, cell, tile, gap } = layout;
        const nCols = col1 - col0;
        const markX = (wroclaw.c - col0) * cell + cell / 2;
        const markY = wroclaw.r * cell + cell / 2;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssW, cssH);
        if (ocean) ctx.drawImage(ocean, 0, 0, cssW, cssH);

        for (const cellData of land) {
          if (cellData.c < col0 || cellData.c >= col1) continue;
          const isWr = cellData.c === wroclaw.c && cellData.r === wroclaw.r;
          const rev = motion ? 1 : revealOf(cellData, time, col0, nCols, rows);
          if (rev <= 0) continue;
          if (isWr) continue;
          const x = (cellData.c - col0) * cell + gap / 2;
          const y = cellData.r * cell + gap / 2;
          const lit = motion ? 0 : lightOf(cellData, time);
          const grey = mixC([0, 0, 0], GREY, cellData.t);
          const col = mixC(grey, accentOf(cellData), lit);
          ctx.globalAlpha = rev;
          ctx.fillStyle = rgb(col);
          ctx.fillRect(x, y, tile, tile);
        }
        ctx.globalAlpha = 1;

        if (wroclaw.c >= col0 && wroclaw.c < col1) {
          const wrRev = motion ? 1 : revealOf({ c: wroclaw.c, r: wroclaw.r }, time, col0, nCols, rows);
          if (wrRev > 0) {
            const pulse = motion ? 1 : 0.62 + 0.38 * (0.5 + 0.5 * Math.sin((time * Math.PI * 2) / 2.4));
            const x = (wroclaw.c - col0) * cell + gap / 2;
            const y = wroclaw.r * cell + gap / 2;
            const glowR = (cell >= 10 ? 16 : 11) + (cell >= 10 ? 7 : 5) * pulse;
            const g = ctx.createRadialGradient(markX, markY, 2, markX, markY, glowR);
            g.addColorStop(0, rgb(PEACH, 0.55 * pulse * wrRev));
            g.addColorStop(0.45, rgb(PEACH, 0.18 * pulse * wrRev));
            g.addColorStop(1, rgb(PEACH, 0));
            ctx.fillStyle = g;
            ctx.fillRect(markX - glowR, markY - glowR, glowR * 2, glowR * 2);
            ctx.globalAlpha = wrRev;
            ctx.fillStyle = rgb(mixC(mixC(GREY, PEACH, 0.55), PEACH, pulse));
            ctx.fillRect(x, y, tile, tile);
            ctx.globalAlpha = 1;
          }
        }

        if (chip) {
          const chipT = motion ? 1 : easeOut(clamp((time - 0.7) / 0.45, 0, 1));
          chip.style.opacity = String(chipT);
        }
      }

      let visible = true;
      let hiddenAt = 0;
      let looping = false;
      function loop(now) {
        looping = false;
        if (frozen != null || !visible) return;
        render((now - start) / 1000);
        if (!reduced) {
          looping = true;
          requestAnimationFrame(loop);
        }
      }
      new IntersectionObserver(function (entries) {
        const on = entries[0].isIntersecting;
        if (!on) {
          hiddenAt = performance.now();
          visible = false;
          return;
        }
        if (hiddenAt) start += performance.now() - hiddenAt;
        hiddenAt = 0;
        visible = true;
        if (!reduced && frozen == null && !looping) requestAnimationFrame(loop);
      }).observe(root);

      window.__mapRender = function (t) {
        frozen = t;
        render(t);
        placeChip();
      };
      window.__mapResume = function () {
        frozen = null;
        start = performance.now();
        if (!reduced) requestAnimationFrame(loop);
      };
      window.__mapRelayout = function () {
        ctx = applyLayout();
        const t = frozen != null ? frozen : (reduced ? 99 : (performance.now() - start) / 1000);
        render(t);
        placeChip();
      };
      window.__mapData = data;
      window.__mapLayout = function () { return { ...layout, cssW, cssH }; };

      let resizeTimer;
      window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () { window.__mapRelayout(); }, 80);
      });

      if (reduced) render(99);
      requestAnimationFrame(placeChip);

      return { render, data };
    },
  };
  function boot() {
    const root = document.querySelector(".worldmap");
    if (root) window.TwinzMap.mount(root);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
