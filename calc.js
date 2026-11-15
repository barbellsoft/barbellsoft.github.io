// USB 실제 용량 계산기(usb-capacity-calculator.html). 계산식은 tool_pages.py 의 shown_gib·fmt1 과 같다
// (tests/test_site.py 가 node 로 이 파일을 불러 맞춰 본다). 외부 라이브러리 없음.
(function () {
  "use strict";
  // 포장 용량(10진 GB) → Windows 가 «GB» 로 보이는 값(2진 GiB)
  function shownGiB(gb) { return gb * 1e9 / 1073741824; }
  function fmt1(x, dec) { return x.toFixed(1).replace(".", dec); }
  // 입력 읽기: «64,5»·«64.5»·«1.024,5»·«1 024» 모두 받음(마지막 . 또는 , 를 소수점으로 봄)
  function parseNum(s) {
    s = String(s).replace(/[\s\u00a0\u202f']/g, "");
    var i = Math.max(s.lastIndexOf("."), s.lastIndexOf(","));
    if (i >= 0) s = s.slice(0, i).replace(/[.,]/g, "") + "." + s.slice(i + 1);
    return /^\d*\.?\d+$/.test(s) ? parseFloat(s) : NaN;
  }
  if (typeof module === "object" && module.exports) { module.exports = { shownGiB: shownGiB, fmt1: fmt1, parseNum: parseNum }; return; }

  var input = document.getElementById("calc-gb"), out = document.getElementById("calc-out");
  if (!input || !out) return;
  var dec = out.getAttribute("data-dec") || ".";
  function show() {
    var gb = parseNum(input.value);
    if (!(gb > 0) || !isFinite(gb)) { out.textContent = out.getAttribute("data-empty"); return; }
    out.textContent = out.getAttribute("data-tpl")
      .replace("{gb}", String(gb).replace(".", dec)).replace("{gib}", fmt1(shownGiB(gb), dec));
  }
  input.addEventListener("input", show);
  show();
})();
