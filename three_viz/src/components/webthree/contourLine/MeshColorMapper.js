// MeshColorMapper.js
import * as THREE from 'three';

/**
 * 网格颜色映射工具
 * 用于根据深度值为网格顶点着色
 */
export class MeshColorMapper {
  /**
   * 根据深度值映射颜色
   * @param {Number} depth - 深度值
   * @param {Number} minDepth - 最小深度值
   * @param {Number} maxDepth - 最大深度值
   * @returns {THREE.Color} 颜色对象
   */
  static mapDepthToColor(depth, minDepth, maxDepth) {
    // 将深度归一化到0-1范围
    const normalizedDepth = (depth - minDepth) / (maxDepth - minDepth);
    
    // 使用颜色映射 - 从蓝色(深)到红色(浅)
    return new THREE.Color().setHSL(
      0.6 * (1 - normalizedDepth), // 色相: 从蓝色到红色
      0.8,                         // 饱和度: 固定
      0.3 + normalizedDepth * 0.4  // 亮度: 随深度增加
    );
  }
  
  /**
   * 为网格生成颜色属性
   * @param {Array} depths - 深度值数组
   * @returns {Object} 包含颜色数组和深度范围的对象
   */
  static generateColors(depths) {
    const minDepth = Math.min(...depths);
    const maxDepth = Math.max(...depths);
    
    const colors = [];
    for (let i = 0; i < depths.length; i++) {
      const color = this.mapDepthToColor(depths[i], minDepth, maxDepth);
      colors.push(color.r, color.g, color.b);
    }
    
    return {
      colors,
      depthRange: { min: minDepth, max: maxDepth }
    };
  }
}

export default MeshColorMapper;