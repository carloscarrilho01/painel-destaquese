import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { RealtimeConversations } from '@/components/realtime-conversations'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import type { ChatMessage, Conversation, Lead } from '@/lib/types'

// Extrai o conteúdo útil de mensagens que contêm informações de tools
function extractUsefulContent(content: string): string | null {
  if (!content) return null

  // Se começa com [Used tools: ...], extrair apenas o resultado útil
  if (content.startsWith('[Used tools:') || content.startsWith('Used tools:')) {
    // Padrão: [Used tools: Tool: nome_tool, Input: {}, Result: [{\"id\":\"...\", \"content\":\"CONTEÚDO ÚTIL\"}]]
    // Ou: [Used tools: Tool: nome_tool, Input: {}, Result: CONTEÚDO]

    // Tentar extrair conteúdo de Result:
    const resultMatch = content.match(/Result:\s*\[\{[^\}]*"content"\s*:\s*"([^"]+)"/i)
    if (resultMatch && resultMatch[1]) {
      return resultMatch[1]
    }

    // Tentar extrair resultado simples após "Result:"
    const simpleResultMatch = content.match(/Result:\s*(.+)$/i)
    if (simpleResultMatch && simpleResultMatch[1]) {
      const result = simpleResultMatch[1].trim()
      // Remove colchetes e chaves extras se for JSON
      return result.replace(/^\[|\]$/g, '').replace(/^\{|\}$/g, '').trim()
    }

    // Se não conseguiu extrair, retorna null para ocultar a mensagem
    return null
  }

  return content
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
    // Processar mensagens: extrair conteúdo útil e filtrar as que não têm conteúdo
    const visibleMessages = messages
      .map(m => {
        const processedContent = extractUsefulContent(m.message?.content)
        if (processedContent === null) return null

        return {
          ...m,
          message: {
            ...m.message,
            content: processedContent
          }
        }
      })
      .filter(m => m !== null) as ChatMessage[]

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
