// pages/confirm/confirm.js
// 作用：确认下单页 —— 选收货地址、备注、配送时间、费用明细、优惠券；提交后模拟微信支付弹窗。
const app = getApp();
const mock = require('../../utils/mock.js');
const storage = require('../../utils/storage.js');
const util = require('../../utils/util.js');

Page({
  data: {
    orderShops: [],      // 本次下单的店铺与商品
    goodsTotal: 0,
    manjianTotal: 0,
    deliveryFeeTotal: 0,
    couponList: [],
    coupon: null,
    couponAmount: 0,
    payTotal: 0,
    totalCount: 0,
    address: null,
    deliveryTimes: ['尽快送达（约30分钟）', '今天 12:00-13:00', '今天 18:00-19:00', '明天 09:00-10:00'],
    deliveryTime: '尽快送达（约30分钟）',
    remark: '',
    couponSheet: false,
    payModal: false,
    payClosing: false,   // 支付弹窗淡出中（纯视觉）
    payOrder: null
  },

  onLoad(options) {
    this.orderShopId = options.shopId ? parseInt(options.shopId, 10) : null;
  },

  onShow() {
    // 进入下单页先同步 mock 最新价格/售罄，返回的变动用于提示
    const changes = app.syncCart();
    // 从地址页选择返回后同步地址
    if (app.globalData.tempAddress) {
      this.setData({ address: app.globalData.tempAddress });
      app.globalData.tempAddress = null;
    } else if (!this.data.address) {
      const addrs = storage.getAddresses() || [];
      const def = addrs.find((a) => a.isDefault) || addrs[0] || null;
      this.setData({ address: def });
    }
    this.buildDraft();
    this.showSyncTip(changes);
  },

  // 根据购物车（shopId 限定 或 勾选项）组装本次下单草稿
  buildDraft() {
    const cart = app.globalData.cart;
    const orderShops = [];
    const collect = (sid, items) => {
      const shop = mock.getShopById(sid);
      const list = Object.values(items)
        .filter((it) => !it.soldOut)   // 排除已售罄商品，避免下单不可购买的商品
        .map((it) => ({ key: it.key, goodsId: it.goodsId, name: it.name, price: it.price, img: it.img, count: it.count, specText: it.specText }));
      if (list.length) {
        orderShops.push({ shopId: sid, shopName: cart[sid].shopName, deliveryFee: cart[sid].deliveryFee, activities: shop ? shop.activities : [], items: list });
      }
    };
    if (this.orderShopId) {
      if (cart[this.orderShopId]) collect(this.orderShopId, cart[this.orderShopId].items);
    } else {
      Object.keys(cart).forEach((sid) => {
        const checked = {};
        Object.keys(cart[sid].items).forEach((k) => { if (cart[sid].items[k].checked) checked[k] = cart[sid].items[k]; });
        if (Object.keys(checked).length) collect(sid, checked);
      });
    }
    if (orderShops.length === 0) {
      wx.showToast({ title: '没有可结算的商品', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }
    const couponList = storage.getCoupons().filter((c) => c.status === 'unused');
    this.setData({ orderShops, couponList }, () => this.compute());
  },

  compute() {
    let goodsTotal = 0;
    let manjianTotal = 0;
    let deliveryFeeTotal = 0;
    let totalCount = 0;
    this.data.orderShops.forEach((s) => {
      let st = 0;
      s.items.forEach((it) => { goodsTotal += it.price * it.count; st += it.price * it.count; totalCount += it.count; });
      manjianTotal += util.calcManjian(st, s.activities);
      deliveryFeeTotal += s.deliveryFee;
    });
    let couponAmount = 0;
    const cp = this.data.coupon;
    if (cp && goodsTotal >= cp.condition) couponAmount = cp.amount;
    const payTotal = Math.max(0, goodsTotal - manjianTotal - couponAmount + deliveryFeeTotal);
    this.setData({ goodsTotal, manjianTotal, deliveryFeeTotal, couponAmount, payTotal, totalCount });
  },

  chooseAddress() { wx.navigateTo({ url: '/pages/address/address?from=confirm' }); },

  pickDelivery() {
    wx.showActionSheet({
      itemList: this.data.deliveryTimes,
      success: (res) => this.setData({ deliveryTime: this.data.deliveryTimes[res.tapIndex] })
    });
  },

  onRemark(e) { this.setData({ remark: e.detail.value }); },

  openCoupon() { this.setData({ couponSheet: true }); },
  closeCoupon() { this.setData({ couponSheet: false }); },
  pickCoupon(e) {
    const cp = e.currentTarget.dataset.coupon;
    this.setData({ coupon: cp, couponSheet: false }, () => this.compute());
  },
  clearCoupon() { this.setData({ coupon: null }, () => this.compute()); },

  // 提交订单 + 打开模拟支付
  submit() {
    if (!this.data.address) { wx.showToast({ title: '请先选择收货地址', icon: 'none' }); return; }
    const now = new Date();
    const order = {
      id: util.genOrderId(),
      time: util.formatTime(now),
      status: '待付款',                 // 支付成功后改为「待配送」
      address: this.data.address,
      remark: this.data.remark,
      deliveryTime: this.data.deliveryTime,
      shops: this.data.orderShops.map((s) => ({ shopId: s.shopId, shopName: s.shopName, deliveryFee: s.deliveryFee, items: s.items })),
      goodsTotal: this.data.goodsTotal,
      manjianTotal: this.data.manjianTotal,
      couponAmount: this.data.couponAmount,
      deliveryFeeTotal: this.data.deliveryFeeTotal,
      payTotal: this.data.payTotal,
      review: null,
      expireAt: Date.now() + 15 * 60 * 1000   // 待付款超时（15 分钟），持久化用于自动关闭
    };
    const orders = storage.getOrders();
    orders.unshift(order);
    storage.saveOrders(orders);
    this.payOrder = order;
    this.setData({ payModal: true });
  },

  // 模拟支付成功
  paySuccess() {
    const orders = storage.getOrders();
    const idx = orders.findIndex((o) => o.id === this.payOrder.id);
    if (idx > -1) { orders[idx].status = '待配送'; storage.saveOrders(orders); }
    // 移除已结算购物车商品
    if (this.orderShopId) {
      app.clearShop(this.orderShopId);
    } else {
      this.data.orderShops.forEach((s) => s.items.forEach((it) => app.removeCartItem(s.shopId, it.key)));
    }
    this.setData({ payModal: false, payClosing: false });
    wx.showToast({ title: '支付成功', icon: 'success' });
    setTimeout(() => wx.switchTab({ url: '/pages/order/order' }), 700);
  },

  // 取消支付：订单保留为「待付款」（弹窗先淡出再卸载）
  payCancel() {
    if (this.data.payClosing) return;
    this.setData({ payClosing: true });
    setTimeout(() => this.setData({ payModal: false, payClosing: false }), 180);
    wx.showToast({ title: '订单待支付', icon: 'none' });
  },

  // 商品变动弹窗提示（与购物车页一致）
  showSyncTip(changes) {
    if (!changes || !changes.length) return;
    const lines = changes.map((c) => {
      if (c.type === 'soldOut') return '「' + c.name + '」已售罄，已从订单移除';
      if (c.type === 'removed') return '「' + c.name + '」已下架，已从订单移除';
      if (c.type === 'shopRemoved') return c.name + ' 已暂停营业，相关商品已移除';
      if (c.type === 'price') return '「' + c.name + '」价格更新 ¥' + c.oldPrice + ' → ¥' + c.newPrice;
      return '';
    }).filter(Boolean);
    if (lines.length) wx.showModal({ title: '订单商品有变动', content: lines.join('\n'), showCancel: false });
  }
});
