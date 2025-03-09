<template>
  <div class="layer-control" :class="{ 'collapsed': isCollapsed }">
    <div class="layer-header" @click="toggleCollapse">
      <div class="title">
        <i class="el-icon-layers"></i>
        <span>图层控制</span>
      </div>
      <el-button 
        type="text" 
        class="collapse-btn"
        :icon="isCollapsed ? 'el-icon-arrow-down' : 'el-icon-arrow-up'"
      />
    </div>
    
    <div class="layer-content" v-show="!isCollapsed">
      <div class="search-box">
        <el-input 
          v-model="searchText" 
          placeholder="搜索图层" 
          prefix-icon="el-icon-search"
          clearable
          size="small"
        />
      </div>
      <div class="layer-footer">
        <el-button size="small" type="primary" @click="selectAll">全选</el-button>
        <el-button size="small" @click="deselectAll">取消全选</el-button>
      </div>
      <el-tree
        ref="treeRef"
        :data="filteredTreeData"
        :props="treeProps"
        show-checkbox
        node-key="id"
        :default-checked-keys="defaultCheckedKeys"
        @check-change="onLayerToggle"
        :filter-node-method="filterNode"
        class="custom-tree"
      >
        <template #default="{ node, data }">
          <div class="custom-tree-node">
            <span :class="{'layer-name': true, 'parent-node': data.children && data.children.length}">
              <i :class="getNodeIcon(data)" class="node-icon"></i>
              {{ data.label }}
            </span>
            <span class="layer-actions" v-if="!data.children || !data.children.length">
              <i class="el-icon-view action-icon" @click.stop="focusLayer(data)"></i>
            </span>
          </div>
        </template>
      </el-tree>
      

    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
  layerList: {
    type: Array,
    required: true,
  },
});
const emit = defineEmits(['layer-toggle', 'focus-layer']);

const treeRef = ref(null);
const treeData = ref([]);
const defaultCheckedKeys = ref([]);
const isCollapsed = ref(false);
const searchText = ref('');

const treeProps = {
  children: 'children',
  label: 'label',
};

// 根据搜索文本过滤树数据
const filteredTreeData = computed(() => {
  if (!searchText.value) return treeData.value;
  
  // 深拷贝树数据，以便过滤
  const filterTree = (nodes) => {
    if (!nodes) return [];
    
    return nodes.filter(node => {
      // 如果当前节点匹配，直接返回
      if (node.label.toLowerCase().includes(searchText.value.toLowerCase())) {
        return true;
      }
      
      // 如果有子节点，递归过滤
      if (node.children && node.children.length) {
        const filteredChildren = filterTree(node.children);
        if (filteredChildren.length) {
          // 创建新对象，避免修改原始数据
          return {
            ...node,
            children: filteredChildren
          };
        }
      }
      
      return false;
    });
  };
  
  return filterTree(JSON.parse(JSON.stringify(treeData.value)));
});

// 切换折叠状态
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

// 选择所有图层
const selectAll = () => {
  if (treeRef.value) {
    const allKeys = getAllNodeKeys(treeData.value);
    treeRef.value.setCheckedKeys(allKeys);
    onLayerToggle();
  }
};

// 取消选择所有图层
const deselectAll = () => {
  if (treeRef.value) {
    treeRef.value.setCheckedKeys([]);
    onLayerToggle();
  }
};

// 获取所有节点的ID
function getAllNodeKeys(tree) {
  const allKeys = [];
  
  function traverse(node) {
    allKeys.push(node.id);
    if (node.children && node.children.length) {
      node.children.forEach(child => traverse(child));
    }
  }
  
  tree.forEach(root => traverse(root));
  return allKeys;
}

// 获取节点图标
function getNodeIcon(data) {
  if (data.children && data.children.length) {
    return 'el-icon-folder';
  }
  
  // 根据不同类型的图层返回不同的图标
  if (data.label.includes('Layer')) {
    return 'el-icon-document';
  } else if (data.label.includes('Drill')) {
    return 'el-icon-location-information';
  } else {
    return 'el-icon-picture-outline';
  }
}

// 聚焦到指定图层
function focusLayer(data) {
  emit('focus-layer', data.label);
}

// 过滤节点方法
function filterNode(value, data) {
  if (!value) return true;
  return data.label.toLowerCase().includes(value.toLowerCase());
}

