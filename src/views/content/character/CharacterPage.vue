<template>
  <div class="character-select-container">
    <h2>选择角色</h2>
    <div class="custom-role-bar">
      <el-input v-model="customRole" placeholder="自定义角色名" class="custom-role-input" @keyup.enter="addCustomRole" clearable />
      <el-button class="add-role-btn" type="primary" @click="addCustomRole">添加</el-button>
    </div>
    <div class="character-list">
      <div v-for="(role, idx) in roles" :key="role" :class="['character-card', {selected: selectedRole === role}]" @click="selectRole(role)">
        <el-icon class="role-icon"><User /></el-icon>
        <span>{{ role }}</span>
      </div>
    </div>
    <div v-if="selectedRole" class="selected-tip">
      当前选择角色：<b>{{ selectedRole }}</b>
    </div>
    <div v-if="selectedRole" class="confirm-btn-wrapper">
      <el-button class="confirm-btn" type="primary" @click="confirmSelect" :loading="loading">确认选择</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { get } from '@/utils/request'
import { API } from '@/api/config'

// 静态角色列表，后续可从后端获取
const roles = ref([
  '张三', '李四', '王五', '小明', '小红'
])
const selectedRole = ref('')
const customRole = ref('')
const loading = ref(false)

const selectRole = (role) => {
  selectedRole.value = role
}

const addCustomRole = () => {
  const name = customRole.value.trim()
  if (!name) {
    ElMessage.warning('请输入角色名')
    return
  }
  if (roles.value.includes(name)) {
    ElMessage.warning('该角色已存在')
    return
  }
  roles.value.unshift(name)
  selectedRole.value = name
  customRole.value = ''
}

const confirmSelect = async () => {
  if (!selectedRole.value) {
    ElMessage.warning('请先选择一个角色')
    return
  }
  loading.value = true
  try {
    const res = await get(API.SELECT_CHARACTER, { character: selectedRole.value })
    if (res.status === 200) {
      ElMessage.success('角色选择成功！')
    } else {
      ElMessage.error(res.msg || '角色选择失败')
    }
  } catch (e) {
    ElMessage.error('请求失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.character-select-container {
  padding: 32px 24px;
  max-width: 700px;
  margin: 0 auto;
}
.character-select-container h2 {
  font-size: 22px;
  margin-bottom: 18px;
  color: #222;
}
.character-list {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
}
.character-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  background: #f5f7fa;
  border-radius: 16px;
  box-shadow: 0 2px 8px 0 rgba(64,158,255,0.07);
  cursor: pointer;
  font-size: 16px;
  color: #333;
  transition: all 0.2s;
  border: 2px solid transparent;
}
.character-card.selected {
  border: 2px solid #409eff;
  background: #e3f0ff;
  color: #409eff;
}
.role-icon {
  font-size: 38px;
  margin-bottom: 10px;
}
.selected-tip {
  margin-top: 28px;
  font-size: 16px;
  color: #409eff;
}
.confirm-btn-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}
.confirm-btn {
  font-size: 20px;
  padding: 16px 60px;
  border-radius: 999px;
  font-weight: bold;
  letter-spacing: 2px;
  background: linear-gradient(90deg, #409eff 60%, #66b1ff 100%);
  box-shadow: 0 4px 16px 0 rgba(64,158,255,0.10);
  border: none;
}
.confirm-btn:active,
.confirm-btn:focus {
  outline: none;
  box-shadow: 0 2px 8px 0 rgba(64,158,255,0.15);
}
.custom-role-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 22px;
}
.custom-role-input {
  flex: 1;
  max-width: 220px;
}
.add-role-btn {
  font-size: 15px;
  border-radius: 999px;
  padding: 10px 28px;
  font-weight: bold;
}
</style> 