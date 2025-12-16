export type MessageType = 'text' | 'audio' | 'image' | 'document' | 'video'

export type ChatMessage = {
  id: number
  session_id: string
  media_url?: string | null
  message: {
    type: string
    content: string
    additional_kwargs?: {
      image?: string
      [key: string]: unknown
    }
  }
}

export type Lead = {
  id: string
  telefone: string
  nome: string | null
  trava: boolean
  created_at: string
  followup: number
  last_followup: string | null
  interesse: string | null
  interessado: boolean
  stage?: 'novo' | 'contato' | 'interessado' | 'negociacao' | 'fechado' | 'perdido'
}

export type QuickMessage = {
  id: string
  titulo: string
  conteudo: string
  categoria: string | null
  atalho: string | null
  ordem: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export type QuickMessageCategory = 'saudacao' | 'vendas' | 'suporte' | 'encerramento' | 'outros'

export const QUICK_MESSAGE_CATEGORIES: { value: QuickMessageCategory; label: string }[] = [
  { value: 'saudacao', label: 'Saudação' },
  { value: 'vendas', label: 'Vendas' },
  { value: 'suporte', label: 'Suporte' },
  { value: 'encerramento', label: 'Encerramento' },
  { value: 'outros', label: 'Outros' },
]

export type Conversation = {
  session_id: string
  clientName?: string
  messages: ChatMessage[]
  visibleMessages?: ChatMessage[]
  messageCount: number
  lastMessage: string
  lastType: string
  lead?: Lead
}
