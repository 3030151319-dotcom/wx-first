# 项目长期记忆：美团外卖小程序 Demo

- 技术栈：原生微信小程序（wxml + wxss + js），无框架、无后端，数据用 utils/mock.js 本地模拟。
- 主色调：美团红 #FF5339；全程 rpx 自适应。
- 目录：app.* 入口/全局；pages/{index,shop,cart,order,my} 四件套；images/{shops,goods} 本地图片（店铺封面 360px / 商品缩略图 240px JPG；2026-10-16 起主包约 1.23MB，上传硬限 2MB；bigPackageSizeSupport 仅放宽预览上限到 4M，不改变上传限制）。
- 购物车通过 app.globalData.cart + wx.setStorageSync 持久化；下单写入 storage 'orders'，订单页读取。
- mock.js 数据约定：菜品 id = 店号(1-5)+分类号(1-3)+序号，如 104=1店c1类第4个；克隆店 1001-1010（同品牌不同商圈，封面用 shops/6-15.jpg，菜单继承基础店）；新增菜品须同步生成/归档图片并在 mock.js 引用。
- 真机调试：project.config.json 当前 appid=wx3b8cdea09f987a50（用户自己的 AppID）。

## 视图层约定（2026-10-15 优化）
- 主题统一用 app.wxss `page{}` 的 CSS 变量：`var(--theme)`(#FF5339)/`--theme-light`/`--theme-bg`/`--r-md`/`--shadow` 等；新增样式优先用变量，勿再硬编码 #FF5339。
- 自定义组件在 `components/`：mt-empty / shop-card / goods-card / mt-sheet，均 `styleIsolation: apply-shared`（页面/全局样式可渗入组件）；弹窗统一用 mt-sheet（slot + maskclose/close 事件）实现淡入淡出。
- 动效以纯 CSS 为主：hover-class 用全局 `.press-card`/`.btn-scale`，骨架屏 `.sk-box`(shimmer)，页面进入 `.page-enter`。
- 硬性约束：仅视图层开发，不改业务校验/订单定时器/数据持久化规则。
- 首页商家列表为「双列瀑布方形大图卡」（2026-10-15 晚用户要求从单列全宽大图改双列，原因：360px 方形源图单列全宽要放大 3.1 倍发虚；卡槽 351rpx 方形仅放大 1.5 倍且零裁切。leftCol/rightCol 按 i%2 交错分列，勿改回单列）。

## 用户偏好
- 喜欢真实风格的图片配图，明确“尽量不要用 emoji”作为商品/商家配图（emoji 仅保留品类导航、我的页等功能图标）。
