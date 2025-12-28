import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ChatMessage } from '@/lib/types'

/**
 * GET /api/conversation-history?session_id=5511999999999&limit=100&offset=0
 *
 * Busca histórico completo de uma conversa do BANCO DE DADOS.
 *
 * Este endpoint é usado apenas quando:
 * - Usuário clica em "Carregar mensagens antigas"
 * - Necessário buscar mensagens de semanas/meses atrás
 * - Geração de relatórios
 * - Busca avançada em conversas
 *
 * Para conversas ativas (últimas 24-48h), use /api/active-conversations
 * que busca direto da API Dinasti (muito mais rápido).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parâmetros
    const sessionId = searchParams.get('session_id')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // Validação
    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id é obrigatório' },
        { status: 400 }
      )
    }

    console.log(
      `🔄 [History] Buscando histórico de ${sessionId} (limit: ${limit}, offset: ${offset})`
    )

    const startTime = Date.now()

    // Busca no banco
    const supabase = await createClient()

    let query = supabase
      .from('chats')
      .select('*')
      .eq('session_id', sessionId)
      .order('id', { ascending: true })
      .range(offset, offset + limit - 1)

    // Filtros opcionais de data
    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data: chats, error } = await query

    if (error) {
      console.error('❌ [History] Erro ao buscar histórico:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar histórico', details: error.message },
        { status: 500 }
      )
    }

    // Conta total (para paginação)
    let countQuery = supabase
      .from('chats')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)

    if (startDate) {
      countQuery = countQuery.gte('created_at', startDate)
    }

    if (endDate) {
      countQuery = countQuery.lte('created_at', endDate)
    }

    const { count } = await countQuery

    // Filtra mensagens de ferramentas
    const visibleMessages = (chats || []).filter((msg) => {
      const content = msg.message?.content || ''
      return (
        !content.startsWith('[Used tools:') && !content.startsWith('Used tools:')
      )
    })

    const fetchTime = Date.now() - startTime

    console.log(
      `✅ [History] ${visibleMessages.length}/${chats?.length || 0} mensagens encontradas em ${fetchTime}ms`
    )

    return NextResponse.json({
      messages: visibleMessages as ChatMessage[],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0),
      },
      fetchTime,
      source: 'database',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ [History] Erro:', error)

    return NextResponse.json(
      {
        error: 'Erro ao buscar histórico',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/conversation-history?session_id=5511999999999
 *
 * Deleta histórico de uma conversa (apenas do banco, não afeta WhatsApp)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id é obrigatório' },
        { status: 400 }
      )
    }

    console.log(`🗑️ [History] Deletando histórico de ${sessionId}`)

    const supabase = await createClient()

    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('session_id', sessionId)

    if (error) {
      console.error('❌ [History] Erro ao deletar histórico:', error)
      return NextResponse.json(
        { error: 'Erro ao deletar histórico', details: error.message },
        { status: 500 }
      )
    }

    console.log(`✅ [History] Histórico de ${sessionId} deletado`)

    return NextResponse.json({
      success: true,
      message: 'Histórico deletado com sucesso',
      sessionId,
    })
  } catch (error) {
    console.error('❌ [History] Erro:', error)

    return NextResponse.json(
      {
        error: 'Erro ao deletar histórico',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
