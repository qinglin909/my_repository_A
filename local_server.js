import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// 1. 这里直接用一个内存对象当数据库，先跑通流程
const memoryDatabase = {
  root: '123456', // 预设一个测试账号
  admin: 'admin'
};

app.post('/api/hello', (req, res) => {
  const { username, password, isRegister } = req.body;

  try {
    if (isRegister) {
      // 注册逻辑：检查内存里有没有这个用户名
      if (memoryDatabase[username]) {
        return res.status(400).json({ message: '该用户名已被注册，请换一个' });
      }
      // 存入内存
      memoryDatabase[username] = password;
      return res.status(200).json({ message: '注册成功', user: { username } });
    } else {
      // 登录逻辑：核对用户名和密码
      if (memoryDatabase[username] && memoryDatabase[username] === password) {
        return res.status(200).json({ message: '登录成功', user: { username } });
      }
      return res.status(401).json({ message: '账号或密码错误' });
    }
  } catch (err) {
    return res.status(500).json({ message: `后端报错: ${err.message}` });
  }
});

app.listen(3000, () => {
  console.log('🚀 本地后端已启动 (纯内存模式): http://localhost:3000/api/hello');
});