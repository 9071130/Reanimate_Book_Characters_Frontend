<template>
  <div class="novel-page-root">
    <!-- 步骤条 -->
    <div class="stepper-bar">
      <div class="stepper-item" :class="{active: uploadProgress === 100}">
        <span class="stepper-index">1</span> {{ lang === 'zh' ? '上传小说' : 'Upload Novel' }}
        <span v-if="uploadProgress !== 100" class="stepper-dot"></span>
      </div>
      <div class="stepper-line"></div>
      <div class="stepper-item" :class="{active: selectedRole}">
        <span class="stepper-index">2</span> {{ lang === 'zh' ? '角色选择' : 'Character Selection' }}
        <span v-if="!selectedRole" class="stepper-dot"></span>
      </div>
      <div class="stepper-line"></div>
      <div class="stepper-item" :class="{active: secretKey}">
        <span class="stepper-index">3</span> {{ lang === 'zh' ? '数据集制作' : 'Dataset Creation' }}
        <span v-if="!secretKey" class="stepper-dot"></span>
      </div>
    </div>
    <div class="novel-page-flex">
      <!-- 顶部三卡片横排 -->
      <div class="novel-steps-row">
        <!-- 第一步：上传小说 -->
        <div class="step-card small-card">
          <div class="step-title">{{ lang === 'zh' ? '第一步：上传小说' : 'Step 1: Upload Novel' }}</div>
          <div class="upload-header">
            <h2 class="center-title">{{ lang === 'zh' ? '上传小说' : 'Upload Novel' }}</h2>
            <p class="description">{{ lang === 'zh' ? '支持上传txt格式的小说文件' : 'Support uploading txt format novel files' }}</p>
          </div>
          <div class="novel-name-bar">
            <el-input v-model="novelName" :placeholder="lang === 'zh' ? '请输入小说名' : 'Please enter novel name'" class="novel-name-input" clearable />
          </div>
          <div class="upload-area"
               @drop.prevent="handleDrop"
               @dragover.prevent
               @dragenter.prevent
               :class="{ 'is-dragover': isDragover }">
            <el-upload
                class="upload-component"
                drag
                action="#"
                :auto-upload="false"
                :on-change="handleFileChange"
                :show-file-list="false"
                accept=".txt">
              <div class="upload-center-trigger">
                <el-icon class="el-icon--upload upload-animate"><Upload /></el-icon>
                <div class="el-upload__text upload-tip-text">{{ lang === 'zh' ? '拖拽或点击上传txt文件' : 'Drag or click to upload txt file' }}</div>
              </div>
            </el-upload>
          </div>
          <div v-if="uploadedFile" class="file-info">
            <div class="file-name">
              <el-icon><Document /></el-icon>
              <span>{{ uploadedFile.name }}</span>
            </div>
            <div class="file-size">
              {{ lang === 'zh' ? '大小：' : 'Size: ' }}{{ formatFileSize(uploadedFile.size) }}
            </div>
            <div class="upload-actions">
              <el-button type="primary" @click="uploadFile" :loading="uploading">
                <el-icon><Upload /></el-icon> {{ lang === 'zh' ? '开始上传' : 'Start Upload' }}
              </el-button>
              <el-button @click="removeFile">{{ lang === 'zh' ? '移除文件' : 'Remove File' }}</el-button>
            </div>
          </div>
          <div v-if="uploadProgress > 0 && uploadProgress < 100" class="upload-progress">
            <el-progress :percentage="uploadProgress" :format="progressFormat" :stroke-width="18" status="active" />
          </div>
        </div>

        <!-- 第二步：角色选择 -->
        <div class="step-card small-card">
          <div class="step-title">{{ lang === 'zh' ? '第二步：角色选择' : 'Step 2: Character Selection' }}</div>
          <div class="character-select-container" :class="{ 'disabled-area': uploadProgress !== 100 }">
            <h2 class="center-title">{{ lang === 'zh' ? '输入角色' : 'Input Character' }}</h2>
            <div class="custom-role-bar">
              <el-input v-model="customRole" :placeholder="lang === 'zh' ? '请输入角色名' : 'Please enter character name'" class="custom-role-input" @keyup.enter="confirmSelect" clearable :disabled="uploadProgress !== 100" />
              <div class="custom-role-btn-bar">
                <el-button class="add-role-btn" type="primary" @click="confirmSelect" :disabled="uploadProgress !== 100">
                  <el-icon><User /></el-icon> {{ lang === 'zh' ? '确认选择' : 'Confirm' }}
                </el-button>
              </div>
            </div>
            <div v-if="selectedRole" class="selected-tip">
              {{ lang === 'zh' ? '当前选择角色：' : 'Current Character: ' }}<b>{{ selectedRole }}</b>
            </div>
            <div v-if="uploadProgress !== 100" class="step-tip">{{ lang === 'zh' ? '请先完成第一步上传小说' : 'Please complete Step 1: Upload Novel first' }}</div>
          </div>
        </div>

        <!-- 第三步：输入密钥并开始制作数据集 -->
        <div class="step-card small-card">
          <div class="step-title">{{ lang === 'zh' ? '第三步：输入DeepSeek API' : 'Step 3: Enter DeepSeek API Key and Start Dataset Creation' }}</div>
          <div class="train-section" :class="{ 'disabled-area': !selectedRole }">
            <div class="train-form-bar">
              <el-input v-model="secretKey" :placeholder="lang === 'zh' ? '请输入DeepSeek API密钥' : 'Please enter DeepSeek API key'" class="secret-key-input" clearable :disabled="!selectedRole" />
              <div class="train-btn-bar">
                <el-button class="train-btn" type="primary" @click="startTrain" :loading="trainLoading" :disabled="!selectedRole || !secretKey">
                  <el-icon><Upload /></el-icon> {{ lang === 'zh' ? '开始制作数据集' : 'Start' }}
                </el-button>
              </div>
              <div v-if="!selectedRole" class="step-tip">{{ lang === 'zh' ? '请先完成第二步角色选择' : 'Please complete Step 2: Character Selection first' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 任务区横排 -->
      <div class="novel-tasks-row">
        <div class="task-card task-card-merged">
          <div class="task-title">{{ lang === 'zh' ? '任务列表与进度' : 'Task List & Progress' }}</div>
          <div class="task-progress-list">
            <div v-for="task in taskList" :key="task.task_id" class="task-progress-item">
              <div class="task-progress-row">
                <span class="task-progress-name">{{ task.novel_name || task.task_id.slice(0,8) }}</span>
                <el-progress 
                  :percentage="task.status === 'success' ? 100 : (task.status === 'running' ? 30 : 0)" 
                  :status="task.status === 'success' ? 'success' : (task.status === 'running' ? 'active' : 'normal')" 
                  :stroke-width="16" 
                  :format="n => ''"
                  class="task-progress-bar"
                >
                  <template #default>
                    <el-tag
                      v-if="task.status === 'success'"
                      type="success"
                      size="small"
                      style="margin-left: 6px;vertical-align: middle;"
                    >{{ lang === 'zh' ? '已完成' : 'Completed' }}</el-tag>
                    <el-tag
                      v-else-if="task.status === 'running'"
                      type="info"
                      size="small"
                      style="margin-left: 6px;vertical-align: middle;"
                    >{{ lang === 'zh' ? '制作中' : 'In Progress' }}</el-tag>
                    <el-tag
                      v-else
                      size="small"
                      style="margin-left: 6px;vertical-align: middle;"
                    >{{ lang === 'zh' ? '未开始' : 'Not Started' }}</el-tag>
                  </template>
                </el-progress>
                <el-button size="small" style="margin-left: 16px;" @click="fetchSingleTaskStatus(task.task_id)">{{ lang === 'zh' ? '立即查询' : 'Query Now' }}</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Upload, Document, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { post, get } from '@/utils/request'
import { API } from '@/api/config'
import { post as postRequest, get as getRequest } from '@/utils/request'

const isDragover = ref(false)
const uploadedFile = ref(null)
const uploading = ref(false)
const uploadProgress = ref(0)
const novelName = ref('')
const lang = ref(localStorage.getItem('site_lang') || 'zh')

// 角色相关
const roles = ref([
  '张三', '李四', '王五', '小明', '小红'
])
const selectedRole = ref('')
const customRole = ref('')
const loading = ref(false)
const trainLoading = ref(false)
const secretKey = ref('')

const taskId = ref('')
const taskStatus = ref('')
const runningTime = ref('')
const successTime = ref('')
const progressPercent = computed(() => taskStatus.value === 'success' ? 100 : (taskStatus.value === 'running' ? 60 : 0))
const progressStatus = computed(() => taskStatus.value === 'success' ? 'success' : (taskStatus.value === 'running' ? 'active' : 'normal'))
let statusTimer = null

const taskList = ref([])
const selectedTaskId = ref('')

// 新增：用于存储每个running任务的定时器
const statusTimers = {}

const handleDrop = (e) => {
  isDragover.value = false
  const file = e.dataTransfer.files[0]
  if (file && file.type === 'text/plain') {
    uploadedFile.value = file
  } else {
    ElMessage.error(lang.value === 'zh' ? '请上传txt格式的文件' : 'Please upload txt format file')
  }
}

const handleFileChange = (file) => {
  if (file.raw.type === 'text/plain') {
    uploadedFile.value = file.raw
  } else {
    ElMessage.error(lang.value === 'zh' ? '请上传txt格式的文件' : 'Please upload txt format file')
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const progressFormat = (percentage) => {
  return percentage === 100 ? (lang.value === 'zh' ? '上传完成' : 'Upload Complete') : `${percentage}%`
}

const uploadFile = async () => {
  if (!uploadedFile.value) {
    ElMessage.warning(lang.value === 'zh' ? '请先选择文件' : 'Please select a file first')
    return
  }
  if (!novelName.value.trim()) {
    ElMessage.warning(lang.value === 'zh' ? '请填写小说名' : 'Please enter novel name')
    return
  }
  uploading.value = true
  uploadProgress.value = 0
  try {
    const formData = new FormData()
    formData.append('file', uploadedFile.value)
    formData.append('novel_name', novelName.value.trim())
    const response = await post(API.UPLOAD_NOVEL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        uploadProgress.value = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
      }
    })
    if (response.status === 200) {
      ElMessage.success(lang.value === 'zh' ? '小说上传成功' : 'Novel uploaded successfully')
      uploadProgress.value = 100
      // 清空文件
      uploadedFile.value = null
      // 不清空小说名，因为后续还需要使用
      // novelName.value = ''
      // TODO: 可在此处请求后端返回的角色列表，替换roles.value
    } else {
      throw new Error(response.msg || (lang.value === 'zh' ? '上传失败' : 'Upload failed'))
    }
  } catch (error) {
    console.error('Upload error:', error)
    ElMessage.error(error.message || (lang.value === 'zh' ? '上传失败，请重试' : 'Upload failed, please try again'))
  } finally {
    uploading.value = false
  }
}

const removeFile = () => {
  uploadedFile.value = null
  uploadProgress.value = 0
}

// 角色选择相关
const selectRole = (role) => {
  selectedRole.value = role
}

const addCustomRole = () => {
  const name = customRole.value.trim()
  if (!name) {
    ElMessage.warning(lang.value === 'zh' ? '请输入角色名' : 'Please enter character name')
    return
  }
  if (roles.value.includes(name)) {
    ElMessage.warning(lang.value === 'zh' ? '该角色已存在' : 'Character already exists')
    return
  }
  roles.value.unshift(name)
  selectedRole.value = name
  customRole.value = ''
}

const confirmSelect = async () => {
  if (!customRole.value.trim()) {
    ElMessage.warning(lang.value === 'zh' ? '请输入角色名' : 'Please enter character name')
    return
  }
  selectedRole.value = customRole.value.trim()
  customRole.value = ''
  loading.value = true
  try {
    const res = await get(API.SELECT_CHARACTER, { character: selectedRole.value })
    if (res.status === 200) {
      ElMessage.success(lang.value === 'zh' ? '角色选择成功！' : 'Character selected successfully!')
    } else {
      ElMessage.error(res.msg || (lang.value === 'zh' ? '角色选择失败' : 'Character selection failed'))
    }
  } catch (e) {
    ElMessage.error(lang.value === 'zh' ? '请求失败，请重试' : 'Request failed, please try again')
  } finally {
    loading.value = false
  }
}

// 加载任务列表
const loadTaskList = () => {
  const list = JSON.parse(localStorage.getItem('dataset_task_list') || '[]')
  taskList.value = list
  if (list.length && !selectedTaskId.value) {
    selectedTaskId.value = list[list.length - 1].task_id
  }
}

// 新增：查询单个任务状态
const fetchSingleTaskStatus = async (taskId) => {
  console.log('fetchSingleTaskStatus 调用, taskId:', taskId)
  try {
    const res = await getRequest('/get_task_status', { task_type: 'making_dataset', task_id: taskId })
    const data = res.data || res
    if (Array.isArray(data.status_list)) {
      const last = data.status_list[data.status_list.length - 1]
      // 更新本地任务列表
      const idx = taskList.value.findIndex(t => t.task_id === taskId)
      if (idx !== -1) {
        taskList.value[idx].status = last.status
        saveTaskList()
      }
      // 如果任务完成，清除定时器
      if (last.status === 'success' || last.status === 'failed') {
        if (statusTimers[taskId]) {
          console.log('任务完成，清除定时器，taskId:', taskId)
          clearInterval(statusTimers[taskId])
          delete statusTimers[taskId]
        }
      }
    }
  } catch (e) {
    // 忽略错误
  }
}

// 页面挂载时，遍历所有running任务，立即查一次并开启定时器
onMounted(() => {
  loadTaskList()
  console.log('onMounted taskList:', JSON.stringify(taskList.value))
  taskList.value.forEach(task => {
    if (task.status === 'running') {
      console.log('发现running任务，task_id:', task.task_id)
      fetchSingleTaskStatus(task.task_id) // 立即查一次
      statusTimers[task.task_id] = setInterval(() => {
        console.log('定时器触发，task_id:', task.task_id)
        fetchSingleTaskStatus(task.task_id)
      }, 60000)
    }
  })
  // 监听语言变化事件
  window.addEventListener('languageChanged', () => {
    lang.value = localStorage.getItem('site_lang') || 'zh'
  })
})

// 页面卸载时清理所有定时器
onUnmounted(() => {
  Object.values(statusTimers).forEach(timer => clearInterval(timer))
  window.removeEventListener('languageChanged', () => {
    lang.value = localStorage.getItem('site_lang') || 'zh'
  })
})

const saveTaskList = () => {
  localStorage.setItem('dataset_task_list', JSON.stringify(taskList.value))
}

const startTrain = async () => {
  trainLoading.value = true
  try {
    const res = await postRequest('/start_making_dataset', { api_key: secretKey.value })
    const data = res.data || res
    if (data.status === 200 && data.task_id) {
      ElMessage.success('数据集制作已开始！')
      taskId.value = data.task_id
      selectedTaskId.value = data.task_id
      localStorage.setItem('last_task_id', data.task_id)
      // 新任务加入任务列表，使用当前的小说名和角色名
      const currentNovelName = novelName.value.trim()
      const currentRoleName = selectedRole.value.trim()
      taskList.value.push({ 
        task_id: data.task_id, 
        novel_name: currentNovelName, 
        role_name: currentRoleName,
        status: 'running', 
        timestamp: new Date().toLocaleString() 
      })
      saveTaskList()
      fetchSingleTaskStatus(data.task_id)
    } else {
      ElMessage.error(data.msg || '数据集制作启动失败')
    }
  } catch (e) {
    ElMessage.error('请求失败，请重试')
  } finally {
    trainLoading.value = false
  }
}
</script>

<style scoped>
.novel-page-root {
  min-height: 100vh;
  background: linear-gradient(135deg, #f6f8fa 0%, #e8f0fe 100%);
  font-family: '微软雅黑', '思源黑体', 'Alibaba PuHuiTi', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.novel-page-flex {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  flex-direction: column;
  justify-content: center;
  gap: 32px;
}
.novel-steps-row {
  display: flex;
  flex-direction: row;
  gap: 32px;
  justify-content: center;
  align-items: stretch;
  margin-bottom: 32px;
}
.novel-steps-row .step-card.small-card {
  flex: 1 1 0;
  min-width: 320px;
  max-width: 400px;
  min-height: 420px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  margin: 0;
  padding: 20px 20px 16px 20px;
  box-sizing: border-box;
  overflow: hidden;
}
.novel-tasks-row {
  display: flex;
  flex-direction: row;
  gap: 32px;
  justify-content: center;
  align-items: flex-start;
}
/**** 步骤条 ****/
.stepper-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 32px 0 24px 0;
  gap: 0;
}
.stepper-item {
  display: flex;
  align-items: center;
  font-size: 17px;
  font-weight: 500;
  color: #bfcbd9;
  position: relative;
  padding: 0 18px;
  transition: color 0.2s;
}
.stepper-item.active {
  color: #409EFF;
  font-weight: bold;
}
.stepper-index {
  display: inline-block;
  width: 26px;
  height: 26px;
  line-height: 26px;
  border-radius: 50%;
  background: #e0edff;
  color: #409EFF;
  text-align: center;
  margin-right: 8px;
  font-size: 16px;
  font-weight: bold;
}
.stepper-item.active .stepper-index {
  background: #409EFF;
  color: #fff;
}
.stepper-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: #f56c6c;
  border-radius: 50%;
  margin-left: 8px;
  box-shadow: 0 0 6px #f56c6c44;
}
.stepper-line {
  width: 48px;
  height: 2px;
  background: linear-gradient(90deg, #e0edff 0%, #409EFF 100%);
  margin: 0 0px;
}
/**** 主体卡片 ****/
.novel-steps-container {
  width: 44vw;
  min-width: 320px;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  justify-content: center;
}
.task-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 370px;
  margin-left: auto;
}
.task-card {
  background: linear-gradient(135deg, #e5e7eb 60%, #f8fafc 100%);
  border-radius: 14px;
  box-shadow: 0 4px 18px 0 rgba(64,158,255,0.10);
  border: 1.5px solid #d3d6db;
  padding: 32px 36px 26px 36px;
  width: 100%;
  transition: box-shadow 0.2s;
}
.task-card:hover {
  box-shadow: 0 8px 32px 0 rgba(64,158,255,0.18);
}
.task-title {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 20px;
  text-align: center;
  letter-spacing: 1px;
}
.task-status-text {
  text-align: center;
  font-size: 16px;
  margin-top: 10px;
}
.task-time {
  color: #888;
  font-size: 13px;
  margin-left: 10px;
}
.task-radio-group {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-start;
}
.task-radio-group :deep(.el-radio-button__inner) {
  border-radius: 8px !important;
  background: #f5f7fa;
  border: 1.5px solid #dcdfe6;
  color: #409eff;
  font-weight: 500;
  font-size: 15px;
  padding: 8px 18px;
  transition: background 0.2s, border 0.2s;
}
.task-radio-group :deep(.el-radio-button__orig-radio:checked + .el-radio-button__inner) {
  background: #ecf5ff;
  border-color: #409eff;
  color: #2d8cf0;
}
.task-radio-group :deep(.el-radio-button__inner:hover) {
  background: #e0edff;
}
/**** 卡片样式 ****/
.step-card {
  background: linear-gradient(135deg, #e5e7eb 60%, #f8fafc 100%);
  border-radius: 14px;
  box-shadow: 0 4px 18px 0 rgba(64,158,255,0.10);
  border: 1.5px solid #d3d6db;
  margin: 0 auto;
  transition: box-shadow 0.2s;
  padding: 20px 20px 16px 20px;
}
.step-card:hover {
  box-shadow: 0 8px 32px 0 rgba(64,158,255,0.18);
}
.small-card {
  max-width: 400px;
  min-width: 260px;
  width: 100%;
  margin: 0 auto;
}
.step-title {
  text-align: left;
  font-size: 16px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 12px;
  letter-spacing: 1px;
}
.center-title {
  text-align: center;
  font-size: 19px;
  color: #303133;
  margin-bottom: 8px;
  font-weight: 600;
}
.upload-header {
  text-align: center;
  margin-bottom: 10px;
}
.description {
  color: #606266;
  font-size: 13px;
  margin-bottom: 6px;
}
.novel-name-bar {
  margin: 10px 0 10px 0;
  display: flex;
  justify-content: center;
}
.novel-name-input {
  width: 100%;
  font-size: 15px;
}
:deep(.el-input__wrapper) {
  border-radius: 8px;
  border: 1.5px solid #dcdfe6;
  background: #f8fafc;
  box-shadow: none;
  padding: 0 12px;
  height: 36px;
  transition: border 0.2s, box-shadow 0.2s;
}
:deep(.el-input__wrapper.is-focus) {
  border-color: #409EFF;
  box-shadow: 0 0 0 2px #e0edff;
}
:deep(.el-input__inner::placeholder) {
  color: #888;
  opacity: 1;
}
.upload-area {
  border: 2px dashed #409EFF;
  border-radius: 12px;
  min-height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  transition: all 0.3s;
  position: relative;
  margin-bottom: 8px;
  box-sizing: border-box;
  overflow: hidden;
  padding: 10px 0 8px 0;
}
.upload-component {
  width: 100%;
  height: 100%;
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin: 0 !important;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 2;
}
:deep(.el-upload-dragger) {
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
  padding: 0 !important;
  margin: 0 !important;
  width: 100% !important;
  height: 100% !important;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.upload-center-trigger {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  cursor: pointer;
}
.upload-animate {
  font-size: 48px;
  color: #409EFF;
  margin-bottom: 8px;
  animation: upload-bounce 1.2s infinite alternate;
  align-self: center;
}
.upload-tip-text {
  font-size: 16px;
  color: #409EFF;
  font-weight: 500;
  margin-bottom: 2px;
  align-self: center;
  text-align: center;
}
.el-upload__tip {
  font-size: 13px;
  margin-top: 4px;
  color: #888;
  align-self: center;
  text-align: center;
}
.file-info {
  margin-top: 6px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 8px;
}
.file-name {
  font-size: 13px;
  margin-bottom: 6px;
}
.file-size {
  font-size: 12px;
  margin-bottom: 8px;
}
.upload-actions {
  display: flex;
  gap: 10px;
}
.upload-progress {
  margin-top: 10px;
}
.custom-role-bar {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
}
.custom-role-btn-bar {
  margin-top: 12px;
  width: 100%;
  display: flex;
  justify-content: center;
}
.add-role-btn {
  font-size: 14px;
  border-radius: 999px;
  padding: 8px 22px;
  font-weight: bold;
  height: 32px;
  background: linear-gradient(90deg, #409eff 60%, #79bbff 100%);
  color: #fff;
  border: none;
  box-shadow: 0 2px 8px 0 rgba(64,158,255,0.08);
  transition: background 0.2s, transform 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.add-role-btn:hover {
  background: linear-gradient(90deg, #2d8cf0 60%, #409eff 100%);
  transform: scale(1.05);
}
.selected-tip {
  margin-top: 8px;
  font-size: 14px;
  color: #409eff;
}
.train-section {
  margin: 0;
  max-width: 100%;
  background: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  padding: 0;
}
.train-btn-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 0;
}
.train-btn {
  font-size: 16px;
  padding: 10px 36px;
  border-radius: 999px;
  font-weight: bold;
  letter-spacing: 1px;
  height: 36px;
  background: linear-gradient(90deg, #409eff 60%, #79bbff 100%);
  color: #fff;
  border: none;
  box-shadow: 0 2px 8px 0 rgba(64,158,255,0.08);
  transition: background 0.2s, transform 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.train-btn:hover {
  background: linear-gradient(90deg, #2d8cf0 60%, #409eff 100%);
  transform: scale(1.05);
}
.disabled-area {
  opacity: 0.5;
  pointer-events: none;
  user-select: none;
  position: relative;
}
.disabled-card {
  pointer-events: none;
  filter: grayscale(0.7);
}
.step-tip {
  color: #f56c6c;
  text-align: center;
  margin-top: 10px;
  font-size: 13px;
  width: 100%;
  display: block;
}
/**** 进度条美化 ****/
.el-progress {
  --el-progress-bar-bg-color: #e0edff;
  --el-progress-bar-color: #409eff;
  --el-progress-text-color: #409eff;
  border-radius: 8px;
  height: 18px !important;
}
.el-progress-bar__outer {
  border-radius: 8px !important;
}
.el-progress-bar__inner {
  border-radius: 8px !important;
}
.custom-role-input,
.secret-key-input {
  width: 100%;
  font-size: 15px;
  /* 不要设置border、background、box-shadow、border-radius等 */
}
.train-form-bar {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
}
.train-btn-bar {
  margin-top: 12px;
  width: 100%;
  display: flex;
  justify-content: center;
}
.custom-role-input{
  margin-top: 48px !important;
}
.secret-key-input{
  margin-top: 86px !important;
}
.task-progress-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  width: 100%;
}
.task-progress-name {
  font-size: 16px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 0;
  text-align: left;
  min-width: 70px;
  flex-shrink: 0;
}
.task-progress-bar {
  flex: 1 1 0;
  min-width: 120px;
  margin-left: 8px;
}
.task-progress-item {
  min-width: 220px;
  max-width: 100%;
  flex: 1 1 0;
  background: #f8fafc;
  border-radius: 10px;
  box-shadow: 0 1.5px 6px 0 rgba(64,158,255,0.06);
  border: 1px solid #e0e6ed;
  padding: 18px 18px 12px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
</style> 