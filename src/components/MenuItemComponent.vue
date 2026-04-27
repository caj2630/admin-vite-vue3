<template>
  <template v-if="menu.children && menu.children.length > 0">
    <el-sub-menu :index="menu.path || String(menu.id)">
      <template #title>
        <component
          v-if="menu.icon"
          :is="getIcon(menu.icon)"
          class="menu-icon"
        />
        <span>{{ menu.title }}</span>
      </template>
      <MenuItemComponent
        v-for="child in menu.children"
        :key="child.id"
        :menu="child"
        :get-icon="getIcon"
      />
    </el-sub-menu>
  </template>
  <template v-else>
    <el-menu-item :index="menu.path || String(menu.id)">
      <component
        v-if="menu.icon"
        :is="getIcon(menu.icon)"
        class="menu-icon"
      />
      <span>{{ menu.title }}</span>
    </el-menu-item>
  </template>
</template>

<script setup lang="ts">
defineProps({
  menu: {
    type: Object,
    required: true
  },
  getIcon: {
    type: Function,
    required: true
  }
})
</script>

<style scoped>
.menu-icon {
  width: 18px;
  height: 18px;
  min-width: 18px;
  min-height: 18px;
}
.menu-icon svg {
  width: 18px;
  height: 18px;
}
</style>
