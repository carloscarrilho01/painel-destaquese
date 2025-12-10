'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ConversationList } from '@/components/conversation-list'
import { ChatView } from '@/components/chat-view'
import type { ChatMessage, Conversation } from '@/lib/types'

type Lead = {
  telefone: string
  nome: string | null
}

function isToolMessage(content: string): boolean {
  return content?.startsWith('[Used tools:') || content?.startsWith('Used tools:')
}

function processConversations(chats: ChatMessage[], leads: Lead[] | null): Conversation[] {
  // Criar mapa de telefone -> nome (normalizado com variações)
  const leadMap = new Map<string, string>()
  leads?.forEach(lead => {
    if (lead.nome && lead.telefone) {
      const phone = lead.telefone.replace(/\D/g, '')
      leadMap.set(phone, lead.nome)

      // Variações com/sem código do país
      if (phone.startsWith('55')) {
        const semPais = phone.slice(2)
        leadMap.set(semPais, lead.nome)

        // Adicionar 9 no celular: 55XX + 9 + XXXXXXXX (telefones antigos sem o 9)
        if (semPais.length === 10) {
          const ddd = semPais.slice(0, 2)
          const numero = semPais.slice(2)
          leadMap.set(`55${ddd}9${numero}`, lead.nome)
          leadMap.set(`${ddd}9${numero}`, lead.nome)
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

    // Buscar nome do lead pelo telefone (session_id) - tentar várias variações
    const normalizedSessionId = session_id.replace(/\D/g, '')
    const clientName = leadMap.get(normalizedSessionId) ||
                       leadMap.get(session_id) ||
                       (normalizedSessionId.startsWith('55') ? leadMap.get(normalizedSessionId.slice(2)) : undefined)

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

export function RealtimeConversations({
  initialConversations,
  initialSession
}: {
  initialConversations: Conversation[]
  initialSession?: string
}) {
  const [conversations, setConversations] = useState(initialConversations)
  const [selectedSession, setSelectedSession] = useState(initialSession || initialConversations[0]?.session_id)
  const [isLive, setIsLive] = useState(false)
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'error' | 'polling'>('connecting')

  useEffect(() => {
    // Função para buscar dados atualizados
    const fetchData = async () => {
      try {
        const [chatsResult, leadsResult] = await Promise.all([
          supabase.from('chats').select('*').order('id', { ascending: true }),
          supabase.from('leads').select('telefone, nome')
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
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRealtimeStatus('error')
          console.warn('⚠️ [Realtime] Erro na conexão. Usando polling como fallback.')

          // Fallback: Polling a cada 5 segundos
          pollingInterval = setInterval(() => {
            console.log('🔄 [Polling] Verificando novas mensagens...')
            fetchData()
          }, 5000)

          setRealtimeStatus('polling')
        }
      })

    // Cleanup
    return () => {
      console.log('🔌 [Realtime] Desconectando...')
      supabase.removeChannel(channel)
      if (pollingInterval) {
        clearInterval(pollingInterval)
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
      {/* Indicador de status de conexão */}
      <div className="absolute top-4 left-4 z-50">
        {realtimeStatus === 'connected' && (
          <div className="bg-green-500/20 text-green-500 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 border border-green-500/30">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Tempo real ativo
          </div>
        )}
        {realtimeStatus === 'polling' && (
          <div className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 border border-yellow-500/30">
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
            Atualizando (5s)
          </div>
        )}
        {realtimeStatus === 'connecting' && (
          <div className="bg-blue-500/20 text-blue-500 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 border border-blue-500/30">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            Conectando...
          </div>
        )}
      </div>

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
      />
      <ChatView
        conversation={selectedConversation}
        session_id={selectedSession}
      />
    </div>
  )
}
