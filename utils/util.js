// utils/util.js
// 作用：通用工具函数 —— 时间格式化、价格计算（满减 / 合计）、金额展示。
function pad(n) { return n < 10 ? '0' + n : '' + n; }

// 格式化时间：YYYY-MM-DD HH:mm
function formatTime(d) {
  d = d || new Date();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
    ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}
// 仅日期：YYYY-MM-DD
function formatDate(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

// 计算满减：根据店铺 activities 文本（如「满20减5」），按最优一档返回减免金额
function calcManjian(total, activities) {
  let best = 0;
  (activities || []).forEach((a) => {
    const m = /满(\d+)减(\d+)/.exec(a.label || '');
    if (m) {
      const cond = +m[1];
      const amt = +m[2];
      if (total >= cond && amt > best) best = amt;
    }
  });
  return best;
}

// 金额展示：¥12.5（最多两位小数，去掉无用的 .00 由调用方决定）
function yuan(n) { return '¥' + (Math.round(n * 100) / 100); }

// 生成简单订单号
function genOrderId() { return 'MT' + Date.now() + Math.floor(Math.random() * 1000); }

module.exports = { pad, formatTime, formatDate, calcManjian, yuan, genOrderId };
