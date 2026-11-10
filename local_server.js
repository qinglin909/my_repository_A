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

// 🚨 反向代理下取真实客户端 IP：只信任紧挨着的一层代理（Nginx / Vercel），
// 否则 express-rate-limit 会把所有请求都按代理 IP 限流，并抛 X-Forwarded-For 校验错误。
// 不要设成 true —— 那会信任客户端伪造的 X-Forwarded-For，限流可被绕过。
app.set('trust proxy', 1);

// 🚨 安全加固：限制跨域来源，只允许你的正式域名和本地开发
app.use(cors({
  origin: [
    'https://www.solar-lunar.cloud', 
    'https://solar-lunar.cloud',
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json({ limit: '600kb' }));

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set to a random secret with at least 32 characters.');
}

// ==========================================
// 1. 初始化 LowDB
// ==========================================
const dbFile = process.env.DB_FILE || path.join(__dirname, 'db.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, { users: [] });

await db.read();
db.data.users ||= [];
db.data.products ||= [];
db.data.knowledgeDocs ||= [];

// ==========================================
// 会员（VIP）判定与 root 永久会员
// ==========================================
const isVipActive = (user) => {
  if (!user) return false;
  if (user.vip === true) return true;
  const expiresAt = user.vipExpiresAt ? Date.parse(user.vipExpiresAt) : NaN;
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
};

// root 是站点所有者账号：启动时补成永久 VIP（幂等，不会重复写库）
const rootUser = db.data.users.find(item => item.username === 'root');
if (rootUser && (rootUser.vip !== true || rootUser.vipExpiresAt !== null)) {
  rootUser.vip = true;
  rootUser.vipExpiresAt = null;
  await db.write();
  console.log('✅ root 账号已标记为永久 VIP');
}
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

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'AI 请求次数过多，请稍后再试' }
});

const knowledgeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { message: '知识库操作过于频繁，请稍后再试' }
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
// 3. AI 笔记分析接口
// ==========================================
app.post('/api/ai/notes', aiLimiter, authenticateToken, async (req, res) => {
  const apiKey = process.env.ZHIPU_API_KEY;
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';

  if (!apiKey) {
    return res.status(503).json({ message: 'AI 服务尚未配置，请在后端环境中设置 ZHIPU_API_KEY' });
  }
  if (!text) return res.status(400).json({ message: '请先输入要分析的笔记内容' });
  if (text.length > 30000) return res.status(413).json({ message: '笔记内容过长，请控制在 30000 字符以内' });

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [
          {
            role: 'system',
            content: '你是专业的文档分析助手。请阅读用户文章，严格按 JSON 返回，不要额外文字：{"summary":"一句话总结","flowChart":"Mermaid graph TD 流程图","sequenceChart":"Mermaid sequenceDiagram 时序图；无交互时画整体流程"}。Mermaid 语法必须规范。'
          },
          { role: 'user', content: text }
        ]
      }),
      signal: AbortSignal.timeout(30000)
    });

    const payload = await response.json();
    if (!response.ok) {
      return res.status(response.status === 401 ? 502 : response.status).json({
        message: payload.error?.message || 'AI 服务请求失败'
      });
    }
    return res.json(payload);
  } catch (error) {
    console.error('AI 笔记分析失败:', error.message);
    return res.status(502).json({ message: 'AI 服务暂时无法访问，请稍后重试' });
  }
});

// ==========================================
// 4. 登录 / 注册接口
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
      
      db.data.users.push({ id: Date.now(), username, passwordHash, vip: false, vipExpiresAt: null });
      await db.write();
      return res.status(200).json({ message: '注册成功' });
      
    } else {
      const user = db.data.users.find(u => u.username === username);
      if (!user) return res.status(401).json({ message: '账号或密码错误' });

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) return res.status(401).json({ message: '账号或密码错误' });

      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(200).json({
        message: '登录成功',
        token,
        user: {
          username,
          role: username === 'admin' ? 'admin' : 'user',
          vip: isVipActive(user),
          vipExpiresAt: user.vipExpiresAt || null
        }
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: `后端报错: ${err.message}` });
  }
});

