/**
 * 纹理映射工具 - 管理三维场景中不同地层的纹理映射
 * 
 * 提供两种查询方式:
 * 1. 通过索引获取对应的纹理路径
 * 2. 通过图层名称获取对应的纹理路径
 */

// 索引到纹理的映射关系 (明确的索引对应关系)
const indexToTextureMap = {
    0: '/textures/layers/coal_seam.jpg',     // 煤层纹理
    1: '/textures/layers/sandstone.jpg',     // 砂岩纹理
    2: '/textures/layers/limestone.jpg',     // 石灰岩纹理
    3: '/textures/layers/mudstone.jpg',      // 泥岩纹理
    4: '/textures/layers/shale.jpg',         // 页岩纹理
    5: '/textures/layers/conglomerate.jpg',  // 砾岩纹理
    6: '/textures/layers/granite.jpg',       // 花岗岩纹理
    7: '/textures/layers/marble.jpg',        // 大理石纹理
    8: '/textures/layers/slate.jpg',         // 板岩纹理
    9: '/textures/layers/basalt.jpg',        // 玄武岩纹理
    10: '/textures/layers/dolomite.jpg',     // 白云岩纹理
    11: '/textures/layers/gneiss.jpg',       // 片麻岩纹理
    12: '/textures/layers/siltstone.jpg',    // 粉砂岩纹理
    13: '/textures/layers/claystone.jpg',    // 泥质岩纹理
    14: '/textures/layers/quartzite.jpg',    // 石英岩纹理
    15: '/textures/layers/schist.jpg',       // 片岩纹理
  };
  
  /**
   * 根据索引获取纹理URL
   * @param {number} index - 纹理索引
   * @returns {string} 纹理URL
   */
  export function getTextureByIndex(index) {
    // 确保索引是数字类型
    const numericIndex = Number(index);
    
    // 如果索引直接存在于映射中，返回对应纹理
    if (indexToTextureMap[numericIndex]) {
      return indexToTextureMap[numericIndex];
    }
    
    // 如果索引超出范围，使用模运算获取一个有效的纹理
    const keys = Object.keys(indexToTextureMap);
    if (keys.length > 0) {
      const normalizedIndex = ((numericIndex % keys.length) + keys.length) % keys.length;
      return indexToTextureMap[normalizedIndex] || DEFAULT_TEXTURE;
    }
    
    console.warn(`无法找到索引 ${index} 对应的纹理，使用默认纹理`);
    return DEFAULT_TEXTURE;
  }
  
  /**
   * 根据图层名称获取纹理URL
   * @param {string} layerName - 图层名称
   * @returns {string} 纹理URL
   */
  export function getTextureByLayerName(layerName) {
    // 如果图层名称直接存在于映射中，返回对应纹理
    if (layerToTextureMap[layerName]) {
      return layerToTextureMap[layerName];
    }
    
    // 尝试从图层名称提取索引
    const match = layerName.match(/[_-](\d+)$/);
    if (match && match[1]) {
      const index = parseInt(match[1], 10);
      return getTextureByIndex(index);
    }
    
    console.warn(`无法找到图层 ${layerName} 对应的纹理，使用默认纹理`);
    return DEFAULT_TEXTURE;
  }
  
  /**
   * 获取纹理URL的统一入口函数
   * 支持多种参数形式，包括索引、图层名称或配置对象
   * 
   * @param {number|string|object} param - 索引、图层名称或配置对象
   * @returns {string} 纹理URL
   * 
   * @example
   * // 通过索引获取纹理
   * getTextureUrl(2);  // 返回索引2对应的纹理
   * 
   * // 通过图层名称获取纹理
   * getTextureUrl('Layer_3');  // 返回Layer_3对应的纹理
   * 
   * // 通过配置对象获取纹理
   * getTextureUrl({ index: 5 });  // 返回索引5对应的纹理
   * getTextureUrl({ layerName: 'Fault_1' });  // 返回Fault_1对应的纹理
   */
  export function getTextureUrl(param) {
    // 如果是数字，按索引获取
    if (typeof param === 'number') {
      return getTextureByIndex(param);
    }
    
    // 如果是字符串，按图层名称获取
    if (typeof param === 'string') {
      return getTextureByLayerName(param);
    }
    
    // 如果是对象，解析配置
    if (typeof param === 'object' && param !== null) {
      if (param.layerName) {
        return getTextureByLayerName(param.layerName);
      }
      
      if (param.index !== undefined) {
        return getTextureByIndex(param.index);
      }
    }
    
    // 无法确定纹理，返回默认纹理
    console.warn('无法确定纹理参数类型，使用默认纹理', param);
    return DEFAULT_TEXTURE;
  }
  
  /**
   * 获取所有索引到纹理的映射关系
   * @returns {Object} 索引到纹理的映射对象
   */
  export function getAllIndexMappings() {
    return { ...indexToTextureMap };
  }
  
  /**
   * 获取所有图层到纹理的映射关系
   * @returns {Object} 图层到纹理的映射对象
   */
  export function getAllLayerMappings() {
    return { ...layerToTextureMap };
  }
  
  /**
   * 添加或更新索引到纹理的映射
   * @param {number} index - 索引
   * @param {string} textureUrl - 纹理URL
   */
  export function setIndexMapping(index, textureUrl) {
    indexToTextureMap[index] = textureUrl;
  }
  
  /**
   * 添加或更新图层到纹理的映射
   * @param {string} layerName - 图层名称
   * @param {string} textureUrl - 纹理URL
   */
  export function setLayerMapping(layerName, textureUrl) {
    layerToTextureMap[layerName] = textureUrl;
  }
  /**
 * UV 映射工具 - 用于计算和管理 3D 模型的 UV 坐标
 * 
 * 主要功能:
 * 1. 盒状 UV 映射 - 将纹理按照立方体投影方式映射到任意几何体
 * 2. 纹理管理 - 根据索引或图层名称获取纹理
 */

