// components/mt-sheet/mt-sheet.js
// 通用底部弹窗组件：内置遮罩 + 上滑淡入 / 下滑淡出动画（纯视觉，无业务逻辑）。
// 用法：<mt-sheet show="{{x}}" sheet-class="xxx" bind:maskclose="closeX"> ...slot... </mt-sheet>
Component({
  options: { styleIsolation: 'apply-shared' },
  properties: {
    show: { type: Boolean, value: false },        // 由页面控制；置 false 时播放淡出后再卸载
    sheetClass: { type: String, value: '' },      // 追加到 .sheet 的页面级类（如 coupon-sheet）
    maskClosable: { type: Boolean, value: true }  // 点击遮罩是否关闭
  },
  data: {
    innerShow: false,   // 内部控制是否渲染（淡出期间保持渲染）
    closing: false      // 是否正在播放淡出
  },
  observers: {
    show(v) {
      if (v) {
        // 打开：清理可能未完成的淡出定时器，立即渲染并播放入场动画
        if (this._t) { clearTimeout(this._t); this._t = null; }
        this.setData({ innerShow: true, closing: false });
      } else if (this.data.innerShow && !this.data.closing) {
        // 关闭：先播淡出，200ms 后卸载并通知页面
        this.setData({ closing: true });
        this._t = setTimeout(() => {
          this.setData({ innerShow: false, closing: false });
          this.triggerEvent('close', {});
        }, 200);
      }
    }
  },
  methods: {
    onMask() {
      if (this.data.maskClosable) this.triggerEvent('maskclose', {});
    }
  }
});