// ==========================================
// 4. 账号安全设置
// ==========================================
app.post('/api/account/change-password', authLimiter, authenticateToken, async (req, res) => {
  const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
  const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

  if (!currentPassword || !newPassword) return res.status(400).json({ message: '请填写当前密码和新密码' });
  if (newPassword.length < 8 || newPassword.length > 128) return res.status(400).json({ message: '新密码长度需为 8 至 128 个字符' });
  if (currentPassword === newPassword) return res.status(400).json({ message: '新密码不能与当前密码相同' });

  try {
    await db.read();
    const user = db.data.users.find(item => String(item.id) === String(req.user.userId));
    if (!user) return res.status(404).json({ message: '用户不存在' });

    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) return res.status(401).json({ message: '当前密码不正确' });

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await db.write();
    return res.json({ message: '密码已更新，请使用新密码重新登录' });
  } catch (error) {
    console.error('修改密码失败:', error.message);
    return res.status(500).json({ message: '密码更新失败，请稍后重试' });
  }
});

// ==========================================
// 5. 获取用户 / 商品
// ==========================================
app.get('/api/me', authenticateToken, async (req, res) => {
  await db.read();
  const user = db.data.users.find(u => u.username === req.user.username);
  if (!user) return res.status(404).json({ message: '用户不存在' });
  res.json({
    user: {
      username: user.username,
      role: user.username === 'admin' ? 'admin' : 'user',
      vip: isVipActive(user),
      vipExpiresAt: user.vipExpiresAt || null
    }
  });
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
// 5. 本地知识向量库
// ==========================================
const tokenizeKnowledge = (text) => {
  const normalized = String(text || '').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  if (!normalized) return [];

  const tokens = normalized.split(/\s+/).filter(Boolean);
  for (const segment of normalized.split(/\s+/)) {
    if ([...segment].length <= 2) continue;
    const chars = [...segment];
    for (let i = 0; i < chars.length - 1; i++) tokens.push(chars.slice(i, i + 2).join(''));
  }
  return tokens;
};

const embedKnowledge = (text) => {
  const vector = new Map();
  for (const token of tokenizeKnowledge(text)) {
    vector.set(token, (vector.get(token) || 0) + 1);
  }
  const magnitude = Math.sqrt([...vector.values()].reduce((sum, value) => sum + value * value, 0)) || 1;
  return Object.fromEntries([...vector].map(([token, value]) => [token, value / magnitude]));
};

const chunkKnowledgeText = (text, maxChars = 700, overlap = 100) => {
  const cleanText = String(text || '').replace(/\r/g, '').trim();
  const chunks = [];
  let start = 0;
  while (start < cleanText.length) {
    let end = Math.min(start + maxChars, cleanText.length);
    if (end < cleanText.length) {
      const boundary = Math.max(
        cleanText.lastIndexOf('。', end),
        cleanText.lastIndexOf('！', end),
        cleanText.lastIndexOf('？', end),
        cleanText.lastIndexOf('\n', end)
      );
      if (boundary > start + Math.floor(maxChars * 0.55)) end = boundary + 1;
    }
    const chunk = cleanText.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= cleanText.length) break;
    start = Math.max(start + 1, end - overlap);
  }
  return chunks;
};

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || '';
const DASHSCOPE_WORKSPACE_ID = process.env.DASHSCOPE_WORKSPACE_ID || '';
const DASHSCOPE_BASE_URL = (process.env.DASHSCOPE_BASE_URL || (DASHSCOPE_WORKSPACE_ID
  ? `https://${DASHSCOPE_WORKSPACE_ID}.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`
  : '')).replace(/\/$/, '');
const EMBEDDING_MODEL = process.env.DASHSCOPE_EMBEDDING_MODEL || 'qwen3.7-text-embedding';
const QINIU_API_KEY = process.env.QINIU_API_KEY || process.env['api-key'] || '';
const QINIU_BASE_URL = (process.env.QINIU_OPENAI_BASE_URL || 'https://api.qnaigc.com/v1').replace(/\/$/, '');
const QINIU_CHAT_MODEL = process.env.QINIU_CHAT_MODEL || 'qwen/qwen3.8-flash-next';
const usesRemoteEmbeddings = Boolean(DASHSCOPE_API_KEY && DASHSCOPE_BASE_URL);

const requestEmbeddings = async (texts) => {
  if (!DASHSCOPE_API_KEY) {
    const error = new Error('知识库使用 qwen3.7-text-embedding；请配置专用 DASHSCOPE_API_KEY，不能用七牛云 api-key 代替。');
    error.status = 503;
    throw error;
  }
  if (!DASHSCOPE_BASE_URL) {
    const error = new Error('请配置 DASHSCOPE_WORKSPACE_ID，或提供 DASHSCOPE_BASE_URL（北京地域兼容接口地址）');
    error.status = 503;
    throw error;
  }

  const vectors = [];
  for (let start = 0; start < texts.length; start += 16) {
    const batch = texts.slice(start, start + 16);
    const response = await fetch(`${DASHSCOPE_BASE_URL}/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DASHSCOPE_API_KEY}` },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: batch }),
      signal: AbortSignal.timeout(30000)
    });
    const payload = await response.json();
    if (!response.ok) {
      const error = new Error(payload.error?.message || payload.message || `Embedding 服务请求失败 (${response.status})`);
      error.status = response.status === 401 ? 502 : response.status;
      throw error;
    }

    const items = Array.isArray(payload.data) ? payload.data : [];
    if (items.length !== batch.length || items.some(item => !Array.isArray(item.embedding) || !item.embedding.length)) {
      throw new Error('DashScope Embedding 返回格式异常；预期 OpenAI 兼容的 data[].embedding 数组');
    }
    const ordered = [...items].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    vectors.push(...ordered.map(item => item.embedding.map(Number)));
  }
  return vectors;
};

