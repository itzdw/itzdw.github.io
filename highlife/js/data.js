/* 前台与后台共享的课程数据：首次写入 localStorage，后台修改后前台自动读取 */
(function () {
  var KEY = 'highlife_courses_v1';
  var seed = [
    { id: 1, name: 'KACA冷制皂指导师范认证课程', price: '￥9800', img: 'images/img_003.jpg' },
    { id: 2, name: '日本JCA蜡烛艺术家认证课程', price: '￥1.38万', img: 'images/img_004.jpg' },
    { id: 3, name: 'KACA洗发膏&护发膏认证课程', price: '￥2800', img: 'images/img_005.jpg' },
    { id: 4, name: 'JCA熏香工艺课程', price: '￥6800', img: 'images/img_006.jpg' },
    { id: 5, name: '日本 大森坚一 TOKYO CANDLE', price: '￥1.52万', img: 'images/img_007.jpg' },
    { id: 6, name: '韩国蜡烛设计界 爱马仕——HASTABLE 艺术蜡烛大师课程', price: '￥1.1万', img: 'images/img_008.jpg' },
    { id: 7, name: '日本JCA蜡烛艺术家认证课程', price: '￥1.38万', img: 'images/img_024.jpg' },
    { id: 8, name: '逐梦美学萤 CCAC', price: '￥8980', img: 'images/img_025.jpg' },
    { id: 9, name: 'SSDA风景皂认证课程', price: '￥9800', img: 'images/img_026.jpg' },
    { id: 10, name: 'AROMATICA LABO炼切菓子皂认证课程', price: '￥2800', img: 'images/img_027.jpg' },
    { id: 11, name: 'AROMAITCA LABO 24小时速成冷制皂认证课程', price: '￥3800', img: 'images/img_028.jpg' },
    { id: 12, name: '韩国HMC大师课程', price: '￥1.1万', img: 'images/img_029.jpg' },
    { id: 13, name: '蜜蜡花专题课程', price: '￥4800', img: 'images/img_030.jpg' },
    { id: 14, name: 'AROMATICA LABO洗发饼认证课程', price: '￥2280', img: 'images/img_031.jpg' }
  ];
  if (!localStorage.getItem(KEY)) {
    localStorage.setItem(KEY, JSON.stringify(seed));
  }
  window.HIGHLIFE_DATA_KEY = KEY;
  window.HIGHLIFE_SEED = seed;
})();
