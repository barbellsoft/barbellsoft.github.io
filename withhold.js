// 프리랜서 3.3% 원천징수 계산기(ko/freelancer-tax-3-3-calculator.html, 한국 전용). 소득세 = 지급액의 3%(소득세법 제129조
// 제1항 제3호), 개인지방소득세 = 그 소득세의 10%(지방세법 제103조의13). 건마다 끝수(원 미만·10원 미만)를 버린다는 공식 근거를
// 찾지 못해(11-16 조사 — 국고금 관리법 제47조는 «국고금의 수입·지출» 단위) 10원 미만을 버리지 않는다. 화면(shown)은 두 세액을
// 원 단위로 반올림한 뒤 합계 = 두 세액의 합으로 맞추고, 입력한 쪽(지급액 또는 실수령액)은 입력값 그대로 두고 다른 쪽을 합계로 맞춘다. split·shown 은 tests/test_site.py 가 node 로 검사한다.
(function () {
  "use strict";
  // base = "gross"(세전 지급액) 또는 "net"(3.3% 뗀 실수령액). 지급액 = 실수령액 ÷ 0.967. MAX(1조 원) 초과는 null —
  // 화면은 «∞원»·수백 자리 숫자 대신 안내를 낸다(사후 점검 11-16)
  var MAX = 1e12;
  function split(amount, base) {
    if (!(amount >= 0 && amount <= MAX) || (base !== "gross" && base !== "net")) return null;
    var gross = base === "net" ? amount * 1000 / 967 : amount, income = gross * 3 / 100, local = income / 10;
    return { gross: gross, income: income, local: local, total: income + local, net: gross - income - local };
  }
  function shown(r, base) {
    var income = Math.round(r.income), local = Math.round(r.local), total = income + local, net;
    if (base === "net") { net = Math.round(r.net); return { gross: net + total, income: income, local: local, total: total, net: net }; }
    var gross = Math.round(r.gross);
    return { gross: gross, income: income, local: local, total: total, net: gross - total };
  }
  if (typeof module === "object" && module.exports) { module.exports = { split: split, shown: shown, MAX: MAX }; return; }

  var box = document.getElementById("fl"), msg = document.getElementById("fl-msg");
  if (!box || !msg || !window.bbParseAmount) return;
  var nf = new Intl.NumberFormat("ko", { maximumFractionDigits: 0 });
  function show() {
    var raw = document.getElementById("fl-amount").value;
    var base = document.getElementById("fl-base").value, a = raw.trim() ? window.bbParseAmount(raw, ".") : NaN, r = split(a, base);
    r = r && isFinite(r.gross) ? shown(r, base) : null;
    msg.textContent = a > MAX ? msg.getAttribute("data-big") : "";
    ["gross", "income", "local", "total", "net"].forEach(function (k) {
      box.querySelector('[data-k="' + k + '"]').textContent = r ? nf.format(r[k]) + "원" : "—";
    });
  }
  box.addEventListener("input", show);
  box.addEventListener("change", show);
  show();
})();
