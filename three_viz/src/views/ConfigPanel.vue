<template>
  <div class="config-panel-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <h2>系统配置</h2>
            </div>
          </template>
          
          <el-tabs v-model="activeTab" tab-position="left" style="min-height: 500px;">
            <el-tab-pane label="图层设置" name="layers">
              <h3>图层显示设置</h3>
              <p>在此页面可以单独配置各个图层的显示参数</p>
              
              <el-divider />
              
              <el-form label-position="top">
                <el-form-item label="选择图层">
                  <el-select v-model="selectedLayer" placeholder="请选择图层">
                    <el-option-group
                      v-for="group in layerGroups"
                      :key="group.label"
                      :label="group.label"
                    >
                      <el-option
                        v-for="layer in group.options"
                        :key="layer.value"
                        :label="layer.label"
                        :value="layer.value"
                      />
                    </el-option-group>
                  </el-select>
                </el-form-item>
                
                <template v-if="selectedLayer">
                  <el-form-item label="透明度">
                    <el-slider 
                      v-model="layerOpacity" 
                      :min="0" 
                      :max="1" 
                      :step="0.1"
                      @change="updateLayerOpacity"
                    />
                  </el-form-item>
                  
                  <el-form-item label="可见性">
                    <el-switch v-model="layerVisible" @change="updateLayerVisibility" />
                  </el-form-item>
                </template>
              </el-form>
            </el-tab-pane>
            
            <el-tab-pane label="等值线设置" name="contour">
              <h3>等值线配置</h3>
              <p>配置等值线的显示参数</p>
              
              <el-divider />
              
              <el-form label-position="top">
                <el-form-item label="启用等值线">
                  <el-switch v-model="contourEnabled" @change="updateContourEnabled" />
                </el-form-item>
                
                <template v-if="contourEnabled">
                  <el-form-item label="选择地层">
                    <el-select 
                      v-model="contourLayer" 
                      placeholder="请选择地层"
                      @change="updateContourLayer"
                    >
                      <el-option
                        v-for="layer in layerGroups.find(g => g.label === '地层')?.options || []"
                        :key="layer.value"
                        :label="layer.label"
                        :value="layer.value"
                      />
                    </el-select>
                  </el-form-item>
                  
                  <el-form-item label="等值线数量">
                    <el-slider 
                      v-model="contourParams.count" 
                      :min="1" 
                      :max="30" 
                      :step="1"
                      @change="(val) => updateContourParam('count', val)"
                    />
                  </el-form-item>
                  
                  <el-form-item label="等值线颜色">
                    <el-color-picker 
                      v-model="contourParams.color"
                      @change="(val) => updateContourParam('color', val)"
                    />
                  </el-form-item>
                  
                  <el-form-item label="等值线透明度">
                    <el-slider 
                      v-model="contourParams.opacity" 
                      :min="0" 
                      :max="1" 
                      :step="0.1"
                      @change="(val) => updateContourParam('opacity', val)"
                    />
                  </el-form-item>
                </template>
              </el-form>
            </el-tab-pane>
            
            <el-tab-pane label="视图设置" name="view">
              <h3>视图设置</h3>
              <p>配置三维视图的显示参数</p>
              
              <el-divider />
              
              <el-form label-position="top">
                <el-form-item label="背景颜色">
                  <el-color-picker v-model="backgroundColor" @change="updateBackgroundColor" />
                </el-form-item>
                
                <el-form-item label="光照强度">
                  <el-slider 
                    v-model="lightIntensity" 
                    :min="0" 
                    :max="2" 
                    :step="0.1"
                    @change="updateLightIntensity"
                  />
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="applySettings">应用设置</el-button>
                  <el-button @click="resetSettings">重置</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useThreeStore } from '../store/threeStore'
import { useRouter } from 'vue-router'

const threeStore = useThreeStore()
const router = useRouter()

// 标签页
const activeTab = ref('layers')

// 图层相关
const layerGroups = ref([
  {
    label: '地层',
    options: []
  },
  {
    label: '断层',
    options: []
  },
  {
    label: '钻孔',
    options: []
  }
])
const selectedLayer = ref('')
const layerOpacity = ref(1.0)
const layerVisible = ref(true)

// 等值线相关
const contourEnabled = computed({
  get: () => threeStore.contourEnabled,
  set: (val) => threeStore.toggleContourLines(val)
})
const contourLayer = computed({
  get: () => threeStore.activeContourLayer,
  set: (val) => threeStore.setActiveContourLayer(val)
})
const contourParams = computed(() => threeStore.contourParams)

// 视图相关
const backgroundColor = ref('#000000')
const lightIntensity = ref(1.0)

// 更新图层透明度
const updateLayerOpacity = (value) => {
  // 这里需要通过store更新图层的透明度
  console.log(`更新图层 ${selectedLayer.value} 的透明度为 ${value}`)
}

// 更新图层可见性
const updateLayerVisibility = (value) => {
  threeStore.setLayerVisibility(selectedLayer.value, value)
}

// 更新等值线启用状态
const updateContourEnabled = (value) => {
  threeStore.toggleContourLines(value)
}

// 更新等值线图层
const updateContourLayer = (value) => {
  threeStore.setActiveContourLayer(value)
}

// 更新等值线参数
const updateContourParam = (param, value) => {
  threeStore.updateContourParam(param, value)
}

// 更新背景颜色
const updateBackgroundColor = (value) => {
  console.log(`更新背景颜色为 ${value}`)
}

// 更新光照强度
const updateLightIntensity = (value) => {
  console.log(`更新光照强度为 ${value}`)
}

// 应用设置
const applySettings = () => {
  // 应用所有设置并跳转到三维视图
  router.push('/3d-view')
}

// 重置设置
const resetSettings = () => {
  // 重置所有设置为默认值
  layerOpacity.value = 1.0
  layerVisible.value = true
  backgroundColor.value = '#000000'
  lightIntensity.value = 1.0
}

// 初始化
onMounted(() => {
  // 从store获取图层信息
  const layerVisibility = threeStore.layerVisibility
  
  // 构建图层选项
  Object.entries(layerVisibility).forEach(([name, isVisible]) => {
    // 简单判断图层类型
    let groupName = '其他'
    if (name.startsWith('Layer_')) {
      groupName = '地层'
    } else if (name.startsWith('Fault_')) {
      groupName = '断层'
    } else if (name.startsWith('Drill_')) {
      groupName = '钻孔'
    }
    
    // 找到对应的组
    const group = layerGroups.value.find(g => g.label === groupName)
    if (group) {
      group.options.push({
        label: name,
        value: name
      })
    }
  })
})
</script>

<style scoped>
.config-panel-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 18px;
  color: #303133;
}

p {
  color: #606266;
  margin-bottom: 20px;
}
</style>