const cosineSimilarity = (left, right) => {
  if (Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.length) {
    let dot = 0;
    let leftNorm = 0;
    let rightNorm = 0;
    for (let i = 0; i < left.length; i++) {
      dot += left[i] * right[i];
      leftNorm += left[i] * left[i];
      rightNorm += right[i] * right[i];
    }
    const denominator = Math.sqrt(leftNorm * rightNorm);
    return denominator ? dot / denominator : 0;
  }

  if (left && right && !Array.isArray(left) && !Array.isArray(right)) {
    let dot = 0;
    let leftNorm = 0;
    let rightNorm = 0;
    for (const [token, weight] of Object.entries(left)) {
      dot += weight * (right[token] || 0);
      leftNorm += weight * weight;
    }
    for (const weight of Object.values(right)) rightNorm += weight * weight;
    const denominator = Math.sqrt(leftNorm * rightNorm);
    return denominator ? dot / denominator : 0;
  }
  return 0;
};

const answerFromKnowledge = async (query, matches) => {
  if (!matches.length) return { answer: '当前知识库没有检索到相关资料，请先添加文档或换个问法。', model: QINIU_CHAT_MODEL };
  if (!QINIU_API_KEY) {
    const error = new Error('检索到资料，但缺少 Qwen 回答模型 API Key；请在后端 .env 设置 api-key');
    error.status = 503;
    throw error;
  }

  const context = matches.map((item, index) => `[资料${index + 1}] ${item.title}（片段 ${item.chunkIndex + 1}）\\n${item.text}`).join('\\n\\n');
  const response = await fetch(`${QINIU_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${QINIU_API_KEY}` },
    body: JSON.stringify({
      model: QINIU_CHAT_MODEL,
      temperature: 0.2,
      messages: [
        { role: 'system', content: '你是个人知识库助手。只根据给定资料回答；资料不足时明确说资料里没有，不要编造。回答后在相关句子末尾标注来源编号，如 [资料1]。请用简体中文，先给简明结论。' },
        { role: 'user', content: `问题：${query}\\n\\n检索资料：\\n${context}` }
      ]
    }),
    signal: AbortSignal.timeout(45000)
  });
  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload.error?.message || payload.message || `Qwen 请求失败 (${response.status})`);
    error.status = response.status === 401 ? 502 : response.status;
    throw error;
  }
  const answer = payload.choices?.[0]?.message?.content;
  if (typeof answer !== 'string' || !answer.trim()) throw new Error('Qwen 返回内容为空或格式异常');
  return { answer: answer.trim(), model: QINIU_CHAT_MODEL };
};

