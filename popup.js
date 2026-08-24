/**
 * SEO Basic PRO popup controller.
 * v2.1.0: tabbed layout with Overview / Issues / Headings / Links / Images / Preview,
 * SEO Score ring, quick tool launchers and JSON/TXT/CSV export.
 */
(function () {
  "use strict";

  var positionWrap = document.getElementById("position-wrap");
  var panelPosition = document.getElementById("panelPosition");
  var highlightNofollow = document.getElementById("highlightNofollow");
  var nofollowBgColor = document.getElementById("nofollowBgColor");
  var nofollowBgAlpha = document.getElementById("nofollowBgAlpha");
  var alphaLabel = document.getElementById("alphaLabel");
  var saveBtn = document.getElementById("saveBtn");
  var refreshBtn = document.getElementById("refreshBtn");
  var exportJsonBtn = document.getElementById("exportJsonBtn");
  var exportTxtBtn = document.getElementById("exportTxtBtn");
  var exportCsvBtn = document.getElementById("exportCsvBtn");
  var colorWrap = document.getElementById("color-wrap");
  var resultsBody = document.getElementById("results-body");
  var overviewBody = document.getElementById("overview-body");
  var headingsBody = document.getElementById("headings-body");
  var linksBody = document.getElementById("links-body");
  var imagesBody = document.getElementById("images-body");
  var previewBody = document.getElementById("preview-body");
  var statsLine = document.getElementById("stats-line");
  var errorMsg = document.getElementById("error-msg");
  var vitalsLine = document.getElementById("vitals-line");
  var scoreRing = document.getElementById("score-ring");
  var scoreGradeEl = document.getElementById("score-grade");
  var scoreNumEl = document.getElementById("score-num");
  var countErrorEl = document.getElementById("count-error");
  var countWarningEl = document.getElementById("count-warning");
  var countOkEl = document.getElementById("count-ok");

  var lastReport = null;

  function getDisplayModeRadios() { return document.querySelectorAll('input[name="displayMode"]'); }
  function getSelectedDisplayMode() {
    var r = document.querySelector('input[name="displayMode"]:checked');
    return r ? r.value : "popup";
  }
  function setDisplayMode(v) {
    var radios = getDisplayModeRadios();
    for (var i = 0; i < radios.length; i++) radios[i].checked = radios[i].value === v;
    updatePositionDisabled();
  }
  function updatePositionDisabled() {
    var panel = getSelectedDisplayMode() === "panel";
    panelPosition.disabled = !panel;
    positionWrap.classList.toggle("disabled", !panel);
  }
  function updateColorWrapDisabled() {
    var on = highlightNofollow.checked;
    nofollowBgColor.disabled = !on;
    nofollowBgAlpha.disabled = !on;
    colorWrap.classList.toggle("disabled", !on);
  }
  function iconFor(level) { return level === "error" ? "❌" : level === "warning" ? "⚠️" : "✅"; }

  function truncate(text, max) {
    var t = String(text == null ? "" : text);
    return t.length > max ? t.slice(0, max - 1) + "…" : t;
  }

  function loadSettingsForm() {
    chrome.storage.sync.get(SEO_BASIC_DEFAULTS, function (s) {
      setDisplayMode(s.displayMode);
      panelPosition.value = s.panelPosition || "bottom-right";
      highlightNofollow.checked = !!s.highlightNofollow;
      nofollowBgColor.value = s.nofollowBgColor || SEO_BASIC_DEFAULTS.nofollowBgColor;
      var a = parseFloat(s.nofollowBgAlpha);
      if (isNaN(a)) a = SEO_BASIC_DEFAULTS.nofollowBgAlpha;
      a = Math.max(0, Math.min(0.5, a));
      nofollowBgAlpha.value = String(a);
      alphaLabel.textContent = Math.round(a * 100) + "%";
      updateColorWrapDisabled();
    });
  }

  function saveSettings(cb) {
    var alpha = parseFloat(nofollowBgAlpha.value);
    if (isNaN(alpha)) alpha = SEO_BASIC_DEFAULTS.nofollowBgAlpha;
    alpha = Math.max(0, Math.min(0.5, alpha));
    var payload = {
      displayMode: getSelectedDisplayMode(),
      panelPosition: panelPosition.value,
      highlightNofollow: highlightNofollow.checked,
      nofollowBgColor: nofollowBgColor.value,
      nofollowBgAlpha: alpha
    };
    chrome.storage.sync.set(payload, function () { if (cb) cb(); });
  }

  function describeRestrictedPage(url) {
    if (!url) return null;
    var u = url.toLowerCase();
    if (u.indexOf("chromewebstore.google.com") !== -1 || u.indexOf("chrome.google.com/webstore") !== -1) {
      return "Chrome chặn extension chạy trên Chrome Web Store.";
    }
    if (u.indexOf("chrome://") === 0 || u.indexOf("chrome-extension://") === 0 || u.indexOf("devtools:") === 0) {
      return "Không quét được trang nội bộ trình duyệt.";
    }
    return null;
  }

  // ---------- Tab wiring ----------
  var tabButtons = document.querySelectorAll(".tabs .tab");
  for (var tb = 0; tb < tabButtons.length; tb++) {
    (function (btn) {
      btn.addEventListener("click", function () {
        var name = btn.getAttribute("data-tab");
        for (var i = 0; i < tabButtons.length; i++) tabButtons[i].classList.remove("active");
        btn.classList.add("active");
        var panes = document.querySelectorAll(".tab-pane");
        for (var j = 0; j < panes.length; j++) panes[j].classList.remove("active");
        var pane = document.getElementById("tab-" + name);
        if (pane) pane.classList.add("active");
      });
    })(tabButtons[tb]);
  }

  function computeScore(issues) {
    try {
      if (lastReport && lastReport.seoScore && typeof lastReport.seoScore.score === "number") {
        return lastReport.seoScore;
      }
      if (window.SEOBasicScore && typeof window.SEOBasicScore.compute === "function") {
        return window.SEOBasicScore.compute(issues || []);
      }
    } catch (e) {}
    return null;
  }

  // ---------- Renderers ----------
  function renderScoreHeader(report) {
    var issues = (report && report.issues) || [];
    var sc = computeScore(issues);
    var err = 0, warn = 0, ok = 0;
    for (var i = 0; i < issues.length; i++) {
      if (issues[i].level === "error") err++;
      else if (issues[i].level === "warning") warn++;
      else ok++;
    }
    countErrorEl.textContent = String(err);
    countWarningEl.textContent = String(warn);
    countOkEl.textContent = String(ok);
    if (sc) {
      scoreGradeEl.textContent = sc.grade;
      scoreNumEl.textContent = sc.score + "/100";
      scoreRing.style.setProperty("--ring-color", sc.color);
      scoreRing.style.setProperty("--pct", String(sc.score));
      scoreGradeEl.style.color = sc.color;
    } else {
      scoreGradeEl.textContent = "?";
      scoreNumEl.textContent = "—";
    }
  }

  function renderOverview(report) {
    overviewBody.textContent = "";
    if (!report) return;

    function card(label, value, cls) {
      var c = document.createElement("div");
      c.className = "fact-card";
      var l = document.createElement("span");
      l.className = "fact-label";
      l.textContent = label;
      var v = document.createElement("span");
      v.className = "fact-value" + (cls ? " " + cls : "");
      v.textContent = value;
      c.appendChild(l);
      c.appendChild(v);
      overviewBody.appendChild(c);
    }

    var grid = document.createElement("div");
    grid.className = "facts-grid";
    overviewBody.appendChild(grid);

    function addFact(label, value, cls) {
      var c = document.createElement("div");
      c.className = "fact-card";
      var l = document.createElement("span");
      l.className = "fact-label";
      l.textContent = label;
      var v = document.createElement("span");
      v.className = "fact-value" + (cls ? " " + cls : "");
      v.textContent = value;
      c.appendChild(l);
      c.appendChild(v);
      grid.appendChild(c);
    }

    var status = report.httpStatus != null ? String(report.httpStatus) : "N/A";
    addFact("HTTP Status", status, status === "N/A" ? "" : status >= 400 ? "bad" : status >= 300 ? "warn" : "good");

    var canon = report.canonicalInfo;
    addFact(
      "Canonical",
      canon ? (canon.self ? "Tự tham chiếu ✓" : truncate(canon.href || "?", 30)) : "Thiếu ✗",
      canon && canon.self ? "good" : "warn"
    );

    var hls = report.hreflangSummary;
    addFact("Hreflang", hls && hls.total ? hls.total + " thẻ" + (hls.hasXDefault ? "" : " · thiếu x-default") : "Không dùng",
      hls && hls.total && hls.badSyntax > 0 ? "warn" : "");

    var ratio = report.textToCodeRatio;
    addFact("Text / Code", ratio != null ? ratio.toFixed(1) + "%" : "N/A", ratio != null && ratio < 10 ? "warn" : "good");

    addFact("Favicon", report.favicon && report.favicon.present ? "Có ✓" : "Thiếu ✗",
      report.favicon && report.favicon.present ? "good" : "warn");

    var ls = report.linkStats || {};
    addFact("Links", "Nội bộ: " + (ls.internal || 0) + " · Ngoài: " + (ls.external || 0));

    var schemaTypes = report.schemaTypes || [];
    addFact("Schema", schemaTypes.length ? schemaTypes.slice(0, 3).join(", ") : "Không có JSON-LD",
      schemaTypes.length ? "good" : "warn");

    var tps = report.thirdPartyScripts;
    addFact("3rd-party JS", tps ? String(tps.total) : "N/A",
      tps ? (tps.total > 10 ? "bad" : tps.total >= 6 ? "warn" : "good") : "");
  }

  function renderResults(data) {
    resultsBody.textContent = "";
    var issues = data && data.report ? data.report.issues : data.issues;
    if (!issues) return;
    var grouped = {};
    var order = [];
    for (var i = 0; i < issues.length; i++) {
      var g = issues[i].group || "Khác";
      if (!grouped[g]) { grouped[g] = []; order.push(g); }
      grouped[g].push(issues[i]);
    }
    for (i = 0; i < order.length; i++) {
      var label = document.createElement("div");
      label.className = "group-label";
      label.textContent = order[i];
      resultsBody.appendChild(label);
      var list = grouped[order[i]];
      for (var j = 0; j < list.length; j++) {
        var row = document.createElement("div");
        row.className = "item item-" + list[j].level;
        row.textContent = iconFor(list[j].level) + " " + list[j].text;
        resultsBody.appendChild(row);
      }
    }

    var reportData = data && data.report ? data.report : data;
    if (reportData.schemaTypes && reportData.schemaTypes.length > 0) {
      var schemaLabel = document.createElement("div");
      schemaLabel.className = "group-label";
      schemaLabel.textContent = "Schema Markup";
      resultsBody.appendChild(schemaLabel);
      var schemaRow = document.createElement("div");
      schemaRow.className = "item item-ok";
      schemaRow.textContent = "✅ " + reportData.schemaTypes.join(", ");
      resultsBody.appendChild(schemaRow);
    }
  }

  function renderHeadings(report) {
    headingsBody.textContent = "";
    var tree = (report && report.headingTree) || [];
    if (!tree.length) {
      var empty = document.createElement("div");
      empty.className = "item item-warning";
      empty.textContent = "⚠️ Không tìm thấy heading nào";
      headingsBody.appendChild(empty);
      return;
    }
    for (var i = 0; i < tree.length; i++) {
      var row = document.createElement("div");
      row.className = "heading-item";
      var lvl = parseInt(String(tree[i].tagName).substring(1), 10) || 1;
      row.style.paddingLeft = (lvl - 1) * 14 + "px";
      var tag = document.createElement("span");
      tag.className = "h-tag";
      tag.textContent = tree[i].tagName;
      var txt = document.createElement("span");
      txt.className = "heading-text";
      txt.title = tree[i].text;
      txt.textContent = tree[i].text || "(trống)";
      row.appendChild(tag);
      row.appendChild(txt);
      headingsBody.appendChild(row);
    }
  }

  function renderLinks(report) {
    linksBody.textContent = "";
    var ls = (report && report.linkStats) || { internal: 0, external: 0 };
    var head = document.createElement("div");
    head.className = "item item-ok";
    head.textContent = "🔗 Internal: " + (ls.internal || 0) + " | External: " + (ls.external || 0);
    linksBody.appendChild(head);

    var links = (report && Array.isArray(report.links)) ? report.links : [];
    if (!links.length) {
      var note = document.createElement("div");
      note.className = "preview-note";
      note.textContent = "Chưa có dữ liệu chi tiết link (quét lại trang để cập nhật).";
      linksBody.appendChild(note);
      return;
    }
    var lbl = document.createElement("div");
    lbl.className = "group-label";
    lbl.textContent = "Danh sách link (" + links.length + ")";
    linksBody.appendChild(lbl);

    var max = Math.min(links.length, 40);
    for (var i = 0; i < max; i++) {
      var L = links[i];
      var row = document.createElement("div");
      row.className = "link-row";
      var tag = document.createElement("span");
      tag.className = "h-tag";
      tag.textContent = L.internal ? "INT" : "EXT";
      var anchor = document.createElement("span");
      anchor.className = "link-anchor";
      anchor.textContent = L.anchor || "(no anchor)";
      var nf = document.createElement("span");
      if (L.nofollow) {
        nf.className = "nf-flag";
        nf.textContent = "nofollow";
      }
      var hrefEl = document.createElement("div");
      hrefEl.className = "link-href";
      hrefEl.title = L.href;
      hrefEl.textContent = L.href;
      row.appendChild(tag);
      row.appendChild(anchor);
      row.appendChild(nf);
      row.appendChild(hrefEl);
      linksBody.appendChild(row);
    }
    if (links.length > max) {
      var more = document.createElement("div");
      more.className = "preview-note";
      more.textContent = "+" + (links.length - max) + " link nữa… (xem đầy đủ trong Export CSV)";
      linksBody.appendChild(more);
    }
  }

  function renderImages(report) {
    imagesBody.textContent = "";
    var missing = (report && Array.isArray(report.imagesMissingAlt)) ? report.imagesMissingAlt : [];
    var total = (report && report.wordCount != null) ? null : null;
    var lbl = document.createElement("div");
    lbl.className = "group-label";
    lbl.textContent = "Ảnh thiếu alt (" + missing.length + ")";
    imagesBody.appendChild(lbl);
    if (!missing.length) {
      var okRow = document.createElement("div");
      okRow.className = "item item-ok";
      okRow.textContent = "✅ Tất cả ảnh đều có alt";
      imagesBody.appendChild(okRow);
      return;
    }
    void total;
    var imax = Math.min(missing.length, 25);
    for (var i = 0; i < imax; i++) {
      var r = document.createElement("div");
      r.className = "img-src-row";
      r.title = missing[i].src || "";
      r.textContent = missing[i].src || "(no src)";
      imagesBody.appendChild(r);
    }
    if (missing.length > imax) {
      var more = document.createElement("div");
      more.className = "preview-note";
      more.textContent = "+" + (missing.length - imax) + " ảnh nữa…";
      imagesBody.appendChild(more);
    }
  }

  function renderPreview(report) {
    previewBody.textContent = "";
    if (!report) return;

    var serpLbl = document.createElement("div");
    serpLbl.className = "group-label";
    serpLbl.textContent = "Google SERP Preview";
    previewBody.appendChild(serpLbl);

    var serp = document.createElement("div");
    serp.className = "serp-preview";
    var urlEl = document.createElement("div");
    urlEl.className = "serp-url";
    try {
      var u = new URL(report.url || location.href);
      urlEl.textContent = u.hostname + " › " + u.pathname.replace(/^\//, "").replace(/\/$/, "");
    } catch (e) {
      urlEl.textContent = report.url || "";
    }
    var titleEl = document.createElement("div");
    titleEl.className = "serp-title";
    titleEl.textContent = report.title || "(Không có tiêu đề)";
    titleEl.title = report.title || "";
    var descEl = document.createElement("div");
    descEl.className = "serp-desc";
    var desc = report.description || "(Không có meta description)";
    descEl.textContent = truncate(desc, 165);
    serp.appendChild(urlEl);
    serp.appendChild(titleEl);
    serp.appendChild(descEl);
    previewBody.appendChild(serp);

    var socialLbl = document.createElement("div");
    socialLbl.className = "group-label";
    socialLbl.textContent = "Social Card Preview (Open Graph)";
    previewBody.appendChild(socialLbl);

    var st = report.socialTags || {};
    var card = document.createElement("div");
    card.className = "social-preview-card";
    var img = document.createElement("div");
    img.className = "social-img";
    if (st.ogImage) img.style.backgroundImage = 'url("' + st.ogImage.replace(/"/g, "%22") + '")';
    var info = document.createElement("div");
    info.className = "social-info";
    var domain = document.createElement("div");
    domain.className = "social-domain";
    try { domain.textContent = new URL(report.url || location.href).hostname; } catch (e2) { domain.textContent = ""; }
    var sTitle = document.createElement("div");
    sTitle.className = "social-title";
    sTitle.textContent = st.ogTitle || report.title || "(Thiếu og:title)";
    var sDesc = document.createElement("div");
    sDesc.className = "social-desc";
    sDesc.textContent = st.ogDescription || report.description || "(Thiếu og:description)";
    info.appendChild(domain);
    info.appendChild(sTitle);
    info.appendChild(sDesc);
    card.appendChild(img);
    card.appendChild(info);
    previewBody.appendChild(card);

    if (!st.ogImage) {
      var note = document.createElement("div");
      note.className = "preview-note";
      note.textContent = "⚠️ Thiếu og:image — social card sẽ không có ảnh khi share.";
      previewBody.appendChild(note);
    }
  }

  function request(tabId, payload, cb) {
    chrome.tabs.sendMessage(tabId, payload, function (res) {
      cb(res, chrome.runtime.lastError);
    });
  }

  function injectAndRetry(tabId, cb) {
    chrome.scripting.executeScript(
      { target: { tabId: tabId }, files: ["defaults.js", "score.js", "audit.js", "performance.js", "ui.js", "content.js"] },
      function () { cb(chrome.runtime.lastError || null); }
    );
  }

  function fetchAudit() {
    errorMsg.hidden = true;
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0] || !tabs[0].id) return showError("Không tìm thấy tab.");
      var tab = tabs[0];
      var restricted = describeRestrictedPage(tab.url);
      if (restricted) {
        showError(restricted);
        statsLine.textContent = "Số từ: —";
        vitalsLine.textContent = "Vitals: —";
        resultsBody.textContent = "";
        return;
      }
      request(tab.id, { type: "SEO_BASIC_GET_AUDIT" }, function (res, err) {
        if (err || !res || !res.ok) {
          injectAndRetry(tab.id, function (injectErr) {
            if (injectErr) return showError("Content script không chạy trên tab này.");
            request(tab.id, { type: "SEO_BASIC_GET_AUDIT" }, function (res2, err2) {
              if (err2 || !res2 || !res2.ok) return showError("Không quét được trang hiện tại.");
              paintResult(res2);
            });
          });
          return;
        }
        paintResult(res);
      });
    });
  }

  function paintResult(res) {
    var report = res.report || {};
    lastReport = report;
    statsLine.textContent = "Số từ (body): " + (report.wordCount != null ? report.wordCount : (res.wordCount != null ? res.wordCount : "—"));
    var vitals = res.webVitals || report.webVitals || {};
    var lcp = vitals.lcp != null ? (vitals.lcp / 1000).toFixed(2) + "s" : "N/A";
    var cls = vitals.cls != null ? vitals.cls.toFixed(3) : "N/A";
    var inp = vitals.inp != null ? Math.round(vitals.inp) + "ms" : "N/A";
    vitalsLine.textContent =
      "Vitals — LCP: " + lcp + " | CLS: " + cls + " | INP: " + inp;
    renderScoreHeader(report);
    renderOverview(report);
    renderResults(res);
    renderHeadings(report);
    renderLinks(report);
    renderImages(report);
    renderPreview(report);
  }

  function showError(text) {
    errorMsg.textContent = text;
    errorMsg.hidden = false;
  }

  function exportReport(format) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0] || !tabs[0].id) return showError("Không tìm thấy tab.");
      request(tabs[0].id, { type: "SEO_BASIC_EXPORT_REPORT", format: format }, function (res, err) {
        if (err || !res || !res.ok) showError("Export thất bại. Quét lại trước khi export.");
      });
    });
  }

  function openToolTab(urlTemplate) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var pageUrl = tabs[0] && tabs[0].url ? encodeURIComponent(tabs[0].url) : "";
      if (!pageUrl) return showError("Không xác định được URL trang hiện tại.");
      chrome.tabs.create({ url: urlTemplate.replace("{url}", pageUrl) });
      window.close();
    });
  }

  getDisplayModeRadios().forEach(function (r) { r.addEventListener("change", updatePositionDisabled); });
  nofollowBgAlpha.addEventListener("input", function () { alphaLabel.textContent = Math.round(parseFloat(nofollowBgAlpha.value) * 100) + "%"; });
  highlightNofollow.addEventListener("change", updateColorWrapDisabled);
  saveBtn.addEventListener("click", function () { saveSettings(fetchAudit); });
  refreshBtn.addEventListener("click", function () { saveSettings(fetchAudit); });
  exportJsonBtn.addEventListener("click", function () { exportReport("json"); });
  exportTxtBtn.addEventListener("click", function () { exportReport("txt"); });
  exportCsvBtn.addEventListener("click", function () { exportReport("csv"); });

  document.getElementById("toolGscBtn").addEventListener("click", function () {
    openToolTab("https://search.google.com/search-console?resource_id={url}");
  });
  document.getElementById("toolPsiBtn").addEventListener("click", function () {
    openToolTab("https://pagespeed.web.dev/analysis?url={url}");
  });
  document.getElementById("toolRichBtn").addEventListener("click", function () {
    openToolTab("https://search.google.com/test/rich-results?url={url}");
  });
  document.getElementById("toolWaybackBtn").addEventListener("click", function () {
    openToolTab("https://web.archive.org/web/*/{url}");
  });

  loadSettingsForm();
  fetchAudit();
})();
