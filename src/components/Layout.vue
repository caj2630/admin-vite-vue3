<template>
  <el-container class="layout-container">
    <!-- 头部 -->
    <el-header class="layout-header">
      <div class="header-content">
        <div class="header-title">Dashboard</div>
        <div class="header-right">
          <User class="header-icon" />
          <el-button type="primary" @click="handleLogout">退出登录</el-button>
        </div>
      </div>
    </el-header>

    <el-container class="layout-body">
      <!-- 侧边栏 -->
      <el-aside class="layout-aside" width="200px">
        <Menu />
      </el-aside>

      <!-- 内容区 -->
      <el-main class="layout-main">
        <router-view v-slot="{ Component, route }">
          <transition name="fade" mode="out-in">
            <component
              :is="Component"
              :key="route.path"
            />
          </transition>
        </router-view>
        <!-- <slot /> -->
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import Menu from './Menu.vue'
import User from '@/views/login/user.vue'

const handleLogout = () => {
  ElMessage.success('已退出登录')
  // 这里可以添加实际的退出逻辑
}
</script>

<style scoped lang="scss">
.layout-container {
  height: 100vh;
  display: flex;
  flex-direction: column;

  .layout-header {
    background-color: #545c64;
    color: #fff;
    display: flex;
    align-items: center;
    padding: 0 20px;

    .header-content {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-title {
        font-size: 18px;
        font-weight: bold;
      }

      .header-right {
        display: flex;
        gap: 10px;
      }
    }
  }

  .layout-body {
    flex: 1;
    display: flex;
    overflow: hidden;

    .layout-aside {
      background-color: #f5f7fa;
      border-right: 1px solid #e6e6e6;
      overflow-y: auto;

      :deep(.el-menu) {
        border: none;
      }
    }

    .layout-main {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      background-color: #ffffff;
    }
  }
}
</style>
