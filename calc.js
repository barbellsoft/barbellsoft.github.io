// USB 실제 용량 계산기(usb-capacity-calculator.html). 계산식은 tool_pages.py 의 shown_gib·fmt1 과 같다
// (tests/test_site.py 가 node 로 이 파일을 불러 맞춰 본다). 외부 라이브러리 없음.
(function () {
  "use strict";
  // 포장 용량(10진 GB) → Windows 가 «GB» 로 보이는 값(2진 GiB)
  function shownGiB(gb) { return gb * 1e9 / 1073741824; }
  function fmt1(x, dec) { return x.toFixed(1).replace(".", dec); }
  // 입력 읽기는 마진 계산기와 같은 규칙(margin.js parseAmount: 그 언어 소수점, 세 자리 묶음은 천 단위 — en «1,000»·
  // de «1.000» = 1000). 끝에 붙은 GB 단위(«256 GB»·«256GB»·fr «Go»·ru «ГБ»)만 떼고, «2 TB» 같은 다른 단위는 읽지 않는다(NaN)
  var node = typeof module === "object" && module.exports;
  var parseAmount = node ? require("./margin.js").parseAmount : window.bbParseAmount;
  function parseNum(s, dec) { return parseAmount(String(s).replace(/\s*(GB|Go|ГБ)\s*$/i, ""), dec); }
  if (node) { module.exports = { shownGiB: shownGiB, fmt1: fmt1, parseNum: parseNum }; return; }

  var input = document.getElementById("calc-gb"), out = document.getElementById("calc-out");
  if (!input || !out) return;
  var dec = out.getAttribute("data-dec") || ".";
  function show() {
    var gb = parseNum(input.value, dec);
    if (!(gb > 0) || !isFinite(gb)) { out.textContent = out.getAttribute("data-empty"); return; }
    out.textContent = out.getAttribute("data-tpl")
      .replace("{gb}", String(gb).replace(".", dec)).replace("{gib}", fmt1(shownGiB(gb), dec));
  }
  input.addEventListener("input", show);
  show();
})();