import * as THREE from 'three';


// 图层名称到纹理的映射关系
const layerToTextureMap = {
  // 地层纹理映射
  'Layer_0': '/textures/layers/coal_seam.jpg',
  'Layer_1': '/textures/layers/sandstone.jpg',
  'Layer_2': '/textures/layers/limestone.jpg',
  'Layer_3': '/textures/layers/mudstone.jpg',
  'Layer_4': '/textures/layers/shale.jpg',
  'Layer_5': '/textures/layers/conglomerate.jpg',
  'Layer_6': '/textures/layers/granite.jpg',
  'Layer_7': '/textures/layers/marble.jpg',
  'Layer_8': '/textures/layers/slate.jpg',
  'Layer_9': '/textures/layers/basalt.jpg',
  
  // 断层纹理映射
  'Fault_0': '/textures/special/fault_red.jpg',
  'Fault_1': '/textures/special/fault_yellow.jpg',
  'Fault_2': '/textures/special/fault_blue.jpg',
  
  // 钻孔纹理映射
  'Drill_0': '/textures/special/drill_texture.jpg',
  
  // 巷道纹理映射
  'Roadway_0': '/textures/special/roadway_concrete.jpg',
  'Roadway_1': '/textures/special/roadway_metal.jpg',
};

// 默认纹理
const DEFAULT_TEXTURE = '/textures/default.jpg';

/**
 * 计算几何体的盒状 UV 映射
 * 
 * 这个函数会根据顶点位置和法线方向，计算适合盒状投影的 UV 坐标
 * 盒状投影将纹理按照六个面（立方体）投影到模型上，适合地质模型和建筑模型
 * 
 * @param {THREE.BufferAttribute} positionAttribute - 顶点位置属性
 * @param {THREE.BufferAttribute} normalAttribute - 顶点法线属性
 * @param {THREE.Vector3} max - 包围盒最大坐标
 * @param {THREE.Vector3} min - 包围盒最小坐标
 * @param {Object} options - 配置选项
 * @param {number} options.uvScale - UV 缩放因子，默认为 1
 * @param {boolean} options.normalBased - 是否基于法线计算 UV，默认为 true
 * @returns {Float32Array} UV 坐标数组，可直接用于 THREE.BufferAttribute
 */
