import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { RealtimeConversations } from '@/components/realtime-conversations'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import type { ChatMessage, Conversation, Lead } from '@/lib/types'

/**
 * Limpa mensagens que contêm tool calls e extrai apenas o conteúdo real
 * Exemplo: "[Used tools: Tool: atualiza_nome, Input: {}, Resul_seminovo ou quer fazer avaliação do seu veículo?"
 * Retorna: "seminovo ou quer fazer avaliação do seu veículo?"
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

  // Remove dados de lead no formato : [[{"id":"...","telefone":"..."}]]
  // Pode estar com ou sem espaço antes dos dois pontos
  if (cleaned.startsWith(':')) {
    // Remove o ":" inicial e espaços
    cleaned = cleaned.substring(1).trim()

    // Se começa com [[{, remove até o final do array ]]
    if (cleaned.startsWith('[[{')) {
      const endIndex = cleaned.indexOf(']]')
      if (endIndex !== -1) {
        cleaned = cleaned.substring(endIndex + 2).trim()
      }
    }
  }

  // Remove dados técnicos de fotos (DISCOVERY, CIVIC, etc)
  // Padrão: {"row_number":1,"Carros disponiveis":"","Fotos bmw":"https://..."...}
  if (cleaned.startsWith('[{"row_number"') || cleaned.startsWith('{"row_number"')) {
    // É um array ou objeto JSON de dados técnicos, não é mensagem real
    return ''
  }

  // Remove prefixos de descoberta de fotos como ":"[{"row_number"
  if (cleaned.includes('"row_number"') && cleaned.includes('"Fotos')) {
    // Contém dados técnicos de fotos, bloqueia toda mensagem
    return ''
  }

  // Se após limpar não sobrou nada, significa que era apenas tool call sem conteúdo
  return cleaned || ''
}

function isToolMessage(content: string): boolean {
  // Agora verifica se é uma mensagem que APENAS contém tool call (sem conteúdo real)
  const cleaned = cleanToolMessage(content)
  return cleaned === ''
}

async function getConversations() {
  if (!isSupabaseConfigured) return []

  const [chatsResult, leadsResult] = await Promise.all([
    supabase.from('chats').select('*').order('id', { ascending: true }),
    supabase.from('leads').select('*')
  ])

  const chats = chatsResult.data
  const leads = leadsResult.data as Lead[] | null

  if (!chats) return []

  // Criar mapa de telefone -> lead completo (normalizado com variações)
  const leadMap = new Map<string, Lead>()
  leads?.forEach(lead => {
    if (lead.telefone) {
      const phone = lead.telefone.replace(/\D/g, '')
      leadMap.set(phone, lead)
      leadMap.set(lead.telefone, lead)

      // Variações com/sem código do país
      if (phone.startsWith('55')) {
        const semPais = phone.slice(2)
        leadMap.set(semPais, lead)

        // Adicionar 9 no celular: 55XX + 9 + XXXXXXXX (telefones antigos sem o 9)
        if (semPais.length === 10) {
          const ddd = semPais.slice(0, 2)
          const numero = semPais.slice(2)
          leadMap.set(`55${ddd}9${numero}`, lead)
          leadMap.set(`${ddd}9${numero}`, lead)
        }
      }
    }
  })

  const grouped = new Map<string, ChatMessage[]>()

  chats.forEach((chat: ChatMessage) => {
    const existing = grouped.get(chat.session_id) || []
    existing.push(chat)
    grouped.set(chat.session_id, existing)
  })

  return Array.from(grouped.entries()).map(([session_id, messages]) => {
    // Limpar e filtrar mensagens de tool_calls para exibição
    const visibleMessages = messages
      .filter(m => !isToolMessage(m.message?.content))
      .map(m => {
        // Limpa o conteúdo de tool calls mantendo apenas a mensagem real
        if (m.message?.content) {
          const cleanedContent = cleanToolMessage(m.message.content)
          return {
            ...m,
            message: {
              ...m.message,
              content: cleanedContent
            }
          }
        }
        return m
      })
      .filter(m => m.message?.content) // Remove mensagens vazias após limpeza

    const lastMsg = visibleMessages[visibleMessages.length - 1] || messages[messages.length - 1]

    // Buscar lead completo pelo telefone (session_id) - tentar várias variações
    const normalizedSessionId = session_id.replace(/\D/g, '')
    const lead = leadMap.get(normalizedSessionId) ||
                 leadMap.get(session_id) ||
                 (normalizedSessionId.startsWith('55') ? leadMap.get(normalizedSessionId.slice(2)) : undefined)

    return {
      session_id,
      clientName: lead?.nome || undefined,
      messages,
      visibleMessages,
      messageCount: visibleMessages.length,
      lastMessage: lastMsg?.message?.content || '',
      lastType: lastMsg?.message?.type || 'human',
      lead: lead || undefined
    }
  })
}

export default async function ConversasPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>
}) {
  if (!isSupabaseConfigured) {
    return (
      <div className="p-8">
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="text-yellow-500 mt-1" size={24} />
            <div>
              <h2 className="text-lg font-semibold text-yellow-500">Configuracao Necessaria</h2>
              <p className="text-[var(--muted)] mt-2">
                Configure as credenciais do Supabase para visualizar as conversas.
              </p>
              <Link
                href="/configuracoes"
                className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2 rounded-lg mt-4 hover:bg-[var(--primary-hover)] transition-colors"
              >
                Ver instrucoes
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const params = await searchParams
  const conversations = await getConversations()
  const selectedSession = params.session || conversations[0]?.session_id

  return (
    <RealtimeConversations
      initialConversations={conversations}
      initialSession={selectedSession}
    />
  )
}
