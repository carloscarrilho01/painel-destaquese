'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ConversationList } from '@/components/conversation-list'
import { ChatView } from '@/components/chat-view'
import { useNotificationSound } from '@/hooks/useNotificationSound'
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

  chats.forEach((chat: ChatMessage) => {
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
  const { playSound, isEnabled: isSoundEnabled, toggleSound } = useNotificationSound()
  const previousMessageCountRef = useRef<number>(0)

  // Função para atualizar dados
  const handleUpdateConversations = async () => {
    try {
      const [chatsResult, leadsResult] = await Promise.all([
        supabase.from('chats').select('*').order('id', { ascending: true }),
        supabase.from('leads').select('*')
      ])

      if (chatsResult.data && leadsResult.data) {
        const processed = processConversations(chatsResult.data, leadsResult.data)

        // Verificar se há novas mensagens para tocar som
        const currentTotalMessages = chatsResult.data.length
        if (previousMessageCountRef.current > 0 && currentTotalMessages > previousMessageCountRef.current) {
          playSound()
        }
        previousMessageCountRef.current = currentTotalMessages

        setConversations(processed)
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

  // Inicializar contador de mensagens
  useEffect(() => {
    const initializeMessageCount = async () => {
      try {
        const { data } = await supabase.from('chats').select('*', { count: 'exact', head: true })
        if (data !== null) {
          previousMessageCountRef.current = (data as any[]).length || 0
        }
      } catch (error) {
        console.error('Erro ao inicializar contador:', error)
      }
    }
    initializeMessageCount()
  }, [])

  // Atualiza a conversa selecionada quando o query param mudar
  useEffect(() => {
    const sessionFromUrl = searchParams.get('session')
    if (sessionFromUrl && sessionFromUrl !== selectedSession) {
      setSelectedSession(sessionFromUrl)
    }
  }, [searchParams, selectedSession])

  useEffect(() => {
    // Função para buscar dados atualizados
    const fetchData = async () => {
      try {
        const [chatsResult, leadsResult] = await Promise.all([
          supabase.from('chats').select('*').order('id', { ascending: true }),
          supabase.from('leads').select('*')
        ])

        if (chatsResult.data && leadsResult.data) {
          const processed = processConversations(chatsResult.data, leadsResult.data)
          setConversations(processed)
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error)
      }
    }

    let pollingInterval: NodeJS.Timeout | null = null
    let hasStartedPolling = false

    // Iniciar polling imediatamente como fallback
    // Se Realtime conectar, o polling será cancelado
    const startPolling = () => {
      if (hasStartedPolling) return
      hasStartedPolling = true

      console.log('🔄 [Polling] Iniciando polling a cada 3 segundos...')
      pollingInterval = setInterval(() => {
        console.log('🔄 [Polling] Verificando novas mensagens...')
        fetchData()
      }, 3000)
      setRealtimeStatus('polling')
    }

    // Iniciar polling após 2 segundos se Realtime não conectar
    const pollingTimeout = setTimeout(() => {
      if (realtimeStatus === 'connecting') {
        console.log('⏱️ [Polling] Realtime demorou, iniciando polling...')
        startPolling()
      }
    }, 2000)

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

          // Cancelar polling se estava rodando
          if (pollingInterval) {
            clearInterval(pollingInterval)
            pollingInterval = null
            hasStartedPolling = false
            console.log('⏹️ [Polling] Polling cancelado, Realtime ativo')
          }
          clearTimeout(pollingTimeout)
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn('⚠️ [Realtime] Erro na conexão:', status)
          startPolling()
        }
      })

    // Cleanup
    return () => {
      console.log('🔌 [Realtime] Desconectando...')
      supabase.removeChannel(channel)
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
      clearTimeout(pollingTimeout)
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

      {/* Toggle de som de notificação */}
      <button
        onClick={toggleSound}
        className="absolute top-4 left-4 z-50 bg-[var(--card)] border border-[var(--border)] px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 shadow-lg hover:bg-[var(--muted)]/10 transition-colors"
        title={isSoundEnabled ? 'Desativar som de notificação' : 'Ativar som de notificação'}
      >
        {isSoundEnabled ? (
          <>
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 3.5a.75.75 0 01.77.75V5h4.48a.75.75 0 110 1.5H10.77v8.75a.75.75 0 01-1.5 0V6.5H4.75a.75.75 0 110-1.5h4.52V4.25a.75.75 0 01.73-.75z"/>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-1.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13z" clipRule="evenodd"/>
            </svg>
            <span className="text-green-500">Som ativado</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-14.5-14.5z" clipRule="evenodd"/>
              <path d="M10 3.5a.75.75 0 01.77.75V5h4.48a.75.75 0 110 1.5H10.77v8.75a.75.75 0 01-1.5 0V6.5H4.75a.75.75 0 110-1.5h4.52V4.25a.75.75 0 01.73-.75z"/>
            </svg>
            <span className="text-red-500">Som desativado</span>
          </>
        )}
      </button>

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
