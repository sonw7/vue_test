// src/utils/layerDistanceCalculator.js
import * as THREE from 'three';

export class LayerDistanceCalculator {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.originalMaterials = new Map(); // 存储原始材质
    this.distanceResults = null; // 存储计算结果
    this.hiddenLayers = new Set(); // 存储被隐藏的图层名称
    this.originalVisibility = new Map(); // 存储原始可见性状态
    this._distanceIntervals = null; // 存储距离区间信息
  }

  /**
   * 只显示指定的地层，隐藏其他地层
   * @param {string} sourceLayerName - 源地层名称
   * @param {string} targetLayerName - 目标地层名称
   */
  showOnlySelectedLayers(sourceLayerName, targetLayerName) {
    // 清除之前的记录
    this.hiddenLayers.clear();
    this.originalVisibility.clear();
    
    // 如果 sceneManager 不存在或没有 layers，直接返回
    if (!this.sceneManager || !this.sceneManager.dataLayers) {
      console.warn('SceneManager or layers not available');
      return;
    }
    
    // 获取所有图层名称
    const allLayers = this.sceneManager.getKeysArray();
    console.log("所有图层", allLayers);
    
    // 遍历所有图层，隐藏非源地层和目标地层的图层
    allLayers.forEach(layerName => {
      if (layerName !== sourceLayerName && layerName !== targetLayerName) {
        const meshes = this.sceneManager.getMeshesByLayer(layerName);
        meshes.forEach((mesh) => {
          mesh.visible = false;
        });
      }
    });
    
    console.log(`已隐藏其他图层，仅显示 ${sourceLayerName} 和 ${targetLayerName}`);
  }

  /**
   * 计算两个地层之间的垂直距离
   * @param {string} sourceLayerName - 源地层名称
   * @param {string} targetLayerName - 目标地层名称
   * @returns {Object} 计算结果，包含距离和顶点信息
   */
/**
 * 计算两个地层之间的垂直距离
 * @param {string} sourceLayerName - 源地层名称
 * @param {string} targetLayerName - 目标地层名称
 * @returns {Object} 计算结果，包含距离和顶点信息
 */
/**
 * 计算两个地层之间的垂直距离
 * @param {string} sourceLayerName - 源地层名称
 * @param {string} targetLayerName - 目标地层名称
 * @returns {Object} 计算结果，包含距离和顶点信息
 */
