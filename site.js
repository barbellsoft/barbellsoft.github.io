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

  // 이벤트 한 번 세기(쿠키 없음, 방문과 같은 조건)
  function countEvent(p, t) {
    var url = cfg.STATS_URL;
    if (!isHttps(url) || location.protocol !== "https:" || navigator.doNotTrack === "1") return;
    new Image().src = url + "?e=true&p=" + encodeURIComponent(p) +
      "&t=" + encodeURIComponent(t) + "&rnd=" + Math.random().toString(36).slice(2);
  }

  // 내려받기 버튼을 누르면 «/download/파일이름» 이벤트를 한 번 더 센다 — 어느 나라에서 받는지 보려고.
  function countDownloads() {
    document.addEventListener("click", function (ev) {
      var a = ev.target.closest && ev.target.closest('a[href*="/releases/download/"]');
      if (!a) return;
      var name = a.getAttribute("href").split("/").pop();
      countEvent("/download/" + name, name);
    });
  }

  // 휴대폰으로 열면 «컴퓨터용이라 설치할 수 없음» 안내와 «내게 링크 보내기»(공유 창, 없으면 주소 복사)를 보이고
  // 다운로드 단추는 보조 모양으로 낮춘다 — 휴대폰에서 강조할 행동은 링크 보내기 하나. 누르면 «/send-link» 로 센다.
  function initPhone() {
    var box = $("dl-phone"), btn = $("dl-phone-send");
    if (!box || !btn || !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return;
    box.hidden = false;
    Array.prototype.forEach.call(document.querySelectorAll('.actions a.btn-primary[href*="/releases/download/"]'), function (a) {
      a.className = a.className.replace("btn-primary", "btn-outline");
    });
    btn.addEventListener("click", function () {
      countEvent("/send-link", location.pathname);
      if (navigator.share) {
        navigator.share({ title: document.title, url: location.href }).catch(function () { /* 공유 창을 닫음 */ });
        return;
      }
      function fail() { btn.textContent = btn.getAttribute("data-fail"); }
      try {
        navigator.clipboard.writeText(location.href).then(function () {
          btn.textContent = btn.getAttribute("data-done");
        }, fail);
      } catch (e) { fail(); }
    });
  }

  // 다운로드 링크를 누르면 숨겨 둔 후원 안내(#dl-thanks)를 보인다. 파일만 받아지고 페이지는 그대로라 그 자리에 남는다.
  // 다운로드 페이지에선 누른 단추 바로 아래로 옮긴다(맥 설치 안내가 길어 맨 아래에 두면 Windows 단추에서 안 보인다).
  function initThanks() {
    var box = $("dl-thanks");
    if (!box) return;
    document.addEventListener("click", function (ev) {
      var a = ev.target.closest && ev.target.closest('a[href*="/releases/download/"]');
      if (!a) return;
      var row = a.closest(".actions");
      if (row) row.parentNode.insertBefore(box, row.nextSibling);
      box.hidden = false;
    });
  }

  initTheme();
  initDonate();
  initThanks();
  initPhone();
  initContact();
  initCopy();
  countVisit();
  countDownloads();
})();
