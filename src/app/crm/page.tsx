'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { KanbanBoard } from '@/components/kanban-board'
import { AddLeadModal } from '@/components/add-lead-modal'
import { LeadFormModal } from '@/components/lead-form-modal'
import { Loader2, TrendingUp, Users, CheckCircle, XCircle, AlertCircle, UserPlus } from 'lucide-react'
import type { Lead } from '@/lib/types'

type Stage = 'novo' | 'contato' | 'interessado' | 'negociacao' | 'fechado' | 'perdido'

export default function CRMPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showSetupWarning, setShowSetupWarning] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar leads:', error)
        return
      }

      setLeads(data || [])
    } catch (error) {
      console.error('Erro ao buscar leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStageChange = async (leadId: string, newStage: Stage) => {
    setUpdating(true)

    try {
      const response = await fetch('/api/update-stage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId,
          stage: newStage
        })
      })

      if (response.ok) {
        // Atualizar estado local
        setLeads(prevLeads =>
          prevLeads.map(lead =>
            lead.id === leadId
              ? { ...lead, stage: newStage } as any
              : lead
          )
        )
      } else {
        const data = await response.json()
        console.error('Erro ao atualizar stage:', data)

        // Se o erro for sobre campo stage não existir, mostrar aviso
        if (data.error?.includes('stage') && data.error?.includes('banco de dados')) {
          setShowSetupWarning(true)
        }

        // Mostrar erro detalhado
        const errorMessage = data.details
          ? `${data.error}\n\nDetalhes: ${data.details}`
          : data.error || 'Erro ao mover lead. Tente novamente.'

        alert(errorMessage)

        // Recarregar leads para garantir sincronização
        fetchLeads()
      }
    } catch (error) {
      console.error('Erro ao atualizar stage:', error)
      alert('Erro de conexão. Tente novamente.')
    } finally {
      setUpdating(false)
    }
  }

  const handleLeadClick = (lead: Lead) => {
    // Redirecionar para a conversa do lead
    router.push(`/conversas?session=${lead.telefone}`)
  }

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead)
    setShowEditModal(true)
  }

  const handleDeleteLead = async (lead: Lead) => {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir o lead "${lead.nome || lead.telefone}"?\n\nEsta ação não pode ser desfeita.`
    )

    if (!confirmDelete) return

    setUpdating(true)

    try {
      const response = await fetch(`/api/update-lead?id=${lead.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remover lead do estado local
        setLeads(prevLeads => prevLeads.filter(l => l.id !== lead.id))
        alert('Lead excluído com sucesso!')
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao excluir lead. Tente novamente.')
      }
    } catch (error) {
      console.error('Erro ao excluir lead:', error)
      alert('Erro de conexão. Tente novamente.')
    } finally {
      setUpdating(false)
    }
  }

  const handleSaveLead = async (leadData: Partial<Lead>) => {
    setUpdating(true)

    try {
      const response = await fetch('/api/update-lead', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId: selectedLead?.id,
          updates: leadData
        })
      })

      if (response.ok) {
        const { lead: updatedLead } = await response.json()

        // Atualizar lead no estado local
        setLeads(prevLeads =>
          prevLeads.map(l => l.id === updatedLead.id ? updatedLead : l)
        )

        alert('Lead atualizado com sucesso!')
        setShowEditModal(false)
        setSelectedLead(null)
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao atualizar lead')
      }
    } catch (error) {
      console.error('Erro ao salvar lead:', error)
      throw error
    } finally {
      setUpdating(false)
    }
  }

  // Estatísticas
  const stats = {
    total: leads.length,
    fechados: leads.filter(l => (l as any).stage === 'fechado').length,
    perdidos: leads.filter(l => (l as any).stage === 'perdido').length,
    emAndamento: leads.filter(l =>
      ['novo', 'contato', 'interessado', 'negociacao'].includes((l as any).stage || 'novo')
    ).length
  }

  const conversionRate = stats.total > 0
    ? ((stats.fechados / stats.total) * 100).toFixed(1)
    : '0'

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--primary)]" size={48} />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Aviso de configuração */}
      {showSetupWarning && (
        <div className="bg-red-500/10 border-l-4 border-red-500 p-4 m-6 mb-0">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0" size={24} />
            <div className="flex-1">
              <h3 className="font-semibold text-red-500 mb-2">
                ⚠️ Configuração Necessária - Campo "stage" não encontrado
              </h3>
              <p className="text-sm text-[var(--foreground)] mb-3">
                O CRM Kanban precisa que você execute um SQL no Supabase antes de usar.
              </p>
              <ol className="text-sm text-[var(--muted)] space-y-2 mb-3">
                <li>1. Acesse: <a href="https://supabase.com/dashboard" target="_blank" className="text-[var(--primary)] underline">Supabase Dashboard</a></li>
                <li>2. Vá em <strong>SQL Editor</strong> (menu lateral)</li>
                <li>3. Cole e execute o SQL que está no arquivo <code className="bg-[var(--background)] px-2 py-1 rounded">KANBAN_MIGRATION.sql</code></li>
              </ol>
              <button
                onClick={() => setShowSetupWarning(false)}
                className="px-3 py-1 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30 text-sm"
              >
                Fechar aviso
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-6 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">CRM - Funil de Vendas</h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              Arraste os cards para mudar o estágio dos leads
            </p>
          </div>

          <div className="flex items-center gap-3">
            {updating && (
              <div className="flex items-center gap-2 text-[var(--primary)]">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Atualizando...</span>
              </div>
            )}

            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-hover)] transition-colors flex items-center gap-2"
            >
              <UserPlus size={18} />
              <span>Adicionar Lead</span>
            </button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted)]">Total de Leads</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <Users className="text-blue-500" size={32} />
            </div>
          </div>

          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted)]">Em Andamento</p>
                <p className="text-2xl font-bold mt-1">{stats.emAndamento}</p>
              </div>
              <TrendingUp className="text-yellow-500" size={32} />
            </div>
          </div>

          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted)]">Fechados</p>
                <p className="text-2xl font-bold mt-1">{stats.fechados}</p>
              </div>
              <CheckCircle className="text-green-500" size={32} />
            </div>
          </div>

          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted)]">Taxa de Conversão</p>
                <p className="text-2xl font-bold mt-1">{conversionRate}%</p>
              </div>
              <XCircle className="text-red-500" size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden p-6">
        <KanbanBoard
          leads={leads}
          onStageChange={handleStageChange}
          onLeadClick={handleLeadClick}
          onEdit={handleEditLead}
          onDelete={handleDeleteLead}
        />
      </div>

      {/* Modal Adicionar Lead */}
      <AddLeadModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onLeadAdded={fetchLeads}
      />

      {/* Modal Editar Lead */}
      <LeadFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedLead(null)
        }}
        onSave={handleSaveLead}
        lead={selectedLead}
        mode="edit"
      />
    </div>
  )
}
