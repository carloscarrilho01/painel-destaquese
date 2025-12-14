'use client'

import Link from 'next/link'
import { Search, MessageSquarePlus } from 'lucide-react'
import { useState } from 'react'
import type { Conversation } from '@/lib/types'
import { NewConversationModal } from './new-conversation-modal'
import { useRouter } from 'next/navigation'

export function ConversationList({
  conversations,
  selectedSession,
}: {
  conversations: Conversation[]
  selectedSession?: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filtered = conversations.filter(conv => {
    const searchLower = search.toLowerCase()
    return (
      conv.session_id.toLowerCase().includes(searchLower) ||
      conv.clientName?.toLowerCase().includes(searchLower) ||
      conv.lastMessage.toLowerCase().includes(searchLower)
    )
  })

  const handleConversationCreated = async (sessionId: string) => {
    // Aguardar um pouco para o banco processar a inserção
    await new Promise(resolve => setTimeout(resolve, 500))

    // Forçar reload completo da página para atualizar a lista
    router.push(`/conversas?session=${sessionId}`)
    router.refresh()

    // Fallback: reload completo se a atualização não funcionar
    setTimeout(() => {
      window.location.href = `/conversas?session=${sessionId}`
    }, 1000)
  }

  return (
    <div className="w-80 bg-[var(--card)] border-r border-[var(--border)] flex flex-col">
      {/* Header com botão de nova conversa */}
      <div className="p-4 border-b border-[var(--border)] space-y-3">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-[var(--primary)] text-white py-2 rounded-lg hover:bg-[var(--primary-hover)] transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <MessageSquarePlus size={18} />
          <span>Nova Conversa</span>
        </button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-[var(--muted)]">
            Nenhuma conversa encontrada
          </div>
        ) : (
          filtered.map((conv) => {
            const displayName = conv.clientName || conv.session_id
            const initials = conv.clientName
              ? conv.clientName.slice(0, 2).toUpperCase()
              : conv.session_id.slice(-2)

            return (
              <Link
                key={conv.session_id}
                href={`/conversas?session=${conv.session_id}`}
                className={`block p-4 border-b border-[var(--border)] hover:bg-[var(--card-hover)] transition-colors ${
                  selectedSession === conv.session_id ? 'bg-[var(--card-hover)]' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[var(--primary)] rounded-full flex items-center justify-center text-white font-semibold">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium truncate">
                        {conv.clientName || 'Sem nome'}
                      </p>
                      <span className="text-xs text-[var(--muted)]">
                        {conv.messageCount} msgs
                      </span>
                    </div>
                    {conv.clientName && (
                      <p className="text-xs text-[var(--muted)] truncate mb-1">
                        {conv.session_id}
                      </p>
                    )}
                    <p className="text-sm text-[var(--muted)] truncate">
                      {conv.lastType === 'ai' ? 'Agente: ' : 'Cliente: '}
                      {conv.lastMessage.slice(0, 30)}...
                    </p>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>

      {/* Modal de nova conversa */}
      <NewConversationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  )
}
