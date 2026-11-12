import 'dotenv/config'; // 加载环境变量
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

// 🚨 核心修复 1：信任 Vercel/Nginx 的代理，否则限流器会报错
app.set('trust proxy', 1);

// 跨域配置
app.use(cors({
  origin: [
    'https://www.solar-lunar.cloud', 
    'https://solar-lunar.cloud',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true
}));

app.use(express.json({ limit: '2mb' }));

// 环境变量检查
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('❌ 严重错误: 请在 .env 中配置至少 32 位的 JWT_SECRET');
  process.exit(1); // 直接退出，防止用空密钥跑起来
}

// ==========================================
// 1. 初始化 LowDB
// ==========================================
const dbFile = process.env.DB_FILE || path.join(__dirname, 'db.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, { users: [], products: [] });

await db.read();
db.data.users ||= [];
db.data.products ||= [];
console.log('✅ 数据库加载成功，当前用户数:', db.data.users.length);

// ==========================================
// 2. 安全限流与鉴权中间件 (彻底修复报错)
// ==========================================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // 稍微放宽一点，防止测试时被卡
  message: { message: '尝试次数过多，请稍后再试' },
  // 🚨 核心修复 2：关掉验证，让它乖乖干活不报错
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
  },
  keyGenerator: (req) => req.ip
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: '未提供登录凭证' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: '凭证无效或已过期' });
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
  
  if (!username || !password) return res.status(400).json({ message: '账号密码不能为空' });

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
    console.error('登录/注册报错:', err);
    return res.status(500).json({ message: '服务器内部错误' });
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

app.get('/api/products', async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(60, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 24));
  const query = typeof req.query.q === 'string' ? req.query.q.trim().toLocaleLowerCase() : '';

  try {
    await db.read();
    const catalog = Array.isArray(db.data.products) ? db.data.products : [];
    const filtered = query
      ? catalog.filter(product => `${product.title || ''} ${product.name || ''} ${product.description || ''} ${product.tag || ''}`.toLocaleLowerCase().includes(query))
      : catalog;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    res.json({
      items,
      page,
      pageSize,
      total: filtered.length,
      hasMore: start + items.length < filtered.length
    });
  } catch (error) {
    console.error('商品目录读取失败:', error.message);
    res.status(500).json({ message: '商品目录读取失败，请稍后重试' });
  }
});

// ==========================================
// 4.5 公式助手（Excel / Google Sheets 公式生成、解释、修复）
// ==========================================
// 大模型走 OpenAI 兼容网关，密钥只留在服务端，前端永远拿不到
const LLM_BASE = process.env.QINIU_OPENAI_BASE_URL || 'https://api.qnaigc.com/v1';
const LLM_KEY = process.env.QINIU_API_KEY || process.env['api-key'] || '';
const LLM_MODEL = process.env.QINIU_CHAT_MODEL || 'qwen/qwen3.8-flash-next';

const formulaLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: '请求过于频繁，请稍后再试' }
});

const FORMULA_TASKS = {
  generate: '用户描述想要达成的效果（可能不知道用哪个函数），请给出可直接粘贴使用的公式。',
  explain: '用户给出一个已有公式（或一段公式搭配他的目标），请逐步解释它在做什么。',
  fix: '用户给出一个报错或结果不对的公式，并描述了期望结果，请定位问题并给出修正后的公式。'
};

app.post('/api/formula', formulaLimiter, async (req, res) => {
  const { task = 'generate', input = '', target = 'Excel' } = req.body || {};
  if (!FORMULA_TASKS[task]) return res.status(400).json({ message: '未知的任务类型' });
  const text = String(input).trim();
  if (!text) return res.status(400).json({ message: '请先描述你的需求或粘贴公式' });
  if (text.length > 2000) return res.status(400).json({ message: '内容过长，请精简到 2000 字以内' });
  if (!LLM_KEY) return res.status(503).json({ message: '服务端未配置大模型密钥' });

  const systemPrompt = [
    '你是电子表格公式专家，精通 Excel、WPS 与 Google Sheets。',
    FORMULA_TASKS[task],
    `目标软件：${target}（函数名与语法请贴合该软件；三者通用时可用 IFERROR/XLOOKUP 等较新函数，但要提醒旧版本兼容性）。`,
    '回答必须是一个 JSON 对象，不要加 markdown 代码块、不要任何额外文字，格式：',
    '{"formula":"最终公式（纯文本，不带=号也行）","explanation":"分步解释，2-4 句，说明每个部分的作用","example":"一个具体使用示例，含假设的单元格与预期结果","tips":["注意事项1","注意事项2"]}',
    '若信息不足以确定公式，也要给出最合理的通用写法，并在 tips 里说明需要用户确认什么。'
  ].join('\n');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const upstream = await fetch(`${LLM_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LLM_KEY}` },
      body: JSON.stringify({
        model: LLM_MODEL,
        temperature: 0.2,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ]
      }),
      signal: controller.signal
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      console.error('公式助手上游失败:', upstream.status, detail.slice(0, 200));
      return res.status(502).json({ message: '大模型服务暂时不可用，请稍后重试' });
    }

    const payload = await upstream.json();
    const raw = payload?.choices?.[0]?.message?.content || '';
    const parsed = extractJson(raw);
    if (!parsed || !parsed.formula) {
      console.error('公式助手解析失败:', raw.slice(0, 200));
      return res.status(502).json({ message: '模型返回格式异常，请重试' });
    }

    res.json({
      ok: true,
      data: {
        formula: String(parsed.formula || '').trim(),
        explanation: String(parsed.explanation || '').trim(),
        example: String(parsed.example || '').trim(),
        tips: Array.isArray(parsed.tips) ? parsed.tips.map(String).slice(0, 4) : []
      }
    });
  } catch (error) {
    console.error('公式助手调用异常:', error.name === 'AbortError' ? '超时' : error.message);
    res.status(error.name === 'AbortError' ? 504 : 500).json({
      message: error.name === 'AbortError' ? '生成超时，请重试或简化描述' : '生成失败，请稍后重试'
    });
  } finally {
    clearTimeout(timer);
  }
});

// 从模型输出里抠出第一个完整 JSON 对象：兼容 ```json 包裹、前后多余文字
function extractJson(text) {
  const source = String(text).replace(/```(?:json)?/gi, '');
  const start = source.indexOf('{');
  const end = source.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(source.slice(start, end + 1));
  } catch {
    return null;
  }
}

// ==========================================
// 5. 健康检查 & 错误处理
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: '纯净版后端运行正常' });
});

app.use((req, res) => {
  res.status(404).json({ message: '接口不存在' });
});

// ==========================================
// 6. 启动服务器
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 生产级后端已启动: http://localhost:${PORT}`);
  console.log(`💾 数据库文件: ${dbFile}\n`);
});