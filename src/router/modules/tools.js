export default [
  { 
    path: 'navigator', 
    name: 'Navigator', 
    component: () => import('@/views/NavigatorView.vue'),
    meta: { title: '宝藏导航', requiresVip: true }
  },
  { 
    path: 'notes', 
    name: 'Notes', 
    component: () => import('@/views/NotesView.vue'),
    meta: { title: '随心笔记' }
  },
  {
    path: 'formula',
    name: 'Formula',
    component: () => import('@/views/FormulaView.vue'),
    meta: { title: '公式助手' }
  },
  {
    path: 'bills',
    name: 'Bills',
    component: () => import('@/views/BillsView.vue'),
    meta: { title: '月度收支登记' }
  },
  {
    path: 'knowledge',
    name: 'Knowledge',
    component: () => import('@/views/KnowledgeView.vue'),
    meta: { title: '知识向量库' }
  },
  // 🚨 已替换：私人媒体库 -> 微信投诉模版
  { 
    path: 'ranking', 
    name: 'Ranking', 
    component: () => import('@/views/RankingView.vue'),
    meta: { title: '成绩定位换算' }
  },   // 👈 这里补上逗号
    {
      path: 'character',
      name: 'Character',
      component: () => import('@/views/CharacterView.vue'),
      meta: { title: '繁体解字' }
  },
   {
    path: 'calendar',
    name: 'Calendar',
    component: () => import('@/views/CalendarView.vue'),  // 👈 改成 CalendarView
    meta: { title: '大明日历' }
  }
]