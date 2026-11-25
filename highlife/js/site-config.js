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
    aboutImg: "", aboutLead: "", aboutTitle: "",
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
    courses: [
      { id: 1, name: "KANS冷制皂指导师资认证课程", price: "￥8800", img: "https://itzdw.github.io/highlife/images/upload/1795585103813-_20261125101625_268_7.jpg", desc: "", detail: "", imgs: [] },
      { id: 2, name: "KCCA香薰蜡烛指导师资认证课程", price: "￥9800", img: "https://itzdw.github.io/highlife/images/upload/1795617888964-_20261125104111_716_7.jpg", desc: "", detail: "", imgs: [] },
      { id: 3, name: "KACA洗发膏&护发膏认证课程", price: "￥2980", img: "https://itzdw.github.io/highlife/images/upload/1795585136265-_20261125084134_31_7.jpg", desc: "", detail: "", imgs: [] },
      { id: 4, name: "AROMATICA LABO氨基酸花朵果冻皂证书课程", price: "￥2800", img: "https://itzdw.github.io/highlife/images/upload/1795617904215-_20261125093633_179_7.jpg", desc: "", detail: "", imgs: [] },
      { id: 5, name: "MP精油皂专项课程", price: "￥980", img: "https://itzdw.github.io/highlife/images/upload/1795617921118-_20261125085824_111_7.jpg", desc: "", detail: "", imgs: [] },
      { id: 6, name: "漂浮的星星云朵沐浴球课程", price: "￥980", img: "https://itzdw.github.io/highlife/images/upload/1795618042035-_20261125100644_256_7.jpg", desc: "", detail: "", imgs: [] },
      { id: 7, name: "AROMATICA LABO24小时熟成皂证书课程", price: "￥3800", img: "https://itzdw.github.io/highlife/images/upload/1795617939824-_20261125083701_6_7.jpg", desc: "", detail: "", imgs: [] },
      { id: 8, name: "KCCA香气礼仪证书课程", price: "￥2980", img: "images/img_025.jpg", desc: "", detail: "", imgs: [] },
      { id: 9, name: "风景皂提升课程", price: "￥7800", img: "https://itzdw.github.io/highlife/images/upload/1795617959979-_20261125111524_46_16.jpg", desc: "", detail: "", imgs: [] },
      { id: 10, name: "AROMATICA LABO炼切菓子皂认证课程", price: "￥2800", img: "https://itzdw.github.io/highlife/images/upload/1795585190035-_20261125094944_246_7.jpg", desc: "", detail: "", imgs: [] },
      { id: 11, name: "AROMAITCA LABO 24小时速成冷制皂认证课程", price: "￥3800", img: "https://itzdw.github.io/highlife/images/upload/1795618029554-_20261125083700_5_7.jpg", desc: "", detail: "", imgs: [] },
      { id: 12, name: "可爱卡通沐浴芭一日课程", price: "￥2980", img: "https://itzdw.github.io/highlife/images/upload/1795617973076-_20261125111417_42_16.jpg", desc: "", detail: "", imgs: [] },
      { id: 13, name: "Real Flower Candle蜜蜡花专题课程", price: "￥1850", img: "https://itzdw.github.io/highlife/images/upload/1795618017199-_20261125092033_127_7.jpg", desc: "", detail: "", imgs: [] },
      { id: 14, name: "AROMATICA LABO洗发饼认证课程", price: "￥2280", img: "https://itzdw.github.io/highlife/images/upload/1795617996511-_20261125085059_54_7.jpg", desc: "", detail: "", imgs: [] },
    ],
    contact: { intro: "关于课程咨询和报名，欢迎联系我们。", email: "Email：bella_highlife@qq.com", tel: "Tel : 13414466970", addr: "Tianjin Binhai New Area Zhongxin Ecological City Shimao Jiuxi 3402", brand: "HIGH LIFE_culture", formLabel: "在线表单提交" },
    footer: "Copyright @ 2024. HIGH LIFE"
  },
};