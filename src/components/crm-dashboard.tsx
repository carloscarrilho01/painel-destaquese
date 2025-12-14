'use client'

import { useState, useMemo } from 'react'
import {
  Search, Users, TrendingUp, Phone, Calendar,
  Filter, LayoutGrid, List, Star, Clock, CheckCircle,
  UserCheck, UserX, Target, BarChart3, GripVertical,
  Edit2, Trash2, Plus, Pause, Play
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { LeadFormModal } from './lead-form-modal'

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

type ViewMode = 'kanban' | 'list'
type Pipeline = 'novo' | 'contato' | 'interessado' | 'negociacao' | 'ganho' | 'perdido'

export function CRMDashboard({ leads: initialLeads }: { leads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null)
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)
  const [updating, setUpdating] = useState(false)

  // Estados do modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  // Calcular estatísticas
  const stats = useMemo(() => {
    const total = leads.length
    const interessados = leads.filter(l => l.interessado).length
    const naoInteressados = leads.filter(l => !l.interessado && l.followup > 0).length
    const novos = leads.filter(l => l.followup === 0).length
    const emFollowup = leads.filter(l => l.followup > 0 && l.followup < 3).length

    const taxaConversao = total > 0 ? ((interessados / total) * 100).toFixed(1) : '0'

    return {
      total,
      novos,
      interessados,
      naoInteressados,
      emFollowup,
      taxaConversao
    }
  }, [leads])

  // Organizar leads por pipeline
  const leadsByPipeline = useMemo(() => {
    const pipelines: Record<Pipeline, Lead[]> = {
      novo: [],
      contato: [],
      interessado: [],
      negociacao: [],
      ganho: [],
      perdido: []
    }

    leads.forEach(lead => {
      if (lead.followup === 0) {
        pipelines.novo.push(lead)
      } else if (lead.interessado && lead.followup >= 3) {
        pipelines.ganho.push(lead)
      } else if (lead.interessado) {
        pipelines.interessado.push(lead)
      } else if (!lead.interessado && lead.followup >= 2) {
        pipelines.perdido.push(lead)
      } else if (lead.followup === 1) {
        pipelines.contato.push(lead)
      } else {
        pipelines.negociacao.push(lead)
      }
    })

    return pipelines
  }, [leads])

  // Filtrar leads
  const filteredLeads = useMemo(() => {
    let filtered = leads

    if (search) {
      filtered = filtered.filter(lead =>
        lead.telefone.includes(search) ||
        lead.nome?.toLowerCase().includes(search.toLowerCase()) ||
        lead.interesse?.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (selectedPipeline) {
      filtered = leadsByPipeline[selectedPipeline]
    }

    return filtered
  }, [leads, search, selectedPipeline, leadsByPipeline])

  // Função para atualizar lead após drag and drop
  const handleDropLead = async (lead: Lead, targetPipeline: Pipeline) => {
    // Calcular novos valores baseado no pipeline de destino
    let updates: Partial<Lead> = {}

    switch (targetPipeline) {
      case 'novo':
        updates = { followup: 0, interessado: false }
        break
      case 'contato':
        updates = { followup: 1, interessado: false }
        break
      case 'interessado':
        updates = { followup: 1, interessado: true }
        break
      case 'negociacao':
        updates = { followup: 2, interessado: true }
        break
      case 'ganho':
        updates = { followup: 3, interessado: true }
        break
      case 'perdido':
        updates = { followup: 2, interessado: false }
        break
    }

    // Atualização otimista na UI
    setLeads(prevLeads =>
      prevLeads.map(l =>
        l.id === lead.id ? { ...l, ...updates } : l
      )
    )

    setUpdating(true)

    try {
      const response = await fetch('/api/update-lead', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          updates
        })
      })

      if (!response.ok) {
        throw new Error('Falha ao atualizar lead')
      }

      const data = await response.json()

      // Atualizar com dados do servidor
      setLeads(prevLeads =>
        prevLeads.map(l => (l.id === lead.id ? data.lead : l))
      )
    } catch (error) {
      console.error('Erro ao atualizar lead:', error)
      // Reverter em caso de erro
      setLeads(prevLeads =>
        prevLeads.map(l => (l.id === lead.id ? lead : l))
      )
      alert('Erro ao mover lead. Tente novamente.')
    } finally {
      setUpdating(false)
    }
  }

  // Abrir modal para criar lead
  const handleCreateLead = () => {
    setModalMode('create')
    setSelectedLead(null)
    setIsModalOpen(true)
  }

  // Abrir modal para editar lead
  const handleEditLead = (lead: Lead) => {
    setModalMode('edit')
    setSelectedLead(lead)
    setIsModalOpen(true)
  }

  // Deletar lead
  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) {
      return
    }

    // Atualização otimista
    const leadToDelete = leads.find(l => l.id === leadId)
    setLeads(prevLeads => prevLeads.filter(l => l.id !== leadId))

    try {
      const response = await fetch(`/api/update-lead?id=${leadId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Falha ao deletar lead')
      }
    } catch (error) {
      console.error('Erro ao deletar lead:', error)
      // Reverter em caso de erro
      if (leadToDelete) {
        setLeads(prevLeads => [...prevLeads, leadToDelete])
      }
      alert('Erro ao excluir lead. Tente novamente.')
    }
  }

  // Toggle trava do agente (pausar/despausar)
  const handleToggleTrava = async (lead: Lead) => {
    const newTravaValue = !lead.trava

    // Atualização otimista
    setLeads(prevLeads =>
      prevLeads.map(l =>
        l.id === lead.id ? { ...l, trava: newTravaValue } : l
      )
    )

    try {
      const response = await fetch('/api/update-lead', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          updates: { trava: newTravaValue }
        })
      })

      if (!response.ok) {
        throw new Error('Falha ao atualizar trava')
      }

      const data = await response.json()
      setLeads(prevLeads =>
        prevLeads.map(l => (l.id === lead.id ? data.lead : l))
      )
    } catch (error) {
      console.error('Erro ao atualizar trava:', error)
      // Reverter em caso de erro
      setLeads(prevLeads =>
        prevLeads.map(l => (l.id === lead.id ? lead : l))
      )
      alert('Erro ao pausar/despausar agente. Tente novamente.')
    }
  }

  // Salvar lead (criar ou editar)
  const handleSaveLead = async (leadData: Partial<Lead>) => {
    if (modalMode === 'create') {
      // Criar novo lead
      const response = await fetch('/api/update-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead: leadData })
      })

      if (!response.ok) {
        throw new Error('Falha ao criar lead')
      }

      const data = await response.json()
      setLeads(prevLeads => [data.lead, ...prevLeads])
    } else {
      // Editar lead existente
      const response = await fetch('/api/update-lead', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: leadData.id,
          updates: leadData
        })
      })

      if (!response.ok) {
        throw new Error('Falha ao atualizar lead')
      }

      const data = await response.json()
      setLeads(prevLeads =>
        prevLeads.map(l => (l.id === data.lead.id ? data.lead : l))
      )
    }
  }

  const pipelineConfig: Record<Pipeline, { label: string; icon: any; color: string; bgColor: string }> = {
    novo: {
      label: 'Novos',
      icon: Star,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    contato: {
      label: 'Primeiro Contato',
      icon: Phone,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    interessado: {
      label: 'Interessados',
      icon: UserCheck,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    },
    negociacao: {
      label: 'Negociação',
      icon: Target,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    },
    ganho: {
      label: 'Ganhos',
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    perdido: {
      label: 'Perdidos',
      icon: UserX,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10'
    }
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--muted)]">Total de Leads</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Users className="text-blue-500" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--muted)]">Novos</p>
              <p className="text-3xl font-bold mt-2">{stats.novos}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Star className="text-purple-500" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--muted)]">Interessados</p>
              <p className="text-3xl font-bold mt-2">{stats.interessados}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <UserCheck className="text-green-500" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--muted)]">Taxa de Conversão</p>
              <p className="text-3xl font-bold mt-2">{stats.taxaConversao}%</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-yellow-500" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Barra de ferramentas */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* Busca */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
            <input
              type="text"
              placeholder="Buscar leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          {/* Filtros de pipeline */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedPipeline(null)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPipeline === null
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--background)] text-[var(--muted)] hover:bg-[var(--border)]'
              }`}
            >
              Todos
            </button>
            {(Object.keys(pipelineConfig) as Pipeline[]).map(pipeline => {
              const config = pipelineConfig[pipeline]
              const Icon = config.icon
              const count = leadsByPipeline[pipeline].length

              return (
                <button
                  key={pipeline}
                  onClick={() => setSelectedPipeline(pipeline)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    selectedPipeline === pipeline
                      ? `${config.bgColor} ${config.color}`
                      : 'bg-[var(--background)] text-[var(--muted)] hover:bg-[var(--border)]'
                  }`}
                >
                  <Icon size={16} />
                  <span className="hidden lg:inline">{config.label}</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{count}</span>
                </button>
              )
            })}
          </div>

          {/* Toggle de visualização */}
          <div className="flex gap-2 border border-[var(--border)] rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--muted)] hover:bg-[var(--border)]'
              }`}
              title="Visão Kanban"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--muted)] hover:bg-[var(--border)]'
              }`}
              title="Visão Lista"
            >
              <List size={18} />
            </button>
          </div>

          {/* Botão Adicionar Lead */}
          <button
            onClick={handleCreateLead}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors font-medium"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Adicionar Lead</span>
          </button>
        </div>
      </div>

      {/* Indicador de atualização */}
      {updating && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-500 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          Atualizando lead...
        </div>
      )}

      {/* Conteúdo */}
      {viewMode === 'kanban' ? (
        <KanbanView
          leadsByPipeline={leadsByPipeline}
          pipelineConfig={pipelineConfig}
          onDropLead={handleDropLead}
          draggedLead={draggedLead}
          setDraggedLead={setDraggedLead}
          onEditLead={handleEditLead}
          onDeleteLead={handleDeleteLead}
          onToggleTrava={handleToggleTrava}
        />
      ) : (
        <ListView
          leads={filteredLeads}
          onEditLead={handleEditLead}
          onDeleteLead={handleDeleteLead}
          onToggleTrava={handleToggleTrava}
        />
      )}

      {/* Modal de Formulário */}
      <LeadFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveLead}
        lead={selectedLead}
        mode={modalMode}
      />
    </div>
  )
}

// Componente de visualização Kanban com Drag & Drop
function KanbanView({
  leadsByPipeline,
  pipelineConfig,
  onDropLead,
  draggedLead,
  setDraggedLead,
  onEditLead,
  onDeleteLead,
  onToggleTrava
}: {
  leadsByPipeline: Record<Pipeline, Lead[]>
  pipelineConfig: Record<Pipeline, any>
  onDropLead: (lead: Lead, pipeline: Pipeline) => void
  draggedLead: Lead | null
  setDraggedLead: (lead: Lead | null) => void
  onEditLead: (lead: Lead) => void
  onDeleteLead: (leadId: string) => void
  onToggleTrava: (lead: Lead) => void
}) {
  const [dragOverPipeline, setDragOverPipeline] = useState<Pipeline | null>(null)

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, pipeline: Pipeline) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverPipeline(pipeline)
  }

  const handleDragLeave = () => {
    setDragOverPipeline(null)
  }

  const handleDrop = (e: React.DragEvent, targetPipeline: Pipeline) => {
    e.preventDefault()
    setDragOverPipeline(null)

    if (draggedLead) {
      onDropLead(draggedLead, targetPipeline)
      setDraggedLead(null)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {(Object.keys(pipelineConfig) as Pipeline[]).map(pipeline => {
        const config = pipelineConfig[pipeline]
        const Icon = config.icon
        const leads = leadsByPipeline[pipeline]
        const isDragOver = dragOverPipeline === pipeline

        return (
          <div
            key={pipeline}
            className={`bg-[var(--card)] border rounded-xl p-4 transition-all ${
              isDragOver
                ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20 scale-[1.02]'
                : 'border-[var(--border)]'
            }`}
            onDragOver={(e) => handleDragOver(e, pipeline)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, pipeline)}
          >
            <div className={`flex items-center gap-2 mb-4 pb-3 border-b border-[var(--border)]`}>
              <div className={`${config.bgColor} p-2 rounded-lg`}>
                <Icon className={config.color} size={18} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{config.label}</h3>
                <p className="text-xs text-[var(--muted)]">{leads.length} leads</p>
              </div>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {leads.map(lead => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead)}
                  className={`bg-[var(--background)] border rounded-lg p-3 transition-all cursor-grab active:cursor-grabbing ${
                    draggedLead?.id === lead.id
                      ? 'opacity-50 scale-95'
                      : lead.trava
                        ? 'opacity-60 border-yellow-500/50 hover:border-yellow-500'
                        : 'opacity-100 border-[var(--border)] hover:border-[var(--primary)]'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <GripVertical size={16} className="text-[var(--muted)] mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {lead.nome || 'Sem nome'}
                          </p>
                          <p className="text-xs text-[var(--muted)] flex items-center gap-1 mt-1">
                            <Phone size={12} />
                            {lead.telefone}
                          </p>
                        </div>
                        {lead.trava && (
                          <div className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded text-xs ml-2 flex-shrink-0">
                            Trava
                          </div>
                        )}
                      </div>

                      {lead.interesse && (
                        <p className="text-xs text-[var(--muted)] mt-2 truncate">
                          {lead.interesse}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--border)]">
                        <div className="flex items-center gap-1 text-xs text-[var(--muted)]">
                          <Clock size={12} />
                          <span>Follow-up: {lead.followup}</span>
                        </div>
                        <span className="text-xs text-[var(--muted)]">
                          {format(new Date(lead.created_at), 'dd/MM', { locale: ptBR })}
                        </span>
                      </div>

                      {/* Botões de ação */}
                      <div className="flex items-center gap-1 mt-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleTrava(lead)
                          }}
                          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded transition-colors text-xs ${
                            lead.trava
                              ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                              : 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
                          }`}
                          title={lead.trava ? 'Despausar agente' : 'Pausar agente'}
                        >
                          {lead.trava ? <Play size={12} /> : <Pause size={12} />}
                          <span>{lead.trava ? 'Ativar' : 'Pausar'}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditLead(lead)
                          }}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-500/10 text-blue-500 rounded hover:bg-blue-500/20 transition-colors text-xs"
                          title="Editar lead"
                        >
                          <Edit2 size={12} />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteLead(lead.id)
                          }}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors text-xs"
                          title="Excluir lead"
                        >
                          <Trash2 size={12} />
                          <span>Excluir</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {leads.length === 0 && (
                <div className="text-center py-8 text-[var(--muted)] text-sm border-2 border-dashed border-[var(--border)] rounded-lg">
                  {isDragOver ? 'Solte aqui' : 'Nenhum lead nesta etapa'}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Componente de visualização em lista
function ListView({
  leads,
  onEditLead,
  onDeleteLead,
  onToggleTrava
}: {
  leads: Lead[]
  onEditLead: (lead: Lead) => void
  onDeleteLead: (leadId: string) => void
  onToggleTrava: (lead: Lead) => void
}) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--background)] border-b border-[var(--border)]">
            <tr>
              <th className="text-left p-4 text-sm font-semibold">Nome</th>
              <th className="text-left p-4 text-sm font-semibold">Telefone</th>
              <th className="text-left p-4 text-sm font-semibold">Interesse</th>
              <th className="text-left p-4 text-sm font-semibold">Follow-up</th>
              <th className="text-left p-4 text-sm font-semibold">Status</th>
              <th className="text-left p-4 text-sm font-semibold">Criado em</th>
              <th className="text-left p-4 text-sm font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {leads.map(lead => (
              <tr
                key={lead.id}
                className={`transition-colors ${
                  lead.trava
                    ? 'opacity-60 bg-yellow-500/5 hover:bg-yellow-500/10'
                    : 'hover:bg-[var(--background)]'
                }`}
              >
                <td className="p-4 text-sm">
                  <div className="flex items-center gap-2">
                    {lead.nome || 'Sem nome'}
                    {lead.trava && (
                      <span className="bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded text-xs">
                        Pausado
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4 text-sm">{lead.telefone}</td>
                <td className="p-4 text-sm text-[var(--muted)] truncate max-w-xs">
                  {lead.interesse || '-'}
                </td>
                <td className="p-4 text-sm">
                  <span className="bg-blue-500/10 text-blue-500 px-2 py-1 rounded text-xs">
                    {lead.followup}x
                  </span>
                </td>
                <td className="p-4 text-sm">
                  {lead.interessado ? (
                    <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs">
                      Interessado
                    </span>
                  ) : lead.followup > 0 ? (
                    <span className="bg-red-500/10 text-red-500 px-2 py-1 rounded text-xs">
                      Não interessado
                    </span>
                  ) : (
                    <span className="bg-gray-500/10 text-gray-500 px-2 py-1 rounded text-xs">
                      Novo
                    </span>
                  )}
                </td>
                <td className="p-4 text-sm text-[var(--muted)]">
                  {format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleTrava(lead)}
                      className={`p-1.5 rounded transition-colors ${
                        lead.trava
                          ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                          : 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
                      }`}
                      title={lead.trava ? 'Despausar agente' : 'Pausar agente'}
                    >
                      {lead.trava ? <Play size={14} /> : <Pause size={14} />}
                    </button>
                    <button
                      onClick={() => onEditLead(lead)}
                      className="p-1.5 bg-blue-500/10 text-blue-500 rounded hover:bg-blue-500/20 transition-colors"
                      title="Editar lead"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => onDeleteLead(lead.id)}
                      className="p-1.5 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors"
                      title="Excluir lead"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {leads.length === 0 && (
          <div className="text-center py-12 text-[var(--muted)]">
            Nenhum lead encontrado
          </div>
        )}
      </div>
    </div>
  )
}
