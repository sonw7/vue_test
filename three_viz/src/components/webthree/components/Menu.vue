<template>
  <div class="menu" :class="{ collapsed: isCollapsed }">
    <div class="menu-header">
      <h3 v-if="!isCollapsed">{{ title }}</h3>
      <button class="toggle-button" @click="toggleMenu">
        <span v-if="isCollapsed">展开</span>
        <span v-else>收起</span>
      </button>
    </div>
    <div v-if="!isCollapsed" class="menu-content">
      <!-- 遍历所有菜单项 -->
      <div v-for="(item, index) in items" :key="index" class="menu-item">
        <!-- 分组菜单 -->
        <div v-if="item.type === 'group'" class="menu-group">
          <div class="group-header" @click="toggleGroup(item)">
            <h4>{{ item.label }}</h4>
            <span class="group-toggle" :class="{ 'group-open': isGroupOpen(item) }">▶</span>
          </div>
          <div v-if="isGroupOpen(item)" class="group-content">
            <!-- 递归处理子菜单项 -->
            <div v-for="(child, childIndex) in item.children" :key="`${index}-${childIndex}`" class="menu-item">
              <!-- 下拉框 -->
              <div v-if="child.type === 'select'" class="select-wrapper">
                <label :for="`menu-item-${index}-${childIndex}`">{{ child.label }}</label>
                <select
                  :id="`menu-item-${index}-${childIndex}`"
                  :data-key="child.key"
                  v-model="localValues[child.key]"
                  @change="emitChange(child.key)"
                  class="styled-select"
                >
                  <option
                    v-for="(option, idx) in child.options"
                    :key="idx"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </div>
              
              <!-- 按钮 -->
              <button
                v-else-if="child.type === 'button'"
                @click="emitAction(child.key)"
                class="action-button"
              >
                {{ child.label }}
              </button>
              
              <!-- 开关 -->
              <div v-else-if="child.type === 'switch'" class="switch-wrapper">
                <label :for="`menu-item-${index}-${childIndex}`">
                  <input
                    type="checkbox"
                    :id="`menu-item-${index}-${childIndex}`"
                    v-model="localValues[child.key]"
                    @change="emitChange(child.key)"
                  />
                  <span class="custom-checkbox"></span>
                  {{ child.label }}
                </label>
              </div>
              
              <!-- 滑块 -->
              <div v-else-if="child.type === 'slider'" class="slider-wrapper">
                <div class="slider-header">
                  <label :for="`menu-item-${index}-${childIndex}`">{{ child.label }}</label>
                  <span class="slider-value">{{ localValues[child.key].toFixed(child.decimal || 1) }}</span>
                </div>
                <input
                  type="range"
                  :id="`menu-item-${index}-${childIndex}`"
                  v-model.number="localValues[child.key]"
                  :min="child.min"
                  :max="child.max"
                  :step="child.step"
                  @input="emitChange(child.key)"
                  class="styled-slider"
                />
              </div>
            </div>
          </div>
        </div>
        
        <!-- 非分组菜单项 (保留原有代码) -->
        <!-- 下拉框 -->
        <div v-else-if="item.type === 'select'" class="select-wrapper">
          <label :for="'menu-item-' + index">{{ item.label }}</label>
          <select
            :id="'menu-item-' + index"
            :data-key="item.key"
            v-model="localValues[item.key]"
            @change="emitChange(item.key)"
            class="styled-select"
          >
            <option
              v-for="(option, idx) in item.options"
              :key="idx"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>
    
        <!-- 按钮 -->
        <button
          v-else-if="item.type === 'button'"
          @click="emitAction(item.key)"
          class="action-button"
        >
          {{ item.label }}
        </button>
    
        <!-- 开关 -->
        <div v-else-if="item.type === 'switch'" class="switch-wrapper">
          <label :for="'menu-item-' + index">
            <input
              type="checkbox"
              :id="'menu-item-' + index"
              v-model="localValues[item.key]"
              @change="emitChange(item.key)"
            />
            <span class="custom-checkbox"></span>
            {{ item.label }}
          </label>
        </div>
    
        <!-- 滑块 -->
        <div v-else-if="item.type === 'slider'" class="slider-wrapper">
          <div class="slider-header">
            <label :for="'menu-item-' + index">{{ item.label }}</label>
            <span class="slider-value">{{ localValues[item.key].toFixed(item.decimal || 1) }}</span>
          </div>
          <input
            type="range"
            :id="'menu-item-' + index"
            v-model.number="localValues[item.key]"
            :min="item.min"
            :max="item.max"
            :step="item.step"
            @input="emitChange(item.key)"
            class="styled-slider"
          />
        </div>
      </div>
    </div>
  </div>
</template>
  
<script>
import { ref, reactive, watch } from 'vue';

export default {
  name: "Menu",
  props: {
    title: {
      type: String,
      default: "控制面板",
    },
    items: {
      type: Array,
      required: true,
    },
    values: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props, { emit }) {
    const isCollapsed = ref(false);
    const localValues = reactive({ ...props.values });
    const openGroups = reactive({});
    
    // 初始化所有分组为展开状态
    function initGroups() {
      props.items.forEach(item => {
        if (item.type === 'group') {
          openGroups[item.key] = true;
        }
      });
    }
    
    // 监听外部传入的 values 变化
    watch(() => props.values, (newValues) => {
      Object.assign(localValues, newValues);
    }, { deep: true });
    
    // 切换菜单的展开/收缩状态
    function toggleMenu() {
      isCollapsed.value = !isCollapsed.value;
    }
    
    // 切换分组的展开/收缩状态
    function toggleGroup(group) {
      openGroups[group.key] = !openGroups[group.key];
    }
    
    // 检查分组是否展开
    function isGroupOpen(group) {
      return openGroups[group.key] !== false;
    }
    
    // 触发父组件的 change 事件
    function emitChange(key) {
      emit("change", { key, value: localValues[key] });
    }
    
    // 触发父组件的 action 事件
    function emitAction(key) {
      emit("action", key);
    }
    
    // 初始化分组状态
    initGroups();
    
    return {
      isCollapsed,
      localValues,
      openGroups,
      toggleMenu,
      toggleGroup,
      isGroupOpen,
      emitChange,
      emitAction
    };
  }
};
</script>
  
