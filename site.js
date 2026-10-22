// 테마 선택, 후원·연락 링크(config.js), SHA-256 복사. 외부 라이브러리 없음.
(function () {
  "use strict";
  var cfg = window.SITE_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };

  function isHttps(u) { return typeof u === "string" && /^https:\/\//i.test(u); }

  function initTheme() {
    var sel = $("theme-select");
    if (!sel) return;
    var cur = document.documentElement.getAttribute("data-theme") || "auto";
    sel.value = cur;
    sel.addEventListener("change", function () {
      var v = sel.value;
      if (v === "auto") document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", v);
      try {
        if (v === "auto") localStorage.removeItem("theme"); else localStorage.setItem("theme", v);
      } catch (e) { /* 이번 방문에만 적용 */ }
    });
  }

  function initDonate() {
    var kofi = $("donate-kofi"), bmac = $("donate-bmac"), paypal = $("donate-paypal");
    if (!kofi || !bmac || !paypal) return;
    var shown = [[kofi, cfg.DONATE_KOFI_URL], [bmac, cfg.DONATE_BMAC_URL], [paypal, cfg.DONATE_PAYPAL_URL]].filter(function (p) {
      if (!isHttps(p[1])) return false;
      p[0].href = p[1];
      p[0].hidden = false;
      return true;
    });
    if (!shown.length) { $("donate-soon").hidden = false; return; }
    if (shown.length === 1) shown[0][0].className = "btn btn-primary";  // 하나뿐이면 기본(주색) 모양
  }

  function initContact() {
    var a = $("contact-link");
    var u = cfg.CONTACT_URL;
    if (a && typeof u === "string" && (isHttps(u) || /^mailto:/i.test(u))) {
      a.href = u;
      a.hidden = false;
    }
  }

  function initCopy() {
    Array.prototype.forEach.call(document.querySelectorAll(".sha-copy"), function (b) {
      b.addEventListener("click", function () {
        function fail() { b.textContent = b.getAttribute("data-fail"); }
        try {
          navigator.clipboard.writeText(b.getAttribute("data-sha")).then(function () {
            b.textContent = b.getAttribute("data-done");
          }, fail);
        } catch (e) { fail(); }
      });
    });
  }

  // 방문 통계(GoatCounter): 쿠키 없이 페이지·제목·이전 사이트·화면 크기만 보낸다. 파일로 열거나
  // «추적 안 함»을 켠 브라우저는 세지 않는다. 외부 스크립트 대신 그림 요청 한 번(CSP img-src 에 그 주소만 허용).
  function countVisit() {
    var url = cfg.STATS_URL;
    if (!isHttps(url) || location.protocol !== "https:" || navigator.doNotTrack === "1") return;
    var q = ["p=" + encodeURIComponent(location.pathname), "t=" + encodeURIComponent(document.title),
      "r=" + encodeURIComponent(document.referrer),
      "s=" + encodeURIComponent([screen.width, screen.height, window.devicePixelRatio || 1].join(",")),
      "rnd=" + Math.random().toString(36).slice(2)];
    new Image().src = url + "?" + q.join("&");
  }

  // 내려받기 버튼을 누르면 «/download/파일이름» 이벤트를 한 번 더 센다 — 어느 나라에서 받는지 보려고(쿠키 없음, 같은 조건).
  function countDownloads() {
    var url = cfg.STATS_URL;
    if (!isHttps(url) || location.protocol !== "https:" || navigator.doNotTrack === "1") return;
    document.addEventListener("click", function (ev) {
      var a = ev.target.closest && ev.target.closest('a[href*="/releases/download/"]');
      if (!a) return;
      var name = a.getAttribute("href").split("/").pop();
      new Image().src = url + "?e=true&p=" + encodeURIComponent("/download/" + name) +
        "&t=" + encodeURIComponent(name) + "&rnd=" + Math.random().toString(36).slice(2);
    });
  }

  initTheme();
  initDonate();
  initContact();
  initCopy();
  countVisit();
  countDownloads();
})();
