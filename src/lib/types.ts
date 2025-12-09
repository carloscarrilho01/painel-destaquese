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
