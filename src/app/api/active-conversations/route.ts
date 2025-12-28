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

    // 1. Busca conversas ativas direto da API Dinasti
    const startFetch = Date.now()
    const chats = await dinastiClient.findChats()
    const fetchTime = Date.now() - startFetch

    console.log(
      `✅ [Active Conversations] ${chats.length} conversas encontradas em ${fetchTime}ms`
    )

    if (chats.length === 0) {
      return NextResponse.json({
        conversations: [],
        count: 0,
        source: 'dinasti-api',
        fetchTime,
      })
    }

    // 2. Busca dados de leads do banco apenas para enriquecimento
    const startLeads = Date.now()
    const supabase = await createClient()
    const { data: leads } = await supabase.from('leads').select('*')
    const leadsTime = Date.now() - startLeads

    console.log(
      `✅ [Active Conversations] ${leads?.length || 0} leads carregados em ${leadsTime}ms`
    )

    // 3. Cria mapa normalizado de leads (múltiplas variações de telefone)
    const leadMap = new Map<string, Lead>()

    if (leads) {
      for (const lead of leads) {
        const variations = normalizePhoneVariations(lead.telefone)
        variations.forEach((variation) => {
          leadMap.set(variation, lead)
        })
      }
    }

    // 4. Processa conversas
    const conversations: Conversation[] = []

    for (const chat of chats) {
      // Extrai telefone do JID (ex: 5511999999999@s.whatsapp.net)
      const phone = chat.id.replace('@s.whatsapp.net', '').replace('@c.us', '')
      const normalized = normalizePhone(phone)

      // Busca lead associado
      const lead = leadMap.get(normalized)

      // Processa mensagens (se disponíveis)
      const messages = chat.messages || []
      const visibleMessages = messages.filter((msg) => {
        const text = extractMessageText(msg)
        // Filtra mensagens de ferramentas
        return (
          !text.startsWith('[Used tools:') && !text.startsWith('Used tools:')
        )
      })

      // Última mensagem
      const lastMsg = visibleMessages[visibleMessages.length - 1]
      const lastMessage = lastMsg ? extractMessageText(lastMsg) : ''
      const lastType = lastMsg?.key.fromMe ? 'ai' : 'human'

      conversations.push({
        session_id: phone,
        clientName: lead?.nome || chat.name || phone,
        messages: messages.map((msg) => ({
          id: parseInt(msg.key.id) || 0,
          session_id: phone,
          media_url: extractMediaUrl(msg),
          message: {
            type: msg.key.fromMe ? 'ai' : 'human',
            content: extractMessageText(msg),
          },
        })),
        visibleMessages: visibleMessages.map((msg) => ({
          id: parseInt(msg.key.id) || 0,
          session_id: phone,
          media_url: extractMediaUrl(msg),
          message: {
            type: msg.key.fromMe ? 'ai' : 'human',
            content: extractMessageText(msg),
          },
        })),
        messageCount: visibleMessages.length,
        lastMessage: lastMessage.substring(0, 100),
        lastType,
        lead,
      })
    }

    // 5. Ordena por última mensagem (mais recente primeiro)
    conversations.sort((a, b) => {
      const timeA =
        a.messages.length > 0
          ? a.messages[a.messages.length - 1].id
          : 0
      const timeB =
        b.messages.length > 0
          ? b.messages[b.messages.length - 1].id
          : 0
      return timeB - timeA
    })

    const totalTime = Date.now() - startFetch

    console.log(
      `✅ [Active Conversations] ${conversations.length} conversas processadas em ${totalTime}ms total`
    )

    return NextResponse.json({
      conversations,
      count: conversations.length,
      source: 'dinasti-api',
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
