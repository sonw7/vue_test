<template>
  <el-menu
    :default-active="activeIndex"
    class="nav-menu"
    mode="horizontal"
    router
    @select="handleSelect"
  >
    <div class="logo-container">
      <h1>三维地质可视化</h1>
    </div>
    <el-menu-item index="/">首页</el-menu-item>
    <el-menu-item index="/3d-view">三维视图</el-menu-item>
    <!-- <el-menu-item index="/config">配置面板</el-menu-item> -->

    <div class="right-menu">
      <el-button type="primary" @click="toggleConfigPanel">
        {{ configPanelVisible ? '隐藏配置' : '显示配置' }}
      </el-button>
    </div>
  </el-menu>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useThreeStore } from '../../store/threeStore'

const route = useRoute()
const threeStore = useThreeStore()

const activeIndex = computed(() => route.path)
const configPanelVisible = computed(() => threeStore.configPanelVisible)

const handleSelect = (key) => {
  console.log('选择菜单项:', key)
}

const toggleConfigPanel = () => {
  threeStore.toggleConfigPanel()
}
</script>

<style scoped>
.nav-menu {
  display: flex;
  align-items: center;
  height: 60px;
}

.logo-container {
  padding: 0 20px;
  margin-right: 20px;
  height: 100%;
  display: flex;
  align-items: center;
}

.logo-container h1 {
  font-size: 18px;
  color: #409EFF;
  margin: 0;
}

.right-menu {
  margin-left: auto;
  margin-right: 20px;
}
</style> 