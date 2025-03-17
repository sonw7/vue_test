import * as THREE from 'three';
import { getcolorbylayer } from '../utils/getMeshColor';

/**
 * 读取并渲染钻孔数据
 * @param {SceneManager} sceneManager - Three.js场景管理器
 * @param {CoordinateTransformer} transformer - 坐标转换器
 */
/**
 * 读取并渲染钻孔数据
 * @param {SceneManager} sceneManager - Three.js场景管理器
 * @param {CoordinateTransformer} transformer - 坐标转换器
 * @param {Array} layerNames - 图层名称列表，用于更新UI
 */
async function loadAndRenderDrills(sceneManager, transformer, layerNames = null) {
  try {
      // 检查并记录传入的转换器参数
      console.log("钻孔渲染使用的转换器:", transformer);
      if (transformer && transformer.offset) {
        console.log("钻孔渲染使用的偏移量:", transformer.offset);
      } else {
        console.warn("警告：钻孔渲染没有收到有效的偏移量");
      }
      
    // 加载钻孔数据
    const response = await fetch('/drills.txt');
    if (!response.ok) {
      throw new Error('无法加载钻孔数据文件');
    }
    
    const drills = await response.json();
    console.log(`加载了 ${drills.length} 个钻孔数据`);
    console.log("钻孔数据",drills);
    // 创建颜色函数
    

      // 遍历钻孔数据并渲染
      drills.forEach(drill => {
        const transformedPosition = transformer ? ({
          x: transformer.offset.x,
          y: transformer.offset.y,
          z: transformer.offset.z
        }) : { x: 0, y: 0, z: 0 };      
             // 渲染钻孔
      const drillMesh = createDrillMesh(drill, {
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
          const layerName = `${drill.name}`;
          drillMesh.name = layerName;
          sceneManager.addMeshToScene(drillMesh, {
            layer: layerName,
            layerCategory: ['钻孔', layerName]
          });
          // 如果提供了layerNames引用，添加到图层列表
          if (layerNames && Array.isArray(layerNames)) {
            layerNames.push(['钻孔', layerName]);
          }
        }
      });
      
      console.log("钻孔渲染完成");
      
    } catch (error) {
      console.error('加载或渲染钻孔数据时出错:', error);
    }
  }

/**
 * 创建钻孔的3D模型
 * @param {Object} drill - 钻孔数据
 * @param {Function} getcolorbylayer - 颜色生成函数
 * @param {Object} options - 渲染选项
 * @returns {THREE.Group} 钻孔模型组
 */
function createDrillMesh(drill, options = {}) {
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
      color: getcolorbylayer(i-1),       // 动态颜色（基于层级）
    //   roughness: options.roughness || 0.7,
    //   metalness: options.metalness || 0.2,
      side: THREE.DoubleSide
    });
  
    // 创建网格
    const cylinder = new THREE.Mesh(geometry, material);
    cylinder.name = `drill_${name}`;
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
    context.fillStyle = 'rgba(255, 255, 255, 0)';
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
    
    // 获取父对象中第一个圆柱体的位置（如果存在）
    let cylinderPosition = { x: 0, y: 0, z: 0 };
    if (parent.children.length > 0) {
      const firstCylinder = parent.children.find(child => child.type === 'Mesh');
      if (firstCylinder) {
        cylinderPosition = {
          x: firstCylinder.position.x,
          y: firstCylinder.position.y,
          z: firstCylinder.position.z
        };
      }
    }
    
    // 将标签放置在钻孔顶部上方，使用和圆柱体相同的x,z位置
    label.position.set(
      cylinderPosition.x,
      height + 2 * scale,  // 在钻孔顶部上方
      cylinderPosition.z
    );
    
    // 立起来的标签 - 不旋转X轴，保持垂直
    // 可以根据需要调整Y轴旋转，使标签面向特定方向
    label.rotation.set(0, -Math.PI, 0);  // 不旋转，保持垂直
    
    // 如果需要标签始终面向相机，可以添加以下代码
    label.userData.isLabel = true;  // 标记为标签，方便在渲染循环中找到
    
    // 添加到父对象
    parent.add(label);
    
    return label;  // 返回标签对象，便于后续操作
  }

// 导出函数
export { loadAndRenderDrills, createDrillMesh, addDrillLabel };