'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { KanbanBoard } from '@/components/kanban-board'
import { Loader2, TrendingUp, Users, CheckCircle, XCircle } from 'lucide-react'
import type { Lead } from '@/lib/types'

type Stage = 'novo' | 'contato' | 'interessado' | 'negociacao' | 'fechado' | 'perdido'

export default function CRMPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

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
        console.error('Erro ao atualizar stage:', data.error)
        alert('Erro ao mover lead. Tente novamente.')
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
      {/* Header */}
      <div className="p-6 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">CRM - Funil de Vendas</h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              Arraste os cards para mudar o estágio dos leads
            </p>
          </div>

          {updating && (
            <div className="flex items-center gap-2 text-[var(--primary)]">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Atualizando...</span>
            </div>
          )}
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
        />
      </div>
    </div>
  )
}
