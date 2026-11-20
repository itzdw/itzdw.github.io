/**
 * 前端八股文工作台 · 视图层
 * 纯函数：接收 ctx（数据 + 状态 + 统计 + 工具），返回 HTML 字符串。
 * 所有交互统一用 data-action / data-* 声明，由 app.js 事件委托处理。
 */
(function (root) {
  'use strict';

  const V = {};

  function icon(name, cls) {
    return '<svg class="ic ' + (cls || '') + '"><use href="#i-' + name + '"></use></svg>';
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }
  function masteryDot(g) {
    const cls = g === 3 ? 'g3' : g === 2 ? 'g2' : g === 1 ? 'g1' : 'g0';
    return '<i class="dot ' + cls + '"></i>';
  }
  function gradeLabel(g) {
    return g === 3 ? '已掌握' : g === 2 ? '模糊' : g === 1 ? '不会' : '未做';
  }

  /* ---------------- 顶部栏 ---------------- */
  V.header = function (ctx) {
    const r = ctx.route;
    const titles = {
      home: ['工作台', '前端八股 · 7 天速背'],
      library: ['题库', ctx.data.total + ' 道题 · ' + ctx.data.stats.chapters + ' 天'],
      day: ['第 ' + r.day + ' 天', ctx.chapter ? ctx.chapter.short : ''],
      question: [ctx.q ? ctx.q.num : '题目', ctx.q ? gradeLabel(ctx.h.grade(ctx.q.id)) : ''],
      review: ['翻卡自测', '先讲一遍，再看答案'],
      run: ['自测中', '第 ' + (ctx.ui.reviewIndex + 1) + ' / ' + ctx.ui.reviewQueue.length + ' 题'],
      cheats: ['速查表', '面试前最后半天'],
      mine: ['我的', '进度 · 设置 · 数据'],
      list: [ctx.route.kind === 'fav' ? '收藏夹' : ctx.route.kind === 'wrong' ? '错题本' : '模糊题', '共 ' + ctx.list.length + ' 题']
    };
    const t = titles[r.view] || ['八股速背', ''];
    let actions = '';
    if (r.view === 'question' || r.view === 'run') {
      const id = r.view === 'question' ? ctx.q.id : ctx.ui.currentQId;
      actions = '<button type="button" class="icon-btn ' + (ctx.h.isFav(id) ? 'on' : '') +
        '" data-action="toggle-fav" data-id="' + id + '" aria-label="收藏">' + icon('star') + '</button>';
    } else if (r.view === 'home' || r.view === 'library' || r.view === 'cheats' || r.view === 'mine' || r.view === 'review' || r.view === 'day' || r.view === 'list') {
      actions = '<button type="button" class="icon-btn" data-action="toggle-theme" aria-label="切换主题">' + icon(ctx.prefs.themeResolved === 'dark' ? 'sun' : 'moon') + '</button>';
    }
    let back = '';
    if (['day', 'question', 'run', 'list'].indexOf(r.view) >= 0) {
      back = '<button type="button" class="icon-btn" data-action="back" aria-label="返回">' + icon('back') + '</button>';
    }
    return back + '<div class="h-title">' + esc(t[0]) + '<small>' + esc(t[1]) + '</small></div>' + actions;
  };

  /* ---------------- 工作台 ---------------- */
  V.home = function (ctx) {
    const s = ctx.stats, d = ctx.data;
    const day = s.suggestDay;
    const plan = d.plan[day - 1];
    const dp = s.byDay[day];
    const goal = ctx.prefs.dailyGoal || 30;
    const goalPct = Math.min(100, pct(s.todayCount, goal));

    let html = '<div class="page">';

    html += '<div class="card hero-card">' +
      '<div class="hero-kicker">今日计划 · DAY ' + day + ' / 7</div>' +
      '<div class="hero-title">' + esc(plan.theme) + '</div>' +
      '<div class="hero-sub">' + esc(plan.focus) + '</div>' +
      '<div class="hero-progress"><div class="progress"><div class="progress-fill" style="width:' + dp.pct + '%"></div></div>' +
      '<div class="progress-caption"><span>本天进度 ' + dp.done + ' / ' + dp.total + ' 题</span><span>' + dp.pct + '%</span></div></div>' +
      '<button type="button" class="btn btn-light hero-btn" data-action="review-start" data-scope="today">' + icon('play') + '开始今日自测</button>' +
      '</div>';

    html += '<div class="stat-grid" style="margin-top:.85rem">' +
      '<div class="stat"><div class="stat-num">' + s.mastered + '</div><div class="stat-label">已掌握</div></div>' +
      '<div class="stat"><div class="stat-num">' + s.done + '</div><div class="stat-label">已刷题</div></div>' +
      '<div class="stat"><div class="stat-num">' + s.streak + '</div><div class="stat-label">连续打卡</div></div>' +
      '</div>';

    html += '<div class="card" style="margin-top:.85rem">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;font-size:.82rem;font-weight:700">' +
      '<span>' + icon('target') + ' 今日目标</span><span style="color:var(--text-3);font-weight:600">' + s.todayCount + ' / ' + goal + ' 题</span></div>' +
      '<div class="progress solid" style="margin-top:.6rem"><div class="progress-fill" style="width:' + goalPct + '%"></div></div>' +
      '<p class="tip-line">' + (s.todayCount >= goal ? '今日目标已完成，可以再刷一轮错题巩固。' : '再刷 ' + (goal - s.todayCount) + ' 题达成今日目标，别断打卡。') + '</p>' +
      '</div>';

    html += '<div class="section-head"><h2>七天计划</h2><button type="button" class="link" data-action="go" data-path="#/library">' + '全部题库 ' + icon('chevron') + '</button></div>';
    html += '<div class="day-list">';
    d.chapters.forEach(function (c) {
      const st = s.byDay[c.day];
      const done = st.done >= st.total && st.total > 0;
      html += '<button type="button" class="day-item ' + (done ? 'done' : '') + '" data-action="go" data-path="#/day/' + c.day + '">' +
        '<span class="day-num">' + (done ? icon('check') : c.day) + '</span>' +
        '<span class="day-info"><strong>第 ' + c.day + ' 天 · ' + esc(c.short) + '</strong>' +
        '<small>' + esc(d.plan[c.day - 1].tip) + '</small>' +
        '<span class="mini-bar"><i style="width:' + st.pct + '%"></i></span></span>' +
        '<span style="font-size:.7rem;color:var(--text-3);white-space:nowrap">' + st.done + '/' + st.total + '</span>' +
        icon('chevron') + '</button>';
    });
    html += '</div>';

    html += '<div class="section-head"><h2>快捷入口</h2></div><div class="row-list">';
    const quick = [
      ['wrong', 'filter', '错题本', s.wrong + ' 题待攻克', '#/list/wrong'],
      ['fuzzy', 'sparkle', '模糊题', s.fuzzy + ' 题需巩固', '#/list/fuzzy'],
      ['fav', 'star', '我的收藏', ctx.h.favCount() + ' 题', '#/list/fav'],
      ['random', 'shuffle', '随机抽题', '模拟面试 20 题', '#/review?scope=random']
    ];
    quick.forEach(function (q) {
      const ic = q[1] === 'shuffle' ? 'refresh' : q[1];
      html += '<button type="button" class="row-item" data-action="go" data-path="' + q[4] + '">' +
        icon(ic, 'lead') + '<span class="r-body"><strong>' + q[2] + '</strong><small>' + q[3] + '</small></span>' +
        '<span class="r-tail">' + icon('chevron') + '</span></button>';
    });
    html += '</div>';

    html += '<p class="tip-line">离线可用 · 数据仅保存在本机浏览器 · 支持导出备份</p>';
    return html + '</div>';
  };

  /* ---------------- 题库 ---------------- */
  V.library = function (ctx) {
    const term = ctx.ui.searchTerm.trim();
    let html = '<div class="page">';
    html += '<div class="search-box">' + icon('search') +
      '<input id="search-input" type="search" placeholder="搜题目、答案、代码…" value="' + esc(term) + '" autocomplete="off" enterkeyhint="search">' +
      '<button id="search-clear-btn" type="button" class="icon-btn ' + (term ? '' : 'hidden') + '" style="width:1.9rem;height:1.9rem;border:0;background:transparent" data-action="search-clear" aria-label="清空">' + icon('x') + '</button>' +
      '</div>';

    // 搜索结果单独容器：输入时只替换这块，避免重建输入框导致手机键盘收起
    html += '<div id="search-results" class="' + (term ? '' : 'hidden') + '">' + (term ? V.searchBlock(ctx) : '') + '</div>';
    html += '<div id="library-browse" class="' + (term ? 'hidden' : '') + '">';

    html += '<div class="section-head"><h2>按天浏览</h2><span style="font-size:.72rem;color:var(--text-3)">' + ctx.data.total + ' 题</span></div>';
    html += '<div class="day-list">';
    ctx.data.chapters.forEach(function (c) {
      const st = ctx.stats.byDay[c.day];
      html += '<button type="button" class="day-item ' + (st.done >= st.total && st.total ? 'done' : '') + '" data-action="go" data-path="#/day/' + c.day + '">' +
        '<span class="day-num">' + c.day + '</span><span class="day-info">' +
        '<strong>' + esc(c.short) + '</strong><small>' + esc(c.sections.map(function (s) { return s.title.replace(/^[\d.]+\s*/, ''); }).slice(0, 2).join(' · ')) + '</small>' +
        '<span class="mini-bar"><i style="width:' + st.pct + '%"></i></span></span>' +
        '<span style="font-size:.7rem;color:var(--text-3);white-space:nowrap">' + st.done + '/' + st.total + '</span>' + icon('chevron') + '</button>';
    });
    html += '</div>';

    html += '<div class="section-head"><h2>按掌握度筛选</h2></div>';
    html += '<div class="chip-row">' +
      V.chip('全部 ' + ctx.data.total, 'all', ctx.ui.libraryFilter) +
      V.chip('未做 ' + ctx.stats.untouched, 'new', ctx.ui.libraryFilter) +
      V.chip('模糊 ' + ctx.stats.fuzzy, 'fuzzy', ctx.ui.libraryFilter) +
      V.chip('不会 ' + ctx.stats.wrong, 'wrong', ctx.ui.libraryFilter) +
      V.chip('已掌握 ' + ctx.stats.mastered, 'mastered', ctx.ui.libraryFilter) +
      '</div>';
    const filtered = ctx.filteredQuestions;
    html += '<div class="section-head"><h2>题目</h2><span style="font-size:.72rem;color:var(--text-3)">' + filtered.length + ' 题</span></div>';
    html += filtered.length ? '<div class="q-list">' + filtered.slice(0, 60).map(function (q) { return V.qItem(ctx, q); }).join('') + '</div>' +
      (filtered.length > 60 ? '<p class="tip-line">仅显示前 60 题，用搜索框可精确查找。</p>' : '')
      : V.empty('这里空空如也', '去刷几道题再回来看看');
    html += '</div>';
    return html + '</div>';
  };

  V.searchBlock = function (ctx) {
    const list = ctx.searchResults;
    let h = '<div class="section-head"><h2>搜索结果</h2><span style="font-size:.72rem;color:var(--text-3)">' + list.length + ' 题</span></div>';
    h += list.length ? '<div class="q-list">' + list.map(function (q) { return V.qItem(ctx, q); }).join('') + '</div>'
      : V.empty('没有匹配的题目', '换个关键词试试，比如「闭包」「缓存」「useEffect」');
    return h;
  };

  V.chip = function (label, key, cur) {
    return '<button type="button" class="chip ' + (cur === key ? 'active' : '') + '" data-action="set-filter" data-filter="' + key + '">' + label + '</button>';
  };

  V.qItem = function (ctx, q) {
    const g = ctx.h.grade(q.id);
    return '<button type="button" class="q-item" data-action="go" data-path="#/q/' + q.id + '">' +
      '<span class="q-num">' + q.num + '</span><span class="q-body">' +
      '<span class="q-title">' + esc(q.title) + '</span>' +
      '<span class="q-meta"><span class="tag">' + esc(q.tag) + '</span>' +
      masteryDot(g) + '<span style="font-size:.68rem;color:var(--text-3)">' + gradeLabel(g) + '</span>' +
      (q.code.length ? '<span style="font-size:.68rem;color:var(--text-3)">' + icon('code') + ' ' + q.code.length + '</span>' : '') +
      '</span></span>' + icon('chevron') + '</button>';
  };

  /* ---------------- 某天详情 ---------------- */
  V.day = function (ctx) {
    const c = ctx.chapter, s = ctx.stats.byDay[c.day];
    let html = '<div class="page">';
    html += '<div class="card flat" style="background:var(--primary-soft);border-color:transparent">' +
      '<div style="font-size:.82rem;font-weight:700">第 ' + c.day + ' 天 · ' + esc(c.short) + '</div>' +
      '<div style="font-size:.72rem;color:var(--text-2);margin-top:.25rem">' + esc(ctx.data.plan[c.day - 1].focus) + '</div>' +
      '<div class="progress solid" style="margin-top:.6rem"><div class="progress-fill" style="width:' + s.pct + '%"></div></div>' +
      '<div style="font-size:.7rem;color:var(--text-3);margin-top:.3rem">已完成 ' + s.done + ' / ' + s.total + ' 题（' + s.pct + '%）</div></div>';
    if (c.note) html += '<p class="tip-line">' + esc(c.note) + '</p>';
    html += '<button type="button" class="btn btn-primary btn-block" style="margin:.8rem 0" data-action="review-start" data-scope="day" data-day="' + c.day + '">' + icon('play') + '开始本天自测</button>';

    c.sections.forEach(function (sec) {
      html += '<div class="section-head"><h2>' + esc(sec.title) + '</h2><span style="font-size:.7rem;color:var(--text-3)">' + sec.questions.length + ' 题</span></div>';
      if (sec.note) html += '<p class="tip-line" style="margin-top:-.2rem">' + esc(sec.note) + '</p>';
      html += '<div class="q-list">' + sec.questions.map(function (q) { return V.qItem(ctx, q); }).join('') + '</div>';
    });
    return html + '</div>';
  };

  /* ---------------- 题目详情 ---------------- */
  V.question = function (ctx) {
    const q = ctx.q, g = ctx.h.grade(q.id);
    let html = '<div class="page">';
    html += '<div class="card q-head"><div class="q-line"><span class="tag">' + esc(q.tag) + '</span>' +
      '<span style="font-size:.72rem;color:var(--text-3)">' + q.num + ' · 第 ' + q.day + ' 天 · ' + esc(q.sectionTitle) + '</span></div>' +
      '<h1>' + esc(q.title) + '</h1>' +
      '<div class="q-sub">' + masteryDot(g) + '<span>' + gradeLabel(g) + '</span>' +
      (q.code.length ? '<span>·</span><span>' + q.code.length + ' 段代码</span>' : '') +
      (ctx.h.isFav(q.id) ? '<span>·</span><span style="color:var(--warn)">已收藏</span>' : '') +
      '</div></div>';

    html += '<div class="card"><div class="section-head" style="margin:0 0 .6rem"><h2>参考答案</h2>' +
      '<button type="button" class="link" data-action="copy-answer" data-id="' + q.id + '">' + icon('copy') + ' 复制</button></div>';
    q.answers.forEach(function (a) { html += '<p class="answer-text">' + esc(a) + '</p>'; });
    if (q.bullets.length) {
      html += '<ul class="bullet-list">';
      q.bullets.forEach(function (b) { html += '<li>' + esc(b) + '</li>'; });
      html += '</ul>';
    }
    q.code.forEach(function (block, i) {
      html += '<div class="code-block"><div class="code-head"><span>代码 ' + (i + 1) + ' · ' + block.length + ' 行</span>' +
        '<button type="button" class="code-copy" data-action="copy-code" data-id="' + q.id + '" data-block="' + i + '">' + icon('copy') + '复制</button></div>' +
        '<pre class="code-body"><code>' + esc(block.join('\n')) + '</code></pre></div>';
    });
    if (q.note) html += '<div class="note-box">' + icon('sparkle') + '<div><strong>追问 / 记忆点　</strong>' + esc(q.note) + '</div></div>';
    html += '</div>';

    html += '<div class="card"><div style="font-size:.82rem;font-weight:700;margin-bottom:.15rem">自评掌握度</div>' +
      '<p class="tip-line" style="margin:0">评完后会自动记录到错题本 / 模糊题，并影响后续抽题权重。</p>' +
      '<div class="mastery-row">' +
      '<button type="button" class="grade-btn g1 ' + (g === 1 ? 'current' : '') + '" data-action="grade" data-id="' + q.id + '" data-grade="1">不会<small>加入错题本</small></button>' +
      '<button type="button" class="grade-btn g2 ' + (g === 2 ? 'current' : '') + '" data-action="grade" data-id="' + q.id + '" data-grade="2">模糊<small>优先复习</small></button>' +
      '<button type="button" class="grade-btn g3 ' + (g === 3 ? 'current' : '') + '" data-action="grade" data-id="' + q.id + '" data-grade="3">会了<small>降低权重</small></button>' +
      '</div></div>';

    html += '<div class="q-nav">' +
      '<button type="button" class="btn btn-ghost" data-action="q-prev" data-id="' + q.id + '">' + icon('back') + '上一题</button>' +
      '<button type="button" class="btn btn-ghost" data-action="q-next" data-id="' + q.id + '">下一题' + icon('next') + '</button>' +
      '</div>';
    return html + '</div>';
  };

  /* ---------------- 自测入口 ---------------- */
  V.review = function (ctx) {
    const s = ctx.stats, scope = ctx.ui.reviewScope, size = ctx.ui.reviewSize;
    let html = '<div class="page">';
    html += '<div class="card hero-card" style="padding:1.1rem">' +
      '<div class="hero-kicker">RECITE MODE</div><div class="hero-title">翻卡自测</div>' +
      '<div class="hero-sub">先出声讲一遍，再翻答案自评。讲不顺的才是真薄弱点。</div></div>';

    html += '<div class="section-head"><h2>抽题范围</h2></div><div class="chip-row">';
    const scopes = [
      ['today', '今日计划（第 ' + s.suggestDay + ' 天）'],
      ['weak', '错题 + 模糊优先'],
      ['wrong', '仅错题 ' + s.wrong],
      ['fav', '我的收藏 ' + ctx.h.favCount()],
      ['random', '随机模拟面试'],
      ['all', '全部题库（按题量抽）']
    ];
    scopes.forEach(function (x) {
      html += '<button type="button" class="chip ' + (scope === x[0] ? 'active' : '') + '" data-action="set-scope" data-scope="' + x[0] + '">' + x[1] + '</button>';
    });
    html += '</div>';

    html += '<div class="section-head"><h2>题量</h2></div><div class="seg">' +
      [20, 40, 100].map(function (n) {
        return '<button type="button" class="' + (size === n ? 'active' : '') + '" data-action="set-size" data-size="' + n + '">' + n + ' 题</button>';
      }).join('') + '</div>';

    html += '<div class="card" style="margin-top:1rem"><div class="stat-grid">' +
      '<div class="stat"><div class="stat-num">' + s.reviewedTotal + '</div><div class="stat-label">累计自评</div></div>' +
      '<div class="stat"><div class="stat-num">' + s.todayCount + '</div><div class="stat-label">今日自评</div></div>' +
      '<div class="stat"><div class="stat-num">' + s.pct + '%</div><div class="stat-label">总覆盖率</div></div>' +
      '</div></div>';

    html += '<button type="button" class="btn btn-primary btn-block" style="margin-top:.4rem" data-action="review-start" data-scope="' + scope + '">' + icon('play') + '开始自测</button>';
    html += '<p class="tip-line">抽题权重：未做 &gt; 不会 &gt; 模糊 &gt; 已掌握，越薄弱越常出现。</p>';
    return html + '</div>';
  };

  /* ---------------- 翻卡运行中 ---------------- */
  V.run = function (ctx) {
    const ui = ctx.ui, q = ctx.ui.currentQ;
    const total = ui.reviewQueue.length, idx = ui.reviewIndex;
    if (!q) return V.reviewSummary(ctx);
    let html = '<div class="page">';
    html += '<div class="review-footer" style="margin:0 0 .8rem">' +
      '<span>' + (idx + 1) + ' / ' + total + '</span>' +
      '<div class="progress solid"><div class="progress-fill" style="width:' + pct(idx, total) + '%"></div></div>' +
      '<button type="button" class="icon-btn" style="width:2rem;height:2rem" data-action="review-quit" aria-label="结束">' + icon('x') + '</button></div>';

    html += '<div class="flash-wrap"><div class="flash-card ' + (ui.revealed ? 'revealed' : '') + '">' +
      '<div class="flash-top"><span>' + q.num + ' · 第 ' + q.day + ' 天</span><span class="tag">' + esc(q.tag) + '</span></div>' +
      '<div class="flash-title">' + esc(q.title) + '</div>';
    if (!ui.revealed) {
      html += '<div class="reveal-mask" style="margin-top:auto">' + icon('info') +
        '<span>先自己在心里（或出声）讲一遍，再点下面的按钮对答案</span></div>';
    } else {
      html += '<div class="flash-answer">';
      q.answers.slice(0, 3).forEach(function (a) { html += '<p class="answer-text">' + esc(a) + '</p>'; });
      if (q.code.length) html += '<p class="tip-line">' + icon('code') + ' 本题含 ' + q.code.length + ' 段代码，详见题目详情页。</p>';
      if (q.note) html += '<div class="note-box">' + icon('sparkle') + '<div>' + esc(q.note) + '</div></div>';
      html += '<button type="button" class="btn btn-ghost btn-sm btn-block" data-action="go" data-path="#/q/' + q.id + '">查看完整答案与代码</button>';
      html += '</div>';
    }
    html += '</div></div>';

    if (!ui.revealed) {
      html += '<div class="flash-actions">' +
        '<button type="button" class="btn btn-ghost" data-action="review-skip">跳过</button>' +
        '<button type="button" class="btn btn-primary" data-action="review-reveal">' + icon('sparkle') + '显示答案</button></div>';
    } else {
      html += '<div class="section-head" style="margin-bottom:.35rem"><h2>这道题我…</h2></div><div class="mastery-row">' +
        '<button type="button" class="grade-btn g1" data-action="review-grade" data-grade="1">不会<small>加入错题本</small></button>' +
        '<button type="button" class="grade-btn g2" data-action="review-grade" data-grade="2">模糊<small>优先复习</small></button>' +
        '<button type="button" class="grade-btn g3" data-action="review-grade" data-grade="3">会了<small>降低权重</small></button>' +
        '</div>';
    }
    html += '<p class="tip-line">不会 ' + ui.counts[1] + ' · 模糊 ' + ui.counts[2] + ' · 会了 ' + ui.counts[3] + '</p>';
    return html + '</div>';
  };

  V.reviewSummary = function (ctx) {
    const c = ctx.ui.counts;
    let html = '<div class="page"><div class="card" style="text-align:center;padding:1.6rem 1rem">' +
      '<div style="font-size:2.4rem">' + icon('sparkle') + '</div>' +
      '<h2 style="font-size:1.1rem;margin:.5rem 0">本轮完成</h2>' +
      '<p style="font-size:.82rem;color:var(--text-2);margin:0">共 ' + ctx.ui.reviewQueue.length + ' 题</p>' +
      '<div class="stat-grid" style="margin-top:1rem">' +
      '<div class="stat"><div class="stat-num" style="color:var(--danger)">' + c[1] + '</div><div class="stat-label">不会</div></div>' +
      '<div class="stat"><div class="stat-num" style="color:var(--warn)">' + c[2] + '</div><div class="stat-label">模糊</div></div>' +
      '<div class="stat"><div class="stat-num" style="color:var(--success)">' + c[3] + '</div><div class="stat-label">会了</div></div>' +
      '</div></div>' +
      '<button type="button" class="btn btn-primary btn-block" data-action="review-start" data-scope="' + ctx.ui.reviewScope + '">' + icon('refresh') + '再来一轮</button>' +
      '<button type="button" class="btn btn-ghost btn-block" style="margin-top:.5rem" data-action="go" data-path="#/home">回到工作台</button></div>';
    return html;
  };

  /* ---------------- 速查表 ---------------- */
  V.cheats = function (ctx) {
    const kind = ctx.ui.tableKind;
    const tabs = [['speed', '30 秒速答'], ['plan', '一周节奏'], ['source', '资料来源']];
    let html = '<div class="page">';
    html += '<div class="seg">' + tabs.map(function (t) {
      return '<button type="button" class="' + (kind === t[0] ? 'active' : '') + '" data-action="set-table" data-kind="' + t[0] + '">' + t[1] + '</button>';
    }).join('') + '</div>';

    const table = ctx.data.tables.find(function (t) { return t.kind === kind; });
    if (!table) return html + V.empty('暂无内容', '') + '</div>';
    html += '<div class="section-head"><h2>' + esc(table.title) + '</h2></div>';
    html += '<div class="card" style="padding:.6rem"><div class="table-wrap"><table class="data-table"><thead><tr>' +
      table.rows[0].map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>';
    table.rows.slice(1).forEach(function (row) {
      html += '<tr>' + row.map(function (cell) { return '<td>' + esc(cell) + '</td>'; }).join('') + '</tr>';
    });
    html += '</tbody></table></div></div>';
    if (kind === 'speed') html += '<p class="tip-line">用法：随机抽一行，30 秒内把「一句话答案」讲出来，说不顺就回对应章节重看。</p>';
    if (kind === 'plan') html += '<button type="button" class="btn btn-primary btn-block" data-action="go" data-path="#/review">开始今天的自测</button>';
    return html + '</div>';
  };

  /* ---------------- 我的 ---------------- */
  V.mine = function (ctx) {
    const s = ctx.stats, p = ctx.prefs;
    let html = '<div class="page">';
    html += '<div class="card"><div style="display:flex;align-items:center;gap:.7rem">' +
      '<div style="width:3rem;height:3rem;border-radius:14px;background:linear-gradient(145deg,var(--primary),var(--primary-2));color:#fff;display:grid;place-items:center;font-weight:800;font-size:1.2rem">八</div>' +
      '<div style="flex:1"><strong style="font-size:.95rem">八股速背工作台</strong>' +
      '<div style="font-size:.72rem;color:var(--text-3)">已坚持 ' + s.streak + ' 天 · 覆盖 ' + s.pct + '%</div></div></div>' +
      '<div class="progress solid" style="margin-top:.9rem"><div class="progress-fill" style="width:' + s.pct + '%"></div></div>' +
      '<div class="stat-grid" style="margin-top:.9rem;box-shadow:none">' +
      '<div class="stat" style="box-shadow:none"><div class="stat-num" style="color:var(--success)">' + s.mastered + '</div><div class="stat-label">已掌握</div></div>' +
      '<div class="stat" style="box-shadow:none"><div class="stat-num" style="color:var(--warn)">' + s.fuzzy + '</div><div class="stat-label">模糊</div></div>' +
      '<div class="stat" style="box-shadow:none"><div class="stat-num" style="color:var(--danger)">' + s.wrong + '</div><div class="stat-label">不会</div></div>' +
      '</div></div>';

    html += '<div class="section-head"><h2>题单</h2></div><div class="row-list">' +
      V.row('star', '收藏夹', ctx.h.favCount() + ' 题', '#/list/fav') +
      V.row('filter', '错题本', s.wrong + ' 题待攻克', '#/list/wrong') +
      V.row('sparkle', '模糊题', s.fuzzy + ' 题需巩固', '#/list/fuzzy') + '</div>';

    html += '<div class="section-head"><h2>偏好设置</h2></div><div class="setting-group">' +
      '<div class="setting-row">' + icon(ctx.prefs.themeResolved === 'dark' ? 'moon' : 'sun') +
      '<div class="s-body"><strong>深色模式</strong><small>跟随系统 / 手动切换</small></div>' +
      '<button type="button" class="switch ' + (ctx.prefs.themeResolved === 'dark' ? 'on' : '') + '" data-action="toggle-theme" aria-label="切换深色模式"><i></i></button></div>' +
      '<div class="setting-row">' + icon('list') +
      '<div class="s-body"><strong>正文字号</strong><small>当前 ' + Math.round(p.fontScale * 100) + '%</small></div>' +
      '<button type="button" class="icon-btn" data-action="font-dec" aria-label="减小字号">A-</button>' +
      '<button type="button" class="icon-btn" data-action="font-inc" aria-label="增大字号">A+</button></div>' +
      '<div class="setting-row">' + icon('target') +
      '<div class="s-body"><strong>每日目标</strong><small>每天自评 ' + p.dailyGoal + ' 题</small></div>' +
      '<button type="button" class="btn btn-sm btn-ghost" data-action="goal-cycle">' + p.dailyGoal + ' 题</button></div>' +
      '</div>';

    html += '<div class="section-head"><h2>数据管理</h2></div><div class="setting-group">' +
      '<button type="button" class="setting-row" style="width:100%;text-align:left" data-action="export">' + icon('download') +
      '<div class="s-body"><strong>导出备份</strong><small>把进度、收藏、设置导出为 JSON</small></div>' + icon('chevron') + '</button>' +
      '<button type="button" class="setting-row" style="width:100%;text-align:left" data-action="import">' + icon('upload') +
      '<div class="s-body"><strong>导入备份</strong><small>从 JSON 文件恢复进度</small></div>' + icon('chevron') + '</button>' +
      '<button type="button" class="setting-row" style="width:100%;text-align:left" data-action="reset">' + icon('refresh') +
      '<div class="s-body"><strong>清空学习数据</strong><small>重置掌握度、打卡与收藏</small></div>' + icon('chevron') + '</button>' +
      '</div>';

    html += '<div class="section-head"><h2>安装到手机</h2></div><div class="setting-group">' +
      '<button type="button" class="setting-row" style="width:100%;text-align:left" data-action="install-guide">' + icon('download') +
      '<div class="s-body"><strong>添加到主屏幕</strong><small>全屏、离线、像原生 App</small></div>' + icon('chevron') + '</button>' +
      '<button type="button" class="setting-row" style="width:100%;text-align:left" data-action="about">' + icon('info') +
      '<div class="s-body"><strong>关于本题库</strong><small>v' + ctx.data.version + ' · ' + ctx.data.total + ' 题 · 离线可用</small></div>' + icon('chevron') + '</button>' +
      '</div>';
    html += '<p class="tip-line">所有学习数据仅保存在本机浏览器，不会上传。</p>';
    return html + '</div>';
  };

  V.row = function (ic, title, sub, path) {
    return '<button type="button" class="row-item" data-action="go" data-path="' + path + '">' +
      icon(ic, 'lead') + '<span class="r-body"><strong>' + title + '</strong><small>' + sub + '</small></span>' +
      '<span class="r-tail">' + icon('chevron') + '</span></button>';
  };

  /* ---------------- 收藏 / 错题 / 模糊列表 ---------------- */
  V.list = function (ctx) {
    let html = '<div class="page">';
    if (!ctx.list.length) return html + V.empty('这里还没有题目', '去题库刷几道并自评后，题目会自动归类到这里') + '</div>';
    html += '<div class="q-list">' + ctx.list.map(function (q) { return V.qItem(ctx, q); }).join('') + '</div>';
    html += '<button type="button" class="btn btn-primary btn-block" style="margin-top:1rem" data-action="review-start" data-scope="' +
      (ctx.route.kind === 'fav' ? 'fav' : ctx.route.kind === 'wrong' ? 'wrong' : 'weak') + '">' + icon('play') + '针对性自测</button>';
    return html + '</div>';
  };

  V.empty = function (title, sub) {
    return '<div class="empty">' + icon('info') + '<p><strong style="color:var(--text-2)">' + esc(title) + '</strong><br>' + esc(sub) + '</p></div>';
  };

  V.render = function (ctx) {
    switch (ctx.route.view) {
      case 'home': return V.home(ctx);
      case 'library': return V.library(ctx);
      case 'day': return V.day(ctx);
      case 'question': return V.question(ctx);
      case 'review': return V.review(ctx);
      case 'run': return V.run(ctx);
      case 'cheats': return V.cheats(ctx);
      case 'mine': return V.mine(ctx);
      case 'list': return V.list(ctx);
      default: return V.home(ctx);
    }
  };

  root.BaguwenViews = V;
  root.BaguwenHelpers = { esc: esc, icon: icon, pct: pct, gradeLabel: gradeLabel };
})(typeof window !== 'undefined' ? window : globalThis);
