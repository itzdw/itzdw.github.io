(function () {
  // 课程数据完全来自 data.js（静态数据源），页面打开时读取一次
  function getCourses() {
    return Array.isArray(window.HIGHLIFE_COURSES) ? window.HIGHLIFE_COURSES : [];
  }
  function card(c) {
    var d = document.createElement('a');
    d.className = 'course';
    d.href = '#contact';
    var pic = document.createElement('div'); pic.className = 'pic';
    var im = document.createElement('img'); im.src = c.img; im.alt = c.name; im.loading = 'lazy';
    pic.appendChild(im);
    var nm = document.createElement('div'); nm.className = 'name'; nm.textContent = c.name;
    var pr = document.createElement('div'); pr.className = 'price'; pr.textContent = c.price;
    d.appendChild(pic); d.appendChild(nm); d.appendChild(pr);
    return d;
  }
  function render() {
    var all = getCourses();
    var hot = document.getElementById('hotCourses');
    var allBox = document.getElementById('allCourses');
    if (hot) { hot.innerHTML = ''; all.slice(0, 6).forEach(function (c) { hot.appendChild(card(c)); }); }
    if (allBox) { allBox.innerHTML = ''; all.forEach(function (c) { allBox.appendChild(card(c)); }); }
  }
  render();

  // 轮播
  var slides = [
    { img: 'images/img_009.jpg', h: '高品质课程', p: 'HIGH LIFE 只提供' },
    { img: 'images/img_019.jpg', h: '国际化 · 专业化', p: '国际技术交流平台' },
    { img: 'images/img_010.jpg', h: '蜡烛艺术', p: 'JCA 认证课程体系' }
  ];
  var track = document.getElementById('bannerTrack');
  var dots = document.getElementById('bannerDots');
  var idx = 0;
  slides.forEach(function (s) {
    var sl = document.createElement('div'); sl.className = 'slide';
    var im = document.createElement('img'); im.src = s.img; im.alt = s.h;
    var cap = document.createElement('div'); cap.className = 'cap';
    var h3 = document.createElement('h3'); h3.textContent = s.h;
    var p = document.createElement('p'); p.textContent = s.p;
    cap.appendChild(h3); cap.appendChild(p); sl.appendChild(im); sl.appendChild(cap);
    track.appendChild(sl);
    var dot = document.createElement('i'); dots.appendChild(dot);
  });
  function go() {
    track.style.transform = 'translateX(-' + (idx * 100) + '%)';
    Array.prototype.forEach.call(dots.children, function (d, i) { d.className = i === idx ? 'on' : ''; });
  }
  go();
  setInterval(function () { idx = (idx + 1) % slides.length; go(); }, 4000);

  // 表单
  var btn = document.getElementById('submitBtn');
  if (btn) btn.addEventListener('click', function () {
    var input = document.querySelector('.cform input');
    var tip = document.getElementById('formTip');
    var v = (input.value || '').trim();
    if (!/^\S+@\S+\.\S+$/.test(v)) { tip.textContent = '请输入有效 Email'; return; }
    tip.textContent = '提交成功，我们会尽快联系您！'; input.value = '';
  });

  // 底部"更多"菜单（点击底部导航中间或菜单按钮触发）
  var mask = document.getElementById('menuMask');
  var panel = document.getElementById('menuPanel');
  function openMenu() { mask.style.display = 'block'; panel.classList.add('show'); }
  function closeMenu() { mask.style.display = 'none'; panel.classList.remove('show'); }
  if (mask) mask.addEventListener('click', closeMenu);
  // 点击底部 Home 旁区域，或长按底部栏也可打开；这里给菜单里的 X 绑定关闭
  var xlink = document.querySelector('.menu-grid a:last-child');
  if (xlink) xlink.addEventListener('click', function (e) { e.preventDefault(); closeMenu(); });
  // 在底部导航加一个隐藏入口：双击 Logo 打开菜单
  var logo = document.querySelector('.brand-logo');
  if (logo) logo.addEventListener('dblclick', openMenu);
  window.HIGHLIFE_OPEN_MENU = openMenu;
})();
