export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface SSECallbacks {
  onStart?: () => void
  onChunk: (chunk: string) => void
  onDone: () => void
  onError: (error: Error) => void
}

/**
 * 发送聊天消息并通过 SSE 接收流式响应
 */
export function sendChatMessage(
  messages: ChatMessage[],
  callbacks: SSECallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const { onStart, onChunk, onDone, onError } = callbacks

  return fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      onStart?.()

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Response body is not readable')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // 解析 SSE 数据（可能包含多条 data: 行）
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // 最后一段可能不完整，留到下次

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue

          try {
            const data = JSON.parse(trimmed.slice(6))
            switch (data.type) {
              case 'start':
                onStart?.()
                break
              case 'chunk':
                onChunk(data.content)
                break
              case 'done':
                onDone()
                break
              case 'error':
                onError(new Error(data.content))
                break
            }
          } catch (e) {
            console.warn('[SSE Parse Error]', e, trimmed)
          }
        }
      }

      // 处理 buffer 中剩余的数据
      onDone()
    })
    .catch((error) => {
      if (error.name === 'AbortError') return
      onError(error)
    })
}
