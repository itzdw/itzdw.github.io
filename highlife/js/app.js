(function () {
  var params = new URLSearchParams(location.search);
  var DRAFT_KEY = 'hl_cms_draft_v1';

  // 读取本地草稿（后台/可视化编辑器自动保存的那份）
  function readDraft() {
    try {
      var raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      var d = JSON.parse(raw);
      return (d && d.sites) ? d : null;
    } catch (e) { return null; }
  }

  var draft = readDraft();
  var sitesMap = draft ? draft.sites : JSON.parse(JSON.stringify(window.HIGHLIFE_SITES || {}));
  var siteId = params.get('t');
  if (!siteId || !sitesMap[siteId]) siteId = Object.keys(sitesMap)[0];
  var S = sitesMap[siteId] || {};
  window.HIGHLIFE_CURRENT_SITE = siteId;

  var DEFAULTS = {
    aboutImg: 'images/img_019.jpg',
    aboutLead: '通过与国外优秀手作培训平台的合作，实现国际技术交流。',
    aboutTitle: '国际化 · 专业化 · 平台化'
  };

  function txt(id, v) { var el = document.getElementById(id); if (el) el.textContent = v == null ? '' : v; }
  function src(id, v) { var el = document.getElementById(id); if (el && v) el.src = v; }
  function attr(el, kind, path, label) {
    if (!el) return;
    el.setAttribute('data-hl-kind', kind);
    el.setAttribute('data-hl-path', path);
    if (label) el.setAttribute('data-hl-label', label);
  }

  function card(item, i) {
    var d = document.createElement('a');
    d.className = 'course';
    // 跳转课程详情页（详情页支持 ?id= 课程id，?t= 站点参数原样带上）
    d.href = 'course.html?t=' + encodeURIComponent(siteId) + '&id=' + encodeURIComponent(item.id != null ? item.id : i);
    d.setAttribute('data-hl-kind', 'item');
    d.setAttribute('data-hl-list', 'courses');
    d.setAttribute('data-hl-idx', i);
    d.setAttribute('data-hl-label', '课程卡片');
    var pic = document.createElement('div'); pic.className = 'pic';
    var im = document.createElement('img'); im.src = item.img || ''; im.alt = item.name || ''; im.loading = 'lazy';
    attr(im, 'img', 'courses.' + i + '.img', '课程图片');
    pic.appendChild(im);
    var nm = document.createElement('div'); nm.className = 'name'; nm.textContent = item.name || '';
    attr(nm, 'text', 'courses.' + i + '.name', '课程名称');
    var pr = document.createElement('div'); pr.className = 'price'; pr.textContent = item.price || '';
    attr(pr, 'text', 'courses.' + i + '.price', '课程价格');
    d.appendChild(pic); d.appendChild(nm); d.appendChild(pr);
    return d;
  }

  var idx = 0;
  function go() {
    var track = document.getElementById('bannerTrack');
    var dots = document.getElementById('bannerDots');
    if (!track || !dots) return;
    track.style.transform = 'translateX(-' + (idx * 100) + '%)';
    Array.prototype.forEach.call(dots.children, function (d, i) { d.className = i === idx ? 'on' : ''; });
  }

  var SEC_KEYS = { banner: 'banner', hot: 'hot', high: 'high', partners: 'partners', about: 'about', why: 'whySec', courses: 'courses', contact: 'contact', footer: 'footerText' };

  function renderAll(S) {
    src('logoImg', S.logo);
    txt('hotTitle', S.hotTitle);
    txt('highLead', S.highLead);
    txt('highTitle', S.highTitle);
    src('highPic', S.highPic);
    txt('aboutLead', S.aboutLead || DEFAULTS.aboutLead);
    txt('aboutTitle', S.aboutTitle || DEFAULTS.aboutTitle);
    src('aboutImg', S.aboutImg || DEFAULTS.aboutImg);
    txt('partnerTitle', S.partnerTitle);
    txt('whyTitle', S.whyTitle);
    txt('whySub', S.whySub);
    txt('coursesTitle', S.coursesTitle);

    var c = S.contact || {};
    txt('contactIntro', c.intro);
    txt('contactEmail', c.email);
    txt('contactTel', c.tel);
    txt('contactAddr', c.addr);
    txt('contactBrand', c.brand);
    txt('formLabel', c.formLabel);
    txt('footerText', S.footer);
    document.title = (S.name || 'highlife-culture');

    // 底部电话/拨号链接跟随联系方式
    var telNum = (c.tel || '').replace(/\D/g, '');
    if (telNum) {
      Array.prototype.forEach.call(document.querySelectorAll('a[href^="tel:"]'), function (a) {
        a.setAttribute('href', 'tel:' + telNum);
      });
    }

    // 课程卡片
    var hot = document.getElementById('hotCourses');
    var allBox = document.getElementById('allCourses');
    var courses = Array.isArray(S.courses) ? S.courses : [];
    if (hot) { hot.innerHTML = ''; courses.slice(0, 6).forEach(function (x, i) { hot.appendChild(card(x, i)); }); }
    if (allBox) { allBox.innerHTML = ''; courses.forEach(function (x, i) { allBox.appendChild(card(x, i)); }); }

    // 合作伙伴
    var pg = document.getElementById('partnerGrid');
    if (pg) {
      pg.innerHTML = '';
      (S.partners || []).forEach(function (p, i) {
        var d = document.createElement('div'); d.className = 'partner';
        d.setAttribute('data-hl-kind', 'item');
        d.setAttribute('data-hl-list', 'partners');
        d.setAttribute('data-hl-idx', i);
        d.setAttribute('data-hl-label', '合作伙伴');
        var im = document.createElement('img'); im.src = p.img || ''; im.alt = p.name || '';
        attr(im, 'img', 'partners.' + i + '.img', '伙伴Logo');
        var sp = document.createElement('span'); sp.textContent = p.name || '';
        attr(sp, 'text', 'partners.' + i + '.name', '伙伴名称');
        d.appendChild(im); d.appendChild(sp); pg.appendChild(d);
      });
    }

    // Why choose us
    var wl = document.getElementById('whyList');
    if (wl) {
      wl.innerHTML = '';
      (S.whyItems || []).forEach(function (it, i) {
        var d = document.createElement('div'); d.className = 'why-item';
        d.setAttribute('data-hl-kind', 'item');
        d.setAttribute('data-hl-list', 'whyItems');
        d.setAttribute('data-hl-idx', i);
        d.setAttribute('data-hl-label', '优势条目');
        var ico = document.createElement('span'); ico.className = 'why-ico';
        var im = document.createElement('img'); im.src = it.img || ''; im.alt = '';
        attr(im, 'img', 'whyItems.' + i + '.img', '优势图标');
        ico.appendChild(im);
        var box = document.createElement('div');
        var h3 = document.createElement('h3'); h3.textContent = it.title || '';
        attr(h3, 'text', 'whyItems.' + i + '.title', '优势标题');
        var p = document.createElement('p'); p.textContent = it.desc || '';
        attr(p, 'text', 'whyItems.' + i + '.desc', '优势描述');
        box.appendChild(h3); box.appendChild(p);
        d.appendChild(ico); d.appendChild(box); wl.appendChild(d);
      });
    }

    // 轮播
    var slides = S.banners || [];
    var track = document.getElementById('bannerTrack');
    var dots = document.getElementById('bannerDots');
    if (track) track.innerHTML = '';
    if (dots) dots.innerHTML = '';
    idx = 0;
    slides.forEach(function (s, i) {
      var sl = document.createElement('div'); sl.className = 'slide';
      sl.setAttribute('data-hl-kind', 'item');
      sl.setAttribute('data-hl-list', 'banners');
      sl.setAttribute('data-hl-idx', i);
      sl.setAttribute('data-hl-label', '轮播图');
      var im = document.createElement('img'); im.src = s.img || ''; im.alt = s.title || '';
      attr(im, 'img', 'banners.' + i + '.img', '轮播图片');
      var cap = document.createElement('div'); cap.className = 'cap';
      var h3 = document.createElement('h3'); h3.textContent = s.title || '';
      attr(h3, 'text', 'banners.' + i + '.title', '轮播标题');
      var p = document.createElement('p'); p.textContent = s.sub || '';
      attr(p, 'text', 'banners.' + i + '.sub', '轮播副标题');
      cap.appendChild(h3); cap.appendChild(p); sl.appendChild(im); sl.appendChild(cap);
      if (track) track.appendChild(sl);
      if (dots) { var dot = document.createElement('i'); dots.appendChild(dot); }
    });
    go();

    // 隐藏板块（编辑模式下仅标记，不真正隐藏）
    var hid = S.hidden || [];
    var off = !document.body.classList.contains('hl-editing');
    Object.keys(SEC_KEYS).forEach(function (k) {
      var el = document.getElementById(SEC_KEYS[k]);
      if (el) el.classList.toggle('hl-off', off && hid.indexOf(k) >= 0);
    });
  }

  // 暴露给可视化编辑器使用
  window.HL = {
    siteId: siteId,
    site: S,
    sitesMap: sitesMap,
    accounts: (draft && draft.accounts) ? draft.accounts : JSON.parse(JSON.stringify(window.HIGHLIFE_ACCOUNTS || [])),
    draftTime: draft ? draft.time : 0,
    render: function () {
      S = window.HL.sitesMap[window.HL.siteId] || S;
      renderAll(S);
    }
  };

  renderAll(S);

  // 轮播自动播放（编辑模式下暂停，避免点击目标移动）
  setInterval(function () {
    if (document.body.classList.contains('hl-editing')) return;
    var track = document.getElementById('bannerTrack');
    if (track && track.children.length) { idx = (idx + 1) % track.children.length; go(); }
  }, 4000);

  // ===== 表单真实提交：经 FormSubmit.co 转发到站长邮箱（免费、无需注册）
  // 首次提交后 FormSubmit 会向站长邮箱发一封激活邮件，点一次"Activate"即永久生效
  function ownerEmail() {
    var c = (S.contact && S.contact.email) || '';
    var m = c.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
    return m ? m[0] : '';
  }
  function sendToOwner(data, tipEl, okText) {
    var em = ownerEmail();
    if (!em) { tipEl.textContent = '站长未配置收件邮箱，暂无法在线提交，请直接电话联系'; return; }
    data._subject = data._subject || ('【官网】' + (S.name || '') + ' 新咨询');
    tipEl.textContent = '提交中…';
    if (!window.fetch) { // 极老浏览器降级：mailto
      tipEl.innerHTML = '浏览器较旧无法在线提交，<a href="mailto:' + em + '?subject=' + encodeURIComponent(data._subject) + '">点此邮件联系</a>';
      return;
    }
    fetch('https://formsubmit.co/ajax/' + em, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) { return r.json(); }).then(function (j) {
      var msg = (j && j.message) || '';
      if (j && (j.success === 'true' || j.success === true)) { tipEl.textContent = okText; }
      else if (msg.indexOf('Activation') >= 0) { tipEl.textContent = '留言已记录，邮箱通道激活中，请直接电话联系我们'; }
      else { tipEl.innerHTML = '提交暂时失败，<a href="mailto:' + em + '">点此邮件联系</a>或直接电话联系我们'; }
    }).catch(function () {
      tipEl.innerHTML = '网络异常，<a href="mailto:' + em + '">点此邮件联系</a>或直接电话联系我们';
    });
  }

  // 联系区表单（姓名 + Email + 留言）
  var btn = document.getElementById('submitBtn');
  if (btn) btn.addEventListener('click', function () {
    if (document.body.classList.contains('hl-editing')) return;
    var nameI = document.getElementById('cfName');
    var mailI = document.getElementById('cfEmail');
    var msgT = document.getElementById('cfMsg');
    var tip = document.getElementById('formTip');
    var v = ((mailI && mailI.value) || '').trim();
    if (!/^\S+@\S+\.\S+$/.test(v)) { tip.textContent = '请输入有效 Email'; return; }
    sendToOwner({
      _subject: '【官网咨询】' + (S.name || ''),
      姓名: ((nameI && nameI.value) || '').trim() || '未填写',
      Email: v,
      留言: ((msgT && msgT.value) || '').trim() || '（无留言，仅留下联系方式）'
    }, tip, '提交成功，我们会尽快联系您！');
    if (mailI) mailI.value = ''; if (msgT) msgT.value = '';
  });

  // 菜单（编辑模式下不触发）
  var mask = document.getElementById('menuMask');
  var panel = document.getElementById('menuPanel');
  function openMenu() {
    if (document.body.classList.contains('hl-editing')) return;
    mask.style.display = 'block'; panel.classList.add('show');
  }
  function closeMenu() { mask.style.display = 'none'; panel.classList.remove('show'); }
  if (mask) mask.addEventListener('click', closeMenu);
  var xlink = document.querySelector('.menu-grid a:last-child');
  if (xlink) xlink.addEventListener('click', function (e) { e.preventDefault(); closeMenu(); });
  var logo = document.querySelector('.brand-logo');
  if (logo) logo.addEventListener('dblclick', openMenu);

  // 搜索课程：输入关键词过滤，点击结果进详情页，回车去第一条/课程区
  var sInput = document.getElementById('searchInput');
  var sBox = document.getElementById('searchResults');
  if (sInput && sBox) {
    var sTimer = null;
    function renderResults(q) {
      var kw = (q || '').trim().toLowerCase();
      if (!kw) { sBox.style.display = 'none'; sBox.innerHTML = ''; return; }
      var courses = Array.isArray(S.courses) ? S.courses : [];
      var hits = [];
      courses.forEach(function (x, i) {
        var name = (x.name || '').toLowerCase();
        var price = (x.price || '').toLowerCase();
        if (name.indexOf(kw) >= 0 || price.indexOf(kw) >= 0) hits.push({ item: x, idx: i });
      });
      sBox.innerHTML = '';
      if (!hits.length) {
        var e = document.createElement('div');
        e.className = 's-empty';
        e.textContent = '没有找到「' + q.trim() + '」相关的课程';
        sBox.appendChild(e);
      } else {
        hits.slice(0, 8).forEach(function (h) {
          var a = document.createElement('a');
          a.href = 'course.html?t=' + encodeURIComponent(siteId) + '&id=' + encodeURIComponent(h.item.id != null ? h.item.id : h.idx);
          var n = document.createElement('span'); n.textContent = h.item.name || '';
          var p = document.createElement('span'); p.className = 's-price'; p.textContent = h.item.price || '';
          a.appendChild(n); a.appendChild(p);
          sBox.appendChild(a);
        });
      }
      sBox.style.display = 'block';
    }
    sInput.addEventListener('input', function () {
      clearTimeout(sTimer);
      sTimer = setTimeout(function () { renderResults(sInput.value); }, 120);
    });
    sInput.addEventListener('focus', function () { if (sInput.value.trim()) renderResults(sInput.value); });
    sInput.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') {
        var first = sBox.querySelector('a');
        if (first) location.href = first.href;
        else if (sInput.value.trim()) { var c = document.getElementById('courses'); if (c) c.scrollIntoView({ behavior: 'smooth' }); }
      } else if (ev.key === 'Escape') { sBox.style.display = 'none'; }
    });
    document.addEventListener('click', function (ev) {
      if (ev.target !== sInput && !sBox.contains(ev.target)) sBox.style.display = 'none';
    });
  }
})();
