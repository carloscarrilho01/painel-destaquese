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

    // Não salvar a mensagem do atendente no banco - deixar o N8N processar e salvar
    // Isso evita mensagens duplicadas e permite que o N8N decida o que salvar

    // Retornar a resposta do webhook para exibição imediata no painel
    return NextResponse.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      webhookResponse: responseData,
      sessionId: phone,
      // Dados para atualização otimista no frontend
      optimisticMessage: {
        session_id: phone,
        message: {
          type: 'ai',
          content: message
        },
        media_url: mediaUrl || null,
        timestamp: new Date().toISOString()
      }
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
