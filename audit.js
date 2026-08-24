/**
 * SEO Basic PRO - Audit module.
 * Exposes window.SEOBasicAudit for content/popup orchestration.
 */
(function () {
  "use strict";

  var NOFOLLOW_STYLE_ID = "seo-basic-nofollow-style";
  var NOFOLLOW_CLASS = "seo-basic-nofollow";
  var DOM_HL_STYLE_ID = "seo-basic-dom-highlight-style";
  var DOM_HL_ERROR = "seo-basic-dom-error";

  function parseRel(rel) {
    if (!rel || typeof rel !== "string") return [];
    return rel.toLowerCase().split(/\s+/).filter(Boolean);
  }

  function hasNofollow(anchor) {
    return parseRel(anchor.getAttribute("rel")).indexOf("nofollow") !== -1;
  }

  function containsToken(text, tokens) {
    if (!text) return false;
    var lower = String(text).toLowerCase();
    for (var i = 0; i < tokens.length; i++) {
      if (lower.indexOf(tokens[i]) !== -1) return true;
    }
    return false;
  }

  function isLikelySocialShareLink(anchor) {
    var tokens = [
      "share",
      "social",
      "facebook",
      "twitter",
      "telegram",
      "zalo",
      "linkedin",
      "pinterest",
      "whatsapp",
      "reddit",
      "email",
      "mailto"
    ];
    var attrs = [
      anchor.className || "",
      anchor.id || "",
      anchor.getAttribute("aria-label") || "",
      anchor.getAttribute("title") || "",
      anchor.getAttribute("data-network") || "",
      anchor.getAttribute("data-platform") || "",
      anchor.textContent || ""
    ].join(" ");
    if (containsToken(attrs, tokens)) return true;

    var href = (anchor.getAttribute("href") || "").toLowerCase();
    if (!href) return false;
    if (href.indexOf("mailto:") === 0) return true;

    var shareUrlTokens = [
      "facebook.com/sharer",
      "twitter.com/intent",
      "t.me/share",
      "telegram.me/share",
      "linkedin.com/share",
      "pinterest.com/pin/create",
      "wa.me/?text=",
      "api.whatsapp.com/send",
      "addtoany.com/add_to",
      "share?"
    ];
    return containsToken(href, shareUrlTokens);
  }

  function isHttpUrl(href) {
    try {
      var u = new URL(href, window.location.href);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch (e) {
      return false;
    }
  }

  function getHostname(href) {
    try {
      return new URL(href, window.location.href).hostname;
    } catch (e) {
      return "";
    }
  }

  function countWords(text) {
    if (!text || !String(text).trim()) return 0;
    return String(text).trim().split(/\s+/).filter(Boolean).length;
  }

  function getCleanWordCount() {
    if (!document.body) return 0;
    var clone = document.body.cloneNode(true);
    var removeTags = clone.querySelectorAll("script, style, noscript, svg");
    for (var i = 0; i < removeTags.length; i++) {
      removeTags[i].parentNode.removeChild(removeTags[i]);
    }
    return countWords(clone.textContent || "");
  }

  function getMetaProperty(prop) {
    var el = document.querySelector('meta[property="' + prop.replace(/"/g, '\\"') + '"]');
    if (!el) return null;
    return el.getAttribute("content") || "";
  }

  function hasUtf8Charset() {
    var m = document.querySelector("meta[charset]");
    if (m && (m.getAttribute("charset") || "").toLowerCase() === "utf-8") return true;
    var equiv = document.querySelector('meta[http-equiv="Content-Type"], meta[http-equiv="content-type"]');
    if (!equiv) return false;
    return ((equiv.getAttribute("content") || "").toLowerCase().indexOf("charset=utf-8") !== -1);
  }

  function getCanonicalLinks() {
    var all = document.querySelectorAll("link[rel]");
    var out = [];
    for (var i = 0; i < all.length; i++) {
      var rel = (all[i].getAttribute("rel") || "").toLowerCase().split(/\s+/);
      if (rel.indexOf("canonical") !== -1) out.push(all[i]);
    }
    return out;
  }

  function getHttpStatus() {
    try {
      if (window.performance && typeof performance.getEntriesByType === "function") {
        var nav = performance.getEntriesByType("navigation");
        if (nav && nav.length && nav[0].responseStatus) return nav[0].responseStatus;
      }
    } catch (e) {}
    return null;
  }

  function normalizeUrlForCompare(u) {
    try {
      var x = new URL(u, location.href);
      x.hash = "";
      var s = x.href;
      if (s.length > 1 && s.charAt(s.length - 1) === "/") s = s.slice(0, -1);
      return s.toLowerCase();
    } catch (e) {
      return String(u || "").toLowerCase();
    }
  }

  function auditCanonical() {
    var canon = getCanonicalLinks();
    var href = "";
    if (canon.length) {
      try { href = canon[0].href || ""; } catch (e) { href = canon[0].getAttribute("href") || ""; }
    }
    return {
      count: canon.length,
      href: href,
      self: canon.length > 0 && normalizeUrlForCompare(href) === normalizeUrlForCompare(location.href)
    };
  }

  function auditHreflang() {
    var els = document.querySelectorAll("link[hreflang]");
    var items = [];
    var langCodeRe = /^[a-z]{2,3}(-[a-z]{2,4}){0,2}$/;
    for (var i = 0; i < els.length; i++) {
      var relTokens = (els[i].getAttribute("rel") || "").toLowerCase().split(/\s+/);
      if (relTokens.indexOf("alternate") === -1) continue;
      var hrefAttr = "";
      try { hrefAttr = els[i].href || els[i].getAttribute("href") || ""; } catch (e2) {}
      items.push({ lang: (els[i].getAttribute("hreflang") || "").trim(), href: hrefAttr });
    }
    var badSyntax = 0;
    var hasXDefault = false;
    for (var j = 0; j < items.length; j++) {
      var l = items[j].lang.toLowerCase();
      if (l === "x-default") hasXDefault = true;
      else if (!langCodeRe.test(l)) badSyntax += 1;
    }
    return { total: items.length, items: items, hasXDefault: hasXDefault, badSyntax: badSyntax };
  }

  function getTextToCodeRatio() {
    try {
      if (!document.body || !document.documentElement) return null;
      var htmlLen = document.documentElement.outerHTML.length;
      if (!htmlLen) return null;
      var clone = document.body.cloneNode(true);
      var removeTags = clone.querySelectorAll("script, style, noscript, svg, template");
      for (var i = 0; i < removeTags.length; i++) removeTags[i].parentNode.removeChild(removeTags[i]);
      var textLen = (clone.textContent || "").replace(/\s+/g, " ").trim().length;
      return Math.max(0, Math.min(100, Math.round((textLen / htmlLen) * 1000) / 10));
    } catch (e) {
      return null;
    }
  }

  function getFaviconInfo() {
    var links = document.querySelectorAll("link[rel]");
    for (var i = 0; i < links.length; i++) {
      var relIcon = (links[i].getAttribute("rel") || "").toLowerCase();
      if (relIcon.indexOf("icon") !== -1) {
        var iconHref = "";
        try { iconHref = links[i].href || links[i].getAttribute("href") || ""; } catch (e3) {}
        return { present: true, href: iconHref };
      }
    }
    return { present: false, href: "" };
  }

  function ensureHighlightStyles(settings) {
    var style = document.getElementById(DOM_HL_STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = DOM_HL_STYLE_ID;
      (document.head || document.documentElement).appendChild(style);
    }
    var bg = "transparent";
    if (settings && settings.highlightNofollow) {
      var color = settings.nofollowBgColor || "#ff5050";
      var alpha = parseFloat(settings.nofollowBgAlpha);
      if (isNaN(alpha)) alpha = 0.12;
      alpha = Math.max(0, Math.min(0.5, alpha));
      bg = alpha <= 0 ? "transparent" : hexToRgba(color, alpha);
    }
    style.textContent =
      "." + DOM_HL_ERROR + "{outline:2px solid #dc2626 !important;outline-offset:2px !important;}" +
      "." + NOFOLLOW_CLASS + "{text-decoration:line-through !important;background-color:" + bg + " !important;}";
  }

  function hexToRgba(hex, alpha) {
    var h = String(hex || "").replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (h.length !== 6) return "rgba(255,80,80,0.12)";
    var r = parseInt(h.slice(0, 2), 16);
    var g = parseInt(h.slice(2, 4), 16);
    var b = parseInt(h.slice(4, 6), 16);
    return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
  }

  function clearDomHighlights() {
    var targets = document.querySelectorAll(
      "." + DOM_HL_ERROR + ",." + NOFOLLOW_CLASS + ",[data-seo-nofollow],[data-seo-hl]"
    );
    for (var i = 0; i < targets.length; i++) {
      targets[i].classList.remove(DOM_HL_ERROR, NOFOLLOW_CLASS);
      targets[i].removeAttribute("data-seo-hl");
      targets[i].removeAttribute("data-seo-nofollow");
      targets[i].removeAttribute("title");
    }
  }

  function markTarget(el, type) {
    if (!el) return;
    if (type === "error") el.classList.add(DOM_HL_ERROR);
    el.setAttribute("data-seo-hl", type);
  }

  function classifyScript(urlString) {
    var host = "";
    try {
      host = new URL(urlString, location.href).hostname.toLowerCase();
    } catch (e) {
      return "other";
    }
    var analytics = ["google-analytics.com", "googletagmanager.com", "plausible.io", "mixpanel.com"];
    var ads = ["doubleclick.net", "googlesyndication.com", "facebook.net", "tiktok.com"];
    var cdn = ["cdn.jsdelivr.net", "cdnjs.cloudflare.com", "unpkg.com", "ajax.googleapis.com"];
    var i;
    for (i = 0; i < analytics.length; i++) if (host.indexOf(analytics[i]) !== -1) return "analytics";
    if (host.indexOf("gtag") !== -1) return "analytics";
    for (i = 0; i < ads.length; i++) if (host.indexOf(ads[i]) !== -1) return "ads";
    if (host.indexOf("ads.") === 0 || host.indexOf(".ads.") !== -1) return "ads";
    for (i = 0; i < cdn.length; i++) if (host.indexOf(cdn[i]) !== -1) return "cdn";
    return "other";
  }

  function detectThirdPartyScripts() {
    var scripts = document.querySelectorAll("script[src]");
    var current = location.hostname.toLowerCase();
    var out = { total: 0, analytics: 0, ads: 0, cdn: 0, other: 0, details: [] };
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src;
      if (!src) continue;
      var url;
      try {
        url = new URL(src, location.href);
      } catch (e) {
        continue;
      }
      if (url.hostname.toLowerCase() === current) continue;
      var kind = classifyScript(url.href);
      out.total += 1;
      out[kind] += 1;
      out.details.push({ src: url.href, domain: url.hostname, type: kind });
    }
    return out;
  }

  function runAudit(settings) {
    settings = settings || {};
    ensureHighlightStyles(settings);
    clearDomHighlights();

    var issues = [];
    function add(level, group, text) {
      issues.push({ level: level, group: group, text: text });
    }

    var h1 = document.querySelectorAll("h1");
    if (h1.length === 0) {
      add("error", "Heading & nội dung", "Không có thẻ <h1>");
    } else if (h1.length > 1) {
      add("warning", "Heading & nội dung", "Có nhiều hơn 1 thẻ <h1> (" + h1.length + ")");
      for (var i = 0; i < h1.length; i++) markTarget(h1[i], "error");
    } else {
      add("ok", "Heading & nội dung", "Chỉ có một <h1>");
    }

    if (document.querySelectorAll("h2").length === 0) add("warning", "Heading & nội dung", "Không có <h2>");
    else add("ok", "Heading & nội dung", "Có <h2>");

    var headings = document.querySelectorAll("h1,h2,h3,h4,h5,h6");
    var prev = 0;
    var orderBad = 0;
    for (i = 0; i < headings.length; i++) {
      var lvl = parseInt(headings[i].tagName.substring(1), 10);
      if (prev > 0 && lvl > prev + 1) {
        orderBad++;
      }
      prev = lvl;
    }
    if (orderBad > 0) add("warning", "Heading & nội dung", "Sai thứ tự heading (" + orderBad + " vị trí)");
    else if (headings.length > 0) add("ok", "Heading & nội dung", "Thứ tự heading hợp lý");

    if (document.querySelectorAll("h3,h4,h5,h6").length === 0) add("warning", "Heading & nội dung", "Không có heading nhỏ hơn (H3 trở xuống)");
    else add("ok", "Heading & nội dung", "Có heading H3-H6");

    var headingTree = [];
    for (i = 0; i < headings.length; i++) {
      headingTree.push({
        tagName: headings[i].tagName,
        text: (headings[i].textContent || "").trim()
      });
    }

    // Lấy nội dung text sạch (đã bỏ script, style...)
    var wordCount = getCleanWordCount();
    if (wordCount < 300) add("warning", "Heading & nội dung", "Nội dung quá ngắn (<300 từ, hiện " + wordCount + ")");
    else add("ok", "Heading & nội dung", "Độ dài nội dung đủ (" + wordCount + ")");

    var titleText = (document.title || "").trim();
    if (!titleText) add("error", "Meta & head", "Không có <title>");
    else if (titleText.length < 30) add("warning", "Meta & head", "Title quá ngắn (" + titleText.length + ")");
    else if (titleText.length > 65) add("warning", "Meta & head", "Title quá dài (" + titleText.length + ")");
    else add("ok", "Meta & head", "Title OK");

    var descEl = document.querySelector('meta[name="description"]');
    var description = descEl ? (descEl.getAttribute("content") || "") : "";
    if (!descEl) add("error", "Meta & head", 'Không có <meta name="description">');
    else if (description.length < 120) add("warning", "Meta & head", "Description quá ngắn (" + description.length + ")");
    else if (description.length > 160) add("warning", "Meta & head", "Description quá dài (" + description.length + ")");
    else add("ok", "Meta & head", "Meta description OK");

    var canon = getCanonicalLinks();
    if (canon.length === 0) add("error", "Meta & head", "Không có canonical");
    else if (canon.length > 1) add("warning", "Meta & head", "Có nhiều canonical (" + canon.length + ")");
    else add("ok", "Meta & head", "Canonical OK");

    if (!hasUtf8Charset()) add("error", "Meta & head", "Thiếu charset UTF-8");
    else add("ok", "Meta & head", "Charset UTF-8 OK");
    if (!document.querySelector('meta[name="viewport"]')) add("error", "Meta & head", "Thiếu meta viewport");
    else add("ok", "Meta & head", "Meta viewport OK");

    var anchors = document.querySelectorAll("a[href]");
    var host = location.hostname;
    var internal = 0;
    var external = 0;
    var externalDoFollow = 0;
    var linksDetail = [];
    for (i = 0; i < anchors.length; i++) {
      var a = anchors[i];
      if (!isHttpUrl(a.href)) continue;
      var h = getHostname(a.href);
      if (!h) continue;
      var isInternal = h === host;
      if (isInternal) internal += 1;
      else {
        external += 1;
        if (!hasNofollow(a)) externalDoFollow += 1;
      }
      linksDetail.push({
        href: a.href,
        anchor: (a.textContent || "").replace(/\s+/g, " ").trim(),
        rel: a.getAttribute("rel") || "",
        internal: isInternal,
        nofollow: hasNofollow(a)
      });
      if (isLikelySocialShareLink(a)) {
        a.classList.remove(NOFOLLOW_CLASS);
        a.removeAttribute("data-seo-nofollow");
        a.removeAttribute("title");
        continue;
      }
      if (settings.highlightNofollow && hasNofollow(a)) {
        a.classList.add(NOFOLLOW_CLASS);
        a.setAttribute("data-seo-nofollow", "1");
      }
    }
    if (!settings.highlightNofollow) {
      for (i = 0; i < anchors.length; i++) anchors[i].classList.remove(NOFOLLOW_CLASS);
    }
    if (internal === 0) add("warning", "Link", "Không có internal link");
    else add("ok", "Link", "Có internal link (" + internal + ")");
    if (external === 0) add("warning", "Link", "Không có external link");
    else add("ok", "Link", "Có external link (" + external + ")");
    if (externalDoFollow > 0) add("warning", "Link", externalDoFollow + " external link không có nofollow");

    var imgs = document.querySelectorAll("img");
    var missingAlt = 0;
    var shortAlt = 0;
    var emptyAlt = 0;
    var imagesMissingAlt = [];
    for (i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      if (!img.hasAttribute("alt")) {
        missingAlt += 1;
        imagesMissingAlt.push({ src: img.currentSrc || img.src || "", alt: "" });
      } else if (img.getAttribute("alt").trim() === "") {
        emptyAlt += 1;
      } else if (img.getAttribute("alt").trim().length > 0 && img.getAttribute("alt").trim().length < 3) {
        shortAlt += 1;
      }
    }
    if (missingAlt > 0) add("error", "Hình ảnh", missingAlt + " ảnh thiếu thẻ alt");
    else add("ok", "Hình ảnh", "Không có ảnh thiếu thẻ alt");
    if (emptyAlt > 0) add("ok", "Hình ảnh", emptyAlt + " ảnh có alt rỗng (ảnh trang trí)");
    if (shortAlt > 0) add("warning", "Hình ảnh", shortAlt + " ảnh có alt quá ngắn (< 3 ký tự)");

    var imgsNoLazy = 0;
    for (i = 0; i < imgs.length; i++) if ((imgs[i].getAttribute("loading") || "").toLowerCase() !== "lazy") imgsNoLazy += 1;
    if (imgs.length && imgsNoLazy > 0) add("warning", "Hiệu năng", imgsNoLazy + " ảnh chưa dùng lazy");
    else if (imgs.length) add("ok", "Hiệu năng", "Ảnh đã dùng lazy");

    var scriptEls = document.querySelectorAll("script");
    var scriptSrc = document.querySelectorAll("script[src]");
    var missingAsyncDefer = 0;
    var largeInline = 0;
    for (i = 0; i < scriptEls.length; i++) {
      var s = scriptEls[i];
      if (s.src) {
        if (!s.async && !s.defer && s.type !== "module") missingAsyncDefer += 1;
      } else if ((s.textContent || "").trim().length > 500) {
        largeInline += 1;
      }
    }
    if (missingAsyncDefer > 0) add("warning", "Script", missingAsyncDefer + " scripts thiếu async/defer");
    else if (scriptSrc.length > 0) add("ok", "Script", "Script ngoài có async/defer");
    if (largeInline > 0) add("warning", "Script", largeInline + " inline script > 500 ký tự");
    if (scriptEls.length > 20) add("warning", "Script", "Too many scripts (" + scriptEls.length + ")");

    if (!getMetaProperty("og:title")) add("warning", "Social", "Thiếu og:title"); else add("ok", "Social", "Có og:title");
    if (!getMetaProperty("og:description")) add("warning", "Social", "Thiếu og:description"); else add("ok", "Social", "Có og:description");
    if (!getMetaProperty("og:image")) add("warning", "Social", "Thiếu og:image"); else add("ok", "Social", "Có og:image");
    if (!document.querySelector('meta[name="twitter:card"]')) add("warning", "Social", "Thiếu twitter:card"); else add("ok", "Social", "Có twitter:card");

    var robots = document.querySelectorAll('meta[name="robots"]');
    var hasNoindex = false;
    for (i = 0; i < robots.length; i++) if ((robots[i].getAttribute("content") || "").toLowerCase().indexOf("noindex") !== -1) hasNoindex = true;
    if (hasNoindex) add("warning", "Robots / index", "Có robots noindex");
    else add("ok", "Robots / index", "Không phát hiện noindex");

    var schemas = document.querySelectorAll('script[type="application/ld+json"]');
    var schemaTypes = [];
    if (schemas.length === 0) {
      add("warning", "Structured data", "Không có JSON-LD");
    } else {
      add("ok", "Structured data", "Có JSON-LD (" + schemas.length + " tags)");
      for (i = 0; i < schemas.length; i++) {
        try {
          var parsed = JSON.parse(schemas[i].textContent);
          if (parsed) {
            if (Array.isArray(parsed)) {
              for (var j = 0; j < parsed.length; j++) if (parsed[j]["@type"]) schemaTypes.push(parsed[j]["@type"]);
            } else if (parsed["@graph"] && Array.isArray(parsed["@graph"])) {
              for (var k = 0; k < parsed["@graph"].length; k++) if (parsed["@graph"][k]["@type"]) schemaTypes.push(parsed["@graph"][k]["@type"]);
            } else if (parsed["@type"]) {
              schemaTypes.push(parsed["@type"]);
            }
          }
        } catch (e) {}
      }
    }
    // Deduplicate schemaTypes
    schemaTypes = schemaTypes.filter(function(item, pos) {
      return schemaTypes.indexOf(item) === pos;
    });

    var socialTags = {
      ogTitle: getMetaProperty("og:title"),
      ogDescription: getMetaProperty("og:description"),
      ogImage: getMetaProperty("og:image"),
      twitterCard: document.querySelector('meta[name="twitter:card"]') ? document.querySelector('meta[name="twitter:card"]').getAttribute("content") : null
    };

    var keywordInH1 = true;
    var keywordInDescription = true;
    if (titleText) {
      var primaryKeyword = titleText.split(/[|\-:,]/)[0].trim().toLowerCase();
      var h1Text = (h1[0] && h1[0].textContent ? h1[0].textContent : "").toLowerCase();
      keywordInH1 = primaryKeyword ? h1Text.indexOf(primaryKeyword) !== -1 : true;
      keywordInDescription = primaryKeyword ? description.toLowerCase().indexOf(primaryKeyword) !== -1 : true;
      if (!keywordInH1) add("warning", "Keyword", "Keyword không có trong H1");
      else add("ok", "Keyword", "Keyword có trong H1");
      if (!keywordInDescription) add("warning", "Keyword", "Keyword không có trong description");
      else if (description) add("ok", "Keyword", "Keyword có trong description");
    }

    // --- Indexability & technical checks (v2.1.0) ---
    var httpStatus = getHttpStatus();
    if (httpStatus != null) {
      if (httpStatus >= 400) add("error", "Indexability", "HTTP status lỗi: " + httpStatus);
      else if (httpStatus >= 300) add("warning", "Indexability", "Trang là redirect (HTTP " + httpStatus + ")");
      else add("ok", "Indexability", "HTTP status OK (" + httpStatus + ")");
    }

    var canonicalInfo = auditCanonical();
    if (canonicalInfo.count === 1 && !canonicalInfo.self) {
      add("warning", "Meta & head", "Canonical không tự tham chiếu trang hiện tại");
    }

    var hreflangInfo = auditHreflang();
    if (hreflangInfo.total > 0) {
      if (hreflangInfo.badSyntax > 0) add("warning", "Quốc tế (hreflang)", hreflangInfo.badSyntax + " thẻ hreflang sai cú pháp mã ngôn ngữ/vùng");
      else add("ok", "Quốc tế (hreflang)", "Cú pháp hreflang hợp lệ (" + hreflangInfo.total + " thẻ)");
      if (!hreflangInfo.hasXDefault) add("warning", "Quốc tế (hreflang)", "Thiếu hreflang x-default");
      else add("ok", "Quốc tế (hreflang)", "Có hreflang x-default");
    }

    var googlebotMeta = document.querySelector('meta[name="googlebot"]');
    if (googlebotMeta && (googlebotMeta.getAttribute("content") || "").toLowerCase().indexOf("noindex") !== -1) {
      add("error", "Robots / index", "Meta googlebot đang chặn index (noindex)");
    }

    var faviconInfo = getFaviconInfo();
    if (!faviconInfo.present) add("warning", "Meta & head", "Không tìm thấy favicon");
    else add("ok", "Meta & head", "Có favicon");

    var textToCodeRatio = getTextToCodeRatio();
    if (textToCodeRatio != null) {
      if (textToCodeRatio < 10) add("warning", "Heading & nội dung", "Tỉ lệ text/code thấp (" + textToCodeRatio.toFixed(1) + "%)");
      else add("ok", "Heading & nội dung", "Tỉ lệ text/code ổn (" + textToCodeRatio.toFixed(1) + "%)");
    }

    var thirdParty = detectThirdPartyScripts();
    if (thirdParty.total > 10) add("error", "Third-party Scripts", "Third-party scripts: " + thirdParty.total);
    else if (thirdParty.total >= 6) add("warning", "Third-party Scripts", "Third-party scripts: " + thirdParty.total);
    else add("ok", "Third-party Scripts", "Third-party scripts: " + thirdParty.total);
    add("ok", "Third-party Scripts", "Analytics: " + thirdParty.analytics + ", Ads: " + thirdParty.ads + ", CDN: " + thirdParty.cdn + ", Other: " + thirdParty.other);

    var seoScore = null;
    try {
      if (window.SEOBasicScore && typeof window.SEOBasicScore.compute === "function") {
        seoScore = window.SEOBasicScore.compute(issues);
      }
    } catch (scoreErr) {}

    return {
      url: location.href,
      title: titleText,
      description: description,
      wordCount: wordCount,
      issues: issues,
      headingTree: headingTree,
      schemaTypes: schemaTypes,
      socialTags: socialTags,
      linkStats: { internal: internal, external: external },
      keywordCheck: { inH1: keywordInH1, inDescription: keywordInDescription },
      scriptStats: {
        total: scriptEls.length,
        missingAsyncDefer: missingAsyncDefer,
        largeInline: largeInline
      },
      thirdPartyScripts: thirdParty,
      httpStatus: httpStatus,
      canonicalInfo: canonicalInfo,
      hreflang: hreflangInfo.items,
      hreflangSummary: { total: hreflangInfo.total, hasXDefault: hreflangInfo.hasXDefault, badSyntax: hreflangInfo.badSyntax },
      textToCodeRatio: textToCodeRatio,
      favicon: faviconInfo,
      links: linksDetail,
      imagesMissingAlt: imagesMissingAlt,
      seoScore: seoScore
    };
  }

  window.SEOBasicAudit = {
    runAudit: runAudit,
    classifyScript: classifyScript,
    detectThirdPartyScripts: detectThirdPartyScripts,
    clearDomHighlights: clearDomHighlights
  };
})();
