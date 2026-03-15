/**
 * Прокси-сервер для Supabase (для обхода блокировок в РФ)
 * Деплой: Railway, Render, или любой Node.js хостинг
 */
import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 3001

const targetUrl = process.env.SUPABASE_TARGET_URL || 'https://mtigcxqcymxvqjjqfyts.supabase.co'

if (!targetUrl) {
  console.error('Задайте SUPABASE_TARGET_URL в переменных окружения')
  process.exit(1)
}

app.use(cors({ origin: true }))

app.use(
  '/',
  createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    pathRewrite: { '^/': '/' },
    onError: (err, req, res) => {
      console.error('Proxy error:', err.message)
      res.status(502).json({ error: 'Proxy error', message: err.message })
    },
  })
)

app.listen(PORT, () => {
  console.log(`Supabase proxy running on port ${PORT}`)
  console.log(`Forwarding to ${targetUrl}`)
})
