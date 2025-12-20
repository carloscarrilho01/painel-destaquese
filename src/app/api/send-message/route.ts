import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, message, clientName, messageType, mediaUrl } = body

    console.log('📤 Tentando enviar mensagem:', { phone, messageType, hasMedia: !!mediaUrl })

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
      console.error('❌ N8N_WEBHOOK_URL não configurado')
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

    console.log('📡 Enviando para webhook:', webhookUrl)

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
      console.error('❌ Erro no webhook n8n:', errorData)
      return NextResponse.json(
        { error: `Falha ao enviar mensagem via webhook: ${errorData}` },
        { status: webhookResponse.status }
      )
    }

    const responseData = await webhookResponse.json().catch(() => ({}))
    console.log('✅ Resposta do webhook:', responseData)

    // Salvar mensagem no banco de dados para aparecer na lista
    try {
      const { error: dbError } = await supabase.from('chats').insert({
        session_id: phone,
        message: {
          type: 'human',
          content: message
        }
      })

      if (dbError) {
        console.error('⚠️ Erro ao salvar mensagem no banco:', dbError)
      } else {
        console.log('✅ Mensagem salva no banco')
      }
    } catch (dbError) {
      console.error('⚠️ Exceção ao salvar mensagem no banco:', dbError)
      // Não falhar a requisição se apenas o banco falhar
    }

    return NextResponse.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      webhookResponse: responseData,
      sessionId: phone
    })

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error)

    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Timeout ao conectar com webhook n8n. Verifique se o n8n está rodando.' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: `Erro interno ao processar envio: ${error instanceof Error ? error.message : 'Desconhecido'}` },
      { status: 500 }
    )
  }
}
