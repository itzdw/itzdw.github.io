/* HIGH LIFE 多租户站点配置 —— 由管理后台生成 */

window.HIGHLIFE_ACCOUNTS = [
  { user: "admin", pwd: "admin123", role: "super", site: "*", name: "超级管理员" },
  { user: "demo", pwd: "123456", role: "student", site: "demo", name: "演示学员" },
];

window.HIGHLIFE_SITES = {
  "demo": {
    name: "HIGH LIFE（演示站）", logo: "images/img_001.jpg",
    hidden: [],
    banners: [
      { img: "images/img_009.jpg", title: "高品质课程", sub: "HIGH LIFE 只提供" },
      { img: "images/img_019.jpg", title: "国际化 · 专业化", sub: "国际技术交流平台" },
      { img: "images/img_010.jpg", title: "蜡烛艺术", sub: "JCA 认证课程体系" },
    ],
    hotTitle: "人气课程", highLead: "HIGH LIFE只提供", highTitle: "高品质课程", highPic: "images/img_009.jpg",
    aboutImg: "images/img_019.jpg", aboutLead: "通过与国外优秀手作培训平台的合作，实现国际技术交流。", aboutTitle: "国际化 · 专业化 · 平台化",
    partnerTitle: "我们重要合作伙伴",
    partners: [
      { img: "images/img_011.jpg", name: "JCA日本蜡烛协会" },
      { img: "images/img_012.jpg", name: "AROMATICA LABO" },
      { img: "images/img_013.jpg", name: "KACA韩国芳香协会" },
      { img: "images/img_014.png", name: "HASTABLE" },
      { img: "images/img_015.jpg", name: "TOKYO CANDLE" },
      { img: "images/img_016.jpg", name: "SSDA" },
    ],
    whyTitle: "Why choose us？", whySub: "为什么选择我们",
    whyItems: [
      { img: "images/img_020.png", title: "国际化的交流平台", desc: "通过与国外优秀手作培训平台的合作，实现国际技术交流。" },
      { img: "images/img_021.png", title: "高品质，专业机构", desc: "HIGH LIFE开手作培训工作室已有9年，高品质、专业课程就是HIGHLIFE最重要的标签。" },
      { img: "images/img_023.png", title: "引领行业，引领风向", desc: "对市场的变化洞察敏锐，坚持做引领行业、引领风向的项目。" },
      { img: "images/img_022.png", title: "蜡烛&手工皂专业培训", desc: "运营国内外优秀机构的蜡烛&手工皂专业课程。" },
    ],
    coursesTitle: "我们的课程",
    msgsTitle: "学员留言",
    msgs: [
      { name: "王同学", text: "已经上完冷制皂指导师范课程，老师特别专业，回国后开店顺利多了，推荐！", time: "2026-11-20" },
      { name: "Liya", text: "蜡烛艺术课程环境很好，小班教学，动手环节特别多，值得来。", time: "2026-11-18" },
      { name: "张女士", text: "咨询了香薰工艺课程，客服回复很及时，已经预约了下个月的班期。", time: "2026-11-15" },
    ],
    courses: [
      { id: 1, name: "KACA冷制皂指导师范认证课程", price: "￥9800", img: "images/img_003.jpg", desc: "", detail: "", imgs: [] },
      { id: 2, name: "日本JCA蜡烛艺术家认证课程", price: "￥1.38万", img: "images/img_004.jpg", desc: "", detail: "", imgs: [] },
      { id: 3, name: "KACA洗发膏&护发膏认证课程", price: "￥2800", img: "images/img_005.jpg", desc: "", detail: "", imgs: [] },
      { id: 4, name: "JCA熏香工艺课程", price: "￥6800", img: "images/img_006.jpg", desc: "", detail: "", imgs: [] },
      { id: 5, name: "日本 大森坚一 TOKYO CANDLE", price: "￥1.52万", img: "images/img_007.jpg", desc: "", detail: "", imgs: [] },
      { id: 6, name: "韩国蜡烛设计界 爱马仕——HASTABLE 艺术蜡烛大师课程", price: "￥1.1万", img: "images/img_008.jpg", desc: "", detail: "", imgs: [] },
      { id: 7, name: "日本JCA蜡烛艺术家认证课程", price: "￥1.38万", img: "images/img_024.jpg", desc: "", detail: "", imgs: [] },
      { id: 8, name: "逐梦美学萤 CCAC", price: "￥8980", img: "images/img_025.jpg", desc: "", detail: "", imgs: [] },
      { id: 9, name: "SSDA风景皂认证课程", price: "￥9800", img: "images/img_026.jpg", desc: "", detail: "", imgs: [] },
      { id: 10, name: "AROMATICA LABO炼切菓子皂认证课程", price: "￥2800", img: "images/img_027.jpg", desc: "", detail: "", imgs: [] },
      { id: 11, name: "AROMAITCA LABO 24小时速成冷制皂认证课程", price: "￥3800", img: "images/img_028.jpg", desc: "", detail: "", imgs: [] },
      { id: 12, name: "韩国HMC大师课程", price: "￥1.1万", img: "images/img_029.jpg", desc: "", detail: "", imgs: [] },
      { id: 13, name: "蜜蜡花专题课程", price: "￥4800", img: "images/img_030.jpg", desc: "", detail: "", imgs: [] },
      { id: 14, name: "AROMATICA LABO洗发饼认证课程", price: "￥2280", img: "images/img_031.jpg", desc: "", detail: "", imgs: [] },
    ],
    contact: { intro: "关于课程咨询和报名，欢迎联系我们。", email: "Email：bella_highlife@qq.com", tel: "Tel : 18601365446", addr: "Tianjin Binhai New Area Zhongxin Ecological City Shimao Jiuxi 3402", brand: "HIGH LIFE_culture", formLabel: "在线表单提交" },
    footer: "Copyright @ 2024. HIGH LIFE"
  },
};