// 목표 용량 이미지 압축(compress-image-to-kb.html). 긴 변 축소는 imgshrink.js 의 fit(window.bbFit)을 쓰고, 화질을 이분
// 탐색해 목표 크기 이하에서 가장 높은 화질을 찾는다. 화질 QMIN 으로도 넘으면 크기를 줄여 다시 찾는다. 파일은 기기 밖으로
// 보내지 않는다. 미리보기·저장 방식은 imgshrink.js 와 같다(CSP img-src 에 blob: 없음). search 는 tests/test_site.py 가 검사한다.
(function () {
  "use strict";
  var QMIN = 0.5, QMAX = 0.92, STEPS = 6, MAXSIDE = 4096, MINSIDE = 32;
  // encode(scale, q) → Promise<{size}>(scale = 원본 긴 변 대비 비율). 돌려주는 것은 늘 size ≤ target 인 결과이고,
  // 못 찾으면 null. 화질은 QMIN 아래로 내리지 않는다(그보다는 크기를 줄이는 쪽이 덜 뭉개진다)
  async function search(encode, side, target) {
    var scale = Math.min(1, MAXSIDE / side);
    for (var round = 0; round < 12 && (round === 0 || side * scale >= MINSIDE); round++) {  // 아주 작은 그림도 한 번은 시도
      var low = await encode(scale, QMIN);
      if (low.size <= target) {
        var top = await encode(scale, QMAX);
        if (top.size <= target) return top;
        var lo = QMIN, hi = QMAX, best = low;
        for (var i = 0; i < STEPS; i++) {
          var mid = (lo + hi) / 2, r = await encode(scale, mid);
          if (r.size <= target) { best = r; lo = mid; } else hi = mid;
        }
        return best;
      }
      // 용량은 대략 넓이(scale²)에 비례 → √(목표/현재) 만큼, 한 번에 30~90% 로 줄인다
      scale *= Math.min(0.9, Math.max(0.3, Math.sqrt(target / low.size) * 0.95));
    }
    return null;
  }
  if (typeof module === "object" && module.exports) { module.exports = { search: search }; return; }

  var file = document.getElementById("ts-file"), out = document.getElementById("ts-out");
  if (!file || !out || !window.createImageBitmap || !window.bbFit) return;
  var link = document.getElementById("ts-dl"), wrap = document.getElementById("ts-preview"), url = "", seq = 0;
  function msg(k, a, b, c) {
    out.textContent = out.getAttribute("data-" + k).replace("{a}", function () { return a || ""; })
      .replace("{b}", function () { return b || ""; }).replace("{c}", function () { return c || ""; });
  }
  var nf = new Intl.NumberFormat(document.documentElement.lang, { maximumFractionDigits: 1 });
  function kb(n) { return nf.format(n / 1000) + " KB"; }  // 목표와 같은 기준(1 KB = 1,000바이트 — 화면에 적음)
  async function run() {
    var f = file.files[0], my = ++seq;  // 설정을 빨리 바꾸면 늦게 끝난 옛 결과가 덮어쓰지 않게
    link.hidden = true;
    wrap.replaceChildren();
    if (!f) { out.textContent = ""; return; }
    var target = +document.getElementById("ts-kb").value * 1000, type = document.getElementById("ts-type").value;
    if (f.size <= target && f.type === type) { msg("already", kb(f.size)); return; }
    msg("busy");
    var bmp;
    try { bmp = await createImageBitmap(f); } catch (err) { if (my === seq) msg("bad"); return; }
    var cv = document.createElement("canvas"), drawn = 0, r = null;
    async function encode(scale, q) {
      if (my !== seq) throw new Error("stale");
      if (scale !== drawn) {  // 같은 크기에서 화질만 바꿀 때는 다시 그리지 않는다
        var s = window.bbFit(bmp.width, bmp.height, Math.round(Math.max(bmp.width, bmp.height) * scale)), g;
        cv.width = s.w; cv.height = s.h;
        g = cv.getContext("2d");
        if (type === "image/jpeg") { g.fillStyle = "#fff"; g.fillRect(0, 0, s.w, s.h); }  // 투명한 곳이 검게 되지 않게
        g.drawImage(bmp, 0, 0, s.w, s.h);
        drawn = scale;
      }
      var blob = await new Promise(function (ok) { cv.toBlob(ok, type, q); });
      if (!blob) throw new Error("toobig");  // 캔버스가 브라우저 한도를 넘으면 null
      if (blob.type !== type) throw new Error("nowebp");  // WebP 로 못 쓰는 브라우저는 PNG 를 돌려준다
      return { size: blob.size, blob: blob, w: cv.width, h: cv.height };
    }
    try { r = await search(encode, Math.max(bmp.width, bmp.height), target); }
    catch (err) { if (my === seq) msg(err.message === "nowebp" ? "nowebp" : "toobig"); return; }
    finally { bmp.close(); }
    if (my !== seq) return;
    if (!r) { msg("fail"); return; }
    var shown = await createImageBitmap(r.blob);  // 미리보기는 압축된 결과를 다시 그린 것(화질 변화가 보이게)
    if (my !== seq) return;
    cv.width = r.w; cv.height = r.h;
    cv.getContext("2d").drawImage(shown, 0, 0);
    shown.close();
    if (url) URL.revokeObjectURL(url);
    url = URL.createObjectURL(r.blob);
    link.href = url;
    link.download = f.name.replace(/\.[^.]+$/, "") + "-" + target / 1000 + "KB" + (type === "image/webp" ? ".webp" : ".jpg");  // 원본 이름과 겹치지 않게
    link.hidden = false;
    wrap.replaceChildren(cv);
    msg("done", kb(f.size), kb(r.size), r.w + " × " + r.h);
  }
  ["ts-file", "ts-kb", "ts-type"].forEach(function (id) { document.getElementById(id).addEventListener("change", run); });
})();
