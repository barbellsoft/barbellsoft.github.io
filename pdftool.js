// PDF 합치기·페이지 추출(pdf-merge-split.html). pdf-lib 1.17.1(MIT, vendor/pdf-lib.min.js, 전역 PDFLib)을 쓴다 —
// CSP 가 script-src 'self' 라 CDN 은 못 쓴다. 파일은 기기 밖으로 보내지 않는다. 암호 걸린 PDF 는 처리하지 않는다 —
// 권한 암호(편집 제한)만 걸린 것도 pdf-lib 로는 결과가 깨질 수 있다. pdf-lib 에게는 여는 암호와 권한 암호가 똑같이
// «암호화됨» 으로 보여 둘을 한 안내로 묶는다. merge·extract·parseRanges 는 tests/test_site.py 가 node 로 검사한다.
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
  // 열기: PDF 가 아니면 code «notpdf»(머리 «%PDF-» 는 첫 1024바이트 안), 암호가 있으면 «locked», 그 밖의 읽기 실패는 «bad»
  function fail(code) { var err = new Error(code); err.code = code; return err; }
  async function open(lib, bytes) {
    var head = new Uint8Array(bytes.buffer || bytes, bytes.byteOffset || 0, Math.min(1024, bytes.byteLength));
    if (String.fromCharCode.apply(null, head).indexOf("%PDF-") < 0) throw fail("notpdf");
    var doc;
    try { doc = await lib.PDFDocument.load(bytes, { ignoreEncryption: true }); } catch (err) { throw fail("bad"); }
    if (doc.isEncrypted) throw fail("locked");
    return doc;
  }
  async function merge(lib, list) {  // list: 각 파일의 바이트(ArrayBuffer·Uint8Array), 이 순서대로 합친다. 실패하면 err.index = 몇 번째 파일
    var doc = await lib.PDFDocument.create();
    for (var i = 0; i < list.length; i++) {
      try {
        var src = await open(lib, list[i]);
        (await doc.copyPages(src, src.getPageIndices())).forEach(function (p) { doc.addPage(p); });
      } catch (err) { err.index = i; throw err; }
    }
    return { bytes: await doc.save(), pages: doc.getPageCount() };
  }
  async function extract(lib, bytes, ranges) {  // 범위가 틀리면 { total } 만(화면이 «1부터 total 사이» 안내)
    var src = await open(lib, bytes), idx = parseRanges(ranges, src.getPageCount());
    if (!idx) return { total: src.getPageCount() };
    var doc = await lib.PDFDocument.create();
    (await doc.copyPages(src, idx)).forEach(function (p) { doc.addPage(p); });
    return { bytes: await doc.save(), pages: idx.length };
  }
  if (typeof module === "object" && module.exports) { module.exports = { parseRanges: parseRanges, merge: merge, extract: extract, open: open }; return; }

  var out = document.getElementById("pdf-out"), link = document.getElementById("pdf-dl");
  if (!out || !link || !window.PDFLib) return;
  var url = "", picked = [], list = document.getElementById("pdf-list"), pick = document.getElementById("pdf-files");
  // 여러 개를 한 번에 고르면 순서는 파일 대화상자가 정한다 → 고를 때마다 목록 끝에 붙이고 화면 목록 순서로 합친다
  function showList() {
    list.replaceChildren.apply(list, picked.map(function (f) { var li = document.createElement("li"); li.textContent = f.name; return li; }));
  }
  pick.addEventListener("change", function () { picked = picked.concat(Array.from(pick.files)); pick.value = ""; showList(); });
  document.getElementById("pdf-clear").addEventListener("click", function () { picked = []; showList(); link.hidden = true; out.textContent = ""; mergeBtn.className = "btn btn-primary"; });
  function msg(k, a) { out.textContent = out.getAttribute("data-" + k).replace("{a}", function () { return a; }); }  // 함수로 넣어야 파일 이름 속 $& 가 그대로 보임
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
    try { await fn(); } catch (err) { msg(err.code || "bad", err.file || ""); }  // 안내에 문제 파일 이름(textContent 로만)
  }
  function bytesOf(f) { return f.arrayBuffer(); }

  document.getElementById("pdf-merge").addEventListener("click", function () {
    guard(this, async function () {
      if (picked.length < 2) { msg("need2", ""); return; }
      var files = picked.slice();  // 기다리는 사이 목록이 바뀌어도 이름이 맞게
      offer(await merge(PDFLib, await Promise.all(files.map(bytesOf))).catch(function (err) {
        err.file = (files[err.index] || {}).name; throw err;
      }), "merged.pdf");
    });
  });
  document.getElementById("pdf-split").addEventListener("click", function () {
    guard(this, async function () {
      var f = document.getElementById("pdf-one").files[0];
      if (!f) { msg("need1", ""); return; }
      var r = await extract(PDFLib, await bytesOf(f), document.getElementById("pdf-range").value)
        .catch(function (err) { err.file = f.name; throw err; });
      if (!r.bytes) { msg("range", r.total); return; }
      offer(r, f.name.replace(/\.pdf$/i, "") + "-pages.pdf");
    });
  });
})();
