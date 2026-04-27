import { ref } from 'vue'
import { defineStore } from 'pinia'
import nameSpace from './name-space'

export const useMenuStore = defineStore(
  nameSpace.MENU,
  () => {
    const component = ref<any>({})

    const setComponents = (info: any) => {
      component.value = info
    }

    return { component, setComponents }
  },
  {
    persist: true // 开启持久化
  },
)
