'use client'

import { useState, useEffect, useRef } from 'react'
import { User, Bot, Send, Loader2, Paperclip, X, Image as ImageIcon, Mic } from 'lucide-react'
import type { Conversation, MessageType } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { AudioRecorder } from './audio-recorder'

function isToolMessage(content: string): boolean {
  return content?.startsWith('[Used tools:') || content?.startsWith('Used tools:')
}

// Verificar se é mensagem de processamento interno (categoria/intenções/metadados)
function isInternalProcessingMessage(content: string): boolean {
  if (!content) return false

  // Verificar JSON estruturado
  try {
    const parsed = JSON.parse(content)
    if (parsed.output) {
      // Ocultar mensagens de categorização e intenções
      return !!(parsed.output.categoria || parsed.output.intencoes)
    }
  } catch {
    // Não é JSON, continuar verificando outros padrões
  }

  // Verificar padrões de metadados do cliente (pode estar em qualquer linha)
  const metadataPatterns = [
    /nome do cliente:/i,
    /numero do cliente:/i,
    /n[uú]mero do cliente:/i,
    /interesse:/i,
    /telefone:/i,
    /email:/i,
  ]

  // Se contém qualquer um desses padrões, é mensagem interna
  const hasMetadata = metadataPatterns.some(pattern => pattern.test(content))

  // Se tem tags XML/HTML <CLIENTE>, <AGENDA>, etc., é mensagem interna
  const hasXMLTags = /<\/?[A-Z_]+>/.test(content)

  // Se tem múltiplas linhas E contém "cliente" ou "interesse", provavelmente é metadado
  const hasMultipleLines = (content.match(/\n/g) || []).length >= 2
  const hasClientKeywords = /cliente|interesse/i.test(content)
  const looksLikeMetadata = hasMultipleLines && hasClientKeywords && content.length < 500

  return hasMetadata || hasXMLTags || looksLikeMetadata
}

