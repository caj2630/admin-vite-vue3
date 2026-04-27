<script setup lang="ts">
</script>

<template>
  <div class="home-content">
    <h1>欢迎来到首页</h1>
    <div class="content-box">
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span>Dashboard 内容</span>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6">
            <div class="stat-card">
              <div class="stat-value">1,234</div>
              <div class="stat-label">总用户数</div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <div class="stat-card">
              <div class="stat-value">567</div>
              <div class="stat-label">活跃用户</div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <div class="stat-card">
              <div class="stat-value">89</div>
              <div class="stat-label">新增用户</div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <div class="stat-card">
              <div class="stat-value">2,456</div>
              <div class="stat-label">总访问量</div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>
  </div>
</template>

<style scoped lang="scss">
.home-content {
  h1 {
    margin-bottom: 20px;
    color: #333;
  }

  .content-box {
    .box-card {
      :deep(.el-card__header) {
        border-bottom: 1px solid #ebeef5;
      }
    }

    .stat-card {
      text-align: center;
      padding: 20px;
      background-color: #f5f7fa;
      border-radius: 4px;
      border: 1px solid #e6e6e6;

      .stat-value {
        font-size: 32px;
        font-weight: bold;
        color: #409eff;
        margin-bottom: 10px;
      }

      .stat-label {
        font-size: 14px;
        color: #666;
      }
    }
  }
}
</style>
