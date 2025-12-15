'use client'

import { useState, useEffect, useRef } from 'react'
import { User, Bot, Send, Loader2, Paperclip, X, Image as ImageIcon } from 'lucide-react'
import type { Conversation } from '@/lib/types'
import { supabase } from '@/lib/supabase'

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll para a última mensagem quando houver novas mensagens
  useEffect(() => {
    if (conversation && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [conversation?.messages.length])

  // Limpar preview quando arquivo for removido
  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview)
      }
    }
  }, [filePreview])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)

    // Criar preview para imagens
    if (file.type.startsWith('image/')) {
      const preview = URL.createObjectURL(file)
      setFilePreview(preview)
    } else {
      setFilePreview(null)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (filePreview) {
      URL.revokeObjectURL(filePreview)
      setFilePreview(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadFileToSupabase = async (file: File): Promise<string> => {
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const extension = file.name.split('.').pop() || 'bin'
    const fileName = `${file.type.startsWith('image/') ? 'image' : 'file'}_${timestamp}_${randomStr}.${extension}`

    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileName)

    return publicUrl
  }

  const handleSendMessage = async () => {
    if ((!message.trim() && !selectedFile) || !session_id || sending) return

    setSending(true)
    setUploading(!!selectedFile)
    setFeedback(null)

    try {
      let mediaUrl: string | undefined

      // Upload do arquivo se houver
      if (selectedFile) {
        mediaUrl = await uploadFileToSupabase(selectedFile)
      }

      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: session_id,
          message: message.trim() || selectedFile?.name || '',
          messageType: selectedFile ? (selectedFile.type.startsWith('image/') ? 'image' : 'file') : 'text',
          mediaUrl,
          clientName: conversation?.clientName || session_id
        })
      })

      const data = await response.json()

      if (response.ok) {
        setFeedback({ type: 'success', text: selectedFile ? 'Arquivo enviado com sucesso!' : 'Mensagem enviada com sucesso!' })
        setMessage('')
        handleRemoveFile()

        // Limpar feedback após 3 segundos
        setTimeout(() => setFeedback(null), 3000)
      } else {
        setFeedback({ type: 'error', text: data.error || 'Erro ao enviar mensagem' })
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'Erro de conexão ao enviar mensagem' })
    } finally {
      setSending(false)
      setUploading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
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

        {/* Preview do arquivo selecionado */}
        {selectedFile && (
          <div className="mb-3 p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg">
            <div className="flex items-center gap-3">
              {filePreview ? (
                <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded" />
              ) : (
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                  <ImageIcon size={24} className="text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-[var(--muted)]">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                onClick={handleRemoveFile}
                className="p-2 hover:bg-[var(--card-hover)] rounded transition-colors"
                disabled={sending}
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept="image/*,audio/*,video/*,.pdf,.doc,.docx"
            className="hidden"
            disabled={sending}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            className="p-2 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--card-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Anexar arquivo"
          >
            <Paperclip size={18} />
          </button>

          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={selectedFile ? "Mensagem opcional..." : "Digite sua mensagem..."}
            disabled={sending}
            className="flex-1 bg-[var(--background)] border border-[var(--border)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSendMessage}
            disabled={(!message.trim() && !selectedFile) || sending}
            className="bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>{uploading ? 'Enviando arquivo...' : 'Enviando...'}</span>
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
