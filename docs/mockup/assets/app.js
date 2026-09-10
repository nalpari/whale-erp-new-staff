/* WHALE ERP 직원 앱 목업 — 공용 동작
   ────────────────────────────────────────────────────────────────
   목업이지만 눌리는 것은 실제로 눌린다. 회의에서 화면을 넘겨 가며
   "여기서 이걸 누르면 어디로 가느냐"를 그 자리에서 확인하려고 만들었다.

   쓰는 법 (HTML 속성으로만 붙인다)
     data-state="ready"        폰의 시작 상태. .phone 에 붙인다.
     data-when="ready done"    그 상태일 때만 보이는 요소
     data-unless="done"        그 상태에서는 숨는 요소
     data-go="done"            누르면 상태를 바꾸는 버튼
     data-go-back               누르면 직전 상태로
     data-toast="저장했습니다"   누르면 폰 안에 토스트
     data-sheet="c1"           누르면 그 시트를 연다
     data-sheet-close          시트를 닫는다
     data-clock                실시간 시계 (상태바)
     data-tick                 누르면 켜지고 꺼지는 스위치·체크
   ──────────────────────────────────────────────────────────────── */
(function () {
  "use strict";

  /* ── 상태 ──────────────────────────────────────────────────── */

  var history = [];

  function phoneOf(el) {
    return el.closest(".phone") || document.querySelector(".phone");
  }

  function apply(phone) {
    var state = phone.dataset.state || "";
    phone.querySelectorAll("[data-when]").forEach(function (el) {
      el.hidden = el.dataset.when.split(/\s+/).indexOf(state) === -1;
    });
    phone.querySelectorAll("[data-unless]").forEach(function (el) {
      el.hidden = el.dataset.unless.split(/\s+/).indexOf(state) !== -1;
    });
    document.querySelectorAll(".sw-b[data-state]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.state === state));
    });
    var name = document.querySelector("[data-state-name]");
    if (name) {
      var on = document.querySelector('.sw-b[data-state="' + state + '"]');
      name.textContent = on ? on.querySelector(".sw-b__t").textContent : state;
    }
  }

  function setState(phone, next, remember) {
    if (!phone || !next) return;
    if (remember !== false && phone.dataset.state) history.push(phone.dataset.state);
    phone.dataset.state = next;
    apply(phone);
  }

  /* ── 토스트 ────────────────────────────────────────────────── */

  function toast(phone, msg) {
    var old = phone.querySelector(".toast[data-live]");
    if (old) old.remove();
    var t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("data-live", "");
    t.innerHTML = '<i class="ph-fill ph-check-circle"></i><span></span>';
    t.querySelector("span").textContent = msg;
    phone.appendChild(t);
    setTimeout(function () {
      t.remove();
    }, 2600);
  }

  /* ── 시트 ──────────────────────────────────────────────────── */

  function openSheet(phone, id) {
    closeSheet(phone);
    var sheet = phone.querySelector('[data-sheet-id="' + id + '"]');
    if (!sheet) return;
    var scrim = document.createElement("div");
    scrim.className = "scrim";
    scrim.setAttribute("data-live-scrim", "");
    scrim.addEventListener("click", function () {
      closeSheet(phone);
    });
    phone.appendChild(scrim);
    sheet.hidden = false;
    phone.appendChild(sheet);
  }

  function closeSheet(phone) {
    var s = phone.querySelector("[data-live-scrim]");
    if (s) s.remove();
    phone.querySelectorAll("[data-sheet-id]").forEach(function (el) {
      el.hidden = true;
    });
  }

  /* ── 시계 ──────────────────────────────────────────────────── */

  function clock() {
    var els = document.querySelectorAll("[data-clock]");
    if (!els.length) return;
    function paint() {
      var d = new Date();
      var hh = String(d.getHours()).padStart(2, "0");
      var mm = String(d.getMinutes()).padStart(2, "0");
      els.forEach(function (el) {
        el.textContent = hh + ":" + mm;
      });
    }
    paint();
    setInterval(paint, 10000);
  }

  /* ── 배선 ──────────────────────────────────────────────────── */

  document.addEventListener("click", function (e) {
    var t = e.target.closest(
      "[data-go], [data-go-back], [data-toast], [data-sheet], [data-sheet-close], [data-tick]"
    );
    if (!t) return;

    var phone = phoneOf(t);

    if (t.hasAttribute("data-tick")) {
      if (t.classList.contains("sw")) {
        if (!t.classList.contains("is-lock")) t.classList.toggle("is-on");
      } else {
        t.classList.toggle("is-on");
        t.innerHTML = t.classList.contains("is-on") ? '<i class="ph-bold ph-check"></i>' : "";
      }
      return;
    }

    if (t.hasAttribute("data-sheet-close")) {
      closeSheet(phone);
      if (t.dataset.go) setState(phone, t.dataset.go);
      return;
    }

    if (t.dataset.sheet) {
      openSheet(phone, t.dataset.sheet);
      return;
    }

    if (t.hasAttribute("data-go-back")) {
      var prev = history.pop();
      if (prev) setState(phone, prev, false);
      return;
    }

    if (t.dataset.toast) {
      toast(phone, t.dataset.toast);
    }

    if (t.dataset.go) {
      closeSheet(phone);
      setState(phone, t.dataset.go);
    }
  });

  /* 상태 고르는 버튼 (폰 바깥) */
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".sw-b[data-state]");
    if (!b) return;
    var phone = document.querySelector(".phone");
    closeSheet(phone);
    setState(phone, b.dataset.state);
  });

  /* 숫자키로 상태 넘기기 — 회의에서 빠르게 */
  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
    var n = parseInt(e.key, 10);
    if (!n) return;
    var b = document.querySelectorAll(".sw-b[data-state]")[n - 1];
    if (b) b.click();
  });

  /* ── 시작 ──────────────────────────────────────────────────── */

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".phone").forEach(apply);
    document.querySelectorAll("[data-sheet-id]").forEach(function (el) {
      el.hidden = true;
    });
    clock();
  });
})();