export function boxUvCom(positionAttribute, normalAttribute, max, min, options = {}) {
  // 配置默认选项
  const uvScale = options.uvScale || 1;
  const normalBased = options.normalBased !== undefined ? options.normalBased : true;
  
  // 检查输入参数
  if (!positionAttribute || !normalAttribute) {
    console.error("缺少位置或法线属性");
    return null;
  }
  
  // 计算模型尺寸
  const size = new THREE.Vector3().subVectors(max, min);
  
  // 创建 UV 数组
  const count = positionAttribute.count;
  const uvArray = new Float32Array(count * 2);
  
  // 临时向量，避免重复创建
  const tempNormal = new THREE.Vector3();
  const tempPosition = new THREE.Vector3();
  
  // 对每个顶点计算 UV
  for (let i = 0; i < count; i++) {
    // 获取顶点位置
    tempPosition.fromBufferAttribute(positionAttribute, i);
    
    // 获取顶点法线
    tempNormal.fromBufferAttribute(normalAttribute, i);
    tempNormal.normalize();
    
    let u = 0, v = 0;
    
    if (normalBased) {
      // 基于法线方向决定使用哪个平面的 UV 映射
      const absX = Math.abs(tempNormal.x);
      const absY = Math.abs(tempNormal.y);
      const absZ = Math.abs(tempNormal.z);
      
      // 找出法线最强的分量，决定使用哪个平面
      if (absX >= absY && absX >= absZ) {
        // X 轴投影 (YZ 平面)
        if (tempNormal.x > 0) {
          // 正 X 面
          u = (tempPosition.z - min.z) / size.z;
          v = (tempPosition.y - min.y) / size.y;
        } else {
          // 负 X 面
          u = 1 - (tempPosition.z - min.z) / size.z;
          v = (tempPosition.y - min.y) / size.y;
        }
      } else if (absY >= absX && absY >= absZ) {
        // Y 轴投影 (XZ 平面)
        if (tempNormal.y > 0) {
          // 正 Y 面
          u = (tempPosition.x - min.x) / size.x;
          v = (tempPosition.z - min.z) / size.z;
        } else {
          // 负 Y 面
          u = (tempPosition.x - min.x) / size.x;
          v = 1 - (tempPosition.z - min.z) / size.z;
        }
      } else {
        // Z 轴投影 (XY 平面)
        if (tempNormal.z > 0) {
          // 正 Z 面
          u = (tempPosition.x - min.x) / size.x;
          v = (tempPosition.y - min.y) / size.y;
        } else {
          // 负 Z 面
          u = 1 - (tempPosition.x - min.x) / size.x;
          v = (tempPosition.y - min.y) / size.y;
        }
      }
    } else {
      // 简单的平面投影 (适用于较平坦的地质模型)
      // 使用 XY 平面
      u = (tempPosition.x - min.x) / size.x;
      v = (tempPosition.y - min.y) / size.y;
    }
    
    // 应用 UV 缩放
    u *= uvScale;
    v *= uvScale;
    
    // 存储 UV 坐标
    uvArray[i * 2] = u;
    uvArray[i * 2 + 1] = v;
  }
  
  return uvArray;
}

/**
 * 根据索引获取纹理URL
 * @param {number} index - 纹理索引
 * @returns {string} 纹理URL
 */
export function getTextureByIndex(index) {
  // 确保索引是数字类型
  const numericIndex = Number(index);
  
  // 如果索引直接存在于映射中，返回对应纹理
  if (indexToTextureMap[numericIndex]) {
    return indexToTextureMap[numericIndex];
  }
  
  // 如果索引超出范围，使用模运算获取一个有效的纹理
  const keys = Object.keys(indexToTextureMap);
  if (keys.length > 0) {
    const normalizedIndex = ((numericIndex % keys.length) + keys.length) % keys.length;
    return indexToTextureMap[normalizedIndex] || DEFAULT_TEXTURE;
  }
  
  console.warn(`无法找到索引 ${index} 对应的纹理，使用默认纹理`);
  return DEFAULT_TEXTURE;
}

/**
 * 根据图层名称获取纹理URL
 * @param {string} layerName - 图层名称
 * @returns {string} 纹理URL
 */
