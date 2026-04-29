<script setup lang="ts">
  import { ref, nextTick, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import { Promotion, Delete, ChatLineSquare } from '@element-plus/icons-vue'
  import { sendChatMessage, type ChatMessage } from '@/service/chat'
  import { marked } from 'marked'

  // ==================== 状态 ====================

  const messages = ref<ChatMessage[]>([
    {
      role: 'assistant',
      content: '你好！我是 AI 助手，有什么可以帮助你的吗？',
    },
  ])
  const inputText = ref('')
  const isLoading = ref(false)
  const abortController = ref<AbortController | null>(null)
  const messageListRef = ref<HTMLElement | null>(null)

  // ==================== 自动滚动 ====================

  const scrollToBottom = async () => {
    await nextTick()
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  }

  watch(
    () => messages.value.length,
    () => scrollToBottom(),
  )

  // ==================== 发送消息 ====================

  const sendMessage = async () => {
    const text = inputText.value.trim()
    if (!text || isLoading.value) return

    inputText.value = ''
    abortController.value = new AbortController()

    // 添加用户消息
    messages.value.push({ role: 'user', content: text })
    // 添加占位的 AI 消息（流式输出会逐步填充）
    messages.value.push({ role: 'assistant', content: '' })
    isLoading.value = true

    const currentAssistantIndex = messages.value.length - 1

    // 构建消息历史（取最近 20 条）
    const history = messages.value.slice(-20, -1).map((m) => ({
      role: m.role,
      content: m.content,
    }))

    await sendChatMessage(
      history,
      {
        onStart: () => {
          scrollToBottom()
        },
        onChunk: (chunk: string) => {
          messages.value[currentAssistantIndex] = {
            role: 'assistant',
            content: messages.value[currentAssistantIndex].content + chunk,
          }
          scrollToBottom()
        },
        onDone: () => {
          isLoading.value = false
          abortController.value = null
        },
        onError: (error: Error) => {
          isLoading.value = false
          abortController.value = null
          // 如果 AI 回复为空，显示错误信息
          if (!messages.value[currentAssistantIndex].content) {
            messages.value[currentAssistantIndex] = {
              role: 'assistant',
              content: `**出错了**：${error.message}`,
            }
          }
          ElMessage.error(error.message)
        },
      },
      abortController.value.signal,
    )
  }

  // ==================== 停止生成 ====================

  const stopGeneration = () => {
    abortController.value?.abort()
    isLoading.value = false
    abortController.value = null
  }

  // ==================== 清空对话 ====================

  const clearChat = () => {
    if (isLoading.value) return
    messages.value = [{ role: 'assistant', content: '你好！我是 AI 助手，有什么可以帮助你的吗？' }]
  }

  // ==================== Markdown 渲染 ====================

  const renderMarkdown = (content: string): string => {
    if (!content) return ''
    try {
      return marked(content, { async: false }) as string
    } catch {
      return content
    }
  }

  // ==================== 键盘事件 ====================

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
</script>

<template>
  <div class="chat-container">
    <!-- 头部 -->
    <div class="chat-header">
      <div class="header-title">
        <el-icon size="20"><ChatLineSquare /></el-icon>
        <span>AI 智能对话</span>
      </div>
      <el-button text :icon="Delete" :disabled="isLoading" @click="clearChat"> 清空对话 </el-button>
    </div>

    <!-- 消息列表 -->
    <div ref="messageListRef" class="message-list">
      <div
        v-for="(msg, index) in messages"
        :key="index"
        class="message-item"
        :class="{ 'is-user': msg.role === 'user', 'is-assistant': msg.role === 'assistant' }"
      >
        <div class="message-avatar">
          <el-avatar
            :icon="msg.role === 'user' ? undefined : ChatLineSquare"
            :src="msg.role === 'user' ? undefined : undefined"
            :style="{ backgroundColor: msg.role === 'user' ? '#409eff' : '#67c23a' }"
          >
            {{ msg.role === 'user' ? 'U' : 'AI' }}
          </el-avatar>
        </div>
        <div class="message-content">
          <div class="message-bubble" v-if="msg.role === 'user'">
            <div class="message-text">{{ msg.content }}</div>
          </div>
          <div class="message-bubble" v-else>
            <div class="message-text markdown-body" v-html="renderMarkdown(msg.content)" />
            <div
              v-if="isLoading && index === messages.length - 1 && msg.content"
              class="streaming-indicator"
            >
              <span class="cursor">▍</span>
            </div>
            <div
              v-if="isLoading && index === messages.length - 1 && !msg.content"
              class="streaming-indicator"
            >
              <span class="typing-dot">.</span>
              <span class="typing-dot">.</span>
              <span class="typing-dot">.</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="input-area">
      <div class="input-wrapper">
        <el-input
          v-model="inputText"
          type="textarea"
          :rows="3"
          :disabled="isLoading"
          placeholder="输入你的问题，Enter 发送，Shift+Enter 换行"
          @keydown="handleKeydown"
          resize="none"
        />
      </div>
      <div class="input-actions">
        <span class="hint">Enter 发送，Shift+Enter 换行</span>
        <div class="action-buttons">
          <el-button v-if="isLoading" type="warning" @click="stopGeneration"> 停止生成 </el-button>
          <el-button
            v-else
            type="primary"
            :icon="Promotion"
            :disabled="!inputText.trim()"
            @click="sendMessage"
          >
            发送
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .chat-container {
    display: flex;
    flex-direction: column;
    height: v-bind(height);
    max-width: 1000px;
    margin: 0 auto;

    .chat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #ebeef5;

      .header-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }
    }

    .message-list {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-thumb {
        background-color: #dcdfe6;
        border-radius: 3px;
      }

      .message-item {
        display: flex;
        gap: 12px;
        max-width: 85%;

        &.is-user {
          flex-direction: row-reverse;
          align-self: flex-end;

          .message-bubble {
            background-color: #409eff;
            color: #fff;
            border-radius: 12px 4px 12px 12px;
          }
        }

        &.is-assistant {
          align-self: flex-start;

          .message-bubble {
            background-color: #f5f7fa;
            color: #303133;
            border-radius: 4px 12px 12px 12px;
          }
        }

        .message-avatar {
          flex-shrink: 0;
        }

        .message-content {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .message-bubble {
            padding: 12px 16px;
            line-height: 1.6;
            font-size: 14px;

            .message-text {
              white-space: pre-wrap;
              word-break: break-word;
            }

            // Markdown 样式（避免被全局覆盖）
            :deep(.markdown-body) {
              line-height: 1.6;

              p {
                margin: 0 0 8px;
                &:last-child {
                  margin-bottom: 0;
                }
              }

              ul,
              ol {
                padding-left: 20px;
                margin: 4px 0;
              }

              li {
                margin: 2px 0;
              }

              code {
                background-color: rgba(0, 0, 0, 0.06);
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 13px;
                font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
              }

              pre {
                background-color: #1e1e1e;
                color: #d4d4d4;
                padding: 12px 16px;
                border-radius: 8px;
                overflow-x: auto;
                margin: 8px 0;

                code {
                  background: none;
                  padding: 0;
                  font-size: 13px;
                  color: inherit;
                }
              }

              blockquote {
                border-left: 3px solid #409eff;
                padding-left: 12px;
                color: #909399;
                margin: 8px 0;
              }

              h1,
              h2,
              h3,
              h4,
              h5,
              h6 {
                margin: 8px 0 4px;
                font-weight: 600;
              }

              strong {
                font-weight: 600;
              }

              a {
                color: #409eff;
                text-decoration: none;
              }

              table {
                border-collapse: collapse;
                width: 100%;
                margin: 8px 0;

                th,
                td {
                  border: 1px solid #dcdfe6;
                  padding: 6px 12px;
                  text-align: left;
                }

                th {
                  background-color: #f5f7fa;
                  font-weight: 600;
                }
              }
            }
          }
        }
      }
    }

    .streaming-indicator {
      display: flex;
      align-items: center;
      margin-top: 4px;

      .cursor {
        animation: blink 1s step-end infinite;
        font-size: 16px;
        color: #409eff;
      }

      .typing-dot {
        font-size: 24px;
        font-weight: bold;
        color: #909399;
        line-height: 1;
        animation: dot-pulse 1.4s infinite;
        display: inline-block;

        &:nth-child(2) {
          animation-delay: 0.2s;
        }
        &:nth-child(3) {
          animation-delay: 0.4s;
        }
      }
    }

    .input-area {
      padding: 16px 20px;
      border-top: 1px solid #ebeef5;
      background-color: #fff;

      .input-wrapper {
        :deep(.el-textarea__inner) {
          font-size: 14px;
          line-height: 1.6;
        }
      }

      .input-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 8px;

        .hint {
          font-size: 12px;
          color: #909399;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }
      }
    }
  }

  @keyframes blink {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
  }

  @keyframes dot-pulse {
    0%,
    80%,
    100% {
      opacity: 0;
    }
    40% {
      opacity: 1;
    }
  }
</style>
