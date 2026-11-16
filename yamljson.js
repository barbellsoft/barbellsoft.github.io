// YAML↔JSON 변환(yaml-json-converter.html). js-yaml 4.3.2(MIT, vendor/js-yaml.min.js, 전역 jsyaml). 입력은 기기 밖으로
// 보내지 않는다. 읽기는 CORE 스키마 + 병합 키(<<)만 쓴다 — 날짜를 Date 로, !!binary 를 바이트로 바꾸지 않고 글 그대로 두며,
// 사용자 정의 태그는 오류로 낸다. 결과는 textarea.value·textContent 로만 쓴다. toJson·toYaml 은 tests/test_site.py 가 검사한다.
(function () {
  "use strict";
  var MAX_CHARS = 5e6, MAX_OUT = 1e7;  // 입력 글자 수, 펼친 결과의 대략 글자 수(노드마다 들여쓰기 깊이×2 + 4 + JSON 으로 쓴 값·키 길이)
  function fail(code, a, b) { var err = new Error(code); err.code = code; err.a = a; err.b = b; return err; }
  function schemaOf(lib) { return lib.CORE_SCHEMA.extend({ implicit: [lib.types.merge] }); }
  // 별칭(&a·*a)은 같은 객체를 가리켜 JSON 으로 펼치면 몇 배로 커진다(별칭 폭탄) → 펼친 크기(노드 수 + 문자열·키 길이)에 한도.
  // 자기를 품는 별칭(순환)은 JSON 으로 쓸 수 없다. .inf·.nan 은 JSON 에 없다(JSON.stringify 가 null 로 바꿔 버림)
  function check(v) {
    var n = 0, path = new Set();
    (function walk(x, depth) {
      // 객체가 아닌 값은 JSON 으로 쓴 길이 그대로(\x01 → \u0001 같은 이스케이프, 1.2345678901234567e+300 같은 긴 숫자)
      n += depth * 2 + 4 + (x === null || typeof x !== "object" ? JSON.stringify(x).length : 0);
      if (n > MAX_OUT) throw fail("big");
      if (typeof x === "number" && !isFinite(x)) throw fail("inf");
      if (x === null || typeof x !== "object") return;
      if (path.has(x)) throw fail("cycle");
      path.add(x);
      for (var k in x) if (Object.prototype.hasOwnProperty.call(x, k)) { n += JSON.stringify(k).length; walk(x[k], depth + 1); }
      path.delete(x);
    })(v, 0);
  }
  function guard(text) {
    if (text.length > MAX_CHARS) throw fail("big");
    if (!text.trim()) throw fail("empty");
  }
  function toJson(lib, text) {
    guard(text);
    var v;
    try { v = lib.load(text, { schema: schemaOf(lib) }); } catch (err) {
      if (err instanceof RangeError) throw fail("big");
      throw fail("yaml", err.mark ? err.mark.line + 1 : "?", err.reason || err.message);
    }
    try { check(v); } catch (err) { throw err.code ? err : fail("big"); }  // 아주 깊은 중첩은 RangeError
    return JSON.stringify(v, null, 2);
  }
  function toYaml(lib, text) {
    guard(text);
    var v;
    try { v = JSON.parse(text); } catch (err) { throw fail("json", err.message); }
    try { return lib.dump(v, { lineWidth: -1, noRefs: true }); } catch (err) { throw fail("big"); }
  }
  if (typeof module === "object" && module.exports) { module.exports = { toJson: toJson, toYaml: toYaml }; return; }

  var input = document.getElementById("yj-in"), output = document.getElementById("yj-out"), out = document.getElementById("yj-msg");
  if (!input || !output || !out || !window.jsyaml) return;
  var copy = document.getElementById("yj-copy"), label = copy.textContent;
  function msg(k, a, b) {
    out.textContent = out.getAttribute("data-" + k).replace("{a}", function () { return String(a); })
      .replace("{b}", function () { return String(b); });
  }
  function run(json) {
    copy.textContent = label;
    try {
      output.value = json ? toJson(window.jsyaml, input.value) : toYaml(window.jsyaml, input.value);
      msg("done");
    } catch (err) {
      output.value = "";
      msg(err.code || "big", err.a, err.b);
    }
  }
  document.getElementById("yj-tojson").addEventListener("click", function () { run(true); });
  document.getElementById("yj-toyaml").addEventListener("click", function () { run(false); });
  copy.addEventListener("click", function () {
    function done(ok) { copy.textContent = copy.getAttribute(ok ? "data-done" : "data-fail"); }
    if (!output.value) return;
    try { navigator.clipboard.writeText(output.value).then(function () { done(true); }, function () { done(false); }); }
    catch (e) { done(false); }
  });
})();
