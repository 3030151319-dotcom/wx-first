// pages/my/my.js
// 作用：个人中心 —— 微信头像/昵称获取、订单快捷入口、收货地址、优惠券、客服帮助。
const app = getApp();
const storage = require('../../utils/storage.js');

Page({
  data: {
    user: { nickName: '美团用户', avatar: '' },
    couponCount: 0,
    orderCount: 0,
    weakNet: false
  },

  onShow() {
    const user = app.globalData.userInfo;
    const coupons = storage.getCoupons() || [];
    const orders = storage.getOrders();
    this.setData({
      user,
      couponCount: coupons.filter((c) => c.status === 'unused').length,
      orderCount: orders.length,
      weakNet: storage.getWeakNet()
    });
  },

  // 微信头像（推荐用法：button open-type=chooseAvatar）
  onChooseAvatar(e) {
    const user = Object.assign({}, this.data.user, { avatar: e.detail.avatarUrl });
    app.setUser(user);
    this.setData({ user });
  },
  // 微信昵称（input type=nickname）
  onNickname(e) {
    const user = Object.assign({}, this.data.user, { nickName: e.detail.value || '美团用户' });
    app.setUser(user);
    this.setData({ user });
  },

  goAddress() { wx.navigateTo({ url: '/pages/address/address' }); },
  goCoupon() { wx.navigateTo({ url: '/pages/coupon/coupon' }); },
  goOrder() { wx.switchTab({ url: '/pages/order/order' }); },
  // 弱网模拟开关（开启后首页请求有 50% 概率失败，用于演示重试）
  onWeakNet(e) {
    const v = e.detail.value;
    storage.saveWeakNet(v);
    this.setData({ weakNet: v });
    wx.showToast({ title: v ? '已开启弱网模拟' : '已关闭', icon: 'none' });
  },

  goService() { wx.showToast({ title: '客服热线 95017（演示）', icon: 'none' }); }
});
