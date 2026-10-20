// components/goods-card/goods-card.js
// 商品行（店铺页复用）：图 + 名称/描述/销量 + 价格 + 步进器（点击缩放）。售罄置灰、禁加购。
// 冒泡 add / minus 事件，携带商品对象；数量由页面通过 count 传入。
Component({
  options: { styleIsolation: 'apply-shared' },
  properties: {
    goods: { type: Object, value: {} },
    count: { type: Number, value: 0 }
  },
  methods: {
    onAdd() {
      if (this.data.goods.soldOut) return;
      this.triggerEvent('add', { goods: this.data.goods });
    },
    onMinus() {
      this.triggerEvent('minus', { goods: this.data.goods });
    }
  }
});
