// pages/shop/shop.js
// 作用：店铺详情页 —— 左分类联动右商品、商品加减、规格选择弹窗、商品大图、
//       店铺公告/满减/领券、已选底部购物车栏 + 悬浮购物车弹窗、售罄置灰。
const app = getApp();
const { getShopById } = require('../../utils/mock.js');
const storage = require('../../utils/storage.js');

Page({
  data: {
    shop: {},
    skeleton: true,      // 店铺骨架屏（首屏短暂占位）
    goodsMap: {},        // { catId: [goods,...] }
    activeCat: '',
    scrollInto: '',
    cartCounts: {},      // { goodsId: 总数量 }（按商品聚合，便于列表展示）
    totalCount: 0,
    totalPrice: 0,
    specModal: { show: false, goods: null, selected: [], unitPrice: 0, count: 1 },
    cartPopup: false,
    claimed: {}          // { couponId: true } 已领取状态
  },

  onLoad(options) {
    const id = parseInt(options.id, 10);
    const shop = getShopById(id);
    if (!shop) { wx.showToast({ title: '商家不存在', icon: 'none' }); return; }
    const goodsMap = {};
    shop.categories.forEach((c) => { goodsMap[c.id] = []; });
    shop.goods.forEach((g) => { if (goodsMap[g.catId]) goodsMap[g.catId].push(g); });

    wx.setNavigationBarTitle({ title: shop.name });

    // 初始化领券状态：若该券已在用户优惠券中（unused）则视为已领取
    const coupons = storage.getCoupons();
    const claimed = {};
    (shop.coupons || []).forEach((c) => {
      if (coupons.some((u) => u.id === c.id && u.status === 'unused')) claimed[c.id] = true;
    });

    this.setData({
      shop,
      goodsMap,
      activeCat: shop.categories[0].id,
      scrollInto: 'cat-' + shop.categories[0].id,
      claimed
    });
    this.refreshCart();
    // 骨架屏：短暂占位后展示（纯视觉，不影响数据）
    setTimeout(() => this.setData({ skeleton: false }), 420);
  },

  onShow() { if (this.data.shop.id) this.refreshCart(); },

  // 从全局购物车同步本店状态
  refreshCart() {
    const shop = this.data.shop;
    if (!shop.id) return;
    const cs = app.getCartShop(shop.id);
    const counts = {};
    let tc = 0;
    let tp = 0;
    let cartItems = [];
    if (cs) {
      cartItems = Object.values(cs.items).map((it) => ({
        key: it.key, goodsId: it.goodsId, name: it.name, price: it.price, img: it.img, count: it.count, specText: it.specText
      }));
      cartItems.forEach((it) => {
        counts[it.goodsId] = (counts[it.goodsId] || 0) + it.count;
        tc += it.count;
        tp += it.price * it.count;
      });
    }
    this.setData({ cartCounts: counts, totalCount: tc, totalPrice: tp, cartItems });
  },

  selectCat(e) {
    const id = e.currentTarget.dataset.id;
    // 点击分类：标记为程序滚动，避免滚动事件把高亮弹回
    this._tapScroll = true;
    this.setData({ activeCat: id, scrollInto: 'cat-' + id });
    clearTimeout(this._tapTimer);
    this._tapTimer = setTimeout(() => { this._tapScroll = false; }, 450);
  },

  // 右列表滚动 → 反算左侧高亮分类（视图联动，不改数据）
  onGoodsScroll(e) {
    if (this._tapScroll) return;
    const top = e.detail.scrollTop;
    wx.createSelectorQuery().in(this)
      .selectAll('.cat-sec')
      .fields({ offsetTop: true, id: true }, (nodes) => {
        if (!nodes || !nodes.length) return;
        let active = nodes[0].id.replace('cat-', '');
        for (let i = 0; i < nodes.length; i++) {
          if (top + 10 >= nodes[i].offsetTop) active = nodes[i].id.replace('cat-', '');
        }
        if (active !== this.data.activeCat) this.setData({ activeCat: active });
      }).exec();
  },

  // 加购：有规格则弹窗，无规格直接加
  add(e) {
    const g = e.detail.goods;
    if (g.soldOut) { wx.showToast({ title: '该商品已售罄', icon: 'none' }); return; }
    if (g.specs && g.specs.length) this.openSpec(g);
    else {
      app.addToCart(this.data.shop, g, '', g.price, []);
      this.refreshCart();
      wx.showToast({ title: '已加入购物车', icon: 'none' });
    }
  },

  // 减：找到该商品任意一个规格条目减 1
  minus(e) {
    const g = e.detail.goods;
    const cs = app.getCartShop(this.data.shop.id);
    if (!cs) return;
    const key = Object.keys(cs.items).find((k) => cs.items[k].goodsId === g.id);
    if (key) { app.changeCartCount(this.data.shop.id, key, -1); this.refreshCart(); }
  },

  /* ---------- 规格选择弹窗 ---------- */
  openSpec(g) {
    const selected = g.specs.map(() => 0);
    const unitPrice = this.computeUnit(g, selected);
    this.setData({ specModal: { show: true, goods: g, selected, unitPrice, count: 1 } });
  },
  computeUnit(g, selected) {
    let p = g.price;
    g.specs.forEach((sp, i) => { p += sp.options[selected[i]].delta; });
    return p;
  },
  pickSpec(e) {
    // dataset 取值为字符串，转成数字再作为数组下标使用
    const gi = parseInt(e.currentTarget.dataset.gi, 10);
    const oi = parseInt(e.currentTarget.dataset.oi, 10);
    const g = this.data.specModal.goods;
    const selected = this.data.specModal.selected.slice();
    selected[gi] = oi;
    this.setData({ 'specModal.selected': selected, 'specModal.unitPrice': this.computeUnit(g, selected) });
  },
  specCount(e) {
    // 注意：dataset 取出的值均为字符串，必须转数字后再运算，否则 1+"1" 会变成 "11"
    const d = parseInt(e.currentTarget.dataset.delta, 10) || 0;
    let c = this.data.specModal.count + d;
    if (c < 1) c = 1;
    this.setData({ 'specModal.count': c });
  },
  closeSpec() { this.setData({ 'specModal.show': false }); },
  confirmSpec() {
    const m = this.data.specModal;
    const g = m.goods;
    const labels = g.specs.map((sp, i) => sp.options[m.selected[i]].label);
    const specText = labels.join('/');
    for (let i = 0; i < m.count; i++) app.addToCart(this.data.shop, g, specText, m.unitPrice, labels);
    this.setData({ 'specModal.show': false });
    this.refreshCart();
    wx.showToast({ title: '已加入购物车', icon: 'none' });
  },

  /* ---------- 底部购物车弹窗 ---------- */
  toggleCart() { if (this.data.totalCount > 0) this.setData({ cartPopup: !this.data.cartPopup }); },
  closeCart() { this.setData({ cartPopup: false }); },
  closeMask() { this.setData({ cartPopup: false, 'specModal.show': false }); },
  cartMinus(e) {
    const key = e.currentTarget.dataset.key;
    app.changeCartCount(this.data.shop.id, key, -1);
    this.refreshCart();
    if (this.data.totalCount === 0) this.setData({ cartPopup: false });
  },
  cartPlus(e) {
    const key = e.currentTarget.dataset.key;
    app.changeCartCount(this.data.shop.id, key, 1);
    this.refreshCart();
  },
  clearCart() {
    app.clearShop(this.data.shop.id);
    this.setData({ cartPopup: false });
    this.refreshCart();
    wx.showToast({ title: '已清空', icon: 'none' });
  },

  /* ---------- 领券 ---------- */
  claimCoupon(e) {
    const c = e.currentTarget.dataset.coupon;
    const coupons = storage.getCoupons().slice();
    if (!coupons.some((u) => u.id === c.id)) {
      coupons.push({ id: c.id, title: c.title, amount: c.amount, condition: c.condition, status: 'unused', expire: '2026-12-31' });
      storage.saveCoupons(coupons);
    }
    const claimed = Object.assign({}, this.data.claimed);
    claimed[c.id] = true;
    this.setData({ claimed });
    wx.showToast({ title: '领取成功', icon: 'success' });
  },

  goConfirm() {
    if (this.data.totalCount > 0) wx.navigateTo({ url: '/pages/confirm/confirm?shopId=' + this.data.shop.id });
  }
});
