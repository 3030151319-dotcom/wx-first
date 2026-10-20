// utils/request.js
// 作用：模拟网络请求（无真实后端）。返回 Promise，并带 delay 毫秒延迟，模拟加载过程。
// 真实项目中可把内部实现替换为 wx.request，对页面调用方无感。
function request(data, delay, opts) {
  opts = opts || {};
  delay = delay || 300;
  const failRate = opts.failRate || 0;   // 失败率：0 表示永不失败；>0 时按比例 reject，用于演示弱网
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (failRate > 0 && Math.random() < failRate) {
        reject(new Error('网络异常，请稍后重试'));
      } else {
        resolve(data);
      }
    }, delay);
  });
}
// 直接导出函数本体，调用方 require 后即可 request(...) 使用
// 用法：request(data, 300) 或 request(data, 300, { failRate: 0.5 })
module.exports = request;
