// pages/cart/cart.js
// 作用：购物车 —— 多商品勾选/全选、增减/删除、满减、配送费、选优惠券实时优惠、去结算。
// 新增（P0）：
//  1) 跨店铺结算拦截：勾选多个不同店铺商品时结算按钮置灰并弹窗提示；
//  2) 进入页面自动调用 app.syncCart() 同步 mock 最新价格/售罄/下架，并弹窗提示变动；
//  3) 售罄商品置灰、不可勾选、自动取消勾选（app.js 同步时清理空店铺节点）。
const app = getApp();
const mock = require('../../utils/mock.js');
const storage = require('../../utils/storage.js');
const util = require('../../utils/util.js');

Page({
  data: {
    shops: [],            // 每家店 {shopId, shopName, deliveryFee, activities, items:[...], allChecked, shopSelectedTotal}
    couponList: [],       // 可用优惠券（未使用）
    coupon: null,         // 当前选用优惠券
    goodsTotal: 0,        // 已选商品金额
    manjianTotal: 0,      // 满减合计
    deliveryFeeTotal: 0,  // 配送费合计
    couponAmount: 0,      // 优惠券抵扣
    payTotal: 0,          // 实付
    totalCount: 0,        // 已选件数
    allChecked: false,    // 全局全选
    crossShop: false,     // 勾选商品是否跨多个店铺（跨店则禁止一起结算）
    couponSheet: false
  },

  onShow() { this.refresh(); },

  // 刷新：先与 mock 同步（价格/售罄/下架），再渲染
  refresh() {
    const changes = app.syncCart();   // 同步最新价格/售罄，返回变动列表
    const cart = app.globalData.cart;
    const shops = [];
    Object.keys(cart).forEach((sid) => {
      const s = cart[sid];
      const shop = mock.getShopById(sid);
      const items = Object.keys(s.items).map((k) => {
        const it = s.items[k];
        return { key: it.key, goodsId: it.goodsId, name: it.name, price: it.price, img: it.img, count: it.count, checked: it.checked, specText: it.specText, soldOut: !!it.soldOut };
      });
      let shopSelectedTotal = 0;
      items.forEach((it) => { if (it.checked) shopSelectedTotal += it.price * it.count; });
      const activeItems = items.filter((it) => !it.soldOut);
      const allChecked = activeItems.length > 0 && activeItems.every((it) => it.checked);
      shops.push({
        shopId: s.shopId, shopName: s.shopName, deliveryFee: s.deliveryFee,
        activities: shop ? shop.activities : [], items, allChecked, shopSelectedTotal
      });
    });
    const couponList = storage.getCoupons().filter((c) => c.status === 'unused');
    this.setData({ shops, couponList }, () => this.compute());
    this.showSyncTip(changes);
  },

  // 费用/勾选计算（满减 + 配送费 + 优惠券，实时），并判断跨店铺
  compute() {
    let goodsTotal = 0;
    let manjianTotal = 0;
    let deliveryFeeTotal = 0;
    let totalCount = 0;
    this.data.shops.forEach((s) => {
      let st = 0;
      s.items.forEach((it) => { if (it.checked) { goodsTotal += it.price * it.count; st += it.price * it.count; totalCount += it.count; } });
      manjianTotal += util.calcManjian(st, s.activities);
      if (s.items.some((it) => it.checked)) deliveryFeeTotal += s.deliveryFee;
    });
    let couponAmount = 0;
    const cp = this.data.coupon;
    if (cp && goodsTotal >= cp.condition) couponAmount = cp.amount;
    const payTotal = Math.max(0, goodsTotal - manjianTotal - couponAmount + deliveryFeeTotal);
    // 跨店铺判断：统计「已勾选且未售罄」商品来自几家店
    const checkedShops = this.data.shops.filter((s) => s.items.some((it) => it.checked && !it.soldOut));
    const crossShop = checkedShops.length > 1;
    const allChecked = this.data.shops.length > 0 && this.data.shops.every((s) => s.allChecked);
    this.setData({ goodsTotal, manjianTotal, deliveryFeeTotal, couponAmount, payTotal, totalCount, allChecked, crossShop });
  },

  toggleAll() {
    const next = !this.data.allChecked;
    this.data.shops.forEach((s) => s.items.forEach((it) => { if (!it.soldOut) app.setItemChecked(s.shopId, it.key, next); }));
    this.refresh();
  },
  toggleShop(e) {
    const sid = e.currentTarget.dataset.shop;
    const s = this.data.shops.find((x) => x.shopId === sid);
    const next = !s.allChecked;
    s.items.forEach((it) => { if (!it.soldOut) app.setItemChecked(sid, it.key, next); });
    this.refresh();
  },
  toggleItem(e) {
    const { shop, key } = e.currentTarget.dataset;
    const s = this.data.shops.find((x) => x.shopId === shop);
    const it = s.items.find((i) => i.key === key);
    if (it.soldOut) return;   // 售罄不可勾选
    app.setItemChecked(shop, key, !it.checked);
    this.refresh();
  },

  add(e) { app.changeCartCount(e.currentTarget.dataset.shop, e.currentTarget.dataset.key, 1); this.refresh(); },
  minus(e) { app.changeCartCount(e.currentTarget.dataset.shop, e.currentTarget.dataset.key, -1); this.refresh(); },
  remove(e) { app.removeCartItem(e.currentTarget.dataset.shop, e.currentTarget.dataset.key); this.refresh(); wx.showToast({ title: '已删除', icon: 'none' }); },

  openCoupon() { this.setData({ couponSheet: true }); },
  closeCoupon() { this.setData({ couponSheet: false }); },
  pickCoupon(e) {
    const cp = e.currentTarget.dataset.coupon;
    this.setData({ coupon: cp, couponSheet: false }, () => this.compute());
  },
  clearCoupon() { this.setData({ coupon: null }, () => this.compute()); },

  // 去结算：跨店铺商品禁止一起结算
  checkout() {
    if (this.data.totalCount === 0) { wx.showToast({ title: '请选择商品', icon: 'none' }); return; }
    const checkedShops = this.data.shops.filter((s) => s.items.some((it) => it.checked && !it.soldOut));
    if (checkedShops.length > 1) {
      wx.showModal({ title: '无法一起结算', content: '不同店铺的商品需分开下单，请单独结算', showCancel: false });
      return;
    }
    wx.navigateTo({ url: '/pages/confirm/confirm' });
  },

  // 商品变动弹窗提示
  showSyncTip(changes) {
    if (!changes || !changes.length) return;
    const lines = changes.map((c) => {
      if (c.type === 'soldOut') return '「' + c.name + '」已售罄，已为您取消勾选';
      if (c.type === 'removed') return '「' + c.name + '」已下架，已从购物车移除';
      if (c.type === 'shopRemoved') return c.name + ' 已暂停营业，相关商品已移除';
      if (c.type === 'price') return '「' + c.name + '」价格更新 ¥' + c.oldPrice + ' → ¥' + c.newPrice;
      return '';
    }).filter(Boolean);
    if (lines.length) wx.showModal({ title: '购物车有商品变动', content: lines.join('\n'), showCancel: false });
  },

  goHome() { wx.switchTab({ url: '/pages/index/index' }); }
});
