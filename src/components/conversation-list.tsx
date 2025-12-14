'use client'

import Link from 'next/link'
import { Search, Plus } from 'lucide-react'
import { useState } from 'react'
import type { Conversation } from '@/lib/types'
import { NewConversationModal } from './new-conversation-modal'

export function ConversationList({
  conversations,
  selectedSession,
  onNewConversation,
}: {
  conversations: Conversation[]
  selectedSession?: string
  onNewConversation?: (sessionId: string) => void
}) {
  const [search, setSearch] = useState('')
  const [showNewConversation, setShowNewConversation] = useState(false)

  const filtered = conversations.filter(conv => {
    const searchLower = search.toLowerCase()
    return (
      conv.session_id.toLowerCase().includes(searchLower) ||
      conv.clientName?.toLowerCase().includes(searchLower) ||
      conv.lastMessage.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="w-80 bg-[var(--card)] border-r border-[var(--border)] flex flex-col">
      <div className="p-4 border-b border-[var(--border)] space-y-3">
        <button
          onClick={() => setShowNewConversation(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
        >
          <Plus size={18} />
          Nova Conversa
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
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{displayName}</p>
                      <span className="text-xs text-[var(--muted)]">
                        {conv.messageCount} msgs
                      </span>
                    </div>
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

      <NewConversationModal
        open={showNewConversation}
        onClose={() => setShowNewConversation(false)}
        onSuccess={(sessionId) => {
          setShowNewConversation(false)
          if (onNewConversation) {
            onNewConversation(sessionId)
          }
        }}
      />
    </div>
  )
}
