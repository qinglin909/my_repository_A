console.log("1. 开始加载模块...");
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
console.log("2. 模块加载完毕，准备启动...");

const app = express();
app.use(cors());
app.use(express.json());
const JWT_SECRET = 'SOLAR_LUNAR_CLOUD_SECRET_2026';

// ==========================================
// 初始化 LowDB (基于 JSON 的本地数据库)
// ==========================================
const dbFile = path.join(__dirname, 'db.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, { users: [] }); // 默认数据结构

// 读取数据库并预设测试账号
await db.read();
const rootUser = db.data.users.find(u => u.username === 'root');
if (!rootUser) {
  const hash = bcrypt.hashSync('123456', 10);
  db.data.users.push({ id: Date.now(), username: 'root', passwordHash: hash });
  await db.write();
  console.log('✅ 默认测试账号已创建: root / 123456');
} else {
  console.log('✅ 数据库加载成功');
}

// ==========================================
// 限流与鉴权
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
// 登录 / 注册
// ==========================================
app.post('/api/hello', authLimiter, async (req, res) => {
  const { username, password, isRegister } = req.body;
  console.log(`📩 收到请求: ${isRegister ? '注册' : '登录'} - ${username}`);
  
  if (!username || !password) return res.status(400).json({ message: '不能为空' });

  try {
    await db.read(); // 每次请求重新读取，保证数据最新

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
// 获取用户 / 商品
// ==========================================
app.get('/api/me', authenticateToken, async (req, res) => {
  await db.read();
  const user = db.data.users.find(u => u.username === req.user.username);
  if (!user) return res.status(404).json({ message: '用户不存在' });
  res.json({ user: { username: user.username } });
});

app.get('/api/products', (req, res) => {
  res.json([{ id: 1, name: '测试商品 A', price: 99 }]);
});

// ==========================================
// 启动
// ==========================================
app.listen(3000, () => {
  console.log(`\n🚀 完整后端已启动: http://localhost:3000`);
  console.log(`💾 数据库文件: ${dbFile}\n`);
});