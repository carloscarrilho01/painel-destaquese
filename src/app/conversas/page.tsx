import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { ConversationList } from '@/components/conversation-list'
import { ChatView } from '@/components/chat-view'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

async function getConversations() {
  if (!isSupabaseConfigured) return []

  const { data: chats } = await supabase
    .from('chats')
    .select('*')
    .order('id', { ascending: true })

  const grouped = new Map<string, typeof chats>()

  chats?.forEach(chat => {
    const existing = grouped.get(chat.session_id) || []
    existing.push(chat)
    grouped.set(chat.session_id, existing)
  })

  return Array.from(grouped.entries()).map(([session_id, messages]) => ({
    session_id,
    messages,
    messageCount: messages.length,
    lastMessage: messages[messages.length - 1]?.message?.content || '',
    lastType: messages[messages.length - 1]?.message?.type || 'human'
  }))
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
