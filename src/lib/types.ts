export type ChatMessage = {
  id: number
  session_id: string
  message: {
    type: string
    content: string
  }
}

export type Conversation = {
  session_id: string
  clientName?: string
  messages: ChatMessage[]
  visibleMessages?: ChatMessage[]
  messageCount: number
  lastMessage: string
  lastType: string
}

export type MessageType = 'text' | 'audio' | 'image' | 'document'

export type SendMessagePayload = {
  phone: string
  messageType: MessageType
  message?: string
  mediaUrl?: string
  clientName?: string
  timestamp?: string
  source?: string
}
