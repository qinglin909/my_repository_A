import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// 如果环境变量没读到，直接报错给前端
if (!supabaseUrl || !supabaseKey) {
  console.log("环境变量缺失！");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: '只接受 POST 请求' });
  }

  const { username, password } = request.body;

  try {
    // 去数据库里查数据
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    // 如果数据库报错（比如没建表），把详细原因返回
    if (error) {
      return response.status(500).json({ message: '数据库报错: ' + error.message });
    }

    if (!data) {
      return response.status(401).json({ message: '用户名或密码错误' });
    }

    return response.status(200).json({ 
      message: '登录成功', 
      user: { id: data.id, username: data.username } 
    });
  } catch (err) {
    // 如果代码直接崩溃，把崩溃原因返回
    return response.status(500).json({ message: '代码崩溃: ' + err.message });
  }
}