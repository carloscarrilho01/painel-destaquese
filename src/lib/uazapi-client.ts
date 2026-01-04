/**
 * Cliente da API Uazapi (WhatsApp API)
 *
 * Fornece métodos para interagir com a API de WhatsApp
 * de forma otimizada e tipada.
 */

// Tipos de dados
export interface UazapiMessage {
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

export interface UazapiChat {
  id: string
  name?: string
  lastMessageTime?: number
  unreadCount?: number
  archived?: boolean
  pinned?: boolean
  messages?: UazapiMessage[]
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

export interface UazapiContact {
  id: string
  name?: string
  pushname?: string
  profilePicUrl?: string
}

// Configuração da API
const UAZAPI_URL = process.env.UAZAPI_URL || 'https://free.uazapi.com'
const UAZAPI_TOKEN = process.env.UAZAPI_TOKEN || ''

/**
 * Cliente da API Uazapi
 */
export class UazapiClient {
  private baseUrl: string
  private token: string

  constructor(baseUrl?: string, token?: string) {
    this.baseUrl = baseUrl || UAZAPI_URL
    this.token = token || UAZAPI_TOKEN

    if (!this.token) {
      console.warn('⚠️ UAZAPI_TOKEN não configurado!')
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
        'Authorization': `Bearer ${this.token}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API Uazapi Error [${response.status}]: ${error}`)
    }

    return response.json()
  }

  /**
   * Lista todas as conversas ativas
   * Endpoint: GET /chat/list
   */
  async findChats(): Promise<UazapiChat[]> {
    try {
      const response = await this.fetch<{ data?: UazapiChat[] }>(
        `/chat/list`
      )
      return response.data || []
    } catch (error) {
      console.error('Erro ao buscar chats:', error)
      return []
    }
  }

  /**
   * Busca mensagens de uma conversa específica
   * Endpoint: POST /message/find
   */
  async findMessages(
    phone: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<UazapiMessage[]> {
    try {
      // Normaliza o número para formato internacional com @s.whatsapp.net
      const chatid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`

      const response = await this.fetch<{ data?: UazapiMessage[] }>(
        `/message/find`,
        {
          method: 'POST',
          body: JSON.stringify({
            chatid,
            limit,
            offset,
          }),
        }
      )

      return response.data || []
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error)
      return []
    }
  }

  /**
   * Envia mensagem de texto
   * Endpoint: POST /send/text
   */
  async sendText(phone: string, text: string): Promise<any> {
    const payload = {
      number: normalizePhone(phone),
      text: text,
    }

    return this.fetch(`/send/text`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  /**
   * Envia mensagem com mídia
   * Endpoint: POST /message/sendMedia (unified endpoint)
   */
  async sendMedia(payload: SendMessagePayload): Promise<any> {
    const phone = normalizePhone(payload.phone)

    // Determina o tipo de mídia
    let mediaType: string
    let mediaUrl: string

    if (payload.image) {
      mediaType = 'image'
      mediaUrl = payload.image
    } else if (payload.audio) {
      mediaType = 'audio'
      mediaUrl = payload.audio
    } else if (payload.video) {
      mediaType = 'video'
      mediaUrl = payload.video
    } else if (payload.document) {
      mediaType = 'document'
      mediaUrl = payload.document
    } else {
      // Se não houver mídia, envia texto
      if (payload.message) {
        return this.sendText(payload.phone, payload.message)
      }
      throw new Error('Nenhum conteúdo fornecido para envio')
    }

    return this.fetch(`/message/sendMedia`, {
      method: 'POST',
      body: JSON.stringify({
        phone,
        mediaUrl,
        mediaType,
        caption: payload.caption || payload.message || '',
      }),
    })
  }

  /**
   * Busca informações de um contato
   * Nota: Endpoint não documentado na Uazapi, pode precisar de ajuste
   */
  async getContact(phone: string): Promise<UazapiContact | null> {
    try {
      // Endpoint pode variar - verificar documentação atualizada
      const response = await this.fetch<{ data?: UazapiContact }>(
        `/contact/info`,
        {
          method: 'POST',
          body: JSON.stringify({
            phone: normalizePhone(phone),
          }),
        }
      )

      return response.data || null
    } catch (error) {
      console.error('Erro ao buscar contato:', error)
      return null
    }
  }

  /**
   * Verifica status da sessão/instância
   * Endpoint: GET /instance/status
   */
  async getInstanceStatus(): Promise<any> {
    try {
      return await this.fetch(`/instance/status`)
    } catch (error) {
      console.error('Erro ao verificar status:', error)
      return { status: 'disconnected' }
    }
  }

  /**
   * Marca mensagem como lida
   * Nota: Endpoint não documentado na Uazapi, pode precisar de ajuste
   */
  async markAsRead(phone: string, messageId?: string): Promise<void> {
    try {
      // Endpoint pode variar - verificar documentação atualizada
      await this.fetch(`/message/markread`, {
        method: 'POST',
        body: JSON.stringify({
          phone: normalizePhone(phone),
          messageId,
        }),
      })
    } catch (error) {
      console.error('Erro ao marcar como lida:', error)
    }
  }

  /**
   * Busca presença (online/offline) de um contato
   * Nota: Endpoint não documentado na Uazapi, pode precisar de ajuste
   */
  async getPresence(phone: string): Promise<any> {
    try {
      return await this.fetch(`/contact/presence`, {
        method: 'POST',
        body: JSON.stringify({
          phone: normalizePhone(phone),
        }),
      })
    } catch (error) {
      console.error('Erro ao buscar presença:', error)
      return null
    }
  }

  /**
   * Obtém configuração do webhook
   * Endpoint: GET /webhook
   */
  async getWebhook(): Promise<any> {
    try {
      return await this.fetch(`/webhook`)
    } catch (error) {
      console.error('Erro ao obter webhook:', error)
      return null
    }
  }

  /**
   * Define configuração do webhook
   * Endpoint: POST /webhook
   */
  async setWebhook(webhookUrl: string): Promise<any> {
    try {
      return await this.fetch(`/webhook`, {
        method: 'POST',
        body: JSON.stringify({
          url: webhookUrl,
        }),
      })
    } catch (error) {
      console.error('Erro ao configurar webhook:', error)
      throw error
    }
  }
}

// Exporta instância singleton
export const uazapiClient = new UazapiClient()

// Utilitários

/**
 * Extrai texto de uma mensagem Uazapi
 */
export function extractMessageText(msg: UazapiMessage): string {
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
export function extractMediaUrl(msg: UazapiMessage): string | null {
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
 * Remove formatação e retorna apenas dígitos
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
