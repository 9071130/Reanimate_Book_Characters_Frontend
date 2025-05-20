<template>
  <div class="ai-practice-container">
    <!-- 左侧历史对话记录 -->
    <div class="history-panel">
      <div class="new-chat-container">
        <div class="model-select-label">{{ lang === 'zh' ? '选择对话角色：' : 'Select Character:' }}</div>
        <div class="model-select-bar" style="margin-bottom: 12px;">
          <el-select v-model="selectedModel" :placeholder="lang === 'zh' ? '请选择模型' : 'Please select model'" class="model-select">
            <el-option
              v-for="item in modelList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
        <div class="voice-select-label">{{ lang === 'zh' ? '选择配音：' : 'Select Voice:' }}</div>
        <div class="voice-select-bar" style="margin-bottom: 16px;">
          <el-select v-model="selectedVoice" :placeholder="lang === 'zh' ? '请选择配音' : 'Please select voice'" class="model-select">
            <el-option
              v-for="item in audioList"
              :key="item.audio_id"
              :label="item.audio_name"
              :value="item.audio_id"
            />
            <el-option :label="lang === 'zh' ? '自定义配音，开始录制' : 'Custom Record Voice'" value="custom_record" />
            <el-option :label="lang === 'zh' ? '自定义上传配音' : 'Custom Upload Voice'" value="custom_upload" />
          </el-select>
        </div>
        <el-dialog v-model="showCustomRecordDialog" :title="lang === 'zh' ? '自定义配音' : 'Custom Voice'" width="380px" :close-on-click-modal="false" @close="resetCustomRecord">
          <div class="custom-voice-dialog-content">
            <el-input v-model="customRecordName" :placeholder="lang === 'zh' ? '请输入配音名称' : 'Please enter voice name'" class="custom-voice-name-input" maxlength="20" show-word-limit style="margin-bottom: 12px;" />
            <el-upload
              v-if="customDialogMode === 'upload'"
              class="custom-upload"
              :show-file-list="false"
              :before-upload="beforeCustomUpload"
              :on-change="onCustomUploadChange"
              accept="audio/*"
              style="margin-bottom: 12px;"
            >
              <el-button type="primary">{{ lang === 'zh' ? '选择音频文件' : 'Select Audio File' }}</el-button>
            </el-upload>
            <el-input v-model="customRecordText" type="textarea" :rows="3" :placeholder="lang === 'zh' ? '请输入音频对应的文字内容' : 'Please enter text for audio'" class="custom-voice-text-input" maxlength="200" show-word-limit style="margin-bottom: 12px;" />
            <div class="custom-voice-btns">
              <el-button
                :type="isCustomRecording ? 'danger' : 'primary'"
                @click="toggleCustomRecording"
                v-if="customDialogMode === 'record'"
              >
                {{ isCustomRecording ? (lang === 'zh' ? '结束录制' : 'Stop Recording') : (lang === 'zh' ? '开始录制' : 'Start Recording') }}
              </el-button>
              <span v-if="isCustomRecording && customDialogMode === 'record'" class="custom-voice-timer">{{ customRecordTime }}</span>
              <el-button v-if="customRecordUrl && !isCustomRecording && customDialogMode === 'record'" type="warning" @click="deleteCustomRecord">{{ lang === 'zh' ? '删除录音/重新录制' : 'Delete/Redo Recording' }}</el-button>
              <el-button v-if="customRecordUrl && customDialogMode === 'upload'" type="warning" @click="deleteCustomRecord">{{ lang === 'zh' ? '删除音频/重新上传' : 'Delete/Redo Upload' }}</el-button>
            </div>
            <div v-if="customRecordUrl" class="custom-voice-audio">
              <audio :src="customRecordUrl" controls style="margin-top: 10px; width: 100%; max-width: 100%;" />
            </div>
            <div v-if="isCustomRecording && customDialogMode === 'record'" class="custom-voice-tip">{{ lang === 'zh' ? '录制中...' : 'Recording...' }}</div>
          </div>
          <template #footer>
            <el-button @click="showCustomRecordDialog = false">{{ lang === 'zh' ? '取消' : 'Cancel' }}</el-button>
            <el-button type="success" :disabled="!customRecordUrl || !customRecordName.trim() || !customRecordText.trim()" @click="confirmCustomRecord">{{ lang === 'zh' ? '确认' : 'Confirm' }}</el-button>
          </template>
        </el-dialog>
        <button class="new-chat-btn" @click="newConversation">
          {{ lang === 'zh' ? '新建对话' : 'New Chat' }}
          <el-icon class="plus-icon">
            <Plus/>
          </el-icon>
        </button>
      </div>
      <ul class="history-list">
        <li v-for="(item, index) in historyList" :key="index" @click="selectConversation(index)"
            :class="{ active: currentConversationIndex === index }">
          {{ item.title }}
        </li>
      </ul>
    </div>

    <!-- 右侧对话页面 -->
    <div class="chat-wrapper">
      <div class="chat-panel">
        <!-- 语音开关 -->
        <div class="audio-switch-bar">
          <span class="audio-switch-label">{{ lang === 'zh' ? '语音播报' : 'Voice Broadcast' }}</span>
          <el-switch
            v-model="audioEnabled"
            :active-text="lang === 'zh' ? '开' : 'On'"
            :inactive-text="lang === 'zh' ? '关' : 'Off'"
            inline-prompt
            style="margin-left: 10px;"
            @change="onAudioSwitchChange"
          />
        </div>
        
        <!-- 上半部分聊天界面 -->
        <div class="chat-messages" ref="chatMessagesRef">
          <div v-for="(message, index) in currentConversation.messages" :key="index" :class="['message', message.role]">
            <div class="avatar">
              <div v-if="message.role !== 'user'" class="ai-avatar">
                <el-icon class="character-icon"><User /></el-icon>
              </div>
              <div v-else>
                <el-icon class="user-icon"><User /></el-icon>
              </div>
            </div>
            <div class="content">
              {{ message.content }}
            </div>
          </div>
        </div>

        <!-- 输入框 -->
        <div class="input-area">
          <div class="input-wrapper">
            <el-icon class="input-icon link-icon">
              <Link/>
            </el-icon>
            <input
                v-model="userInput"
                @keyup.enter="sendMessage"
                :placeholder="lang === 'zh' ? '输入消息，按回车发送...' : 'Type a message and press Enter...'"
                type="text"
                :disabled="isInputDisabled"
            >
            <div class="button-group">
              <el-popover
                  placement="top"
                  :width="200"
                  trigger="hover"
                  :disabled="!!userInput.trim()"
              >
                <template #reference>
                  <el-button
                      class="send-button"
                      circle
                      @click="sendMessage"
                      :disabled="!userInput.trim()"
                  >
                    <el-icon>
                      <Top/>
                    </el-icon>
                  </el-button>
                </template>
                <span>{{ lang === 'zh' ? '请输入消息' : 'Please enter a message' }}</span>
              </el-popover>
            </div>
          </div>
        </div>

        <div class="disclaimer">
          {{ lang === 'zh' ? '服务生成的所有内容均由AI生成，其生成内容的准确性和完整性无法保证' : 'All content generated by the service is AI-generated. The accuracy and completeness of the generated content cannot be guaranteed.' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, nextTick, watch, onMounted} from 'vue';
import {Link, Microphone, Plus, Top, User} from '@element-plus/icons-vue';
import {ElMessage} from 'element-plus';
import {get, post} from '@/utils/request'
import {API} from '@/api/config'

const lang = ref(localStorage.getItem('site_lang') || 'zh')

const historyList = ref([
  {
    title: '新对话',
    messages: [
      {
        role: 'assistant',
        content: '您好！我是您的AI对话助手，很高兴为您服务！请选择您想要对话的小说角色，我们可以开始对话了。'
      }
    ]
  }
]);

const currentConversationIndex = ref(0);
const userInput = ref('');
const isListening = ref(false);
const chatMessagesRef = ref(null);
const isInputDisabled = ref(false);
const audioEnabled = ref(false); // 默认关闭语音播放
const showCustomRecordDialog = ref(false)
const isCustomRecording = ref(false)
const customRecordUrl = ref('')
const customRecordTime = ref('00:00')
const customRecordName = ref('')
const customRecordText = ref('')
let customRecorder = null
let customChunks = []
let customRecordTimer = null
let customRecordStart = 0
const customDialogMode = ref('record') // 'record' or 'upload'

const currentConversation = computed(() => historyList.value[currentConversationIndex.value]);

const modelList = ref([]) // 存储下拉框选项
const selectedModel = ref('') // 当前选中项

const audioList = ref([])
const selectedVoice = ref('')

// 页面加载时从localStorage加载audio_list
onMounted(() => {
  // 读取 train task list
  let trainList = []
  try {
    trainList = JSON.parse(localStorage.getItem('train_task_list') || '[]')
  } catch {
    trainList = []
  }
  console.log(trainList)
  // 过滤 status 为 success
  const filtered = trainList.filter(item => item.status === 'success')
  // 格式化为下拉框选项
  modelList.value = filtered.map(item => ({
    label: `${item.novel_name} ${item.role_name}`,
    value: item.task_id
  }))
  // 默认选中第一个
  if (modelList.value.length > 0) {
    selectedModel.value = modelList.value[0].value
  }

  // 下面是原有的 audioList 相关代码
  try {
    audioList.value = JSON.parse(localStorage.getItem('audio_list') || '[]')
  } catch {
    audioList.value = []
  }
  // 默认选中第一个
  if (audioList.value.length > 0) {
    selectedVoice.value = audioList.value[0].audio_id
  }

  // 监听语言变化事件
  window.addEventListener('languageChanged', () => {
    lang.value = localStorage.getItem('site_lang') || 'zh'
  })
})

watch(selectedVoice, (val) => {
  if (val === 'custom_record') {
    customDialogMode.value = 'record'
    showCustomRecordDialog.value = true
  } else if (val === 'custom_upload') {
    customDialogMode.value = 'upload'
    showCustomRecordDialog.value = true
  }
})

const selectConversation = (index) => {
  currentConversationIndex.value = index;
  nextTick(() => {
    scrollToBottom();
  });
};

const newConversation = () => {
  historyList.value.unshift({
    title: '新对话',
    messages: [{
      role: 'assistant',
      content: '您好！我是您的AI对话助手，很高兴为您服务！请选择您想要对话的小说角色，我们可以开始对话了。'
    }]
  });
  currentConversationIndex.value = 0;
};

const onAudioSwitchChange = (val) => {
  ElMessage.success(val ? '已开启语音播放' : '已关闭语音播放');
};

//发送消息的函数
const sendMessage = async () => {
  if (userInput.value.trim()) {
    // 添加用户消息
    currentConversation.value.messages.push({role: 'user', content: userInput.value});
    const prompt = userInput.value;
    userInput.value = '';
    nextTick(() => {
      scrollToBottom();
    });
    const loadingMessage = ref({
      role: 'assistant',
      content: 'AI正在思考...',
      loading: true
    });
    currentConversation.value.messages.push(loadingMessage.value);
    nextTick(() => {
      scrollToBottom();
    });

    // 获取AI回复
    try {
      const text_res = await get(API.GENERATE, { input_text: prompt, task_id: selectedModel.value })
      // 提取'###AI的回复:'后面的内容
      let aiReply = '';
      const contentStr = text_res.data.content;
      const match = contentStr.match(/###AI的回复[:：]\s*([\s\S]*)/);
      if (match) {
        aiReply = match[1].trim();
      } else {
        aiReply = contentStr;
      }
      loadingMessage.value.content = aiReply;
      loadingMessage.value.loading = false;
      nextTick(() => {
        scrollToBottom();
      });
      // 只有开启语音时才请求TTS
      if (audioEnabled.value) {
        // 获取当前选中配音的audio_text和audio_id
        let audioText = ''
        let audioId = ''
        let audioLocalDir = ''
        let file_name = ''
        const audioItem = audioList.value.find(item => item.audio_id === selectedVoice.value)
        if (audioItem) {
          audioText = audioItem.audio_text || ''
          audioId = audioItem.audio_id
          audioLocalDir = audioItem.local_dir
          file_name = audioItem.file_name
        }
        // 构造tts参数
        const tts_params = {
          text: aiReply,
          text_lang: 'zh',
          // ref_audio_path: `E:/人工智能学习/AI拟人聊天系统/复活小说角色项目/Reanimate_Book_Characters/ref_audio/${audioId}.wav`,
          ref_audio_path: `E:/人工智能学习/AI拟人聊天系统/演示材料/${file_name}`,
          aux_ref_audio_paths: [],
          prompt_lang: 'zh',
          prompt_text: audioText,
          top_k: 5,
          top_p: 1,
          temperature: 1,
          text_split_method: 'cut0',
          batch_size: 1,
          batch_threshold: 0.75,
          split_bucket: true,
          speed_factor: 1.0,
          fragment_interval: 0.3,
          seed: -1,
          media_type: 'wav',
          streaming_mode: false,
          parallel_infer: true,
          repetition_penalty: 1.35
        }
        // POST请求tts
        const audio_res = await get('http://127.0.0.1:9880/tts', tts_params, 'arraybuffer');
        if (audio_res.status === 200 && audio_res.data) {
          const audioBlob = new Blob([audio_res.data], { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audio.play();
        } else {
          ElMessage.error(audio_res.msg || '语音合成失败');
        }
      }
    } catch (error) {
      console.error('sendMessage error', error);
      ElMessage.error('获取回复失败，请稍后重试');
      loadingMessage.value.content = '获取回复失败，请稍后重试';
      loadingMessage.value.loading = false;
      nextTick(() => {
        scrollToBottom();
      });
    }
  }
};

const scrollToBottom = () => {
  if (chatMessagesRef.value) {
    chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
  }
};

const toggleCustomRecording = async () => {
  if (!isCustomRecording.value) {
    // 开始录制
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      customRecorder = new MediaRecorder(stream)
      customChunks = []
      customRecorder.ondataavailable = (e) => {
        customChunks.push(e.data)
      }
      customRecorder.onstop = () => {
        const blob = new Blob(customChunks, { type: 'audio/wav' })
        customRecordUrl.value = URL.createObjectURL(blob)
        clearInterval(customRecordTimer)
        customRecordTime.value = formatTime(0)
      }
      customRecorder.start()
      isCustomRecording.value = true
      customRecordStart = Date.now()
      customRecordTime.value = '00:00'
      customRecordTimer = setInterval(() => {
        const sec = Math.floor((Date.now() - customRecordStart) / 1000)
        customRecordTime.value = formatTime(sec)
      }, 200)
    } catch (e) {
      ElMessage.error('无法访问麦克风')
    }
  } else {
    // 结束录制
    if (customRecorder && isCustomRecording.value) {
      customRecorder.stop()
      isCustomRecording.value = false
      clearInterval(customRecordTimer)
    }
  }
}
function formatTime(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}
const deleteCustomRecord = () => {
  customRecordUrl.value = ''
  customRecordName.value = ''
  customRecordText.value = ''
}
const confirmCustomRecord = async () => {
  if (!customRecordName.value.trim()) {
    ElMessage.warning('请为配音命名')
    return
  }
  if (!customRecordText.value.trim()) {
    ElMessage.warning('请填写音频对应的文字内容')
    return
  }
  if (!customRecordUrl.value) {
    ElMessage.warning('请先录制或上传音频')
    return
  }
  const audioBlob = await fetch(customRecordUrl.value).then(r => r.blob())
  const formData = new FormData()
  formData.append('audio', audioBlob, customRecordName.value.trim() + '.wav')
  formData.append('audio_name', customRecordName.value.trim())
  formData.append('audio_text', customRecordText.value.trim())
  let fileName = ''
  if (customDialogMode.value === 'upload' && customRecordUrl.value && window._lastUploadFileName) {
    fileName = window._lastUploadFileName
  } else {
    fileName = customRecordName.value.trim() + '.wav'
  }
  try {
    const res = await post('/upload_audio', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    if (res && res.data.status === 200 && res.data.audio_id) {
      let list = []
      try {
        list = JSON.parse(localStorage.getItem('audio_list') || '[]')
      } catch {}
      const newItem = { audio_id: res.data.audio_id, audio_name: customRecordName.value.trim(), audio_text: customRecordText.value.trim(), local_dir: customRecordUrl.value, file_name: fileName }
      list.push(newItem)
      localStorage.setItem('audio_list', JSON.stringify(list))
      audioList.value = list
      selectedVoice.value = res.data.audio_id
      showCustomRecordDialog.value = false
      ElMessage.success(res.data.msg || '配音已确认并上传！')
    } else {
      ElMessage.error(res?.data?.msg || '上传失败')
    }
  } catch (e) {
    ElMessage.error('上传失败')
  }
}
const resetCustomRecord = () => {
  isCustomRecording.value = false
  customRecordUrl.value = ''
  customRecordTime.value = '00:00'
  customRecordName.value = ''
  customRecordText.value = ''
  clearInterval(customRecordTimer)
}

// 上传音频相关
const beforeCustomUpload = (file) => {
  // 只允许音频
  if (!file.type.startsWith('audio/')) {
    ElMessage.error('只能上传音频文件')
    return false
  }
  return true
}
const onCustomUploadChange = (file) => {
  const url = URL.createObjectURL(file.raw)
  customRecordUrl.value = url
  window._lastUploadFileName = file.raw.name
  customRecordName.value = file.raw.name.replace(/\.wav$/i, '') // 去掉扩展名
  // 你可以把 file.raw.name 存到 localStorage 或 audio_list
}
</script>

<style scoped>
.ai-practice-container {
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e8f0fe 100%);
}

.history-panel {
  height: 100vh;
  width: 260px;
  background-color: #ffffff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.new-chat-container {
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.model-select-label {
  font-size: 15px;
  color: #333;
  font-weight: bold;
  margin-bottom: 6px;
  margin-left: 2px;
}

.model-select-bar {
  width: 100%;
  padding-bottom: 8px;
}

.model-select {
  width: 100%;
}

.voice-select-label {
  font-size: 15px;
  color: #333;
  font-weight: bold;
  margin-bottom: 6px;
  margin-left: 2px;
}

.voice-select-bar {
  width: 100%;
}

.new-chat-btn {
  width: 100%;
  padding: 12px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: background-color 0.3s;
}

.new-chat-btn:hover {
  background-color: #66b1ff;
}

.plus-icon {
  margin-left: 8px;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  list-style: none;
  padding: 0;
  margin: 0;
}

.history-list li {
  padding: 12px 20px;
  cursor: pointer;
  transition: background-color 0.3s;
  border-bottom: 1px solid #f0f2f5;
}

.history-list li:hover {
  background-color: #f5f7fa;
}

.history-list li.active {
  background-color: #ecf5ff;
  color: #409eff;
}

.chat-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: none;
  height: 100vh;
  justify-content: flex-start;
}

.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
  justify-content: flex-start;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.message {
  display: flex;
  margin-bottom: 20px;
  align-items: flex-start;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f2f5;
}

.character-icon {
  font-size: 24px;
  color: #409eff;
}

.user-icon {
  font-size: 24px;
  color: #67c23a;
}

.content {
  display: inline-block;
  min-width: 32px;
  max-width: 80%;
  width: auto;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-all;
  background-color: #e3eaf6;
  box-sizing: border-box;
  transition: background 0.2s, width 0.2s, height 0.2s;
  vertical-align: top;
}

.message.assistant .content {
  background-color: #b7d3f6;
}

.message.user {
  flex-direction: row-reverse;
}

.message.user .avatar {
  margin-right: 0;
  margin-left: 12px;
}

.message.user .content {
  background-color: #c6e5c6;
  text-align: right;
}

.input-area {
  padding: 0 0 32px 0;
  background: none;
  display: flex;
  justify-content: center;
  margin-top: 0;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 20px;
  padding: 12px 22px;
  box-shadow: 0 2px 12px 0 rgba(64,158,255,0.10);
  width: 80vw;
  max-width: 900px;
  min-width: 320px;
}

.input-icon {
  font-size: 20px;
  color: #909399;
  margin-right: 8px;
}

input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-size: 14px;
  color: #606266;
}

.button-group {
  display: flex;
  align-items: center;
}

.separator {
  width: 1px;
  height: 20px;
  background-color: #dcdfe6;
  margin: 0 12px;
}

.send-button {
  padding: 8px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.3s;
}

.send-button:hover {
  background-color: #66b1ff;
}

.send-button:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}

.disclaimer {
  text-align: center;
  padding: 10px;
  color: #909399;
  font-size: 12px;
  background-color: #f5f7fa;
}

/* 修改喇叭控制开关样式，使其更大更形象 */
.audio-switch-bar {
  position: absolute;
  top: 20px;
  right: 32px;
  z-index: 10;
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.85);
  border-radius: 8px;
  padding: 6px 16px 6px 12px;
  box-shadow: 0 2px 12px 0 rgba(64,158,255,0.10);
}
.audio-switch-label {
  font-size: 16px;
  color: #409eff;
  font-weight: bold;
  letter-spacing: 1px;
}

.custom-voice-dialog-content {
  padding: 0 2px 0 2px;
}
.custom-voice-title {
  font-size: 15px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 10px;
}
.custom-voice-btns {
  display: flex;
  gap: 12px;
  margin-bottom: 6px;
  align-items: center;
}
.custom-voice-tip {
  color: #f56c6c;
  font-size: 13px;
  margin-top: 4px;
}
.custom-voice-audio {
  width: 100%;
  max-width: 100%;
}
.custom-voice-timer {
  color: #409eff;
  font-size: 15px;
  font-weight: bold;
  margin-left: 8px;
}
.custom-voice-confirm-btn {
  margin-top: 10px;
  width: 100%;
}
.custom-voice-name-input {
  width: 100%;
  margin-bottom: 8px;
}
.custom-voice-text-input {
  width: 100%;
  margin-bottom: 8px;
}
.custom-upload {
  margin-right: 12px;
}
</style>