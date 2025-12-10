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

  useEffect(() => {
    // Função para buscar dados atualizados
    const fetchData = async () => {
      const [chatsResult, leadsResult] = await Promise.all([
        supabase.from('chats').select('*').order('id', { ascending: true }),
        supabase.from('leads').select('telefone, nome')
      ])

      if (chatsResult.data && leadsResult.data) {
        const processed = processConversations(chatsResult.data, leadsResult.data)
        setConversations(processed)
      }
    }

    // Subscrever a mudanças na tabela chats
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
          console.log('Nova mensagem recebida:', payload)
          setIsLive(true)
          fetchData() // Recarregar dados quando houver mudanças

          // Remover indicador após 2 segundos
          setTimeout(() => setIsLive(false), 2000)
        }
      )
      .subscribe()

    // Cleanup ao desmontar componente
    return () => {
      supabase.removeChannel(channel)
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
      {/* Indicador de atualização em tempo real */}
      {isLive && (
        <div className="absolute top-4 right-4 z-50 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 shadow-lg">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          Mensagem nova recebida
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
