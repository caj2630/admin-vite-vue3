<template>
  <div class="floating-chatbot">
    <el-button class="chatbot-btn" circle @click="dialogVisible = true">
      <img src="/robot-chat.jpeg" class="chatbot-icon" alt="AI" />
    </el-button>

    <el-dialog
      v-model="dialogVisible"
      title="AI 智能对话"
      width="520px"
      :top="'5vh'"
      :close-on-click-modal="false"
      :modal="true"
      class="chat-dialog"
    >
      <ChatView height="520px" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import ChatView from '@/views/chat/index.vue'

  const dialogVisible = ref(false)
</script>

<style scoped lang="scss">
  .floating-chatbot {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 1000;

    .chatbot-btn {
      width: 56px;
      height: 56px;
      padding: 0;
      border: none;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      overflow: hidden;
      cursor: pointer;
      transition:
        transform 0.2s,
        box-shadow 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
      }

      .chatbot-icon {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
  }

  :deep(.chat-dialog) {
    .el-dialog__body {
      padding: 0;
      overflow: hidden;
    }
  }
</style>
