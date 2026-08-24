/**
 * SEO Basic PRO - Score module (v2.1.0).
 * Computes an SEO score 0-100 from audit issues and assigns a letter grade.
 * Exposes window.SEOBasicScore = { compute }.
 */
(function () {
  "use strict";

  var ERROR_PENALTY = 15;
  var WARNING_PENALTY = 5;

  function gradeFor(score) {
    if (score >= 90) return "A";
    if (score >= 75) return "B";
    if (score >= 60) return "C";
    if (score >= 40) return "D";
    return "F";
  }

  function colorFor(grade) {
    switch (grade) {
      case "A": return "#16a34a";
      case "B": return "#65a30d";
      case "C": return "#ca8a04";
      case "D": return "#ea580c";
      default: return "#dc2626";
    }
  }

  function compute(issues) {
    var list = Array.isArray(issues) ? issues : [];
    var counts = { error: 0, warning: 0, ok: 0 };
    for (var i = 0; i < list.length; i++) {
      var lvl = list[i].level;
      if (lvl === "error") counts.error += 1;
      else if (lvl === "warning") counts.warning += 1;
      else counts.ok += 1;
    }
    var score = Math.max(0, 100 - counts.error * ERROR_PENALTY - counts.warning * WARNING_PENALTY);
    var grade = gradeFor(score);
    return {
      score: score,
      grade: grade,
      color: colorFor(grade),
      counts: counts,
      priority: {
        p1: counts.error,
        p2: counts.warning,
        p3: counts.ok
      }
    };
  }

  window.SEOBasicScore = {
    compute: compute
  };
})();
