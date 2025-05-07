// ContourGenerator.js
import * as THREE from 'three';

/**
 * 三维等值线生成器
 * 用于在三维三角网格上生成等值线
 */
export class ContourGenerator {
  /**
   * 构造函数
   */
  constructor() {
    // 创建等值线对象组
    this.contourLines = new THREE.Group();
    
    // 默认等值线参数
    this.params = {
      contourCount: 10,
      contourColor: '#000000',
      contourOpacity: 0.7
    };
  }
  
  /**
   * 设置等值线参数
   * @param {Object} params - 等值线参数
   */
  setParams(params) {
    Object.assign(this.params, params);
    return this;
  }
  
  /**
   * 为三维网格创建三角形数据结构
   * @param {Array} vertices - 顶点数组 [x1, y1, z1, x2, y2, z2, ...]
   * @param {Array} indices - 索引数组 [i1, i2, i3, i4, i5, i6, ...]
   * @returns {Array} 三角形数据数组
   */
  createTriangleData(vertices, indices) {
    const triangles = [];
    for (let i = 0; i < indices.length; i += 3) {
      const idx1 = indices[i];
      const idx2 = indices[i + 1];
      const idx3 = indices[i + 2];
      
      const v1 = new THREE.Vector3(
        vertices[idx1 * 3], 
        vertices[idx1 * 3 + 1], 
        vertices[idx1 * 3 + 2]
      );
      
      const v2 = new THREE.Vector3(
        vertices[idx2 * 3], 
        vertices[idx2 * 3 + 1], 
        vertices[idx2 * 3 + 2]
      );
      
      const v3 = new THREE.Vector3(
        vertices[idx3 * 3], 
        vertices[idx3 * 3 + 1], 
        vertices[idx3 * 3 + 2]
      );
      
      triangles.push({
        vertices: [v1, v2, v3],
        indices: [idx1, idx2, idx3]
      });
    }
    return triangles;
  }
  
  /**
   * 计算等值线级别
   * @param {Number} minDepth - 最小深度值
   * @param {Number} maxDepth - 最大深度值
   * @param {Number} count - 等值线数量
   * @returns {Array} 等值线级别数组
   */
  calculateContourLevels(minDepth, maxDepth, count) {
    const levels = [];
    const step = (maxDepth - minDepth) / (count + 1);
    
    for (let i = 1; i <= count; i++) {
      levels.push(minDepth + step * i);
    }
    
    return levels;
  }
  
  /**
   * 生成三维等值线
   * @param {Array} vertices - 顶点数组
   * @param {Array} indices - 索引数组
   * @param {Array} depths - 深度值数组
   * @param {Array} [contourLevels] - 可选的等值线级别数组
   * @returns {THREE.Group} 等值线对象组
   */
  generate(vertices, indices, depths, contourLevels) {
    // 清空旧的等值线
    while (this.contourLines.children.length > 0) {
      const line = this.contourLines.children[0];
      if (line.geometry) line.geometry.dispose();
      if (line.material) line.material.dispose();
      this.contourLines.remove(line);
    }
    
    // 如果没有提供等值线级别，则计算
    if (!contourLevels) {
      const minDepth = Math.min(...depths);
      const maxDepth = Math.max(...depths);
      contourLevels = this.calculateContourLevels(minDepth, maxDepth, this.params.contourCount);
    }
    
    // 创建三角形数据结构
    const triangles = this.createTriangleData(vertices, indices);
    
    // 处理每个等值线级别
    for (let level of contourLevels) {
      const lineSegments = [];
      
      // 对每个三角形进行处理
      for (const triangle of triangles) {
        const v1 = triangle.vertices[0];
        const v2 = triangle.vertices[1];
        const v3 = triangle.vertices[2];
        
        const idx1 = triangle.indices[0];
        const idx2 = triangle.indices[1];
        const idx3 = triangle.indices[2];
        
        const d1 = depths[idx1];
        const d2 = depths[idx2];
        const d3 = depths[idx3];
        
        // 确定哪些顶点在等值面的哪一侧
        const above1 = d1 > level;
        const above2 = d2 > level;
        const above3 = d3 > level;
        
        // 计算等值线在三角形边上的交点
        const intersections = [];
        
        if (above1 !== above2) {
          const t = (level - d1) / (d2 - d1);
          const point = new THREE.Vector3().lerpVectors(v1, v2, t);
          intersections.push(point);
        }
        
        if (above2 !== above3) {
          const t = (level - d2) / (d3 - d2);
          const point = new THREE.Vector3().lerpVectors(v2, v3, t);
          intersections.push(point);
        }
        
        if (above3 !== above1) {
          const t = (level - d3) / (d1 - d3);
          const point = new THREE.Vector3().lerpVectors(v3, v1, t);
          intersections.push(point);
        }
        
        // 如果有两个交点，则添加一个线段
        if (intersections.length === 2) {
          lineSegments.push(intersections[0], intersections[1]);
        }
      }
      
      // 创建线段几何体
      if (lineSegments.length > 0) {
        const geometry = new THREE.BufferGeometry();
        geometry.setFromPoints(lineSegments);
        
        const material = new THREE.LineBasicMaterial({ 
          color: this.params.contourColor, 
          linewidth: 1,
          opacity: this.params.contourOpacity,
          transparent: true
        });
        
        const line = new THREE.LineSegments(geometry, material);
        this.contourLines.add(line);
      }
    }
    
    return this.contourLines;
  }
  
  /**
   * 获取等值线对象组
   * @returns {THREE.Group} 等值线对象组
   */
  getContourLines() {
    return this.contourLines;
  }
  
  /**
   * 更新等值线颜色和透明度
   * @param {String} color - 颜色
   * @param {Number} opacity - 透明度
   */
  updateAppearance(color, opacity) {
    this.params.contourColor = color;
    this.params.contourOpacity = opacity;
    
    this.contourLines.children.forEach(line => {
      line.material.color.set(color);
      line.material.opacity = opacity;
    });
  }
}

export default ContourGenerator;