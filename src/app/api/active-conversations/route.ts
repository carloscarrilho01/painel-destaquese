import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  dinastiClient,
  extractMessageText,
  extractMediaUrl,
  normalizePhone,
} from '@/lib/dinasti-client'
import type { Conversation, Lead } from '@/lib/types'

/**
 * GET /api/active-conversations
 *
 * Busca conversas ATIVAS direto da API Dinasti (Evolution API)
 * em vez de processar todo o histórico do banco de dados.
 *
 * Vantagens:
 * - Muito mais rápido (não processa milhares de mensagens)
 * - Dados sempre atualizados (direto do WhatsApp)
 * - Reduz carga no banco de dados
 * - Escalável (tempo de resposta constante)
 *
 * O banco de dados é usado apenas para:
 * - Enriquecer com dados de leads (nome, interesse, etc)
 * - Manter histórico completo para relatórios
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 [Active Conversations] Buscando conversas ativas...')

    const startFetch = Date.now()
    const supabase = await createClient()

    // 1. Busca mensagens do banco de dados (onde n8n salva)
    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select('*')
      .order('id', { ascending: true })

    const fetchTime = Date.now() - startFetch

    if (chatsError || !chats || chats.length === 0) {
      console.log('✅ [Active Conversations] Nenhuma conversa encontrada')
      return NextResponse.json({
        conversations: [],
        count: 0,
        source: 'supabase',
        fetchTime,
      })
    }

    console.log(
      `✅ [Active Conversations] ${chats.length} mensagens encontradas em ${fetchTime}ms`
    )

    // 2. Busca dados de leads
    const startLeads = Date.now()
    const { data: leads } = await supabase.from('leads').select('*')
    const leadsTime = Date.now() - startLeads

    console.log(
      `✅ [Active Conversations] ${leads?.length || 0} leads carregados em ${leadsTime}ms`
    )

    // 3. Agrupa mensagens por session_id
    const grouped = new Map<string, any[]>()
    chats.forEach((chat: any) => {
      const existing = grouped.get(chat.session_id) || []
      existing.push(chat)
      grouped.set(chat.session_id, existing)
    })

    // 4. Cria mapa de leads
    const leadMap = new Map<string, Lead>()
    if (leads) {
      for (const lead of leads) {
        const variations = normalizePhoneVariations(lead.telefone)
        variations.forEach((variation) => {
          leadMap.set(variation, lead)
        })
      }
    }

    // 5. Processa conversas
    const conversations: Conversation[] = Array.from(grouped.entries()).map(
      ([session_id, messages]) => {
        // Limpar e filtrar mensagens de tool_calls para exibição
        const visibleMessages = messages
          .filter((m) => !isToolMessage(m.message?.content))
          .map((m) => {
            // Limpa o conteúdo de tool calls mantendo apenas a mensagem real
            if (m.message?.content) {
              const cleanedContent = cleanToolMessage(m.message.content)
              return {
                ...m,
                message: {
                  ...m.message,
                  content: cleanedContent,
                },
              }
            }
            return m
          })
          .filter((m) => m.message?.content) // Remove mensagens vazias após limpeza

        const lastMsg =
          visibleMessages[visibleMessages.length - 1] ||
          messages[messages.length - 1]

        // Busca lead
        const normalized = session_id.replace(/\D/g, '')
        const lead = leadMap.get(normalized) || leadMap.get(session_id)

        return {
          session_id,
          clientName: lead?.nome || undefined,
          messages,
          visibleMessages,
          messageCount: visibleMessages.length,
          lastMessage: lastMsg?.message?.content || '',
          lastType: lastMsg?.message?.type || 'human',
          lead: lead || undefined,
        }
      }
    )

    // 6. Ordena por última mensagem (mais recente primeiro)
    conversations.sort((a, b) => {
      const timeA =
        a.messages.length > 0 ? a.messages[a.messages.length - 1].id : 0
      const timeB =
        b.messages.length > 0 ? b.messages[b.messages.length - 1].id : 0
      return timeB - timeA
    })

    const totalTime = Date.now() - startFetch

    console.log(
      `✅ [Active Conversations] ${conversations.length} conversas processadas em ${totalTime}ms total`
    )

    return NextResponse.json({
      conversations,
      count: conversations.length,
      source: 'supabase',
      fetchTime,
      leadsTime,
      totalTime,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ [Active Conversations] Erro:', error)

    return NextResponse.json(
      {
        error: 'Erro ao buscar conversas ativas',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        source: 'dinasti-api',
      },
      { status: 500 }
    )
  }
}

/**
 * Limpa mensagens que contêm tool calls e extrai apenas o conteúdo real
 */
function cleanToolMessage(content: string): string {
  if (!content) return ''

  // Se não é uma mensagem de tool, retorna como está
  if (!content.startsWith('[Used tools:') && !content.startsWith('Used tools:')) {
    return content
  }

  // Remove o prefixo de tool call e extrai apenas o conteúdo real
  // Padrão: [Used tools: ... Resul_ ou Result: seguido do conteúdo real
  // Usa [\s\S] em vez de flag 's' para compatibilidade ES5
  const toolPattern = /\[?Used tools:[\s\S]*?(?:Resul[t_]|Result:)\s*/i
  let cleaned = content.replace(toolPattern, '').trim()

  // Remove dados de lead no formato : [[{"id":"..."}]]
  // Exemplo: : [[{"id":"7305ffbb-4e44-4d0e-9423-d9e8549780cf",...}]]
  const leadDataPattern = /^\s*:\s*\[\[\{[\s\S]*?\}\]\]\s*/
  cleaned = cleaned.replace(leadDataPattern, '').trim()

  // Se após limpar não sobrou nada, significa que era apenas tool call sem conteúdo
  return cleaned || ''
}

function isToolMessage(content: string): boolean {
  // Verifica se é uma mensagem que APENAS contém tool call (sem conteúdo real)
  const cleaned = cleanToolMessage(content)
  return cleaned === ''
}

/**
 * Gera variações de um número de telefone para matching
 */
function normalizePhoneVariations(phone: string): string[] {
  const cleaned = phone.replace(/\D/g, '')
  const variations: string[] = [cleaned]

  // Com código do país
  if (cleaned.length === 11 && !cleaned.startsWith('55')) {
    variations.push('55' + cleaned)
  }

  // Sem código do país
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    variations.push(cleaned.substring(2))
  }

  // Com e sem 9 no celular
  if (cleaned.length >= 10) {
    const ddd = cleaned.substring(cleaned.length - 11, cleaned.length - 9)
    const number = cleaned.substring(cleaned.length - 9)

    if (number.startsWith('9')) {
      // Remove o 9
      const without9 = cleaned.replace(ddd + '9', ddd)
      variations.push(without9)
      if (!without9.startsWith('55')) {
        variations.push('55' + without9)
      }
    } else if (number.length === 8) {
      // Adiciona o 9
      const with9 = cleaned.replace(ddd, ddd + '9')
      variations.push(with9)
      if (!with9.startsWith('55')) {
        variations.push('55' + with9)
      }
    }
  }

  return [...new Set(variations)]
}
