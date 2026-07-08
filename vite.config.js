import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const API_BASE_URL = 'https://pocketstamp-wallet-backend-production.up.railway.app'

function getBackendErrorMessage(text) {
  try {
    const payload = text ? JSON.parse(text) : null
    return payload?.error || payload?.message || ''
  } catch {
    return text.trim()
  }
}

function demoCreateMiddleware() {
  return {
    name: 'pocketstamp-demo-create-middleware',
    configureServer(server) {
      server.middlewares.use('/demo/pocket-stamp-demo/create', async (request, response) => {
        if (request.method !== 'POST') {
          response.statusCode = 405
          response.setHeader('Allow', 'POST')
          response.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        try {
          const chunks = []

          for await (const chunk of request) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
          }

          const createResponse = await fetch(`${API_BASE_URL}/join/pocket-stamp-demo`, {
            method: 'POST',
            headers: {
              'Content-Type': request.headers['content-type'] || 'application/x-www-form-urlencoded',
            },
            body: Buffer.concat(chunks).toString('utf8'),
            redirect: 'manual',
          })
          const location = createResponse.headers.get('location')

          if (!createResponse.ok) {
            const responseText = await createResponse.text()
            response.statusCode = createResponse.status
            response.setHeader('Content-Type', 'application/json')
            response.end(JSON.stringify({
              error: getBackendErrorMessage(responseText) || 'Unable to create the demo Wallet card.',
            }))
            return
          }

          if (!location) {
            response.statusCode = 502
            response.end(JSON.stringify({ error: 'Demo card was created, but no success URL was returned.' }))
            return
          }

          const successUrl = new URL(location, API_BASE_URL).toString()
          const successResponse = await fetch(successUrl)
          const successHtml = await successResponse.text()
          const passHref = successHtml.match(/<a\b[^>]*href=["']([^"']+)["'][^>]*>\s*Add Demo Card to Apple Wallet\s*<\/a>/i)?.[1]

          if (!passHref) {
            response.statusCode = 502
            response.end(JSON.stringify({ error: 'Demo card was created, but no Wallet pass URL was found.' }))
            return
          }

          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify({
            successUrl,
            passUrl: new URL(passHref, API_BASE_URL).toString(),
          }))
        } catch (error) {
          response.statusCode = 500
          response.end(JSON.stringify({ error: error.message || 'Unable to create the demo Wallet card.' }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), demoCreateMiddleware()],
})
