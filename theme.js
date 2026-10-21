// 고른 테마(다크·라이트)를 그리기 전에 적용한다. 고르지 않았으면 시스템 설정을 따른다(CSS).
(function () {
  try {
    var v = localStorage.getItem("theme");
    if (v === "dark" || v === "light") document.documentElement.setAttribute("data-theme", v);
  } catch (e) { /* 저장소를 못 쓰면 시스템 설정 */ }
})();
