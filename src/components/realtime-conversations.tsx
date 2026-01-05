'use client'

/**
 * Versão OTIMIZADA do componente de conversas
 *
 * Mudanças principais:
 * 1. Busca conversas ativas direto da API Uazapi (muito mais rápido)
 * 2. Usa polling inteligente que pausa quando usuário sai da página
 * 3. Banco de dados usado apenas para histórico e enriquecimento
 * 4. Performance constante independente do volume de mensagens
 */

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ConversationList } from '@/components/conversation-list'
import { ChatView } from '@/components/chat-view'
import { useSmartUazapiPolling } from '@/hooks/use-uazapi-polling'
import type { Conversation, Lead } from '@/lib/types'

export function RealtimeConversations({
  initialConversations,
  initialSession
}: {
  initialConversations: Conversation[]
  initialSession?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedSession, setSelectedSession] = useState(
    initialSession || initialConversations[0]?.session_id
  )
  const [isLive, setIsLive] = useState(false)

  // Hook de polling inteligente da API Uazapi
  const {
    conversations,
    isLoading,
    error,
    lastUpdate,
    fetchTime,
    refresh,
    isPolling,
  } = useSmartUazapiPolling({
    interval: 5000, // 5 segundos (pode ajustar)
    enabled: true, // Sempre ativo quando página visível
    onUpdate: (newConversations) => {
      // Detecta novas mensagens
      const hasNewMessages = newConversations.length > conversations.length
      if (hasNewMessages) {
        setIsLive(true)
        setTimeout(() => setIsLive(false), 2000)
      }
    },
    onError: (err) => {
      console.error('❌ [Polling] Erro:', err)
    },
  })

  // Usa conversas iniciais enquanto carrega
  const displayConversations =
    conversations.length > 0 ? conversations : initialConversations

  // Toggle trava do agente
  const handleToggleTrava = async (lead: Lead) => {
    const newTravaValue = !lead.trava

    try {
      const response = await fetch('/api/update-lead', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          updates: { trava: newTravaValue },
        }),
      })

      if (!response.ok) {
        throw new Error('Falha ao atualizar trava')
      }

      // Atualiza conversas após alterar trava
      await refresh()
    } catch (error) {
      console.error('Erro ao atualizar trava:', error)
      alert('Erro ao pausar/despausar agente. Tente novamente.')
    }
  }

  // Função para navegar para uma conversa (atualiza URL)
  const handleNewConversation = (sessionId: string) => {
    router.push(`/conversas?session=${sessionId}`)
    setSelectedSession(sessionId)
  }

  // Atualiza a conversa selecionada quando o query param mudar
  useEffect(() => {
    const sessionFromUrl = searchParams.get('session')
    if (sessionFromUrl && sessionFromUrl !== selectedSession) {
      setSelectedSession(sessionFromUrl)
    }
  }, [searchParams, selectedSession])

  // Atualizar session selecionada se mudar pela URL
  useEffect(() => {
    if (initialSession && initialSession !== selectedSession) {
      setSelectedSession(initialSession)
    }
  }, [initialSession, selectedSession])

  const selectedConversation = displayConversations.find(
    (c) => c.session_id === selectedSession
  )

  return (
    <div className="flex h-full relative">
      {/* Indicador de nova mensagem */}
      {isLive && (
        <div className="absolute top-4 right-4 z-50 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 shadow-lg animate-bounce">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          Mensagem nova recebida!
        </div>
      )}

      {/* Erro de conexão */}
      {error && (
        <div className="absolute top-16 left-4 right-4 z-40 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-medium">
              Erro ao carregar conversas:
            </span>
            <span className="text-red-500 text-sm">{error.message}</span>
          </div>
          <button
            onClick={refresh}
            className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      <ConversationList
        conversations={displayConversations}
        selectedSession={selectedSession}
        onToggleTrava={handleToggleTrava}
        onUpdateConversations={refresh}
        onNewConversation={handleNewConversation}
      />
      <ChatView conversation={selectedConversation} session_id={selectedSession} />
    </div>
  )
}
