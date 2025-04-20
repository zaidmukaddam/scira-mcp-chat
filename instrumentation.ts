import { registerOTel } from '@vercel/otel'

export function register() {
  registerOTel({
    serviceName: 'next-app',
    instrumentations: [
      {
        name: 'ai-instrumentation',
        include: [/^\/api\/ai/]
      }
    ]
  })
}