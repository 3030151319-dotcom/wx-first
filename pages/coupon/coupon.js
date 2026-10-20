// pages/coupon/coupon.js
// 作用：我的优惠券 —— 按状态切换（未使用 / 已使用 / 已过期）。数据来自本地缓存。
const storage = require('../../utils/storage.js');

Page({
  data: {
    tabs: [
      { id: 'unused', name: '未使用' },
      { id: 'used', name: '已使用' },
      { id: 'expired', name: '已过期' }
    ],
    activeTab: 'unused',
    list: []
  },

  onShow() { this.filter(); },

  filter() {
    const cs = storage.getCoupons() || [];
    const t = this.data.activeTab;
    this.setData({ list: cs.filter((c) => c.status === t) });
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.id }, () => this.filter());
  }
});
