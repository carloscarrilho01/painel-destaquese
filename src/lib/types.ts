export type ChatMessage = {
  id: number
  session_id: string
  message: {
    type: string
    content: string
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
}

export type Conversation = {
  session_id: string
  clientName?: string
  messages: ChatMessage[]
  visibleMessages?: ChatMessage[]
  messageCount: number
  lastMessage: string
  lastType: string
  lead?: Lead | null
}

export type MessageType = 'text' | 'audio' | 'image' | 'document' | 'video'

export type SendMessagePayload = {
  phone: string
  messageType: MessageType
  message?: string
  mediaUrl?: string
  clientName?: string
  timestamp?: string
  source?: string
}