function generateTree(data) {
  const tree = {}; 
  let id = 0;
  data.forEach(([parent, child]) => {
    if (!tree[parent]) {
      // 如果父节点不存在，初始化
      tree[parent] = {
        id: `${id}`,
        label: parent,
        children: [],
      };
      id++;
    }
    // 添加子节点
    if(child){
      tree[parent].children.push({
        id: `${tree[parent].id}-${tree[parent].children.length}`,
        label: child,
      });
    }
  });
  let layerTree = Object.values(tree)
  //默认全选
  let keys = getLeafNodeKeys(layerTree);
  defaultCheckedKeys.value = keys
  // 返回最终的树形结构数组
  return layerTree;
}

function getLeafNodeKeys(tree) {
  const leafKeys = [];
  
  function traverse(node) {
    if (!node.children || node.children.length === 0) {
      // 如果没有子节点，则为叶子节点
      leafKeys.push(node.id);
    } else {
      // 否则递归遍历子节点
      node.children.forEach((child) => traverse(child));
    }
  }

  // 遍历树的根节点
  tree.forEach((root) => traverse(root));

  return leafKeys;
}

// 监听 layerList
watch(
  () => props.layerList,
  (newLayers) => {
    console.debug("LayerControl 接收到新的图层列表:", newLayers);
    console.debug("图层列表中的钻孔图层:", newLayers.filter(([group]) => group === '钻孔'));
    treeData.value = generateTree(newLayers);
    
    // 获取叶子节点ID并设置为默认选中
    const keys = getLeafNodeKeys(treeData.value);
    defaultCheckedKeys.value = keys;
  },
  { immediate: true, deep: true }
);

// 处理选中状态变化，只返回叶子节点的 label
const onLayerToggle = () => {
  // 获取所有选中的节点 ID
  const checkedKeys = treeRef.value.getCheckedKeys(true); // 包括半选节点

  // 获取选中的叶子节点的 label
  const selectedLabels = [];
  const findLeafLabels = (nodes) => {
    nodes.forEach((node) => {
      if (!node.children || node.children.length === 0) {
        // 如果是叶子节点，提取 label
        if (checkedKeys.includes(node.id)) {
          selectedLabels.push(node.label);
        }
      } else if (node.children) {
        // 如果有子节点，递归查找
        findLeafLabels(node.children);
      }
    });
  };

  findLeafLabels(treeData.value);
  emit('layer-toggle', selectedLabels); // 将叶子节点的 label 返回给父组件
};

// 监听搜索文本变化
watch(searchText, (val) => {
  if (treeRef.value) {
    treeRef.value.filter(val);
  }
});
</script>

<style scoped>
.layer-control {
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: rgba(255, 255, 255, 0.85);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 10;
  width: 280px;
  max-height: calc(100vh - 40px);
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.layer-control.collapsed {
  width: 180px;
  height: 50px;
  overflow: hidden;
}

.layer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #4b6cb7, #182848);
  color: white;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  cursor: pointer;
  user-select: none;
}

.layer-header .title {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}

.layer-header .title i {
  margin-right: 8px;
  font-size: 18px;
}

.collapse-btn {
  color: white;
  font-size: 16px;
}

.layer-content {
  padding: 15px;
  overflow-y: auto;
  max-height: calc(100vh - 120px);
}

.search-box {
  margin-bottom: 15px;
}

.custom-tree {
  margin-bottom: 15px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.custom-tree-node {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
}

.layer-name {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.parent-node {
  font-weight: 600;
  color: #2c3e50;
}

.node-icon {
  margin-right: 6px;
  font-size: 16px;
  color: #409EFF;
}

.layer-actions {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.custom-tree-node:hover .layer-actions {
  opacity: 1;
}

.action-icon {
  cursor: pointer;
  color: #606266;
  margin-left: 8px;
  font-size: 16px;
}

.action-icon:hover {
  color: #409EFF;
}

.layer-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #eaeaea;
}

/* 自定义滚动条样式 */
.layer-content::-webkit-scrollbar,
.custom-tree::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.layer-content::-webkit-scrollbar-thumb,
.custom-tree::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}

.layer-content::-webkit-scrollbar-track,
.custom-tree::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 3px;
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .layer-control {
    background-color: rgba(30, 30, 30, 0.85);
    border-color: rgba(60, 60, 60, 0.3);
  }
  
  .layer-header {
    background: linear-gradient(135deg, #2c3e50, #1a2a3a);
  }
  
  .parent-node {
    color: #e0e0e0;
  }
  
  .layer-footer {
    border-top-color: #3a3a3a;
  }
  
  .custom-tree :deep(.el-tree-node__content:hover) {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  .custom-tree :deep(.el-tree-node__content) {
    background-color: transparent;
  }
}
</style>