'use client'

import { useState, useEffect, useRef } from 'react'
import { User, Bot, Send, Loader2 } from 'lucide-react'
import type { Conversation, MessageType } from '@/lib/types'
import { AudioRecorder } from './audio-recorder'
import { MediaUploader } from './media-uploader'

function isToolMessage(content: string): boolean {
  return content?.startsWith('[Used tools:') || content?.startsWith('Used tools:')
}

export function ChatView({
  conversation,
  session_id,
  onUpdateConversations,
}: {
  conversation?: Conversation
  session_id?: string
  onUpdateConversations?: () => void | Promise<void>
}) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [mode, setMode] = useState<'text' | 'audio' | 'image' | 'document'>('text')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

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

        // Atualizar conversações
        if (onUpdateConversations) {
          await onUpdateConversations()
        }

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

  const handleSendAudio = async (audioBlob: Blob) => {
    if (!session_id || sending) return

    setSending(true)
    setFeedback(null)

    try {
      // 1. Upload do áudio para Supabase
      const formData = new FormData()
      formData.append('audio', audioBlob, 'audio.webm')

      const uploadResponse = await fetch('/api/upload-audio', {
        method: 'POST',
        body: formData
      })

      const uploadData = await uploadResponse.json()

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || 'Erro ao fazer upload do áudio')
      }

      // 2. Enviar mensagem com URL do áudio
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: session_id,
          messageType: 'audio' as MessageType,
          message: 'Áudio enviado pelo atendente',
          mediaUrl: uploadData.audioUrl,
          clientName: conversation?.clientName || session_id
        })
      })

      const data = await response.json()

      if (response.ok) {
        setFeedback({ type: 'success', text: 'Áudio enviado com sucesso!' })
        setMode('text') // Voltar para modo texto

        // Atualizar conversações
        if (onUpdateConversations) {
          await onUpdateConversations()
        }

        setTimeout(() => setFeedback(null), 3000)
      } else {
        setFeedback({ type: 'error', text: data.error || 'Erro ao enviar áudio' })
      }
    } catch (error) {
      console.error('Erro ao enviar áudio:', error)
      setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'Erro ao enviar áudio' })
    } finally {
      setSending(false)
    }
  }

  const handleSendMedia = async (file: File, mediaType: MessageType) => {
    if (!session_id || sending) return

    setSending(true)
    setFeedback(null)

    try {
      // 1. Upload do arquivo para Supabase
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', mediaType)

      const uploadResponse = await fetch('/api/upload-media', {
        method: 'POST',
        body: formData
      })

      const uploadData = await uploadResponse.json()

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || 'Erro ao fazer upload do arquivo')
      }

      // 2. Enviar mensagem com URL do arquivo
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: session_id,
          messageType: mediaType,
          message: file.name,
          mediaUrl: uploadData.mediaUrl,
          clientName: conversation?.clientName || session_id
        })
      })

      const data = await response.json()

      if (response.ok) {
        const labels = {
          audio: 'Áudio',
          image: 'Imagem',
          document: 'Documento',
          video: 'Vídeo',
          text: 'Mensagem'
        }
        setFeedback({ type: 'success', text: `${labels[mediaType]} enviado com sucesso!` })
        setMode('text') // Voltar para modo texto

        // Atualizar conversações
        if (onUpdateConversations) {
          await onUpdateConversations()
        }

        setTimeout(() => setFeedback(null), 3000)
      } else {
        setFeedback({ type: 'error', text: data.error || 'Erro ao enviar arquivo' })
      }
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error)
      setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'Erro ao enviar arquivo' })
    } finally {
      setSending(false)
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--primary)] rounded-full flex items-center justify-center text-white font-semibold">
            {initials}
          </div>
          <div>
            <p className="font-medium">{displayName}</p>
            <p className="text-sm text-[var(--muted)]">
              {conversation.messageCount} mensagens
            </p>
          </div>
        </div>
      </div>

      <div ref={messagesContainerRef} className="flex-1 overflow-auto p-4 space-y-4">
        {messagesToShow.map((chat) => {
          const isHuman = chat.message.type === 'human'

          // Buscar URL da imagem em todos os lugares possíveis
          let imageUrl = null

          // 1. No nível raiz do chat
          imageUrl = chat.media_url || (chat as any).mediaUrl

          // 2. Dentro de message.additional_kwargs
          if (!imageUrl && chat.message.additional_kwargs) {
            const kwargs = chat.message.additional_kwargs as any
            imageUrl = kwargs.image || kwargs.mediaUrl || kwargs.media_url || kwargs.url
          }

          // 3. Diretamente no message
          if (!imageUrl) {
            const msg = chat.message as any
            imageUrl = msg.image || msg.mediaUrl || msg.media_url || msg.url
          }

          // Verificar se o conteúdo é um nome de arquivo de imagem
          const isImageFilename = chat.message.content?.match(/\.(jpg|jpeg|png|gif|webp|mp4|mp3|ogg|wav|oga)$/i)

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

                {/* Debug: Mostrar estrutura do objeto se for imagem */}
                {isImageFilename && !imageUrl && (
                  <div className="mb-2">
                    <p className="text-xs font-bold mb-1">DEBUG - chat.message:</p>
                    <pre className="text-xs bg-black/20 p-2 rounded overflow-auto mb-2">
                      {JSON.stringify(chat.message, null, 2)}
                    </pre>
                    <p className="text-xs font-bold mb-1">DEBUG - chat completo:</p>
                    <pre className="text-xs bg-black/20 p-2 rounded overflow-auto">
                      {JSON.stringify(chat, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Renderizar imagem se existir */}
                {imageUrl && (
                  <div className="mb-2">
                    <img
                      src={imageUrl as string}
                      alt={chat.message.content}
                      className="rounded-lg max-w-full h-auto max-h-96 object-contain"
                      onError={(e) => {
                        console.error('Erro ao carregar imagem:', imageUrl)
                        console.log('Dados completos da mensagem:', chat.message)
                      }}
                    />
                  </div>
                )}

                {/* Renderizar texto se não for apenas nome de arquivo */}
                {chat.message.content && !isImageFilename && (
                  <p className="text-sm whitespace-pre-wrap">{chat.message.content}</p>
                )}
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

        {/* Modo gravação de áudio */}
        {mode === 'audio' && (
          <AudioRecorder
            onSendAudio={handleSendAudio}
            onCancel={() => setMode('text')}
            disabled={sending}
          />
        )}

        {/* Modo upload de imagem */}
        {mode === 'image' && (
          <MediaUploader
            onFileSelect={handleSendMedia}
            onCancel={() => setMode('text')}
            disabled={sending}
            mediaType="image"
          />
        )}

        {/* Modo upload de documento */}
        {mode === 'document' && (
          <MediaUploader
            onFileSelect={handleSendMedia}
            onCancel={() => setMode('text')}
            disabled={sending}
            mediaType="document"
          />
        )}

        {/* Modo texto (padrão) */}
        {mode === 'text' && (
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

            {/* Botão de gravar áudio */}
            <button
              onClick={() => setMode('audio')}
              disabled={sending}
              className="bg-[var(--primary)] text-white p-2 rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Gravar áudio"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" x2="12" y1="19" y2="22"/>
              </svg>
            </button>

            {/* Botão de anexar imagem */}
            <button
              onClick={() => setMode('image')}
              disabled={sending}
              className="bg-[var(--primary)] text-white p-2 rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Enviar imagem"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
            </button>

            {/* Botão de anexar documento */}
            <button
              onClick={() => setMode('document')}
              disabled={sending}
              className="bg-[var(--primary)] text-white p-2 rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Enviar documento"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
                <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
                <path d="M10 9H8"/>
                <path d="M16 13H8"/>
                <path d="M16 17H8"/>
              </svg>
            </button>

            {/* Botão de enviar texto */}
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
        )}
      </div>
    </div>
  )
}
