import { NextRequest, NextResponse } from 'next/server'

// Este endpoint recebe webhooks da Uazapi ou n8n quando uma nova mensagem chega
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

    // Nota: O sistema atual usa polling para detectar novas mensagens
    // As mensagens são salvas no Supabase e detectadas via polling de 5s
    //
    // Alternativas futuras:
    // - Server-Sent Events (SSE) para push em tempo real
    // - WebSockets para comunicação bidirecional
    // - Supabase Realtime para atualizações automáticas

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
