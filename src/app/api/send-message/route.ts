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

    // Salvar mensagem no banco de dados para aparecer na lista
    try {
      const messageData: any = {
        session_id: phone,
        message: {
          type: 'ai', // Mensagem do agente/atendente, não do cliente
          content: message
        }
      }

      // Se houver media_url, adicionar ao objeto
      if (mediaUrl) {
        messageData.media_url = mediaUrl
      }

      await supabase.from('chats').insert(messageData)
    } catch (dbError) {
      console.error('Erro ao salvar mensagem no banco:', dbError)
      // Não falhar a requisição se apenas o banco falhar
    }

    return NextResponse.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      webhookResponse: responseData,
      sessionId: phone
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
