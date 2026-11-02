// src/router/modules/trends.js
export default [
  { 
    path: 'trends', 
    name: 'Trends', 
    component: () => import('@/views/TrendsView.vue'),
    meta: { title: '全网热搜' }
  }
]