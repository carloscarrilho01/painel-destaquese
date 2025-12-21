'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ConversationList } from '@/components/conversation-list'
import { ChatView } from '@/components/chat-view'
import type { ChatMessage, Conversation, Lead } from '@/lib/types'

function isToolMessage(content: string): boolean {
  return content?.startsWith('[Used tools:') || content?.startsWith('Used tools:')
}

function processConversations(chats: ChatMessage[], leads: Lead[] | null): Conversation[] {
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
  const seenIds = new Set<number>()

  chats.forEach((chat: ChatMessage) => {
    // Deduplicação por ID: ignorar se já foi processado
    if (seenIds.has(chat.id)) {
      return
    }
    seenIds.add(chat.id)

    const existing = grouped.get(chat.session_id) || []
    existing.push(chat)
    grouped.set(chat.session_id, existing)
  })

  return Array.from(grouped.entries()).map(([session_id, messages]) => {
    // Filtrar mensagens de tool_calls para exibição
    const visibleMessages = messages.filter(m => !isToolMessage(m.message?.content))
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

export function RealtimeConversations({
  initialConversations,
  initialSession
}: {
  initialConversations: Conversation[]
  initialSession?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [conversations, setConversations] = useState(initialConversations)
  const [selectedSession, setSelectedSession] = useState(initialSession || initialConversations[0]?.session_id)
  const [isLive, setIsLive] = useState(false)
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'error' | 'polling'>('connecting')

  // Função auxiliar para fazer merge inteligente das conversas
  const mergeConversations = (newConversations: Conversation[]) => {
    setConversations(prev => {
      const merged = new Map<string, Conversation>()

      // Adicionar conversas existentes
      prev.forEach(conv => merged.set(conv.session_id, conv))

      // Atualizar/adicionar novas conversas
      newConversations.forEach(conv => {
        const existing = merged.get(conv.session_id)
        if (!existing || conv.messages.length > existing.messages.length) {
          merged.set(conv.session_id, conv)
        }
      })

      return Array.from(merged.values())
    })
  }

  // Função para atualizar dados
  const handleUpdateConversations = async () => {
    try {
      const [chatsResult, leadsResult] = await Promise.all([
        supabase.from('chats').select('*').order('id', { ascending: true }),
        supabase.from('leads').select('*')
      ])

      if (chatsResult.data && leadsResult.data) {
        const processed = processConversations(chatsResult.data, leadsResult.data)
        mergeConversations(processed)
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    }
  }

  // Toggle trava do agente
  const handleToggleTrava = async (lead: Lead) => {
    const newTravaValue = !lead.trava

    try {
      const response = await fetch('/api/update-lead', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          updates: { trava: newTravaValue }
        })
      })

      if (!response.ok) {
        throw new Error('Falha ao atualizar trava')
      }
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

  useEffect(() => {
    let debounceTimer: NodeJS.Timeout | null = null

    // Função para buscar dados atualizados com debounce
    const fetchData = async () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      debounceTimer = setTimeout(async () => {
        try {
          const [chatsResult, leadsResult] = await Promise.all([
            supabase.from('chats').select('*').order('id', { ascending: true }),
            supabase.from('leads').select('*')
          ])

          if (chatsResult.data && leadsResult.data) {
            const processed = processConversations(chatsResult.data, leadsResult.data)
            mergeConversations(processed)
          }
        } catch (error) {
          console.error('Erro ao buscar dados:', error)
        }
      }, 300) // Debounce de 300ms
    }

    let pollingInterval: NodeJS.Timeout | null = null
    let pollingTimeout: NodeJS.Timeout | null = null
    let hasStartedPolling = false

    // Iniciar polling imediatamente como fallback
    // Se Realtime conectar, o polling será cancelado
    const startPolling = () => {
      if (hasStartedPolling) return
      hasStartedPolling = true

      console.log('🔄 [Polling] Iniciando polling a cada 5 segundos...')
      pollingInterval = setInterval(() => {
        console.log('🔄 [Polling] Verificando novas mensagens...')
        fetchData()
      }, 5000) // Aumentado para 5 segundos para reduzir chamadas
      setRealtimeStatus('polling')
    }

    const stopPolling = () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
        pollingInterval = null
        hasStartedPolling = false
        console.log('⏹️ [Polling] Polling cancelado')
      }
      if (pollingTimeout) {
        clearTimeout(pollingTimeout)
        pollingTimeout = null
      }
    }

    // Iniciar polling após 3 segundos se Realtime não conectar (aumentado de 2s)
    pollingTimeout = setTimeout(() => {
      if (realtimeStatus === 'connecting') {
        console.log('⏱️ [Polling] Realtime demorou, iniciando polling...')
        startPolling()
      }
    }, 3000)

    // Tentar subscrever via Realtime
    const channel = supabase
      .channel('chats-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'chats'
        },
        (payload) => {
          console.log('✅ [Realtime] Nova mensagem recebida:', payload)
          setIsLive(true)
          fetchData()
          setTimeout(() => setIsLive(false), 2000)
        }
      )
      .subscribe((status) => {
        console.log('📡 [Realtime] Status:', status)

        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected')
          console.log('✅ [Realtime] Conectado com sucesso!')

          // Cancelar polling completamente quando Realtime conectar
          stopPolling()
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn('⚠️ [Realtime] Erro na conexão:', status)
          setRealtimeStatus('error')
          startPolling()
        }
      })

    // Cleanup
    return () => {
      console.log('🔌 [Realtime] Desconectando...')
      supabase.removeChannel(channel)
      stopPolling()
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [])

  // Atualizar session selecionada se mudar pela URL
  useEffect(() => {
    if (initialSession && initialSession !== selectedSession) {
      setSelectedSession(initialSession)
    }
  }, [initialSession])

  const selectedConversation = conversations.find(c => c.session_id === selectedSession)

  return (
    <div className="flex h-full relative">
      {/* Indicador de nova mensagem */}
      {isLive && (
        <div className="absolute top-4 right-4 z-50 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 shadow-lg animate-bounce">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          Mensagem nova recebida!
        </div>
      )}

      <ConversationList
        conversations={conversations}
        selectedSession={selectedSession}
        onToggleTrava={handleToggleTrava}
        onUpdateConversations={handleUpdateConversations}
        onNewConversation={handleNewConversation}
      />
      <ChatView
        conversation={selectedConversation}
        session_id={selectedSession}
      />
    </div>
  )
}
