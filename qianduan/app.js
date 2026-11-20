/**
 * 前端八股文工作台 · 应用主逻辑
 * 职责：状态持久化、路由、抽题算法、事件委托、PWA 安装与更新。
 */
(function () {
  'use strict';

  const DATA = window.__BAGUWEN_DATA__;
  const V = window.BaguwenViews;
  const H = window.BaguwenHelpers;
  const main = document.getElementById('app-main');
  const header = document.getElementById('app-header');

  if (!DATA || !V || !window.BaguwenStateStore) {
    main.innerHTML = '<div class="empty"><p>题库数据加载失败，请联网打开一次后重试。</p></div>';
    return;
  }

  const store = new window.BaguwenStateStore();

  /* ---------- 扁平索引（运行时补齐上下文字段） ---------- */
  const allQuestions = [];
  const byId = {};
  DATA.chapters.forEach(function (c) {
    c.sections.forEach(function (s) {
      s.questions.forEach(function (q) {
        q.day = c.day;
        q.sectionTitle = s.title;
        q.chapterShort = c.short;
        allQuestions.push(q);
        byId[q.id] = q;
      });
    });
  });

  const DEF_PROGRESS = { grades: {}, history: {}, reviewedTotal: 0, lastActive: '', dayCursor: 1 };
  const DEF_PREFS = { theme: 'auto', fontScale: 1, dailyGoal: 30, installDismissed: false };
  const DEF_FAV = { ids: [] };
  const DEF_SESSION = { route: '', review: null };

  let progress, prefs, favorites, session;
  let ctx = {};
  let currentRoute = { view: 'home' };
  let deferredPrompt = null;
  let toastTimer = null;
  let noScrollOnce = false;

  const ui = {
    searchTerm: '', libraryFilter: 'all',
    reviewScope: 'today', reviewSize: 20, tableKind: 'speed',
    reviewQueue: [], reviewIndex: 0, revealed: false,
    counts: { 1: 0, 2: 0, 3: 0 },
    currentQ: null, currentQId: null
  };

  /* ---------- 工具 ---------- */
  function todayKey(d) {
    const x = d || new Date();
    return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  }
  function grade(id) { return (progress.grades && progress.grades[id]) || 0; }
  function isFav(id) { return favorites.ids.indexOf(Number(id)) >= 0; }
  function favCount() { return favorites.ids.length; }
  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 1900);
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---------- 主题与字号 ---------- */
  const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : { matches: false, addEventListener: function () {} };
  function resolvedTheme() {
    return prefs.theme === 'auto' ? (mq.matches ? 'dark' : 'light') : prefs.theme;
  }
  function applyPrefs() {
    const t = resolvedTheme();
    document.documentElement.dataset.theme = t;
    document.documentElement.style.setProperty('--fs', String(prefs.fontScale || 1));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#0d1726' : '#1F4E79');
  }
  if (mq.addEventListener) {
    mq.addEventListener('change', function () {
      if (prefs && prefs.theme === 'auto') { applyPrefs(); render(); }
    });
  }

  /* ---------- 统计 ---------- */
  function computeStats() {
    const g = progress.grades || {};
    let done = 0, mastered = 0, fuzzy = 0, wrong = 0, untouched = 0;
    const byDay = {};
    DATA.chapters.forEach(function (c) {
      const qs = allQuestions.filter(function (q) { return q.day === c.day; });
      let d = 0;
      qs.forEach(function (q) { if (g[q.id]) d++; });
      byDay[c.day] = { total: qs.length, done: d, pct: qs.length ? Math.round(d / qs.length * 100) : 0 };
    });
    allQuestions.forEach(function (q) {
      const v = g[q.id] || 0;
      if (!v) untouched++;
      else { done++; if (v === 1) wrong++; else if (v === 2) fuzzy++; else mastered++; }
    });
    let streak = 0;
    const d = new Date();
    if (!(progress.history || {})[todayKey(d)]) d.setDate(d.getDate() - 1);
    while ((progress.history || {})[todayKey(d)]) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    let suggestDay = 7;
    for (let i = 1; i <= DATA.chapters.length; i++) {
      if (byDay[i].done < byDay[i].total) { suggestDay = i; break; }
    }
    return {
      total: allQuestions.length, done: done, mastered: mastered, fuzzy: fuzzy,
      wrong: wrong, untouched: untouched, pct: Math.round(done / allQuestions.length * 100),
      byDay: byDay, streak: streak,
      todayCount: (progress.history || {})[todayKey()] || 0,
      reviewedTotal: progress.reviewedTotal || 0,
      suggestDay: suggestDay
    };
  }

  /* ---------- 抽题 ---------- */
  function buildQueue(scope, size, day) {
    let pool = allQuestions.slice();
    if (scope === 'today') pool = pool.filter(function (q) { return q.day === (day || computeStats().suggestDay); });
    else if (scope === 'day') pool = pool.filter(function (q) { return q.day === day; });
    else if (scope === 'wrong') pool = pool.filter(function (q) { return grade(q.id) === 1; });
    else if (scope === 'fav') pool = pool.filter(function (q) { return isFav(q.id); });
    const weighted = (scope === 'weak' || scope === 'today' || scope === 'day');
    return pool.map(function (q) {
      const g = grade(q.id);
      const w = weighted ? (g === 0 ? 0 : g === 1 ? 1 : g === 2 ? 2 : 3) : 0;
      return { q: q, score: w * 10 + Math.random() * 9.5 };
    }).sort(function (a, b) { return a.score - b.score; })
      .slice(0, size).map(function (x) { return x.q; });
  }

  /* ---------- 路由 ---------- */
  function parseRoute() {
    const raw = (location.hash || '').replace(/^#\/?/, '');
    const pathPart = raw.split('?')[0];
    const parts = pathPart.split('/').filter(Boolean);
    const alias = { q: 'question' };
    let view = parts[0] ? (alias[parts[0]] || parts[0]) : 'home';
    const valid = ['home', 'library', 'day', 'question', 'review', 'run', 'cheats', 'mine', 'list'];
    if (valid.indexOf(view) < 0) view = 'home';
    const second = parts[1];
    const r = {
      view: view,
      day: view === 'day' ? (parseInt(second, 10) || 1) : 1,
      id: view === 'question' ? (parseInt(second, 10) || 0) : 0,
      kind: view === 'list' ? (second || 'wrong') : ''
    };
    if (view === 'question' && !byId[r.id]) r.view = 'home';
    if (view === 'day' && !DATA.chapters[r.day - 1]) r.view = 'library';
    if (view === 'run' && !ui.reviewQueue.length) r.view = 'review';
    return r;
  }
  function applyQuery() {
    const raw = (location.hash || '');
    const q = raw.split('?')[1];
    if (!q) return;
    try {
      const p = new URLSearchParams(q);
      if (p.get('scope')) ui.reviewScope = p.get('scope');
      if (p.get('table')) ui.tableKind = p.get('table');
    } catch (e) { /* ignore */ }
  }
  function go(path) {
    if (location.hash === path) { render(); return; }
    location.hash = path;
  }
  function updateTabs(view) {
    const map = { day: 'library', question: 'library', list: 'mine', run: 'review' };
    const cur = map[view] || view;
    document.querySelectorAll('.tab').forEach(function (b) {
      b.classList.toggle('active', b.dataset.nav === cur);
    });
  }

  /* ---------- 构建视图上下文 ---------- */
  function buildCtx(route) {
    const s = computeStats();
    const term = ui.searchTerm.trim().toLowerCase();
    const searchResults = term
      ? allQuestions.filter(function (q) { return q.text.toLowerCase().indexOf(term) >= 0; }).slice(0, 80)
      : [];
    const filteredQuestions = allQuestions.filter(function (q) {
      const g = grade(q.id);
      switch (ui.libraryFilter) {
        case 'new': return g === 0;
        case 'fuzzy': return g === 2;
        case 'wrong': return g === 1;
        case 'mastered': return g === 3;
        default: return true;
      }
    });
    let list = [];
    if (route.view === 'list') {
      list = allQuestions.filter(function (q) {
        if (route.kind === 'fav') return isFav(q.id);
        if (route.kind === 'wrong') return grade(q.id) === 1;
        return grade(q.id) === 2;
      });
    }
    ui.currentQ = route.view === 'run' ? ui.reviewQueue[ui.reviewIndex] : null;
    ui.currentQId = ui.currentQ ? ui.currentQ.id : null;
    ctx = {
      data: DATA, stats: s, route: route, ui: ui,
      prefs: Object.assign({}, prefs, { themeResolved: resolvedTheme() }),
      h: { grade: grade, isFav: isFav, favCount: favCount },
      searchResults: searchResults, filteredQuestions: filteredQuestions,
      list: list,
      chapter: route.view === 'day' ? DATA.chapters[route.day - 1] : null,
      q: route.view === 'question' ? byId[route.id] : null
    };
    return ctx;
  }

  function render() {
    currentRoute = parseRoute();
    const c = buildCtx(currentRoute);
    header.innerHTML = V.header(c);
    main.innerHTML = V.render(c);
    updateTabs(currentRoute.view);
    if (!noScrollOnce) window.scrollTo(0, 0);
    noScrollOnce = false;
    saveSession();
  }

  function saveSession() {
    store.save('session', {
      route: location.hash,
      review: {
        queue: ui.reviewQueue.map(function (q) { return q.id; }),
        index: ui.reviewIndex, scope: ui.reviewScope, size: ui.reviewSize,
        revealed: ui.revealed, counts: clone(ui.counts)
      }
    });
  }

  /* ---------- 业务动作 ---------- */
  async function setGrade(id, g) {
    if (!id) return;
    progress.grades[id] = g;
    progress.reviewedTotal = (progress.reviewedTotal || 0) + 1;
    const t = todayKey();
    progress.history[t] = (progress.history[t] || 0) + 1;
    progress.lastActive = t;
    await store.save('progress', {
      grades: progress.grades, reviewedTotal: progress.reviewedTotal,
      history: progress.history, lastActive: t
    });
    toast(g === 3 ? '已掌握，干得漂亮' : g === 2 ? '标记为模糊，会优先再考你' : '已加入错题本');
  }

  async function toggleFav(id) {
    if (!id) return;
    const n = Number(id), i = favorites.ids.indexOf(n);
    if (i >= 0) favorites.ids.splice(i, 1); else favorites.ids.push(n);
    await store.save('favorites', { ids: favorites.ids });
    toast(i >= 0 ? '已取消收藏' : '已收藏');
    render();
  }

  function startReview(scope, day) {
    ui.reviewScope = scope || ui.reviewScope;
    const size = ui.reviewSize;
    ui.reviewQueue = buildQueue(ui.reviewScope, size, day);
    if (!ui.reviewQueue.length) { toast('这个范围暂时没有题目'); return; }
    ui.reviewIndex = 0;
    ui.revealed = false;
    ui.counts = { 1: 0, 2: 0, 3: 0 };
    go('#/run');
  }

  function nextQuestion() {
    ui.reviewIndex++;
    ui.revealed = false;
    render();
  }

  async function copyText(text, okMsg) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e2) { /* ignore */ }
      document.body.removeChild(ta);
    }
    toast(okMsg || '已复制');
  }

  /* ---------- 弹窗 ---------- */
  function showModal(html) {
    document.getElementById('modal-root').innerHTML =
      '<div class="modal-backdrop" data-action="close-modal"><div class="modal">' + html + '</div></div>';
  }
  function closeModal() { document.getElementById('modal-root').innerHTML = ''; }
  function confirmModal(title, text, okLabel, onOk) {
    window.__baguwenConfirm = onOk;
    showModal('<h3>' + H.esc(title) + '</h3><p>' + H.esc(text) + '</p>' +
      '<div class="modal-actions"><button type="button" class="btn btn-ghost" data-action="close-modal">取消</button>' +
      '<button type="button" class="btn btn-primary" data-action="confirm-ok">' + H.esc(okLabel) + '</button></div>');
  }

  /* ---------- 安装引导 ---------- */
  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  }
  function isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent); }
  function showBanner() {
    if (isStandalone() || prefs.installDismissed) return;
    document.getElementById('install-banner').classList.remove('hidden');
  }
  function hideBanner() { document.getElementById('install-banner').classList.add('hidden'); }
  function installGuide() {
    let extra = '';
    if (deferredPrompt) extra = '<button type="button" class="btn btn-primary btn-block" data-action="install">立即安装</button>';
    showModal('<h3>添加到主屏幕</h3><ol>' +
      '<li><b>iPhone / iPad</b>：用 Safari 打开，点底部「分享」→「添加到主屏幕」</li>' +
      '<li><b>Android / Chrome</b>：点右上角菜单 →「安装应用」或「添加到主屏幕」</li>' +
      '<li><b>桌面 Chrome / Edge</b>：点地址栏右侧的安装图标</li>' +
      '</ol><p>安装后全屏运行、断网也能刷题；学习进度仍保存在本机，不会上传。</p>' +
      extra + '<div class="modal-actions" style="margin-top:.6rem"><button type="button" class="btn btn-ghost btn-block" data-action="close-modal">知道了</button></div>');
  }
  function aboutModal() {
    showModal('<h3>关于本题库</h3><p>版本 v' + DATA.version + ' · 整理于 ' + DATA.generated + '<br>' +
      DATA.total + ' 道题 / ' + DATA.stats.chapters + ' 天 / ' + DATA.stats.sections + ' 个知识模块 / ' +
      DATA.stats.codeLines + ' 行可运行代码。</p>' +
      '<p>题型框架参考 GitHub 上的 Front-End-Interview-Notebook、webQd、InterviewMap、Daily-Interview-Question 等高星题库，并结合 2025—2026 大厂真题趋势重写答案。</p>' +
      '<p>纯静态 PWA，Service Worker 预缓存全部资源，首次打开后即可完全离线使用。</p>' +
      '<div class="modal-actions"><button type="button" class="btn btn-primary btn-block" data-action="close-modal">关闭</button></div>');
  }

  /* ---------- 事件委托 ---------- */
  document.getElementById('tabbar').addEventListener('click', function (e) {
    const b = e.target.closest('[data-nav]');
    if (!b) return;
    const map = { home: '#/home', library: '#/library', review: '#/review', cheats: '#/cheats', mine: '#/mine' };
    go(map[b.dataset.nav]);
  });

  document.addEventListener('click', async function (e) {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const a = el.dataset.action;

    if (a === 'close-modal') {
      if (el.classList.contains('modal-backdrop') && e.target !== el) return;
      closeModal(); return;
    }
    if (a === 'go') { go(el.dataset.path); return; }
    if (a === 'back') { if (history.length > 1) history.back(); else go('#/home'); return; }
    if (a === 'toggle-fav') { await toggleFav(el.dataset.id); return; }
    if (a === 'toggle-theme') {
      prefs.theme = resolvedTheme() === 'dark' ? 'light' : 'dark';
      await store.save('prefs', { theme: prefs.theme });
      applyPrefs(); render(); return;
    }
    if (a === 'font-inc' || a === 'font-dec') {
      prefs.fontScale = Math.min(1.35, Math.max(0.85, Math.round((prefs.fontScale + (a === 'font-inc' ? 0.1 : -0.1)) * 10) / 10));
      await store.save('prefs', { fontScale: prefs.fontScale });
      applyPrefs(); render(); return;
    }
    if (a === 'goal-cycle') {
      const opts = [20, 30, 50, 80];
      prefs.dailyGoal = opts[(opts.indexOf(prefs.dailyGoal) + 1) % opts.length];
      await store.save('prefs', { dailyGoal: prefs.dailyGoal });
      render(); return;
    }
    if (a === 'set-filter') { ui.libraryFilter = el.dataset.filter; render(); return; }
    if (a === 'set-scope') { ui.reviewScope = el.dataset.scope; render(); return; }
    if (a === 'set-size') { ui.reviewSize = parseInt(el.dataset.size, 10) || 20; render(); return; }
    if (a === 'set-table') { ui.tableKind = el.dataset.kind; render(); return; }
    if (a === 'search-clear') {
      ui.searchTerm = ''; render();
      const inp = document.getElementById('search-input');
      if (inp) inp.focus();
      return;
    }
    if (a === 'grade') {
      await setGrade(parseInt(el.dataset.id, 10), parseInt(el.dataset.grade, 10));
      render(); return;
    }
    if (a === 'q-prev' || a === 'q-next') {
      const id = parseInt(el.dataset.id, 10) + (a === 'q-next' ? 1 : -1);
      if (byId[id]) go('#/q/' + id); else toast(a === 'q-next' ? '已经是最后一题了' : '已经是第一题了');
      return;
    }
    if (a === 'copy-code') {
      const q = byId[parseInt(el.dataset.id, 10)];
      const block = q && q.code[parseInt(el.dataset.block, 10)];
      if (block) await copyText(block.join('\n'), '代码已复制');
      return;
    }
    if (a === 'copy-answer') {
      const q = byId[parseInt(el.dataset.id, 10)];
      if (!q) return;
      const parts = [q.num + ' ' + q.title, ''].concat(q.answers, q.bullets);
      if (q.note) parts.push('★ ' + q.note);
      await copyText(parts.join('\n'), '答案已复制');
      return;
    }
    if (a === 'review-start') {
      startReview(el.dataset.scope, el.dataset.day ? parseInt(el.dataset.day, 10) : null);
      return;
    }
    if (a === 'review-reveal') { ui.revealed = true; render(); return; }
    if (a === 'review-grade') {
      const g = parseInt(el.dataset.grade, 10);
      if (ui.currentQId) await setGrade(ui.currentQId, g);
      ui.counts[g] = (ui.counts[g] || 0) + 1;
      nextQuestion(); return;
    }
    if (a === 'review-skip') { nextQuestion(); return; }
    if (a === 'review-quit') { go('#/review'); return; }
    if (a === 'install') {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        deferredPrompt = null;
        hideBanner();
        toast(choice && choice.outcome === 'accepted' ? '正在安装…' : '已取消安装');
      } else {
        closeModal(); installGuide();
      }
      return;
    }
    if (a === 'dismiss-install') {
      prefs.installDismissed = true;
      await store.save('prefs', { installDismissed: true });
      hideBanner(); return;
    }
    if (a === 'install-guide') { installGuide(); return; }
    if (a === 'about') { aboutModal(); return; }
    if (a === 'apply-update') {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      else location.reload();
      return;
    }
    if (a === 'export') {
      const payload = await store.exportAll();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = 'baguwen-backup-' + todayKey() + '.json';
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      toast('备份已导出'); return;
    }
    if (a === 'import') {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = '.json,application/json';
      input.addEventListener('change', async function () {
        const f = input.files && input.files[0];
        if (!f) return;
        try {
          const obj = JSON.parse(await f.text());
          await store.importAll(obj);
          toast('导入成功，正在刷新…');
          setTimeout(function () { location.reload(); }, 800);
        } catch (err) { toast('文件格式不正确'); }
      });
      input.click(); return;
    }
    if (a === 'reset') {
      confirmModal('清空学习数据', '将删除全部掌握度、打卡记录与收藏，且无法恢复。建议先导出备份。', '确认清空',
        async function () { await store.clear(); location.reload(); });
      return;
    }
    if (a === 'confirm-ok') {
      const fn = window.__baguwenConfirm;
      closeModal();
      if (fn) await fn();
      return;
    }
  });

  /* 搜索输入：只局部替换结果区，保持输入框焦点与手机键盘 */
  document.addEventListener('input', function (e) {
    if (e.target.id !== 'search-input') return;
    ui.searchTerm = e.target.value;
    const term = ui.searchTerm.trim().toLowerCase();
    ctx.searchResults = term
      ? allQuestions.filter(function (q) { return q.text.toLowerCase().indexOf(term) >= 0; }).slice(0, 80)
      : [];
    const wrap = document.getElementById('search-results');
    const browse = document.getElementById('library-browse');
    const clearBtn = document.getElementById('search-clear-btn');
    if (wrap) { wrap.innerHTML = term ? V.searchBlock(ctx) : ''; wrap.classList.toggle('hidden', !term); }
    if (browse) browse.classList.toggle('hidden', !!term);
    if (clearBtn) clearBtn.classList.toggle('hidden', !term);
  });

  window.addEventListener('hashchange', function () { applyQuery(); render(); });

  /* ---------- PWA ---------- */
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    if (!isStandalone()) showBanner();
  });
  window.addEventListener('appinstalled', function () { hideBanner(); toast('安装成功，可从主屏打开'); });

  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('./sw.js', { scope: './' }).then(function (reg) {
      reg.addEventListener('updatefound', function () {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', function () {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            document.getElementById('update-banner').classList.remove('hidden');
          }
        });
      });
    }).catch(function (err) { console.warn('[SW] register failed', err); });
    navigator.serviceWorker.addEventListener('controllerchange', function () { location.reload(); });
  }

  /* ---------- 启动 ---------- */
  async function boot() {
    progress = Object.assign({}, DEF_PROGRESS, (await store.load('progress')) || {});
    progress.grades = progress.grades || {};
    progress.history = progress.history || {};
    prefs = Object.assign({}, DEF_PREFS, (await store.load('prefs')) || {});
    favorites = Object.assign({}, DEF_FAV, (await store.load('favorites')) || {});
    favorites.ids = favorites.ids || [];
    session = Object.assign({}, DEF_SESSION, (await store.load('session')) || {});

    if (session.review && session.review.queue && session.review.queue.length) {
      ui.reviewQueue = session.review.queue.map(function (id) { return byId[id]; }).filter(Boolean);
      ui.reviewIndex = Math.min(session.review.index || 0, ui.reviewQueue.length);
      ui.reviewScope = session.review.scope || 'today';
      ui.reviewSize = session.review.size || 20;
      ui.revealed = !!session.review.revealed;
      ui.counts = session.review.counts || { 1: 0, 2: 0, 3: 0 };
    }

    if (!location.hash && session.route) {
      history.replaceState(null, '', session.route);
    }
    applyPrefs();
    applyQuery();
    render();
    registerSW();
    // iOS 没有 beforeinstallprompt，主动给一次轻量提示
    if (isIOS() && !isStandalone() && !prefs.installDismissed) {
      setTimeout(function () {
        document.getElementById('install-title').textContent = '添加到主屏幕';
        document.getElementById('install-desc').textContent = '点 Safari 分享按钮 →「添加到主屏幕」，即可全屏离线刷题。';
        showBanner();
      }, 1200);
    }
  }

  boot();
})();
