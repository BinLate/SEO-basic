/**
 * SEO Basic PRO - UI module for panel and shared rendering.
 * v2.1.0: rewritten. Panel with 4 tabs: Score | SEO | Links | Perf.
 * Exposes window.SEOBasicUI = { createPanel, renderIssueList }.
 */
(function () {
  "use strict";

  var HOST_ID = "seo-basic-extension-host";
  var POSITION_CLASSES = [
    "pos-top-left",
    "pos-top-center",
    "pos-top-right",
    "pos-bottom-left",
    "pos-bottom-center",
    "pos-bottom-right"
  ];

  function iconFor(level) {
    if (level === "error") return "❌";
    if (level === "warning") return "⚠️";
    return "✅";
  }

  function groupIssues(issues) {
    var grouped = {};
    var order = [];
    for (var i = 0; i < issues.length; i++) {
      var g = issues[i].group || "Khác";
      if (!grouped[g]) {
        grouped[g] = [];
        order.push(g);
      }
      grouped[g].push(issues[i]);
    }
    return { grouped: grouped, order: order };
  }

  function renderIssueList(container, issues) {
    container.textContent = "";
    var result = groupIssues(issues || []);
    for (var i = 0; i < result.order.length; i++) {
      var g = result.order[i];
      var gl = document.createElement("div");
      gl.className = "group-label";
      gl.textContent = g;
      container.appendChild(gl);
      var list = result.grouped[g];
      for (var j = 0; j < list.length; j++) {
        var row = document.createElement("div");
        row.className = "item item-" + list[j].level;
        row.textContent = iconFor(list[j].level) + " " + list[j].text;
        container.appendChild(row);
      }
    }
  }

  function formatVitals(v) {
    var lcpText = v && v.lcp != null ? (v.lcp / 1000).toFixed(2) + "s" : "N/A";
    var clsText = v && v.cls != null ? v.cls.toFixed(3) : "N/A";
    var inpText = v && v.inp != null ? Math.round(v.inp) + "ms" : "N/A";
    return [
      "⚡ LCP: " + lcpText + " (" + (v ? v.lcpRating : "N/A") + ", Good<=2.5s)",
      "⚡ CLS: " + clsText + " (" + (v ? v.clsRating : "N/A") + ", Good<=0.10)",
      "⚡ INP: " + inpText + " (" + (v ? v.inpRating : "N/A") + ", Good<=200ms)"
    ];
  }

  function computeScoreLocal(report) {
    try {
      if (report && report.seoScore && typeof report.seoScore.score === "number") {
        return report.seoScore;
      }
      if (window.SEOBasicScore && typeof window.SEOBasicScore.compute === "function") {
        return window.SEOBasicScore.compute((report && report.issues) || []);
      }
    } catch (e) {}
    return null;
  }

  function truncate(text, max) {
    var t = String(text == null ? "" : text);
    return t.length > max ? t.slice(0, max - 1) + "…" : t;
  }

  function setHostPosition(host, panelPosition) {
    for (var i = 0; i < POSITION_CLASSES.length; i++) host.classList.remove(POSITION_CLASSES[i]);
    host.classList.add("pos-" + (panelPosition || "bottom-right"));
  }

  function getExtensionAssetUrl(path) {
    try {
      if (!(chrome && chrome.runtime && chrome.runtime.id)) return null;
      return chrome.runtime.getURL(path);
    } catch (e) {
      return null;
    }
  }

  function createPanel(options) {
    var existing = document.getElementById(HOST_ID);
    if (existing) existing.remove();

    options = options || {};

    var host = document.createElement("div");
    host.id = HOST_ID;
    var shadow = host.attachShadow({ mode: "open" });
    var styleHref = getExtensionAssetUrl("styles.css");
    if (styleHref) {
      var styleLink = document.createElement("link");
      styleLink.rel = "stylesheet";
      styleLink.href = styleHref;
      shadow.appendChild(styleLink);
    }

    var panel = document.createElement("div");
    panel.className = "panel";

    // ---------- Header ----------
    var header = document.createElement("div");
    header.className = "panel-header";

    var title = document.createElement("div");
    title.className = "panel-title";
    title.textContent = "SEO Basic PRO";

    var actions = document.createElement("div");
    actions.className = "panel-actions";

    var toggleBtn = document.createElement("button");
    toggleBtn.className = "btn";
    toggleBtn.type = "button";
    toggleBtn.addEventListener("click", function () {
      if (typeof options.onToggle === "function") options.onToggle();
    });

    var rescanBtn = document.createElement("button");
    rescanBtn.className = "btn btn-primary";
    rescanBtn.type = "button";
    rescanBtn.textContent = "↻ Re-scan";
    rescanBtn.addEventListener("click", function () {
      if (typeof options.onRescan === "function") options.onRescan();
    });

    var collapseBtn = document.createElement("button");
    collapseBtn.className = "btn";
    collapseBtn.type = "button";
    collapseBtn.title = "Thu gọn / Mở rộng";
    collapseBtn.textContent = "–";
    collapseBtn.addEventListener("click", function () {
      panel.classList.toggle("collapsed");
      collapseBtn.textContent = panel.classList.contains("collapsed") ? "+" : "–";
    });

    var exportWrap = document.createElement("details");
    exportWrap.className = "export-menu";
    var exportSummary = document.createElement("summary");
    exportSummary.className = "btn";
    exportSummary.textContent = "⬇ Export";
    var exportMenu = document.createElement("div");
    exportMenu.className = "export-menu-items";
    var formats = ["json", "txt", "csv"];
    for (var fi = 0; fi < formats.length; fi++) {
      (function (fmt) {
        var b = document.createElement("button");
        b.className = "btn";
        b.type = "button";
        b.textContent = fmt.toUpperCase();
        b.addEventListener("click", function () {
          exportWrap.removeAttribute("open");
          if (typeof options.onExport === "function") options.onExport(fmt);
        });
        exportMenu.appendChild(b);
      })(formats[fi]);
    }
    exportWrap.appendChild(exportSummary);
    exportWrap.appendChild(exportMenu);

    actions.appendChild(toggleBtn);
    actions.appendChild(rescanBtn);
    actions.appendChild(collapseBtn);
    actions.appendChild(exportWrap);

    header.appendChild(title);
    header.appendChild(actions);

    // ---------- Stats bar ----------
    var stats = document.createElement("div");
    stats.className = "stats";
    var scoreBadge = document.createElement("span");
    scoreBadge.className = "score-badge";
    scoreBadge.textContent = "Score: —";
    var countsSpan = document.createElement("span");
    countsSpan.className = "stats-counts";
    countsSpan.textContent = "";
    var wordsSpan = document.createElement("span");
    wordsSpan.className = "stats-words";
    wordsSpan.textContent = "0 từ";
    stats.appendChild(scoreBadge);
    stats.appendChild(countsSpan);
    stats.appendChild(wordsSpan);

    // ---------- Tabs ----------
    var TABS = ["score", "seo", "links", "perf"];
    var TAB_LABELS = { score: "Score", seo: "SEO", links: "Links/Images", perf: "Perf" };
    var tabsBar = document.createElement("div");
    tabsBar.className = "tabs";
    var tabButtons = {};
    var tabContents = {};
    for (var ti = 0; ti < TABS.length; ti++) {
      (function (name) {
        var b = document.createElement("button");
        b.className = "tab" + (name === "score" ? " active" : "");
        b.type = "button";
        b.textContent = TAB_LABELS[name];
        b.addEventListener("click", function () {
          for (var k in tabButtons) {
            tabButtons[k].classList.toggle("active", k === name);
            tabContents[k].classList.toggle("active", k === name);
          }
        });
        tabButtons[name] = b;
        tabsBar.appendChild(b);

        var c = document.createElement("div");
        c.className = "tab-content" + (name === "score" ? " active" : "");
        tabContents[name] = c;
      })(TABS[ti]);
    }

    var body = document.createElement("div");
    body.className = "panel-body";
    for (var ci = 0; ci < TABS.length; ci++) body.appendChild(tabContents[TABS[ci]]);

    panel.appendChild(header);
    panel.appendChild(stats);
    panel.appendChild(tabsBar);
    panel.appendChild(body);
    shadow.appendChild(panel);
    document.documentElement.appendChild(host);

    // ---------- Renderers ----------
    function renderScoreTab(report) {
      var el = tabContents.score;
      el.textContent = "";
      var sc = computeScoreLocal(report);

      var ringWrap = document.createElement("div");
      ringWrap.className = "score-ring-wrap";
      var ring = document.createElement("div");
      ring.className = "score-ring";
      var inner = document.createElement("div");
      inner.className = "score-inner";
      var grade = document.createElement("div");
      grade.className = "score-grade";
      var num = document.createElement("div");
      num.className = "score-num";
      if (sc) {
        var pct = Math.max(0, Math.min(100, sc.score));
        ring.style.background = "conic-gradient(" + sc.color + " " + pct + "%, #e2e8f0 0)";
        grade.textContent = sc.grade;
        grade.style.color = sc.color;
        num.textContent = String(sc.score) + "/100";
      } else {
        ring.style.background = "conic-gradient(#94a3b8 100%, #e2e8f0 0)";
        grade.textContent = "?";
        num.textContent = "—";
      }
      inner.appendChild(grade);
      inner.appendChild(num);
      ring.appendChild(inner);
      ringWrap.appendChild(ring);

      var legend = document.createElement("div");
      legend.className = "score-legend";
      if (sc && sc.counts) {
        legend.textContent =
          "❌ " + (sc.counts.error || 0) + "   ⚠️ " + (sc.counts.warning || 0) + "   ✅ " + (sc.counts.ok || 0);
      }

      var facts = document.createElement("div");
      facts.className = "quick-facts";
      function fact(label, value) {
        var f = document.createElement("div");
        f.className = "fact";
        var l = document.createElement("b");
        l.textContent = label;
        var v = document.createElement("span");
        v.textContent = " " + value;
        f.appendChild(l);
        f.appendChild(v);
        facts.appendChild(f);
      }
      var nav = null;
      try { nav = performance.getEntriesByType("navigation")[0]; } catch (e) {}
      var status = report && report.httpStatus != null ? report.httpStatus : (nav && nav.responseStatus) || "N/A";
      fact("HTTP:", status);
      var canon = report && report.canonicalInfo;
      fact("Canonical:", canon ? (canon.self ? "tự tham chiếu ✓" : truncate(canon.href || "?", 40)) : "N/A");
      fact("Hreflang:", report && Array.isArray(report.hreflang) ? report.hreflang.length + " thẻ" : "N/A");
      fact("Text/Code:", report && report.textToCodeRatio != null ? report.textToCodeRatio.toFixed(1) + "%" : "N/A");

      el.appendChild(ringWrap);
      el.appendChild(legend);
      el.appendChild(facts);
    }

    function renderLinksTab(report) {
      var el = tabContents.links;
      el.textContent = "";
      var ls = (report && report.linkStats) || { internal: 0, external: 0 };

      var head = document.createElement("div");
      head.className = "item item-ok";
      head.textContent = "🔗 Internal: " + (ls.internal || 0) + " | External: " + (ls.external || 0);
      el.appendChild(head);

      var links = (report && Array.isArray(report.links)) ? report.links : [];
      if (links.length) {
        var lbl = document.createElement("div");
        lbl.className = "group-label";
        lbl.textContent = "Danh sách link (" + links.length + ")";
        el.appendChild(lbl);
        var max = Math.min(links.length, 40);
        for (var i = 0; i < max; i++) {
          var L = links[i];
          var row = document.createElement("div");
          row.className = "link-row";
          var tag = document.createElement("span");
          tag.className = "h-tag";
          tag.textContent = L.internal ? "INT" : "EXT";
          var txt = document.createElement("span");
          txt.className = "link-anchor";
          txt.textContent = truncate(L.anchor || "(no anchor)", 38);
          var nf = document.createElement("span");
          if (L.nofollow) {
            nf.className = "nf-flag";
            nf.textContent = "nofollow";
          }
          var hrefEl = document.createElement("div");
          hrefEl.className = "link-href";
          hrefEl.title = L.href;
          hrefEl.textContent = truncate(L.href, 60);
          row.appendChild(tag);
          row.appendChild(txt);
          row.appendChild(nf);
          row.appendChild(hrefEl);
          el.appendChild(row);
        }
        if (links.length > max) {
          var more = document.createElement("div");
          more.className = "more-note";
          more.textContent = "+" + (links.length - max) + " link nữa…";
          el.appendChild(more);
        }
      }

      var missingAlt = (report && Array.isArray(report.imagesMissingAlt)) ? report.imagesMissingAlt : [];
      var imgLbl = document.createElement("div");
      imgLbl.className = "group-label";
      imgLbl.textContent = "Ảnh thiếu alt (" + missingAlt.length + ")";
      el.appendChild(imgLbl);
      if (!missingAlt.length) {
        var okImg = document.createElement("div");
        okImg.className = "item item-ok";
        okImg.textContent = iconFor("ok") + " Không có ảnh thiếu alt";
        el.appendChild(okImg);
      } else {
        var imax = Math.min(missingAlt.length, 25);
        for (var j = 0; j < imax; j++) {
          var ir = document.createElement("div");
          ir.className = "item item-error";
          ir.title = missingAlt[j].src || "";
          ir.textContent = iconFor("error") + " " + truncate(missingAlt[j].src || "?", 55);
          el.appendChild(ir);
        }
        if (missingAlt.length > imax) {
          var imore = document.createElement("div");
          imore.className = "more-note";
          imore.textContent = "+" + (missingAlt.length - imax) + " ảnh nữa…";
          el.appendChild(imore);
        }
      }
    }

    function renderPerfTab(report, vitals) {
      var el = tabContents.perf;
      el.textContent = "";
      var vLines = formatVitals(vitals || {});
      for (var i = 0; i < vLines.length; i++) {
        var vLine = document.createElement("div");
        vLine.className = "item item-ok";
        vLine.textContent = vLines[i];
        el.appendChild(vLine);
      }
      var tps = (report && report.thirdPartyScripts) || { total: 0, analytics: 0, ads: 0, cdn: 0, other: 0, details: [] };
      var sev = tps.total > 10 ? "error" : tps.total >= 6 ? "warning" : "ok";
      var top = document.createElement("div");
      top.className = "item item-" + sev;
      top.textContent = iconFor(sev) + " Third-party scripts: " + tps.total;
      el.appendChild(top);
      var info = document.createElement("div");
      info.className = "item item-ok";
      info.textContent = "Analytics: " + tps.analytics + " | Ads: " + tps.ads + " | CDN: " + tps.cdn + " | Other: " + tps.other;
      el.appendChild(info);
      if (tps.details && tps.details.length) {
        var details = document.createElement("details");
        details.className = "third-party-details";
        var summary = document.createElement("summary");
        summary.textContent = "Danh sách domain";
        details.appendChild(summary);
        var ul = document.createElement("ul");
        for (var j = 0; j < tps.details.length; j++) {
          var li = document.createElement("li");
          li.textContent = "[" + tps.details[j].type + "] " + tps.details[j].domain;
          ul.appendChild(li);
        }
        details.appendChild(ul);
        el.appendChild(details);
      }
    }

    function syncToggleButton() {
      var enabled = typeof options.isEnabled === "function" ? !!options.isEnabled() : true;
      toggleBtn.textContent = enabled ? "ON" : "OFF";
      toggleBtn.classList.toggle("btn-off", !enabled);
    }

    function render(report, vitals) {
      syncToggleButton();
      var issues = (report && report.issues) || [];
      var sc = computeScoreLocal(report);

      if (sc) {
        scoreBadge.textContent = "Score: " + sc.score + " (" + sc.grade + ")";
        scoreBadge.style.background = sc.color;
      } else {
        scoreBadge.textContent = "Score: —";
      }
      var errCount = 0;
      var warnCount = 0;
      var okCount = 0;
      for (var i = 0; i < issues.length; i++) {
        if (issues[i].level === "error") errCount++;
        else if (issues[i].level === "warning") warnCount++;
        else okCount++;
      }
      countsSpan.textContent = "❌ " + errCount + " · ⚠️ " + warnCount + " · ✅ " + okCount;
      wordsSpan.textContent = ((report && report.wordCount) || 0) + " từ";

      renderScoreTab(report);
      renderIssueList(tabContents.seo, issues);
      renderLinksTab(report);
      renderPerfTab(report, vitals);
    }

    return {
      render: render,
      updatePosition: function (pos) { setHostPosition(host, pos); },
      destroy: function () {
        if (host && host.parentNode) host.parentNode.removeChild(host);
      }
    };
  }

  window.SEOBasicUI = {
    createPanel: createPanel,
    renderIssueList: renderIssueList
  };
})();
