/* ============================================================
 * HIGH LIFE 可视化拖拉编辑器
 * ------------------------------------------------------------
 * 在预览页直接点击元素进行：编辑文字 / 更换图片 / 隐藏·显示板块 /
 * 卡片的编辑、排序、删除、添加。所有修改写入与后台共用的
 * localStorage 草稿（hl_cms_draft_v1），后台打开后会自动同步到 GitHub。
 * 进入方式：后台「✏️ 可视化编辑」跳转（index.html?t=站点ID&edit=1，需后台账号登录）；前台展示页不显示任何编辑入口
 * ============================================================ */
(function () {
  if (!window.HL) return;

  var DRAFT_KEY = 'hl_cms_draft_v1';

  var IMG_OPTIONS = [];
  (function () {
    var pngSet = [2, 14, 17, 18, 20, 21, 22, 23, 32, 33, 34, 35, 36, 37, 38, 39, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51];
    for (var i = 1; i <= 51; i++) {
      IMG_OPTIONS.push('images/img_' + ('00' + i).slice(-3) + '.' + (pngSet.indexOf(i) >= 0 ? 'png' : 'jpg'));
    }
  })();

  var SECTIONS = [
    { key: 'banner',   el: 'banner',    label: '轮播图' },
    { key: 'hot',      el: 'hot',       label: '人气课程' },
    { key: 'high',     el: 'high',      label: '高品质课程' },
    { key: 'partners', el: 'partners',  label: '合作伙伴' },
    { key: 'about',    el: 'about',     label: '关于我们' },
    { key: 'why',      el: 'whySec',    label: 'Why choose us' },
    { key: 'courses',  el: 'courses',   label: '我们的课程' },
    { key: 'msgs',     el: 'msgs',      label: '学员留言' },
    { key: 'contact',  el: 'contact',   label: '联系报名' },
    { key: 'footer',   el: 'footerText', label: '页脚' }
  ];

  var LIST_DEFS = {
    banners:  { label: '轮播图',   add: { img: IMG_OPTIONS[0], title: '新轮播', sub: '' },
                fields: [{ k: 'img', type: 'img', l: '图片' }, { k: 'title', type: 'text', l: '标题' }, { k: 'sub', type: 'text', l: '副标题' }] },
    courses:  { label: '课程',     add: { id: 0, name: '新课程', price: '￥0', img: IMG_OPTIONS[2], desc: '', detail: '', imgs: [] },
                fields: [{ k: 'name', type: 'text', l: '课程名称' }, { k: 'price', type: 'text', l: '价格' }, { k: 'img', type: 'img', l: '课程图片' }, { k: 'desc', type: 'text', l: '副标题（详情页展示）' }, { k: 'detail', type: 'textarea', l: '详情介绍（详情页展示，空行分段）' }] },
    partners: { label: '合作伙伴', add: { img: IMG_OPTIONS[10], name: '新伙伴' },
                fields: [{ k: 'name', type: 'text', l: '名称' }, { k: 'img', type: 'img', l: 'Logo图片' }] },
    whyItems: { label: '优势条目', add: { img: IMG_OPTIONS[19], title: '新优势', desc: '优势描述' },
                fields: [{ k: 'title', type: 'text', l: '标题' }, { k: 'desc', type: 'textarea', l: '描述' }, { k: 'img', type: 'img', l: '图标' }] },
    msgs:     { label: '留言',     add: { name: '学员', text: '留言内容', time: '' },
                fields: [{ k: 'name', type: 'text', l: '称呼' }, { k: 'text', type: 'textarea', l: '留言内容' }, { k: 'time', type: 'text', l: '时间（如 2026-11-20）' }] }
  };
  var LIST_CONTAINERS = { banners: 'bannerTrack', courses: 'allCourses', partners: 'partnerGrid', whyItems: 'whyList', msgs: 'msgList' };

  var editing = false;
  var undoStack = [];
  var textEditing = false;
  var bar = null, barAnchor = null;
  var modalWrap = null;
  var toastTimer = null;

  // ---------- 基础样式 ----------
  var css = [
    '#hlToolbar,#hlBar,.hl-sec-chip,#hlToast{font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;box-sizing:border-box}',
    '#hlToolbar{position:fixed;top:0;left:0;right:0;z-index:10001;background:#1f2d3d;color:#fff;display:flex;align-items:center;gap:8px;padding:8px 10px;font-size:13px}',
    '#hlToolbar .hl-tt{font-weight:bold;margin-right:auto}',
    '#hlToolbar button{background:#469bb7;border:none;color:#fff;border-radius:4px;padding:6px 12px;font-size:13px;cursor:pointer}',
    '#hlToolbar button.hl-done{background:#67c23a}',
    '#hlToolbar button:disabled{opacity:.4;cursor:not-allowed}',
    '#hlHint{position:fixed;top:44px;left:0;right:0;z-index:10001;background:rgba(70,155,183,.92);color:#fff;font-size:12px;padding:5px 10px;text-align:center}',
    'body.hl-editing{padding-top:74px}',
    'body.hl-editing [data-hl-kind]{outline:1.5px dashed #469bb7;outline-offset:2px;cursor:pointer}',
    'body.hl-editing [data-hl-kind]:hover{outline-color:#e6a23c;box-shadow:0 0 0 4px rgba(70,155,183,.10)}',
    'body.hl-editing .hl-sec{position:relative}',
    '.hl-sec-chip{position:absolute;top:4px;right:4px;z-index:9990;background:rgba(70,155,183,.92);color:#fff;border:none;border-radius:12px;padding:3px 10px;font-size:12px;cursor:pointer}',
    '.hl-sec-chip.hl-sec-off{background:rgba(245,108,108,.92)}',
    '.hl-add{display:block;margin:10px auto;background:#fff;border:1.5px dashed #469bb7;color:#469bb7;border-radius:6px;padding:8px 20px;font-size:13px;cursor:pointer}',
    '.hl-off{display:none!important}',
    'body.hl-editing .hl-off{display:block!important;opacity:.35;outline:2px dashed #f56c6c!important}',
    '#hlBar{position:fixed;z-index:10002;background:#1f2d3d;border-radius:8px;padding:6px;display:flex;gap:6px;box-shadow:0 6px 18px rgba(0,0,0,.35)}',
    '#hlBar button{background:#469bb7;border:none;color:#fff;border-radius:4px;padding:6px 10px;font-size:12px;cursor:pointer;white-space:nowrap}',
    '#hlBar button.hl-danger{background:#f56c6c}',
    'body.hl-editing [contenteditable="true"]{outline:2px solid #e6a23c!important;background:rgba(230,162,60,.12);min-width:20px}',
    '#hlToast{position:fixed;left:50%;bottom:120px;transform:translateX(-50%);z-index:10005;background:rgba(0,0,0,.78);color:#fff;padding:9px 18px;border-radius:6px;font-size:13px;max-width:80vw;text-align:center;transition:opacity .3s;opacity:0;pointer-events:none}',
    '#hlToast.show{opacity:1}',
    '#hlModalWrap{position:fixed;inset:0;z-index:10003;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center}',
    '.hl-modal{background:#fff;border-radius:10px;width:min(92vw,420px);max-height:82vh;display:flex;flex-direction:column;overflow:hidden}',
    '.hl-modal-hd{padding:12px 14px;font-weight:bold;font-size:15px;border-bottom:1px solid #eee;display:flex;align-items:center}',
    '.hl-modal-hd .hl-x{margin-left:auto;border:none;background:#eee;border-radius:50%;width:24px;height:24px;line-height:24px;text-align:center;cursor:pointer;font-size:13px}',
    '.hl-modal-bd{padding:12px 14px;overflow:auto;font-size:13px}',
    '.hl-modal-ft{padding:10px 14px;border-top:1px solid #eee;display:flex;gap:8px;justify-content:flex-end}',
    '.hl-modal-ft button{border:none;border-radius:5px;padding:8px 16px;font-size:13px;cursor:pointer;background:#eee;color:#333}',
    '.hl-modal-ft button.hl-primary{background:#469bb7;color:#fff}',
    '.hl-field{margin-bottom:10px}',
    '.hl-field label{display:block;color:#666;margin-bottom:4px;font-size:12px}',
    '.hl-field input[type=text],.hl-field textarea{width:100%;box-sizing:border-box;border:1px solid #ddd;border-radius:5px;padding:8px;font-size:13px;font-family:inherit}',
    '.hl-field textarea{min-height:64px}',
    '.hl-img-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:8px}',
    '.hl-img-grid img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:5px;border:2px solid transparent;cursor:pointer}',
    '.hl-img-grid img.on{border-color:#469bb7;box-shadow:0 0 0 2px rgba(70,155,183,.3)}',
    '.hl-up-btn{width:100%;margin-bottom:10px;padding:9px 0;background:#f0f8fb;border:1px dashed #469bb7;color:#469bb7;border-radius:6px;font-size:13px;cursor:pointer}',
    '.hl-up-btn:hover{background:#e2f1f6}',
    '.hl-code{width:100%;box-sizing:border-box;min-height:220px;font-family:Consolas,monospace;font-size:11px;border:1px solid #ddd;border-radius:5px;padding:8px}'
  ].join('\n');
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ---------- 工具 ----------
  function toast(msg) {
    var t = document.getElementById('hlToast');
    t.textContent = msg; t.className = 'show';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = ''; }, 2200);
  }
  function snap() { return JSON.stringify({ sites: HL.sitesMap, accounts: HL.accounts }); }
  function pushUndo() {
    undoStack.push(snap());
    if (undoStack.length > 30) undoStack.shift();
    updateToolbar();
  }
  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ sites: HL.sitesMap, accounts: HL.accounts, time: Date.now() }));
      HL.draftTime = Date.now();
    } catch (e) { toast('草稿保存失败：存储空间不足'); }
  }
  function getPath(path) {
    var parts = path.split('.'), o = HL.site;
    for (var i = 0; i < parts.length; i++) { if (o == null) return undefined; o = o[parts[i]]; }
    return o;
  }
  function setPath(path, val) {
    var parts = path.split('.'), o = HL.site;
    for (var i = 0; i < parts.length - 1; i++) {
      if (o[parts[i]] == null) o[parts[i]] = {};
      o = o[parts[i]];
    }
    o[parts[parts.length - 1]] = val;
    pushUndo(); saveDraft(); HL.render();
  }
  function getList(name) {
    if (!Array.isArray(HL.site[name])) HL.site[name] = [];
    return HL.site[name];
  }
  function isHidden(key) {
    var hid = HL.site.hidden || (HL.site.hidden = []);
    return hid.indexOf(key) >= 0;
  }
  function toggleSection(key) {
    var hid = HL.site.hidden || (HL.site.hidden = []);
    var i = hid.indexOf(key);
    if (i >= 0) { hid.splice(i, 1); toast('已显示「' + secLabel(key) + '」板块'); }
    else { hid.push(key); toast('已隐藏「' + secLabel(key) + '」板块（预览页不再显示）'); }
    pushUndo(); saveDraft(); HL.render(); refreshChips(); hideBar();
  }
  function secLabel(key) {
    for (var i = 0; i < SECTIONS.length; i++) if (SECTIONS[i].key === key) return SECTIONS[i].label;
    return key;
  }
  function isLoggedIn() {
    var u = sessionStorage.getItem('hl_admin_user');
    if (!u) return false;
    return (HL.accounts || []).some(function (a) { return a.user === u; });
  }

  // ---------- 浮动操作条 ----------
  function hideBar() {
    if (bar) { bar.parentNode.removeChild(bar); bar = null; barAnchor = null; }
  }
  function showBar(buttons, anchor) {
    hideBar();
    bar = document.createElement('div');
    bar.id = 'hlBar';
    buttons.forEach(function (b) {
      var el = document.createElement('button');
      el.textContent = b.t;
      if (b.cls) el.className = b.cls;
      el.addEventListener('click', function (e) { e.stopPropagation(); b.fn(); });
      bar.appendChild(el);
    });
    document.body.appendChild(bar);
    var r = anchor.getBoundingClientRect();
    var bw = bar.offsetWidth, bh = bar.offsetHeight;
    var top = r.top - bh - 8;
    if (top < 60) top = Math.min(r.bottom + 8, window.innerHeight - bh - 10);
    var left = Math.max(6, Math.min(r.left + r.width / 2 - bw / 2, window.innerWidth - bw - 6));
    bar.style.top = top + 'px';
    bar.style.left = left + 'px';
    barAnchor = anchor;
  }

  // ---------- 模态框 ----------
  function openModal(title, bodyBuilder, footerButtons) {
    closeModal();
    modalWrap = document.createElement('div');
    modalWrap.id = 'hlModalWrap';
    var m = document.createElement('div'); m.className = 'hl-modal';
    var hd = document.createElement('div'); hd.className = 'hl-modal-hd';
    hd.innerHTML = '<span>' + title + '</span>';
    var x = document.createElement('button'); x.className = 'hl-x'; x.textContent = '×';
    x.addEventListener('click', closeModal);
    hd.appendChild(x);
    var bd = document.createElement('div'); bd.className = 'hl-modal-bd';
    bodyBuilder(bd);
    var ft = document.createElement('div'); ft.className = 'hl-modal-ft';
    (footerButtons || []).forEach(function (b) {
      var el = document.createElement('button');
      el.textContent = b.t;
      if (b.primary) el.className = 'hl-primary';
      el.addEventListener('click', b.fn);
      ft.appendChild(el);
    });
    m.appendChild(hd); m.appendChild(bd); m.appendChild(ft);
    modalWrap.appendChild(m);
    document.body.appendChild(modalWrap);
    modalWrap.addEventListener('click', function (e) { if (e.target === modalWrap) closeModal(); });
  }
  function closeModal() {
    if (modalWrap) { modalWrap.parentNode.removeChild(modalWrap); modalWrap = null; }
  }

  // ---------- 图片上传（GitHub Contents API，需后台已配置令牌） ----------
  function readSyncSettings() {
    try { return JSON.parse(localStorage.getItem('hl_cms_sync_v1') || '{}'); } catch (e) { return {}; }
  }
  function repoPagesBase(repo) {
    if (!repo || repo.indexOf('/') < 0) return '';
    var owner = repo.split('/')[0], name = repo.split('/')[1];
    if (name === owner + '.github.io') return 'https://' + owner + '.github.io';
    return 'https://' + owner + '.github.io/' + name;
  }
  // 大图压缩到 1280px 内（>800KB 才压缩；PNG 小图保留原样避免透明变黑）
  function compressImage(file, cb) {
    if (file.size <= 800 * 1024) { cb(null); return; }
    var img = new Image();
    var u = URL.createObjectURL(file);
    img.onload = function () {
      var scale = Math.min(1, 1280 / Math.max(img.width, img.height));
      var c = document.createElement('canvas');
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(u);
      cb(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = function () { URL.revokeObjectURL(u); cb(null); };
    img.src = u;
  }
  function fileToB64(file, cb) {
    var fr = new FileReader();
    fr.onload = function () { cb(String(fr.result).split(',')[1]); };
    fr.readAsDataURL(file);
  }
  // 上传到仓库 highlife/images/upload/，成功回调完整 URL
  function uploadImageFile(file, cb) {
    var cfg = readSyncSettings();
    if (!cfg.token) { toast('请先到后台「自动同步设置」填写 GitHub 令牌，再上传图片'); return; }
    if (!cfg.repo || cfg.repo.indexOf('/') < 0) { toast('请先到后台「自动同步设置」填写仓库'); return; }
    var branch = cfg.branch || 'master';
    toast('上传中，请稍候...');
    compressImage(file, function (dataUrl) {
      var after = function (b64, ext) {
        var safe = (file.name || 'img').replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '') || 'img';
        var path = 'highlife/images/upload/' + Date.now() + '-' + safe;
        fetch('https://api.github.com/repos/' + cfg.repo + '/contents/' + path, {
          method: 'PUT',
          headers: { 'Authorization': 'Bearer ' + cfg.token, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'upload image', content: b64, branch: branch })
        }).then(function (r) {
          if (!r.ok) return r.json().catch(function () { return {}; }).then(function (j) {
            throw new Error(j.message || ('HTTP ' + r.status));
          });
          return r.json();
        }).then(function (j) {
          var base = repoPagesBase(cfg.repo);
          var url = base ? base + '/' + path : (j.content && j.content.download_url) || '';
          if (!url) throw new Error('未取到图片地址');
          cb(url);
          toast('上传成功，约 1 分钟后全站生效');
        }).catch(function (e) {
          var m = String(e.message || e);
          toast(m.indexOf('Bad credentials') >= 0 ? '上传失败：令牌无效' :
            m.indexOf('Resource not accessible') >= 0 ? '上传失败：令牌需 Contents 读写权限' :
            '上传失败：' + m.slice(0, 60));
        });
      };
      if (dataUrl) after(dataUrl.split(',')[1], 'jpg');
      else fileToB64(file, function (b64) { after(b64, (file.name.match(/\.(\w+)$/) || [, 'jpg'])[1]); });
    });
  }

  // 图片选择器
  function pickImage(current, cb) {
    var chosen = current || '';
    openModal('选择图片', function (bd) {
      var grid = document.createElement('div'); grid.className = 'hl-img-grid';
      function mark() {
        Array.prototype.forEach.call(grid.querySelectorAll('img'), function (im) {
          im.className = im.getAttribute('data-src') === chosen ? 'on' : '';
        });
      }
      IMG_OPTIONS.forEach(function (u) {
        var im = document.createElement('img');
        im.src = u; im.setAttribute('data-src', u); im.loading = 'lazy';
        im.addEventListener('click', function () { chosen = u; urlInput.value = u; mark(); });
        grid.appendChild(im);
      });
      bd.appendChild(grid);
      var up = document.createElement('button'); up.className = 'hl-up-btn';
      up.textContent = '⬆ 上传本机图片';
      up.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var inp = document.createElement('input');
        inp.type = 'file'; inp.accept = 'image/*';
        inp.addEventListener('change', function () {
          var f = inp.files && inp.files[0];
          if (!f) return;
          if (!/^image\//.test(f.type)) { toast('请选择图片文件'); return; }
          uploadImageFile(f, function (url) {
            chosen = url; urlInput.value = url; mark();
            if (IMG_OPTIONS.indexOf(url) < 0) IMG_OPTIONS.push(url);
            closeModal(); cb(url);
          });
        });
        inp.click();
      });
      bd.appendChild(up);
      var lbl = document.createElement('div'); lbl.className = 'hl-field';
      lbl.innerHTML = '<label>或输入自定义图片地址 / URL</label>';
      var urlInput = document.createElement('input'); urlInput.type = 'text'; urlInput.value = chosen || '';
      urlInput.addEventListener('input', function () { chosen = urlInput.value.trim(); mark(); });
      lbl.appendChild(urlInput);
      bd.appendChild(lbl);
      mark();
    }, [
      { t: '取消', fn: closeModal },
      { t: '确定', primary: true, fn: function () { closeModal(); cb(chosen); } }
    ]);
  }

  // 列表项编辑
  function editItemDialog(listName, idx) {
    var def = LIST_DEFS[listName];
    var item = getList(listName)[idx];
    if (!item) return;
    openModal('编辑' + def.label, function (bd) {
      def.fields.forEach(function (f) {
        var wrap = document.createElement('div'); wrap.className = 'hl-field';
        wrap.innerHTML = '<label>' + f.l + '</label>';
        if (f.type === 'img') {
          var im = document.createElement('img');
          im.src = item[f.k] || ''; im.style.cssText = 'width:100%;max-height:120px;object-fit:cover;border-radius:6px;cursor:pointer';
          im.addEventListener('click', function () {
            pickImage(item[f.k], function (u) { item[f.k] = u; im.src = u; });
          });
          wrap.appendChild(im);
          var tip = document.createElement('div'); tip.style.cssText = 'color:#999;font-size:11px;margin-top:4px';
          tip.textContent = '点击图片更换';
          wrap.appendChild(tip);
        } else if (f.type === 'textarea') {
          var ta = document.createElement('textarea'); ta.value = item[f.k] || '';
          ta.setAttribute('data-fk', f.k);
          wrap.appendChild(ta);
        } else {
          var inp = document.createElement('input'); inp.type = 'text'; inp.value = item[f.k] || '';
          inp.setAttribute('data-fk', f.k);
          wrap.appendChild(inp);
        }
        bd.appendChild(wrap);
      });
    }, [
      { t: '取消', fn: closeModal },
      { t: '保存', primary: true, fn: function () {
        Array.prototype.forEach.call(bd.querySelectorAll('[data-fk]'), function (inp) {
          item[inp.getAttribute('data-fk')] = inp.value;
        });
        closeModal(); pushUndo(); saveDraft(); HL.render();
        toast('已保存');
      } }
    ]);
  }

  // ---------- 文本 inline 编辑 ----------
  function startTextEdit(el) {
    if (textEditing) return;
    textEditing = true;
    var path = el.getAttribute('data-hl-path');
    var old = el.textContent;
    el.setAttribute('contenteditable', 'true');
    el.focus();
    // 全选
    try {
      var range = document.createRange(); range.selectNodeContents(el);
      var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
    } catch (e) {}
    function finish(save) {
      el.removeEventListener('blur', onBlur);
      document.removeEventListener('keydown', onKey, true);
      el.removeAttribute('contenteditable');
      textEditing = false;
      hideDoneBtn();
      var val = el.textContent.trim();
      if (save && val !== old.trim()) {
        setPath(path, val);
        toast('已保存：' + (val.length > 12 ? val.slice(0, 12) + '…' : val));
      } else if (!save) {
        el.textContent = old;
      }
    }
    var doneBtn = document.createElement('button');
    doneBtn.id = 'hlDoneBtn';
    doneBtn.style.cssText = 'position:fixed;z-index:10004;background:#67c23a;color:#fff;border:none;border-radius:4px;padding:8px 16px;font-size:13px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.3)';
    function placeDone() {
      var r = el.getBoundingClientRect();
      doneBtn.style.left = Math.max(6, Math.min(r.left, window.innerWidth - 90)) + 'px';
      doneBtn.style.top = Math.max(80, r.top - 40) + 'px';
      doneBtn.textContent = '✔ 完成编辑';
    }
    function hideDoneBtn() { if (doneBtn.parentNode) doneBtn.parentNode.removeChild(doneBtn); }
    doneBtn.addEventListener('click', function () { finish(true); });
    function onBlur() { finish(true); }
    function onKey(e) {
      if (e.key === 'Enter' && !e.shiftKey && el.tagName !== 'P') { e.preventDefault(); e.stopPropagation(); finish(true); }
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(false); }
    }
    document.body.appendChild(doneBtn);
    placeDone();
    window.addEventListener('scroll', placeDone, true);
    setTimeout(function () { window.removeEventListener('scroll', placeDone, true); }, 30000);
    el.addEventListener('blur', onBlur);
    document.addEventListener('keydown', onKey, true);
  }

  // ---------- 事件分发 ----------
  document.addEventListener('click', function (e) {
    if (!editing) return;
    if (e.target.closest('#hlToolbar') || e.target.closest('#hlHint') || e.target.closest('#hlBar') ||
        e.target.closest('#hlModalWrap') || e.target.closest('#hlToast')) return;
    var chip = e.target.closest('.hl-sec-chip');
    if (chip) {
      e.preventDefault(); e.stopPropagation();
      toggleSection(chip.getAttribute('data-sec'));
      return;
    }
    if (e.target.closest('.hl-add')) return; // 有自己的监听
    var t = e.target.closest('[data-hl-kind]');
    if (t) {
      e.preventDefault(); e.stopPropagation();
      var kind = t.getAttribute('data-hl-kind');
      if (textEditing) return;
      if (kind === 'text') { startTextEdit(t); }
      else if (kind === 'img') {
        pickImage(getPath(t.getAttribute('data-hl-path')) || '', function (u) {
          if (u) { setPath(t.getAttribute('data-hl-path'), u); toast('图片已更换'); }
        });
      } else if (kind === 'item') {
        itemActions(t);
      }
      return;
    }
    // 编辑模式下阻止页面内跳转
    var a = e.target.closest('a');
    if (a && a.closest('.wap, .float-tools, .tabbar, .menu-panel')) e.preventDefault();
    hideBar();
  }, true);

  function itemActions(el) {
    var listName = el.getAttribute('data-hl-list');
    var idx = parseInt(el.getAttribute('data-hl-idx'), 10);
    var def = LIST_DEFS[listName];
    var arr = getList(listName);
    var btns = [{ t: '✏️ 编辑', fn: function () { hideBar(); editItemDialog(listName, idx); } }];
    if (idx > 0) btns.push({ t: '⬆ 上移', fn: function () {
      pushUndo(); arr.splice(idx - 1, 0, arr.splice(idx, 1)[0]); saveDraft(); HL.render(); hideBar();
    } });
    if (idx < arr.length - 1) btns.push({ t: '⬇ 下移', fn: function () {
      pushUndo(); arr.splice(idx + 1, 0, arr.splice(idx, 1)[0]); saveDraft(); HL.render(); hideBar();
    } });
    btns.push({ t: '🗑 删除', cls: 'hl-danger', fn: function () {
      if (!confirm('确定删除这个' + def.label + '吗？')) return;
      pushUndo(); arr.splice(idx, 1); saveDraft(); HL.render(); hideBar();
      toast('已删除，点工具条「撤销」可恢复');
    } });
    showBar(btns, el);
  }

  // ---------- 板块标记 ----------
  function injectChips() {
    refreshChips();
    // 列表「添加」按钮
    Object.keys(LIST_CONTAINERS).forEach(function (name) {
      var box = document.getElementById(LIST_CONTAINERS[name]);
      if (!box || box.parentNode.querySelector('.hl-add[data-list="' + name + '"]')) return;
      var btn = document.createElement('button');
      btn.className = 'hl-add';
      btn.setAttribute('data-list', name);
      btn.textContent = '＋ 添加' + LIST_DEFS[name].label;
      btn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        pushUndo();
        var arr = getList(name);
        var item = JSON.parse(JSON.stringify(LIST_DEFS[name].add));
        if (name === 'courses') item.id = Date.now();
        arr.push(item);
        saveDraft(); HL.render();
        toast('已添加，点击卡片可编辑内容');
        setTimeout(function () {
          var els = document.querySelectorAll('[data-hl-list="' + name + '"]');
          var last = els[els.length - 1];
          if (last) last.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }, 60);
      });
      if (box.nextSibling) box.parentNode.insertBefore(btn, box.nextSibling);
      else box.parentNode.appendChild(btn);
    });
  }
  function refreshChips() {
    SECTIONS.forEach(function (s) {
      var el = document.getElementById(s.el);
      if (!el) return;
      el.classList.add('hl-sec');
      var chip = el.querySelector('.hl-sec-chip');
      if (!chip) {
        chip = document.createElement('button');
        chip.className = 'hl-sec-chip';
        chip.setAttribute('data-sec', s.key);
        el.appendChild(chip);
      }
      var off = isHidden(s.key);
      chip.className = 'hl-sec-chip' + (off ? ' hl-sec-off' : '');
      chip.setAttribute('data-label', s.label);
      chip.textContent = off ? '👁 显示「' + s.label + '」' : '🙈 隐藏「' + s.label + '」';
    });
  }
  function removeChips() {
    Array.prototype.forEach.call(document.querySelectorAll('.hl-sec-chip'), function (c) { c.parentNode.removeChild(c); });
    Array.prototype.forEach.call(document.querySelectorAll('.hl-add'), function (c) { c.parentNode.removeChild(c); });
  }

  // ---------- 生成配置 ----------
  function esc(s) { return JSON.stringify(String(s == null ? '' : s)); }
  function buildConfigText() {
    var L = ['/* HIGH LIFE 多租户站点配置 —— 由可视化编辑器生成 */', '', 'window.HIGHLIFE_ACCOUNTS = ['];
    (HL.accounts || []).forEach(function (a) {
      L.push('  { user: ' + esc(a.user) + ', pwd: ' + esc(a.pwd) + ', role: ' + esc(a.role) + ', site: ' + esc(a.site) + ', name: ' + esc(a.name) + ' },');
    });
    L.push('];', '', 'window.HIGHLIFE_SITES = {');
    Object.keys(HL.sitesMap).forEach(function (sid) {
      var s = HL.sitesMap[sid];
      L.push('  ' + esc(sid) + ': {');
      L.push('    name: ' + esc(s.name) + ', logo: ' + esc(s.logo) + ',');
      L.push('    hidden: ' + JSON.stringify(s.hidden || []) + ',');
      L.push('    banners: [');
      (s.banners || []).forEach(function (b) { L.push('      { img: ' + esc(b.img) + ', title: ' + esc(b.title) + ', sub: ' + esc(b.sub) + ' },'); });
      L.push('    ],');
      L.push('    hotTitle: ' + esc(s.hotTitle) + ', highLead: ' + esc(s.highLead) + ', highTitle: ' + esc(s.highTitle) + ', highPic: ' + esc(s.highPic) + ',');
      L.push('    aboutImg: ' + esc(s.aboutImg) + ', aboutLead: ' + esc(s.aboutLead) + ', aboutTitle: ' + esc(s.aboutTitle) + ',');
      L.push('    partnerTitle: ' + esc(s.partnerTitle) + ',');
      L.push('    partners: [');
      (s.partners || []).forEach(function (p) { L.push('      { img: ' + esc(p.img) + ', name: ' + esc(p.name) + ' },'); });
      L.push('    ],');
      L.push('    whyTitle: ' + esc(s.whyTitle) + ', whySub: ' + esc(s.whySub) + ',');
      L.push('    whyItems: [');
      (s.whyItems || []).forEach(function (w) { L.push('      { img: ' + esc(w.img) + ', title: ' + esc(w.title) + ', desc: ' + esc(w.desc) + ' },'); });
      L.push('    ],');
      L.push('    coursesTitle: ' + esc(s.coursesTitle) + ',');
      L.push('    msgsTitle: ' + esc(s.msgsTitle) + ',');
      L.push('    msgs: [');
      (s.msgs || []).forEach(function (m) { L.push('      { name: ' + esc(m.name) + ', text: ' + esc(m.text) + ', time: ' + esc(m.time) + ' },'); });
      L.push('    ],');
      L.push('    courses: [');
      (s.courses || []).forEach(function (c) {
        L.push('      { id: ' + Number(c.id) + ', name: ' + esc(c.name) + ', price: ' + esc(c.price) + ', img: ' + esc(c.img) + ', desc: ' + esc(c.desc) + ', detail: ' + esc(c.detail) + ', imgs: ' + JSON.stringify(Array.isArray(c.imgs) ? c.imgs : []) + ' },');
      });
      L.push('    ],');
      var c = s.contact || {};
      L.push('    contact: { intro: ' + esc(c.intro) + ', email: ' + esc(c.email) + ', tel: ' + esc(c.tel) + ', addr: ' + esc(c.addr) + ', brand: ' + esc(c.brand) + ', formLabel: ' + esc(c.formLabel) + ' },');
      L.push('    footer: ' + esc(s.footer));
      L.push('  },');
    });
    L.push('};');
    return L.join('\n');
  }
  function genModal() {
    openModal('生成 site-config.js', function (bd) {
      var ta = document.createElement('textarea');
      ta.className = 'hl-code';
      ta.value = buildConfigText();
      bd.appendChild(ta);
      var tip = document.createElement('div');
      tip.style.cssText = 'color:#999;font-size:11px;margin-top:6px';
      tip.textContent = '提示：修改已自动保存草稿。若后台已开启自动同步，打开后台页面即自动推送到 GitHub；也可复制此内容手动覆盖 js/site-config.js。';
      bd.appendChild(tip);
      ta.setAttribute('id', 'hlGenTa');
    }, [
      { t: '复制', primary: true, fn: function () {
        var ta = document.getElementById('hlGenTa');
        ta.select();
        try { document.execCommand('copy'); toast('已复制'); } catch (e) { toast('请长按全选手动复制'); }
      } },
      { t: '下载', fn: function () {
        var blob = new Blob([buildConfigText()], { type: 'text/javascript;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a'); a.href = url; a.download = 'site-config.js';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast('已下载');
      } },
      { t: '关闭', fn: closeModal }
    ]);
  }

  // ---------- 登录 ----------
  function loginModal() {
    openModal('请先登录管理账号', function (bd) {
      bd.innerHTML =
        '<div class="hl-field"><label>账号</label><input type="text" id="hlLoginUser"></div>' +
        '<div class="hl-field"><label>密码</label><input type="password" id="hlLoginPwd"></div>' +
        '<div style="color:#999;font-size:11px">超管 admin/admin123 · 演示学员 demo/123456</div>';
    }, [
      { t: '取消', fn: closeModal },
      { t: '登录并开始编辑', primary: true, fn: function () {
        var u = document.getElementById('hlLoginUser').value.trim();
        var p = document.getElementById('hlLoginPwd').value;
        var a = (HL.accounts || []).find(function (x) { return x.user === u && x.pwd === p; });
        if (!a) { toast('账号或密码错误'); return; }
        sessionStorage.setItem('hl_admin_user', a.user);
        closeModal();
        enterEdit();
        toast('欢迎，' + (a.name || a.user));
      } }
    ]);
  }

  // ---------- 进入/退出编辑 ----------
  function updateToolbar() {
    var ub = document.getElementById('hlUndoBtn');
    if (ub) ub.disabled = undoStack.length === 0;
  }
  function enterEdit() {
    if (editing) return;
    editing = true;
    document.body.classList.add('hl-editing');
    hideFab();
    var tb = document.createElement('div');
    tb.id = 'hlToolbar';
    tb.innerHTML =
      '<span class="hl-tt">✏️ 可视化编辑 · ' + (HL.site.name || '') + '</span>' +
      '<button id="hlUndoBtn">↩ 撤销</button>' +
      '<button id="hlGenBtn">📄 生成配置</button>' +
      '<button id="hlExitBtn" class="hl-done">✔ 完成</button>';
    document.body.appendChild(tb);
    var hint = document.createElement('div');
    hint.id = 'hlHint';
    hint.textContent = '点击文字直接改 · 点击图片换图 · 点击卡片可编辑/排序/删除 · 点右上角标签可隐藏板块';
    document.body.appendChild(hint);
    if (!document.getElementById('hlToast')) {
      var toastEl = document.createElement('div');
      toastEl.id = 'hlToast';
      document.body.appendChild(toastEl);
    }
    document.getElementById('hlUndoBtn').addEventListener('click', function () {
      if (!undoStack.length) { toast('没有可撤销的操作'); return; }
      var st = JSON.parse(undoStack.pop());
      HL.sitesMap = st.sites; HL.accounts = st.accounts;
      saveDraft(); HL.render(); refreshChips(); updateToolbar();
      toast('已撤销');
    });
    document.getElementById('hlGenBtn').addEventListener('click', genModal);
    document.getElementById('hlExitBtn').addEventListener('click', exitEdit);
    injectChips();
    updateToolbar();
    saveDraft();
  }
  function exitEdit() {
    editing = false;
    document.body.classList.remove('hl-editing');
    ['hlToolbar', 'hlHint', 'hlBar'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.parentNode.removeChild(el);
    });
    removeChips();
    hideBar();
    closeModal();
    if (textEditing) textEditing = false;
    saveDraft();
    HL.render();
    toast('已保存草稿。回到后台页面会自动同步到 GitHub 生效');
  }

  // ---------- 编辑入口（已移除前台 FAB，仅保留 ?edit=1 后台跳转入口） ----------
  function hideFab() {
    var f = document.getElementById('hlFab');
    if (f) f.parentNode.removeChild(f);
  }

  // ---------- 初始化 ----------
  var t = document.createElement('div'); t.id = 'hlToast'; document.body.appendChild(t);
  // 展示页不再显示「编辑此页」按钮；编辑入口统一由后台「✏️ 可视化编辑」跳转（?edit=1）
  // 已移除「预览本地草稿」角标（前台是给用户看的展示页）
  // ?edit=1 直达编辑
  var qs = new URLSearchParams(location.search);
  if (qs.get('edit') === '1') {
    if (isLoggedIn()) setTimeout(enterEdit, 300);
    else setTimeout(loginModal, 300);
  }
})();
