// pages/review/review.js
// 作用：订单评价 —— 星级打分 + 文字评价 + 上传图片；提交后写入订单 review 字段。
const storage = require('../../utils/storage.js');

Page({
  data: {
    orderId: '',
    order: null,
    stars: 0,
    text: '',
    images: [],
    submitted: false
  },

  onLoad(options) {
    const order = storage.getOrders().find((o) => o.id === options.orderId);
    if (!order) { wx.showToast({ title: '订单不存在', icon: 'none' }); return; }
    if (order.review) {
      this.setData({ orderId: options.orderId, order, stars: order.review.stars, text: order.review.text, images: order.review.images || [], submitted: true });
    } else {
      this.setData({ orderId: options.orderId, order });
    }
  },

  setStars(e) { this.setData({ stars: parseInt(e.currentTarget.dataset.n, 10) }); },

  onText(e) { this.setData({ text: e.detail.value }); },

  chooseImage() {
    wx.chooseMedia({
      count: 3 - this.data.images.length,
      mediaType: ['image'],
      success: (res) => {
        const paths = res.tempFiles.map((f) => f.tempFilePath);
        this.setData({ images: this.data.images.concat(paths) });
      }
    });
  },
  removeImage(e) {
    const i = e.currentTarget.dataset.i;
    const imgs = this.data.images.slice();
    imgs.splice(i, 1);
    this.setData({ images: imgs });
  },

  submit() {
    if (this.data.stars === 0) { wx.showToast({ title: '请先打分', icon: 'none' }); return; }
    const orders = storage.getOrders();
    const idx = orders.findIndex((o) => o.id === this.data.orderId);
    if (idx > -1) {
      orders[idx].review = { stars: this.data.stars, text: this.data.text, images: this.data.images };
      storage.saveOrders(orders);
    }
    wx.showToast({ title: '评价成功', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 700);
  }
});
