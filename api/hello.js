import { createClient } from '@supabase/supabase-js';

export default async function handler(request, response) {
  // 1. 只允许 POST 请求
  if (request.method !== 'POST') {
    return response.status(405).json({ message: '只接受 POST 请求' });
  }

  const { username, password, isRegister } = request.body;

  // 2. 检查环境变量是否配置
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response.status(500).json({ 
      message: '服务器配置错误：Vercel 缺少 SUPABASE_URL 或 SUPABASE_KEY 环境变量' 
    });
  }

  try {
    // 3. 初始化 Supabase 客户端
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ==========================================
    // 注册逻辑
    // ==========================================
    if (isRegister) {
      // 检查用户名是否已存在
      const { data: existUser, error: checkError } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .maybeSingle(); // 用 maybeSingle 避免没查到数据时报错

      if (checkError) {
        return response.status(500).json({ message: '检查用户失败: ' + checkError.message });
      }

      if (existUser) {
        return response.status(400).json({ message: '该用户名已被注册，请换一个' });
      }

      // 插入新用户
      const { error: insertError } = await supabase
        .from('users')
        .insert([{ username, password }]);

      if (insertError) {
        return response.status(500).json({ message: '注册失败: ' + insertError.message });
      }

      return response.status(200).json({ message: '注册成功' });
    }

    // ==========================================
    // 登录逻辑
    // ==========================================
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .maybeSingle();

    if (error) {
      return response.status(500).json({ message: '数据库查询失败: ' + error.message });
    }

    // 如果没查到数据，说明账号或密码错误
    if (!data) {
      return response.status(401).json({ message: '账号或密码错误' });
    }

    // 登录成功，返回用户信息
    return response.status(200).json({ 
      message: '登录成功', 
      user: { id: data.id, username: data.username } 
    });

  } catch (err) {
    // 捕捉所有未知崩溃
    return response.status(500).json({ message: '服务器崩溃: ' + err.message });
  }
}