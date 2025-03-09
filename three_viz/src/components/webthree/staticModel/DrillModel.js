import * as THREE from 'three';

/**
 * 读取并渲染钻孔数据
 * @param {SceneManager} sceneManager - Three.js场景管理器
 * @param {CoordinateTransformer} transformer - 坐标转换器
 */
async function loadAndRenderDrills(sceneManager, transformer) {
  try {
    // 加载钻孔数据
    const response = await fetch('/drills.txt');
    if (!response.ok) {
      throw new Error('无法加载钻孔数据文件');
    }
    
    const drills = await response.json();
    console.log(`加载了 ${drills.length} 个钻孔数据`);
    console.log(drills);
    // 创建颜色函数
    const colorFunction = (index) => {
      // 根据索引生成不同颜色
      const hue = (0.1 + (index * 0.1)) % 1;
      return new THREE.Color().setHSL(hue, 0.7, 0.5).getHex();
    };
    console.debug(transformer.offset);

    // 遍历钻孔数据并渲染
    drills.forEach(drill => {
        // console.debug(drill);
      // 应用坐标转换
    //   console.debug("???",transformer.offset);
      const transformedPosition = transformer ? ({
        x: transformer.offset.x,
        y: transformer.offset.y,
        z: transformer.offset.z
      }) : { x: 0, y: 0, z: 0 };
      // 渲染钻孔
      const drillMesh = createDrillMesh(drill, colorFunction, {
        position: transformedPosition,
        scale: 1,
        radius: 0.1,
        showLabels: true,
        labelScale: 0.8,
        roughness: 0.6,
        metalness: 0.1
      });
      
      // 将钻孔添加到场景
      if (drillMesh && sceneManager.addMeshToScene) {
        sceneManager.addMeshToScene(drillMesh, {
          layer: drill.name,
          layerCategory: ['钻孔', drill.name]
        });
      }
    });
  } catch (error) {
    console.error('加载或渲染钻孔数据时出错:', error);
  }
}

/**
 * 创建钻孔的3D模型
 * @param {Object} drill - 钻孔数据
 * @param {Function} colorFunction - 颜色生成函数
 * @param {Object} options - 渲染选项
 * @returns {THREE.Group} 钻孔模型组
 */
function createDrillMesh(drill, colorFunction, options = {}) {
  const { name = "unknown", zkx, zky, xyz } = drill; // 解构钻孔数据
//   console.debug(options);
  // 创建钻孔组
  const drillGroup = new THREE.Group();
  drillGroup.name = `drill_${name}`;
  drillGroup.rotation.y = -Math.PI / 2;

  // 应用位置
  if (options.position) {
    drillGroup.position.set(
       options.position.x || 0, 
       options.position.y || 0, 
       options.position.z || 0
    );
  } 

  // 应用旋转
  if (options.rotation) {
    drillGroup.rotation.set(
      options.rotation.x || 0,
      options.rotation.y || 0,
      options.rotation.z || 0
    );
  }
  
  // 应用缩放
  if (options.scale !== undefined) {
    if (typeof options.scale === 'number') {
      drillGroup.scale.set(options.scale, options.scale, options.scale);
    } else {
      drillGroup.scale.set(
        options.scale.x || 1,
        options.scale.y || 1,
        options.scale.z || 1
      );
    }
  }
  
  // 遍历深度数组，渲染每一段钻孔
  for (let i = 0; i < xyz.length - 1; i++) {
    const depth1 = xyz[i];
    const depth2 = xyz[i + 1] ;
  
    // 跳过无效或零深度差的段
    if (depth1 === 99.99 || depth2 === 99.99 || Math.abs(depth1 - depth2) < 0.01) {
      continue;
    }
  
    // 计算段的长度和中点位置
    const segmentLength = Math.abs(depth2 - depth1);
    const segmentCenter = (depth1 + depth2) / 2;
  
    // 创建圆柱体几何体
    const geometry = new THREE.CylinderGeometry(
      options.radius || 1,           // 顶部半径
      options.radius || 1,           // 底部半径
      segmentLength,                 // 高度
      options.radialSegments || 32   // 径向分段数
    );
  
    // 设置材质颜色
    const material = new THREE.MeshStandardMaterial({
      color: colorFunction(i),       // 动态颜色（基于层级）
      roughness: options.roughness || 0.7,
      metalness: options.metalness || 0.2
    });
  
    // 创建网格
    const cylinder = new THREE.Mesh(geometry, material);
    
    // 设置圆柱体位置（相对于钻孔组）
    cylinder.position.y = segmentCenter;
    cylinder.position.x = zkx;
    cylinder.position.z =  -zky;
    
    // 将圆柱体添加到钻孔组
    drillGroup.add(cylinder);
  }
  
  // 添加钻孔名称标签
  if (options.showLabels !== false) {
    addDrillLabel(name, xyz[0] * 0.01, drillGroup, options.labelScale || 1);
  }
  
  return drillGroup;
}

/**
 * 为钻孔添加文本标签
 * @param {string} name - 钻孔名称
 * @param {number} height - 标签高度
 * @param {THREE.Group} parent - 父对象
 * @param {number} scale - 标签缩放比例
 */
function addDrillLabel(name, height, parent, scale = 1) {
  // 创建2D Canvas
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 64;
  
  // 设置文本样式
  context.fillStyle = 'rgba(255, 255, 255, 0.8)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.font = 'bold 24px Arial';
  context.fillStyle = 'black';
  context.textAlign = 'center';
  context.fillText(name, canvas.width / 2, canvas.height / 2 + 8);
  
  // 创建纹理
  const texture = new THREE.CanvasTexture(canvas);
  
  // 创建材质和平面
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true
  });
  
  const geometry = new THREE.PlaneGeometry(4 * scale, 1 * scale);
  const label = new THREE.Mesh(geometry, material);
  
  // 将标签放置在钻孔顶部上方
  label.position.set(0, height + 2 * scale, 0);
  label.rotation.x = -Math.PI / 2;  // 水平放置
  
  // 添加到父对象
  parent.add(label);
}

// 导出函数
export { loadAndRenderDrills, createDrillMesh, addDrillLabel };