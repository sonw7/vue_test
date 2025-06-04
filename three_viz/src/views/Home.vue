<template>
  <div class="home-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="welcome-card">
          <h1>欢迎使用三维地质可视化系统</h1>
          <p>本系统提供地质数据的三维可视化与交互功能，帮助用户更好地理解地质结构</p>
          <div class="action-buttons">
            <el-button type="primary" @click="goToView">进入三维视图</el-button>
            <el-button @click="goToConfig">配置参数</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="feature-row">
      <el-col :span="8">
        <el-card class="feature-card">
          <template #header>
            <div class="card-header">
              <h3>三维可视化</h3>
            </div>
          </template>
          <p>基于Three.js的高性能三维渲染，支持大规模地质数据的可视化展示</p>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="feature-card">
          <template #header>
            <div class="card-header">
              <h3>图层管理</h3>
            </div>
          </template>
          <p>灵活的图层控制系统，可以自由切换不同地质层的显示与隐藏</p>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="feature-card">
          <template #header>
            <div class="card-header">
              <h3>等值线分析</h3>
            </div>
          </template>
          <p>支持地层等值线生成与显示，帮助分析地质结构的高度变化</p>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToView = () => {
  router.push('/3d-view')
}

const goToConfig = () => {
  router.push('/config')
}
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.welcome-card {
  margin-bottom: 30px;
  text-align: center;
  padding: 30px;
}

.welcome-card h1 {
  font-size: 28px;
  color: #303133;
  margin-bottom: 20px;
}

.welcome-card p {
  font-size: 16px;
  color: #606266;
  margin-bottom: 30px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.feature-row {
  margin-top: 20px;
}

.feature-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}
</style> 