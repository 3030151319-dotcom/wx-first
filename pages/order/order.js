// pages/order/order.js
// 作用：订单列表 —— 状态标签切换、订单详情弹层、取消/支付/确认收货/评价/删除；数据本地缓存。
// 新增（P0）：
//  1) 待付款 15 分钟超时自动关闭（expireAt 持久化到 storage，下次进入仍生效）；
//  2) 状态锁：基于状态机拒绝非法逆向 / 越级操作；
//  3) 订单列表分页渲染（每页 5 条，onReachBottom 加载更多）。
const storage = require('../../utils/storage.js');

const PAGE_SIZE = 5;                 // 每页订单数
const PAY_TIMEOUT = 15 * 60 * 1000;  // 待付款超时：15 分钟（用于展示，与 confirm 写入一致）

// 状态机：允许的正向流转；不在表中的流转一律拒绝（防止逆向 / 越级操作）
const FLOW = {
  '待付款': ['待配送', '已取消'],
  '待配送': ['已完成'],
  '已完成': [],
  '已取消': []
};

Page({
  data: {
    tabs: [
      { id: 'all', name: '全部' },
      { id: '待付款', name: '待付款' },
      { id: '待配送', name: '待配送' },
      { id: '待评价', name: '待评价' },
      { id: '已完成', name: '已完成' },
      { id: '已取消', name: '已取消' }
    ],
    activeTab: 'all',
    allFiltered: [],     // 当前标签过滤后的全部订单（分页数据源）
    orders: [],          // 当前页展示订单
    page: 1,
    hasMore: false,
    skeleton: false,     // 首屏骨架屏（纯视觉占位）
    detailShow: false,
    detailOrder: null
  },

  onShow() {
    this.checkExpired();   // 先处理超时订单
    this.filterOrders();
    this.startTimer();     // 启动倒计时刷新
    // 首屏骨架屏：仅第一次进入时短暂占位（纯视觉）
    if (!this._mounted) {
      this._mounted = true;
      this.setData({ skeleton: true });
      setTimeout(() => this.setData({ skeleton: false }), 350);
    }
  },
  onHide() { this.stopTimer(); },
  onUnload() { this.stopTimer(); },

  // 将超时未支付的待付款订单自动关闭为「已取消」（持久化到 storage，下次进入仍生效）
  checkExpired() {
    let changed = false;
    const orders = storage.getOrders().map((o) => {
      if (o.status === '待付款' && o.expireAt && Date.now() > o.expireAt) {
        o.status = '已取消';
        changed = true;
      }
      return o;
    });
    if (changed) storage.saveOrders(orders);
  },

  // 每秒刷新待付款订单的倒计时；若某订单已超时则触发 checkExpired 重新过滤
  startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => {
      const nowTs = Date.now();
      let needRefresh = false;
      const orders = this.data.orders.map((o) => {
        if (o.status === '待付款' && o.expireAt) {
          const left = o.expireAt - nowTs;
          if (left <= 0) { needRefresh = true; return o; }
          return Object.assign({}, o, { remainText: this.fmtLeft(left) });
        }
        return o;
      });
      this.setData({ orders });
      if (needRefresh) this.checkExpired();
    }, 1000);
  },
  stopTimer() { if (this.timer) { clearInterval(this.timer); this.timer = null; } },

  fmtLeft(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return (m < 10 ? '0' + m : m) + ':' + (ss < 10 ? '0' + ss : ss);
  },

  // 按标签过滤 + 给待付款订单计算剩余时间，并重置分页
  filterOrders() {
    const all = storage.getOrders();
    const t = this.data.activeTab;
    let list = all;
    if (t !== 'all') {
      if (t === '待评价') list = all.filter((o) => o.status === '已完成' && !o.review);
      else if (t === '已完成') list = all.filter((o) => o.status === '已完成' && o.review);
      else list = all.filter((o) => o.status === t);
    }
    const nowTs = Date.now();
    list = list.map((o) => {
      if (o.status === '待付款' && o.expireAt) {
        const left = o.expireAt - nowTs;
        return Object.assign({}, o, { remainText: left > 0 ? this.fmtLeft(left) : '已超时' });
      }
      return o;
    });
    this.setData({ allFiltered: list, page: 1 });
    this.renderPage();
  },

  // 取当前页数据
  renderPage() {
    const { allFiltered, page } = this.data;
    const slice = allFiltered.slice(0, page * PAGE_SIZE);
    const hasMore = page * PAGE_SIZE < allFiltered.length;
    this.setData({ orders: slice, hasMore });
  },

  // 上滑加载更多
  onReachBottom() {
    if (this.data.hasMore) this.setData({ page: this.data.page + 1 }, () => this.renderPage());
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.id }, () => this.filterOrders());
  },

  // 订单详情弹层
  showDetail(e) {
    const id = e.currentTarget.dataset.id;
    const order = storage.getOrders().find((o) => o.id === id);
    this.setData({ detailShow: true, detailOrder: order });
  },
  closeDetail() { this.setData({ detailShow: false }); },

  // 去支付（待付款 -> 待配送）
  payOrder(e) {
    const id = e.currentTarget.dataset.id;
    this.updateStatus(id, '待配送', '支付成功');
  },
  // 取消订单（待付款 -> 已取消）
  cancelOrder(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({ title: '提示', content: '确定取消该订单？', success: (r) => { if (r.confirm) this.updateStatus(id, '已取消', '已取消'); } });
  },
  // 确认收货（待配送 -> 已完成）
  confirmReceipt(e) {
    const id = e.currentTarget.dataset.id;
    this.updateStatus(id, '已完成', '已确认收货');
  },
  // 带状态锁的状态流转
  updateStatus(id, next, toast) {
    const orders = storage.getOrders();
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) return;
    const cur = orders[idx].status;
    const allow = FLOW[cur] || [];
    if (!allow.includes(next)) {
      wx.showToast({ title: '订单状态不可变更', icon: 'none' });
      return;
    }
    orders[idx].status = next;
    storage.saveOrders(orders);
    this.filterOrders();
    if (toast) wx.showToast({ title: toast, icon: 'none' });
  },

  // 去评价
  goReview(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/review/review?orderId=' + id });
  },

  // 删除订单（已取消/已完成）
  deleteOrder(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({ title: '提示', content: '删除该订单记录？', success: (r) => {
      if (r.confirm) {
        const orders = storage.getOrders().filter((o) => o.id !== id);
        storage.saveOrders(orders);
        this.filterOrders();
      }
    } });
  },

  goHome() { wx.switchTab({ url: '/pages/index/index' }); }
});
