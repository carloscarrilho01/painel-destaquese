/**
 * Cliente da API Dinasti (Evolution API)
 *
 * Fornece métodos para interagir com a API de WhatsApp
 * de forma otimizada e tipada.
 */

// Tipos de dados
export interface DinastiMessage {
  id: string
  key: {
    remoteJid: string
    fromMe: boolean
    id: string
  }
  message?: {
    conversation?: string
    extendedTextMessage?: {
      text: string
    }
    imageMessage?: {
      caption?: string
      url?: string
      mimetype?: string
    }
    audioMessage?: {
      url?: string
      mimetype?: string
    }
    videoMessage?: {
      caption?: string
      url?: string
      mimetype?: string
    }
    documentMessage?: {
      caption?: string
      url?: string
      mimetype?: string
      fileName?: string
    }
  }
  messageTimestamp: number
  pushName?: string
  status?: string
}

export interface DinastiChat {
  id: string
  name?: string
  lastMessageTime?: number
  unreadCount?: number
  archived?: boolean
  pinned?: boolean
  messages?: DinastiMessage[]
  conversationTimestamp?: number
}

export interface SendMessagePayload {
  phone: string
  message?: string
  image?: string
  audio?: string
  video?: string
  document?: string
  caption?: string
}

export interface DinastiContact {
  id: string
  name?: string
  pushname?: string
  profilePicUrl?: string
}

// Configuração da API
const DINASTI_API_URL = process.env.DINASTI_API_URL || 'https://dinastiapi.destaquese.uk'
const DINASTI_API_TOKEN = process.env.DINASTI_API_TOKEN || ''
const DINASTI_INSTANCE = process.env.DINASTI_INSTANCE_NAME || ''

/**
 * Cliente da API Dinasti
 */
export class DinastiClient {
  private baseUrl: string
  private token: string
  private instance: string

  constructor(baseUrl?: string, token?: string, instance?: string) {
    // A DinastiAPI não usa /api no caminho base
    const base = baseUrl || DINASTI_API_URL
    // Remove /api se existir, pois a DinastiAPI não usa esse prefixo
    this.baseUrl = base.endsWith('/api') ? base.slice(0, -4) : base
    this.token = token || DINASTI_API_TOKEN
    this.instance = instance || DINASTI_INSTANCE

    if (!this.token) {
      console.warn('⚠️ DINASTI_API_TOKEN não configurado!')
    }
    if (!this.instance) {
      console.warn('⚠️ DINASTI_INSTANCE_NAME não configurado!')
    }
  }

  /**
   * Faz requisição para a API
   */
  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'token': this.token,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API Dinasti Error [${response.status}]: ${error}`)
    }

    return response.json()
  }

  /**
   * Lista todas as conversas ativas
   * Endpoint comum em APIs Evolution: GET /chat/findChats/{instance}
   */
  async findChats(): Promise<DinastiChat[]> {
    try {
      const response = await this.fetch<{ data?: DinastiChat[] }>(
        `/chat/findChats/${this.instance}`
      )
      return response.data || []
    } catch (error) {
      console.error('Erro ao buscar chats:', error)
      return []
    }
  }

  /**
   * Busca mensagens de uma conversa específica
   * Endpoint comum: GET /chat/findMessages/{instance}?jid={phone}
   */
  async findMessages(
    phone: string,
    limit: number = 50,
    before?: number
  ): Promise<DinastiMessage[]> {
    try {
      const params = new URLSearchParams({
        jid: phone.includes('@') ? phone : `${phone}@s.whatsapp.net`,
        limit: limit.toString(),
      })

      if (before) {
        params.append('before', before.toString())
      }

      const response = await this.fetch<{ data?: DinastiMessage[] }>(
        `/chat/findMessages/${this.instance}?${params}`
      )

      return response.data || []
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error)
      return []
    }
  }

  /**
   * Envia mensagem de texto
   * Endpoint: POST /chat/send/text
   */
  async sendText(phone: string, text: string): Promise<any> {
    const payload = {
      Phone: phone,
      Body: text,
    }

    return this.fetch(`/chat/send/text`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  /**
   * Envia mensagem com mídia
   * Endpoints: POST /chat/send/image, /chat/send/audio, /chat/send/video, /chat/send/document
   */
  async sendMedia(payload: SendMessagePayload): Promise<any> {
    const phone = payload.phone

    // Determina o tipo de mídia
    if (payload.image) {
      return this.fetch(`/chat/send/image`, {
        method: 'POST',
        body: JSON.stringify({
          Phone: phone,
          Image: payload.image,
          Caption: payload.caption || payload.message || '',
        }),
      })
    }

    if (payload.audio) {
      return this.fetch(`/chat/send/audio`, {
        method: 'POST',
        body: JSON.stringify({
          Phone: phone,
          Audio: payload.audio,
        }),
      })
    }

    if (payload.video) {
      return this.fetch(`/chat/send/video`, {
        method: 'POST',
        body: JSON.stringify({
          Phone: phone,
          Video: payload.video,
          Caption: payload.caption || payload.message || '',
        }),
      })
    }

    if (payload.document) {
      return this.fetch(`/chat/send/document`, {
        method: 'POST',
        body: JSON.stringify({
          Phone: phone,
          Document: payload.document,
          Caption: payload.caption || payload.message || '',
        }),
      })
    }

    // Se não houver mídia, envia texto
    if (payload.message) {
      return this.sendText(payload.phone, payload.message)
    }

    throw new Error('Nenhum conteúdo fornecido para envio')
  }

  /**
   * Busca informações de um contato
   */
  async getContact(phone: string): Promise<DinastiContact | null> {
    try {
      const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`

