// 직원 근무 앱 데모 HTML 의 동작. 옛 React 데모(src/app/demo)가 useState 로 바꾸던 것을 같은 클래스로 바꾼다.
// 마크업은 docs/demo/src/ui.mjs 가 그린다 — 여기서 찾는 단서(data-*·role·aria)와 클래스 문자열은 그 파일과 같아야 한다.
// 화면 조각은 공통 동작보다 먼저 듣는다(근로계약 거부 사유는 시트가 닫히기 전에 읽어야 한다). 선택자가 그 화면 마크업에만 맞는다.
// ── 화면 조각: attendance (출퇴근 현황) ──
// 출퇴근 현황 데모의 기간별 날짜 칸. 한 번에 고를 수 있는 폭이 1년이라 시작일·종료일 서로의 min·max 를 1년으로 묶는다
// (옛 React 판 PeriodView 의 shiftYear). staff.js 단서로는 칸끼리 값을 주고받을 수 없어 여기 둔다.
// ponytail: 문자열의 연도만 바꾼다. 2월 29일이면 max 가 없는 날짜가 되어 브라우저가 제한을 무시한다.
(() => {
  const shiftYear = (date, years) => `${Number(date.slice(0, 4)) + years}${date.slice(4)}`;
  document.addEventListener("input", (e) => {
    if (!e.target.matches("input[type=date]")) return;
    const [from, to] = e.target.parentElement.querySelectorAll("input[type=date]");
    from.min = shiftYear(to.value, -1);
    from.max = to.value;
    to.min = from.value;
    to.max = shiftYear(from.value, 1);
  });
})();

// ── 화면 조각: contract (근로계약) ──
// 근로계약 데모에서 staff.js 단서로 못 하는 것 둘.
// 1) 서명란(옛 signature-pad.tsx). 손가락·펜·마우스로 실제로 그린다. 서명란(sign)에서 첫 획을 마치면 서명 뒤(sign-drawn)로 간다 —
//    같은 화면이라 슬라이드 없이 주소만 바꾸고, 블록이 새로 그려지니 그린 것을 옮겨 그린다. 그린 적 없이 서명 뒤로 들어오면(상태 도구) 목업의 견본 서명.
//    다시 그리기(data-redraw)는 서명란으로 주소만 바꾼다(빈 캔버스).
// 2) 거부 사유 시트에 적은 글을 거부 완료 화면의 「거부 사유」 칸에 넣는다. 거부 확정 전에는 견본 문구 그대로.
// ponytail: 캔버스 해상도는 상태가 보일 때 한 번만 맞춘다. 화면 폭이 바뀌면 선이 늘어나 보인다.
(() => {
  const SAMPLE =
    "M14 58c14-30 26-40 30-30s-12 40-4 38 22-44 30-40-6 34 2 34 18-26 24-24-2 20 6 20 14-14 22-14 10 10 20 8 30-10 44-12M60 72c40-4 90-6 150-8";
  let carried = null; // 서명란에서 그린 그림(서명 뒤로 옮겨 갈 것)
  let submitted = null; // 거부 확정 때 적은 사유
  let last = null;

  const canvasOf = (id) => document.querySelector(`[data-state="${id}"] canvas`);
  const setup = (canvas) => {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * ratio;
    canvas.height = canvas.clientHeight * ratio;
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = getComputedStyle(canvas).color;
    return ctx;
  };

  document.addEventListener("demo:state", ({ detail: id }) => {
    if (id === "sign") setup(canvasOf("sign"));
    if (id === "sign-drawn") {
      const canvas = canvasOf("sign-drawn");
      const ctx = setup(canvas);
      if (carried) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(carried, 0, 0);
        ctx.restore();
      } else {
        // 목업 SVG(viewBox 240×90)를 220×82 로 가운데에 그린다.
        ctx.save();
        ctx.translate((canvas.clientWidth - 220) / 2, (canvas.clientHeight - 82) / 2);
        ctx.scale(220 / 240, 220 / 240);
        ctx.stroke(new Path2D(SAMPLE));
        ctx.restore();
      }
    }
    carried = null;
    if (id === "rejected" && submitted !== null) {
      const box = document.querySelector('[data-state="rejected"] p.pb-\\[6px\\]').parentElement;
      box.lastChild.textContent = submitted || "사유를 남기지 않았습니다.";
    }
  });

  const pointOf = (e) => {
    const r = e.target.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const line = (canvas, to) => {
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    last = to;
  };
  document.addEventListener("pointerdown", (e) => {
    if (!e.target.matches("canvas")) return;
    e.target.setPointerCapture(e.pointerId);
    last = pointOf(e);
    line(e.target, last); // 눌렀다 떼기만 해도 점이 남는다
  });
  document.addEventListener("pointermove", (e) => {
    if (last && e.target.matches("canvas")) line(e.target, pointOf(e));
  });
  const up = (e) => {
    if (!last) return;
    last = null;
    if (e.target.closest?.('[data-state="sign"]')) {
      carried = e.target;
      location.hash = "sign-drawn"; // staff.js 가 hashchange 로 슬라이드 없이 옮긴다
    }
  };
  document.addEventListener("pointerup", up);
  document.addEventListener("pointercancel", up);

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-redraw]")) location.hash = "sign";
    // staff.js 보다 먼저 듣는다(이 스크립트가 먼저 실행된다) — 시트가 닫히고 상태가 바뀌기 전에 사유를 읽는다.
    const confirm = e.target.closest('dialog [data-go="rejected"]');
    if (confirm) submitted = confirm.closest("dialog").querySelector("textarea").value.trim();
  });
})();

