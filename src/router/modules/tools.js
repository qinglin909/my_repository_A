export default [
  { 
    path: 'navigator', 
    name: 'Navigator', 
    component: () => import('@/views/NavigatorView.vue'),
    meta: { title: '宝藏导航' }
  },
  { 
    path: 'notes', 
    name: 'Notes', 
    component: () => import('@/views/NotesView.vue'),
    meta: { title: '随心笔记' }
  },
  // 🚨 已替换：私人媒体库 -> 微信投诉模版
  { 
    path: 'ranking', 
    name: 'Ranking', 
    component: () => import('@/views/RankingView.vue'),
    meta: { title: '成绩定位换算' }
  }
]