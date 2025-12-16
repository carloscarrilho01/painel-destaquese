'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Zap, GripVertical, Save, X, AlertCircle } from 'lucide-react'
import type { QuickMessage, QuickMessageCategory } from '@/lib/types'
import { QUICK_MESSAGE_CATEGORIES } from '@/lib/types'

interface QuickMessagesManagerProps {
  onClose?: () => void
}

export function QuickMessagesManager({ onClose }: QuickMessagesManagerProps) {
  const [messages, setMessages] = useState<QuickMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Estado do formulário
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    titulo: '',
    conteudo: '',
    categoria: '' as QuickMessageCategory | '',
    atalho: '',
  })

  useEffect(() => {
    fetchMessages()
  }, [])

  // Limpar mensagens de feedback após 3 segundos
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null)
        setError(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [success, error])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/quick-messages')
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      } else {
        setError('Erro ao carregar mensagens')
      }
    } catch (err) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ titulo: '', conteudo: '', categoria: '', atalho: '' })
    setIsEditing(false)
    setEditingId(null)
  }

  const handleEdit = (message: QuickMessage) => {
    setFormData({
      titulo: message.titulo,
      conteudo: message.conteudo,
      categoria: (message.categoria as QuickMessageCategory) || '',
      atalho: message.atalho || '',
    })
    setEditingId(message.id)
    setIsEditing(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const payload = {
        ...formData,
        categoria: formData.categoria || null,
        atalho: formData.atalho || null,
        ...(editingId && { id: editingId }),
      }

      const response = await fetch('/api/quick-messages', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar')
      }

      setSuccess(editingId ? 'Mensagem atualizada!' : 'Mensagem criada!')
      resetForm()
      fetchMessages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta mensagem rápida?')) return

    try {
      const response = await fetch(`/api/quick-messages?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao excluir')
      }

      setSuccess('Mensagem excluída!')
      fetchMessages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir')
    }
  }

  const getCategoryLabel = (value: string | null) => {
    if (!value) return 'Sem categoria'
    return QUICK_MESSAGE_CATEGORIES.find(c => c.value === value)?.label || value
  }

  const getCategoryColor = (value: string | null) => {
    switch (value) {
      case 'saudacao': return 'bg-green-500/20 text-green-400'
      case 'vendas': return 'bg-blue-500/20 text-blue-400'
      case 'suporte': return 'bg-yellow-500/20 text-yellow-400'
      case 'encerramento': return 'bg-purple-500/20 text-purple-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-[var(--primary)]" />
          <h2 className="font-semibold">Mensagens Rápidas</h2>
          <span className="text-sm text-[var(--muted)]">({messages.length})</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-[var(--card-hover)] rounded">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Feedback */}
      {(error || success) && (
        <div className={`mx-4 mt-4 p-3 rounded-lg flex items-center gap-2 ${
          error
            ? 'bg-red-500/10 text-red-500 border border-red-500/30'
            : 'bg-green-500/10 text-green-500 border border-green-500/30'
        }`}>
          <AlertCircle size={16} />
          {error || success}
        </div>
      )}

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="p-4 border-b border-[var(--border)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ex: Saudação inicial"
              required
              className="w-full px-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Categoria</label>
            <select
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value as QuickMessageCategory | '' })}
              className="w-full px-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="">Selecione...</option>
              {QUICK_MESSAGE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Conteúdo <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.conteudo}
              onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
              placeholder="Olá {nome}, tudo bem? Como posso ajudar você hoje?"
              required
              rows={3}
              className="w-full px-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
            />
            <p className="text-xs text-[var(--muted)] mt-1">
              Use <code className="bg-[var(--background)] px-1 rounded">{'{nome}'}</code> para nome do cliente,{' '}
              <code className="bg-[var(--background)] px-1 rounded">{'{data}'}</code> para data atual,{' '}
              <code className="bg-[var(--background)] px-1 rounded">{'{hora}'}</code> para hora atual
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Atalho (opcional)</label>
            <input
              type="text"
              value={formData.atalho}
              onChange={(e) => setFormData({ ...formData, atalho: e.target.value })}
              placeholder="Ex: /oi"
              className="w-full px-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            <p className="text-xs text-[var(--muted)] mt-1">
              Digite no chat para usar rapidamente
            </p>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={saving || !formData.titulo || !formData.conteudo}
              className="flex-1 bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>Salvando...</>
              ) : editingId ? (
                <>
                  <Save size={16} />
                  Atualizar
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Adicionar
                </>
              )}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--card-hover)] transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Lista de mensagens */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-[var(--muted)]">
            Carregando mensagens...
          </div>
        ) : messages.length === 0 ? (
          <div className="p-8 text-center text-[var(--muted)]">
            <Zap size={32} className="mx-auto mb-2 opacity-50" />
            <p>Nenhuma mensagem rápida cadastrada</p>
            <p className="text-sm mt-1">Crie sua primeira mensagem usando o formulário acima</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {messages.map((message) => (
              <div
                key={message.id}
                className="p-4 hover:bg-[var(--card-hover)] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="text-[var(--muted)] cursor-grab">
                    <GripVertical size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{message.titulo}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(message.categoria)}`}>
                        {getCategoryLabel(message.categoria)}
                      </span>
                      {message.atalho && (
                        <code className="text-xs bg-[var(--background)] px-1.5 py-0.5 rounded text-[var(--muted)]">
                          {message.atalho}
                        </code>
                      )}
                    </div>
                    <p className="text-sm text-[var(--muted)] mt-1 line-clamp-2">
                      {message.conteudo}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(message)}
                      className="p-2 hover:bg-[var(--background)] rounded transition-colors text-[var(--muted)] hover:text-[var(--foreground)]"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(message.id)}
                      className="p-2 hover:bg-red-500/10 rounded transition-colors text-[var(--muted)] hover:text-red-500"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer com dicas */}
      <div className="p-4 border-t border-[var(--border)] bg-[var(--background)]">
        <div className="text-xs text-[var(--muted)] space-y-1">
          <p><strong>Dicas:</strong></p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>As primeiras 4 mensagens aparecem como botões rápidos no chat</li>
            <li>Use atalhos como <code className="bg-[var(--card)] px-1 rounded">/oi</code> para acesso ainda mais rápido</li>
            <li>Variáveis são substituídas automaticamente ao enviar</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
