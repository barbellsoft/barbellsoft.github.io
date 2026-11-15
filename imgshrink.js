// 이미지 용량 줄이기(image-compressor.html). 브라우저 Canvas 로 다시 저장할 뿐, 파일은 기기 밖으로 보내지 않는다.
// CSP(img-src 에 blob: 없음): <img src="blob:…"> 대신 결과를 다시 그린 캔버스를 미리보기로 붙인다.
// 저장은 <a href="blob:…" download> 로 — 이동이라 img-src 대상이 아니다(브라우저 실측: 보고서).
(function () {
  "use strict";
  // 긴 변이 max 를 넘으면 비율을 지켜 줄인다. max 가 0·빈칸이면 원래 크기
  function fit(w, h, max) {
    if (!(max > 0) || Math.max(w, h) <= max) return { w: w, h: h };
    var k = max / Math.max(w, h);
    return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)) };
  }
  if (typeof module === "object" && module.exports) { module.exports = { fit: fit }; return; }

  var file = document.getElementById("im-file"), out = document.getElementById("im-out");
  if (!file || !out || !window.createImageBitmap) return;
  var link = document.getElementById("im-dl"), wrap = document.getElementById("im-preview"), url = "", seq = 0;
  function msg(k, a, b) { out.textContent = out.getAttribute("data-" + k).replace("{a}", a || "").replace("{b}", b || ""); }
  var nf = new Intl.NumberFormat(document.documentElement.lang, { maximumFractionDigits: 0 });
  function kb(n) { return nf.format(Math.max(1, n / 1024)) + " KB"; }
  async function run() {
    var f = file.files[0], my = ++seq;  // 설정을 빨리 바꾸면 늦게 끝난 옛 결과가 덮어쓰지 않게
    link.hidden = true;
    wrap.replaceChildren();
    if (!f) { out.textContent = ""; return; }
    var type = document.getElementById("im-type").value, q = +document.getElementById("im-q").value / 100;
    var bmp;
    try { bmp = await createImageBitmap(f); } catch (err) { msg("bad"); return; }
    var s = fit(bmp.width, bmp.height, +document.getElementById("im-max").value);
    var cv = document.createElement("canvas"), g = cv.getContext("2d");
    cv.width = s.w; cv.height = s.h;
    if (type === "image/jpeg") { g.fillStyle = "#fff"; g.fillRect(0, 0, s.w, s.h); }  // 투명한 곳이 검게 되지 않게
    g.drawImage(bmp, 0, 0, s.w, s.h);
    var blob = await new Promise(function (ok) { cv.toBlob(ok, type, q); });
    if (my !== seq) return;
    if (!blob || blob.type !== type) { msg("nowebp"); return; }  // WebP 로 못 쓰는 브라우저는 PNG 를 돌려준다
    var shown = await createImageBitmap(blob);  // 미리보기는 압축된 결과를 다시 그린 것(화질 변화가 보이게)
    if (my !== seq) return;
    cv.getContext("2d").drawImage(shown, 0, 0);
    if (url) URL.revokeObjectURL(url);
    url = URL.createObjectURL(blob);
    link.href = url;
    link.download = f.name.replace(/\.[^.]+$/, "") + (type === "image/webp" ? ".webp" : ".jpg");
    link.hidden = false;
    wrap.replaceChildren(cv);
    msg(blob.size < f.size ? "done" : "bigger", kb(f.size), kb(blob.size));
  }
  ["im-file", "im-type", "im-q", "im-max"].forEach(function (id) { document.getElementById(id).addEventListener("change", run); });
})();
