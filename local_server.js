import express from 'express';
import cors from 'cors';
import handler from './api/hello.js'; // 引入你写好的 Vercel 后端

const app = express();
app.use(cors());
app.use(express.json());

// 拦截 /api/hello 请求，交给你的 Vercel 后端处理
app.post('/api/hello', (req, res) => {
  handler(req, res);
});

app.listen(3000, () => {
  console.log('🚀 本地后端已启动: http://localhost:3000/api/hello');
});