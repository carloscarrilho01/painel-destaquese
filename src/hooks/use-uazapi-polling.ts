import { useEffect, useRef, useState } from 'react'
import type { Conversation } from '@/lib/types'

/**
 * Hook para polling de conversas da API Uazapi
 *
 * Este hook substitui o sistema antigo de Realtime/Polling do Supabase
 * por uma solução mais eficiente que busca conversas ativas direto
 * da API do WhatsApp.
 *
 * Vantagens:
 * - Dados sempre atualizados (direto do WhatsApp)
 * - Mais rápido (não processa histórico completo)
 * - Reduz carga no banco de dados
 * - Polling inteligente (apenas quando necessário)
 */

export interface UseUazapiPollingOptions {
  /**
   * Intervalo de polling em milissegundos
   * @default 5000 (5 segundos)
   */
  interval?: number

  /**
   * Se deve fazer polling automaticamente
   * @default true
   */
  enabled?: boolean

  /**
   * Callback quando conversas são atualizadas
   */
  onUpdate?: (conversations: Conversation[]) => void

  /**
   * Callback quando ocorre um erro
   */
  onError?: (error: Error) => void

  /**
   * Se deve fazer fetch inicial
   * @default true
   */
  fetchOnMount?: boolean
}

export interface UseUazapiPollingReturn {
  conversations: Conversation[]
  isLoading: boolean
  error: Error | null
  lastUpdate: Date | null
  fetchTime: number
  refresh: () => Promise<void>
  startPolling: () => void
  stopPolling: () => void
  isPolling: boolean
}

/**
 * Hook para polling de conversas da API Uazapi
 */
export function useUazapiPolling(
  options: UseUazapiPollingOptions = {}
): UseUazapiPollingReturn {
  const {
    interval = 5000,
    enabled = true,
    onUpdate,
    onError,
    fetchOnMount = true,
  } = options

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [fetchTime, setFetchTime] = useState(0)
  const [isPolling, setIsPolling] = useState(false)

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  /**
   * Busca conversas da API
   */
  const fetchConversations = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/active-conversations')

      if (!response.ok) {
        throw new Error(`Erro ao buscar conversas: ${response.statusText}`)
      }

      const data = await response.json()

      if (!isMountedRef.current) return

      setConversations(data.conversations || [])
      setLastUpdate(new Date())
      setFetchTime(data.totalTime || 0)

      onUpdate?.(data.conversations || [])
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido')

      if (!isMountedRef.current) return

      setError(error)
      onError?.(error)

      console.error('❌ [Uazapi Polling] Erro ao buscar conversas:', error)
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }

  /**
   * Inicia polling
   */
  const startPolling = () => {
    if (pollingIntervalRef.current) {
      return // Já está fazendo polling
    }

    console.log(`🔄 [Uazapi Polling] Iniciando polling (${interval}ms)`)

    setIsPolling(true)

    pollingIntervalRef.current = setInterval(() => {
      fetchConversations()
    }, interval)
  }

  /**
   * Para polling
   */
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      console.log('⏸️ [Uazapi Polling] Parando polling')

      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
      setIsPolling(false)
    }
  }

  /**
   * Refresh manual
   */
  const refresh = async () => {
    console.log('🔄 [Uazapi Polling] Refresh manual')
    await fetchConversations()
  }

  // Fetch inicial
  useEffect(() => {
    isMountedRef.current = true

    if (fetchOnMount) {
      fetchConversations()
    }

    return () => {
      isMountedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Controla polling baseado em enabled
  useEffect(() => {
    if (enabled) {
      startPolling()
    } else {
      stopPolling()
    }

    return () => {
      stopPolling()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, interval])

  return {
    conversations,
    isLoading,
    error,
    lastUpdate,
    fetchTime,
    refresh,
    startPolling,
    stopPolling,
    isPolling,
  }
}

/**
 * Hook para visibilidade da página (pausa polling quando usuário sai)
 */
export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return isVisible
}

/**
 * Hook combinado: polling inteligente que pausa quando usuário sai
 */
export function useSmartUazapiPolling(
  options: UseUazapiPollingOptions = {}
): UseUazapiPollingReturn {
  const isPageVisible = usePageVisibility()

  const polling = useUazapiPolling({
    ...options,
    enabled: options.enabled !== false && isPageVisible,
  })

  useEffect(() => {
    if (isPageVisible) {
      console.log('👁️ [Smart Polling] Página visível - retomando polling')
      polling.refresh() // Refresh imediato quando volta
    } else {
      console.log('👁️ [Smart Polling] Página oculta - pausando polling')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPageVisible])

  return polling
}
