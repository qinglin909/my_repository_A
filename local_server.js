// ==========================================
// 7. 全网热搜代理接口
// ==========================================
app.get('/api/trends', async (req, res) => {
  const { platform } = req.query;
  // 第三方源地址映射
  const urls = {
    weibo: 'https://60s.3450934729.workers.dev/v2/weibo',
    zhihu: 'https://60s.3450934729.workers.dev/v2/zhihu',
    douyin: 'https://60s.3450934729.workers.dev/v2/douyin',
    baidu: 'https://60s.3450934729.workers.dev/v2/baidu/hot',
    toutiao: 'https://60s.3450934729.workers.dev/v2/toutiao'
  };

  if (!urls[platform]) {
    return res.status(400).json({ message: '不支持的平台' });
  }

  try {
    // Node 18 原生支持 fetch，不需要额外装包
    const response = await fetch(urls[platform]);
    if (!response.ok) throw new Error('第三方接口异常');
    
    const data = await response.json();
    res.json(data); // 把第三方数据原封不动传回给前端
  } catch (err) {
    console.error(`获取 ${platform} 热搜失败:`, err.message);
    res.status(500).json({ error: '获取热搜失败，请稍后重试' });
  }
});