// ── 화면 조각: notify (알림) ──
// 알림 데모: 줄마다 왼쪽 점을 눌러 읽음을 바꾸고(S-IMFWJT), 「모두 읽음」으로 한꺼번에 읽음(NOTI-7). 미확인 수와 버튼 켜짐을 맞춘다.
// 줄을 눌러 관련 화면으로 갈 때 읽음 처리는 화면을 떠나 다시 오면 처음으로 돌아가므로(React 판과 같음) 따로 하지 않는다.
(() => {
  const SEL = '[data-state="inbox"] ul > li > button[aria-pressed]';
  const DOT = { unread: "bg-staff-primary", urgent: "bg-[#c24242]", read: "border border-staff-border" };
  const urgent = new WeakMap();
  const setRow = (btn, unread) => {
    const dot = btn.firstElementChild;
    const title = btn.nextElementSibling.querySelector("span.flex-col > span");
    const icon = btn.nextElementSibling.firstElementChild;
    const name = title.textContent;
    dot.classList.remove(...`${DOT.unread} ${DOT.urgent} ${DOT.read}`.split(" "));
    dot.classList.add(...(unread ? (urgent.get(btn) ? DOT.urgent : DOT.unread) : DOT.read).split(" "));
    btn.setAttribute("aria-pressed", String(!unread));
    btn.setAttribute("aria-label", unread ? `${name} 읽음으로 표시` : `${name} 안 읽음으로 표시`);
    title.classList.replace(unread ? "text-staff-text-muted" : "text-staff-text", unread ? "text-staff-text" : "text-staff-text-muted");
    icon.classList.replace(unread ? "text-staff-placeholder" : "text-staff-text", unread ? "text-staff-text" : "text-staff-placeholder");
  };
  const refresh = () => {
    const rows = [...document.querySelectorAll(SEL)];
    const n = rows.filter((b) => b.getAttribute("aria-pressed") === "false").length;
    const head = document.querySelector('[data-state="inbox"] main > div');
    head.firstElementChild.textContent = `미확인 ${n}건`;
    head.lastElementChild.disabled = n === 0;
  };
  const init = () => document.querySelectorAll(SEL).forEach((b) => urgent.set(b, b.firstElementChild.classList.contains(DOT.urgent)));
  document.addEventListener("demo:state", (e) => e.detail === "inbox" && init());
  init();
  document.addEventListener("click", (e) => {
    const row = e.target.closest(SEL);
    if (row) {
      setRow(row, row.getAttribute("aria-pressed") === "true");
      return refresh();
    }
    const all = e.target.closest('[data-state="inbox"] main > div > button');
    if (all && !all.disabled) {
      document.querySelectorAll(SEL).forEach((b) => setRow(b, false));
      refresh();
    }
  });
})();

// ── 화면 조각: tax (신고 정보) ──
(() => {
// 신고 정보 데모: 입력 화면의 뒤로 가기는 들어온 곳(안내 또는 등록된 값)으로 돌아간다(React 판 formFrom).
// staff.js 는 상태를 옮길 때 블록을 처음 모양으로 되그리므로 demo:state 뒤에 뒤로 가기 단서를 바꾼다.
  let from = "intro";
  document.addEventListener("click", (e) => {
  if (e.target.closest('[data-go="form"]')) from = e.target.closest("[data-state]").dataset.state;
}, true);
  document.addEventListener("demo:state", (e) => {
  if (e.detail === "form") document.querySelector('[data-state="form"] [data-dir="nav-back"]').dataset.go = from;
});
})();