// Função para parsear e formatar mensagens estruturadas do agente
function parseAgentMessage(content: string): {
  isStructured: boolean
  displayContent: string
  metadata?: any
} {
  if (!content) return { isStructured: false, displayContent: content }

  // Tentar parsear como JSON
  try {
    const parsed = JSON.parse(content)

    // Se tem a estrutura {"output": {...}}
    if (parsed.output) {
      const output = parsed.output

      // Se é uma resposta de texto (tem campo "resposta")
      if (output.resposta) {
        return {
          isStructured: true,
          displayContent: output.resposta,
          metadata: output
        }
      }

      // Se é categorização (tem campo "categoria") - não exibir
      if (output.categoria) {
        return {
          isStructured: true,
          displayContent: '', // Não exibir mensagens de categorização
          metadata: output
        }
      }

      // Se são intenções (tem campo "intencoes") - não exibir
      if (output.intencoes && Array.isArray(output.intencoes)) {
        return {
          isStructured: true,
          displayContent: '', // Não exibir mensagens de intenções
          metadata: output
        }
      }

      // Outros formatos de output estruturado
      return {
        isStructured: true,
        displayContent: JSON.stringify(output, null, 2),
        metadata: output
      }
    }

    // Se é JSON mas não tem a estrutura esperada, mostrar formatado
    return {
      isStructured: true,
      displayContent: JSON.stringify(parsed, null, 2),
      metadata: parsed
    }
  } catch {
    // Não é JSON válido
    // Verificar se tem tags XML/HTML como <CLIENTE>, <AGENDA>, etc.
    const hasXMLTags = /<[A-Z_]+>/.test(content)

    if (hasXMLTags) {
      // Remover tags XML/HTML e limpar o conteúdo
      let cleaned = content
        .replace(/<\/?[A-Z_]+>/g, '') // Remove tags como <CLIENTE>, </CLIENTE>, <AGENDA>, etc.
        .replace(/\n\s*\n/g, '\n') // Remove linhas vazias múltiplas
        .trim()

      return {
        isStructured: true,
        displayContent: cleaned,
        metadata: { hasXMLTags: true }
      }
    }

    // Retornar conteúdo original
    return { isStructured: false, displayContent: content }
  }
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
  const [isRecordingMode, setIsRecordingMode] = useState(false)
  const [liveMessages, setLiveMessages] = useState<any[]>([]) // Mensagens da sessão atual (HTTP)
  const [pollingForResponse, setPollingForResponse] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll para a última mensagem quando houver novas mensagens
  useEffect(() => {
    if (conversation && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [conversation?.messages.length, liveMessages.length])

  // Limpar mensagens HTTP ao trocar de conversa
  useEffect(() => {
    setLiveMessages([])
  }, [session_id])

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

  // Buscar novas mensagens do banco (para capturar respostas do agente)
  const fetchNewMessages = async (sessionId: string, afterTimestamp: string) => {
    const { data: newMessages } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .gt('timestamp', afterTimestamp)
      .order('timestamp', { ascending: true })

    if (newMessages && newMessages.length > 0) {
      console.log('🔄 Novas mensagens encontradas no banco:', newMessages.length)

      // Adicionar apenas mensagens que não estão em liveMessages
      const existingContents = new Set(
        liveMessages.map(m => `${m.id}-${m.message?.content}`)
      )

      const newMessagesToAdd = newMessages.filter(msg =>
        !existingContents.has(`${msg.id}-${msg.message?.content}`)
      )

      if (newMessagesToAdd.length > 0) {
        setLiveMessages(prev => [...prev, ...newMessagesToAdd])
      }
    }

    return newMessages || []
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
          messageType: selectedFile
            ? (selectedFile.type.startsWith('image/')
              ? 'image'
              : selectedFile.type.startsWith('audio/')
                ? 'audio'
                : selectedFile.type.startsWith('video/')
                  ? 'video'
                  : 'document')
            : 'text',
          mediaUrl,
          clientName: conversation?.clientName || session_id
        })
      })

      const data = await response.json()

      if (response.ok) {
        const sendTimestamp = new Date().toISOString()

        // Adicionar mensagens da resposta HTTP (são as mensagens da sessão atual)
        if (data.messages && data.messages.length > 0) {
          setLiveMessages(prev => [...prev, ...data.messages])
        }

        setFeedback({ type: 'success', text: selectedFile ? 'Arquivo enviado com sucesso!' : 'Mensagem enviada com sucesso!' })
        setMessage('')
        handleRemoveFile()

        // Fazer polling para capturar resposta do agente
        setPollingForResponse(true)
        let pollCount = 0
        const maxPolls = 10 // Tentar 10 vezes (10 segundos)

        const pollInterval = setInterval(async () => {
          pollCount++
          console.log(`🔄 Polling ${pollCount}/${maxPolls} para novas mensagens...`)

          const newMessages = await fetchNewMessages(session_id, sendTimestamp)

          // Parar polling se encontrou resposta do agente ou atingiu máximo
          const hasAgentResponse = newMessages.some(m => m.message?.type === 'ai' && m.message?.content !== message)

          if (hasAgentResponse || pollCount >= maxPolls) {
            clearInterval(pollInterval)
            setPollingForResponse(false)
            console.log(hasAgentResponse ? '✅ Resposta do agente capturada!' : '⏱️ Timeout de polling')
          }
        }, 1000)

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
        const sendTimestamp = new Date().toISOString()

        // Adicionar mensagens da resposta HTTP (são as mensagens da sessão atual)
        if (data.messages && data.messages.length > 0) {
          setLiveMessages(prev => [...prev, ...data.messages])
        }

        setFeedback({ type: 'success', text: 'Áudio enviado com sucesso!' })
        setIsRecordingMode(false)

        // Fazer polling para capturar resposta do agente
        setPollingForResponse(true)
        let pollCount = 0
        const maxPolls = 10

        const pollInterval = setInterval(async () => {
          pollCount++
          const newMessages = await fetchNewMessages(session_id, sendTimestamp)
          const hasAgentResponse = newMessages.some(m => m.message?.type === 'ai')

          if (hasAgentResponse || pollCount >= maxPolls) {
            clearInterval(pollInterval)
            setPollingForResponse(false)
          }
        }, 1000)

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
  // Filtrar mensagens de ferramentas e mensagens internas (independente do tipo)
  const filteredMessages = conversation.visibleMessages ||
    conversation.messages.filter(m => {
      const content = m.message?.content
      return !isToolMessage(content) && !isInternalProcessingMessage(content)
    })

  // Priorizar mensagens HTTP (da sessão atual) sobre mensagens do banco
  // Combinar mensagens do banco (histórico) com mensagens HTTP (sessão atual)
  const dbMessageContents = new Set(
    filteredMessages.map(m => `${m.message?.content}-${m.message?.type}`)
  )

  const liveMessagesToShow = liveMessages.filter(m =>
    !dbMessageContents.has(`${m.message?.content}-${m.message?.type}`)
  )

  const messagesToShow = [...filteredMessages, ...liveMessagesToShow]

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

          // Parsear mensagem estruturada se for do agente
          const parsedMessage = !isHuman ? parseAgentMessage(chat.message.content) : null

          // Se a mensagem parseada está vazia (intenções, categorias), não renderizar nada
          if (parsedMessage && !parsedMessage.displayContent && !imageUrl) {
            return null
          }

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

                {/* Renderizar texto - usar conteúdo parseado se for mensagem estruturada do agente */}
                {chat.message.content && !isImageFilename && (
                  <p className="text-sm whitespace-pre-wrap">
                    {parsedMessage ? parsedMessage.displayContent : chat.message.content}
                  </p>
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

        {/* Modo de gravação de áudio */}
        {isRecordingMode ? (
          <AudioRecorder
            onSendAudio={handleSendAudio}
            onCancel={() => setIsRecordingMode(false)}
            disabled={sending}
          />
        ) : (
          <>
            {/* Preview do arquivo selecionado */}
            {selectedFile && (
              <div className="mb-3 p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg">
                <div className="flex items-center gap-3">
                  {filePreview ? (
                    <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded" />
                  ) : selectedFile.type.startsWith('audio/') ? (
                    <div className="w-16 h-16 bg-purple-500/20 rounded flex items-center justify-center">
                      <Mic size={24} className="text-purple-400" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                      <ImageIcon size={24} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-[var(--muted)]">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    {selectedFile.type.startsWith('audio/') && (
                      <audio
                        src={URL.createObjectURL(selectedFile)}
                        controls
                        className="mt-2 h-8 w-full"
                      />
                    )}
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

              <button
                onClick={() => setIsRecordingMode(true)}
                disabled={sending || !!selectedFile}
                className="p-2 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--card-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Gravar áudio"
              >
                <Mic size={18} />
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
          </>
        )}
      </div>
    </div>
  )
}
