import 'dotenv/config'; // 🚨 加载环境变量
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 🚨 安全加固：限制跨域来源，只允许你的正式域名和本地开发
app.use(cors({
  origin: [
    'https://www.solar-lunar.cloud', 
    'https://solar-lunar.cloud',
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod';

// ==========================================
// 1. 初始化 LowDB
// ==========================================
const dbFile = path.join(__dirname, 'db.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, { users: [] });

await db.read();
// 🚨 安全加固：已彻底删除自动生成 root/123456 弱口令账号的代码
console.log('✅ 数据库加载成功，当前用户数:', db.data.users.length);

// ==========================================
// 2. 安全限流与鉴权中间件
// ==========================================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: '尝试次数过多，请稍后再试' }
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: '未提供登录凭证' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: '凭证无效' });
    req.user = user;
    next();
  });
};

// ==========================================
// 3. 登录 / 注册接口
// ==========================================
app.post('/api/hello', authLimiter, async (req, res) => {
  const { username, password, isRegister } = req.body;
  console.log(`📩 收到请求: ${isRegister ? '注册' : '登录'} - ${username}`);
  
  if (!username || !password) return res.status(400).json({ message: '不能为空' });

  try {
    await db.read();

    if (isRegister) {
      const existingUser = db.data.users.find(u => u.username === username);
      if (existingUser) return res.status(400).json({ message: '该用户名已被注册' });

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      
      db.data.users.push({ id: Date.now(), username, passwordHash });
      await db.write();
      return res.status(200).json({ message: '注册成功' });
      
    } else {
      const user = db.data.users.find(u => u.username === username);
      if (!user) return res.status(401).json({ message: '账号或密码错误' });

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) return res.status(401).json({ message: '账号或密码错误' });

      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(200).json({ message: '登录成功', token, user: { username } });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: `后端报错: ${err.message}` });
  }
});

// ==========================================
// 4. 获取用户 / 商品
// ==========================================
app.get('/api/me', authenticateToken, async (req, res) => {
  await db.read();
  const user = db.data.users.find(u => u.username === req.user.username);
  if (!user) return res.status(404).json({ message: '用户不存在' });
  res.json({ user: { username: user.username } });
});

app.get('/api/products', (req, res) => {
  res.json([
    { id: 1, name: '测试商品 A', price: 99 },
    { id: 2, name: '测试商品 B', price: 199 }
  ]);
});

// ==========================================
// 5. 启动服务器
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 生产级后端已启动: http://localhost:${PORT}`);
  console.log(`💾 数据库文件: ${dbFile}\n`);
});