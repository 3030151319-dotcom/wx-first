// components/shop-card/shop-card.js
// 店铺卡片（首页 / 搜索复用）：封面 + 名称 + 评分/月售/距离 + 活动标签 + 配送信息。
// 字段可选（搜索场景字段较少时自动降级）。点击冒泡 tap 事件，携带店铺 id。
Component({
  options: { styleIsolation: 'apply-shared' },
  properties: {
    shop: { type: Object, value: {} }
  },
  methods: {
    onTap() {
      this.triggerEvent('tap', { id: this.data.shop.id });
    }
  }
});
