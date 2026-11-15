// 판매 마진·목표 마진 판매가 역산기(seller-margin-calculator.html). 마켓 수수료율은 하드코딩하지 않는다(마켓·카테고리·
// 시점마다 다름) — 판매자가 정산서의 비율을 넣는다. 세금은 계산하지 않는다(화면에 적음).
// 계산부는 tests/test_site.py 가 node 로 검사한다. 광고 페이지라 결과는 textContent 로만 쓴다.
(function () {
  "use strict";
  // 판매가 → 수수료·정산액·이익·마진율. pct 는 % 숫자(10 = 10%). ×100 을 먼저 해 0.15*100 ≠ 15 같은 오차를 피한다
  function forward(price, cost, feePct, ship, other) {
    var fee = price * feePct / 100, profit = price - fee - cost - ship - other;
    return { fee: fee, payout: price - fee, profit: profit, margin: price > 0 ? profit * 100 / price : NaN };
  }
  // 목표 마진율 → 필요한 판매가: P − P·f − C = P·m → P = C / (1 − f − m). f + m ≥ 100% 면 불가(NaN)
  function reverse(cost, feePct, ship, other, marginPct) {
    var rest = 100 - feePct - marginPct;  // % 단위로 빼야 60 + 40 이 정확히 0
    return rest > 0 ? (cost + ship + other) * 100 / rest : NaN;
  }
  // 금액 읽기. dec 는 그 페이지 언어의 소수점(«,» 또는 «.»). 빈칸 = 0, 읽을 수 없으면 NaN(결과 «—»).
  // 두 구분자가 다 있으면 뒤의 것이 소수점. 하나만 있으면: 뒤에 정확히 세 자리씩 오면 천 단위(«10,000»·«1.234»),
  // 아니면 한 번만 나온 그 기호를 소수점으로 본다(«12,5»·«12.5» 는 어느 언어에서든 12.5). 단 그 언어의 소수점 뒤 세 자리는
  // 소수로 둔다(de «1,234» = 1.234, en «1.234» = 1.234).
  function parseAmount(s, dec) {
    s = String(s).replace(/[\s\u00a0\u202f']/g, "");
    if (!s) return 0;
    var i = Math.max(s.lastIndexOf("."), s.lastIndexOf(","));
    if (i >= 0) {
      var sep = s.charAt(i), head = s.slice(0, i);
      var mixed = head.indexOf(sep === "." ? "," : ".") >= 0;
      var groups = s.split(sep).slice(1);
      var thousands = !mixed && groups.every(function (g) { return g.length === 3; }) && (groups.length > 1 || sep !== dec);
      if (thousands) s = s.split(sep).join("");
      else if (head.indexOf(sep) >= 0 && !mixed) return NaN;  // «1.2.3» 처럼 소수점이 두 번
      else s = head.replace(/[.,]/g, "") + "." + s.slice(i + 1);
    }
    return /^(\d+\.?\d*|\.\d+)$/.test(s) ? parseFloat(s) : NaN;  // «12.» (입력 중)도 12
  }
  if (typeof module === "object" && module.exports) { module.exports = { forward: forward, reverse: reverse, parseAmount: parseAmount }; return; }

  var form = document.getElementById("mg");
  if (!form) return;
  var nf = new Intl.NumberFormat(document.documentElement.lang, { maximumFractionDigits: 2 });
  var dec = form.getAttribute("data-dec") || ".";
  function v(name) { return parseAmount(document.getElementById("mg-" + name).value, dec); }
  function put(k, x) { form.querySelector('[data-k="' + k + '"]').textContent = isFinite(x) ? nf.format(x) : "\u2014"; }
  function show() {
    var f = forward(v("price"), v("cost"), v("fee"), v("ship"), v("other"));
    put("fee", f.fee); put("payout", f.payout); put("profit", f.profit); put("margin", f.margin);
    put("need", reverse(v("cost"), v("fee"), v("ship"), v("other"), v("target")));
  }
  form.addEventListener("input", show);
  show();
})();