<style scoped>
/* 使用 fixed 定位，确保菜单浮在最上层，不占用画布布局 */
.menu {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 10000; /* 确保高于画布 */
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(245, 245, 245, 0.85));
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0px 6px 16px rgba(0, 0, 0, 0.15);
  width: 240px; /* 默认宽度 */
  transition: all 0.3s ease;
  font-family: 'Arial', sans-serif;
  font-size: 14px;
  color: #333;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.5);
}
  
.menu.collapsed {
  width: 60px; /* 收缩时宽度 */
  height: 60px; /* 收缩时高度 */
  overflow: hidden;
  display: flex;
  justify-content: center; /* 居中内容 */
  align-items: center;
  background: linear-gradient(135deg, #3498db, #2980b9);
  border-radius: 50%;
  padding: 0;
}
  
/* 菜单头部 */
.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  margin-bottom: 15px;
}
  
.menu-header h3 {
  font-size: 16px;
  font-weight: bold;
  color: #2c3e50;
  margin: 0;
}
  
.menu-content {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 5px;
}
  
/* 菜单项通用样式 */
.menu-item {
  margin-bottom: 15px;
}
  
.menu-item label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #555;
  margin-bottom: 6px;
}

/* 分组相关的样式 */
.menu-group {
  margin-bottom: 15px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background-color: rgba(0, 0, 0, 0.03);
  cursor: pointer;
  transition: background-color 0.2s;
}

.group-header:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.group-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

.group-toggle {
  font-size: 12px;
  transition: transform 0.3s ease;
  color: #666;
}

.group-toggle.group-open {
  transform: rotate(90deg);
}

.group-content {
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.5);
}

.group-content .menu-item:last-child {
  margin-bottom: 0;
}

/* 美化下拉框 */
.select-wrapper {
  position: relative;
}

.styled-select {
  width: 100%;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
  background-color: white;
  font-size: 14px;
  color: #333;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 8.825L1.175 4 2.238 2.938 6 6.7 9.763 2.938 10.825 4z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  cursor: pointer;
  transition: border-color 0.2s;
}

.styled-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}
  
/* 美化滑块 */
.slider-wrapper {
  margin-bottom: 15px;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.slider-value {
  background-color: #f0f0f0;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 13px;
  color: #555;
  font-weight: 500;
}

.styled-slider {
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e0e0e0;
  outline: none;
}

.styled-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3498db;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.styled-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3498db;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.styled-slider::-webkit-slider-thumb:hover {
  background: #2980b9;
}

.styled-slider::-moz-range-thumb:hover {
  background: #2980b9;
}
  
/* 美化开关/复选框 */
.switch-wrapper label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.switch-wrapper input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.custom-checkbox {
  position: relative;
  height: 18px;
  width: 18px;
  background-color: #f0f0f0;
  border-radius: 4px;
  margin-right: 10px;
  display: inline-block;
  transition: all 0.2s;
  border: 1px solid #ccc;
}

.switch-wrapper input:checked ~ .custom-checkbox {
  background-color: #3498db;
  border-color: #3498db;
}

.custom-checkbox:after {
  content: "";
  position: absolute;
  display: none;
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.switch-wrapper input:checked ~ .custom-checkbox:after {
  display: block;
}

/* 按钮样式 */
.action-button {
  width: 100%;
  background-color: #3498db;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}
  
.action-button:hover {
  background-color: #2980b9;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}
  
.action-button:active {
  transform: translateY(1px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
  
/* 收缩/展开按钮样式 */
.toggle-button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  font-weight: 500;
}
  
.toggle-button:hover {
  background-color: #2980b9;
}
  
.toggle-button:active {
  transform: scale(0.98);
}
  
/* 收缩状态下的按钮样式 */
.menu.collapsed .toggle-button {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

/* 自定义滚动条 */
.menu-content::-webkit-scrollbar {
  width: 6px;
}

.menu-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.menu-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.menu-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .menu {
    background: linear-gradient(135deg, rgba(40, 40, 40, 0.9), rgba(30, 30, 30, 0.85));
    color: #e0e0e0;
    border-color: rgba(60, 60, 60, 0.5);
  }
  
  .menu-header {
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }
  
  .menu-header h3 {
    color: #e0e0e0;
  }
  
  .menu-item label {
    color: #ccc;
  }
  
  .group-header h4 {
    color: #e0e0e0;
  }
  
  .group-content {
    background-color: rgba(0, 0, 0, 0.2);
  }
  
  .styled-select {
    background-color: #333;
    color: #e0e0e0;
    border-color: #555;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23e0e0e0' d='M6 8.825L1.175 4 2.238 2.938 6 6.7 9.763 2.938 10.825 4z'/%3E%3C/svg%3E");
  }
  
  .slider-value {
    background-color: #444;
    color: #e0e0e0;
  }
  
  .styled-slider {
    background: #444;
  }
  
  .custom-checkbox {
    background-color: #444;
    border-color: #555;
  }
}
</style>