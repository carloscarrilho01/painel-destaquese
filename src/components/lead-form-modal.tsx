'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

type Lead = {
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

type LeadFormModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (lead: Partial<Lead>) => Promise<void>
  lead?: Lead | null
  mode: 'create' | 'edit'
}

export function LeadFormModal({ isOpen, onClose, onSave, lead, mode }: LeadFormModalProps) {
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    interesse: '',
    followup: 0,
    interessado: false
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  // Preencher formulário quando estiver editando
  useEffect(() => {
    if (mode === 'edit' && lead) {
      setFormData({
        nome: lead.nome || '',
        telefone: lead.telefone,
        interesse: lead.interesse || '',
        followup: lead.followup,
        interessado: lead.interessado
      })
    } else {
      setFormData({
        nome: '',
        telefone: '',
        interesse: '',
        followup: 0,
        interessado: false
      })
    }
    setError('')
  }, [lead, mode, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validação
    if (!formData.telefone.trim()) {
      setError('Telefone é obrigatório')
      return
    }

    setIsSaving(true)

    try {
      const leadData: Partial<Lead> = {
        nome: formData.nome.trim() || null,
        telefone: formData.telefone.trim(),
        interesse: formData.interesse.trim() || null,
        followup: formData.followup,
        interessado: formData.interessado
      }

      if (mode === 'edit' && lead) {
        leadData.id = lead.id
      }

      await onSave(leadData)
      onClose()
    } catch (err) {
      setError('Erro ao salvar lead. Tente novamente.')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-xl max-w-md w-full border border-[var(--border)] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <h2 className="text-xl font-bold">
            {mode === 'create' ? 'Adicionar Novo Lead' : 'Editar Lead'}
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            disabled={isSaving}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Telefone */}
          <div>
            <label htmlFor="telefone" className="block text-sm font-medium mb-2">
              Telefone *
            </label>
            <input
              id="telefone"
              type="tel"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="5511999999999"
              disabled={isSaving}
              required
            />
          </div>

          {/* Nome */}
          <div>
            <label htmlFor="nome" className="block text-sm font-medium mb-2">
              Nome
            </label>
            <input
              id="nome"
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="João Silva"
              disabled={isSaving}
            />
          </div>

          {/* Interesse */}
          <div>
            <label htmlFor="interesse" className="block text-sm font-medium mb-2">
              Interesse
            </label>
            <input
              id="interesse"
              type="text"
              value={formData.interesse}
              onChange={(e) => setFormData({ ...formData, interesse: e.target.value })}
              className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="Produto ou serviço de interesse"
              disabled={isSaving}
            />
          </div>

          {/* Pipeline/Status */}
          <div>
            <label htmlFor="followup" className="block text-sm font-medium mb-2">
              Pipeline
            </label>
            <select
              id="followup"
              value={formData.followup}
              onChange={(e) => {
                const value = parseInt(e.target.value)
                setFormData({
                  ...formData,
                  followup: value,
                  // Ajustar interessado baseado no followup
                  interessado: value >= 1 && value <= 3
                })
              }}
              className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              disabled={isSaving}
            >
              <option value={0}>Novo</option>
              <option value={1}>Contato / Interessado</option>
              <option value={2}>Negociação</option>
              <option value={3}>Ganho</option>
            </select>
          </div>

          {/* Interessado */}
          <div className="flex items-center gap-2">
            <input
              id="interessado"
              type="checkbox"
              checked={formData.interessado}
              onChange={(e) => setFormData({ ...formData, interessado: e.target.checked })}
              className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]"
              disabled={isSaving}
            />
            <label htmlFor="interessado" className="text-sm font-medium">
              Marcar como interessado
            </label>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--card-hover)] transition-colors"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSaving}
            >
              {isSaving ? 'Salvando...' : mode === 'create' ? 'Criar Lead' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
