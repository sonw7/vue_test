  // 在 src/components/Menu/menuHandlers.js 中添加
  import { LayerDistanceCalculator } from '../../utils/layerDistanceCalculator';
// 保存计算器实例
let distanceCalculator = null;
let distanceLegend = null;
export function handleMenuChange({ key, value }, sceneManager) {
    console.log(`菜单项 ${key} 值变更为:`, value);
  
    if (key === "controlType") {
      sceneManager.switchControl(value);
    } else if (key === "moveSpeed" || key === "lookSpeed") {
      sceneManager.updateControlParams("firstPerson", {
        [key === "moveSpeed" ? "movementSpeed" : "lookSpeed"]: value,
      });
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



