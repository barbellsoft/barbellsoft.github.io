// QR 코드 만들기(qr-code-generator.html). qrcode-generator 2.0.4(MIT, vendor/qrcode-generator.js, 전역 qrcode)로
// 칸 배열만 받고, PNG 는 캔버스에 직접 그리고 SVG 는 라이브러리의 createSvgTag(사용자 글이 들어가지 않는 path 만)를 쓴다.
// 입력은 기기 밖으로 보내지 않는다. matrix 는 tests/test_site.py 가 node 로 만들어 디코드해 본다.
(function () {
  "use strict";
  var QUIET = 4;  // 둘레 여백(칸 수, QR 표준 권장 4)
  // 글 → 칸 배열(true = 검은 칸). 한글 등은 UTF-8 로 넣는다(라이브러리 기본은 문자 코드 하위 8비트라 깨짐).
  // 너무 길면 라이브러리가 오류를 던진다(«code length overflow»)
  function make(lib, text, ec) {
    lib.stringToBytes = lib.stringToBytesFuncs["UTF-8"];
    var qr = lib(0, ec);  // 0 = 글 길이에 맞춰 크기 자동
    qr.addData(text, "Byte");
    qr.make();
    return qr;
  }
  function matrix(lib, text, ec) {
    var qr = make(lib, text, ec), n = qr.getModuleCount(), rows = [];
    for (var r = 0; r < n; r++) { var row = []; for (var c = 0; c < n; c++) row.push(qr.isDark(r, c)); rows.push(row); }
    return rows;
  }
  if (typeof module === "object" && module.exports) { module.exports = { matrix: matrix, QUIET: QUIET }; return; }

  var box = document.getElementById("qr-in"), cv = document.getElementById("qr-cv"), out = document.getElementById("qr-out");
  if (!box || !cv || !out || !window.qrcode) return;
  var png = document.getElementById("qr-png"), svg = document.getElementById("qr-svg"), ec = document.getElementById("qr-ec");
  var urls = [], seq = 0;  // seq: 빨리 입력할 때 늦게 끝난 옛 PNG 가 새 링크를 덮지 않게
  function offer(a, blob) { var u = URL.createObjectURL(blob); urls.push(u); a.href = u; a.hidden = false; }
  function run() {
    var my = ++seq;
    urls.forEach(function (u) { URL.revokeObjectURL(u); }); urls = [];
    png.hidden = svg.hidden = cv.hidden = true;
    if (!box.value) { out.textContent = out.getAttribute("data-empty"); return; }
    var qr;
    try { qr = make(window.qrcode, box.value, ec.value); } catch (err) { out.textContent = out.getAttribute("data-big"); return; }
    var n = qr.getModuleCount(), cell = Math.max(4, Math.floor(512 / (n + 2 * QUIET))), size = (n + 2 * QUIET) * cell;
    cv.width = cv.height = size;
    var g = cv.getContext("2d");
    g.fillStyle = "#fff"; g.fillRect(0, 0, size, size);
    g.fillStyle = "#000";
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (qr.isDark(r, c)) g.fillRect((c + QUIET) * cell, (r + QUIET) * cell, cell, cell);
    cv.hidden = false;
    out.textContent = "";
    offer(svg, new Blob([qr.createSvgTag(cell, QUIET * cell)], { type: "image/svg+xml" }));
    cv.toBlob(function (b) { if (b && my === seq) offer(png, b); }, "image/png");
  }
  box.addEventListener("input", run);
  ec.addEventListener("change", run);
  run();
})();
