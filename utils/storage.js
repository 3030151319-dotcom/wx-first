// utils/storage.js
// 作用：统一管理本地缓存（购物车 / 地址 / 优惠券 / 订单 / 用户 / 搜索历史 / 城市定位）。
// 约定前缀 MT_，所有页面读写缓存都走这里，避免散落 wx.setStorageSync 调用。
const KEY = {
  CART: 'MT_CART',       // 购物车对象 { [shopId]: {shopId,shopName,deliveryFee,items:{[key]:item}} }
  ADDR: 'MT_ADDR',       // 收货地址数组
  COUPON: 'MT_COUPON',   // 用户优惠券数组
  ORDER: 'MT_ORDER',     // 订单数组
  USER: 'MT_USER',       // 用户信息 {nickName,avatar}
  HISTORY: 'MT_HISTORY', // 搜索历史数组
  CITY: 'MT_CITY',       // 当前城市
  LOCATION: 'MT_LOCATION'// 当前收货地址文本
};

function get(k, def) {
  const v = wx.getStorageSync(k);
  return (v === undefined || v === null || v === '') ? def : v;
}
function set(k, v) { wx.setStorageSync(k, v); }

module.exports = {
  KEYS: KEY,
  getCart: () => get(KEY.CART, {}),
  saveCart: (c) => set(KEY.CART, c),
  getAddresses: () => get(KEY.ADDR, null),   // null 表示尚未播种初始数据
  saveAddresses: (a) => set(KEY.ADDR, a),
  getCoupons: () => get(KEY.COUPON, null),
  saveCoupons: (c) => set(KEY.COUPON, c),
  getOrders: () => get(KEY.ORDER, []),
  saveOrders: (o) => set(KEY.ORDER, o),
  getUser: () => get(KEY.USER, { nickName: '美团用户', avatar: '' }),
  saveUser: (u) => set(KEY.USER, u),
  getHistory: () => get(KEY.HISTORY, []),
  saveHistory: (h) => set(KEY.HISTORY, h),
  getCity: () => get(KEY.CITY, '南京市'),
  saveCity: (c) => set(KEY.CITY, c),
  getLocation: () => get(KEY.LOCATION, '南京市鼓楼区'),
  saveLocation: (l) => set(KEY.LOCATION, l),
  // 弱网模拟开关（我的页可切换，用于演示 request 网络异常与重试）
  getWeakNet: () => get(KEY.WEAK_NET, false),
  saveWeakNet: (v) => set(KEY.WEAK_NET, v)
};
