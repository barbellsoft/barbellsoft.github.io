// PDF 합치기·페이지 추출(pdf-merge-split.html). pdf-lib 1.17.1(MIT, vendor/pdf-lib.min.js, 전역 PDFLib)을 쓴다 —
// CSP 가 script-src 'self' 라 CDN 은 못 쓴다. 파일은 기기 밖으로 보내지 않는다. 암호 걸린 PDF 는 pdf-lib 가 load 에서
// 오류를 내므로 안내만 한다. merge·extract·parseRanges 는 tests/test_site.py 가 node 로 검사한다.
(function () {
  "use strict";
  // «1-3, 5, 8-» → [0,1,2,4,7,…] (0부터, 입력 순서, 중복 제외, 끝을 넘는 범위는 마지막 페이지까지). 잘못된 조각이 있으면 null
  function parseRanges(s, total) {
    var out = [], seen = {}, parts = String(s).split(/[,;\u3001\uff0c]/);
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i].replace(/\s/g, "").replace(/[\u2013\u2014~\uff5e]/g, "-");
      if (!p) continue;
      var m = /^(\d+)(?:-(\d*))?$/.exec(p);
      if (!m) return null;
      var a = +m[1], b = m[2] === undefined ? a : (m[2] === "" ? total : +m[2]);
      if (a < 1 || b < a || a > total) return null;
      for (var n = a; n <= Math.min(b, total); n++) if (!seen[n]) { seen[n] = 1; out.push(n - 1); }
    }
    return out.length ? out : null;
  }
  async function merge(lib, list) {  // list: 각 파일의 바이트(ArrayBuffer·Uint8Array), 이 순서대로 합친다
    var doc = await lib.PDFDocument.create();
    for (var i = 0; i < list.length; i++) {
      var src = await lib.PDFDocument.load(list[i]);
      (await doc.copyPages(src, src.getPageIndices())).forEach(function (p) { doc.addPage(p); });
    }
    return { bytes: await doc.save(), pages: doc.getPageCount() };
  }
  async function extract(lib, bytes, ranges) {  // 범위가 틀리면 { total } 만(화면이 «1부터 total 사이» 안내)
    var src = await lib.PDFDocument.load(bytes), idx = parseRanges(ranges, src.getPageCount());
    if (!idx) return { total: src.getPageCount() };
    var doc = await lib.PDFDocument.create();
    (await doc.copyPages(src, idx)).forEach(function (p) { doc.addPage(p); });
    return { bytes: await doc.save(), pages: idx.length };
  }
  if (typeof module === "object" && module.exports) { module.exports = { parseRanges: parseRanges, merge: merge, extract: extract }; return; }

  var out = document.getElementById("pdf-out"), link = document.getElementById("pdf-dl");
  if (!out || !link || !window.PDFLib) return;
  var url = "", picked = [], list = document.getElementById("pdf-list"), pick = document.getElementById("pdf-files");
  // 여러 개를 한 번에 고르면 순서는 파일 대화상자가 정한다 → 고를 때마다 목록 끝에 붙이고 화면 목록 순서로 합친다
  function showList() {
    list.replaceChildren.apply(list, picked.map(function (f) { var li = document.createElement("li"); li.textContent = f.name; return li; }));
  }
  pick.addEventListener("change", function () { picked = picked.concat(Array.from(pick.files)); pick.value = ""; showList(); });
  document.getElementById("pdf-clear").addEventListener("click", function () { picked = []; showList(); link.hidden = true; out.textContent = ""; mergeBtn.className = "btn btn-primary"; });
  function msg(k, a) { out.textContent = out.getAttribute("data-" + k).replace("{a}", a); }
  var result = document.getElementById("pdf-result"), mergeBtn = document.getElementById("pdf-merge");
  function offer(r, name) {
    if (url) URL.revokeObjectURL(url);
    url = URL.createObjectURL(new Blob([r.bytes], { type: "application/pdf" }));
    link.href = url; link.download = name; link.hidden = false;
    mergeBtn.className = "btn btn-outline";  // 강조는 하나: 결과가 나오면 «저장»만 주색
    msg("done", r.pages);
  }
  async function guard(btn, fn) {
    btn.closest("section").appendChild(result);  // 결과를 누른 단추가 있는 칸 끝으로(DOM 이동만, HTML 삽입 없음)
    link.hidden = true;
    mergeBtn.className = "btn btn-primary";
    out.textContent = out.getAttribute("data-busy");
    try { await fn(); } catch (err) { msg("bad", ""); }
  }
  function bytesOf(f) { return f.arrayBuffer(); }

  document.getElementById("pdf-merge").addEventListener("click", function () {
    guard(this, async function () {
      if (picked.length < 2) { msg("need2", ""); return; }
      offer(await merge(PDFLib, await Promise.all(picked.map(bytesOf))), "merged.pdf");
    });
  });
  document.getElementById("pdf-split").addEventListener("click", function () {
    guard(this, async function () {
      var f = document.getElementById("pdf-one").files[0];
      if (!f) { msg("need1", ""); return; }
      var r = await extract(PDFLib, await bytesOf(f), document.getElementById("pdf-range").value);
      if (!r.bytes) { msg("range", r.total); return; }
      offer(r, f.name.replace(/\.pdf$/i, "") + "-pages.pdf");
    });
  });
})();
