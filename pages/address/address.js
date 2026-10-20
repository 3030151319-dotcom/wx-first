// pages/address/address.js
// 作用：收货地址管理 —— 列表、新增/编辑/删除、设为默认；可作为选择器供首页/确认页使用。
// 新增（P0）：wx.getLocation 定位、省市区选择器、非空+手机号校验、最多 5 条限制。
const app = getApp();
const storage = require('../../utils/storage.js');

// 城市 -> 省市区（Mock 逆地理编码，仅用于演示定位回填）
const CITY_REGION = {
  '南京市': ['江苏省', '南京市', '鼓楼区'],
  '北京市': ['北京市', '北京市', '朝阳区'],
  '上海市': ['上海市', '上海市', '黄浦区'],
  '广州市': ['广东省', '广州市', '天河区'],
  '深圳市': ['广东省', '深圳市', '南山区'],
  '杭州市': ['浙江省', '杭州市', '西湖区'],
  '成都市': ['四川省', '成都市', '武侯区'],
  '武汉市': ['湖北省', '武汉市', '武昌区'],
  '西安市': ['陕西省', '西安市', '雁塔区'],
  '重庆市': ['重庆市', '重庆市', '渝中区']
};
const MAX_ADDR = 5;   // 最多保存地址条数

Page({
  data: {
    from: '',             // '' 普通管理 | 'index' 选定位 | 'confirm' 选收货地址
    addresses: [],
    showForm: false,
    editing: false,
    tags: ['家', '公司', '学校'],
    form: { id: '', name: '', phone: '', detail: '', region: [], tag: '家', isDefault: false }
  },

  onLoad(options) { this.setData({ from: options.from || '' }); },

  onShow() { this.setData({ addresses: storage.getAddresses() || [] }); },

  // 选中地址（选择器模式）
  selectAddr(e) {
    const addr = e.currentTarget.dataset.addr;
    if (this.data.from === 'confirm') {
      app.globalData.tempAddress = addr;
      wx.navigateBack();
    } else if (this.data.from === 'index') {
      app.setLocation(addr.detail);
      wx.navigateBack();
    }
  },

  openForm() {
    this.setData({ showForm: true, editing: false, form: { id: '', name: '', phone: '', detail: '', region: [], tag: '家', isDefault: false } });
  },
  cancelForm() { this.setData({ showForm: false }); },

  onField(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ ['form.' + field]: e.detail.value });
  },
  pickTag(e) { this.setData({ 'form.tag': e.currentTarget.dataset.tag }); },
  onDefault(e) { this.setData({ 'form.isDefault': e.detail.value }); },
  onRegion(e) { this.setData({ 'form.region': e.detail.value }); },

  // 定位：调用 wx.getLocation 获取经纬度，并据此回填省市区（Mock 逆编码）
  getLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: () => {
        const city = app.globalData.city || '南京市';
        const region = CITY_REGION[city] || ['江苏省', '南京市', '鼓楼区'];
        this.setData({ 'form.region': region });
        wx.showToast({ title: '已定位到当前城市', icon: 'none' });
      },
      fail: () => { wx.showToast({ title: '定位失败，请手动选择', icon: 'none' }); }
    });
  },

  editAddr(e) {
    const addr = e.currentTarget.dataset.addr;
    const form = JSON.parse(JSON.stringify(addr));
    form.region = (form.region || '').split(' ').filter(Boolean);   // 字符串转回数组供 picker 使用
    this.setData({ showForm: true, editing: true, form });
  },

  saveAddr() {
    const f = this.data.form;
    if (!f.name.trim()) { wx.showToast({ title: '请填写联系人', icon: 'none' }); return; }
    if (!/^\d{11}$/.test(f.phone.trim())) { wx.showToast({ title: '请填写11位手机号', icon: 'none' }); return; }
    if (f.region.length === 0) { wx.showToast({ title: '请选择省市区', icon: 'none' }); return; }
    if (!f.detail.trim()) { wx.showToast({ title: '请填写详细地址', icon: 'none' }); return; }

    let addresses = storage.getAddresses() || [];
    if (this.data.editing) {
      f.region = f.region.join(' ');   // 数组转字符串持久化
      addresses = addresses.map((a) => (a.id === f.id ? f : a));
    } else {
      if (addresses.length >= MAX_ADDR) { wx.showToast({ title: '最多保存' + MAX_ADDR + '条地址', icon: 'none' }); return; }
      f.id = 'a' + Date.now();
      f.region = f.region.join(' ');
      addresses.push(f);
    }
    // 默认地址互斥
    if (f.isDefault) addresses.forEach((a) => { if (a.id !== f.id) a.isDefault = false; });
    storage.saveAddresses(addresses);
    this.setData({ addresses, showForm: false });
    wx.showToast({ title: '已保存', icon: 'success' });
  },

  deleteAddr(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示', content: '确定删除该地址？', success: (r) => {
        if (r.confirm) {
          let addresses = (storage.getAddresses() || []).filter((a) => a.id !== id);
          storage.saveAddresses(addresses);
          this.setData({ addresses });
        }
      }
    });
  },

  setDefault(e) {
    const id = e.currentTarget.dataset.id;
    let addresses = (storage.getAddresses() || []).map((a) => ({ ...a, isDefault: a.id === id }));
    storage.saveAddresses(addresses);
    this.setData({ addresses });
  }
});