// ── 공통 동작 ──
(() => {
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const swap = (el, on, onCls, offCls) => {
    if (!el) return;
    el.classList.remove(...(on ? offCls : onCls).split(" ").filter(Boolean));
    el.classList.add(...(on ? onCls : offCls).split(" ").filter(Boolean));
  };
  const blocks = $$("[data-state]");
  const ids = blocks.map((b) => b.dataset.state);
  const current = () => {
    const h = decodeURIComponent(location.hash.slice(1));
    return ids.includes(h) ? h : ids[0];
  };
  const activeBlock = () => blocks.find((b) => !b.hidden);

  // ── 토스트(use-toast). 2초 뒤 사라진다. ──
  const toastBox = document.querySelector("[data-toast-box]");
  let toastTimer;
  const toast = (msg) => {
    if (!toastBox || !msg) return;
    toastBox.textContent = msg;
    toastBox.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastBox.hidden = true), 2000);
  };

  // ── 시트(bottom-sheet). 네이티브 <dialog> ──
  const openSheet = (d) => d && !d.open && d.showModal();
  // 닫힐 때 옮겨 갈 곳(data-on-close): "#상태" 면 같은 화면 상태, 그 밖은 다른 화면 주소.
  const closeSheet = (d) => {
    if (!d || !d.open) return;
    d.close();
    const to = d.dataset.onClose;
    if (to) to.startsWith("#") ? go(to.slice(1), "nav-back") : (location.href = to);
  };
  document.addEventListener("cancel", (e) => {
    if (e.target.matches("dialog[data-sheet]")) {
      e.preventDefault();
      closeSheet(e.target);
    }
  }, true);

  // ── 상태(use-demo-state). 주소 #상태 와 같이 움직인다. ──
  // 보이는 블록이 바뀌면 그 안의 data-sheet-auto 시트를 열고, 블록 밖으로 나간 시트는 닫는다.
  // 입력·체크·스위치·고르기는 처음 그린 모양으로 되돌린다 — React 판은 상태를 옮기면 화면을 새로 그렸다.
  const pristine = new Map(blocks.map((b) => [b, b.innerHTML]));
  function show(id) {
    for (const b of blocks) {
      const on = b.dataset.state === id;
      if (on && b.hidden) {
        b.innerHTML = pristine.get(b);
        b.hidden = false;
      } else if (!on && !b.hidden) {
        $$("dialog[open]", b).forEach((d) => d.close());
        b.hidden = true;
      }
    }
    const i = ids.indexOf(id);
    const tool = document.querySelector("[data-demo-states]");
    if (tool) {
      tool.querySelector("[data-demo-count]").textContent = `상태 ${i + 1}/${ids.length}`;
      $$("[data-demo-pick]", tool).forEach((btn) => {
        const on = btn.dataset.demoPick === id;
        btn.setAttribute("aria-current", String(on));
        if (on) tool.querySelector("[data-demo-label]").textContent = btn.dataset.label;
      });
    }
    $$("dialog[data-sheet-auto]", activeBlock()).forEach(openSheet);
    document.dispatchEvent(new CustomEvent("demo:state", { detail: id }));
  }

  // go(id, 방향): 방향 슬라이드(globals.css 의 .nav-forward·.nav-back)를 붙여 옮기고 주소를 맞춘다.
  // 주소만 바뀐 것(브라우저 뒤로 가기·주소 직접 입력)은 슬라이드 없이 따라간다.
  let moving = false;
  function go(id, dir = "nav-forward") {
    if (!ids.includes(id)) return;
    const apply = () => {
      moving = true;
      if (location.hash.slice(1) !== id) location.hash = id;
      show(id);
      moving = false;
      scrollTo(0, 0);
    };
    if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) return apply();
    const tag = (on) => {
      const el = activeBlock()?.firstElementChild;
      if (!el) return;
      el.style.viewTransitionName = on ? "staff-page" : "";
      el.style.viewTransitionClass = on ? dir : "";
    };
    tag(true);
    const t = document.startViewTransition(() => {
      tag(false);
      apply();
      tag(true);
    });
    t.finished.finally(() => tag(false));
  }
  addEventListener("hashchange", () => !moving && show(current()));

  // ── 누르기 ──
  document.addEventListener("click", (e) => {
    const t = e.target.closest("button, a, [data-go], [data-open], [data-toast], [data-set]");
    if (!t || t.disabled) return;

    // 상태 전환 도구
    if (t.dataset.demoPick) {
      t.closest("details").open = false;
      return go(t.dataset.demoPick);
    }
    // 시트 안 dialog 자신을 누른 것은 뒤 화면을 누른 것이다.
    if (t.dataset.set) {
      for (const pair of t.dataset.set.split("|")) {
        const [slot, text] = pair.split("=");
        $$(`[data-slot="${slot}"]`).forEach((el) => (el.textContent = text));
      }
    }
    if (t.dataset.toast) toast(t.dataset.toast);
    if (t.matches("[data-pick] > *")) pick(t);
    if (t.role === "switch") {
      const on = t.getAttribute("aria-checked") !== "true";
      t.setAttribute("aria-checked", String(on));
      swap(t, on, "bg-staff-primary", "bg-staff-primary-inactive");
      t.firstElementChild?.classList.toggle("translate-x-[20px]", on);
      if (t.dataset.toastOn && on) toast(t.dataset.toastOn);
      if (t.dataset.toastOff && !on) toast(t.dataset.toastOff);
    }
    if (t.dataset.open) {
      const d = (activeBlock() || document).querySelector(`dialog[data-sheet="${t.dataset.open}"]`) || document.querySelector(`dialog[data-sheet="${t.dataset.open}"]`);
      openSheet(d);
    }
    if (t.hasAttribute("data-close")) {
      const d = t.closest("dialog");
      // data-go 와 함께 오면 그 상태로 옮기므로 닫힐 때 옮길 곳은 쓰지 않는다.
      if (t.dataset.go || t.tagName === "A") d?.close();
      else closeSheet(d);
    }
    if (t.dataset.go) {
      e.preventDefault();
      go(t.dataset.go, t.dataset.dir || "nav-forward");
    }
  });
  // 시트 바깥(::backdrop) 누르기
  document.addEventListener("click", (e) => {
    if (e.target.matches("dialog[data-sheet]")) closeSheet(e.target);
  });

  // 고르기 묶음: 누른 칸만 켜고(data-on) 나머지는 끈다(data-off). data-show 가 있으면 그 내용만 보인다.
  function pick(btn) {
    const group = btn.parentElement;
    for (const b of group.children) {
      const on = b === btn;
      if (b.dataset.on !== undefined) swap(b, on, b.dataset.on, b.dataset.off);
      if (b.hasAttribute("aria-pressed")) b.setAttribute("aria-pressed", String(on));
      if (b.hasAttribute("aria-selected")) {
        b.setAttribute("aria-selected", String(on));
        if (on && b.dataset.show) b.setAttribute("aria-controls", b.dataset.show);
        else b.removeAttribute("aria-controls");
      }
      b.querySelector("img[src$='check-sub.svg']")?.classList.toggle("hidden", !on);
      b.querySelectorAll("[data-pick-only]").forEach((el) => el.classList.toggle("hidden", !on));
      // 주간 날짜 칸: 고르지 않은 날의 근무 시간 글자만 남보라
      b.querySelector("[data-note]")?.classList.toggle("text-staff-primary", !on);
      if (b.dataset.show) {
        const panel = document.getElementById(b.dataset.show);
        if (panel) panel.hidden = !on;
      }
    }
  }

  // ── 체크칸(TodoItem · CheckBox) ──
  document.addEventListener("change", (e) => {
    const box = e.target;
    const label = box.closest("label[data-check]");
    if (label) {
      swap(label, box.checked, "bg-staff-primary", "bg-staff-primary-inactive");
      const mark = label.querySelector("img");
      mark.src = mark.src.replace(/todo-check-(on|off)/, box.checked ? "todo-check-on" : "todo-check-off");
      const title = label.parentElement.querySelector("[data-check-title]");
      if (title) swap(title, box.checked, "text-staff-text-muted", "text-staff-text");
      if (box.checked && box.dataset.toastOn) toast(box.dataset.toastOn);
      if (!box.checked && box.dataset.toastOff) toast(box.dataset.toastOff);
    }
    gate();
  });
  document.addEventListener("input", () => gate());

  // ── 켜짐 조건(data-gate). 같은 상태 블록 안의 data-need 체크칸이 모두 켜져야 버튼이 켜진다. ──
  function gate() {
    const b = activeBlock();
    if (!b) return;
    for (const btn of $$("[data-gate]", b)) {
      const need = $$(`[data-need="${btn.dataset.gate}"]`, b);
      btn.disabled = !need.every((el) => (el.type === "checkbox" ? el.checked : el.value.trim() !== ""));
    }
  }

  show(current());
  gate();
  window.demo = { go, toast, show, gate };
})();
