// utils/mock.js
// 作用：本地模拟数据（城市 / 分类 / 店铺 / 商品 / 优惠券 / 地址），无需后端，前端独立演示。
// 所有图片均为 images/ 目录下的真实风格 JPG（店铺 shops/1-15.jpg，商品 goods/101-343.jpg）。

/* ===================== 城市与分类 ===================== */
const cities = ['南京市', '北京市', '上海市', '广州市', '深圳市', '杭州市', '成都市', '武汉市', '西安市', '重庆市'];

// 首页横向滚动分类导航
const categories = [
  { id: 'all', name: '全部', icon: '🍽️' },
  { id: 'meishi', name: '美食', icon: '🍚' },
  { id: 'zaocan', name: '早餐', icon: '🥪' },
  { id: 'naicha', name: '奶茶', icon: '🧋' },
  { id: 'chaoshi', name: '超市', icon: '🛒' },
  { id: 'maicai', name: '买菜', icon: '🥬' },
  { id: 'yiyao', name: '药品', icon: '💊' },
  { id: 'tiandian', name: '甜点', icon: '🍰' },
  { id: 'hanbao', name: '汉堡', icon: '🍔' },
  { id: 'kafei', name: '咖啡', icon: '☕' }
];

/* ===================== 商品规格（供规格选择弹窗使用） ===================== */
const SPEC_SIZE = { name: '规格', options: [{ label: '标准', delta: 0 }, { label: '大份', delta: 5 }, { label: '小份', delta: -3 }] };
const SPEC_SPICE = { name: '辣度', options: [{ label: '不辣', delta: 0 }, { label: '微辣', delta: 0 }, { label: '中辣', delta: 0 }, { label: '特辣', delta: 0 }] };
const SPEC_SUGAR = { name: '糖度', options: [{ label: '标准糖', delta: 0 }, { label: '少糖', delta: 0 }, { label: '半糖', delta: 0 }, { label: '无糖', delta: 0 }] };
const SPEC_TEMP = { name: '温度', options: [{ label: '冰', delta: 0 }, { label: '少冰', delta: 0 }, { label: '常温', delta: 0 }, { label: '热', delta: 0 }] };

// 商品构造器：统一字段，specs / soldOut 可选
function good(id, catId, name, price, img, desc, sales, praise, specs, soldOut) {
  return { id, catId, name, price, img, desc, sales, praise, specs: specs || [], soldOut: !!soldOut };
}

