import { NextRequest, NextResponse } from 'next/server'

// Este endpoint recebe webhooks do n8n quando uma nova mensagem chega
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id, message, type = 'human' } = body

    // Validações básicas
    if (!session_id || !message) {
      return NextResponse.json(
        { error: 'session_id e message são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar autenticação (opcional mas recomendado)
    const authHeader = request.headers.get('authorization')
    const webhookSecret = process.env.WEBHOOK_SECRET

    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Log para debug
    console.log('📨 [Webhook] Nova mensagem recebida:', {
      session_id,
      type,
      message: message.substring(0, 50) + '...'
    })

    // Broadcast para todos os clientes conectados via Server-Sent Events (SSE)
    // Ou usar um sistema de pub/sub como Pusher, Ably, etc.

    // Por enquanto, apenas confirmar recebimento
    // O próximo passo é implementar SSE ou usar Supabase Realtime

    return NextResponse.json({
      success: true,
      message: 'Mensagem recebida',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ [Webhook] Erro ao processar mensagem:', error)
    return NextResponse.json(
      { error: 'Erro interno ao processar mensagem' },
      { status: 500 }
    )
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'online',
    endpoint: '/api/receive-message',
    methods: ['POST'],
    timestamp: new Date().toISOString()
  })
}
