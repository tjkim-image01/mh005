/* 소설 뷰어 공용 엔진 — 모바일·PC 가 같이 쓴다.
 * 로딩: assets/novel/epNN.js 를 <script> 로 동적으로 붙인다.
 *       fetch 를 쓰지 않는 이유 — file:// 로 열어도 동작해야 하기 때문.
 */
window.NOVEL_EP = window.NOVEL_EP || {};

const Novel = {
  KEY: "mh005.novel",

  /** 회차 본문을 불러온다. 이미 있으면 즉시 콜백. */
  load(ep, done, fail) {
    if (window.NOVEL_EP[ep]) return done(window.NOVEL_EP[ep]);
    const s = document.createElement("script");
    s.src = `assets/novel/ep${String(ep).padStart(2, "0")}.js`;
    s.onload = () =>
      window.NOVEL_EP[ep] ? done(window.NOVEL_EP[ep]) : fail && fail();
    s.onerror = () => fail && fail();
    document.head.appendChild(s);
  },

  /** 씬 배열 → 본문 HTML. 씬 사이는 ◈ 문양으로 끊는다. */
  render(data) {
    return data.scenes
      .map((scene, i) =>
        `<section class="scene" data-scene="${i + 1}">` +
        (i ? '<div class="sep" aria-hidden="true">◈</div>' : "") +
        scene.map((p) => `<p>${Novel.esc(p)}</p>`).join("") +
        `</section>`
      )
      .join("");
  },

  esc(s) {
    return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  },

  /* ---- 읽기 설정 ---- */
  defaults: { size: 2, lead: 1, theme: "ink", serif: true },

  prefs() {
    try {
      return { ...Novel.defaults, ...JSON.parse(localStorage.getItem(Novel.KEY + ".prefs") || "{}") };
    } catch {
      return { ...Novel.defaults };
    }
  },

  savePrefs(p) {
    try { localStorage.setItem(Novel.KEY + ".prefs", JSON.stringify(p)); } catch {}
  },

  /** 설정을 <html> 의 data-* 로 반영한다. CSS 가 나머지를 한다. */
  apply(p) {
    const r = document.documentElement;
    r.dataset.size = p.size;
    r.dataset.lead = p.lead;
    r.dataset.theme = p.theme;
    r.dataset.font = p.serif ? "serif" : "sans";
  },

  /* ---- 읽던 위치 ---- */
  savePos(ep, ratio) {
    try {
      const all = JSON.parse(localStorage.getItem(Novel.KEY + ".pos") || "{}");
      all[ep] = Math.round(ratio * 1000) / 1000;
      localStorage.setItem(Novel.KEY + ".pos", JSON.stringify(all));
    } catch {}
  },

  getPos(ep) {
    try {
      return (JSON.parse(localStorage.getItem(Novel.KEY + ".pos") || "{}"))[ep] || 0;
    } catch {
      return 0;
    }
  },

  /** 스크롤 진행률을 추적해 진행 바·퍼센트·위치 저장을 한 곳에서 처리한다. */
  track(scroller, ep, onTick) {
    const get = () => {
      const isWin = scroller === window;
      const top = isWin ? window.scrollY : scroller.scrollTop;
      const max = isWin
        ? document.documentElement.scrollHeight - window.innerHeight
        : scroller.scrollHeight - scroller.clientHeight;
      return max > 0 ? Math.min(top / max, 1) : 0;
    };
    let idle;
    const tick = () => {
      const r = get();
      onTick(r);
      clearTimeout(idle);
      idle = setTimeout(() => Novel.savePos(ep, r), 400);
    };
    scroller.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", tick);
    tick();
    return get;
  },

  scrollTo(scroller, ratio) {
    const isWin = scroller === window;
    const max = isWin
      ? document.documentElement.scrollHeight - window.innerHeight
      : scroller.scrollHeight - scroller.clientHeight;
    const top = max * ratio;
    if (isWin) window.scrollTo({ top, behavior: "smooth" });
    else scroller.scrollTo({ top, behavior: "smooth" });
  },
};
