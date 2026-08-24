/**
 * SEO Basic PRO - Performance module (Core Web Vitals basic).
 * Uses LCP, CLS, INP (FID deprecated).
 */
(function () {
  "use strict";

  var metrics = {
    lcp: null,
    cls: null,
    inp: null
  };

  function classifyLcp(value) {
    if (value == null) return "N/A";
    if (value <= 2500) return "Tốt";
    if (value <= 4000) return "Cần cải thiện";
    return "Kém";
  }

  function classifyCls(value) {
    if (value == null) return "N/A";
    if (value <= 0.1) return "Tốt";
    if (value <= 0.25) return "Cần cải thiện";
    return "Kém";
  }

  function classifyInp(value) {
    if (value == null) return "N/A";
    if (value <= 200) return "Tốt";
    if (value <= 500) return "Cần cải thiện";
    return "Kém";
  }

  function setupObservers() {
    try {
      if ("PerformanceObserver" in window) {
        var lcpObserver = new PerformanceObserver(function (entryList) {
          var entries = entryList.getEntries();
          if (entries.length) metrics.lcp = entries[entries.length - 1].renderTime || entries[entries.length - 1].loadTime || entries[entries.length - 1].startTime;
        });
        lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
      }
    } catch (e) {}

    try {
      if ("PerformanceObserver" in window) {
        var clsValue = 0;
        var clsObserver = new PerformanceObserver(function (entryList) {
          var entries = entryList.getEntries();
          for (var i = 0; i < entries.length; i++) {
            if (!entries[i].hadRecentInput) clsValue += entries[i].value;
          }
          metrics.cls = clsValue;
        });
        clsObserver.observe({ type: "layout-shift", buffered: true });
      }
    } catch (e) {}

    try {
      if ("PerformanceObserver" in window) {
        var inpObserver = new PerformanceObserver(function (entryList) {
          var entries = entryList.getEntries();
          for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            if (entry.interactionId && (metrics.inp == null || entry.duration > metrics.inp)) {
              metrics.inp = entry.duration;
            }
          }
        });
        inpObserver.observe({ type: "event", buffered: true, durationThreshold: 40 });
      }
    } catch (e) {}
  }

  function getVitals() {
    return {
      lcp: metrics.lcp,
      lcpRating: classifyLcp(metrics.lcp),
      cls: metrics.cls,
      clsRating: classifyCls(metrics.cls),
      inp: metrics.inp,
      inpRating: classifyInp(metrics.inp)
    };
  }

  setupObservers();
  window.SEOBasicPerformance = {
    getVitals: getVitals
  };
})();
