  // 在 src/components/Menu/menuHandlers.js 中添加
  import { LayerDistanceCalculator } from '../../utils/layerDistanceCalculator';
// 保存计算器实例
let distanceCalculator = null;
let distanceLegend = null;
const originalMaterialProperties = new Map();

export function handleMenuChange({ key, value }, sceneManager) {
    console.debug(`菜单项 ${key} 值变更为:`, value);
  
    if (key === "controlType") {
      sceneManager.switchControl(value);
    } else if (key === "moveSpeed" || key === "lookSpeed") {
      sceneManager.updateControlParams("firstPerson", {
        [key === "moveSpeed" ? "movementSpeed" : "lookSpeed"]: value,
      });
    }
      // 处理地层选择变化
  if (key === 'layerSelect') {
    // 当选择新地层时，重置透明度滑块到当前地层的透明度
    const meshes = sceneManager.getMeshesByLayer(value);
    if (meshes && meshes.length > 0) {
      const currentOpacity = meshes[0].material.opacity;
      
      // 更新透明度滑块的值
      const opacitySlider = document.querySelector('[data-key="layerOpacity"]');
      if (opacitySlider) {
        opacitySlider.value = currentOpacity;
        
        // 触发 change 事件更新显示值
        const event = new Event('input');
        opacitySlider.dispatchEvent(event);
      }
    }
  }
  
  // 处理透明度变化
  if (key === 'layerOpacity') {
    const selectedLayer = document.querySelector('[data-key="layerSelect"]')?.value;
    if (selectedLayer) {
      setLayerOpacity(sceneManager, selectedLayer, value);
    }
  }
      // 地层间距计算相关的选择
  if (key === 'sourceLayer' || key === 'targetLayer') {
    console.log(`选择${key === 'sourceLayer' ? '源' : '目标'}地层: ${value}`);
  }
  }
  
  export function handleMenuAction(key, sceneManager) {
    console.log(`触发菜单动作:`, key);
  
    if (key === "resetView") {
      console.log("重置相机")
      sceneManager.resetCamera();
    }
     // 重置地层透明度
  if (key === 'resetLayerOpacity') {
    resetAllLayerOpacity(sceneManager);
  }
      
// 地层间距计算
if (key === 'calculateDistance') {
  const sourceLayer = document.querySelector('[data-key="sourceLayer"]')?.value;
  const targetLayer = document.querySelector('[data-key="targetLayer"]')?.value;
  
  if (!sourceLayer || !targetLayer) {
    alert('请先选择源地层和目标地层');
    return;
  }
  
  if (sourceLayer === targetLayer) {
    alert('源地层和目标地层不能相同');
    return;
  }
  
  console.log(`计算地层 ${sourceLayer} 到 ${targetLayer} 的垂直距离`);
  
  // 初始化计算器
  if (!distanceCalculator) {
    distanceCalculator = new LayerDistanceCalculator(sceneManager);
  }
  
  // 只显示选定的地层，隐藏其他地层
  distanceCalculator.showOnlySelectedLayers(sourceLayer, targetLayer);
  
  // 计算距离
  const results = distanceCalculator.calculateVerticalDistance(sourceLayer, targetLayer);
  
  if (results) {
    // 移除旧图例
    if (distanceLegend && distanceLegend.parentNode) {
      distanceLegend.parentNode.removeChild(distanceLegend);
    }
    
    // 创建并显示新图例
    distanceLegend = distanceCalculator.createDistanceLegend();
    if (distanceLegend) {
      document.body.appendChild(distanceLegend);
    }
    
    // 显示统计信息
    const distances = results.points.map(p => p.distance);
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    
    console.log(`计算完成。平均距离: ${avgDistance.toFixed(2)}米`);
    console.log(`最小距离: ${Math.min(...distances).toFixed(2)}米`);
    console.log(`最大距离: ${Math.max(...distances).toFixed(2)}米`);
  }
}

// 重置地层
if (key === 'resetLayers') {
  if (distanceCalculator) {
    distanceCalculator.resetLayers();
    
    // 移除图例
    if (distanceLegend && distanceLegend.parentNode) {
      distanceLegend.parentNode.removeChild(distanceLegend);
      distanceLegend = null;
    }
  }
}
  }



/**
 * 设置指定地层的透明度
 * @param {Object} sceneManager - 场景管理器
 * @param {string} layerName - 地层名称
 * @param {number} opacity - 透明度值 (0-1)
 */
function setLayerOpacity(sceneManager, layerName, opacity) {
  const meshes = sceneManager.getMeshesByLayer(layerName);
  if (!meshes || meshes.length === 0) return;
  
  meshes.forEach(mesh => {
    if (!mesh.material) return;
    
    // 保存原始材质属性（如果尚未保存）
    if (!originalMaterialProperties.has(mesh.uuid)) {
      originalMaterialProperties.set(mesh.uuid, {
        opacity: mesh.material.opacity,
        transparent: mesh.material.transparent,
        depthWrite: mesh.material.depthWrite
      });
    }
    
    // 设置透明度
    mesh.material.opacity = opacity;
    
    // 如果透明度小于1，需要启用透明模式
    if (opacity < 1) {
      mesh.material.transparent = true;
      
      // 当透明度很低时，可以禁用深度写入以避免排序问题
      mesh.material.depthWrite = opacity > 0.5;
    } else {
      // 如果是完全不透明，可以恢复原始设置
      const originalProps = originalMaterialProperties.get(mesh.uuid);
      if (originalProps) {
        mesh.material.transparent = originalProps.transparent;
        mesh.material.depthWrite = originalProps.depthWrite;
      }
    }
    
    // 标记材质需要更新
    mesh.material.needsUpdate = true;
  });
  
  // console.log(`设置地层 ${layerName} 的透明度为 ${opacity}`);
}

/**
 * 重置所有地层的透明度为原始值
 * @param {Object} sceneManager - 场景管理器
 */
function resetAllLayerOpacity(sceneManager) {
  // 获取所有图层
  const allLayers = sceneManager.getKeysArray();
  
  allLayers.forEach(layerName => {
    const meshes = sceneManager.getMeshesByLayer(layerName);
    if (!meshes) return;
    
    meshes.forEach(mesh => {
      if (!mesh.material) return;
      
      // 恢复原始材质属性
      const originalProps = originalMaterialProperties.get(mesh.uuid);
      if (originalProps) {
        mesh.material.opacity = originalProps.opacity;
        mesh.material.transparent = originalProps.transparent;
        mesh.material.depthWrite = originalProps.depthWrite;
        mesh.material.needsUpdate = true;
      }
    });
  });
  
  // 清除保存的原始材质属性
  originalMaterialProperties.clear();
  
  console.log('已重置所有地层的透明度');
  
  // 重置透明度滑块的值
  const opacitySlider = document.querySelector('[data-key="layerOpacity"]');
  if (opacitySlider) {
    opacitySlider.value = 1;
    
    // 触发 change 事件更新显示值
    const event = new Event('input');
    opacitySlider.dispatchEvent(event);
  }
}