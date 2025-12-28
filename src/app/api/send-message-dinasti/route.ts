import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dinastiClient } from '@/lib/dinasti-client'

/**
 * POST /api/send-message-dinasti
 *
 * Envia mensagem via API Dinasti (Evolution API) diretamente,
 * sem passar por n8n como intermediário.
 *
 * Vantagens:
 * - Envio mais rápido (sem intermediário)
 * - Menos pontos de falha
 * - Melhor controle de erros
 * - Reduz dependência de n8n para envio
 *
 * O banco de dados continua sendo usado para:
 * - Salvar histórico de mensagens enviadas
 * - Sincronização com painel
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, message, clientName, messageType, mediaUrl } = body

    // Validações básicas
    if (!phone) {
      return NextResponse.json(
        { error: 'Telefone é obrigatório' },
        { status: 400 }
      )
    }

    if (!message && !mediaUrl) {
      return NextResponse.json(
        { error: 'Mensagem ou mídia é obrigatória' },
        { status: 400 }
      )
    }

    console.log(`📤 [Send Message] Enviando para ${phone}...`)

    // 1. Envia via API Dinasti
    let sendResult

    try {
      if (mediaUrl) {
        // Envia com mídia
        sendResult = await dinastiClient.sendMedia({
          phone,
          message,
          image: messageType === 'image' ? mediaUrl : undefined,
          audio: messageType === 'audio' ? mediaUrl : undefined,
          video: messageType === 'video' ? mediaUrl : undefined,
          document: messageType === 'document' ? mediaUrl : undefined,
          caption: message,
        })
      } else {
        // Envia apenas texto
        sendResult = await dinastiClient.sendText(phone, message)
      }

      console.log('✅ [Send Message] Enviado com sucesso:', sendResult)
    } catch (sendError) {
      console.error('❌ [Send Message] Erro ao enviar:', sendError)

      return NextResponse.json(
        {
          error: 'Falha ao enviar mensagem via WhatsApp',
          details: sendError instanceof Error ? sendError.message : 'Erro desconhecido',
        },
        { status: 500 }
      )
    }

    // 2. Salva no banco de dados (em background, não bloqueia)
    try {
      const supabase = await createClient()

      const chatData: any = {
        session_id: phone,
        message: {
          type: 'human', // Mensagem enviada pelo painel
          content: message || '',
        },
      }

      // Adiciona URL de mídia se houver
      if (mediaUrl) {
        chatData.media_url = mediaUrl
      }

      await supabase.from('chats').insert(chatData)

      console.log('✅ [Send Message] Salvo no banco de dados')
    } catch (dbError) {
      console.error('⚠️ [Send Message] Erro ao salvar no banco:', dbError)
      // Não falha a requisição se apenas o banco falhar
      // A mensagem foi enviada com sucesso
    }

    return NextResponse.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      response: sendResult,
      sessionId: phone,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ [Send Message] Erro:', error)

    return NextResponse.json(
      {
        error: 'Erro ao processar envio de mensagem',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/send-message-dinasti
 *
 * Health check
 */
export async function GET() {
  try {
    // Verifica status da instância
    const status = await dinastiClient.getInstanceStatus()

    return NextResponse.json({
      status: 'ok',
      message: 'API de envio de mensagens Dinasti funcionando',
      instance: status,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Erro ao verificar status',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
