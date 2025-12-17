export type MessageType = 'text' | 'audio' | 'image' | 'document' | 'video'

export type Stage = 'novo' | 'contato' | 'interessado' | 'negociacao' | 'fechado' | 'perdido'

/**
 * Normaliza um número de telefone brasileiro para o formato padrão
 * Remove todos os caracteres não numéricos e adiciona o código do país se necessário
 * @param phone - Número de telefone a ser normalizado
 * @returns Número normalizado no formato 5511999999999
 */
export function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')

  if (cleaned.length === 11) {
    return `55${cleaned}`
  }

  if (cleaned.length === 10) {
    return `55${cleaned.substring(0, 2)}9${cleaned.substring(2)}`
  }

  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    return cleaned
  }

  if (cleaned.length === 12 && cleaned.startsWith('55')) {
    return `55${cleaned.substring(2, 4)}9${cleaned.substring(4)}`
  }

  return cleaned
}

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
  stage?: Stage
}

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
