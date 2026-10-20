// pages/search/search.js
// 作用：搜索页 —— 实时联想（店铺/商品）、搜索历史记录（本地缓存）、搜索结果展示。
const mock = require('../../utils/mock.js');
const storage = require('../../utils/storage.js');

Page({
  data: {
    keyword: '',
    history: [],       // 搜索历史（本地缓存）
    suggest: [],       // 联想列表 [{type,id,name,sub,img}]
    results: null      // 搜索结果 { shops:[], goods:[] }，null 表示未确认搜索
  },

  onLoad() {
    this.setData({ history: storage.getHistory() });
  },

  // 从保存/详情返回后刷新搜索历史（数据刷新）
  onShow() {
    this.setData({ history: storage.getHistory() });
  },

  // 输入：实时联想
  onInput(e) {
    const kw = e.detail.value;
    this.setData({ keyword: kw, results: null });
    if (!kw.trim()) { this.setData({ suggest: [] }); return; }
    const shops = mock.searchShops(kw).map((s) => ({ type: 'shop', id: s.id, name: s.name, sub: '商家 · 评分' + s.rating, img: s.img }));
    const goods = mock.searchGoods(kw).map((g) => ({ type: 'goods', id: g.id, name: g.name, sub: g.shopName, img: g.img, shopId: g.shopId }));
    this.setData({ suggest: shops.concat(goods).slice(0, 12) });
  },

  // 确认搜索
  doSearch() {
    const kw = this.data.keyword.trim();
    if (!kw) return;
    // 写入历史（去重、最多 10 条）
    let history = storage.getHistory().filter((h) => h !== kw);
    history.unshift(kw);
    history = history.slice(0, 10);
    storage.saveHistory(history);
    // 结果
    const results = { shops: mock.searchShops(kw), goods: mock.searchGoods(kw) };
    this.setData({ history, results, suggest: [] });
  },

  // 点击联想项
  tapSuggest(e) {
    const { type, id, shopId } = e.currentTarget.dataset;
    if (type === 'shop') wx.navigateTo({ url: '/pages/shop/shop?id=' + id });
    else wx.navigateTo({ url: '/pages/shop/shop?id=' + shopId });
  },

  // 点击历史
  tapHistory(e) {
    const kw = e.currentTarget.dataset.kw;
    this.setData({ keyword: kw });
    this.doSearch();
  },

  clearHistory() {
    storage.saveHistory([]);
    this.setData({ history: [] });
  },

  // 点击结果店铺 / 商品（兼容 shop-card 组件事件 detail.id 与原生 data-id）
  goShop(e) {
    const id = e.detail ? e.detail.id : e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/shop/shop?id=' + id });
  }
});
