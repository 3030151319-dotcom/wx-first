// pages/index/index.js
// 作用：首页 —— 定位、搜索入口、分类导航、排序筛选、店铺列表（下拉刷新 / 上滑加载更多）。
const app = getApp();
const mock = require('../../utils/mock.js');
const request = require('../../utils/request.js');
const storage = require('../../utils/storage.js');

Page({
  data: {
    city: '南京市',
    categories: [],
    activeCat: 'all',
    sortType: 'default',                       // default | distance | sales | rating
    sortTabs: [
      { id: 'default', name: '综合' },
      { id: 'distance', name: '距离' },
      { id: 'sales', name: '销量' },
      { id: 'rating', name: '评分' }
    ],
    shops: [],          // 已加载的全部店铺（用于筛选/排序）
    showShops: [],      // 当前展示（筛选+排序后）
    leftCol: [],        // 双列瀑布：左列
    rightCol: [],       // 双列瀑布：右列
    skItems: [1, 2, 3], // 骨架屏占位数量（每列）
    page: 1,
    pageSize: 5,
    hasMore: true,
    loading: false,
    netError: false      // 网络异常标记（用于展示重试按钮）
  },

  onLoad() {
    this.setData({
      city: app.globalData.city,
      location: app.globalData.location,
      categories: mock.categories
    });
    this.loadShops(1, true);
  },

  onShow() {
    // 从地址页 / 城市选择返回后同步城市
    this.setData({ city: app.globalData.city });
  },

  // 加载店铺（模拟异步），reset=true 时重置列表；支持弱网失败与重试
  loadShops(page, reset) {
    if (this.data.loading) return;
    if (!reset && !this.data.hasMore) return;
    this.setData({ loading: true, netError: false });
    const total = mock.getTotalShops();
    const weak = storage.getWeakNet();   // 弱网模拟开关（我的页可切换）
    request(mock.getShopsPage(page, this.data.pageSize), 300, { failRate: weak ? 0.5 : 0 })
      .then((list) => {
        const shops = reset ? list : this.data.shops.concat(list);
        const hasMore = page * this.data.pageSize < total;
        this.setData({ shops, page, hasMore, loading: false, netError: false }, () => this.applyFilter());
      })
      .catch(() => {
        this.setData({ loading: false, netError: true });
      });
  },

  // 网络异常时点击重试
  retry() {
    this.loadShops(this.data.page, this.data.page === 1);
  },

  // 按分类 + 排序计算展示列表，并拆成左右两列（交错分配，保持排序顺序）
  applyFilter() {
    const { shops, activeCat, sortType } = this.data;
    let list = shops;
    if (activeCat !== 'all') list = list.filter((s) => s.category === activeCat);
    if (sortType === 'distance') list = list.slice().sort((a, b) => a.distance - b.distance);
    else if (sortType === 'sales') list = list.slice().sort((a, b) => b.monthSales - a.monthSales);
    else if (sortType === 'rating') list = list.slice().sort((a, b) => b.rating - a.rating);
    const leftCol = [];
    const rightCol = [];
    list.forEach((s, i) => { (i % 2 === 0 ? leftCol : rightCol).push(s); });
    this.setData({ showShops: list, leftCol, rightCol });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ hasMore: true });
    this.loadShops(1, true);
    wx.stopPullDownRefresh();
    wx.showToast({ title: '已刷新', icon: 'none' });
  },

  // 上滑加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) this.loadShops(this.data.page + 1, false);
  },

  selectCat(e) {
    this.setData({ activeCat: e.currentTarget.dataset.id }, () => this.applyFilter());
  },

  changeSort(e) {
    this.setData({ sortType: e.currentTarget.dataset.id }, () => this.applyFilter());
  },

  // 选择城市（手动选择定位）
  chooseCity() {
    wx.showActionSheet({
      itemList: mock.cities,
      success: (res) => {
        const city = mock.cities[res.tapIndex];
        app.setCity(city);
        app.setLocation(city);
        this.setData({ city, location: city });
        wx.showToast({ title: '已切换到 ' + city, icon: 'none' });
      }
    });
  },

  goSearch() {
    wx.navigateTo({ url: '/pages/search/search' });
  },

  goShop(e) {
    wx.navigateTo({ url: '/pages/shop/shop?id=' + e.currentTarget.dataset.id });
  },

  goAddress() {
    wx.navigateTo({ url: '/pages/address/address?from=index' });
  }
});
