'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { MessageSquare, Users, LayoutDashboard, Settings, Kanban, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/conversas', label: 'Conversas', icon: MessageSquare },
  { href: '/crm', label: 'CRM Kanban', icon: Kanban },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/configuracoes', label: 'Configuracoes', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    } finally {
      setLoggingOut(false)
    }
  }

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

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut size={20} />
          <span>{loggingOut ? 'Saindo...' : 'Sair'}</span>
        </button>
      </div>
    </aside>
  )
}
