'use client'

import { useState } from 'react'
import { X, Loader2, UserPlus } from 'lucide-react'

interface AddLeadModalProps {
  isOpen: boolean
  onClose: () => void
  onLeadAdded: () => void
}

type Stage = 'novo' | 'contato' | 'interessado' | 'negociacao' | 'fechado' | 'perdido'

export function AddLeadModal({ isOpen, onClose, onLeadAdded }: AddLeadModalProps) {
  const [formData, setFormData] = useState({
    telefone: '',
    nome: '',
    interesse: '',
    stage: 'novo' as Stage
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

    try {
      const response = await fetch('/api/add-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telefone: formData.telefone.trim(),
          nome: formData.nome.trim() || null,
          interesse: formData.interesse.trim() || null,
          stage: formData.stage
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Limpar formulário
        setFormData({
          telefone: '',
          nome: '',
          interesse: '',
          stage: 'novo'
        })

        // Fechar modal
        onClose()

        // Notificar componente pai para atualizar lista
        onLeadAdded()
      } else {
        setError(data.error || 'Erro ao adicionar lead')
      }
    } catch (error) {
      console.error('Erro ao adicionar lead:', error)
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
            <UserPlus className="text-[var(--primary)]" size={24} />
            <h2 className="text-xl font-bold">Adicionar Novo Lead</h2>
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
              Telefone <span className="text-red-500">*</span>
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

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Nome
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => handleChange('nome', e.target.value)}
              placeholder="João Silva"
              disabled={loading}
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-50"
            />
          </div>

          {/* Interesse */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Interesse / Produto
            </label>
            <textarea
              value={formData.interesse}
              onChange={(e) => handleChange('interesse', e.target.value)}
              placeholder="Descrição do interesse ou produto..."
              rows={3}
              disabled={loading}
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-50 resize-none"
            />
          </div>

          {/* Stage */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Estágio Inicial
            </label>
            <select
              value={formData.stage}
              onChange={(e) => handleChange('stage', e.target.value)}
              disabled={loading}
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-50"
            >
              <option value="novo">Novo Lead</option>
              <option value="contato">Em Contato</option>
              <option value="interessado">Interessado</option>
              <option value="negociacao">Negociação</option>
              <option value="fechado">Fechado</option>
              <option value="perdido">Perdido</option>
            </select>
          </div>

          {/* Error */}
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
                  <span>Adicionando...</span>
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>Adicionar Lead</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
