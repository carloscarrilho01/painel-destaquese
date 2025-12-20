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
import { FileText, Search, Plus, Trash2, X } from 'lucide-react'

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
    try {
      const response = await fetch('/api/templates')
      const data = await response.json()

      if (data.templates) {
        setTemplates(data.templates)
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
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
      alert('Título e conteúdo são obrigatórios')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate),
      })

      if (response.ok) {
        await loadTemplates()
        setNewTemplate({ title: '', content: '', category: '' })
        setShowCreateForm(false)
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao criar template')
      }
    } catch (error) {
      console.error('Erro ao criar template:', error)
      alert('Erro ao criar template')
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
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadTemplates()
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao excluir template')
      }
    } catch (error) {
      console.error('Erro ao excluir template:', error)
      alert('Erro ao excluir template')
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
        <Button
          variant="outline"
          size="icon"
          type="button"
          title="Mensagens Rápidas"
        >
          <FileText className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 p-0"
        align="end"
        side="top"
        sideOffset={10}
      >
        <div className="flex flex-col max-h-[500px]">
          {/* Header com busca e botão criar */}
          <div className="p-3 border-b bg-gray-50">
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
              <Button
                size="sm"
                onClick={() => setShowCreateForm(!showCreateForm)}
                variant={showCreateForm ? "default" : "outline"}
                className="h-9"
              >
                {showCreateForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>

            {/* Formulário de criar template */}
            {showCreateForm && (
              <div className="space-y-2 pt-2 border-t">
                <Input
                  placeholder="Título do template"
                  value={newTemplate.title}
                  onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                  className="h-8 text-sm"
                />
                <Input
                  placeholder="Categoria (opcional)"
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                  className="h-8 text-sm"
                />
                <Textarea
                  placeholder="Conteúdo (use {{variavel}} para campos dinâmicos)"
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  rows={3}
                  className="text-sm resize-none"
                />
                <Button
                  size="sm"
                  onClick={handleCreateTemplate}
                  disabled={isLoading || !newTemplate.title.trim() || !newTemplate.content.trim()}
                  className="w-full h-8"
                >
                  {isLoading ? 'Criando...' : 'Criar Template'}
                </Button>
              </div>
            )}
          </div>

          {/* Lista de templates */}
          <ScrollArea className="flex-1 max-h-[350px]">
            {isLoading && !showCreateForm ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Carregando templates...
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                {searchQuery ? 'Nenhum template encontrado' : 'Nenhum template disponível'}
                {!searchQuery && (
                  <p className="text-xs mt-1">Clique em + para criar seu primeiro template</p>
                )}
              </div>
            ) : (
              <div className="p-2">
                {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                  <div key={category} className="mb-3">
                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
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
                            className="w-full text-left p-2 pr-10 rounded-md hover:bg-gray-100 transition-colors"
                          >
                            <div className="font-medium text-sm">{template.title}</div>
                            <div className="text-xs text-gray-500 line-clamp-2 mt-1">
                              {template.content}
                            </div>
                            {template.variables.length > 0 && (
                              <div className="flex gap-1 mt-1.5 flex-wrap">
                                {template.variables.map((variable) => (
                                  <span
                                    key={variable}
                                    className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded"
                                  >
                                    {variable}
                                  </span>
                                ))}
                              </div>
                            )}
                          </button>
                          <button
                            onClick={(e) => handleDeleteTemplate(template.id, e)}
                            className="absolute right-2 top-2 p-1.5 rounded hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Excluir template"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-600" />
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
          {!showCreateForm && (
            <div className="p-2 border-t bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                Clique em um template para usá-lo • Passe o mouse para excluir
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
