(function () {
  // 读取 ?t= 指定的学员站点；无参数用第一个站点
  var params = new URLSearchParams(location.search);
  var siteId = params.get('t');
  var sites = window.HIGHLIFE_SITES || {};
  var ids = Object.keys(sites);
  if (!siteId || !sites[siteId]) siteId = ids[0];
  var S = sites[siteId] || {};
  window.HIGHLIFE_CURRENT_SITE = siteId;

  function txt(id, v) { var el = document.getElementById(id); if (el) el.textContent = v == null ? '' : v; }
  function src(id, v) { var el = document.getElementById(id); if (el && v) el.src = v; }

  // 基本信息
  src('logoImg', S.logo);
  txt('hotTitle', S.hotTitle);
  txt('highLead', S.highLead);
  txt('highTitle', S.highTitle);
  src('highPic', S.highPic);
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

  function card(item) {
    var d = document.createElement('a');
    d.className = 'course'; d.href = '#contact';
    var pic = document.createElement('div'); pic.className = 'pic';
    var im = document.createElement('img'); im.src = item.img || ''; im.alt = item.name || ''; im.loading = 'lazy';
    pic.appendChild(im);
    var nm = document.createElement('div'); nm.className = 'name'; nm.textContent = item.name || '';
    var pr = document.createElement('div'); pr.className = 'price'; pr.textContent = item.price || '';
    d.appendChild(pic); d.appendChild(nm); d.appendChild(pr);
    return d;
  }

  var hot = document.getElementById('hotCourses');
  var allBox = document.getElementById('allCourses');
  var courses = Array.isArray(S.courses) ? S.courses : [];
  if (hot) { hot.innerHTML = ''; courses.slice(0, 6).forEach(function (x) { hot.appendChild(card(x)); }); }
  if (allBox) { allBox.innerHTML = ''; courses.forEach(function (x) { allBox.appendChild(card(x)); }); }

  // 合作伙伴
  var pg = document.getElementById('partnerGrid');
  if (pg) {
    pg.innerHTML = '';
    (S.partners || []).forEach(function (p) {
      var d = document.createElement('div'); d.className = 'partner';
      var im = document.createElement('img'); im.src = p.img || ''; im.alt = p.name || '';
      var sp = document.createElement('span'); sp.textContent = p.name || '';
      d.appendChild(im); d.appendChild(sp); pg.appendChild(d);
    });
  }

  // Why choose us
  var wl = document.getElementById('whyList');
  if (wl) {
    wl.innerHTML = '';
    (S.whyItems || []).forEach(function (it) {
      var d = document.createElement('div'); d.className = 'why-item';
      var ico = document.createElement('span'); ico.className = 'why-ico';
      var im = document.createElement('img'); im.src = it.img || ''; im.alt = '';
      ico.appendChild(im);
      var box = document.createElement('div');
      var h3 = document.createElement('h3'); h3.textContent = it.title || '';
      var p = document.createElement('p'); p.textContent = it.desc || '';
      box.appendChild(h3); box.appendChild(p);
      d.appendChild(ico); d.appendChild(box); wl.appendChild(d);
    });
  }

  // 轮播
  var slides = S.banners || [];
  var track = document.getElementById('bannerTrack');
  var dots = document.getElementById('bannerDots');
  var idx = 0;
  slides.forEach(function (s) {
    var sl = document.createElement('div'); sl.className = 'slide';
    var im = document.createElement('img'); im.src = s.img || ''; im.alt = s.title || '';
    var cap = document.createElement('div'); cap.className = 'cap';
    var h3 = document.createElement('h3'); h3.textContent = s.title || '';
    var p = document.createElement('p'); p.textContent = s.sub || '';
    cap.appendChild(h3); cap.appendChild(p); sl.appendChild(im); sl.appendChild(cap);
    track.appendChild(sl);
    var dot = document.createElement('i'); dots.appendChild(dot);
  });
  function go() {
    track.style.transform = 'translateX(-' + (idx * 100) + '%)';
    Array.prototype.forEach.call(dots.children, function (d, i) { d.className = i === idx ? 'on' : ''; });
  }
  if (slides.length) { go(); setInterval(function () { idx = (idx + 1) % slides.length; go(); }, 4000); }

  // 表单
  var btn = document.getElementById('submitBtn');
  if (btn) btn.addEventListener('click', function () {
    var input = document.querySelector('.cform input');
    var tip = document.getElementById('formTip');
    var v = (input.value || '').trim();
    if (!/^\S+@\S+\.\S+$/.test(v)) { tip.textContent = '请输入有效 Email'; return; }
    tip.textContent = '提交成功，我们会尽快联系您！'; input.value = '';
  });

  // 菜单
  var mask = document.getElementById('menuMask');
  var panel = document.getElementById('menuPanel');
  function openMenu() { mask.style.display = 'block'; panel.classList.add('show'); }
  function closeMenu() { mask.style.display = 'none'; panel.classList.remove('show'); }
  mask.addEventListener('click', closeMenu);
  var xlink = document.querySelector('.menu-grid a:last-child');
  if (xlink) xlink.addEventListener('click', function (e) { e.preventDefault(); closeMenu(); });
  var logo = document.querySelector('.brand-logo');
  if (logo) logo.addEventListener('dblclick', openMenu);
})();
