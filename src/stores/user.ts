import { ref } from 'vue'
import { defineStore } from 'pinia'
import nameSpace from './name-space'
// import { setToken } from '@/service'

export const useUserInfoStore = defineStore(
  nameSpace.USER,
  () => {
    const user = ref<any>({})
    const token = ref('')

    // 开发环境下自动设置模拟token
    // if (import.meta.env.DEV && !token.value) {
    //   const mockToken = 'dev-mock-token-12345'
    //   token.value = mockToken
    //   setToken(mockToken)
    // }

    const resetToken = async () => {
      token.value = ''
    }
    return { user, token, resetToken }
  },
  {
    persist: true, // 开启持久化
  },
)
