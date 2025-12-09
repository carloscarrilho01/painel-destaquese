'use client'

import { useState } from 'react'
import { Search, Phone, Calendar, Star } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const [search, setSearch] = useState('')
  const [filterInteressado, setFilterInteressado] = useState<boolean | null>(null)

  const filtered = leads.filter(lead => {
    const matchesSearch =
      lead.telefone.toLowerCase().includes(search.toLowerCase()) ||
      lead.nome?.toLowerCase().includes(search.toLowerCase()) ||
      lead.interesse?.toLowerCase().includes(search.toLowerCase())

    const matchesFilter =
      filterInteressado === null || lead.interessado === filterInteressado

    return matchesSearch && matchesFilter
  })

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)]">
      <div className="p-4 border-b border-[var(--border)] flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
          <input
            type="text"
            placeholder="Buscar por telefone, nome ou interesse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilterInteressado(null)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filterInteressado === null
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--background)] text-[var(--muted)] hover:bg-[var(--card-hover)]'
            }`}
          >
            Todos ({leads.length})
          </button>
          <button
            onClick={() => setFilterInteressado(true)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filterInteressado === true
                ? 'bg-green-600 text-white'
                : 'bg-[var(--background)] text-[var(--muted)] hover:bg-[var(--card-hover)]'
            }`}
          >
            Interessados ({leads.filter(l => l.interessado).length})
          </button>
          <button
            onClick={() => setFilterInteressado(false)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filterInteressado === false
                ? 'bg-orange-600 text-white'
                : 'bg-[var(--background)] text-[var(--muted)] hover:bg-[var(--card-hover)]'
            }`}
          >
            Nao Interessados ({leads.filter(l => !l.interessado).length})
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left p-4 text-sm font-medium text-[var(--muted)]">Telefone</th>
              <th className="text-left p-4 text-sm font-medium text-[var(--muted)]">Nome</th>
              <th className="text-left p-4 text-sm font-medium text-[var(--muted)]">Interesse</th>
              <th className="text-left p-4 text-sm font-medium text-[var(--muted)]">Status</th>
              <th className="text-left p-4 text-sm font-medium text-[var(--muted)]">Followups</th>
              <th className="text-left p-4 text-sm font-medium text-[var(--muted)]">Criado em</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[var(--muted)]">
                  Nenhum lead encontrado
                </td>
              </tr>
            ) : (
              filtered.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-[var(--border)] hover:bg-[var(--card-hover)] transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-[var(--primary)]" />
                      <span className="font-mono">{lead.telefone}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {lead.nome || <span className="text-[var(--muted)]">-</span>}
                  </td>
                  <td className="p-4">
                    {lead.interesse ? (
                      <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-sm">
                        {lead.interesse}
                      </span>
                    ) : (
                      <span className="text-[var(--muted)]">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {lead.interessado ? (
                        <>
                          <Star size={16} className="text-yellow-500 fill-yellow-500" />
                          <span className="text-green-400">Interessado</span>
                        </>
                      ) : (
                        <span className="text-[var(--muted)]">Aguardando</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="bg-[var(--background)] px-2 py-1 rounded text-sm">
                      {lead.followup}x
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                      <Calendar size={14} />
                      {format(new Date(lead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