export function getTextureByLayerName(layerName) {
  // 如果图层名称直接存在于映射中，返回对应纹理
  if (layerToTextureMap[layerName]) {
    return layerToTextureMap[layerName];
  }
  
  // 尝试从图层名称提取索引
  const match = layerName.match(/[_-](\d+)$/);
  if (match && match[1]) {
    const index = parseInt(match[1], 10);
    return getTextureByIndex(index);
  }
  
  console.warn(`无法找到图层 ${layerName} 对应的纹理，使用默认纹理`);
  return DEFAULT_TEXTURE;
}

/**
 * 获取纹理URL的统一入口函数
 * @param {number|string|object} param - 索引、图层名称或配置对象
 * @returns {string} 纹理URL
 */
export function getTextureUrl(param) {
  // 如果是数字，按索引获取
  if (typeof param === 'number') {
    return getTextureByIndex(param);
  }
  
  // 如果是字符串，按图层名称获取
  if (typeof param === 'string') {
    return getTextureByLayerName(param);
  }
  
  // 如果是对象，解析配置
  if (typeof param === 'object' && param !== null) {
    if (param.layerName) {
      return getTextureByLayerName(param.layerName);
    }
    
    if (param.index !== undefined) {
      return getTextureByIndex(param.index);
    }
  }
  
  // 无法确定纹理，返回默认纹理
  console.warn('无法确定纹理参数类型，使用默认纹理', param);
  return DEFAULT_TEXTURE;
}

/**
 * 计算平面投影的 UV 坐标
 * 适用于较平坦的地质模型
 * 
 * @param {THREE.BufferAttribute} positionAttribute - 顶点位置属性
 * @param {THREE.Vector3} max - 包围盒最大坐标
 * @param {THREE.Vector3} min - 包围盒最小坐标
 * @param {Object} options - 配置选项
 * @param {string} options.plane - 投影平面，可选 'xy'(默认), 'xz', 'yz'
 * @param {number} options.uvScale - UV 缩放因子，默认为 1
 * @returns {Float32Array} UV 坐标数组
 */
export function planeProjectionUV(positionAttribute, max, min, options = {}) {
  const plane = options.plane || 'xy';
  const uvScale = options.uvScale || 1;
  
  // 计算模型尺寸
  const size = new THREE.Vector3().subVectors(max, min);
  
  // 创建 UV 数组
  const count = positionAttribute.count;
  const uvArray = new Float32Array(count * 2);
  
  // 临时向量
  const tempPosition = new THREE.Vector3();
  
  // 对每个顶点计算 UV
  for (let i = 0; i < count; i++) {
    // 获取顶点位置
    tempPosition.fromBufferAttribute(positionAttribute, i);
    
    let u = 0, v = 0;
    
    // 根据选择的平面计算 UV
    switch (plane) {
      case 'xy':
        u = (tempPosition.x - min.x) / size.x;
        v = (tempPosition.y - min.y) / size.y;
        break;
      case 'xz':
        u = (tempPosition.x - min.x) / size.x;
        v = (tempPosition.z - min.z) / size.z;
        break;
      case 'yz':
        u = (tempPosition.y - min.y) / size.y;
        v = (tempPosition.z - min.z) / size.z;
        break;
      default:
        u = (tempPosition.x - min.x) / size.x;
        v = (tempPosition.y - min.y) / size.y;
    }
    
    // 应用 UV 缩放
    u *= uvScale;
    v *= uvScale;
    
    // 存储 UV 坐标
    uvArray[i * 2] = u;
    uvArray[i * 2 + 1] = v;
  }
  
  return uvArray;
}

/**
 * 计算球面投影的 UV 坐标
 * 适用于球形或半球形的模型
 * 
 * @param {THREE.BufferAttribute} positionAttribute - 顶点位置属性
 * @returns {Float32Array} UV 坐标数组
 */
