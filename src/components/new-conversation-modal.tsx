'use client'

import { useState } from 'react'
import { X, Loader2, MessageSquarePlus, Send } from 'lucide-react'

interface NewConversationModalProps {
  isOpen: boolean
  onClose: () => void
  onConversationCreated: (sessionId: string) => void
}

export function NewConversationModal({ isOpen, onClose, onConversationCreated }: NewConversationModalProps) {
  const [formData, setFormData] = useState({
    telefone: '',
    mensagem: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validação básica
    if (!formData.telefone.trim()) {
      setError('Telefone é obrigatório')
      setLoading(false)
      return
    }

    if (!formData.mensagem.trim()) {
      setError('Mensagem é obrigatória')
      setLoading(false)
      return
    }

    try {
      // Normalizar telefone
      const telefoneNormalizado = formData.telefone.replace(/\D/g, '')

      // Enviar mensagem via API
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: telefoneNormalizado,
          message: formData.mensagem.trim(),
          clientName: telefoneNormalizado
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Limpar formulário
        setFormData({
          telefone: '',
          mensagem: ''
        })

        // Fechar modal
        onClose()

        // Notificar componente pai para criar/selecionar conversa
        onConversationCreated(telefoneNormalizado)
      } else {
        setError(data.error || 'Erro ao enviar mensagem')
      }
    } catch (error) {
      console.error('Erro ao iniciar conversa:', error)
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const formatPhoneInput = (value: string) => {
    // Remover tudo que não é número
    const numbers = value.replace(/\D/g, '')

    // Formatar enquanto digita
    if (numbers.length <= 2) {
      return numbers
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    } else if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
    } else {
      return `+${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(4, 9)}-${numbers.slice(9, 13)}`
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-md w-full border border-[var(--border)]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="text-[var(--primary)]" size={24} />
            <h2 className="text-xl font-bold">Nova Conversa</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Telefone do Cliente <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formatPhoneInput(formData.telefone)}
              onChange={(e) => handleChange('telefone', e.target.value)}
              placeholder="(11) 99999-9999"
              disabled={loading}
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-50"
            />
            <p className="text-xs text-[var(--muted)] mt-1">
              Digite com DDD. Ex: (11) 99999-9999 ou +55 (11) 99999-9999
            </p>
          </div>

          {/* Mensagem */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Mensagem Inicial <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.mensagem}
              onChange={(e) => handleChange('mensagem', e.target.value)}
              placeholder="Digite sua mensagem..."
              rows={5}
              disabled={loading}
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-50 resize-none"
            />
            <p className="text-xs text-[var(--muted)] mt-1">
              Esta será a primeira mensagem enviada para o cliente
            </p>
          </div>

          {/* Erro */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--card-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Enviar e Iniciar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
