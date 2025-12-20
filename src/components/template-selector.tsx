'use client'

import { useState, useEffect } from 'react'
import { MessageTemplate, Lead } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, Search, Plus, Trash2, X, Loader2 } from 'lucide-react'

interface TemplateSelectorProps {
  onSelectTemplate: (content: string) => void
  leadData?: Lead
}

export function TemplateSelector({ onSelectTemplate, leadData }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<MessageTemplate[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    content: '',
    category: '',
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen])

  useEffect(() => {
    filterTemplates()
  }, [searchQuery, templates])

  const loadTemplates = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/templates')

      if (!response.ok) {
        throw new Error('Erro ao carregar templates')
      }

      const data = await response.json()

      if (data.templates) {
        setTemplates(data.templates)
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
      setError('Erro ao carregar templates. Verifique a conexão.')
    } finally {
      setIsLoading(false)
    }
  }

  const filterTemplates = () => {
    if (!searchQuery.trim()) {
      setFilteredTemplates(templates)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = templates.filter(template =>
      template.title.toLowerCase().includes(query) ||
      template.content.toLowerCase().includes(query) ||
      template.category?.toLowerCase().includes(query)
    )
    setFilteredTemplates(filtered)
  }

  const replaceVariables = (content: string): string => {
    let result = content

    if (leadData) {
      // Substituir variáveis conhecidas
      if (leadData.nome) {
        result = result.replace(/\{\{nome\}\}/g, leadData.nome)
      }
      if (leadData.telefone) {
        result = result.replace(/\{\{telefone\}\}/g, leadData.telefone)
      }
      if (leadData.interesse) {
        result = result.replace(/\{\{interesse\}\}/g, leadData.interesse)
      }

      // Converter valores numéricos e booleanos para string
      Object.entries(leadData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
          result = result.replace(regex, String(value))
        }
      })
    }

    return result
  }

  const handleSelectTemplate = (template: MessageTemplate) => {
    const processedContent = replaceVariables(template.content)
    onSelectTemplate(processedContent)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleCreateTemplate = async () => {
    if (!newTemplate.title.trim() || !newTemplate.content.trim()) {
      setError('Título e conteúdo são obrigatórios')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar template')
      }

      await loadTemplates()
      setNewTemplate({ title: '', content: '', category: '' })
      setShowCreateForm(false)
    } catch (error) {
      console.error('Erro ao criar template:', error)
      setError(error instanceof Error ? error.message : 'Erro ao criar template')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!confirm('Deseja realmente excluir este template?')) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao excluir template')
      }

      await loadTemplates()
    } catch (error) {
      console.error('Erro ao excluir template:', error)
      setError(error instanceof Error ? error.message : 'Erro ao excluir template')
    } finally {
      setIsLoading(false)
    }
  }

  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const category = template.category || 'Sem Categoria'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(template)
    return acc
  }, {} as Record<string, MessageTemplate[]>)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="p-2 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--card-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Mensagens Rápidas"
        >
          <FileText className="h-[18px] w-[18px]" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[420px] p-0 shadow-xl"
        align="end"
        side="top"
        sideOffset={8}
      >
        <div className="flex flex-col" style={{ maxHeight: '70vh' }}>
          {/* Header com busca e botão criar */}
          <div className="p-4 border-b bg-white">
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setShowCreateForm(!showCreateForm)
                  setError(null)
                }}
                variant={showCreateForm ? "default" : "outline"}
                className="h-9 px-3"
              >
                {showCreateForm ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Mensagem de erro */}
            {error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Formulário de criar template */}
            {showCreateForm && (
              <div className="space-y-2 pt-3 mt-3 border-t">
                <Input
                  placeholder="Título do template"
                  value={newTemplate.title}
                  onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                  className="h-9 text-sm bg-white border-gray-300 text-gray-900"
                />
                <Input
                  placeholder="Categoria (opcional)"
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                  className="h-9 text-sm bg-white border-gray-300 text-gray-900"
                />
                <Textarea
                  placeholder="Conteúdo (use {{variavel}} para campos dinâmicos)"
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  rows={3}
                  className="text-sm resize-none bg-white border-gray-300 text-gray-900"
                />
                <Button
                  size="sm"
                  onClick={handleCreateTemplate}
                  disabled={isLoading || !newTemplate.title.trim() || !newTemplate.content.trim()}
                  className="w-full h-9"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Template'
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Lista de templates */}
          <ScrollArea className="flex-1" style={{ maxHeight: '50vh' }}>
            {isLoading && !showCreateForm ? (
              <div className="p-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                <p className="text-sm text-gray-600 mt-2">Carregando templates...</p>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-600 font-medium">
                  {searchQuery ? 'Nenhum template encontrado' : 'Nenhum template disponível'}
                </p>
                {!searchQuery && (
                  <p className="text-xs text-gray-500 mt-1">Clique em + para criar seu primeiro template</p>
                )}
              </div>
            ) : (
              <div className="p-2">
                {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                  <div key={category} className="mb-4">
                    <div className="px-2 py-1.5 text-xs font-bold text-gray-700 uppercase tracking-wide">
                      {category}
                    </div>
                    <div className="space-y-1">
                      {categoryTemplates.map((template) => (
                        <div
                          key={template.id}
                          className="group relative"
                        >
                          <button
                            onClick={() => handleSelectTemplate(template)}
                            className="w-full text-left p-3 pr-12 rounded-lg hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200"
                          >
                            <div className="font-semibold text-sm text-gray-900">{template.title}</div>
                            <div className="text-sm text-gray-600 line-clamp-2 mt-1">
                              {template.content}
                            </div>
                            {template.variables.length > 0 && (
                              <div className="flex gap-1 mt-2 flex-wrap">
                                {template.variables.map((variable) => (
                                  <span
                                    key={variable}
                                    className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-medium"
                                  >
                                    {variable}
                                  </span>
                                ))}
                              </div>
                            )}
                          </button>
                          <button
                            onClick={(e) => handleDeleteTemplate(template.id, e)}
                            className="absolute right-3 top-3 p-1.5 rounded-md hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Excluir template"
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {!showCreateForm && filteredTemplates.length > 0 && (
            <div className="p-3 border-t bg-gray-50">
              <p className="text-xs text-gray-600 text-center">
                Clique para usar • Passe o mouse e clique em 🗑️ para excluir
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
