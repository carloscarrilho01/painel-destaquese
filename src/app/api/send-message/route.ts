import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, message, clientName, messageType, mediaUrl } = body

    // Validações básicas
    if (!phone || !message) {
      return NextResponse.json(
        { error: 'Telefone e mensagem são obrigatórios' },
        { status: 400 }
      )
    }

    // URL do webhook n8n (configurável via env)
    const webhookUrl = process.env.N8N_WEBHOOK_URL

    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Webhook n8n não configurado. Configure N8N_WEBHOOK_URL no .env' },
        { status: 500 }
      )
    }

    // Payload para enviar ao n8n
    const webhookPayload = {
      phone,
      message,
      messageType: messageType || 'text',
      mediaUrl: mediaUrl || undefined,
      clientName,
      timestamp: new Date().toISOString(),
      source: 'painel-admin'
    }

    // Enviar para n8n webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
      signal: AbortSignal.timeout(10000) // 10 segundos timeout
    })

    if (!webhookResponse.ok) {
      const errorData = await webhookResponse.text()
      console.error('Erro no webhook n8n:', errorData)
      return NextResponse.json(
        { error: 'Falha ao enviar mensagem via webhook', details: errorData },
        { status: webhookResponse.status }
      )
    }

    const responseData = await webhookResponse.json().catch(() => ({}))

    // Log para debug - ver o que o N8N está retornando
    console.log('📨 Resposta completa do N8N:', JSON.stringify(responseData, null, 2))

    // Não salvar no banco - deixar o N8N processar e salvar
    // O painel usa a resposta HTTP diretamente para exibição imediata

    // Preparar mensagens para exibição imediata
    const messages = []

    // 1. Mensagem do atendente (será exibida no lado do agente)
    messages.push({
      id: `live-user-${Date.now()}`,
      session_id: phone,
      message: {
        type: 'ai', // Mensagens do atendente aparecem como 'ai' (lado direito como agente)
        content: message
      },
      media_url: mediaUrl || null,
      timestamp: new Date().toISOString()
    })

    // 2. Resposta do agente (se houver no webhook response)
    // Tentar múltiplos campos possíveis do N8N
    const agentResponse = responseData?.response ||
                         responseData?.message ||
                         responseData?.output ||
                         responseData?.data?.response ||
                         responseData?.data?.message

    console.log('🤖 Resposta do agente capturada:', agentResponse)

    if (agentResponse) {
      messages.push({
        id: `live-agent-${Date.now()}`,
        session_id: phone,
        message: {
          type: 'ai',
          content: agentResponse
        },
        media_url: null,
        timestamp: new Date().toISOString()
      })
    }

    // Aguardar um pouco para o N8N processar e salvar no banco (se não vier no HTTP)
    if (!agentResponse) {
      console.log('⏳ Aguardando 2s para N8N processar...')
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Buscar mensagens recentes do banco para capturar resposta do agente
      const { data: recentMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', phone)
        .order('timestamp', { ascending: false })
        .limit(5)

      console.log('💾 Mensagens recentes do banco:', recentMessages)

      // Adicionar mensagens do banco que não sejam a nossa mensagem enviada
      if (recentMessages && recentMessages.length > 0) {
        recentMessages.forEach(msg => {
          // Ignorar a mensagem que acabamos de enviar e mensagens internas
          if (msg.message?.content !== message &&
              msg.message?.type === 'ai' &&
              !messages.some(m => m.message?.content === msg.message?.content)) {
            messages.push({
              id: msg.id,
              session_id: msg.session_id,
              message: msg.message,
              media_url: msg.media_url,
              timestamp: msg.timestamp
            })
          }
        })
      }
    }

    console.log('📤 Mensagens finais retornadas:', messages.length)

    // Retornar mensagens para exibição imediata
    return NextResponse.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      webhookResponse: responseData,
      sessionId: phone,
      messages: messages
    })

  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)

    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Timeout ao conectar com webhook n8n' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno ao processar envio' },
      { status: 500 }
    )
  }
}
