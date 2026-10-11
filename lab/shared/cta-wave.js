/* Lab partnership-card wave.
   Same component the other pages mount in .framer-eoj4lp-container
   (layout node wG5huXsZo, function Nt in script_main). Props are the
   instance values from that node, not the component defaults.
   Drawn on a 2D canvas so the article page does not load Framer hydration. */
(function () {
  var PROPS = {
    backgroundColor: "rgba(99, 61, 32, 0)",
    colorBottom: "rgb(217, 217, 217)",
    colorTop: "rgb(212, 138, 78)",
    colSpacing: 16,
    damping: 0.31,
    dotGap: 13,
    fontFamily: "Inter",
    fontSize: 10,
    influenceRadius: 120,
    maxStack: 12,
    springStrength: 0.01
  };

  var CHARS = [".", "-", "_", "*", "/", "\\", "|", "'", "`", ",", ";", ":", "+", "#", "t", "d", "x", "z", "o"];

  function parseColor(value) {
    var scratch = document.createElement("canvas").getContext("2d");
    scratch.fillStyle = "#000000";
    scratch.fillStyle = value;
    var normalized = scratch.fillStyle;
    if (typeof normalized === "string" && normalized.charAt(0) === "#") {
      var hex = normalized.length === 4
        ? "#" + normalized.charAt(1) + normalized.charAt(1) + normalized.charAt(2) + normalized.charAt(2) + normalized.charAt(3) + normalized.charAt(3)
        : normalized;
      return {
        r: parseInt(hex.substring(1, 3), 16),
        g: parseInt(hex.substring(3, 5), 16),
        b: parseInt(hex.substring(5, 7), 16)
      };
    }
    var match = String(normalized).match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
    if (match) {
      return { r: Math.round(Number(match[1])), g: Math.round(Number(match[2])), b: Math.round(Number(match[3])) };
    }
    return { r: 217, g: 217, b: 217 };
  }

  function mix(a, b, t) {
    return {
      r: Math.round(a.r + (b.r - a.r) * t),
      g: Math.round(a.g + (b.g - a.g) * t),
      b: Math.round(a.b + (b.b - a.b) * t)
    };
  }

  function randomChar() {
    return CHARS[Math.floor(Math.random() * CHARS.length)];
  }

  function mount(container) {
    var host = container.querySelector("div");
    var canvas = container.querySelector("canvas");
    if (!host || !canvas) {
      host = document.createElement("div");
      canvas = document.createElement("canvas");
      container.textContent = "";
      container.appendChild(host);
      host.appendChild(canvas);
    }
    host.style.width = "100%";
    host.style.height = "100%";
    host.style.background = PROPS.backgroundColor;
    host.style.overflow = "hidden";
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";

    var ctx = canvas.getContext("2d");
    var colorBottom = parseColor(PROPS.colorBottom);
    var colorTop = parseColor(PROPS.colorTop);
    var pointer = { x: -9999, y: -9999 };
    var columns = [];
    var width = 0;
    var height = 0;
    var frame = 0;

    function Column(x, baseY) {
      this.x = x;
      this.baseY = baseY;
      this.count = 0;
      this.target = 0;
      this.vel = 0;
      this.chars = [];
      this.ticker = Math.floor(Math.random() * 60);
      for (var i = 0; i < PROPS.maxStack + 1; i++) this.chars.push(randomChar());
    }

    Column.prototype.update = function () {
      this.ticker++;
      if (this.ticker > 80 + Math.random() * 60) {
        this.chars[Math.floor(Math.random() * this.chars.length)] = randomChar();
        this.ticker = 0;
      }
      var distance = Math.hypot(pointer.x - this.x, pointer.y - this.baseY);
      if (distance < PROPS.influenceRadius) {
        var t = 1 - distance / PROPS.influenceRadius;
        this.target = t * t * (3 - 2 * t) * PROPS.maxStack;
      } else {
        this.target = 0;
      }
      this.vel = (this.vel + (this.target - this.count) * PROPS.springStrength) * PROPS.damping;
      this.count += this.vel;
      if (this.count < 0) {
        this.count = 0;
        this.vel = 0;
      }
    };

    Column.prototype.drawChar = function (ch, x, y, alpha, blend) {
      var color = mix(colorBottom, colorTop, blend);
      ctx.fillStyle = "rgba(" + color.r + "," + color.g + "," + color.b + "," + alpha + ")";
      ctx.fillText(ch, x, y);
    };

    Column.prototype.draw = function () {
      var filled = Math.floor(this.count);
      var frac = this.count - filled;
      ctx.font = PROPS.fontSize + "px " + PROPS.fontFamily;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      this.drawChar(this.chars[0], this.x, this.baseY, 1, 0);
      for (var i = 1; i <= filled; i++) {
        var blend = i / PROPS.maxStack;
        var alpha = 0.25 + 0.75 * (1 - (i - 1) / PROPS.maxStack);
        this.drawChar(this.chars[i], this.x, this.baseY - i * PROPS.dotGap, alpha, blend);
      }
      if (frac > 0.01 && filled < PROPS.maxStack) {
        var nextBlend = (filled + 1) / PROPS.maxStack;
        var nextAlpha = frac * (0.25 + 0.75 * (1 - filled / PROPS.maxStack));
        this.drawChar(this.chars[filled + 1], this.x, this.baseY - (filled + 1) * PROPS.dotGap, nextAlpha, nextBlend);
      }
    };

    function layout() {
      var rect = host.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      if (width < 1 || height < 1) return;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.floor((width - PROPS.colSpacing) / PROPS.colSpacing);
      var origin = (width - (count - 1) * PROPS.colSpacing) / 2;
      columns = [];
      for (var i = 0; i < count; i++) {
        columns.push(new Column(origin + i * PROPS.colSpacing, height - 6));
      }
    }

    function tick() {
      ctx.clearRect(0, 0, width, height);
      for (var i = 0; i < columns.length; i++) {
        columns[i].update();
        columns[i].draw();
      }
      frame = requestAnimationFrame(tick);
    }

    function onMove(event) {
      var rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    }

    function onLeave() {
      pointer.x = -9999;
      pointer.y = -9999;
    }

    window.addEventListener("mousemove", onMove);
    host.addEventListener("mouseleave", onLeave);
    var observer = new ResizeObserver(function () {
      cancelAnimationFrame(frame);
      layout();
      tick();
    });
    observer.observe(host);
    layout();
    tick();
    if (document.fonts && document.fonts.load) {
      document.fonts.load(PROPS.fontSize + "px " + PROPS.fontFamily).catch(function () {});
    }
  }

  function start() {
    var container = document.querySelector(".framer-eoj4lp-container");
    if (container) mount(container);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