/* ===================== 基础店铺（5 家，对应已生成的真实图片） ===================== */
const baseShops = [
  {
    id: 1, name: '老北京炸酱面(朝阳店)', img: '/images/shops/1.jpg',
    rating: 4.8, monthSales: 2300, deliveryFee: 0, distance: 0.8, minOrder: 20, deliveryTime: 30,
    category: 'meishi', notice: '本店主打正宗老北京炸酱面，满20减5，现做现送',
    activities: [{ label: '满20减5' }, { label: '新客立减3' }, { label: '8.8折' }],
    coupons: [{ id: 's1c1', title: '满30减8', amount: 8, condition: 30 }, { id: 's1c2', title: '满50减15', amount: 15, condition: 50 }],
    categories: [{ id: 'c1', name: '招牌主食' }, { id: 'c2', name: '爽口凉菜' }, { id: 'c3', name: '饮品' }],
    goods: [
      good(101, 'c1', '老北京炸酱面', 18, '/images/goods/101.jpg', '筋道面条 + 秘制炸酱', 800, 98, [SPEC_SIZE]),
      good(102, 'c1', '牛肉打卤面', 22, '/images/goods/102.jpg', '浓香卤汁 牛肉满满', 520, 96, [SPEC_SIZE]),
      good(103, 'c1', '炸酱面双人套餐', 38, '/images/goods/103.jpg', '两份炸酱面 + 小菜', 310, 97, []),
      good(201, 'c2', '拍黄瓜', 8, '/images/goods/201.jpg', '清爽解腻', 430, 95, [SPEC_SPICE]),
      good(202, 'c2', '凉拌海带丝', 6, '/images/goods/202.jpg', '微辣爽口', 360, 94, [SPEC_SPICE], true), // 演示售罄
      good(301, 'c3', '北冰洋汽水', 5, '/images/goods/301.jpg', '童年的味道', 900, 99, [SPEC_TEMP]),
      good(302, 'c3', '桂花酸梅汤', 7, '/images/goods/302.jpg', '冰镇解暑', 280, 96, [SPEC_TEMP]),
      good(104, 'c1', '茄丁打卤面', 20, '/images/goods/104.jpg', '咸香茄丁 卤汁浓郁', 460, 96, [SPEC_SIZE]),
      good(105, 'c1', '炸酱凉面', 17, '/images/goods/105.jpg', '麻酱凉面 夏日必备', 380, 95, [SPEC_SIZE]),
      good(203, 'c2', '凉拌耳丝', 18, '/images/goods/203.jpg', '脆嫩爽口', 210, 94, [SPEC_SPICE]),
      good(204, 'c2', '麻酱凉皮', 11, '/images/goods/204.jpg', '麻酱浓香 劲道凉皮', 330, 95, [SPEC_SPICE]),
      good(303, 'c3', '现磨豆浆', 6, '/images/goods/303.jpg', '醇香热豆浆', 520, 97, [SPEC_TEMP])
    ]
  },
  {
    id: 2, name: '幸福汉堡(国贸店)', img: '/images/shops/2.jpg',
    rating: 4.6, monthSales: 1800, deliveryFee: 3, distance: 1.2, minOrder: 15, deliveryTime: 28,
    category: 'hanbao', notice: '现做现炸，热乎送达',
    activities: [{ label: '满15减3' }, { label: '第二份半价' }],
    coupons: [{ id: 's2c1', title: '满25减6', amount: 6, condition: 25 }],
    categories: [{ id: 'c1', name: '人气汉堡' }, { id: 'c2', name: '小食' }, { id: 'c3', name: '饮品' }],
    goods: [
      good(111, 'c1', '招牌牛肉堡', 21, '/images/goods/111.jpg', '100%牛肉饼', 660, 97, [SPEC_SIZE]),
      good(112, 'c1', '香辣鸡腿堡', 19, '/images/goods/112.jpg', '外酥里嫩', 540, 95, [SPEC_SIZE]),
      good(113, 'c1', '双层芝士堡', 26, '/images/goods/113.jpg', '双倍芝士', 320, 98, [SPEC_SIZE]),
      good(211, 'c2', '黄金薯条', 9, '/images/goods/211.jpg', '酥脆不油腻', 700, 96, [SPEC_SIZE]),
      good(212, 'c2', '香脆鸡米花', 12, '/images/goods/212.jpg', '一口一个', 410, 94, []),
      good(311, 'c3', '冰镇可乐', 6, '/images/goods/311.jpg', '畅爽气泡', 880, 99, [SPEC_TEMP]),
      good(312, 'c3', '鲜橙汁', 8, '/images/goods/312.jpg', '鲜榨橙肉', 230, 95, [SPEC_TEMP]),
      good(114, 'c1', '鳕鱼堡', 20, '/images/goods/114.jpg', '金黄鳕鱼排', 290, 95, [SPEC_SIZE]),
      good(115, 'c1', '牛油果鸡腿堡', 24, '/images/goods/115.jpg', '牛油果泥 + 炸鸡腿', 260, 96, [SPEC_SIZE]),
      good(213, 'c2', '奥尔良烤翅', 14, '/images/goods/213.jpg', '油亮酱香', 480, 97, [SPEC_SIZE]),
      good(214, 'c2', '洋葱圈', 10, '/images/goods/214.jpg', '酥脆香甜', 350, 94, [SPEC_SIZE])
    ]
  },
  {
    id: 3, name: '鲜果时光(买菜超市)', img: '/images/shops/3.jpg',
    rating: 4.9, monthSales: 3200, deliveryFee: 0, distance: 0.5, minOrder: 10, deliveryTime: 25,
    category: 'maicai', notice: '当日达，新鲜不隔夜',
    activities: [{ label: '满10减2' }, { label: '满30减8' }],
    coupons: [{ id: 's3c1', title: '满40减10', amount: 10, condition: 40 }],
    categories: [{ id: 'c1', name: '新鲜水果' }, { id: 'c2', name: '时令蔬菜' }, { id: 'c3', name: '轻食套餐' }],
    goods: [
      good(121, 'c1', '进口红提', 19, '/images/goods/121.jpg', '颗颗饱满', 520, 98, [SPEC_SIZE]),
      good(122, 'c1', '海南香蕉', 9, '/images/goods/122.jpg', '软糯香甜', 610, 97, [SPEC_SIZE]),
      good(123, 'c1', '红心猕猴桃', 16, '/images/goods/123.jpg', '维C爆棚', 380, 96, [SPEC_SIZE]),
      good(221, 'c2', '有机西兰花', 7, '/images/goods/221.jpg', '绿色健康', 290, 95, []),
      good(222, 'c2', '千禧小番茄', 8, '/images/goods/222.jpg', '一口爆汁', 440, 97, []),
      good(321, 'c3', '鲜切果盒', 18, '/images/goods/321.jpg', '多种水果拼盘', 260, 96, [SPEC_SIZE]),
      good(322, 'c3', '轻盈蔬菜沙拉', 14, '/images/goods/322.jpg', '低卡轻食', 210, 95, []),
      good(124, 'c1', '智利车厘子', 39, '/images/goods/124.jpg', 'JJJ级 颗颗饱满', 260, 98, [SPEC_SIZE]),
      good(125, 'c1', '广西沃柑', 12, '/images/goods/125.jpg', '皮薄多汁', 420, 96, [SPEC_SIZE]),
      good(223, 'c2', '荷兰黄瓜', 7, '/images/goods/223.jpg', '新鲜顶花带刺', 300, 95, []),
      good(323, 'c3', '全麦三明治', 12, '/images/goods/323.jpg', '低卡饱腹', 240, 95, [])
    ]
  },
  {
    id: 4, name: '康康大药房(24h)', img: '/images/shops/4.jpg',
    rating: 4.7, monthSales: 900, deliveryFee: 2, distance: 1.5, minOrder: 0, deliveryTime: 35,
    category: 'yiyao', notice: '急用药，最快30分钟达',
    activities: [{ label: '满30减5' }],
    coupons: [{ id: 's4c1', title: '满50减12', amount: 12, condition: 50 }],
    categories: [{ id: 'c1', name: '感冒用药' }, { id: 'c2', name: '防护用品' }, { id: 'c3', name: '保健营养' }],
    goods: [
      good(131, 'c1', '感冒灵颗粒', 15, '/images/goods/131.jpg', '缓解感冒症状', 320, 96, []),
      good(132, 'c1', '布洛芬缓释胶囊', 12, '/images/goods/132.jpg', '解热镇痛', 280, 97, []),
      good(231, 'c2', '医用外科口罩', 10, '/images/goods/231.jpg', '独立包装', 500, 98, []),
      good(232, 'c2', '酒精湿巾', 8, '/images/goods/232.jpg', '便携消毒', 360, 95, []),
      good(331, 'c3', '维生素C片', 25, '/images/goods/331.jpg', '增强免疫', 190, 94, []),
      good(133, 'c1', '连花清瘟胶囊', 16, '/images/goods/133.jpg', '清热解毒', 410, 96, []),
      good(134, 'c1', '川贝枇杷膏', 22, '/images/goods/134.jpg', '润肺止咳', 230, 95, []),
      good(233, 'c2', '医用棉签', 5, '/images/goods/233.jpg', '医用脱脂棉', 320, 96, []),
      good(234, 'c2', '防水创可贴', 6, '/images/goods/234.jpg', '防水透气', 390, 97, []),
      good(332, 'c3', '液体钙软胶囊', 32, '/images/goods/332.jpg', '补钙强骨', 180, 94, [])
    ]
  },
  {
    id: 5, name: '甜心烘焙工坊', img: '/images/shops/5.jpg',
    rating: 4.8, monthSales: 1400, deliveryFee: 4, distance: 2.1, minOrder: 18, deliveryTime: 40,
    category: 'tiandian', notice: '当日现烤，甜度刚好',
    activities: [{ label: '满18减4' }, { label: '第二件8折' }],
    coupons: [{ id: 's5c1', title: '满36减10', amount: 10, condition: 36 }],
    categories: [{ id: 'c1', name: '面包' }, { id: 'c2', name: '蛋糕' }, { id: 'c3', name: '咖啡饮品' }],
    goods: [
      good(141, 'c1', '黄金牛角包', 9, '/images/goods/141.jpg', '层层酥脆', 420, 97, [SPEC_SIZE]),
      good(142, 'c1', '肉松小面包', 11, '/images/goods/142.jpg', '咸香肉松', 360, 96, [SPEC_SIZE]),
      good(241, 'c2', '芝士蛋糕', 22, '/images/goods/241.jpg', '浓郁芝士', 280, 98, []),
      good(242, 'c2', '草莓慕斯', 26, '/images/goods/242.jpg', '酸甜轻盈', 210, 97, []),
      good(341, 'c3', '香草拿铁', 18, '/images/goods/341.jpg', '香浓顺滑', 330, 96, [SPEC_TEMP, SPEC_SUGAR]),
      good(342, 'c3', '美式咖啡', 15, '/images/goods/342.jpg', '清爽提神', 260, 95, [SPEC_TEMP, SPEC_SUGAR]),
      good(143, 'c1', '北海道牛奶吐司', 15, '/images/goods/143.jpg', '奶香松软', 330, 97, [SPEC_SIZE]),
      good(144, 'c1', '巧克力甜甜圈', 8, '/images/goods/144.jpg', '糖霜彩针', 280, 95, []),
      good(243, 'c2', '提拉米苏', 28, '/images/goods/243.jpg', '意式经典', 190, 98, []),
      good(244, 'c2', '生日蛋糕(6寸)', 68, '/images/goods/244.jpg', '鲜奶草莓', 120, 98, [SPEC_SIZE]),
      good(343, 'c3', '焦糖玛奇朵', 19, '/images/goods/343.jpg', '焦糖香气', 220, 96, [SPEC_TEMP, SPEC_SUGAR])
    ]
  }
];

