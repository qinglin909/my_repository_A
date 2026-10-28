import { createClient } from '@supabase/supabase-js';

// 从 Vercel 环境变量读取数据库地址和密钥
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(request, response) {
  // 只允许 POST 请求
  if (request.method !== 'POST') {
    return response.status(405).json({ message: '只接受 POST 请求' });
  }

  const { username, password } = request.body;

  try {
    // 去数据库里找这个用户名和密码
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !data) {
      return response.status(401).json({ message: '用户名或密码错误' });
    }

    // 登录成功，返回用户信息
    return response.status(200).json({ 
      message: '登录成功', 
      user: { id: data.id, username: data.username } 
    });
  } catch (err) {
    return response.status(500).json({ message: '服务器内部错误' });
  }
}