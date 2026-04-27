<template>
  <RouterView />
</template>

<script setup lang="ts">
import { toRefs, ref, provide } from 'vue'
</script>

<style lang="scss">
#app {
  width: 100vw;
  height: 100vh;
}
// * {
//   margin: 0;
//   padding: 0;
// }
</style>
