<template>
  <div class="cy-login">
    <el-card class="cy-login__card" style="max-width: 480px">
      <el-form
        ref="ruleFormRef"
        :model="loginForm"
        label-width="auto"
        style="max-width: 600px"
        :rules="rules"
      >
        <el-form-item label="邮箱" prop="username">
          <el-input v-model="loginForm.username" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input type="password" v-model="loginForm.password" />
        </el-form-item>
        <el-form-item label=" " prop="checked">
          <el-checkbox value="Online activities" v-model="loginForm.checked">
            记住密码
          </el-checkbox>
        </el-form-item>
        <el-form-item class="cy-form__item--submit">
          <el-button type="primary" @click="() => submitForm(ruleFormRef)">登录 / 注册</el-button>
        </el-form-item>
        <el-form-item>
          <div style="color: rgba(255, 255, 255, 0.75); font-size: 14px">
            未注册邮箱将自动注册，已注册用户则直接登录。
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
  import { reactive, ref } from 'vue'
  import type { FormInstance } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import { useUserInfoStore } from '@/stores/user'
  import { post, setToken } from '@/service'
  import router from '@/router'
  const ruleFormRef = ref<FormInstance>()
  const store = useUserInfoStore()

  const loginForm = reactive({
    username: '',
    password: '',
    checked: false,
  })

  const validateEmail = (_rule: any, value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!value) {
      return Promise.reject(new Error('请输入邮箱'))
    }
    if (!emailRegex.test(value)) {
      return Promise.reject(new Error('邮箱格式有误'))
    }
    return Promise.resolve()
  }

  const rules = reactive<Record<string, any>>({
    username: [
      { required: true, message: '请输入邮箱', trigger: 'blur' },
      { validator: validateEmail, trigger: 'blur' },
    ],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, message: '密码至少6位', trigger: 'blur' },
    ],
  })

  const submitForm = async (formEl: FormInstance | undefined) => {
    if (!formEl) return

    try {
      await formEl.validate()
      await loginOrRegister()
    } catch (error: any) {
      console.log('error submit!', error)
      ElMessage.error(error?.response?.data?.error || error?.message || '登录异常，请稍后重试')
    }
  }

  const loginOrRegister = async () => {
    try {
      const result = await post('/api/login', {
        email: loginForm.username,
        password: loginForm.password,
      })

      return handleSuccess(result)
    } catch (loginError: any) {
      const errorMsg = loginError?.response?.data?.error || loginError?.message || ''

      if (
        loginError?.response?.status === 401 ||
        /登录失败|Invalid login credentials/.test(errorMsg)
      ) {
        return registerAndLogin()
      }

      throw loginError
    }
  }

  const registerAndLogin = async () => {
    try {
      await post('/api/register', {
        email: loginForm.username,
        password: loginForm.password,
      })

      const loginResult = await post('/api/login', {
        email: loginForm.username,
        password: loginForm.password,
      })

      if (loginResult?.data?.session) {
        return handleSuccess(loginResult)
      }

      ElMessage.success('注册成功，请前往邮箱确认登录')
    } catch (error: any) {
      const message = error?.response?.data?.error || error?.message || '注册失败，请稍后重试'
      ElMessage.error(message)
      if (message.includes('already') || message.includes('已存在')) {
        ElMessage.error('该邮箱已注册，请检查密码后重新登录')
      }
      throw error
    }
  }

  const handleSuccess = (result: any) => {
    const accessToken = result?.data?.session?.access_token
    if (accessToken) {
      setToken(accessToken)
      store.$patch({
        token: accessToken,
        user: result?.data?.user,
      })
    }
    // 跳转到根路径，路由拦截器会根据token重定向到第一个菜单
    router.push('/')
  }
</script>

<style lang="scss">
  @include b('form') {
    @include e('item') {
      @include m('submit') {
        .el-form-item__content {
          justify-content: end;
        }
      }
    }
  }
  @include b('login') {
    width: 100%;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 16px;
    background-image: url('/login-bg.jpeg');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    @include e('card') {
      width: min(480px, 100%);
      max-width: 480px;
      padding: 36px 32px;
      border-radius: 28px;
      border: 1px solid rgba(255, 255, 255, 0.16);
      background: rgba(12, 20, 34, 0.72);
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
      backdrop-filter: blur(18px);
      color: #ffffff;
      .el-form {
        color: inherit;
      }
      .el-form-item__label {
        color: rgba(255, 255, 255, 0.85);
      }
      // .el-input__inner,
      // .el-checkbox__inner {
      //   background: rgba(255, 255, 255, 0.08);
      //   border-color: rgba(255, 255, 255, 0.2);
      //   color: #ffffff;
      // }
      .el-checkbox {
        color: #fff;
      }
      .el-input__inner::placeholder {
        color: rgba(255, 255, 255, 0.55);
      }
      .el-button--primary {
        width: 100%;
        border-radius: 999px;
        background: linear-gradient(90deg, #2d8bff 0%, #1d6cff 100%);
        border: none;
        box-shadow: 0 12px 24px rgba(45, 139, 255, 0.28);
      }
      .el-form-item__content {
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }
</style>
