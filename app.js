// app.js —— 小程序入口
// 作用：全局数据（定位/用户/购物车）、购物车核心方法、首次启动播种地址与优惠券。
const storage = require('./utils/storage.js');
const mock = require('./utils/mock.js');

App({
  globalData: {
    city: '南京市',
    location: '南京市鼓楼区',
    userInfo: { nickName: '美团用户', avatar: '' },
    // 购物车结构：
    // { [shopId]: { shopId, shopName, deliveryFee, items: { [key]: item } } }
    // item = { key, goodsId, name, price(含规格差价), img, count, checked, specText, specs:[labels] }
    cart: {}
  },

  onLaunch() {
    // 恢复购物车
    this.globalData.cart = storage.getCart();
    // 首次启动播种地址 / 优惠券
    if (storage.getAddresses() === null) storage.saveAddresses(mock.defaultAddresses);
    if (storage.getCoupons() === null) storage.saveCoupons(mock.defaultCoupons);
    // 恢复城市 / 定位 / 用户
    this.globalData.city = storage.getCity();
    this.globalData.location = storage.getLocation();
    this.globalData.userInfo = storage.getUser();
  },

  // 设置当前城市
  setCity(city) {
    this.globalData.city = city;
    storage.saveCity(city);
  },
  // 设置当前收货定位文本
  setLocation(loc) {
    this.globalData.location = loc;
    storage.saveLocation(loc);
  },
  // 保存用户信息（头像/昵称）
  setUser(user) {
    this.globalData.userInfo = user;
    storage.saveUser(user);
  },

  // 加入购物车（支持规格）。specText: '大份/中辣'，unitPrice: 含差价后的单价，specLabels: [labels]
  addToCart(shop, goods, specText, unitPrice, specLabels) {
    const cart = this.globalData.cart;
    if (!cart[shop.id]) {
      cart[shop.id] = { shopId: shop.id, shopName: shop.name, deliveryFee: shop.deliveryFee, items: {} };
    }
    const items = cart[shop.id].items;
    const key = goods.id + '|' + (specText || '');
    if (items[key]) {
      items[key].count += 1;
    } else {
      items[key] = {
        key,
        goodsId: goods.id,
        name: goods.name,
        price: unitPrice,
        img: goods.img,
        count: 1,
        checked: true,
        specText: specText || '',
        specs: specLabels || []
      };
    }
    storage.saveCart(cart);
  },

  // 修改数量（delta: +1 / -1）
  changeCartCount(shopId, key, delta) {
    const cart = this.globalData.cart;
    if (!cart[shopId]) return;
    const item = cart[shopId].items[key];
    if (!item) return;
    item.count += delta;
    if (item.count <= 0) delete cart[shopId].items[key];
    if (Object.keys(cart[shopId].items).length === 0) delete cart[shopId];
    storage.saveCart(cart);
  },

  // 设置某条目勾选状态
  setItemChecked(shopId, key, checked) {
    const cart = this.globalData.cart;
    if (cart[shopId] && cart[shopId].items[key]) {
      cart[shopId].items[key].checked = checked;
      storage.saveCart(cart);
    }
  },

  // 全店 / 全局勾选
  setAllChecked(shopId, checked) {
    const cart = this.globalData.cart;
    if (shopId) {
      const s = cart[shopId];
      if (s) Object.keys(s.items).forEach((k) => { s.items[k].checked = checked; });
    } else {
      Object.keys(cart).forEach((sid) => {
        Object.keys(cart[sid].items).forEach((k) => { cart[sid].items[k].checked = checked; });
      });
    }
    storage.saveCart(cart);
  },

  // 删除某条目（用于购物车删除）
  removeCartItem(shopId, key) {
    const cart = this.globalData.cart;
    if (cart[shopId]) {
      delete cart[shopId].items[key];
      if (Object.keys(cart[shopId].items).length === 0) delete cart[shopId];
      storage.saveCart(cart);
    }
  },

  // 清空某店铺购物车（用于下单后移除已结算商品）
  clearShop(shopId) {
    const cart = this.globalData.cart;
    delete cart[shopId];
    storage.saveCart(cart);
  },

  getCartShop(shopId) { return this.globalData.cart[shopId] || null; },

  // 购物车与 mock 数据同步：修正无规格商品价格 / 标记售罄 / 清理下架商品与空店铺
  // 进入购物车 / 确认订单页时调用；返回变动列表，供页面弹窗提示用户
  syncCart() {
    const cart = this.globalData.cart;
    const changes = [];
    Object.keys(cart).forEach((sid) => {
      const s = cart[sid];
      const shop = mock.getShopById(sid);
      if (!shop) {
        changes.push({ name: s.shopName, type: 'shopRemoved' });
        delete cart[sid];
        return;
      }
      Object.keys(s.items).forEach((k) => {
        const it = s.items[k];
        const g = (shop.goods || []).find((x) => x.id === it.goodsId);
        if (!g) {
          changes.push({ name: it.name, type: 'removed' });
          delete s.items[k];
          return;
        }
        if (g.soldOut && !it.soldOut) {
          it.soldOut = true;
          it.checked = false;            // 售罄自动取消勾选，避免误结算
          changes.push({ name: it.name, type: 'soldOut' });
        }
        if (!g.soldOut) it.soldOut = false;
        // 仅对无规格商品比对价格（有规格商品单价含固定差价，基础价不变，避免误判）
        if (!it.specText && g.price !== it.price && !it.soldOut) {
          changes.push({ name: it.name, type: 'price', oldPrice: it.price, newPrice: g.price });
          it.price = g.price;
        }
      });
      if (Object.keys(s.items).length === 0) delete cart[sid];
    });
    storage.saveCart(cart);
    return changes;
  },

  // 统计「已勾选且未售罄」商品涉及的不同店铺数量（用于跨店铺结算拦截）
  getCheckedShopCount() {
    const cart = this.globalData.cart;
    let n = 0;
    Object.keys(cart).forEach((sid) => {
      const hit = Object.values(cart[sid].items).some((it) => it.checked && !it.soldOut);
      if (hit) n++;
    });
    return n;
  },

  // 统计：总件数 / 总价格（all=true 全部；false 仅勾选项）
  getCartTotal(all) {
    let count = 0;
    let price = 0;
    const cart = this.globalData.cart;
    Object.keys(cart).forEach((sid) => {
      Object.keys(cart[sid].items).forEach((k) => {
        const it = cart[sid].items[k];
        if (all || it.checked) {
          count += it.count;
          price += it.price * it.count;
        }
      });
    });
    return { count, price };
  },

  // 统计某个店铺已选商品（用于店铺页底部栏）
  getShopSelected(shopId) {
    const s = this.globalData.cart[shopId];
    let count = 0;
    let price = 0;
    if (s) {
      Object.keys(s.items).forEach((k) => {
        const it = s.items[k];
        count += it.count;
        price += it.price * it.count;
      });
    }
    return { count, price };
  }
});
