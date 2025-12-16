'use client'

import { useState, useEffect, useRef } from 'react'
import { Zap, ChevronDown, Search, X } from 'lucide-react'
import type { QuickMessage } from '@/lib/types'
import { QUICK_MESSAGE_CATEGORIES } from '@/lib/types'

interface QuickMessagesSelectorProps {
  onSelect: (message: string) => void
  clientName?: string
  disabled?: boolean
}

export function QuickMessagesSelector({ onSelect, clientName, disabled }: QuickMessagesSelectorProps) {
  const [messages, setMessages] = useState<QuickMessage[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
  }, [])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/quick-messages')
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens rápidas:', error)
    } finally {
      setLoading(false)
    }
  }

  // Substituir variáveis dinâmicas no conteúdo
  const processContent = (content: string): string => {
    let processed = content

    // Substituir {nome} pelo nome do cliente
    if (clientName) {
      processed = processed.replace(/\{nome\}/gi, clientName)
    } else {
      processed = processed.replace(/\{nome\}/gi, 'Cliente')
    }

    // Substituir {data} pela data atual
    const hoje = new Date().toLocaleDateString('pt-BR')
    processed = processed.replace(/\{data\}/gi, hoje)

    // Substituir {hora} pela hora atual
    const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    processed = processed.replace(/\{hora\}/gi, agora)

    return processed
  }

  const handleSelect = (message: QuickMessage) => {
    const processedContent = processContent(message.conteudo)
    onSelect(processedContent)
    setIsOpen(false)
    setSearch('')
    setSelectedCategory(null)
  }

  // Filtrar mensagens por busca e categoria
  const filteredMessages = messages.filter(msg => {
    const matchesSearch = search === '' ||
      msg.titulo.toLowerCase().includes(search.toLowerCase()) ||
      msg.conteudo.toLowerCase().includes(search.toLowerCase()) ||
      (msg.atalho && msg.atalho.toLowerCase().includes(search.toLowerCase()))

    const matchesCategory = selectedCategory === null || msg.categoria === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Agrupar por categoria
  const groupedMessages = filteredMessages.reduce((acc, msg) => {
    const cat = msg.categoria || 'outros'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(msg)
    return acc
  }, {} as Record<string, QuickMessage[]>)

  // Mensagens mais usadas (primeiras 4)
  const quickAccessMessages = messages.slice(0, 4)

  const getCategoryLabel = (value: string) => {
    return QUICK_MESSAGE_CATEGORIES.find(c => c.value === value)?.label || value
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botões de acesso rápido */}
      <div className="flex items-center gap-2 flex-wrap">
        {quickAccessMessages.map((msg) => (
          <button
            key={msg.id}
            onClick={() => handleSelect(msg)}
            disabled={disabled}
            className="px-3 py-1.5 text-xs bg-[var(--primary)]/10 text-[var(--primary)] rounded-full hover:bg-[var(--primary)]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            title={msg.conteudo}
          >
            <Zap size={12} />
            {msg.titulo}
          </button>
        ))}

        {/* Botão para ver mais */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled || loading}
          className="px-3 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-full hover:bg-[var(--card-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <Zap size={12} />
          {messages.length > 4 ? `+${messages.length - 4} mais` : 'Mensagens Rápidas'}
          <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown expandido */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-96 max-h-96 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Header com busca */}
          <div className="p-3 border-b border-[var(--border)]">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="text"
                placeholder="Buscar mensagem ou atalho..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filtros por categoria */}
            <div className="flex gap-1 mt-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-2 py-1 text-xs rounded ${
                  selectedCategory === null
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                Todas
              </button>
              {QUICK_MESSAGE_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-2 py-1 text-xs rounded ${
                    selectedCategory === cat.value
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de mensagens */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-[var(--muted)]">
                Carregando...
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-4 text-center text-[var(--muted)]">
                {messages.length === 0
                  ? 'Nenhuma mensagem rápida cadastrada'
                  : 'Nenhuma mensagem encontrada'}
              </div>
            ) : (
              Object.entries(groupedMessages).map(([categoria, msgs]) => (
                <div key={categoria}>
                  <div className="px-3 py-2 text-xs font-semibold text-[var(--muted)] bg-[var(--background)] sticky top-0">
                    {getCategoryLabel(categoria)}
                  </div>
                  {msgs.map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => handleSelect(msg)}
                      className="w-full px-3 py-2 text-left hover:bg-[var(--card-hover)] transition-colors border-b border-[var(--border)] last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{msg.titulo}</span>
                        {msg.atalho && (
                          <code className="text-xs bg-[var(--background)] px-1.5 py-0.5 rounded text-[var(--muted)]">
                            {msg.atalho}
                          </code>
                        )}
                      </div>
                      <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">
                        {processContent(msg.conteudo)}
                      </p>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Footer com dica */}
          <div className="p-2 border-t border-[var(--border)] bg-[var(--background)]">
            <p className="text-xs text-[var(--muted)] text-center">
              Dica: Use <code className="bg-[var(--card)] px-1 rounded">{'{nome}'}</code> para inserir o nome do cliente
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
