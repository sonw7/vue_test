/**
 * 坐标转换器 - 用于处理3D场景中的坐标转换、缩放和偏移
 */
class CoordinateTransformer {
  /**
   * 初始化坐标转换器
   * @param {Object} options 配置选项
   * @param {Object} options.offset 偏移量 { x, y, z }
   * @param {Object} options.scale 缩放比例 { x, y, z }
   * @param {Object} options.rotation 旋转角度(弧度) { x, y, z }
   */
  constructor(options = {}) {
    // 使用解构赋值和默认值，简化初始化
    const { offset = {}, scale = {}, rotation = {} } = options;
    
    // 偏移量
    this.offset = {
      x: offset.x || 0,
      y: offset.y || 0,
      z: offset.z || 0
    };
    
    // 缩放比例
    this.scale = {
      x: scale.x !== undefined ? scale.x : 1,
      y: scale.y !== undefined ? scale.y : 1,
      z: scale.z !== undefined ? scale.z : 1
    };
    
    // 旋转角度(弧度)
    this.rotation = {
      x: rotation.x || 0,
      y: rotation.y || 0,
      z: rotation.z || 0
    };
    
    // 缓存计算结果的Map，用于提高性能
    this.cache = new Map();
    this.cacheEnabled = true;
    this.cacheSize = 1000; // 最大缓存条目数
  }

