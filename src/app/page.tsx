import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { MessageSquare, Users, UserCheck, Clock, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

async function getStats() {
  if (!isSupabaseConfigured) return null

  const [chatsResult, leadsResult, interessadosResult] = await Promise.all([
    supabase.from('chats').select('session_id', { count: 'exact' }),
    supabase.from('leads').select('*', { count: 'exact' }),
    supabase.from('leads').select('*', { count: 'exact' }).eq('interessado', true),
  ])

  const uniqueSessions = new Set(chatsResult.data?.map(c => c.session_id) || [])

  return {
    totalConversas: uniqueSessions.size,
    totalMensagens: chatsResult.count || 0,
    totalLeads: leadsResult.count || 0,
    leadsInteressados: interessadosResult.count || 0,
  }
}

async function getRecentConversations() {
  if (!isSupabaseConfigured) return []

  const { data } = await supabase
    .from('chats')
    .select('*')
    .order('id', { ascending: false })
    .limit(50)

  const grouped = new Map<string, { count: number; lastMessage: string; lastType: string }>()

  data?.forEach(chat => {
    const existing = grouped.get(chat.session_id)
    if (!existing) {
      grouped.set(chat.session_id, {
        count: 1,
        lastMessage: chat.message?.content || '',
        lastType: chat.message?.type || 'human'
      })
    } else {
      existing.count++
    }
  })

  return Array.from(grouped.entries()).slice(0, 5).map(([session_id, data]) => ({
    session_id,
    ...data
  }))
}

function ConfigurationRequired() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-[var(--muted)]">Visao geral do agente WhatsApp</p>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className="text-yellow-500 mt-1" size={24} />
          <div>
            <h2 className="text-lg font-semibold text-yellow-500">Configuracao Necessaria</h2>
            <p className="text-[var(--muted)] mt-2">
              Para utilizar o painel, voce precisa configurar as credenciais do Supabase.
            </p>

            <div className="mt-4 p-4 bg-[var(--card)] rounded-lg">
              <p className="text-sm text-[var(--muted)] mb-2">
                Adicione as seguintes variaveis ao arquivo <code className="bg-[var(--background)] px-2 py-1 rounded">.env.local</code>:
              </p>
              <pre className="text-sm bg-[var(--background)] p-4 rounded-lg overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima`}
              </pre>
            </div>

            <div className="mt-4">
              <Link
                href="/configuracoes"
                className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
              >
                Ver instrucoes completas
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function Dashboard() {
  const stats = await getStats()
  const recentConversations = await getRecentConversations()

  if (!stats) {
    return <ConfigurationRequired />
  }

  const statCards = [
    { label: 'Conversas', value: stats.totalConversas, icon: MessageSquare, color: 'bg-blue-500' },
    { label: 'Total Mensagens', value: stats.totalMensagens, icon: Clock, color: 'bg-purple-500' },
    { label: 'Leads', value: stats.totalLeads, icon: Users, color: 'bg-orange-500' },
    { label: 'Interessados', value: stats.leadsInteressados, icon: UserCheck, color: 'bg-green-500' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-[var(--muted)]">Visao geral do agente WhatsApp</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[var(--muted)] text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)]">
        <div className="p-6 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold">Conversas Recentes</h2>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {recentConversations.length === 0 ? (
            <div className="p-6 text-center text-[var(--muted)]">
              Nenhuma conversa encontrada
            </div>
          ) : (
            recentConversations.map((conv) => (
              <Link
                key={conv.session_id}
                href={`/conversas?session=${conv.session_id}`}
                className="block p-4 hover:bg-[var(--card-hover)] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--primary)] rounded-full flex items-center justify-center text-white font-semibold">
                      {conv.session_id.slice(-2)}
                    </div>
                    <div>
                      <p className="font-medium">{conv.session_id}</p>
                      <p className="text-sm text-[var(--muted)] truncate max-w-md">
                        {conv.lastMessage.slice(0, 50)}...
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm bg-[var(--border)] px-2 py-1 rounded">
                      {conv.count} msgs
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
