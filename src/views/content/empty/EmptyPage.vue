<template>
  <div>
    <h1>{{ lang === 'zh' ? '欢迎来到空页面！' : 'Welcome to Empty Page!' }}</h1>
    <el-button @click="toggleLang">
      {{ lang === 'zh' ? '切换为英文' : 'Switch to Chinese' }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const lang = ref(localStorage.getItem('site_lang') || 'zh')

const toggleLang = () => {
  lang.value = lang.value === 'zh' ? 'en' : 'zh'
  localStorage.setItem('site_lang', lang.value)
  // 触发全局事件，通知其他页面语言已切换
  window.dispatchEvent(new Event('languageChanged'))
}
</script>

<style scoped>

</style>