app.get('/api/knowledge/docs', authenticateToken, knowledgeLimiter, async (req, res) => {
  try {
    await db.read();
    const docs = (db.data.knowledgeDocs || [])
      .filter(doc => String(doc.userId) === String(req.user.userId))
      .map(({ id, title, createdAt, updatedAt, chunks }) => ({ id, title, createdAt, updatedAt, chunkCount: chunks?.length || 0 }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
    res.json({ docs, embeddingModel: usesRemoteEmbeddings ? EMBEDDING_MODEL : 'local-char-bigram-v1', answerModel: QINIU_CHAT_MODEL, remoteEmbeddings: usesRemoteEmbeddings });
  } catch (error) {
    console.error('知识库列表读取失败:', error.message);
    res.status(500).json({ message: '知识库读取失败' });
  }
});

app.post('/api/knowledge/docs', authenticateToken, knowledgeLimiter, async (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim().slice(0, 160) : '';
  const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
  if (!title) return res.status(400).json({ message: '请填写文档标题' });
  if (!content) return res.status(400).json({ message: '请填写文档内容' });
  if (content.length > 500000) return res.status(413).json({ message: '单篇内容不能超过 500000 字符' });

  const pieces = chunkKnowledgeText(content);
  if (!pieces.length) return res.status(400).json({ message: '文档没有可索引的文本' });

  try {
    const vectors = await requestEmbeddings(pieces);
    await db.read();
    db.data.knowledgeDocs ||= [];
    const now = new Date().toISOString();
    const doc = {
      id: `kdoc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId: req.user.userId,
      title,
      createdAt: now,
      updatedAt: now,
      embeddingModel: usesRemoteEmbeddings ? EMBEDDING_MODEL : 'local-char-bigram-v1',
      chunks: pieces.map((text, index) => ({ id: `${index + 1}`, index, text, vector: vectors[index] }))
    };
    db.data.knowledgeDocs.unshift(doc);
    await db.write();
    res.status(201).json({ doc: { id: doc.id, title: doc.title, createdAt: now, updatedAt: now, chunkCount: doc.chunks.length, embeddingModel: doc.embeddingModel } });
  } catch (error) {
    console.error('知识文档写入失败:', error.message);
    res.status(error.status || 502).json({ message: error.message || '知识文档保存失败' });
  }
});

app.delete('/api/knowledge/docs/:id', authenticateToken, knowledgeLimiter, async (req, res) => {
  try {
    await db.read();
    const before = db.data.knowledgeDocs?.length || 0;
    db.data.knowledgeDocs = (db.data.knowledgeDocs || []).filter(doc =>
      !(doc.id === req.params.id && String(doc.userId) === String(req.user.userId))
    );
    if (db.data.knowledgeDocs.length === before) return res.status(404).json({ message: '找不到该知识文档' });
    await db.write();
    res.json({ success: true });
  } catch (error) {
    console.error('知识文档删除失败:', error.message);
    res.status(500).json({ message: '知识文档删除失败' });
  }
});

app.post('/api/knowledge/search', authenticateToken, knowledgeLimiter, async (req, res) => {
  const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
  const limit = Math.min(10, Math.max(1, Number.parseInt(req.body?.limit, 10) || 5));
  if (!query) return res.status(400).json({ message: '请输入检索问题或关键词' });
  if (query.length > 1000) return res.status(400).json({ message: '检索内容不能超过 1000 字符' });

  try {
    const [queryVector] = await requestEmbeddings([query]);
    await db.read();
    const matches = (db.data.knowledgeDocs || [])
      .filter(doc => String(doc.userId) === String(req.user.userId))
      .flatMap(doc => (doc.chunks || []).map(chunk => ({
        documentId: doc.id,
        title: doc.title,
        chunkIndex: chunk.index,
        text: chunk.text,
        score: cosineSimilarity(queryVector, chunk.vector)
      })))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => ({ ...item, score: Number(item.score.toFixed(4)) }));
    const generated = await answerFromKnowledge(query, matches);
    res.json({ query, model: usesRemoteEmbeddings ? EMBEDDING_MODEL : 'local-char-bigram-v1', answerModel: generated.model, answer: generated.answer, results: matches });
  } catch (error) {
    console.error('知识库检索失败:', error.message);
    res.status(error.status || 502).json({ message: error.message || '知识检索失败' });
  }
});

app.post('/api/knowledge/reindex', authenticateToken, knowledgeLimiter, async (req, res) => {
  try {
    await db.read();
    const ownedDocs = (db.data.knowledgeDocs || []).filter(doc => String(doc.userId) === String(req.user.userId));
    const flatChunks = ownedDocs.flatMap(doc => (doc.chunks || []).map(chunk => ({ doc, chunk })));
    if (!flatChunks.length) return res.json({ reindexed: 0, model: usesRemoteEmbeddings ? EMBEDDING_MODEL : 'local-char-bigram-v1' });

    const vectors = await requestEmbeddings(flatChunks.map(item => item.chunk.text));
    flatChunks.forEach((item, index) => {
      item.chunk.vector = vectors[index];
      item.doc.embeddingModel = usesRemoteEmbeddings ? EMBEDDING_MODEL : 'local-char-bigram-v1';
    });
    await db.write();
    res.json({ reindexed: flatChunks.length, model: usesRemoteEmbeddings ? EMBEDDING_MODEL : 'local-char-bigram-v1', remoteEmbeddings: usesRemoteEmbeddings });
  } catch (error) {
    console.error('知识向量重建失败:', error.message);
    res.status(error.status || 502).json({ message: error.message || '知识向量重建失败' });
  }
});

// ==========================================
// 6. 启动服务器
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 生产级后端已启动: http://localhost:${PORT}`);
  console.log(`💾 数据库文件: ${dbFile}\n`);
});