import type { Request, Response } from 'express'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
const ZHIPU_MODEL = 'glm-4-flash'

async function handler(req: Request, res: Response) {
  const { messages } = req.body as { messages: ChatMessage[] }

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages 不能为空' })
    return
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })

  if (res.socket) res.socket.setNoDelay(true)

  res.write(`data: ${JSON.stringify({ type: 'start' })}\n\n`)

  try {
    const apiKey = process.env.ZHIPU_API_KEY
    if (!apiKey) {
      res.write(
        `data: ${JSON.stringify({ type: 'chunk', content: '⚠️ 未配置 ZHIPU_API_KEY' })}\n\n`,
      )
    } else {
      const https = await import('node:https')

      const postData = JSON.stringify({
        model: ZHIPU_MODEL,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        stream: true,
      })

      const urlObj = new URL(ZHIPU_API_URL)
      const responseData = await new Promise<string>((resolve, reject) => {
        const chunks: Buffer[] = []
        const zreq = https.request(
          {
            hostname: urlObj.hostname,
            port: 443,
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
              'Content-Length': Buffer.byteLength(postData),
            },
            timeout: 30000,
          },
          (zres) => {
            zres.on('data', (chunk: Buffer) => chunks.push(chunk))
            zres.on('end', () => resolve(Buffer.concat(chunks).toString()))
            zres.on('error', (e: Error) => reject(e))
          },
        )
        zreq.on('error', (e: Error) => reject(e))
        zreq.on('timeout', () => {
          zreq.destroy()
          reject(new Error('智谱 API 请求超时'))
        })
        zreq.write(postData)
        zreq.end()
      })

      if (responseData) {
        const lines = responseData.split('\n')
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue
          const dataStr = trimmed.slice(6)
          if (dataStr === '[DONE]') continue
          try {
            const data = JSON.parse(dataStr)
            const content = data?.choices?.[0]?.delta?.content || ''
            if (content) {
              res.write(`data: ${JSON.stringify({ type: 'chunk', content })}\n\n`)
            }
          } catch {
            // skip parse errors for incomplete chunks
          }
        }
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
  } catch (error: any) {
    console.error('[Chat SSE Error]', error.message)
    res.write(
      `data: ${JSON.stringify({ type: 'error', content: error.message || '未知错误' })}\n\n`,
    )
  } finally {
    res.end()
  }
}

export default handler