calculateVerticalDistance(sourceLayerName, targetLayerName) {
  const sourceMeshes = this.sceneManager.getMeshesByLayer(sourceLayerName);
  const targetMeshes = this.sceneManager.getMeshesByLayer(targetLayerName);
  
  if (!sourceMeshes.length || !targetMeshes.length) {
    console.error("源地层或目标地层不存在");
    return null;
  }

  // 定义距离系数
  const distanceScale = 10; // 距离乘以10

  // 准备目标地层的三角面
  const targetTriangles = [];
  targetMeshes.forEach(mesh => {
    if (!mesh.geometry) return;
    
    // 确保几何体有索引
    if (!mesh.geometry.index) {
      mesh.geometry.computeVertexNormals();
    }
    
    const position = mesh.geometry.attributes.position;
    const index = mesh.geometry.index;
    
    // 获取世界变换矩阵
    const matrixWorld = mesh.matrixWorld;
    
    // 遍历所有三角形
    for (let i = 0; i < index.count; i += 3) {
      const a = new THREE.Vector3().fromBufferAttribute(position, index.getX(i));
      const b = new THREE.Vector3().fromBufferAttribute(position, index.getX(i + 1));
      const c = new THREE.Vector3().fromBufferAttribute(position, index.getX(i + 2));
      
      // 应用世界变换
      a.applyMatrix4(matrixWorld);
      b.applyMatrix4(matrixWorld);
      c.applyMatrix4(matrixWorld);
      
      targetTriangles.push({ a, b, c });
    }
  });

  console.log(`目标地层 ${targetLayerName} 有 ${targetTriangles.length} 个三角形`);
  
  // 计算源地层每个顶点到目标地层的距离
  const results = [];
  const raycaster = new THREE.Raycaster();
  
  // 预定义几个射线方向（不仅仅是垂直方向）
  const directions = [
    new THREE.Vector3(0, 0, 1),  // 垂直向上
    new THREE.Vector3(0, 0, -1), // 垂直向下
    new THREE.Vector3(0, 1, 0),  // Y轴正方向
    new THREE.Vector3(0, -1, 0), // Y轴负方向
    new THREE.Vector3(1, 0, 0),  // X轴正方向
    new THREE.Vector3(-1, 0, 0)  // X轴负方向
  ];
  
  // 记录处理的顶点总数和无交点顶点数
  let totalVertices = 0;
  let noIntersectionCount = 0;
  
  sourceMeshes.forEach(mesh => {
    if (!mesh.geometry) return;
    
    // 保存原始材质
    if (!this.originalMaterials.has(mesh.uuid)) {
      this.originalMaterials.set(mesh.uuid, mesh.material.clone());
    }
    
    const position = mesh.geometry.attributes.position;
    const matrixWorld = mesh.matrixWorld;
    
    // 创建新的顶点颜色属性
    const colors = new Float32Array(position.count * 3);
    totalVertices += position.count;
    
    // 遍历所有顶点
    for (let i = 0; i < position.count; i++) {
      const vertex = new THREE.Vector3().fromBufferAttribute(position, i);
      vertex.applyMatrix4(matrixWorld);
      
      let minDistance = Infinity;
      let bestIntersection = null;
      
      // 尝试多个方向的射线
      for (const direction of directions) {
        // 设置射线起点和方向
        raycaster.set(vertex, direction.normalize());
        
        // 手动检查与每个三角形的交点
        for (const triangle of targetTriangles) {
          // 计算与射线的交点
          const intersectionPoint = new THREE.Vector3();
          const result = raycaster.ray.intersectTriangle(
            triangle.a, triangle.b, triangle.c, 
            true, // 双面检测，检测正面和背面
            intersectionPoint
          );
          
          if (result) {
            const rawDistance = vertex.distanceTo(intersectionPoint);
            const scaledDistance = rawDistance * distanceScale; // 应用系数
            
            if (scaledDistance < minDistance) {
              minDistance = scaledDistance;
              bestIntersection = {
                point: intersectionPoint.clone(),
                distance: scaledDistance, // 使用缩放后的距离
                direction: direction.clone()
              };
            }
          }
        }
        
        // 如果找到了足够近的交点，可以提前结束方向搜索
        if (bestIntersection && bestIntersection.distance < 10.0) { // 调整提前终止的阈值
          break;
        }
      }
      
      // 如果找到了交点
      if (bestIntersection) {
        results.push({
          sourcePoint: vertex.clone(),
          intersection: bestIntersection.point,
          distance: bestIntersection.distance, // 已经是缩放后的距离
          direction: bestIntersection.direction,
          vertexIndex: i,
          meshId: mesh.uuid
        });
        
        // 计算颜色值
        const colorValue = this._mapDistanceToColor(bestIntersection.distance);
        colors[i * 3] = colorValue.r;
        colors[i * 3 + 1] = colorValue.g;
        colors[i * 3 + 2] = colorValue.b;
      } else {
        // 如果没有交点，设置为明显的紫色
        colors[i * 3] = 1.0;     // R
        colors[i * 3 + 1] = 0.0; // G
        colors[i * 3 + 2] = 1.0; // B
        
        // 记录无交点的顶点
        noIntersectionCount++;
        
        // 也将无交点区域记录到结果中
        results.push({
          sourcePoint: vertex.clone(),
          intersection: null,
          distance: null,
          vertexIndex: i,
          meshId: mesh.uuid,
          noIntersection: true // 标记为无交点
        });
      }
    }
    
    // 创建顶点颜色属性
    mesh.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // 使用不受光照影响的 MeshBasicMaterial
    mesh.material = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      opacity: 0.7 // 调整这个值可以改变整体亮度

    });
  });
  
  this.distanceResults = {
    sourceLayer: sourceLayerName,
    targetLayer: targetLayerName,
    points: results,
    totalVertices: totalVertices,
    noIntersectionCount: noIntersectionCount,
    successRate: ((results.length ) / totalVertices * 100).toFixed(2) + '%',
    noIntersectionRate: (noIntersectionCount / totalVertices * 100).toFixed(2) + '%',
    distanceScale: distanceScale // 记录使用的距离系数
  };
  
  console.log(`计算完成，共有 ${results.length } 个有效交点，${noIntersectionCount} 个无交点，总顶点数 ${totalVertices}`);
  console.log(`成功率: ${this.distanceResults.successRate}, 无交点率: ${this.distanceResults.noIntersectionRate}`);
  console.log(`所有距离已乘以系数: ${distanceScale}`);
  
  return this.distanceResults;
}

  /**
   * 将距离映射到颜色值，按10米为一个区间划分
   * @param {number} distance - 距离值
   * @returns {Object} RGB颜色值 (0-1)
   */
/**
 * 将距离映射到颜色值，按10米为一个区间划分
 * @param {number|null} distance - 距离值 (已经乘以系数)，null表示无交点
 * @returns {Object} RGB颜色值 (0-1)
 */
