// 시급↔연봉 환산(hourly-to-salary-calculator.html). 곱셈·나눗셈뿐이고 세금·공제·수당은 넣지 않는다(화면에 적음).
// 금액 읽기는 margin.js 의 parseAmount(window.bbParseAmount). convert 는 tests/test_site.py 가 node 로 검사한다.
(function () {
  "use strict";
  // per 기간의 금액 → 시급·주급·월급·연봉. hours = 주 근무시간(0 초과 168 이하), weeks = 1년 근무 주 수(0 초과 53 이하).
  // 월급 = 연봉 ÷ 12. 읽을 수 없는 값이면 null
  function convert(amount, per, hours, weeks) {
    var f = { hour: 1, week: hours, month: hours * weeks / 12, year: hours * weeks }[per];
    if (!(amount >= 0 && isFinite(amount) && hours > 0 && hours <= 168 && weeks > 0 && weeks <= 53 && f)) return null;
    var hour = amount / f;
    return { hour: hour, week: hour * hours, month: hour * hours * weeks / 12, year: hour * hours * weeks };
  }
  if (typeof module === "object" && module.exports) { module.exports = { convert: convert }; return; }

  var box = document.getElementById("hw");
  if (!box || !window.bbParseAmount) return;
  var nf = new Intl.NumberFormat(document.documentElement.lang, { maximumFractionDigits: 2 });
  var dec = box.getAttribute("data-dec") || ".";
  function v(name) { return window.bbParseAmount(document.getElementById("hw-" + name).value, dec); }
  function show() {
    var amount = document.getElementById("hw-amount").value.trim() ? v("amount") : NaN;  // 빈칸은 0 이 아니라 «—»
    var r = convert(amount, document.getElementById("hw-per").value, v("hours"), v("weeks"));
    ["hour", "week", "month", "year"].forEach(function (k) {
      box.querySelector('[data-k="' + k + '"]').textContent = r && isFinite(r[k]) ? nf.format(r[k]) : "—";
    });
  }
  box.addEventListener("input", show);
  box.addEventListener("change", show);
  show();
})();