/* ===================== 扩展店铺列表（用于「上滑加载更多」） =====================
   克隆基础店铺并赋予新 id / 名称后缀，模拟同品牌开在不同商圈的门店；
   每家克隆店使用独立门店照片（shops/6-15.jpg），与基础店照片区分开。 */
const shopSuffix = ['(总店)', '(分店)', '(旗舰店)', '(社区店)', '(校园店)', '(写字楼店)', '(夜市店)', '(火车站店)', '(机场店)', '(地铁店)'];

function buildAllShops() {
  const list = [];
  baseShops.forEach((s) => list.push(s));
  for (let i = 0; i < baseShops.length * 2; i++) {
    const base = baseShops[i % baseShops.length];
    const clone = JSON.parse(JSON.stringify(base));
    clone.id = 1000 + i + 1;
    clone.name = base.name.replace(/\(.*?\)/, '') + shopSuffix[i % shopSuffix.length];
    clone.img = '/images/shops/' + (baseShops.length + i + 1) + '.jpg'; // 6-15.jpg：克隆店独立照片
    clone.distance = +(base.distance + (i % 5) * 0.3).toFixed(1);
    clone.monthSales = base.monthSales + i * 37;
    clone.rating = Math.max(4.2, +(base.rating - (i % 3) * 0.1).toFixed(1));
    list.push(clone);
  }
  return list;
}
const ALL_SHOPS = buildAllShops();

