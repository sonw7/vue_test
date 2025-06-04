<template>
  <div ref="sceneContainer">
    <!-- 通用扩展菜单 -->
    <Menu
      title="场景控制"
      :items="menuItems"
      :values="menuValues"
      @change="onMenuChange"
      @action="onMenuAction"
    />
    <!-- 图层控制面板 -->
    <LayerControl
      v-if="layerNames.length > 0"
      :layerList="layerNames"
      @layer-toggle="onLayerToggle"
    />
  </div>
</template>

<script>
import { onMounted, onUnmounted, ref, reactive, watch, computed } from "vue";
import { useThreeStore } from "../../../store/threeStore";
import SceneManager from "./SceneManager";
import { processData } from '../utils/dataUtils';
import { getcolorbylayer } from '../utils/getMeshColor';
import CoordinateTransformer from '../utils/CoordinateTransformer';
import roadmodeltest from "../staticModel/RoadwayModel";
import { ContourMeshCreator } from '../contourLine/ContourMeshCreator';

import * as THREE from 'three';

import LayerControl from "./LayerControl.vue";
import Menu from "./Menu.vue";
import { menuItems as baseMenuItems, menuDefaultValues } from "../configs/menuConfig";
import { handleMenuChange, handleMenuAction } from "./Menu/menuHandlers";
import { toggleLayerVisibility } from "../utils/layerVisibility";
import { getTextureUrl } from '../utils/uvMappingUtils';
import { loadAndRenderDrills } from "../staticModel/DrillModel";
import { getLayerName } from '../view_util/layerUtils';

