// 사이트 설정. 값이 비어 있으면 해당 요소를 만들지 않고 «곧 열립니다» 로 표시한다(가짜 링크 금지).
window.SITE_CONFIG = {
  DONATE_KOFI_URL: "",  // Ko-fi 후원 페이지 주소(https://ko-fi.com/아이디). 10-21: 실제 페이지는 ko-fi.com/saebulls 이고 결제 설정 전이라 비움(버튼 숨김)
  DONATE_BMAC_URL: "https://buymeacoffee.com/barbellsoft",  // Buy Me a Coffee(2026-10-19 사용자 연결)
  DONATE_PAYPAL_URL: "",  // PayPal 후원 주소(https://). 값이 비면 해당 버튼은 만들지 않는다
  STATS_URL: "https://barbellsoft.goatcounter.com/count",  // 방문 통계(GoatCounter, 쿠키 없음, 2026-10-21). 비우면 세지 않는다
  CONTACT_URL: "mailto:softbarbell@gmail.com",  // 맨 아래 «Contact» 링크. 10-21 깃허브 이슈 → 브랜드 메일(계정 없는 사람도 문의). About 에도 주소를 보인다
};
