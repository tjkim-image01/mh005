/* 뷰어 4장이 공유하는 UI 조각. 화면마다 다시 쓰지 않는다. */

const ReaderUI = {
  /** 읽기 설정 패널을 주어진 컨테이너에 그린다. 바꾸면 즉시 반영·저장된다. */
  settingsPanel(host) {
    const p = Novel.prefs();
    host.innerHTML = `
      <div class="settings-row">
        <span class="lbl">글자 크기</span>
        <div class="seg" data-k="size">
          ${[1, 2, 3, 4, 5].map((v) =>
            `<button data-v="${v}" aria-pressed="${p.size == v}" style="font-size:${10 + v * 2}px">가</button>`).join("")}
        </div>
      </div>
      <div class="settings-row">
        <span class="lbl">행간</span>
        <div class="seg" data-k="lead">
          ${["좁게", "보통", "넓게"].map((t, i) =>
            `<button data-v="${i}" aria-pressed="${p.lead == i}">${t}</button>`).join("")}
        </div>
      </div>
      <div class="settings-row">
        <span class="lbl">테마</span>
        <div class="seg" data-k="theme">
          ${[["ink", "먹"], ["sepia", "양피지"], ["night", "야간"]].map(([v, t]) =>
            `<button class="swatch" data-t="${v}" data-v="${v}" aria-pressed="${p.theme === v}" aria-label="${t}"></button>`).join("")}
        </div>
      </div>
      <div class="settings-row">
        <span class="lbl">서체</span>
        <div class="seg" data-k="serif">
          <button data-v="1" aria-pressed="${p.serif}" style="font-family:var(--serif)">명조</button>
          <button data-v="0" aria-pressed="${!p.serif}" style="font-family:var(--sans)">고딕</button>
        </div>
      </div>`;

    host.querySelectorAll(".seg").forEach((seg) => {
      seg.addEventListener("click", (e) => {
        const b = e.target.closest("button[data-v]");
        if (!b) return;
        const k = seg.dataset.k;
        const cur = Novel.prefs();
        cur[k] = k === "serif" ? b.dataset.v === "1" : k === "theme" ? b.dataset.v : Number(b.dataset.v);
        Novel.savePrefs(cur);
        Novel.apply(cur);
        seg.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b));
      });
    });
  },

  /** 회차 목록. href 생성기를 받아 소설/웹툰 어느 쪽에서도 쓴다. 막 단위로 묶는다. */
  episodeList(host, current, href, opts = {}) {
    const row = (e) => {
      const blocked = opts.requireCuts && !e.webtoonReady;
      const cls = `ep-row${e.ep === current ? " current" : ""}`;
      const inner = `
        <span class="n">${e.ep}화</span>
        <span class="t">${e.title.replace(/^\d+화\s*—\s*/, "")}</span>
        ${blocked ? '<span class="badge mute" style="margin-left:auto">준비 중</span>'
                  : `<span style="margin-left:auto;font-size:11px;opacity:.55">${opts.requireCuts ? e.scriptCuts + "컷" : e.minutes + "분"}</span>`}`;
      return blocked
        ? `<div class="${cls}" style="opacity:.4" aria-disabled="true">${inner}</div>`
        : `<a class="${cls}" href="${href(e.ep)}">${inner}</a>`;
    };
    const groups = Series.byAct();
    host.innerHTML = groups.map((g) =>
      (groups.length > 1 ? `<div class="grp">${g.name}</div>` : "") + g.eps.map(row).join("")
    ).join("");

    // 17화를 넘어가면 현재 회차가 스크롤 아래로 숨는다. 열자마자 보이게 끌어온다.
    const cur = host.querySelector(".ep-row.current");
    if (cur) {
      const off = cur.offsetTop - host.clientHeight / 2 + cur.clientHeight / 2;
      host.scrollTop = Math.max(0, off);
    }
  },

  /** 바텀시트 여닫기. 여러 버튼이 같은 시트를 토글한다. */
  sheet(sheet, backdrop, toggles) {
    const set = (open) => {
      sheet.classList.toggle("open", open);
      backdrop.classList.toggle("open", open);
      document.body.style.overflow = open ? "hidden" : "";
    };
    const api = {
      open: () => set(true),
      close: () => set(false),
      toggle: () => set(!sheet.classList.contains("open")),
    };
    toggles.filter(Boolean).forEach((b) => b.addEventListener("click", api.toggle));
    backdrop.addEventListener("click", api.close);
    document.addEventListener("keydown", (e) => e.key === "Escape" && api.close());
    return api;
  },

  /** 회차 끝의 다음화·교차 링크. 마지막 화와 미작화는 비활성으로 떨어뜨린다. */
  endLinks(meta, ep, href, crossFile, nextEl, crossEl) {
    if (ep < Series.count()) {
      nextEl.href = href(ep + 1);
      nextEl.textContent = `${ep + 1}화 이어 읽기`;
    } else {
      nextEl.classList.add("off");
      nextEl.textContent = "1막 완결";
    }
    if (!crossEl) return;
    const isWebtoonTarget = crossFile.startsWith("webtoon");
    const ready = isWebtoonTarget ? meta.webtoonReady : true;
    if (ready) {
      crossEl.href = `${crossFile}?ep=${ep}`;
    } else {
      crossEl.classList.add("off");
      crossEl.textContent = "웹툰 작화 준비 중";
    }
  },

  /** 내려가면 UI 를 숨기고, 올리거나 본문을 탭하면 되돌린다. */
  autoHide(bars, pct, tapTarget) {
    let last = window.scrollY;
    let hidden = false;
    const set = (h) => {
      if (h === hidden) return;
      hidden = h;
      bars.filter(Boolean).forEach((b) => b.classList.toggle("hidden", h));
      if (pct) pct.classList.toggle("hidden", h);
    };
    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      if (Math.abs(y - last) > 12) {
        set(y > last && y > 160);
        last = y;
      }
    }, { passive: true });
    if (tapTarget) {
      tapTarget.addEventListener("click", (e) => {
        if (e.target.closest("a,button")) return;
        set(!hidden);
      });
    }
  },

  /** 좌우 = 회차, T = 테마 순환. 입력 중일 때는 무시한다. */
  keys(handlers) {
    const themes = ["ink", "sepia", "night"];
    document.addEventListener("keydown", (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
      if (e.key === "ArrowLeft" && handlers.prev) handlers.prev();
      else if (e.key === "ArrowRight" && handlers.next) handlers.next();
      else if (e.key === "t" || e.key === "T") {
        const p = Novel.prefs();
        p.theme = themes[(themes.indexOf(p.theme) + 1) % themes.length];
        Novel.savePrefs(p);
        Novel.apply(p);
        document.querySelectorAll('.seg[data-k="theme"] button').forEach((b) =>
          b.setAttribute("aria-pressed", b.dataset.v === p.theme));
      } else if (handlers.extra) handlers.extra(e);
    });
  },
};
