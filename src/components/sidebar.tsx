'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare, Users, LayoutDashboard, Settings, Pause } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/conversas', label: 'Conversas', icon: MessageSquare },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/configuracoes', label: 'Configuracoes', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [pausedCount, setPausedCount] = useState(0)

  useEffect(() => {
    if (!isSupabaseConfigured) return

    const fetchPausedCount = async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: false })
        .eq('trava', true)

      if (!error && data) {
        setPausedCount(data.length)
      }
    }

    fetchPausedCount()

    // Atualizar a cada 5 segundos
    const interval = setInterval(fetchPausedCount, 5000)

    // Listener Realtime para atualizações instantâneas
    const channel = supabase
      .channel('sidebar-leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        () => {
          fetchPausedCount()
        }
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <aside className="w-64 bg-[var(--card)] border-r border-[var(--border)] flex flex-col">
      <div className="p-6 border-b border-[var(--border)]">
        <h1 className="text-xl font-bold text-[var(--primary)]">
          Painel WhatsApp
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">Monitoramento de Agente</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[var(--primary)] text-white'
                      : 'text-[var(--muted)] hover:bg-[var(--card-hover)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-[var(--border)] space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-[var(--muted)]">Agente Online</span>
        </div>

        {pausedCount > 0 && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            <Pause size={14} className="text-red-400" />
            <span className="text-sm text-red-400 font-medium">
              {pausedCount} {pausedCount === 1 ? 'Lead pausado' : 'Leads pausados'}
            </span>
          </div>
        )}
      </div>
    </aside>
  )
}
