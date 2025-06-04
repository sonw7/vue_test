<template>
  <div class="three-view-container">
    <ThreeScene ref="threeSceneRef" />
    <div v-if="configPanelVisible" class="config-sidebar">
      <div class="config-header">
        <h3>配置面板</h3>
        <el-button type="text" @click="closeConfigPanel">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
      
      <el-tabs v-model="activeTab">
        <el-tab-pane label="图层控制" name="layers">
          <div class="tab-content">
            <h4>图层显示控制</h4>
            <div v-for="[group, name] in layerNames" :key="`${group}-${name}`" class="layer-item">
              <el-checkbox 
                v-model="layerVisibility[name]" 
                @change="(val) => onLayerVisibilityChange(name, val)"
              >
                {{ group }} - {{ name }}
              </el-checkbox>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="等值线" name="contour">
          <div class="tab-content">
            <h4>等值线控制</h4>
            
            <el-form label-position="top">
              <el-form-item label="启用等值线">
                <el-switch v-model="contourEnabled" @change="onContourEnabledChange" />
              </el-form-item>
              
              <el-form-item label="选择地层">
                <el-select 
                  v-model="activeContourLayer" 
                  placeholder="选择地层"
                  :disabled="!contourEnabled"
                  @change="onActiveContourLayerChange"
                >
                  <el-option 
                    v-for="[group, name] in layerNames.filter(([group]) => group === '地层')" 
                    :key="name"
                    :label="name"
                    :value="name"
                  />
                </el-select>
              </el-form-item>
              
              <el-form-item label="等值线数量">
                <el-slider 
                  v-model="contourParams.count" 
                  :min="1" 
                  :max="30" 
                  :step="1"
                  :disabled="!contourEnabled"
                  @change="(val) => onContourParamChange('count', val)"
                />
              </el-form-item>
              
              <el-form-item label="等值线颜色">
                <el-color-picker 
                  v-model="contourParams.color"
                  :disabled="!contourEnabled"
                  @change="(val) => onContourParamChange('color', val)"
                />
              </el-form-item>
              
              <el-form-item label="等值线透明度">
                <el-slider 
                  v-model="contourParams.opacity" 
                  :min="0" 
                  :max="1" 
                  :step="0.1"
                  :disabled="!contourEnabled"
                  @change="(val) => onContourParamChange('opacity', val)"
                />
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="视角控制" name="camera">
          <div class="tab-content">
            <h4>相机控制</h4>
            <el-button @click="resetCamera">重置视角</el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>
，
<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useThreeStore } from '../store/threeStore'
import ThreeScene from '../components/webthree/components/ThreeScene.vue'
import { Close } from '@element-plus/icons-vue'

const threeStore = useThreeStore()
const threeSceneRef = ref(null)

// 从store获取状态   这个组件关键样例
const configPanelVisible = computed(() => threeStore.configPanelVisible)
const activeTab = computed({
  get: () => threeStore.activeConfigTab,
  set: (val) => threeStore.setActiveConfigTab(val)
})

// 图层相关
const layerNames = ref([])
const layerVisibility = reactive({})

// 等值线相关
const contourEnabled = computed({
  get: () => threeStore.contourEnabled,
  set: (val) => threeStore.toggleContourLines(val)
})
const activeContourLayer = computed({
  get: () => threeStore.activeContourLayer,
  set: (val) => threeStore.setActiveContourLayer(val)
})
const contourParams = computed(() => threeStore.contourParams)

// 关闭配置面板
const closeConfigPanel = () => {
  threeStore.toggleConfigPanel(false)
}

// 图层可见性变更
const onLayerVisibilityChange = (layerName, isVisible) => {
  threeStore.setLayerVisibility(layerName, isVisible)
  
  // 如果ThreeScene组件已挂载，调用其图层切换方法
  if (threeSceneRef.value) {
    const activeLayers = Object.entries(layerVisibility)
      .filter(([_, visible]) => visible)
      .map(([name]) => name)
    
    threeSceneRef.value.onLayerToggle(activeLayers)
  }
}

// 等值线控制
const onContourEnabledChange = (enabled) => {
  if (threeSceneRef.value) {
    threeSceneRef.value.toggleContourLines(enabled)
  }
}

const onActiveContourLayerChange = (layerName) => {
  if (threeSceneRef.value) {
    threeSceneRef.value.updateActiveContourLayer(layerName)
  }
}

const onContourParamChange = (param, value) => {
  threeStore.updateContourParam(param, value)
  
  if (threeSceneRef.value) {
    threeSceneRef.value.updateContourParam(param, value)
  }
}

// 相机控制
const resetCamera = () => {
  if (threeSceneRef.value && threeSceneRef.value.sceneManager) {
    threeSceneRef.value.sceneManager.resetCamera()
  }
}

// 监听ThreeScene组件的挂载，获取图层信息
onMounted(() => {
  // 等待ThreeScene组件初始化完成
  setTimeout(() => {
    if (threeSceneRef.value) {
      // 获取图层名称
      layerNames.value = threeSceneRef.value.layerNames || []
      
      // 初始化图层可见性
      layerNames.value.forEach(([_, name]) => {
        layerVisibility[name] = true
      })
      
      // 更新store中的图层可见性
      threeStore.updateLayerVisibility(layerVisibility)
    }
  }, 1000) // 给予足够时间让ThreeScene组件加载数据
})

// 监听store中图层可见性的变化
watch(() => threeStore.layerVisibility, (newVisibility) => {
  Object.entries(newVisibility).forEach(([name, isVisible]) => {
    layerVisibility[name] = isVisible
  })
}, { deep: true })
</script>

<style scoped>
.three-view-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.config-sidebar {
  position: absolute;
  top: 0;
  right: 0;
  width: 300px;
  height: 100%;
  background-color: #fff;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
  padding: 15px;
  overflow-y: auto;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.config-header h3 {
  margin: 0;
  font-size: 16px;
}

.tab-content {
  padding: 10px 0;
}

.tab-content h4 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 14px;
  color: #606266;
}

.layer-item {
  margin-bottom: 10px;
}
</style>