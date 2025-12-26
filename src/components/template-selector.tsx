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
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, Search } from 'lucide-react'

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
      <PopoverContent className="w-96 p-0" align="start">
        <div className="flex flex-col h-[400px]">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Carregando templates...
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {searchQuery ? 'Nenhum template encontrado' : 'Nenhum template disponível'}
              </div>
            ) : (
              <div className="p-2">
                {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                  <div key={category} className="mb-4">
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                      {category}
                    </div>
                    <div className="space-y-1">
                      {categoryTemplates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleSelectTemplate(template)}
                          className="w-full text-left p-2 rounded-md hover:bg-accent transition-colors"
                        >
                          <div className="font-medium text-sm">{template.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
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
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="p-2 border-t bg-muted/50">
            <p className="text-xs text-muted-foreground text-center">
              Clique em um template para usá-lo
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
