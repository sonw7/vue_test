<!-- src/App.vue -->
<template>
  <div id="app">
    <el-container>
      <el-header>
        <nav-bar />
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import NavBar from './components/layout/NavBar.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  background-color: #f5f7fa;
}

#app {
  width: 100%;
  height: 100vh;
}

.el-header {
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  background-color: #fff;
}

.el-main {
  padding: 0;
  height: calc(100vh - 60px);
  overflow: hidden;
}
</style>