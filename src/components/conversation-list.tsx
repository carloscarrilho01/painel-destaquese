'use client'

import Link from 'next/link'
import { Search, Pause, Play, Edit2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { Conversation, Lead } from '@/lib/types'

export function ConversationList({
  conversations,
  selectedSession,
  onToggleTrava,
  onUpdateConversations
}: {
  conversations: Conversation[]
  selectedSession?: string
  onToggleTrava?: (lead: Lead) => void
  onUpdateConversations?: () => void
}) {
  const [search, setSearch] = useState('')

  const filtered = conversations.filter(conv => {
    const searchLower = search.toLowerCase()
    return (
      conv.session_id.toLowerCase().includes(searchLower) ||
      conv.clientName?.toLowerCase().includes(searchLower) ||
      conv.lastMessage.toLowerCase().includes(searchLower)
    )
  })

  const handleToggleTrava = async (e: React.MouseEvent, lead: Lead) => {
    e.preventDefault()
    e.stopPropagation()

    if (onToggleTrava) {
      onToggleTrava(lead)
      // Aguardar um pouco e atualizar a lista
      setTimeout(() => {
        if (onUpdateConversations) {
          onUpdateConversations()
        }
      }, 500)
    }
  }

  return (
    <div className="w-80 bg-[var(--card)] border-r border-[var(--border)] flex flex-col">
      <div className="p-4 border-b border-[var(--border)]">
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
                className={`block p-4 border-b border-[var(--border)] transition-colors ${
                  selectedSession === conv.session_id
                    ? 'bg-[var(--card-hover)]'
                    : conv.lead?.trava
                      ? 'bg-yellow-500/5 hover:bg-yellow-500/10 opacity-75'
                      : 'hover:bg-[var(--card-hover)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[var(--primary)] rounded-full flex items-center justify-center text-white font-semibold">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <p className="font-medium truncate">{displayName}</p>
                        {conv.lead?.trava && (
                          <span className="bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded text-xs flex-shrink-0">
                            Pausado
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[var(--muted)] flex-shrink-0">
                        {conv.messageCount} msgs
                      </span>
                    </div>
                    <p className="text-sm text-[var(--muted)] truncate">
                      {conv.lastType === 'ai' ? 'Agente: ' : 'Cliente: '}
                      {conv.lastMessage.slice(0, 30)}...
                    </p>

                    {/* Botões de ação */}
                    {conv.lead && (
                      <div className="flex items-center gap-1 mt-2">
                        <button
                          onClick={(e) => handleToggleTrava(e, conv.lead!)}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                            conv.lead.trava
                              ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                              : 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
                          }`}
                          title={conv.lead.trava ? 'Despausar agente' : 'Pausar agente'}
                        >
                          {conv.lead.trava ? <Play size={12} /> : <Pause size={12} />}
                          <span>{conv.lead.trava ? 'Ativar' : 'Pausar'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