export function sphericalUV(positionAttribute) {
  const count = positionAttribute.count;
  const uvArray = new Float32Array(count * 2);
  
  // 临时向量
  const tempPosition = new THREE.Vector3();
  
  // 对每个顶点计算 UV
  for (let i = 0; i < count; i++) {
    // 获取顶点位置
    tempPosition.fromBufferAttribute(positionAttribute, i);
    tempPosition.normalize(); // 将位置归一化到单位球面
    
    // 使用经纬度映射计算 UV
    // u: 0 到 1 对应经度 -π 到 π
    // v: 0 到 1 对应纬度 -π/2 到 π/2
    const u = 0.5 + Math.atan2(tempPosition.z, tempPosition.x) / (2 * Math.PI);
    const v = 0.5 - Math.asin(tempPosition.y) / Math.PI;
    
    // 存储 UV 坐标
    uvArray[i * 2] = u;
    uvArray[i * 2 + 1] = v;
  }
  
  return uvArray;
}

/**
 * 自动生成 UV 坐标
 * 根据几何体的类型和特征自动选择合适的 UV 映射方法
 * 
 * @param {THREE.BufferGeometry} geometry - Three.js 几何体
 * @param {Object} options - 配置选项
 * @returns {Float32Array} UV 坐标数组
 */
export function generateUVs(geometry, options = {}) {
  if (!geometry) {
    console.error("几何体无效");
    return null;
  }
  
  // 确保几何体有包围盒
  if (!geometry.boundingBox) {
    geometry.computeBoundingBox();
  }
  
  const positionAttribute = geometry.getAttribute('position');
  const normalAttribute = geometry.getAttribute('normal');
  
  if (!positionAttribute) {
    console.error("几何体缺少顶点位置属性");
    return null;
  }
  
  // 如果没有法线属性，计算法线
  if (!normalAttribute) {
    geometry.computeVertexNormals();
  }
  
  // 获取几何体的包围盒
  const { min, max } = geometry.boundingBox;
  
  // 计算几何体的尺寸比例
  const size = new THREE.Vector3().subVectors(max, min);
  const aspectRatio = {
    xy: size.x / size.y,
    yz: size.y / size.z,
    xz: size.x / size.z
  };
  
  // 根据几何体特征选择合适的 UV 映射方法
  if (options.method === 'box' || options.method === 'cube') {
    return boxUvCom(positionAttribute, geometry.getAttribute('normal'), max, min, options);
  } else if (options.method === 'sphere') {
    return sphericalUV(positionAttribute);
  } else if (options.method === 'plane') {
    // 自动选择最佳投影平面
    let plane = 'xy';
    if (aspectRatio.yz > aspectRatio.xy && aspectRatio.yz > aspectRatio.xz) {
      plane = 'yz';
    } else if (aspectRatio.xz > aspectRatio.xy && aspectRatio.xz > aspectRatio.yz) {
      plane = 'xz';
    }
    return planeProjectionUV(positionAttribute, max, min, { ...options, plane });
  } else {
    // 自动检测几何体类型并选择合适的方法
    // 如果几何体很扁平，使用平面投影
    if (size.z < size.x * 0.2 && size.z < size.y * 0.2) {
      return planeProjectionUV(positionAttribute, max, min, { ...options, plane: 'xy' });
    } 
    // 如果几何体近似球形，使用球面投影
    else if (Math.abs(size.x - size.y) < size.x * 0.2 && 
             Math.abs(size.x - size.z) < size.x * 0.2 &&
             Math.abs(size.y - size.z) < size.y * 0.2) {
      return sphericalUV(positionAttribute);
    } 
    // 默认使用盒状投影
    else {
      return boxUvCom(positionAttribute, geometry.getAttribute('normal'), max, min, options);
    }
  }
}

/**
 * 获取所有索引到纹理的映射
 * @returns {Object} 索引到纹理的映射对象
 */
export function getAllIndexMappings() {
  return { ...indexToTextureMap };
}

/**
 * 获取所有图层到纹理的映射
 * @returns {Object} 图层到纹理的映射对象
 */
export function getAllLayerMappings() {
  return { ...layerToTextureMap };
}

/**
 * 添加或更新索引到纹理的映射
 * @param {number} index - 索引
 * @param {string} textureUrl - 纹理URL
 */
export function setIndexMapping(index, textureUrl) {
  indexToTextureMap[index] = textureUrl;
}

/**
 * 添加或更新图层到纹理的映射
 * @param {string} layerName - 图层名称
 * @param {string} textureUrl - 纹理URL
 */
export function setLayerMapping(layerName, textureUrl) {
  layerToTextureMap[layerName] = textureUrl;
}