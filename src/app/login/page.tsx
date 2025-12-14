'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2, Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    console.log('🔐 Tentando fazer login...')
    console.log('📧 Email:', email)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('📊 Resposta do Supabase:', { data, error: signInError })

      if (signInError) {
        console.error('❌ Erro de autenticação:', signInError)
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos')
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Email não confirmado. Verifique sua caixa de entrada.')
        } else {
          setError(signInError.message)
        }
        return
      }

      if (data.user) {
        console.log('✅ Login bem-sucedido!')
        console.log('👤 Usuário:', data.user.email)
        console.log('🔑 Session:', data.session?.access_token ? 'Token criado' : 'Sem token')

        // Login bem-sucedido, redirecionar para dashboard
        console.log('🔄 Redirecionando para dashboard...')
        router.push('/')
        router.refresh()
      } else {
        console.warn('⚠️ Login sem erro mas sem usuário')
        setError('Erro desconhecido ao fazer login')
      }
    } catch (error) {
      console.error('💥 Erro ao fazer login:', error)
      setError('Erro ao conectar com o servidor. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--primary)] rounded-full mb-4">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold mb-2">Painel WhatsApp</h1>
          <p className="text-[var(--muted)]">Faça login para acessar o painel</p>
        </div>

        {/* Card de Login */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-8 shadow-xl">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  disabled={loading}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg pl-10 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg p-3 text-sm flex items-start gap-2">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Botão de Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--primary)] text-white py-3 rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Entrando...</span>
                </>
              ) : (
                <span>Entrar</span>
              )}
            </button>
          </form>

          {/* Esqueceu a senha */}
          <div className="mt-6 text-center">
            <button
              type="button"
              className="text-sm text-[var(--primary)] hover:underline"
              disabled={loading}
            >
              Esqueceu sua senha?
            </button>
          </div>
        </div>

        {/* Informação adicional */}
        <div className="mt-6 text-center text-xs text-[var(--muted)]">
          <p>Não tem uma conta? Entre em contato com o administrador.</p>
        </div>
      </div>
    </div>
  )
}