_mapDistanceToColor(distance) {
  // 如果是无交点区域
  if (distance === null) {
    // 返回紫色
    return { r: 0.0, g: 0.0, b: 0.0 };
  }
  
  // 按10米为一个区间划分
  const intervalSize = 10; // 10米一个区间
  
  // 计算距离所在的区间
  const intervalIndex = Math.floor(distance / intervalSize);
  
  // 定义颜色区间 (可以扩展更多颜色)
  const colors = [
    { r: 0, g: 0, b: 1 },       // 0-10米: 蓝色
    { r: 0, g: 1, b: 1 },       // 10-20米: 青色
    { r: 0, g: 1, b: 0 },       // 20-30米: 绿色
    { r: 1, g: 1, b: 0 },       // 30-40米: 黄色
    { r: 1, g: 0.5, b: 0 },     // 40-50米: 橙色
    { r: 1, g: 0, b: 0 },       // 50-60米: 红色
    { r: 0.5, g: 1, b: 0.5 },   // 60-70米: 紫色
    { r: 0.3, g: 0.5, b: 1 },       // 70-80米: 品红
    { r: 0.5, g: 0.5, b: 0.5 }, // 80-90米: 灰色
    { r: 0, g: 0, b: 0 }        // 90+米: 黑色
  ];
  
  // 保存区间信息用于图例，并添加无交点的信息
  if (!this._distanceIntervals) {
    this._distanceIntervals = [];
    
    // 添加无交点的区间信息
    this._distanceIntervals.push({
      min: null,
      max: null,
      color: { r: 1.0, g: 0.0, b: 1.0 },
      label: '无交点区域'
    });
    
    // 添加常规距离区间
    for (let i = 0; i < colors.length; i++) {
      const min = i * intervalSize;
      const max = (i === colors.length - 1) ? Infinity : (i + 1) * intervalSize;
      this._distanceIntervals.push({ min, max, color: colors[i] });
    }
  }
  
  // 获取对应区间的颜色
  const colorIndex = Math.min(intervalIndex, colors.length - 1);
  return colors[colorIndex];
}

  /**
   * 重置地层到原始状态
   */
  resetLayers() {
    // 恢复所有保存的原始材质
    this.originalMaterials.forEach((material, uuid) => {
      // 尝试找到具有此 UUID 的网格
      let found = false;
      
      // 遍历所有图层
      if (this.sceneManager.layers) {
        // 如果 layers 是 Map
        if (typeof this.sceneManager.layers.forEach === 'function') {
          this.sceneManager.layers.forEach((meshes) => {
            if (Array.isArray(meshes)) {
              meshes.forEach(mesh => {
                if (mesh && mesh.uuid === uuid) {
                  mesh.material = material;
                  // 移除顶点颜色属性
                  if (mesh.geometry && mesh.geometry.attributes.color) {
                    mesh.geometry.deleteAttribute('color');
                  }
                  found = true;
                }
              });
            }
          });
        } 
        // 如果 layers 是普通对象
        else {
          for (const layerName in this.sceneManager.layers) {
            const meshes = this.sceneManager.layers[layerName];
            if (Array.isArray(meshes)) {
              meshes.forEach(mesh => {
                if (mesh && mesh.uuid === uuid) {
                  mesh.material = material;
                  // 移除顶点颜色属性
                  if (mesh.geometry && mesh.geometry.attributes.color) {
                    mesh.geometry.deleteAttribute('color');
                  }
                  found = true;
                }
              });
            }
          }
        }
      }
      
      // 如果没有找到，尝试遍历场景
      if (!found && this.sceneManager.scene) {
        this.sceneManager.scene.traverse(object => {
          if (object.uuid === uuid) {
            object.material = material;
            // 移除顶点颜色属性
            if (object.geometry && object.geometry.attributes.color) {
              object.geometry.deleteAttribute('color');
            }
          }
        });
      }
    });
    
    // 清除计算结果和缓存
    this.distanceResults = null;
    this._minMaxDistance = null;
    this._distanceIntervals = null;
    
    // 恢复所有图层的可见性
    const allLayers = this.sceneManager.getKeysArray();
    console.log("所有图层", allLayers);
    
    // 遍历所有图层，恢复可见性
    allLayers.forEach(layerName => {
      const meshes = this.sceneManager.getMeshesByLayer(layerName);
      meshes.forEach((mesh) => {
        mesh.visible = true;
      });
    });
    
    console.log("已重置地层显示");
  }

  /**
   * 生成距离图例
   * @returns {HTMLElement} 图例DOM元素
   */
  createDistanceLegend() {
    if (!this._distanceIntervals || !this.distanceResults) return null;
    
    const legend = document.createElement('div');
    legend.className = 'distance-legend';
    legend.style.position = 'absolute';
    legend.style.bottom = '20px';
    legend.style.right = '20px';
    legend.style.background = 'rgba(255, 255, 255, 0.9)';
    legend.style.padding = '15px';
    legend.style.borderRadius = '8px';
    legend.style.boxShadow = '0 0 15px rgba(0, 0, 0, 0.2)';
    legend.style.minWidth = '250px';
    legend.style.fontFamily = 'Arial, sans-serif';
    legend.style.zIndex = '1000';
    
    // 标题
    const title = document.createElement('div');
    title.textContent = '地层间距统计';
    title.style.fontWeight = 'bold';
    title.style.fontSize = '16px';
    title.style.marginBottom = '10px';
    title.style.borderBottom = '1px solid #ddd';
    title.style.paddingBottom = '5px';
    legend.appendChild(title);
    
    // 地层信息
    const layerInfo = document.createElement('div');
    layerInfo.style.marginBottom = '10px';
    layerInfo.style.fontSize = '14px';
    
    const sourceLayer = document.createElement('div');
    sourceLayer.textContent = `源地层: ${this.distanceResults.sourceLayer}`;
    sourceLayer.style.marginBottom = '5px';
    
    const targetLayer = document.createElement('div');
    targetLayer.textContent = `目标地层: ${this.distanceResults.targetLayer}`;
    targetLayer.style.marginBottom = '5px';
    
    layerInfo.appendChild(sourceLayer);
    layerInfo.appendChild(targetLayer);
    legend.appendChild(layerInfo);
    
    // 统计信息
    const statsInfo = document.createElement('div');
    statsInfo.style.marginBottom = '15px';
    statsInfo.style.fontSize = '14px';
    
    if (this.distanceResults.points.length > 0) {
      const distances = this.distanceResults.points.map(p => p.distance);
      const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
      const minDistance = Math.min(...distances);
      const maxDistance = Math.max(...distances);
      
      const stats = [
        `平均距离: ${avgDistance.toFixed(2)} 米`,
        // `最小距离: ${minDistance.toFixed(2)} 米`,
        `最大距离: ${maxDistance.toFixed(2)} 米`,
        // `有效交点: ${this.distanceResults.points.length}`,
        // `总顶点数: ${this.distanceResults.totalVertices}`,
        `计算成功率: ${this.distanceResults.successRate}`
      ];
      
      stats.forEach(stat => {
        const div = document.createElement('div');
        div.textContent = stat;
        div.style.marginBottom = '5px';
        statsInfo.appendChild(div);
      });
    }
    
    legend.appendChild(statsInfo);
    
    // 颜色图例标题
    const colorLegendTitle = document.createElement('div');
    colorLegendTitle.textContent = '图例 (米)';
    colorLegendTitle.style.fontWeight = 'bold';
    colorLegendTitle.style.marginBottom = '8px';
    legend.appendChild(colorLegendTitle);
    
    // 创建区间颜色图例
    const colorLegend = document.createElement('div');
    colorLegend.style.marginBottom = '10px';
    
    this._distanceIntervals.forEach((interval, index) => {
      const intervalRow = document.createElement('div');
      intervalRow.style.display = 'flex';
      intervalRow.style.alignItems = 'center';
      intervalRow.style.marginBottom = '5px';
      
      // 颜色方块
      const colorBox = document.createElement('div');
      colorBox.style.width = '20px';
      colorBox.style.height = '20px';
      colorBox.style.marginRight = '10px';
      colorBox.style.backgroundColor = `rgb(${interval.color.r * 255}, ${interval.color.g * 255}, ${interval.color.b * 255})`;
      colorBox.style.border = '1px solid #ccc';
      
         // 区间文本
    const intervalText = document.createElement('div');
    if (interval.min === null && interval.max === null) {
      // 无交点区域
      intervalText.textContent = '无交点区域';
      // 可以添加特殊样式
      intervalText.style.fontWeight = 'bold';
    } else if (interval.max === Infinity) {
      intervalText.textContent = `${interval.min}+ 米`;
    } else {
      intervalText.textContent = `${interval.min} - ${interval.max} 米`;
    }
      intervalRow.appendChild(colorBox);
      intervalRow.appendChild(intervalText);
      colorLegend.appendChild(intervalRow);
    });
    
    legend.appendChild(colorLegend);
    
    // 添加关闭按钮
    const closeButton = document.createElement('button');
    closeButton.textContent = '关闭';
    closeButton.style.padding = '5px 10px';
    closeButton.style.backgroundColor = '#f44336';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '4px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.float = 'right';
    closeButton.style.marginTop = '10px';
    closeButton.style.marginBottom = '200px';
    
    closeButton.addEventListener('click', () => {
      if (legend.parentNode) {
        legend.parentNode.removeChild(legend);
      }
    });
    
    legend.appendChild(closeButton);
    
    return legend;
  }
}