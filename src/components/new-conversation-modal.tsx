'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface NewConversationModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (sessionId: string) => void
  initialPhone?: string
  initialName?: string
}

export function NewConversationModal({
  open,
  onClose,
  onSuccess,
  initialPhone = '',
  initialName = ''
}: NewConversationModalProps) {
  const [phone, setPhone] = useState(initialPhone)
  const [name, setName] = useState(initialName)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Atualiza os valores quando o modal abre com novos valores iniciais
  useEffect(() => {
    if (open) {
      setPhone(initialPhone)
      setName(initialName)
      setMessage('')
      setError('')
    }
  }, [open, initialPhone, initialName])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validar telefone
      const cleanPhone = phone.replace(/\D/g, '')
      if (cleanPhone.length < 10) {
        setError('Telefone inválido. Use o formato completo (ex: 5511999999999)')
        setLoading(false)
        return
      }

      // 1. Criar lead se nome fornecido
      if (name) {
        const leadResponse = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telefone: cleanPhone,
            nome: name
          })
        })

        if (!leadResponse.ok && leadResponse.status !== 200) {
          throw new Error('Erro ao criar lead')
        }
      }

      // 2. Enviar primeira mensagem (se fornecida)
      if (message.trim()) {
        const sendResponse = await fetch('/api/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cleanPhone,
            message: message.trim(),
            clientName: name || cleanPhone
          })
        })

        if (!sendResponse.ok) {
          throw new Error('Erro ao enviar mensagem')
        }
      }

      // 3. Sucesso - redirecionar para a conversa
      onSuccess(cleanPhone)

      // Resetar formulário
      setPhone('')
      setName('')
      setMessage('')
      onClose()
    } catch (err) {
      console.error('Erro ao criar conversa:', err)
      setError(err instanceof Error ? err.message : 'Erro ao criar conversa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Nova Conversa
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Telefone *
            </label>
            <input
              id="phone"
              type="text"
              placeholder="5511999999999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Formato: código do país + DDD + número (ex: 5511999999999)
            </p>
          </div>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Nome (opcional)
            </label>
            <input
              id="name"
              type="text"
              placeholder="João Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Primeira mensagem (opcional)
            </label>
            <textarea
              id="message"
              placeholder="Olá! Como posso ajudar?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !phone}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Criando...' : 'Iniciar Conversa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
