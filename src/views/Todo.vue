<script setup>
import { ref, watch, onMounted } from 'vue'

// 状态：待办列表和输入框
const todos = ref([])
const newTodo = ref('')

// 初始化：从浏览器的 localStorage 读取之前的数据
onMounted(() => {
  const saved = localStorage.getItem('my-todos')
  if (saved) {
    todos.value = JSON.parse(saved)
  }
})

// 监听 todos 的变化，每次变化自动存到 localStorage
watch(todos, (newVal) => {
  localStorage.setItem('my-todos', JSON.stringify(newVal))
}, { deep: true })

// 添加待办
const addTodo = () => {
  if (newTodo.value.trim() === '') return
  todos.value.push({
    id: Date.now(),
    text: newTodo.value,
    done: false
  })
  newTodo.value = '' // 清空输入框
}

// 删除待办
const removeTodo = (id) => {
  todos.value = todos.value.filter(t => t.id !== id)
}
</script>

<template>
  <div class="app-container">
    <h1>📝 我的全栈待办清单</h1>

    <!-- 输入框区域 -->
    <div class="input-group">
      <input
        v-model="newTodo"
        @keyup.enter="addTodo"
        type="text"
        placeholder="今天要做什么？按回车添加..."
      />
      <button @click="addTodo">添加</button>
    </div>

    <!-- 列表区域 -->
    <ul class="todo-list">
      <li v-for="todo in todos" :key="todo.id" :class="{ done: todo.done }">
        <div class="todo-content">
          <input type="checkbox" v-model="todo.done" />
          <span>{{ todo.text }}</span>
        </div>
        <button class="delete-btn" @click="removeTodo(todo.id)">删除</button>
      </li>
    </ul>

    <p v-if="todos.length === 0" class="empty-tip">暂无任务，快去添加一个吧！</p>
  </div>
</template>

<style scoped>
/* 简单的 CSS 美化 */
.app-container {
  max-width: 500px;
  margin: 50px auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #f9f9f9;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

h1 {
  text-align: center;
  color: #333;
}

.input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

input[type="text"] {
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 16px;
}

button {
  padding: 10px 15px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

button:hover {
  background: #45a049;
}

.todo-list {
  list-style: none;
  padding: 0;
}

.todo-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: white;
  margin-bottom: 8px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.todo-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 任务完成时的样式 */
.done span {
  text-decoration: line-through;
  color: #888;
}

.delete-btn {
  background: #ff4d4f;
  padding: 6px 10px;
  font-size: 14px;
}

.delete-btn:hover {
  background: #ff7875;
}

.empty-tip {
  text-align: center;
  color: #999;
}
</style>