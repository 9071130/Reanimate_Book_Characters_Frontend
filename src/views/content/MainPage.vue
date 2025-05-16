<template>
  <el-container class="layout-container-demo" style="height: 100%">
    <!-- 左侧导航栏 -->
    <el-aside width="100px" class="sidebar">
      <!-- 添加气泡容器 -->
      <div class="bubbles">
        <div v-for="n in 20" :key="n" class="bubble" 
             :style="{ 
               '--delay': `${Math.random() * 8}s`, 
               '--size': `${5 + Math.random() * 8}px`,
               '--left': `${Math.random() * 100}%`
             }">
        </div>
      </div>
      
      <el-scrollbar>
        <div class="top1-logo nav-logo">
          <el-icon class="logo-icon"><Reading /></el-icon>
        </div>
        
        <el-menu class="transparent-menu">
          <div class="nav-menu-item" 
               :class="{ 'active': currentComponent === 'NovelPage' }"
               @click="selectComponent('NovelPage')">
            <el-icon><Document/></el-icon>
            <span>{{ lang === 'zh' ? '数据集制作' : 'Dataset Creation' }}</span>
          </div>
          <div class="nav-menu-item" 
               :class="{ 'active': currentComponent === 'ModelTrainPage' }"
               @click="selectComponent('ModelTrainPage')">
            <el-icon><Setting/></el-icon>
            <span>{{ lang === 'zh' ? '模型训练' : 'Model Training' }}</span>
          </div>
          <div class="nav-menu-item" 
               :class="{ 'active': currentComponent === 'ChatPage' }"
               @click="selectComponent('ChatPage')">
            <el-icon><ChatDotSquare/></el-icon>
            <span>{{ lang === 'zh' ? '对话' : 'Chat' }}</span>
          </div>
          <div class="nav-menu-item" 
               :class="{ 'active': currentComponent === 'SettingsPage' }"
               @click="selectComponent('SettingsPage')">
            <el-icon><Setting/></el-icon>
            <span>{{ lang === 'zh' ? '设置' : 'Settings' }}</span>
          </div>
        </el-menu>
        
        <!-- 底部图标部分 -->
        <div class="bottom-icons">
          <el-button class="icon-button" @click="handleToolsClick">
            <el-icon><Tools /></el-icon>
          </el-button>
          <el-button class="icon-button" @click="handleHomeClick">
            <el-icon><HomeFilled /></el-icon>
          </el-button>
        </div>
      </el-scrollbar>
    </el-aside>
    <!-- 功能页面 -->
    <el-main>
      <div>
        <component :is="showComponent"></component>
      </div>
    </el-main>
  </el-container>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'
import type { Component } from 'vue'
import { useRouter } from 'vue-router'
import ChatPage from "@/views/content/chat/ChatPage.vue";
import NovelPage from "@/views/content/novel/NovelPage.vue";
import CharacterPage from "@/views/content/character/CharacterPage.vue";
import EmptyPage from "@/views/content/empty/EmptyPage.vue";
import ModelTrainPage from "@/views/content/model/ModelTrainPage.vue";
import { 
  ChatDotSquare, 
  User, 
  Document, 
  Setting, 
  Tools, 
  HomeFilled,
  Reading
} from '@element-plus/icons-vue'

// 修改这一行，明确指定 showComponent 的类型
const showComponent = ref<Component>(NovelPage)
const currentComponent = ref('NovelPage')  // 新增：跟踪当前选中的组件
const router = useRouter()
const lang = ref(localStorage.getItem('site_lang') || 'zh')

const selectComponent = (component: string) => {
  currentComponent.value = component
  switch (component) {
    case 'ModelTrainPage':
      showComponent.value = ModelTrainPage
      break
    case 'NovelPage':
      showComponent.value = NovelPage
      break
    case 'ChatPage':
      showComponent.value = ChatPage
      break
    case 'SettingsPage':
      showComponent.value = EmptyPage
      break
  }
}

const handleToolsClick = () => {
  // 处理工具图标点击事件
  console.log('工具图标被点击')
}

const handleHomeClick = () => {
  // 处理首页图标点击事件
  console.log('首页图标被点击')
}

// 监听语言变化事件
onMounted(() => {
  window.addEventListener('languageChanged', () => {
    lang.value = localStorage.getItem('site_lang') || 'zh'
  })
})

onUnmounted(() => {
  window.removeEventListener('languageChanged', () => {
    lang.value = localStorage.getItem('site_lang') || 'zh'
  })
})
</script>

<style scoped>
.layout-container-demo .el-aside {
  color: var(--el-text-color-primary);
}

.sidebar {
  position: relative;
  overflow: hidden;
  background: linear-gradient(to bottom, 
    #2c3e50 0%,
    #34495e 20%,
    #2c3e50 40%,
    #2c3e50 60%,
    #34495e 80%,
    #2c3e50 100%
  );
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  user-select: none;
}

.layout-container-demo .el-header {
  position: relative;
  background-color: var(--el-color-primary-light-7);
  color: var(--el-text-color-primary);
}

.layout-container-demo .el-menu {
  border-right: none;
}

.layout-container-demo .el-main {
  padding: 0;
}

.layout-container-demo .toolbar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  right: 20px;
}

.transparent-menu {
  background-color: transparent;
}

.nav-menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: transparent !important;
  height: auto;
  padding: 28px 10px;
  color: #ffffff;
  transition: all 0.3s ease;
  user-select: none;
  position: relative;
  overflow: hidden;
}

.nav-menu-item .el-icon {
  font-size: 24px;
  margin-bottom: 5px;
  transition: transform 0.3s ease;
}

.nav-menu-item span {
  font-size: 12px;
  font-weight: bold;
}

.nav-menu-item::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.3s ease, height 0.3s ease;
}

.nav-menu-item.active::before {
  width: 80px;
  height: 80px;
}

.nav-menu-item.active {
  color: #ffffff;
  font-weight: bold;
}

.nav-menu-item:hover .el-icon {
  transform: scale(1.2);
}

.nav-menu-item:hover {
  transform: none;
}

.bottom-icons {
  position: absolute;
  bottom: 30px;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
}

.icon-button {
  background: transparent;
  border: none;
  padding: 8px 0;
  margin: 4px 0;
  width: 100%;
  height: 35px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.icon-button + .icon-button {
  margin-top: 25px;
}

.icon-button:hover {
  color: #f0f9ff;
  transform: scale(1.1);
}

.nav-logo {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px 0;
}

.logo-icon {
  font-size: 40px;
  color: #ffffff;
  transition: transform 0.3s ease;
}

.logo-icon:hover {
  transform: scale(1.1);
}

/* 修改气泡样式 */
.bubble {
  position: absolute;
  left: var(--left);
  bottom: -10px;
  width: var(--size);
  height: var(--size);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: rise 12s infinite ease-in;
  animation-delay: var(--delay);
}

@keyframes rise {
  0% {
    transform: translateY(0) translateX(0);
    opacity: 0;
  }
  20% {
    opacity: 0.5;
  }
  40% {
    transform: translateY(-30vh) translateX(5px);
  }
  60% {
    opacity: 0.7;
  }
  80% {
    transform: translateY(-60vh) translateX(-5px);
  }
  100% {
    transform: translateY(-100vh) translateX(3px);
    opacity: 0;
  }
}

.bubbles {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
  opacity: 0.7;
}

.el-scrollbar {
  position: relative;
  z-index: 1;
}
</style>
