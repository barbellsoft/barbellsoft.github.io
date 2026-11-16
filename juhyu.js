// 주휴수당 계산기(ko/weekly-holiday-pay-calculator.html, 한국 전용). 요건: 4주 평균 1주 소정근로시간 15시간 이상(근로기준법
// 제18조 제3항), 1주 소정근로일 개근(시행령 제30조 제1항). 계산식은 고용노동부 안내 «(1주 소정근로시간 ÷ 40) × 8 × 시급».
// 이 계산식의 범위(주 40시간 이하)를 넘는 시간은 계산하지 않고 상담을 안내한다(4명 이하 사업장 등 예외가 있어 단정하지 않음). holiday 는 tests/test_site.py 가 검사한다.
(function () {
  "use strict";
  // → {code, h(주휴시간), pay}. code: ok·short(15시간 미만)·absent(개근 안 함)·over(40시간 초과)·big(시급 1억 원 초과 —
  // 1e308 같은 값이 «∞원» 으로 보였음, 사후 점검 11-16)·bad(읽을 수 없음)
  function holiday(hours, wage, full) {
    if (wage > 1e8 && hours > 0) return { code: "big" };
    if (!(hours > 0 && isFinite(hours) && wage >= 0 && isFinite(wage))) return { code: "bad" };
    if (hours > 40) return { code: "over" };
    if (hours < 15) return { code: "short", h: 0, pay: 0 };
    if (!full) return { code: "absent", h: 0, pay: 0 };
    var h = hours * 8 / 40;
    return { code: "ok", h: h, pay: h * wage };
  }
  // 그해 최저임금 시급(최저임금위원회 결정 현황). 빈칸에 기본으로 넣는다 — 새 고시가 나오면 한 줄 더한다
  var MIN_WAGE = [["2027-01-01", 10700], ["2026-01-01", 10320]];
  function minWage(today) {
    for (var i = 0; i < MIN_WAGE.length; i++) if (today >= MIN_WAGE[i][0]) return MIN_WAGE[i][1];
    return MIN_WAGE[MIN_WAGE.length - 1][1];
  }
  if (typeof module === "object" && module.exports) { module.exports = { holiday: holiday, minWage: minWage }; return; }

  var box = document.getElementById("wk"), out = document.getElementById("wk-out"), msg = document.getElementById("wk-msg");
  if (!box || !out || !msg || !window.bbParseAmount) return;
  var wage = document.getElementById("wk-wage"), d = new Date();
  var today = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  if (wage.value === wage.defaultValue) wage.value = String(minWage(today));
  var nf = new Intl.NumberFormat("ko", { maximumFractionDigits: 0 }), nh = new Intl.NumberFormat("ko", { maximumFractionDigits: 2 });
  function show() {
    var w = window.bbParseAmount(wage.value, "."), r = holiday(window.bbParseAmount(document.getElementById("wk-hours").value, "."),
      wage.value.trim() ? w : NaN, document.getElementById("wk-full").checked);
    out.textContent = r.pay === undefined ? "—" : nf.format(r.pay) + "원";
    msg.textContent = msg.getAttribute("data-" + r.code).replace("{a}", function () { return nh.format(r.h); })
      .replace("{b}", function () { return nf.format(w); }).replace("{c}", function () { return nf.format(r.pay); });  // 낭독은 이 줄만(금액 포함)
  }
  box.addEventListener("input", show);
  box.addEventListener("change", show);
  show();
})();
