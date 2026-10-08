// 직원 근무 앱 데모 HTML 의 동작. 옛 React 데모(src/app/demo)가 useState 로 바꾸던 것을 같은 클래스로 바꾼다.
// 마크업은 docs/demo/src/ui.mjs 가 그린다 — 여기서 찾는 단서(data-*·role·aria)와 클래스 문자열은 그 파일과 같아야 한다.
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
