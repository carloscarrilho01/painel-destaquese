import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { ConversationList } from '@/components/conversation-list'
import { ChatView } from '@/components/chat-view'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

type ChatMessage = {
  id: number
  session_id: string
  message: { type: string; content: string }
}

type Lead = {
  telefone: string
  nome: string | null
}

function isToolMessage(content: string): boolean {
  return content?.startsWith('[Used tools:') || content?.startsWith('Used tools:')
}

async function getConversations() {
  if (!isSupabaseConfigured) return []

  const [chatsResult, leadsResult] = await Promise.all([
    supabase.from('chats').select('*').order('id', { ascending: true }),
    supabase.from('leads').select('telefone, nome')
  ])

  const chats = chatsResult.data
  const leads = leadsResult.data as Lead[] | null

  if (!chats) return []

  // Criar mapa de telefone -> nome
  const leadMap = new Map<string, string>()
  leads?.forEach(lead => {
    if (lead.nome) {
      leadMap.set(lead.telefone, lead.nome)
    }
  })

  const grouped = new Map<string, ChatMessage[]>()

  chats.forEach((chat: ChatMessage) => {
    const existing = grouped.get(chat.session_id) || []
    existing.push(chat)
    grouped.set(chat.session_id, existing)
  })

  return Array.from(grouped.entries()).map(([session_id, messages]) => {
    // Filtrar mensagens de tool_calls para exibição
    const visibleMessages = messages.filter(m => !isToolMessage(m.message?.content))
    const lastMsg = visibleMessages[visibleMessages.length - 1] || messages[messages.length - 1]

    // Buscar nome do lead pelo telefone (session_id)
    const clientName = leadMap.get(session_id)

    return {
      session_id,
      clientName,
      messages,
      visibleMessages,
      messageCount: visibleMessages.length,
      lastMessage: lastMsg?.message?.content || '',
      lastType: lastMsg?.message?.type || 'human'
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
  const selectedConversation = conversations.find(c => c.session_id === selectedSession)

  return (
    <div className="flex h-full">
      <ConversationList
        conversations={conversations}
        selectedSession={selectedSession}
      />
      <ChatView
        conversation={selectedConversation}
        session_id={selectedSession}
      />
    </div>
  )
}
