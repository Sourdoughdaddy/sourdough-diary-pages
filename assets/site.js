  // Launch day: paste the App Store link between the quotes. Every
  // "Coming soon" on the page becomes a download button.
  var STORE_URL = "";

  (function () {
    var root = document.documentElement;

    if (STORE_URL) {
      root.dataset.store = "live";
      document.querySelectorAll("[data-store-link]").forEach(function (a) { a.href = STORE_URL; });
    }

    function setLang(lang, remember) {
      root.dataset.lang = lang;
      root.lang = lang;
      document.querySelectorAll("[data-set-lang]").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.dataset.setLang === lang));
      });
      // The screenshots are the app in that language, too.
      document.querySelectorAll("img[data-" + lang + "]").forEach(function (img) {
        var next = img.dataset[lang];
        if (img.getAttribute("src") !== next) img.src = next;
      });
      if (remember) { try { localStorage.setItem("lang", lang); } catch (e) {} }
    }

    var asked = new URLSearchParams(location.search).get("lang");
    var saved = null;
    try { saved = localStorage.getItem("lang"); } catch (e) {}
    var guess = (navigator.language || "en").toLowerCase().indexOf("de") === 0 ? "de" : "en";
    var first = asked === "de" || asked === "en" ? asked : (saved === "de" || saved === "en" ? saved : guess);
    setLang(first, false);

    document.querySelectorAll("[data-set-lang]").forEach(function (b) {
      b.addEventListener("click", function () { setLang(b.dataset.setLang, true); });
    });

    // ---------- Scroll story. Layout is read once a frame and handed to
    // CSS as numbers between 0 and 1; the stylesheet does the drawing.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    root.classList.add("sx");

    var hero = document.querySelector(".hero");
    var story = document.querySelector("[data-story]");
    // Pieces any page may carry: the iPad that tips up, the bake you
    // travel along sideways.
    var lone = document.querySelector("[data-rise]");
    var pan = document.querySelector("[data-pan]");
    var rail = pan && pan.querySelector(".pan-rail");
    var stops = pan ? [].slice.call(pan.querySelectorAll(".stop")) : [];
    function extras() {
      var h = window.innerHeight, b;
      if (lone) {
        b = lone.getBoundingClientRect();
        if (b.top < h && b.bottom > 0) {
          var v = Math.min(1, Math.max(0, (h - b.top) / (h * 0.75)));
          lone.style.setProperty("--t", (1 - Math.pow(1 - v, 3)).toFixed(4));
        }
      }
      if (pan) {
        b = pan.getBoundingClientRect();
        if (b.top < h && b.bottom > 0) {
          var pp = Math.min(1, Math.max(0, -b.top / (b.height - h)));
          var box = rail.parentNode;
          var travel = Math.max(0, rail.scrollWidth - (box.clientWidth - 2 * parseFloat(getComputedStyle(box).paddingLeft || 0)));
          rail.style.setProperty("--x", (pp * travel).toFixed(1));
          var edge = window.innerWidth * 0.62;
          stops.forEach(function (stop) {
            stop.style.setProperty("--on", stop.getBoundingClientRect().left < edge ? 1 : 0);
          });
        }
      }
    }
    if (!hero || !story) {
      if (!lone && !pan) return;
      var tick = false;
      var run = function () { tick = false; extras(); };
      var ask = function () { if (!tick) { tick = true; requestAnimationFrame(run); } };
      window.addEventListener("scroll", ask, { passive: true });
      window.addEventListener("resize", ask);
      extras();
      return;
    }
    var storyBg = story.querySelector(".story-bg");
    var stage = story.querySelector(".story-stage");
    var chapters = [].slice.call(story.querySelectorAll(".chapter"));
    var screens = [].slice.call(stage.querySelectorAll(".screens img"));
    var crumb = stage.querySelector(".crumb");
    var rise = document.querySelector("[data-rise]");
    var tent = document.querySelector("[data-tent]");
    var narrow = window.matchMedia("(max-width: 860px)");
    var queued = false;

    function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
    function ease(v) { return 1 - Math.pow(1 - v, 3); }
    function span(v, from, to) { return clamp((v - from) / (to - from)); }

    function frame() {
      queued = false;
      var vh = window.innerHeight;
      var r = hero.getBoundingClientRect();
      if (r.bottom > 0) hero.style.setProperty("--p", clamp(-r.top / r.height).toFixed(4));

      r = story.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) {
        var sp = clamp(-r.top / (r.height - vh));
        stage.style.setProperty("--p", sp.toFixed(4));
        storyBg.style.setProperty("--p", sp.toFixed(4));
        chapters.forEach(function (chapter, i) {
          var c = chapter.getBoundingClientRect();
          var d = (c.top + c.height / 2 - vh / 2) / vh;
          var o = narrow.matches
            ? (d > 0 ? 1 : span(d, -0.42, -0.2))
            : span(Math.abs(d), 0.6, 0.36);
          chapter.style.setProperty("--o", ease(o).toFixed(4));
          if (i > 0) {
            var t = ease(span(c.top, vh * 0.92, vh * 0.3));
            screens[i].style.setProperty("--t", t.toFixed(4));
            if (i === 2) crumb.style.setProperty("--k", t.toFixed(4));
          }
        });
      }

      r = rise.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) rise.style.setProperty("--t", ease(span(r.top, vh, vh * 0.25)).toFixed(4));

      r = tent.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) {
        var tp = clamp(-r.top / (r.height - vh));
        tent.style.setProperty("--c", ease(span(tp, 0, 0.5)).toFixed(4));
        tent.style.setProperty("--a", ease(span(tp, 0.28, 0.6)).toFixed(4));
        tent.style.setProperty("--b", ease(span(tp, 0.4, 0.82)).toFixed(4));
      }
    }
    function queue() { if (!queued) { queued = true; requestAnimationFrame(frame); } }
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    frame();
  })();
