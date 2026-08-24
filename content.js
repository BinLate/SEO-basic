/**
 * SEO Basic PRO - main orchestrator.
 */
(function () {
  "use strict";

  if (window.__SEO_BASIC_CONTENT_LOADED__) return;
  window.__SEO_BASIC_CONTENT_LOADED__ = true;

  var observer = null;
  var observerTimer = null;
  var panelApi = null;
  var extensionEnabled = true;
  var lastReport = null;
  var listenersRegistered = false;

  function isExtensionContextAlive() {
    try {
      return !!(chrome && chrome.runtime && chrome.runtime.id);
    } catch (e) {
      return false;
    }
  }

  function safeSendResponse(sendResponse, payload) {
    try {
      sendResponse(payload);
    } catch (e) {}
  }

  function destroyPanel() {
    if (panelApi) {
      panelApi.destroy();
      panelApi = null;
    }
  }

  function stopRunning() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (observerTimer) {
      clearTimeout(observerTimer);
      observerTimer = null;
    }
    destroyPanel();
  }

  function loadSettings(cb) {
    if (!isExtensionContextAlive()) {
      stopRunning();
      cb(SEO_BASIC_DEFAULTS);
      return;
    }
    try {
      chrome.storage.sync.get(SEO_BASIC_DEFAULTS, function (s) {
        if (!isExtensionContextAlive()) {
          stopRunning();
          cb(SEO_BASIC_DEFAULTS);
          return;
        }
        cb(s || SEO_BASIC_DEFAULTS);
      });
    } catch (e) {
      stopRunning();
      cb(SEO_BASIC_DEFAULTS);
    }
  }

  function runAuditAndCollect(next) {
    loadSettings(function (settings) {
      if (!extensionEnabled) {
        if (window.SEOBasicAudit) window.SEOBasicAudit.clearDomHighlights();
        var disabledReport = {
          url: location.href,
          title: document.title || "",
          description: "",
          wordCount: 0,
          issues: [{ level: "warning", group: "System", text: "Extension dang OFF" }],
          linkStats: { internal: 0, external: 0 },
          keywordCheck: { inH1: false, inDescription: false },
          scriptStats: { total: 0, missingAsyncDefer: 0, largeInline: 0 },
          thirdPartyScripts: { total: 0, analytics: 0, ads: 0, cdn: 0, other: 0, details: [] }
        };
        lastReport = disabledReport;
        next(disabledReport, window.SEOBasicPerformance ? window.SEOBasicPerformance.getVitals() : {});
        return;
      }

      var report = window.SEOBasicAudit.runAudit(settings);
      report.timestamp = new Date().toISOString();
      report.webVitals = window.SEOBasicPerformance ? window.SEOBasicPerformance.getVitals() : {};
      lastReport = report;
      next(report, report.webVitals);
    });
  }

  function refreshPanel() {
    if (!panelApi) return;
    runAuditAndCollect(function (report, vitals) {
      panelApi.render(report, vitals);
    });
  }

  function csvEscape(value) {
    var s = String(value == null ? "" : value);
    if (/[",\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function buildCsvReport(data) {
    var rows = [];
    rows.push(["Field", "Value"]);
    rows.push(["URL", data.url || ""]);
    rows.push(["Title", data.title || ""]);
    rows.push(["Description", data.description || ""]);
    rows.push(["Word count", data.wordCount || 0]);
    if (data.seoScore && typeof data.seoScore.score === "number") {
      rows.push(["SEO Score", data.seoScore.score + "/100 (" + data.seoScore.grade + ")"]);
    }
    if (data.httpStatus != null) rows.push(["HTTP Status", data.httpStatus]);
    rows.push(["Canonical", data.canonicalInfo ? data.canonicalInfo.href || "(none)" : "(none)"]);
    rows.push(["Text/Code ratio (%)", data.textToCodeRatio != null ? data.textToCodeRatio : "N/A"]);
    rows.push(["Timestamp", data.timestamp || new Date().toISOString()]);
    rows.push([]);
    rows.push(["Level", "Group", "Issue"]);
    var issues = data.issues || [];
    for (var i = 0; i < issues.length; i++) {
      rows.push([issues[i].level.toUpperCase(), issues[i].group || "", issues[i].text]);
    }
    var lines = [];
    for (var r = 0; r < rows.length; r++) {
      var cells = rows[r];
      var escaped = [];
      for (var c = 0; c < cells.length; c++) escaped.push(csvEscape(cells[c]));
      lines.push(escaped.join(","));
    }
    return "\uFEFF" + lines.join("\r\n");
  }

  function exportReport(format) {
    var data = lastReport || {};
    var now = new Date();
    var stamp = now.toISOString().replace(/[:.]/g, "-");
    var content = "";
    var type = "";
    var ext = "";
    if (format === "txt") {
      content =
        "SEO Basic PRO Report\n" +
        "URL: " + (data.url || "") + "\n" +
        "Title: " + (data.title || "") + "\n" +
        "Description: " + (data.description || "") + "\n" +
        "Word count: " + (data.wordCount || 0) + "\n" +
        "\nCore Web Vitals:\n" +
        "LCP: " + (data.webVitals && data.webVitals.lcp != null ? (data.webVitals.lcp / 1000).toFixed(2) + "s" : "N/A") + " (" + (data.webVitals ? data.webVitals.lcpRating : "N/A") + ")\n" +
        "CLS: " + (data.webVitals && data.webVitals.cls != null ? data.webVitals.cls.toFixed(3) : "N/A") + " (" + (data.webVitals ? data.webVitals.clsRating : "N/A") + ")\n" +
        "INP: " + (data.webVitals && data.webVitals.inp != null ? Math.round(data.webVitals.inp) + "ms" : "N/A") + " (" + (data.webVitals ? data.webVitals.inpRating : "N/A") + ")\n" +
        "\nIssues:\n" +
        ((data.issues || []).map(function (i) { return "- [" + i.level.toUpperCase() + "] " + i.group + ": " + i.text; }).join("\n"));
      type = "text/plain;charset=utf-8";
      ext = "txt";
    } else if (format === "csv") {
      content = buildCsvReport(data);
      type = "text/csv;charset=utf-8";
      ext = "csv";
    } else {
      content = JSON.stringify(data, null, 2);
      type = "application/json;charset=utf-8";
      ext = "json";
    }
    var blob = new Blob([content], { type: type });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "seo-basic-pro-report-" + stamp + "." + ext;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function setupObserver() {
    if (observer || !document.body) return;
    observer = new MutationObserver(function () {
      if (observerTimer) clearTimeout(observerTimer);
      observerTimer = setTimeout(function () {
        loadSettings(function (settings) {
          if (settings.highlightNofollow && extensionEnabled) refreshPanel();
        });
      }, 250);
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["href", "rel", "class"]
    });
  }

  function ensurePanel(settings) {
    if (settings.displayMode !== "panel") {
      destroyPanel();
      return;
    }
    if (!window.SEOBasicUI || !window.SEOBasicUI.createPanel) return;
    if (!panelApi) {
      panelApi = window.SEOBasicUI.createPanel({
        panelPosition: settings.panelPosition,
        onRescan: function () { refreshPanel(); },
        onToggle: function () { extensionEnabled = !extensionEnabled; refreshPanel(); },
        isEnabled: function () { return extensionEnabled; },
        onExport: function (format) {
          exportReport(format === "csv" ? "csv" : format === "txt" ? "txt" : "json");
        }
      });
    } else {
      panelApi.updatePosition(settings.panelPosition);
    }
    refreshPanel();
  }

  function applyBySettings() {
    loadSettings(function (settings) {
      ensurePanel(settings);
      if (settings.displayMode !== "panel") {
        runAuditAndCollect(function () {});
      }
    });
  }

  function registerChromeListeners() {
    if (listenersRegistered || !isExtensionContextAlive()) return;
    try {
      listenersRegistered = true;

      chrome.storage.onChanged.addListener(function (changes, area) {
        if (!isExtensionContextAlive()) {
          stopRunning();
          return;
        }
        if (area !== "sync") return;
        applyBySettings();
      });

      chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        if (!isExtensionContextAlive()) {
          stopRunning();
          return false;
        }
        if (!message || !message.type) return;
        if (message.type === "SEO_BASIC_GET_AUDIT") {
          runAuditAndCollect(function (report, vitals) {
            safeSendResponse(sendResponse, {
              ok: true,
              issues: report.issues,
              wordCount: report.wordCount,
              report: report,
              webVitals: vitals
            });
          });
          return true;
        }
        if (message.type === "SEO_BASIC_EXPORT_REPORT") {
          var fmt = message.format === "csv" ? "csv" : message.format === "txt" ? "txt" : "json";
          exportReport(fmt);
          safeSendResponse(sendResponse, { ok: true });
          return true;
        }
        if (message.type === "SEO_BASIC_SET_ENABLED") {
          extensionEnabled = !!message.enabled;
          applyBySettings();
          safeSendResponse(sendResponse, { ok: true, enabled: extensionEnabled });
          return true;
        }
      });
    } catch (e) {
      listenersRegistered = false;
      stopRunning();
    }
  }

  function init() {
    if (!isExtensionContextAlive()) {
      stopRunning();
      return;
    }
    registerChromeListeners();
    setupObserver();
    applyBySettings();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
