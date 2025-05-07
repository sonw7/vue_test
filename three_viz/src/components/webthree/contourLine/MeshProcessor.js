// MeshProcessor.js
import * as THREE from 'three';

/**
 * 网格处理工具
 * 用于处理和优化三维网格数据
 */
export class MeshProcessor {
  /**
   * 居中网格几何体
   * @param {THREE.BufferGeometry} geometry - Three.js几何体
   * @returns {Array} 居中后的顶点数组
   */
  static centerGeometry(geometry) {
    // 计算边界框
    geometry.computeBoundingBox();
    const boundingBox = geometry.boundingBox;
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    
    // 创建一个偏移矩阵，将几何体居中
    const positionAttribute = geometry.attributes.position;
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i) - center.x;
      const y = positionAttribute.getY(i) - center.y;
      const z = positionAttribute.getZ(i) - center.z;
      
      positionAttribute.setXYZ(i, x, y, z);
    }
    
    // 重新计算边界框
    geometry.computeBoundingBox();
    positionAttribute.needsUpdate = true;
    
    // 提取居中后的顶点数组
    const centeredVertices = [];
    for (let i = 0; i < positionAttribute.count; i++) {
      centeredVertices.push(
        positionAttribute.getX(i),
        positionAttribute.getY(i),
        positionAttribute.getZ(i)
      );
    }
    
    return centeredVertices;
  }
  
  /**
   * 创建示例三维网格数据
   * @param {Number} gridSize - 网格分辨率
   * @param {Number} size - 总大小
   * @returns {Object} 包含顶点、索引和深度值的对象
   */
  static generateSampleData(gridSize = 20, size = 5) {
    // 顶点数组
    const vertices = [];
    // 索引数组
    const indices = [];
    // 深度数组
    const depths = [];
    
    // 生成顶点、z值和深度
    for (let i = 0; i <= gridSize; i++) {
      for (let j = 0; j <= gridSize; j++) {
        const x = (i / gridSize) * size - size / 2;
        const y = (j / gridSize) * size - size / 2;
        
        // 生成z坐标 - 创建起伏的表面
        const z = Math.sin(x * 1.0) * Math.cos(y * 1.0) * 0.8;
        
        // 添加顶点坐标
        vertices.push(x, y, z);
        
        // 生成深度值 (这可能与z坐标不同，表示其他物理量)
        const depth = Math.cos(x * 1.5) * Math.sin(y * 1.5) * 0.5;
        depths.push(depth);
      }
    }
    
    // 生成三角形索引
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const a = i * (gridSize + 1) + j;
        const b = i * (gridSize + 1) + j + 1;
        const c = (i + 1) * (gridSize + 1) + j;
        const d = (i + 1) * (gridSize + 1) + j + 1;
        
        // 每个网格单元生成两个三角形
        indices.push(a, c, b); // 第一个三角形
        indices.push(b, c, d); // 第二个三角形
      }
    }
    
    return {
      vertices,
      indices,
      depths
    };
  }
}

export default MeshProcessor;   