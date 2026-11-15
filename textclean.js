// 글자수 세기·공백 정리(text-counter.html). 계산부는 module.exports 로 내보내 tests/test_site.py 가 node 로 검사한다.
// 외부 라이브러리 없음. 입력한 글은 화면 밖으로 보내지 않는다(광고 페이지라 HTML 삽입 API 는 쓰지 않는다: textContent·value 만).
(function () {
  "use strict";
  var SP = "[ \\t\\u00a0\\u3000]";  // 줄 안 공백(일반·탭·줄바꿈 없는 공백·전각 공백)
  // 띄어쓰기 없이 잇는 문자(한자·가나·전각 문장부호). 한글은 띄어 쓰므로 넣지 않는다
  var CJK = /[\u2e80-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/;

  function graphemes(s) {  // 이모지·결합 문자를 한 글자로(Intl.Segmenter 가 없는 브라우저는 코드 포인트 수)
    if (typeof Intl === "object" && Intl.Segmenter) {
      var n = 0, it = new Intl.Segmenter().segment(s)[Symbol.iterator]();
      while (!it.next().done) n++;
      return n;
    }
    return Array.from(s).length;
  }

  function count(s) {
    s = s.replace(/\r\n?/g, "\n");  // 줄바꿈은 한 글자(공백 포함 글자수에 들어감)
    return {
      chars: graphemes(s),
      noSpace: graphemes(s.replace(/\s/g, "")),
      words: (s.match(/\S+/g) || []).length,
      lines: s ? s.split("\n").length : 0,
      bytes: new TextEncoder().encode(s).length  // UTF-8(EUC-KR 2바이트 셈과 다름 — 화면에 적음)
    };
  }

  // 문단 안 줄 잇기: 영문 하이픈 줄넘김(«exam-» + «ple»)은 하이픈을 지우고 붙이고, 한자·가나 사이는 그냥 붙이고,
  // 나머지는 공백 하나로 잇는다. ponytail: «well-» + «known» 같은 합성어도 붙어 버린다(줄 끝 하이픈은 대개 줄넘김이라 이쪽을 택함)
  function joinLines(p) {
    return p.split("\n").reduce(function (acc, line) {
      if (!acc) return line;
      if (/[A-Za-z\u00c0-\u024f\u0400-\u04ff]-$/.test(acc) && /^[a-z\u00df-\u024f\u0430-\u045f]/.test(line)) return acc.slice(0, -1) + line;
      if (CJK.test(acc.slice(-1)) || CJK.test(line.charAt(0))) return acc + line;
      return acc + " " + line;
    }, "");
  }

  // 정리: 각 줄 앞뒤 공백 삭제 → 줄 안 연속 공백 1칸 → 빈 줄은 문단 사이 한 줄만. join=true 면 문단 안 줄바꿈을 잇는다
  function clean(s, join) {
    var lines = s.replace(/\r\n?/g, "\n").split("\n").map(function (l) {
      return l.replace(new RegExp("^" + SP + "+|" + SP + "+$", "g"), "").replace(new RegExp(SP + "{2,}", "g"), " ");
    });
    var paras = lines.join("\n").replace(/\n{3,}/g, "\n\n").replace(/^\n+|\n+$/g, "").split("\n\n");
    return (join ? paras.map(joinLines) : paras).join("\n\n");
  }

  if (typeof module === "object" && module.exports) { module.exports = { count: count, clean: clean }; return; }

  var box = document.getElementById("tx-in"), out = document.getElementById("tx-out");
  if (!box || !out) return;
  var cells = out.querySelectorAll("[data-k]"), copy = document.getElementById("tx-copy"), label = copy.textContent;
  var nf = new Intl.NumberFormat(document.documentElement.lang);
  function show() {
    var r = count(box.value);
    for (var i = 0; i < cells.length; i++) cells[i].textContent = nf.format(r[cells[i].getAttribute("data-k")]);
    copy.textContent = label;
  }
  box.addEventListener("input", show);
  document.getElementById("tx-clean").addEventListener("click", function () {
    box.value = clean(box.value, document.getElementById("tx-join").checked);
    show();
  });
  copy.addEventListener("click", function () {
    function fail() { copy.textContent = copy.getAttribute("data-fail"); }
    try {
      navigator.clipboard.writeText(box.value).then(function () { copy.textContent = copy.getAttribute("data-done"); }, fail);
    } catch (e) { fail(); }
  });
  show();
})();
