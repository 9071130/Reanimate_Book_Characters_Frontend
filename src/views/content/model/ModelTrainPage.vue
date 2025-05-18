<template>
  <div class="model-train-main">
    <div class="train-card">
      <div class="train-title">{{ lang === 'zh' ? '模型训练' : 'Model Training' }}</div>
      <div class="param-item">
        <div class="param-label">{{ lang === 'zh' ? '请选择要训练的数据集：' : 'Please select the dataset to train:' }}</div>
        <div class="dataset-select-bar">
          <el-select v-model="selectedDataset" :placeholder="lang === 'zh' ? '请选择数据集' : 'Please select dataset'" class="dataset-select">
            <el-option 
              v-for="task in completedTasks" 
              :key="task.task_id" 
              :label="`${task.novel_name || ''} ${task.role_name || ''}`.trim()" 
              :value="task.task_id" 
            />
          </el-select>
        </div>
      </div>
      <!-- 新增基座模型HuggingFace路径输入框 -->
      <div class="param-item">
        <div class="param-label">{{ lang === 'zh' ? '请输入基座模型的HuggingFace路径：' : 'Enter base model HuggingFace path:' }}</div>
        <el-input
          v-model="pretrainedModelPath"
          :placeholder="lang === 'zh' ? '请输入基座模型的HuggingFace路径' : 'Please enter base model HuggingFace path'"
          class="param-input"
        />
      </div>
      
      <!-- 隐藏的输入框 -->
      <div style="display: none;">
        <div class="param-item">
          <div class="param-label">{{ lang === 'zh' ? 'HuggingFace API：' : 'HuggingFace API:' }}</div>
          <el-input 
            v-model="hfApi" 
            :placeholder="lang === 'zh' ? '请输入HuggingFace API' : 'Please enter HuggingFace API'"
            class="param-input"
          />
        </div>

        <div class="param-item">
          <div class="param-label">{{ lang === 'zh' ? 'Safetensors保存路径：' : 'Safetensors Save Path:' }}</div>
          <el-input 
            v-model="uploadPathSafetensors" 
            :placeholder="lang === 'zh' ? '请输入safetensors格式模型保存路径' : 'Please enter safetensors save path'"
            class="param-input"
          />
        </div>

        <div class="param-item">
          <div class="param-label">{{ lang === 'zh' ? 'GGUF保存路径：' : 'GGUF Save Path:' }}</div>
          <el-input 
            v-model="uploadPathGguf" 
            :placeholder="lang === 'zh' ? '请输入gguf格式模型保存路径' : 'Please enter gguf save path'"
            class="param-input"
          />
        </div>
      </div>

      <div class="train-btn-bar">
        <el-button 
          type="primary" 
          :disabled="!isFormValid" 
          @click="startModelTrain"
        >{{ lang === 'zh' ? '开始训练' : 'Start Training' }}</el-button>
      </div>
    </div>
    <!-- 右侧任务区域 -->
    <div class="train-task-container">
      <div class="task-card task-card-merged">
        <div class="task-title">{{ lang === 'zh' ? '训练任务列表与进度' : 'Train Task List & Progress' }}</div>
        <div class="task-progress-list">
          <div v-for="task in trainTaskList" :key="task.task_id" class="task-progress-item">
            <div class="task-progress-row">
              <span class="task-progress-name">{{ (task.novel_name || task.task_id.slice(0,8)) + (task.role_name ? ' ' + task.role_name : '') }}</span>
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
                  >{{ lang === 'zh' ? '训练中' : 'Training' }}</el-tag>
                  <el-tag
                    v-else
                    size="small"
                    style="margin-left: 6px;vertical-align: middle;"
                  >{{ lang === 'zh' ? '未开始' : 'Not Started' }}</el-tag>
                </template>
              </el-progress>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { post, get } from '@/utils/request'

const lang = ref(localStorage.getItem('site_lang') || 'zh')

const datasetList = ref([])
const completedTasks = ref([])
const selectedDataset = ref('')
const pretrainedModelPath = ref('Qwen/Qwen2.5-3B-Instruct')
const hfApi = ref('')
const uploadPathSafetensors = ref('')
const uploadPathGguf = ref('')
const training = ref(false)

// 训练任务相关
const datasetTaskList = ref([])
const selectedTrainTaskId = ref('')
const trainTaskStatus = ref('')
const trainRunningTime = ref('')
const trainSuccessTime = ref('')
const trainProgressPercent = computed(() => trainTaskStatus.value === 'success' ? 100 : (trainTaskStatus.value === 'running' ? 60 : 0))
const trainProgressStatus = computed(() => trainTaskStatus.value === 'success' ? 'success' : (trainTaskStatus.value === 'running' ? 'active' : 'normal'))

// 表单验证
const isFormValid = computed(() => {
  return selectedDataset.value
})

// 从localStorage加载已完成的数据集
const loadCompletedDatasets = () => {
  const taskList = JSON.parse(localStorage.getItem('dataset_task_list') || '[]')
  // 只获取状态为success的任务
  completedTasks.value = taskList.filter(task => task.status === 'success')
}

// 加载数据集任务列表
const loadDatasetTaskList = () => {
  datasetTaskList.value = JSON.parse(localStorage.getItem('dataset_task_list') || '[]')
}

// 保存训练任务列表（只存task_id, role_name, novel_name, timestamp）
const saveTrainTaskList = () => {
  localStorage.setItem('train_task_list', JSON.stringify(trainTaskList.value))
}

