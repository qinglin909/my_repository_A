// sync-structure.js
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, 'src');
const outputFile = path.resolve(__dirname, 'PROJECT_MAP.md'); // 生成的文件名改叫项目地图

// 排除不需要扫描的文件夹
const ignoreDirs = ['assets', 'node_modules', '.git'];

// 提取文件里的注释
function extractComment(content) {
  const htmlComment = content.match(/<!--\s*([\s\S]*?)\s*-->/);
  if (htmlComment) return htmlComment[1].replace(/\n/g, ' ').trim();
  const blockComment = content.match(/\/\*\s*([\s\S]*?)\s*\*\//);
  if (blockComment) return blockComment[1].replace(/\n/g, ' ').trim();
  const lineComment = content.match(/\/\/\s*(.*)/);
  if (lineComment) return lineComment[1].trim();
  return '';
}

// 递归扫描目录树
function scanDir(dir, depth = 0) {
  let result = '';
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    if (ignoreDirs.includes(file)) return;

    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
    const indent = '  '.repeat(depth);

    if (stat.isDirectory()) {
      result += `${indent}📁 **${file}/**\n`;
      result += scanDir(filePath, depth + 1);
    } else {
      if (['.DS_Store', '.gitignore'].includes(file)) return;

      let comment = '';
      if (['.vue', '.js', '.ts', '.css'].includes(path.extname(file))) {
        const content = fs.readFileSync(filePath, 'utf-8');
        comment = extractComment(content);
      }

      // 给不同文件打个标签，方便一眼看懂
      let prefix = '📄';
      if (file === 'MainLayout.vue') prefix = '🖼️ [骨架]';
      if (file.endsWith('View.vue')) prefix = '🖥️ [页面]';
      if (file.endsWith('.js') && relativePath.includes('router')) prefix = '🛣️ [路由]';
      if (file.endsWith('.js') && relativePath.includes('store')) prefix = '🗄️ [状态]';
      if (file.endsWith('.js') && relativePath.includes('utils')) prefix = '🔧 [工具]';

      result += `${indent}${prefix} \`${file}\``;
      if (comment) {
        result += ` - *${comment}*`;
      }
      result += '\n';
    }
  });

  return result;
}

// 执行生成
try {
  console.log('🔍 正在扫描 src 目录...');
  const treeText = scanDir(rootDir);

  const markdownContent = `# 🗺️ My Workspace 项目地图 (Project Map)

> ⏱️ 最后同步时间：${new Date().toLocaleString()}

## 📂 目录与文件说明
*(提示：在代码文件的第一行写下 \`<!-- 你的说明 -->\` 或 \`// 你的说明\`，脚本会自动提取到此处。)*

${treeText}

---
## 💡 如何使用这份地图
**开启新的 AI 会话时：** 直接复制上面的全部内容发给 AI，并说：“这是我的项目结构，现在我要开发 [XXX] 功能”。
AI 就能立刻看懂你的代码层级和组件职责，无需你重新解释！
`;

  fs.writeFileSync(outputFile, markdownContent, 'utf-8');
  console.log('✅ 项目地图更新成功！请打开根目录下的 PROJECT_MAP.md');
} catch (err) {
  console.error('❌ 更新失败:', err);
}