export default {
  name: "ThreeScene",
  components: {
    LayerControl,
    Menu,
  },
  setup() {
    const sceneContainer = ref(null);
    const sceneManager = ref(null);
    const sceneTransformer = ref(null);
    const globalOffset = ref({ x: 0, y: 0, z: 0 });
    const modelCentered = ref(false);
    const threeStore = useThreeStore();

    // 等值线相关状态
    const contourCreators = ref({}); // 存储每个地层的等值线创建器
    const contourVisible = ref({}); // 存储每个地层的等值线可见性
    const activeContourLayer = ref(null); // 当前活动的等值线图层
    
    // 等值线参数
    const contourParams = reactive({
      count: 10,
      color: '#000000',
      opacity: 0.7,
      scale: 1.0
    });

    // 动态菜单项配置
    const menuItems = ref([...baseMenuItems]);
    
    // 添加等值线控制菜单项
    const contourMenuItem = {
      key: "contourLines",
      label: "等值线控制",
      type: "group",
      children: [
        {
          key: "enableContour",
          label: "显示等值线",
          type: "switch",
          value: false
        },
        {
          key: "contourLayer",
          label: "选择地层",
          type: "select",
          options: [], // 将在更新菜单项时填充
          value: ""
        },
        {
          key: "contourCount",
          label: "等值线数量",
          type: "slider",
          min: 1,
          max: 30,
          step: 1,
          value: contourParams.count
        },
        {
          key: "contourColor",
          label: "等值线颜色",
          type: "color",
          value: contourParams.color
        },
        {
          key: "contourOpacity",
          label: "等值线透明度",
          type: "slider",
          min: 0,
          max: 1,
          step: 0.1,
          value: contourParams.opacity
        }
      ]
    };
    
    // 将等值线菜单添加到menuItems
    menuItems.value.push(contourMenuItem);
    
    const menuValues = reactive({ 
      ...menuDefaultValues,
      enableContour: false,
      contourLayer: "",
      contourCount: contourParams.count,
      contourColor: contourParams.color,
      contourOpacity: contourParams.opacity
    });
    
    // 监听store中的状态变化
    watch(() => threeStore.contourEnabled, (enabled) => {
      toggleContourLines(enabled);
    });
    
    watch(() => threeStore.activeContourLayer, (layerName) => {
      if (layerName) {
        updateActiveContourLayer(layerName);
      }
    });
    
    watch(() => threeStore.contourParams, (params) => {
      // 更新等值线参数
      Object.entries(params).forEach(([key, value]) => {
        updateContourParam(key, value);
      });
    }, { deep: true });
    
    // 同步全局偏移量到store
    watch(globalOffset, (newOffset) => {
      threeStore.updateGlobalOffset(newOffset);
    }, { deep: true });
    
    // 同步模型居中状态到store
    watch(modelCentered, (centered) => {
      threeStore.setModelCentered(centered);
    });

    // 存储所有图层的名称
    const layerNames = ref([]);

// 动态生成地层选择的选项
const updateMenuItems = () => {
  // 筛选出只属于"地层"组的图层，用于地层间距计算和等值线
  const layerOptions = layerNames.value
    .filter(([group]) => group === "地层")
    .map(([group, name]) => ({
      label: name,
      value: name,
    }));
  
  // 所有图层选项，用于透明度控制
  const allLayerOptions = layerNames.value
    .map(([group, name]) => ({
      label: `${group} - ${name}`,
      value: name,
    }));
  
  menuItems.value = menuItems.value.map((item) => {
    if (item.key === "layerTransparency") {
      // 更新透明度控制中的地层选择下拉框
      return {
        ...item,
        children: item.children.map(child => {
          if (child.key === "layerSelect") {
            return { ...child, options: allLayerOptions };
          }
          return child;
        })
      };
    }
    else if (item.key === "layerDistanceCalculation") {
      // 更新地层间距计算中的源地层和目标地层选项
      return {
        ...item,
        children: item.children.map(child => {
          if (child.key === "sourceLayer" || child.key === "targetLayer") {
            return { ...child, options: layerOptions };
          }
          return child;
        })
      };
    }
    else if (item.key === "contourLines") {
      // 更新等值线控制中的地层选择下拉框
      return {
        ...item,
        children: item.children.map(child => {
          if (child.key === "contourLayer") {
            return { ...child, options: layerOptions };
          }
          return child;
        })
      };
    }
        return item;
  });
};
   
    // 监听 layerNames 的变化，并更新 menuItems
    watch(layerNames, updateMenuItems, { deep: true });

    const onLayerToggle = (activeLayers) => {
      if (!sceneManager.value) {
        console.error("SceneManager is not initialized");
        return;
      }
      toggleLayerVisibility(sceneManager.value, activeLayers, layerNames.value);
      
      // 更新store中的图层可见性
      const layerVisibilityMap = {};
      layerNames.value.forEach(([_, name]) => {
        layerVisibilityMap[name] = activeLayers.includes(name);
      });
      threeStore.updateLayerVisibility(layerVisibilityMap);
    };

    // 计算模型包围盒并居中
    const centerModelAndUpdateTransformer = (layer) => {
      if (!sceneManager.value || !sceneTransformer.value) return;
      
      const meshes = sceneManager.value.getMeshesByLayer(layer);
      if (!meshes || meshes.length === 0) return;
      
      // 创建临时组以计算整体包围盒
      const group = new THREE.Group();
      meshes.forEach(mesh => {
        // 确保每个网格有正确的包围盒
        if (mesh.geometry && !mesh.geometry.boundingBox) {
          mesh.geometry.computeBoundingBox();
        }
        group.add(mesh.clone());
      });
      
      // 计算整体包围盒
      const boundingBox = new THREE.Box3().setFromObject(group);
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);
      
      console.log(`Layer ${layer} bounding box:`, boundingBox);
      console.log(`Layer ${layer} center:`, center);
      
      // 计算需要的偏移量使模型居中
      const offset = {
        x: -center.x,
        y: -center.y,
        z: -center.z
      };
      
      // 更新全局偏移量
      globalOffset.value = offset;
      
      // 更新坐标转换器
      sceneTransformer.value.updateParams({
        offset: offset
      });
      
      // 应用偏移到已加载的模型
      meshes.forEach(mesh => {
        mesh.position.set(
          mesh.position.x + offset.x,
          mesh.position.y + offset.y,
          mesh.position.z + offset.z
        );
      });
      
      // 标记模型已居中
      modelCentered.value = true;
      
      // 同步到store
      threeStore.setModelCentered(true);
      threeStore.updateGlobalOffset(offset);
      
      console.log(`Applied offset to center model: `, offset);
      
      return offset;
    };

    // 等值线相关功能
    
    // 为指定图层创建等值线
    const createContourForLayer = (layerName) => {
      if (!sceneManager.value) return;
      
      // 获取图层的网格
      const meshes = sceneManager.value.getMeshesByLayer(layerName);
      if (!meshes || meshes.length === 0) {
        console.warn(`No meshes found for layer: ${layerName}`);
        return;
      }
      
      const mesh = meshes[0]; // 假设每个图层只有一个网格
      
      // 提取网格的顶点、索引和深度数据
      const vertices = Array.from(mesh.geometry.attributes.position.array);
      const indices = mesh.geometry.index ? Array.from(mesh.geometry.index.array) : [];
      
      // 使用顶点的z坐标作为深度值
      const depths = [];
      for (let i = 0; i < vertices.length; i += 3) {
        depths.push(vertices[i + 2]);
      }
      
      // 创建等值线生成器
      const contourCreator = new ContourMeshCreator({
        scale: contourParams.scale,
        contourCount: contourParams.count,
        contourColor: contourParams.color,
        contourOpacity: contourParams.opacity
      });
      
      // 生成等值线
      const { contourLines } = contourCreator.createFromData({
        vertices,
        indices,
        depths
      });
      
      // 将等值线应用到场景中，并应用与网格相同的变换
      contourLines.position.copy(mesh.position);
      contourLines.rotation.copy(mesh.rotation);
      contourLines.scale.copy(mesh.scale);
      
      // 默认隐藏等值线
      contourLines.visible = false;
      
      // 将等值线添加到场景
      sceneManager.value.scene.add(contourLines);
      
      // 存储等值线创建器以便后续更新
      contourCreators.value[layerName] = {
        creator: contourCreator,
        contourLines: contourLines
      };
      
      // 初始化可见性状态
      contourVisible.value[layerName] = false;
      
      console.log(`Created contour lines for layer: ${layerName}`);
      
      return contourLines;
    };
    
    // 切换等值线显示状态
    const toggleContourLines = (visible) => {
      if (!activeContourLayer.value) {
        // 如果没有活动图层，但开启了等值线，则自动选择第一个地层图层
        if (visible) {
          const firstLayerName = layerNames.value.find(([group]) => group === "地层")?.[1];
          if (firstLayerName) {
            updateActiveContourLayer(firstLayerName);
            menuValues.contourLayer = firstLayerName;
          }
        }
        return;
      }
      
      const layerName = activeContourLayer.value;
      
      // 如果该图层还没有等值线，则创建
      if (!contourCreators.value[layerName]) {
        createContourForLayer(layerName);
      }
      
      // 更新等值线可见性
      if (contourCreators.value[layerName]) {
        contourCreators.value[layerName].contourLines.visible = visible;
        contourVisible.value[layerName] = visible;
      }
    };
    
    // 更新活动等值线图层
    const updateActiveContourLayer = (layerName) => {
      // 隐藏当前活动图层的等值线
      if (activeContourLayer.value && contourCreators.value[activeContourLayer.value]) {
        contourCreators.value[activeContourLayer.value].contourLines.visible = false;
      }
      
      // 设置新的活动图层
      activeContourLayer.value = layerName;
      
      // 如果启用了等值线显示，则显示新图层的等值线
      if (menuValues.enableContour) {
        // 如果该图层还没有等值线，则创建
        if (!contourCreators.value[layerName]) {
          createContourForLayer(layerName);
        }
        
        // 显示等值线
        if (contourCreators.value[layerName]) {
          contourCreators.value[layerName].contourLines.visible = true;
          contourVisible.value[layerName] = true;
        }
      }
    };
    
    // 更新等值线参数
    const updateContourParam = (param, value) => {
      contourParams[param] = value;
      
      // 如果有活动图层，则更新其等值线
      if (activeContourLayer.value && contourCreators.value[activeContourLayer.value]) {
        const { creator, contourLines } = contourCreators.value[activeContourLayer.value];
        
        // 更新等值线参数
        creator.updateContourParams({
          contourCount: contourParams.count,
          contourColor: contourParams.color,
          contourOpacity: contourParams.opacity
        });
        
        // 获取图层的网格
        const meshes = sceneManager.value.getMeshesByLayer(activeContourLayer.value);
        if (!meshes || meshes.length === 0) return;
        
        const mesh = meshes[0];
        
        // 提取网格数据
        const vertices = Array.from(mesh.geometry.attributes.position.array);
        const indices = mesh.geometry.index ? Array.from(mesh.geometry.index.array) : [];
        
        // 使用顶点的z坐标作为深度值
        const depths = [];
        for (let i = 0; i < vertices.length; i += 3) {
          depths.push(vertices[i + 2]);
        }
        
        // 移除旧的等值线
        sceneManager.value.scene.remove(contourLines);
        
        // 生成新的等值线
        const { contourLines: newContourLines } = creator.createFromData({
          vertices,
          indices,
          depths
        });
        
        // 应用与网格相同的变换
        newContourLines.position.copy(mesh.position);
        newContourLines.rotation.copy(mesh.rotation);
        newContourLines.scale.copy(mesh.scale);
        
        // 设置可见性
        newContourLines.visible = contourVisible.value[activeContourLayer.value];
        
        // 添加到场景
        sceneManager.value.scene.add(newContourLines);
        
        // 更新引用
        contourCreators.value[activeContourLayer.value].contourLines = newContourLines;
      }
    };

    // 扩展菜单变更处理函数
    const onMenuChange = (event) => {
      const { key, value } = event;
      
      // 处理等值线相关的菜单变更
      if (key === 'enableContour') {
        toggleContourLines(value);
        threeStore.toggleContourLines(value);
      } else if (key === 'contourLayer') {
        updateActiveContourLayer(value);
        threeStore.setActiveContourLayer(value);
      } else if (key === 'contourCount') {
        updateContourParam('count', value);
        threeStore.updateContourParam('count', value);
      } else if (key === 'contourColor') {
        updateContourParam('color', value);
        threeStore.updateContourParam('color', value);
      } else if (key === 'contourOpacity') {
        updateContourParam('opacity', value);
        threeStore.updateContourParam('opacity', value);
      } else {
        // 处理其他菜单项
        handleMenuChange(event, sceneManager.value);
      }
    };
    
    const onMenuAction = (key) => handleMenuAction(key, sceneManager.value);

onMounted(() => {
  if (sceneContainer.value) {
    const manager = new SceneManager(sceneContainer.value);
    manager.init();
    sceneManager.value = manager;

    // 初始化坐标转换器
    const transformer = new CoordinateTransformer({
      offset: {
        x: 0,
        y: 0,
        z: 0
      },
      scale: {
        x: 1,
        y: 1,
        z: 1
      },
      rotation: {
        x: -Math.PI / 2,
        y: 0,
        z: -Math.PI/2
      }
    });
    
    sceneTransformer.value = transformer;

    // 本地加载巷道模型
    roadmodeltest(sceneManager.value, layerNames.value);

        // 首先加载并处理地层数据
        fetch("/jsonData/layer.txt")
          .then(response => {
            if (!response.ok) {
              throw new Error("Network response was not ok");
            }
            return response.text();
          })
          .then(text => {
            const processedData = processData(text);
            console.log("地层数量", processedData.length);
            console.log("地层数据", processedData);
            
            // 添加第一个图层
            if (processedData.length > 0) {
              const firstLayerName = getLayerName(0);
              
              // 添加第一个图层
              sceneManager.value.addModel({
                type: "triangleMesh",
                data: {
                  vertices: processedData[0].vertices,
                  indices: processedData[0].indices,
                },
                layer: firstLayerName,
                options: {
                  color: getcolorbylayer(0),
                  scaleFactor: transformer.scale.x,
                  rotationAngle: { x: transformer.rotation.x, z: transformer.rotation.z },
                  position: { x: 0, y: 0, z: 0 },
                  textureUrl: getTextureUrl(0),
                  textureRepeat: 50
                },
              });
              
              layerNames.value.push(["地层", firstLayerName]);
              
              // 计算包围盒并获取偏移量
              const offset = centerModelAndUpdateTransformer(firstLayerName);
              
              // 使用计算出的偏移量更新transformer
              transformer.updateParams({
                offset: offset
              });
              
              console.log("Updated transformer with offset:", offset);
              console.log("Current transformer params:", transformer.getParams());
              
              // 添加其余图层，应用相同的偏移
              for (let i = 1; i < processedData.length; i++) {
                if(i==17){
                  continue;
                }
                const layerName = getLayerName(i);
                
                // 使用更新后的transformer应用到新模型
                sceneManager.value.addModel({
                  type: "triangleMesh",
                  data: {
                    vertices: processedData[i].vertices,
                    indices: processedData[i].indices,
                  },
                  layer: layerName,
                  options: {
                    color: getcolorbylayer(i),
                    scaleFactor: transformer.scale.x,
                    rotationAngle: { x: transformer.rotation.x, z: transformer.rotation.z },
                    position: transformer.offset,
                    textureUrl: getTextureUrl(i),
                    textureRepeat: 100
                  },
                });
                
                layerNames.value.push(["地层", layerName]);
              }
              
              // 重要：在所有地层加载完成后，再加载钻孔数据
              console.log("开始加载钻孔，使用的偏移量:", transformer.offset);
              loadAndRenderDrills(sceneManager.value, transformer, layerNames.value);
              
              // 在地层处理完成后，再加载断层数据
              // 这样可以确保使用正确的偏移量
              return fetch("/jsonData/fault.txt");
            }
            
            return Promise.reject("No layer data found");
          })
          .then(response => {
            if (!response.ok) {
              throw new Error("Network response was not ok");
            }
            return response.text();
          })
          .then(text => {
            const processedData = processData(text);
            console.log("断层数量", processedData.length);
            console.log("断层数据", processedData);
            console.log("加载断层使用的偏移量:", sceneTransformer.value.offset);
            
            // 添加断层图层，使用已更新的偏移量
            if (processedData.length > 0) {
              for (let i = 0; i < processedData.length; i++) {
                const layerName = `Fault_${i}`;
                
                // 使用更新后的transformer应用到新模型
                sceneManager.value.addModel({
                  type: "triangleMesh",
                  data: {
                    vertices: processedData[i].vertices,
                    indices: processedData[i].indices,
                  },
                  layer: layerName,
                  options: {
                    color: "#ec6a5d",
                    scaleFactor: sceneTransformer.value.scale.x,
                    rotationAngle: { 
                      x: sceneTransformer.value.rotation.x, 
                      z: sceneTransformer.value.rotation.z
                    },
                    position: {
                      x: sceneTransformer.value.offset.x*0.388,
                      y: sceneTransformer.value.offset.y,
                      z: sceneTransformer.value.offset.z*1.745
                    },
                  },
                });
                
                layerNames.value.push(["断层", layerName]);
              }
            }
          })
          .catch(error => {
            console.error("Error loading and processing data:", error);
          });

        // 监听窗口大小变化，更新画布尺寸
        const resizeHandler = () => {
          if (sceneManager.value && sceneContainer.value) {
            sceneManager.value.onWindowResize(
              sceneContainer.value.clientWidth,
              sceneContainer.value.clientHeight
            );
          }
        };
        window.addEventListener("resize", resizeHandler);

        // 将sceneManager暴露给全局，方便调试
        window.sceneManager = sceneManager.value;
      }
    });
    
    onUnmounted(() => {
      if (sceneManager.value) {
        sceneManager.value.dispose();
      }
      window.removeEventListener("resize", () => sceneManager.value.onWindowResize());
      
      // 移除全局引用
      if (window.sceneManager === sceneManager.value) {
        window.sceneManager = null;
      }
    });

    return {
      sceneContainer,
      sceneManager, // 暴露给模板使用
      menuItems,
      menuValues,
      layerNames,
      onMenuChange,
      onMenuAction,
      onLayerToggle,
      // 暴露等值线相关方法
      toggleContourLines,
      updateActiveContourLayer,
      updateContourParam,
      // 暴露给模板使用的方法
      centerModelAndUpdateTransformer
    };
  },
};
</script>

<style scoped>
/* 将容器设置为 100vw 和 100vh，确保画布自适应屏幕宽高 */
div {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
.distance-legend {
  z-index: 1000;
  font-size: 12px;
  font-family: Arial, sans-serif;
}
</style>