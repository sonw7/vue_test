import { defineStore } from 'pinia'

export const useThreeStore = defineStore('three', {
  state: () => ({
    // 场景控制相关状态
    activeLayer: null,
    layerVisibility: {},
    
    // 等值线相关状态
    contourEnabled: false,
    activeContourLayer: null,
    contourParams: {
      count: 10,
      color: '#000000',
      opacity: 0.7,
      scale: 1.0
    },
    
    // 视图控制
    cameraPosition: { x: 0, y: 10, z: 10 },
    cameraTarget: { x: 0, y: 0, z: 0 },
    
    // 模型相关
    modelCentered: false,
    globalOffset: { x: 0, y: 0, z: 0 },
    
    // 配置面板状态
    configPanelVisible: false,
    activeConfigTab: 'layers'
  }),
  
  getters: {
    // 获取所有可见图层
    visibleLayers: (state) => {
      return Object.entries(state.layerVisibility)
        .filter(([_, isVisible]) => isVisible)
        .map(([layerName]) => layerName)
    },
    
    // 获取当前等值线参数
    currentContourParams: (state) => state.contourParams
  },
  
  actions: {
    // 设置图层可见性
    setLayerVisibility(layerName, isVisible) {
      this.layerVisibility[layerName] = isVisible
    },
    
    // 更新所有图层可见性
    updateLayerVisibility(layerMap) {
      this.layerVisibility = { ...this.layerVisibility, ...layerMap }
    },
    
    // 设置活动图层
    setActiveLayer(layerName) {
      this.activeLayer = layerName
    },
    
    // 切换等值线显示
    toggleContourLines(enabled) {
      this.contourEnabled = enabled
    },
    
    // 设置活动等值线图层
    setActiveContourLayer(layerName) {
      this.activeContourLayer = layerName
    },
    
    // 更新等值线参数
    updateContourParam(param, value) {
      this.contourParams[param] = value
    },
    
    // 更新相机位置
    updateCameraPosition(position) {
      this.cameraPosition = position
    },
    
    // 更新相机目标点
    updateCameraTarget(target) {
      this.cameraTarget = target
    },
    
    // 设置模型居中状态
    setModelCentered(centered) {
      this.modelCentered = centered
    },
    
    // 更新全局偏移量
    updateGlobalOffset(offset) {
      this.globalOffset = offset
    },
    
    // 切换配置面板显示状态
    toggleConfigPanel(visible) {
      this.configPanelVisible = visible !== undefined ? visible : !this.configPanelVisible
    },
    
    // 设置活动配置选项卡
    setActiveConfigTab(tabName) {
      this.activeConfigTab = tabName
    }
  }
}) 