'use client'

import { useState, useEffect } from 'react'
import { Phone, Calendar, MessageSquare, Lock, Unlock, GripVertical, Edit2, Trash2, Check, X, Link as LinkIcon, Settings, Plus } from 'lucide-react'
import type { Lead } from '@/lib/types'

type Stage = string

type StageConfig = {
  id: string
  label: string
  color: string
  bgColor: string
  isCustom?: boolean
}

const DEFAULT_STAGES: StageConfig[] = [
  { id: 'novo', label: 'Novo Lead', color: 'text-blue-500', bgColor: 'bg-blue-500/10 border-blue-500/30' },
  { id: 'contato', label: 'Em Contato', color: 'text-purple-500', bgColor: 'bg-purple-500/10 border-purple-500/30' },
  { id: 'interessado', label: 'Interessado', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10 border-yellow-500/30' },
  { id: 'negociacao', label: 'Negociação', color: 'text-orange-500', bgColor: 'bg-orange-500/10 border-orange-500/30' },
  { id: 'fechado', label: 'Fechado', color: 'text-green-500', bgColor: 'bg-green-500/10 border-green-500/30' },
  { id: 'perdido', label: 'Perdido', color: 'text-red-500', bgColor: 'bg-red-500/10 border-red-500/30' },
  { id: 'servico_finalizado', label: 'Serviço Finalizado', color: 'text-cyan-500', bgColor: 'bg-cyan-500/10 border-cyan-500/30', isCustom: true },
]

const AVAILABLE_COLORS = [
  { name: 'Azul', color: 'text-blue-500', bgColor: 'bg-blue-500/10 border-blue-500/30' },
  { name: 'Roxo', color: 'text-purple-500', bgColor: 'bg-purple-500/10 border-purple-500/30' },
  { name: 'Amarelo', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10 border-yellow-500/30' },
  { name: 'Laranja', color: 'text-orange-500', bgColor: 'bg-orange-500/10 border-orange-500/30' },
  { name: 'Verde', color: 'text-green-500', bgColor: 'bg-green-500/10 border-green-500/30' },
  { name: 'Vermelho', color: 'text-red-500', bgColor: 'bg-red-500/10 border-red-500/30' },
  { name: 'Ciano', color: 'text-cyan-500', bgColor: 'bg-cyan-500/10 border-cyan-500/30' },
  { name: 'Rosa', color: 'text-pink-500', bgColor: 'bg-pink-500/10 border-pink-500/30' },
  { name: 'Índigo', color: 'text-indigo-500', bgColor: 'bg-indigo-500/10 border-indigo-500/30' },
  { name: 'Cinza', color: 'text-gray-500', bgColor: 'bg-gray-500/10 border-gray-500/30' },
]

const STORAGE_KEY = 'kanban_column_names'
const STAGES_STORAGE_KEY = 'kanban_custom_stages'
const WEBHOOKS_STORAGE_KEY = 'kanban_webhooks'

type WebhookConfig = {
  enabled: boolean
  url: string
}

type WebhooksConfig = Record<string, WebhookConfig>

interface KanbanBoardProps {
  leads: Lead[]
  onStageChange: (leadId: string, newStage: Stage) => Promise<void>
  onLeadClick?: (lead: Lead) => void
  onEdit?: (lead: Lead) => void
  onDelete?: (lead: Lead) => void
}

export function KanbanBoard({ leads, onStageChange, onLeadClick, onEdit, onDelete }: KanbanBoardProps) {
  const [draggingLead, setDraggingLead] = useState<string | null>(null)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [stages, setStages] = useState<StageConfig[]>(DEFAULT_STAGES)
  const [editingStage, setEditingStage] = useState<Stage | null>(null)
  const [editValue, setEditValue] = useState('')
  const [webhooks, setWebhooks] = useState<WebhooksConfig>({} as WebhooksConfig)
  const [configuringWebhook, setConfiguringWebhook] = useState<Stage | null>(null)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookEnabled, setWebhookEnabled] = useState(false)
  const [showNewColumnForm, setShowNewColumnForm] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')
  const [newColumnColor, setNewColumnColor] = useState(0)

  // Carregar stages customizados do localStorage
  useEffect(() => {
    const savedStages = localStorage.getItem(STAGES_STORAGE_KEY)
    if (savedStages) {
      try {
        const parsedStages = JSON.parse(savedStages) as StageConfig[]
        setStages(parsedStages)
      } catch (e) {
        setStages(DEFAULT_STAGES)
      }
    } else {
      setStages(DEFAULT_STAGES)
      localStorage.setItem(STAGES_STORAGE_KEY, JSON.stringify(DEFAULT_STAGES))
    }

    // Carregar webhooks do localStorage
    const savedWebhooks = localStorage.getItem(WEBHOOKS_STORAGE_KEY)
    if (savedWebhooks) {
      try {
        const parsedWebhooks = JSON.parse(savedWebhooks) as WebhooksConfig
        setWebhooks(parsedWebhooks)
      } catch (e) {
        const defaultWebhooks = DEFAULT_STAGES.reduce((acc, stage) => {
          acc[stage.id] = { enabled: false, url: '' }
          return acc
        }, {} as WebhooksConfig)
        setWebhooks(defaultWebhooks)
      }
    } else {
      const defaultWebhooks = DEFAULT_STAGES.reduce((acc, stage) => {
        acc[stage.id] = { enabled: false, url: '' }
        return acc
      }, {} as WebhooksConfig)
      setWebhooks(defaultWebhooks)
    }
  }, [])

  // Salvar stages no localStorage
  const saveStages = (updatedStages: StageConfig[]) => {
    localStorage.setItem(STAGES_STORAGE_KEY, JSON.stringify(updatedStages))
  }

  const startEditing = (stageId: Stage, currentLabel: string) => {
    setEditingStage(stageId)
    setEditValue(currentLabel)
  }

  const cancelEditing = () => {
    setEditingStage(null)
    setEditValue('')
  }

  const saveEdit = (stageId: Stage) => {
    if (!editValue.trim()) {
      cancelEditing()
      return
    }

    const updatedStages = stages.map(stage =>
      stage.id === stageId ? { ...stage, label: editValue.trim() } : stage
    )
    setStages(updatedStages)
    saveStages(updatedStages)
    cancelEditing()
  }

  const handleKeyDown = (e: React.KeyboardEvent, stageId: Stage) => {
    if (e.key === 'Enter') {
      saveEdit(stageId)
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
  }

  // Funções para gerenciar colunas
  const createNewColumn = () => {
    if (!newColumnName.trim()) return

    const newId = newColumnName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')

    // Verificar se já existe
    if (stages.find(s => s.id === newId)) {
      alert('Já existe uma coluna com este nome!')
      return
    }

    const selectedColor = AVAILABLE_COLORS[newColumnColor]
    const newStage: StageConfig = {
      id: newId,
      label: newColumnName.trim(),
      color: selectedColor.color,
      bgColor: selectedColor.bgColor,
      isCustom: true
    }

    const updatedStages = [...stages, newStage]
    setStages(updatedStages)
    saveStages(updatedStages)

    // Adicionar webhook vazio para a nova coluna
    const updatedWebhooks = {
      ...webhooks,
      [newId]: { enabled: false, url: '' }
    }
    setWebhooks(updatedWebhooks)
    localStorage.setItem(WEBHOOKS_STORAGE_KEY, JSON.stringify(updatedWebhooks))

    // Reset form
    setNewColumnName('')
    setNewColumnColor(0)
    setShowNewColumnForm(false)
  }

  const deleteColumn = (stageId: string) => {
    const stage = stages.find(s => s.id === stageId)
    if (!stage?.isCustom) {
      alert('Não é possível excluir colunas padrão!')
      return
    }

    const leadsInStage = leads.filter(lead => (lead as any).stage === stageId)
    if (leadsInStage.length > 0) {
      const confirm = window.confirm(
        `Esta coluna tem ${leadsInStage.length} lead(s). Tem certeza que deseja excluir?\n\nOs leads serão movidos para "Novo Lead".`
      )
      if (!confirm) return

      // Mover leads para 'novo'
      leadsInStage.forEach(lead => {
        onStageChange(lead.id, 'novo')
      })
    }

    const updatedStages = stages.filter(s => s.id !== stageId)
    setStages(updatedStages)
    saveStages(updatedStages)

    // Remover webhook
    const updatedWebhooks = { ...webhooks }
    delete updatedWebhooks[stageId]
    setWebhooks(updatedWebhooks)
    localStorage.setItem(WEBHOOKS_STORAGE_KEY, JSON.stringify(updatedWebhooks))
  }

  // Funções de webhook
  const openWebhookConfig = (stageId: Stage) => {
    setConfiguringWebhook(stageId)
    const config = webhooks[stageId] || { enabled: false, url: '' }
    setWebhookUrl(config.url)
    setWebhookEnabled(config.enabled)
  }

  const cancelWebhookConfig = () => {
    setConfiguringWebhook(null)
    setWebhookUrl('')
    setWebhookEnabled(false)
  }

  const saveWebhookConfig = (stageId: Stage) => {
    const updatedWebhooks = {
      ...webhooks,
      [stageId]: {
        enabled: webhookEnabled,
        url: webhookUrl.trim()
      }
    }
    setWebhooks(updatedWebhooks)
    localStorage.setItem(WEBHOOKS_STORAGE_KEY, JSON.stringify(updatedWebhooks))
    cancelWebhookConfig()
  }

  const sendWebhook = async (lead: Lead, fromStage: Stage | null, toStage: Stage) => {
    const config = webhooks[toStage]
    if (!config || !config.enabled || !config.url) return

    const payload = {
      event: 'lead_moved',
      timestamp: new Date().toISOString(),
      lead: {
        id: lead.id,
        nome: lead.nome,
        telefone: lead.telefone,
        interesse: lead.interesse,
        interessado: lead.interessado,
        trava: lead.trava,
        followup: lead.followup,
        created_at: lead.created_at
      },
      movement: {
        from_stage: fromStage,
        to_stage: toStage,
        stage_label: stages.find(s => s.id === toStage)?.label
      }
    }

    try {
      await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })
    } catch (error) {
      // Ignorar erros de webhook silenciosamente
    }
  }

  // Agrupar leads por stage
  const leadsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = leads.filter(lead => (lead as any).stage === stage.id || (!((lead as any).stage) && stage.id === 'novo'))
    return acc
  }, {} as Record<Stage, Lead[]>)

  const handleDragStart = (leadId: string) => {
    setDraggingLead(leadId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (stage: Stage) => {
    if (!draggingLead) return

    const lead = leads.find(l => l.id === draggingLead)
    const fromStage = (lead as any)?.stage as Stage | null

    await onStageChange(draggingLead, stage)

    // Enviar webhook após mover o card
    if (lead) {
      await sendWebhook(lead, fromStage, stage)
    }

    setDraggingLead(null)
  }

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 13) {
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`
    }
    return phone
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Nunca'
    const d = new Date(date)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - d.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Hoje'
    if (diffDays === 1) return 'Ontem'
    if (diffDays < 7) return `${diffDays} dias atrás`
    return d.toLocaleDateString('pt-BR')
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-full">
      {stages.map((stage) => {
        const stageLeads = leadsByStage[stage.id]
        const isEditing = editingStage === stage.id

        return (
          <div
            key={stage.id}
            className="flex-shrink-0 w-80 flex flex-col"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(stage.id)}
          >
            {/* Header da coluna */}
            <div className={`p-4 rounded-t-lg border ${stage.bgColor} sticky top-0 z-10`}>
              <div className="flex items-center justify-between gap-2">
                {isEditing ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, stage.id)}
                      className="flex-1 px-2 py-1 text-sm font-semibold bg-[var(--background)] border border-[var(--border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      autoFocus
                      maxLength={30}
                    />
                    <button
                      onClick={() => saveEdit(stage.id)}
                      className="p-1 hover:bg-green-500/20 text-green-500 rounded transition-colors"
                      title="Salvar"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="p-1 hover:bg-red-500/20 text-red-500 rounded transition-colors"
                      title="Cancelar"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : configuringWebhook === stage.id ? (
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://example.com/webhook"
                        className="flex-1 px-2 py-1 text-xs bg-[var(--background)] border border-[var(--border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={webhookEnabled}
                          onChange={(e) => setWebhookEnabled(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span>Ativar webhook</span>
                      </label>
                      <div className="flex gap-1">
                        <button
                          onClick={() => saveWebhookConfig(stage.id)}
                          className="p-1 hover:bg-green-500/20 text-green-500 rounded transition-colors"
                          title="Salvar"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={cancelWebhookConfig}
                          className="p-1 hover:bg-red-500/20 text-red-500 rounded transition-colors"
                          title="Cancelar"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3
                      className={`font-semibold ${stage.color} cursor-pointer hover:opacity-70 transition-opacity flex items-center gap-2 group`}
                      onClick={() => startEditing(stage.id, stage.label)}
                      title="Clique para editar"
                    >
                      {stage.label}
                      <Edit2 size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                    </h3>
                    <div className="flex items-center gap-2">
                      {stage.isCustom && (
                        <button
                          onClick={() => deleteColumn(stage.id)}
                          className="p-1.5 rounded transition-colors hover:bg-red-500/20 text-red-500/60 hover:text-red-500"
                          title="Excluir coluna"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => openWebhookConfig(stage.id)}
                        className={`p-1.5 rounded transition-colors ${
                          webhooks[stage.id]?.enabled
                            ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                            : 'hover:bg-[var(--muted)]/20 text-[var(--muted)] hover:text-[var(--foreground)]'
                        }`}
                        title="Configurar webhook"
                      >
                        <LinkIcon size={14} />
                      </button>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${stage.bgColor} ${stage.color}`}>
                        {stageLeads.length}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Cards dos leads */}
            <div className="flex-1 overflow-y-auto bg-[var(--background)] border-x border-b border-[var(--border)] rounded-b-lg p-2 space-y-2">
              {stageLeads.length === 0 ? (
                <div className="text-center text-[var(--muted)] text-sm py-8">
                  Nenhum lead neste estágio
                </div>
              ) : (
                stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => handleDragStart(lead.id)}
                    onMouseEnter={() => setHoveredCard(lead.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    className={`bg-[var(--card)] border border-[var(--border)] rounded-lg p-3 cursor-move hover:shadow-lg transition-all relative ${
                      draggingLead === lead.id ? 'opacity-50' : ''
                    } hover:border-[var(--primary)]`}
                  >
                    {/* Botões de ação - aparecem no hover */}
                    {hoveredCard === lead.id && (onEdit || onDelete) && (
                      <div className="absolute top-2 right-2 flex gap-1 z-10">
                        {onEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onEdit(lead)
                            }}
                            className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-500 rounded transition-colors"
                            title="Editar lead"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDelete(lead)
                            }}
                            className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded transition-colors"
                            title="Excluir lead"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Header do card */}
                    <div
                      className="flex items-start justify-between mb-2"
                      onClick={() => onLeadClick?.(lead)}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">
                          {lead.nome || 'Sem nome'}
                        </h4>
                        <div className="flex items-center gap-1 text-xs text-[var(--muted)] mt-1">
                          <Phone size={12} />
                          <span>{formatPhone(lead.telefone)}</span>
                        </div>
                      </div>
                      <div className="text-[var(--muted)]">
                        <GripVertical size={16} />
                      </div>
                    </div>

                    {/* Interesse */}
                    {lead.interesse && (
                      <div className="mb-2">
                        <p className="text-xs text-[var(--muted)] line-clamp-2">
                          {lead.interesse}
                        </p>
                      </div>
                    )}

                    {/* Footer do card */}
                    <div className="flex items-center justify-between text-xs text-[var(--muted)] pt-2 border-t border-[var(--border)]">
                      <div className="flex items-center gap-1">
                        <MessageSquare size={12} />
                        <span>{lead.followup} followups</span>
                      </div>

                      {lead.trava && (
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Lock size={12} />
                          <span>Pausado</span>
                        </div>
                      )}

                      {!lead.trava && (
                        <div className="flex items-center gap-1 text-green-500">
                          <Unlock size={12} />
                          <span>Ativo</span>
                        </div>
                      )}
                    </div>

                    {/* Última interação */}
                    <div className="flex items-center gap-1 text-xs text-[var(--muted)] mt-2">
                      <Calendar size={12} />
                      <span>{formatDate(lead.last_followup)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}

      {/* Botão/Formulário para adicionar nova coluna */}
      {!showNewColumnForm ? (
        <div className="flex-shrink-0 w-80">
          <button
            onClick={() => setShowNewColumnForm(true)}
            className="w-full h-32 border-2 border-dashed border-[var(--border)] rounded-lg hover:border-[var(--primary)] hover:bg-[var(--muted)]/10 transition-colors flex flex-col items-center justify-center gap-2 text-[var(--muted)] hover:text-[var(--primary)]"
          >
            <Plus size={32} />
            <span className="font-medium">Adicionar Coluna</span>
          </button>
        </div>
      ) : (
        <div className="flex-shrink-0 w-80">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
            <h3 className="font-semibold mb-3">Nova Coluna</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[var(--muted)] mb-1 block">Nome</label>
                <input
                  type="text"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="Ex: Serviço Finalizado"
                  className="w-full px-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  maxLength={30}
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-[var(--muted)] mb-1 block">Cor</label>
                <div className="grid grid-cols-5 gap-2">
                  {AVAILABLE_COLORS.map((colorOption, index) => (
                    <button
                      key={index}
                      onClick={() => setNewColumnColor(index)}
                      className={`p-2 rounded border-2 transition-all ${
                        newColumnColor === index
                          ? 'border-[var(--primary)] scale-110'
                          : 'border-transparent hover:border-[var(--border)]'
                      }`}
                      title={colorOption.name}
                    >
                      <div className={`w-full h-4 rounded ${colorOption.bgColor}`}></div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={createNewColumn}
                  className="flex-1 bg-[var(--primary)] text-white px-4 py-2 rounded hover:bg-[var(--primary-hover)] transition-colors flex items-center justify-center gap-2"
                >
                  <Check size={16} />
                  Criar
                </button>
                <button
                  onClick={() => {
                    setShowNewColumnForm(false)
                    setNewColumnName('')
                    setNewColumnColor(0)
                  }}
                  className="px-4 py-2 border border-[var(--border)] rounded hover:bg-[var(--muted)]/10 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
