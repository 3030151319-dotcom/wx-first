// components/mt-empty/mt-empty.js
// 通用空状态组件：图标 + 文案 + 可选按钮。全站统一（购物车/订单/优惠券/地址/搜索无结果）。
Component({
  options: { styleIsolation: 'apply-shared' },
  properties: {
    icon: { type: String, value: '' },
    text: { type: String, value: '暂无数据' },
    btnText: { type: String, value: '' },
    showBtn: { type: Boolean, value: false }
  },
  methods: {
    onBtn() {
      this.triggerEvent('btn', {});
    }
  }
});