      const response = await this.fetch<{ data?: DinastiContact }>(
        `/chat/findContact/${this.instance}?jid=${jid}`
      )

      return response.data || null
    } catch (error) {
      console.error('Erro ao buscar contato:', error)
      return null
    }
  }

  /**
   * Verifica status da sessão/instância
   * Endpoint: GET /session/status
   */
  async getInstanceStatus(): Promise<any> {
    try {
      return await this.fetch(`/session/status`)
    } catch (error) {
      console.error('Erro ao verificar status:', error)
      return { connected: false, loggedIn: false }
    }
  }

  /**
   * Marca mensagem como lida
   * Endpoint: POST /chat/markread
   */
  async markAsRead(phone: string, messageId?: string): Promise<void> {
    try {
      await this.fetch(`/chat/markread`, {
        method: 'POST',
        body: JSON.stringify({
          Phone: phone,
        }),
      })
    } catch (error) {
      console.error('Erro ao marcar como lida:', error)
    }
  }

  /**
   * Busca presença (online/offline) de um contato
   */
  async getPresence(phone: string): Promise<any> {
    try {
      const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`

      return await this.fetch(`/chat/presence/${this.instance}?jid=${jid}`)
    } catch (error) {
      console.error('Erro ao buscar presença:', error)
      return null
    }
  }
}

// Exporta instância singleton
export const dinastiClient = new DinastiClient()

// Utilitários

/**
 * Extrai texto de uma mensagem Dinasti
 */
export function extractMessageText(msg: DinastiMessage): string {
  if (!msg.message) return ''

  if (msg.message.conversation) {
    return msg.message.conversation
  }

  if (msg.message.extendedTextMessage?.text) {
    return msg.message.extendedTextMessage.text
  }

  if (msg.message.imageMessage?.caption) {
    return msg.message.imageMessage.caption
  }

  if (msg.message.videoMessage?.caption) {
    return msg.message.videoMessage.caption
  }

  if (msg.message.documentMessage?.caption) {
    return msg.message.documentMessage.caption
  }

  return ''
}

/**
 * Extrai URL de mídia de uma mensagem
 */
export function extractMediaUrl(msg: DinastiMessage): string | null {
  if (!msg.message) return null

  if (msg.message.imageMessage?.url) {
    return msg.message.imageMessage.url
  }

  if (msg.message.audioMessage?.url) {
    return msg.message.audioMessage.url
  }

  if (msg.message.videoMessage?.url) {
    return msg.message.videoMessage.url
  }

  if (msg.message.documentMessage?.url) {
    return msg.message.documentMessage.url
  }

  return null
}

/**
 * Normaliza número de telefone
 */
export function normalizePhone(phone: string): string {
  // Remove caracteres não numéricos
  let cleaned = phone.replace(/\D/g, '')

  // Adiciona código do país se não tiver
  if (!cleaned.startsWith('55') && cleaned.length === 11) {
    cleaned = '55' + cleaned
  }

  return cleaned
}

/**
 * Formata número de telefone para JID do WhatsApp
 */
export function toWhatsAppJid(phone: string): string {
  const normalized = normalizePhone(phone)
  return normalized.includes('@') ? normalized : `${normalized}@s.whatsapp.net`
}
