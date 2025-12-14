'use client'

import { useState, useEffect, useRef } from 'react'
import { User, Bot, Send, Loader2, Pause, Play } from 'lucide-react'
import type { Conversation } from '@/lib/types'

function isToolMessage(content: string): boolean {
  return content?.startsWith('[Used tools:') || content?.startsWith('Used tools:')
}

export function ChatView({
  conversation,
  session_id,
}: {
  conversation?: Conversation
  session_id?: string
}) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [togglingAgent, setTogglingAgent] = useState(false)
  const [agentPaused, setAgentPaused] = useState(conversation?.lead?.trava || false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Atualizar status de agente pausado quando conversation mudar
  useEffect(() => {
    setAgentPaused(conversation?.lead?.trava || false)
  }, [conversation?.lead?.trava])

  // Auto-scroll para a última mensagem quando houver novas mensagens
  useEffect(() => {
    if (conversation && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [conversation?.messages.length])

  const handleSendMessage = async () => {
    if (!message.trim() || !session_id || sending) return

    setSending(true)
    setFeedback(null)

    try {
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: session_id,
          message: message.trim(),
          clientName: conversation?.clientName || session_id
        })
      })

      const data = await response.json()

      if (response.ok) {
        setFeedback({ type: 'success', text: 'Mensagem enviada com sucesso!' })
        setMessage('') // Limpar campo

        // Limpar feedback após 3 segundos
        setTimeout(() => setFeedback(null), 3000)
      } else {
        setFeedback({ type: 'error', text: data.error || 'Erro ao enviar mensagem' })
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      setFeedback({ type: 'error', text: 'Erro de conexão ao enviar mensagem' })
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleToggleAgent = async () => {
    if (!session_id || togglingAgent) return

    setTogglingAgent(true)
    setFeedback(null)

    try {
      const response = await fetch('/api/toggle-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telefone: session_id,
          trava: !agentPaused
        })
      })

      const data = await response.json()

      if (response.ok) {
        setAgentPaused(!agentPaused)
        setFeedback({
          type: 'success',
          text: data.message || (!agentPaused ? 'Agente pausado' : 'Agente reativado')
        })

        // Limpar feedback após 3 segundos
        setTimeout(() => setFeedback(null), 3000)
      } else {
        setFeedback({ type: 'error', text: data.error || 'Erro ao alternar status do agente' })
      }
    } catch (error) {
      console.error('Erro ao alternar status do agente:', error)
      setFeedback({ type: 'error', text: 'Erro de conexão ao alternar status do agente' })
    } finally {
      setTogglingAgent(false)
    }
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--background)]">
        <div className="text-center text-[var(--muted)]">
          <p className="text-lg">Selecione uma conversa</p>
          <p className="text-sm mt-2">Escolha uma conversa na lista ao lado</p>
        </div>
      </div>
    )
  }

  const displayName = conversation.clientName || session_id
  const initials = conversation.clientName
    ? conversation.clientName.slice(0, 2).toUpperCase()
    : session_id?.slice(-2)

  // Usar visibleMessages se disponível, senão filtrar na hora
  const messagesToShow = conversation.visibleMessages ||
    conversation.messages.filter(m => !isToolMessage(m.message?.content))

  return (
    <div className="flex-1 flex flex-col bg-[var(--background)]">
      <div className="p-4 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--primary)] rounded-full flex items-center justify-center text-white font-semibold">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{displayName}</p>
                {agentPaused && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/30">
                    Agente pausado
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--muted)]">
                {conversation.messageCount} mensagens
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleAgent}
            disabled={togglingAgent}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
              agentPaused
                ? 'bg-green-500/10 text-green-500 border border-green-500/30 hover:bg-green-500/20'
                : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500/20'
            }`}
          >
            {togglingAgent ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Processando...</span>
              </>
            ) : agentPaused ? (
              <>
                <Play size={16} />
                <span>Reativar Agente</span>
              </>
            ) : (
              <>
                <Pause size={16} />
                <span>Pausar Agente</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div ref={messagesContainerRef} className="flex-1 overflow-auto p-4 space-y-4">
        {messagesToShow.map((chat) => {
          const isHuman = chat.message.type === 'human'

          return (
            <div
              key={chat.id}
              className={`flex ${isHuman ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  isHuman
                    ? 'bg-[var(--human-bubble)] text-white'
                    : 'bg-[var(--ai-bubble)] text-[var(--foreground)]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {isHuman ? (
                    <User size={14} className="text-green-300" />
                  ) : (
                    <Bot size={14} className="text-blue-300" />
                  )}
                  <span className="text-xs opacity-70">
                    {isHuman ? 'Cliente' : 'Agente'}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{chat.message.content}</p>
              </div>
            </div>
          )
        })}
        {/* Elemento invisível para scroll automático */}
        <div ref={messagesEndRef} />
      </div>

      {/* Campo de envio de mensagem */}
      <div className="p-4 border-t border-[var(--border)] bg-[var(--card)]">
        {/* Feedback de sucesso/erro */}
        {feedback && (
          <div className={`mb-3 p-2 rounded text-sm ${
            feedback.type === 'success'
              ? 'bg-green-500/10 text-green-500 border border-green-500/30'
              : 'bg-red-500/10 text-red-500 border border-red-500/30'
          }`}>
            {feedback.text}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            disabled={sending}
            className="flex-1 bg-[var(--background)] border border-[var(--border)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || sending}
            className="bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>Enviar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