  /**
   * 转换单个坐标点
   * @param {Object|Array} point 坐标点 { x, y, z } 或 [x, y, z]
   * @returns {Object} 转换后的坐标点 { x, y, z }
   */
  transformPoint(point) {
    // 支持数组或对象形式的输入
    const isArray = Array.isArray(point);
    const x = isArray ? point[0] : point.x;
    const y = isArray ? point[1] : point.y;
    const z = isArray ? (point[2] || 0) : (point.z || 0);
    
    // 如果启用缓存，先检查是否有缓存结果
    if (this.cacheEnabled) {
      const cacheKey = `${x},${y},${z}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }
    }
    
    // 应用缩放
    let newX = x * this.scale.x;
    let newY = y * this.scale.y;
    let newZ = z * this.scale.z;
    
    // 应用旋转 (简化版本，完整版需要使用四元数或旋转矩阵)
    if (this.rotation.x || this.rotation.y || this.rotation.z) {
      // X轴旋转
      if (this.rotation.x) {
        const cosX = Math.cos(this.rotation.x);
        const sinX = Math.sin(this.rotation.x);
        const oldY = newY;
        const oldZ = newZ;
        newY = oldY * cosX - oldZ * sinX;
        newZ = oldY * sinX + oldZ * cosX;
      }
      
      // Y轴旋转
      if (this.rotation.y) {
        const cosY = Math.cos(this.rotation.y);
        const sinY = Math.sin(this.rotation.y);
        const oldX = newX;
        const oldZ = newZ;
        newX = oldX * cosY + oldZ * sinY;
        newZ = -oldX * sinY + oldZ * cosY;
      }
      
      // Z轴旋转
      if (this.rotation.z) {
        const cosZ = Math.cos(this.rotation.z);
        const sinZ = Math.sin(this.rotation.z);
        const oldX = newX;
        const oldY = newY;
        newX = oldX * cosZ - oldY * sinZ;
        newY = oldX * sinZ + oldY * cosZ;
      }
    }
    
    // 应用偏移
    newX += this.offset.x;
    newY += this.offset.y;
    newZ += this.offset.z;
    
    // 创建结果对象
    const result = { x: newX, y: newY, z: newZ };
    
    // 如果启用缓存，存储结果
    if (this.cacheEnabled) {
      const cacheKey = `${x},${y},${z}`;
      
      // 如果缓存过大，清除一些旧条目
      if (this.cache.size >= this.cacheSize) {
        const keysIterator = this.cache.keys();
        this.cache.delete(keysIterator.next().value);
      }
      
      this.cache.set(cacheKey, result);
    }
    
    return result;
  }

  /**
   * 转换多个坐标点
   * @param {Array<Object|Array>} points 坐标点数组
   * @returns {Array<Object>} 转换后的坐标点数组
   */
  transformPoints(points) {
    return points.map(point => this.transformPoint(point));
  }

  /**
   * 转换一维数组形式的坐标
   * @param {Array<number>} flatData 一维数组，每dimensions个数字为一组坐标
   * @param {number} dimensions 维度（2 或 3）
   * @param {boolean} inPlace 是否原地修改数组，默认 false
   * @returns {Array<number>} 转换后的平面数据数组
   */
  transformFlatData(flatData, dimensions = 3, inPlace = false) {
    if (dimensions !== 2 && dimensions !== 3) {
      throw new Error('Unsupported dimensions. Only 2D or 3D is allowed.');
    }

    // 创建结果数组（如果不是原地修改）
    const result = inPlace ? flatData : new Array(flatData.length);
    
    // 批量处理以提高性能
    for (let i = 0; i < flatData.length; i += dimensions) {
      // 提取坐标
      let x = flatData[i];
      let y = flatData[i + 1];
      let z = dimensions === 3 ? flatData[i + 2] : 0;
      
      // 应用缩放
      x *= this.scale.x;
      y *= this.scale.y;
      z *= this.scale.z;
      
      // 应用旋转 (简化版本)
      if (this.rotation.x || this.rotation.y || this.rotation.z) {
        // X轴旋转
        if (this.rotation.x) {
          const cosX = Math.cos(this.rotation.x);
          const sinX = Math.sin(this.rotation.x);
          const oldY = y;
          const oldZ = z;
          y = oldY * cosX - oldZ * sinX;
          z = oldY * sinX + oldZ * cosX;
        }
        
        // Y轴旋转
        if (this.rotation.y) {
          const cosY = Math.cos(this.rotation.y);
          const sinY = Math.sin(this.rotation.y);
          const oldX = x;
          const oldZ = z;
          x = oldX * cosY + oldZ * sinY;
          z = -oldX * sinY + oldZ * cosY;
        }
        
        // Z轴旋转
        if (this.rotation.z) {
          const cosZ = Math.cos(this.rotation.z);
          const sinZ = Math.sin(this.rotation.z);
          const oldX = x;
          const oldY = y;
          x = oldX * cosZ - oldY * sinZ;
          y = oldX * sinZ + oldY * cosZ;
        }
      }
      
      // 应用偏移
      x += this.offset.x;
      y += this.offset.y;
      z += this.offset.z;
      
      // 存储结果
      result[i] = x;
      result[i + 1] = y;
      if (dimensions === 3) {
        result[i + 2] = z;
      }
    }

    return result;
  }

  /**
   * 转换 THREE.js 的 BufferGeometry
   * @param {THREE.BufferGeometry} geometry Three.js 几何体
   * @param {boolean} inPlace 是否原地修改几何体，默认 true
   * @returns {THREE.BufferGeometry} 转换后的几何体
   */
  transformGeometry(geometry, inPlace = true) {
    // 获取位置属性
    const positionAttr = geometry.getAttribute('position');
    const positions = positionAttr.array;
    
    // 转换坐标
    const transformed = this.transformFlatData(positions, 3, inPlace);
    
    // 如果不是原地修改，则创建新的几何体
    if (!inPlace) {
      const newGeometry = geometry.clone();
      newGeometry.setAttribute('position', new THREE.BufferAttribute(transformed, 3));
      return newGeometry;
    }
    
    // 更新几何体
    geometry.setAttribute('position', new THREE.BufferAttribute(transformed, 3));
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    
    return geometry;
  }

  /**
   * 更新转换参数
   * @param {Object} params 新的参数
   * @param {Object} params.offset 新的偏移量 { x, y, z }
   * @param {Object} params.scale 新的缩放比例 { x, y, z }
   * @param {Object} params.rotation 新的旋转角度 { x, y, z }
   */
  updateParams(params = {}) {
    const { offset, scale, rotation } = params;
    
    // 更新偏移量
    if (offset) {
      if (offset.x !== undefined) this.offset.x = offset.x;
      if (offset.y !== undefined) this.offset.y = offset.y;
      if (offset.z !== undefined) this.offset.z = offset.z;
    }
    
    // 更新缩放比例
    if (scale) {
      if (scale.x !== undefined) this.scale.x = scale.x;
      if (scale.y !== undefined) this.scale.y = scale.y;
      if (scale.z !== undefined) this.scale.z = scale.z;
    }
    
    // 更新旋转角度
    if (rotation) {
      if (rotation.x !== undefined) this.rotation.x = rotation.x;
      if (rotation.y !== undefined) this.rotation.y = rotation.y;
      if (rotation.z !== undefined) this.rotation.z = rotation.z;
    }
    
    // 清除缓存
    this.clearCache();
  }

  /**
   * 设置缓存配置
   * @param {boolean} enabled 是否启用缓存
   * @param {number} size 缓存大小
   */
  configureCache(enabled = true, size = 1000) {
    this.cacheEnabled = enabled;
    this.cacheSize = size;
    if (!enabled) {
      this.clearCache();
    }
  }

  /**
   * 清除坐标转换缓存
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * 创建一个新的转换器，继承当前转换器的参数
   * @param {Object} additionalParams 额外的参数
   * @returns {CoordinateTransformer} 新的转换器实例
   */
  clone(additionalParams = {}) {
    const params = {
      offset: { ...this.offset },
      scale: { ...this.scale },
      rotation: { ...this.rotation }
    };
    
    // 合并额外参数
    if (additionalParams.offset) {
      Object.assign(params.offset, additionalParams.offset);
    }
    if (additionalParams.scale) {
      Object.assign(params.scale, additionalParams.scale);
    }
    if (additionalParams.rotation) {
      Object.assign(params.rotation, additionalParams.rotation);
    }
    
    return new CoordinateTransformer(params);
  }

  /**
   * 获取当前转换参数
   * @returns {Object} 当前参数
   */
  getParams() {
    return {
      offset: { ...this.offset },
      scale: { ...this.scale },
      rotation: { ...this.rotation }
    };
  }
  
  /**
   * 从 THREE.js 的 Matrix4 创建转换器
   * @param {THREE.Matrix4} matrix 变换矩阵
   * @returns {CoordinateTransformer} 新的转换器实例
   */
  static fromMatrix4(matrix) {
    // 提取位置
    const position = new THREE.Vector3();
    position.setFromMatrixPosition(matrix);
    
    // 提取缩放
    const scale = new THREE.Vector3();
    scale.setFromMatrixScale(matrix);
    
    // 提取旋转
    const rotation = new THREE.Euler();
    rotation.setFromRotationMatrix(matrix);
    
    return new CoordinateTransformer({
      offset: { x: position.x, y: position.y, z: position.z },
      scale: { x: scale.x, y: scale.y, z: scale.z },
      rotation: { x: rotation.x, y: rotation.y, z: rotation.z }
    });
  }
}

export default CoordinateTransformer;