// 分页获取店铺（首页下拉刷新 + 上滑加载更多）
function getShopsPage(page, pageSize) {
  const start = (page - 1) * pageSize;
  const slice = ALL_SHOPS.slice(start, start + pageSize);
  // 脱敏：列表无需返回完整商品，减小数据包
  return slice.map((s) => ({
    id: s.id, name: s.name, img: s.img, rating: s.rating, monthSales: s.monthSales,
    deliveryFee: s.deliveryFee, distance: s.distance, minOrder: s.minOrder,
    deliveryTime: s.deliveryTime, category: s.category, notice: s.notice, activities: s.activities
  }));
}
function getTotalShops() { return ALL_SHOPS.length; }

// 按 id 获取完整店铺（含商品），支持克隆店 id
function getShopById(id) {
  id = parseInt(id, 10);
  return ALL_SHOPS.find((s) => s.id === id) || null;
}

/* ===================== 初始优惠券（我的-优惠券，含未使用/已使用/过期） ===================== */
const defaultCoupons = [
  { id: 'u1', title: '满40减10', amount: 10, condition: 40, status: 'unused', expire: '2026-12-31' },
  { id: 'u2', title: '无门槛红包5元', amount: 5, condition: 0, status: 'unused', expire: '2026-11-30' },
  { id: 'u3', title: '满60减20', amount: 20, condition: 60, status: 'used', expire: '2026-10-01' },
  { id: 'u4', title: '满30减8', amount: 8, condition: 30, status: 'expired', expire: '2026-09-01' },
  { id: 'u5', title: '满88减25', amount: 25, condition: 88, status: 'unused', expire: '2027-01-15' }
];

/* ===================== 初始收货地址 ===================== */
const defaultAddresses = [
  { id: 'a1', name: '张伟', phone: '13800001111', detail: '南京市鼓楼区中山路 100 号 A 座 1203', tag: '家', isDefault: true },
  { id: 'a2', name: '张伟', phone: '13800001111', detail: '南京市建邺区江东中路 88 号 B 座 506', tag: '公司', isDefault: false }
];

/* ===================== 模拟「搜索」数据源（店铺名 + 商品名） ===================== */
function searchShops(keyword) {
  const kw = (keyword || '').trim();
  if (!kw) return [];
  return ALL_SHOPS.filter((s) => s.name.indexOf(kw) > -1 || s.category.indexOf(kw) > -1)
    .slice(0, 20)
    .map((s) => ({ id: s.id, name: s.name, img: s.img, rating: s.rating, minOrder: s.minOrder, deliveryFee: s.deliveryFee }));
}
function searchGoods(keyword) {
  const kw = (keyword || '').trim();
  if (!kw) return [];
  const res = [];
  ALL_SHOPS.forEach((s) => {
    s.goods.forEach((g) => {
      if (g.name.indexOf(kw) > -1) {
        res.push({ id: g.id, name: g.name, img: g.img, price: g.price, shopId: s.id, shopName: s.name });
      }
    });
  });
  return res.slice(0, 20);
}

module.exports = {
  cities,
  categories,
  getShopsPage,
  getTotalShops,
  getShopById,
  defaultCoupons,
  defaultAddresses,
  searchShops,
  searchGoods
};
