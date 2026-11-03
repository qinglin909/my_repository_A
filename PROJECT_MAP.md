# 🗺️ My Workspace 项目地图 (Project Map)

> ⏱️ 最后同步时间：2026/11/3 08:54:55

## 📂 目录与文件说明
*(提示：在代码文件的第一行写下 `<!-- 你的说明 -->` 或 `// 你的说明`，脚本会自动提取到此处。)*

📄 `App.vue`
📁 **components/**
  📄 `HelloWorld.vue` - *vite.dev/" target="_blank">*
  📄 `ImageUploader.vue` - *src/components/ImageUploader.vue*
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
  🔧 [工具] `supabase.js` - *src/utils/supabase.js*
📁 **views/**
  🖥️ [页面] `AdminView.vue`
  🖥️ [页面] `HomeView.vue` - *首页工作台：包含数据面板和快捷入口*
  🖥️ [页面] `LoginView.vue` - *================= 左侧：表单区 =================*
  🖥️ [页面] `NavigatorView.vue` - *宝藏导航 + 秘密管理箱*
  🖥️ [页面] `NotesView.vue` - *左侧：笔记列表*
  🖥️ [页面] `ProductsView.vue` - *原生滚动容器*
  🖥️ [页面] `ProfileView.vue` - *个人中心：包含头像裁剪上传和配置菜单*
  🖥️ [页面] `RankingView.vue` - *输入区*
  🖥️ [页面] `TrendsView.vue` - *全网热搜聚合：接入专属 Cloudflare Worker，极致丝滑防抖版*


---
## 💡 如何使用这份地图
**开启新的 AI 会话时：** 直接复制上面的全部内容发给 AI，并说：“这是我的项目结构，现在我要开发 [XXX] 功能”。
AI 就能立刻看懂你的代码层级和组件职责，无需你重新解释！
