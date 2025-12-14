import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { CRMDashboard } from '@/components/crm-dashboard'
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

export default async function CRMPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">CRM</h1>
          <p className="text-[var(--muted)]">Gestão completa de leads e pipeline</p>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="text-yellow-500 mt-1" size={24} />
            <div>
              <h2 className="text-lg font-semibold text-yellow-500">Configuração Necessária</h2>
              <p className="text-[var(--muted)] mt-2">
                Configure as credenciais do Supabase para usar o CRM.
              </p>
              <Link
                href="/configuracoes"
                className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2 rounded-lg mt-4 hover:bg-[var(--primary-hover)] transition-colors"
              >
                Ver instruções
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
        <h1 className="text-2xl font-bold">CRM</h1>
        <p className="text-[var(--muted)]">Gestão completa de leads e pipeline de vendas</p>
      </div>

      <CRMDashboard leads={leads} />
    </div>
  )
}