// 加载训练任务列表
const trainTaskList = ref([])
const loadTrainTaskList = () => {
  trainTaskList.value = JSON.parse(localStorage.getItem('train_task_list') || '[]')
}

// 新增：用于存储每个running训练任务的定时器
const trainStatusTimers = {}

// 新增：查询单个训练任务状态
const fetchSingleTrainTaskStatus = async (taskId) => {
  console.log('fetchSingleTrainTaskStatus 调用, taskId:', taskId)
  try {
    const res = await get('/get_task_status', { task_type: 'training_model', task_id: taskId })
    const data = res.data || res
    if (Array.isArray(data.status_list)) {
      const last = data.status_list[data.status_list.length - 1]
      // 更新本地任务列表
      const idx = trainTaskList.value.findIndex(t => t.task_id === taskId)
      if (idx !== -1) {
        trainTaskList.value[idx].status = last.status
        saveTrainTaskList()
      }
      // 如果任务完成，清除定时器
      if (last.status === 'success' || last.status === 'failed') {
        if (trainStatusTimers[taskId]) {
          console.log('训练任务完成，清除定时器，taskId:', taskId)
          clearInterval(trainStatusTimers[taskId])
          delete trainStatusTimers[taskId]
        }
      }
    }
  } catch (e) {
    // 忽略错误
  }
}

// 页面挂载时，遍历所有running训练任务，立即查一次并开启定时器
onMounted(() => {
  loadCompletedDatasets()
  loadDatasetTaskList()
  loadTrainTaskList()
  console.log('onMounted trainTaskList:', JSON.stringify(trainTaskList.value))
  trainTaskList.value.forEach(task => {
    if (task.status === 'running') {
      console.log('发现running训练任务，task_id:', task.task_id)
      fetchSingleTrainTaskStatus(task.task_id) // 立即查一次
      trainStatusTimers[task.task_id] = setInterval(() => {
        console.log('训练定时器触发，task_id:', task.task_id)
        fetchSingleTrainTaskStatus(task.task_id)
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
  Object.values(trainStatusTimers).forEach(timer => clearInterval(timer))
  window.removeEventListener('languageChanged', () => {
    lang.value = localStorage.getItem('site_lang') || 'zh'
  })
})

const startModelTrain = async () => {
  if (!isFormValid.value) {
    ElMessage.warning('请选择数据集')
    return
  }
  
  training.value = true
  try {
    // 找到选中的数据集任务对象
    const selectedTask = datasetTaskList.value.find(task => task.task_id === selectedDataset.value) || {}
    // 构建训练参数
    const trainParams = {
      task_id: selectedTask.task_id,
      pretrained_model_path: pretrainedModelPath.value || null,
      hf_api: null,
      upload_path_safetensors: null,
      upload_path_gguf: null,
      role_name: selectedTask.role_name || '',
      book_name: selectedTask.novel_name || ''
    }
    
    const res = await post('/start_training_model', trainParams)
    if (res.status === 200) {
      ElMessage.success('模型训练任务已启动！')
      selectedDataset.value = ''
      // 保存到train_task_list，避免重复
      if (!trainTaskList.value.some(t => t.task_id === selectedTask.task_id)) {
        trainTaskList.value.push({
          task_id: selectedTask.task_id,
          role_name: selectedTask.role_name || '',
          novel_name: selectedTask.novel_name || '',
          timestamp: new Date().toLocaleString(),
          status: 'running'
        })
        saveTrainTaskList()
      }
      selectedTrainTaskId.value = selectedTask.task_id
      // 立即查询一次任务进度并启动轮询
      fetchSingleTrainTaskStatus(selectedTask.task_id)
    } else {
      throw new Error(res.msg || '启动训练失败')
    }
  } catch (error) {
    console.error('训练启动失败：', error)
    ElMessage.error(error.message || '启动训练失败，请重试')
  } finally {
    training.value = false
  }
}
</script>

<style scoped>
.model-train-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100vh;
  gap: 48px;
  padding: 48px 0 0 0;
}
.train-card {
  background: #e5e7eb;
  border-radius: 14px;
  box-shadow: 0 2px 12px 0 rgba(64,158,255,0.10);
  border: 1.5px solid #d3d6db;
  padding: 48px 48px 38px 48px;
  min-width: 420px;
  max-width: 600px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
  justify-content: center;
}
.train-task-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.task-card {
  background: #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 1.5px 6px 0 rgba(64,158,255,0.08);
  border: 1px solid #d3d6db;
  padding: 28px 32px 22px 32px;
  width: 100%;
}
.task-title {
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 18px;
  text-align: center;
}
.task-status-text {
  text-align: center;
  font-size: 15px;
  margin-top: 8px;
}
.task-time {
  color: #888;
  font-size: 13px;
  margin-left: 10px;
}
.task-radio-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-radio-group :deep(.el-radio) {
  margin-right: 0;
  margin-bottom: 8px;
  width: 100%;
}

.task-radio-group :deep(.el-radio__label) {
  white-space: normal;
  line-height: 1.5;
}
.train-title {
  font-size: 22px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 28px;
  text-align: center;
}
.dataset-select-bar {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}
.dataset-select {
  width: 100%;
}
.param-item {
  margin-bottom: 16px;
}
.param-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}
.param-input {
  width: 100%;
}
.train-btn-bar {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
.task-card-merged {
  width: 100%;
  max-width: 600px;
  min-width: 420px;
  margin: 0 auto;
}
.task-progress-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
  justify-content: flex-start;
  align-items: stretch;
  width: 100%;
  margin-top: 24px;
}
.task-progress-item {
  min-width: 0;
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
</style> 