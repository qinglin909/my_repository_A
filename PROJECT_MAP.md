# 🗺️ My Workspace 项目地图 (Project Map)

> ⏱️ 最后同步时间：2026/11/11 16:54:50

## 📂 目录与文件说明
*(提示：在代码文件的第一行写下 `<!-- 你的说明 -->` 或 `// 你的说明`，脚本会自动提取到此处。)*

📄 `App.vue`
📁 **components/**
  📄 `CharacterExplainer.vue` - *搜索区*
  📄 `HelloWorld.vue` - *vite.dev/" target="_blank">*
  📄 `HeTuLuoShu.vue` - *================= 河图 =================*
  📄 `ImageUploader.vue` - *src/components/ImageUploader.vue*
  📁 **ScoreConverter/**
    📄 `BasisCard.vue` - *换算依据表：三条线差与相邻区间的每分分差*
    📄 `BatchConvertCard.vue` - *成绩表上传、批量换算结果表与导出*
    📁 **charts/**
      📄 `chartUtils.js` - *图表通用坐标、刻度与路径工具（纯函数，供 ScoreConverter/charts 下各图共用）*
      📄 `ConversionCurveChart.vue` - *换算曲线：原始分 → 换算分，叠加 y=x 基准、批次锚点、985/211 参考线与当前分数标记*
      📄 `RankCurveChart.vue` - *位次曲线：当前科类一分一段表的「分数 → 累计位次」关系，并标注当前换算分*
      📄 `ScoreDistributionChart.vue` - *成绩分布：批量换算结果按 10 分一档堆叠，颜色区分 985 / 211 / 其他层次*
    📁 **composables/**
      📄 `useExport.js` - *导出 Excel：汇总、换算依据、按班级分表*
      📄 `useManualConvert.js` - *单个分数换算：结果、计算过程、排位与层次*
      📄 `useRankTable.js` - *一分一段表：导入、预览、清除与本机持久化；表变化后通过回调通知重算成绩*
      📄 `useScoreRules.js` - *分数线规则：当前科类规则、线差、分段与换算依据表，以及规则自身的持久化*
      📄 `useStudents.js` - *成绩表解析与批量换算：状态依赖全部通过参数传入，避免反向 import 其他 composable*
      📄 `useTopAnchors.js` - *高分段校准与 985/211 参考线，及其自身的持久化*
    📄 `constants.js` - *成绩换算工作台：本地存储 key、provide key 与静态表单配置*
    📄 `helpers.js` - *与状态无关的纯函数*
    📄 `index.vue` - *分数换算工作台：只负责布局与组合，状态由 composables 提供并经 provide 下发*
    📄 `LineFieldset.vue` - *单条批次线：学校预估线 / 省控线 / 线差*
    📄 `ManualConvertCard.vue` - *单个分数换算与结果展示*
    📄 `MethodNoteCard.vue` - *换算方法说明（纯静态）*
    📄 `NumberField.vue` - *带文案的数字输入框（高分段校准、985/211 参考线共用）*
    📄 `RankTableCard.vue` - *一分一段表导入与预览*
    📄 `RuleSettingsCard.vue` - *分数线设置 + 高分段校准 + 985/211 参考线*
    📄 `ScoreChartCard.vue` - *可视化图表卡片：三个视图共用同一份 ctx，切换只换图表组件*
    📄 `scoreConverter.css` - *分区导航：一屏一个分区，免长滚动*
    📄 `StatItem.vue` - *换算结果格里的一格：标签 + 数值*
    🗄️ [状态] `store.js` - *模块级单例状态：工作台各卡片通过 inject 共享同一份响应式数据*
  📄 `VipPlanCard.vue` - *目前项目还没有支付/下单接口，这里只做选择确认，避免误导用户已完成付款。*
📁 **data/**
  📄 `charDictionary.js` - ** 未收录的字：返回与两个旧组件完全一致的兜底条目*
  📄 `vipPlans.js` - *会员账号（VIP）套餐档位。*
📁 **layouts/**
  🖼️ [骨架] `MainLayout.vue` - *全局导航框架：包含顶部悬浮导航栏和用户下拉菜单*
📄 `main.js` - *引入 Pinia 及持久化插件*
📁 **router/**
  🛣️ [路由] `index.js` - *🚨 引入刚才写的模块路由*
  📁 **modules/**
    🛣️ [路由] `tools.js` - *🚨 已替换：私人媒体库 -> 微信投诉模版*
    🛣️ [路由] `trends.js` - *src/router/modules/trends.js*
    🛣️ [路由] `user.js` - *src/router/modules/user.js*
📁 **stores/**
  🗄️ [状态] `product.js`
  🗄️ [状态] `user.js` - *user 或 admin*
📄 `style.css` - *=========================================    1. 全局 CSS 变量 (设计令牌)    =========================================*
📁 **utils/**
  🔧 [工具] `apiClient.js` - **  * @param {string} url  * @param {object}  options  * @param {string}  [options.method='GET']  * @param {*}       [options.body]        对象会自动 JSON.stringify 并补 Content-Type；字符串原样发送  * @param {object}  [options.headers]  * @param {string}  [options.token]       传入才设置 Authorization；不传则完全不带（外部域名必须不传）  * @param {AbortSignal} [options.signal]  * @param {string}  [options.networkErrorMessage]  * @returns {Promise<Response>}*
  🔧 [工具] `calcConfig.js`
  🔧 [工具] `calcLogic.js` - *🎯 精准查表*
  🔧 [工具] `date.js` - ** YYYY-MM-DD，用作日期键 / 接口参数（日历页）*
  🔧 [工具] `format.js` - ** 分 → ¥元，两位小数；非法值显示破折号*
  🔧 [工具] `scoreConvert.js` - **  * 把原始分换算成参考分（按交接文档的口径）。  * - 原始分先向下取整（ROUNDDOWN），再取该分数的分差  * - 特控线以上：特控线线差；若设置了「最高分校准」，在特控线与本次最高分之间线性过渡  * - 两条线之间：线差线性过渡  * - 专科线以下：不做换算（保持原始分）  * @returns {{score:number, converted:number, rounded:number, diff:number, segment:string}|null}*
  🔧 [工具] `storage.js` - ** 读取原始字符串；不存在或不可用时返回 null*
  🔧 [工具] `supabase.js` - *src/utils/supabase.js*
📁 **views/**
  🖥️ [页面] `AdminView.vue`
  🖥️ [页面] `CalendarView.vue` - *悬浮触发器容器*
  🖥️ [页面] `CharacterView.vue` - *搜索区*
  🖥️ [页面] `HomeView.vue` - *非 VIP 用户看不到会员专属入口*
  🖥️ [页面] `KnowledgeView.vue` - *占位页面：知识库功能尚未接入前端，先保证路由与构建可用*
  🖥️ [页面] `LoginView.vue` - *================= 左侧：表单区 =================*
  🖥️ [页面] `NavigatorView.vue` - *宝藏导航 + 秘密管理箱*
  🖥️ [页面] `NotesView.vue` - *左侧：笔记列表*
  🖥️ [页面] `ProductsView.vue` - *s.taobao.com/search?q=${encodeURIComponent(keyword.value.trim())}`*
  🖥️ [页面] `ProfileView.vue` - *个人中心：包含头像裁剪上传和配置菜单*
  🖥️ [页面] `RankingView.vue` - *路由入口：保留原视图文件，实际界面已迁至 components/ScoreConverter*
  🖥️ [页面] `TrendsView.vue` - *全网热搜聚合：直连 Cloudflare Worker，极致丝滑防抖版*


---
## 💡 如何使用这份地图
**开启新的 AI 会话时：** 直接复制上面的全部内容发给 AI，并说：“这是我的项目结构，现在我要开发 [XXX] 功能”。
AI 就能立刻看懂你的代码层级和组件职责，无需你重新解释！
