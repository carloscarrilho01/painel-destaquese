import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { LeadsTable } from '@/components/leads-table'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

async function getLeads() {
  if (!isSupabaseConfigured) return []

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching leads:', error)
    return []
  }

  return data || []
}

export default async function LeadsPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-[var(--muted)]">Gerenciamento de contatos e leads</p>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="text-yellow-500 mt-1" size={24} />
            <div>
              <h2 className="text-lg font-semibold text-yellow-500">Configuracao Necessaria</h2>
              <p className="text-[var(--muted)] mt-2">
                Configure as credenciais do Supabase para visualizar os leads.
              </p>
              <Link
                href="/configuracoes"
                className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2 rounded-lg mt-4 hover:bg-[var(--primary-hover)] transition-colors"
              >
                Ver instrucoes
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const leads = await getLeads()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Leads</h1>
        <p className="text-[var(--muted)]">Gerenciamento de contatos e leads</p>
      </div>

      <LeadsTable leads={leads} />
    </div>
  )
}
