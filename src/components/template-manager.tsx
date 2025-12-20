'use client'

import { useState, useEffect } from 'react'
import { MessageTemplate } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Trash2, Edit2, Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'

export function TemplateManager() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
  })

  useEffect(() => {
    loadTemplates()
  }, [])

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

  const handleCreateTemplate = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Título e conteúdo são obrigatórios')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await loadTemplates()
        setIsDialogOpen(false)
        resetForm()
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

  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !formData.title.trim() || !formData.content.trim()) {
      alert('Título e conteúdo são obrigatórios')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await loadTemplates()
        setIsDialogOpen(false)
        setEditingTemplate(null)
        resetForm()
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao atualizar template')
      }
    } catch (error) {
      console.error('Erro ao atualizar template:', error)
      alert('Erro ao atualizar template')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
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

  const openEditDialog = (template: MessageTemplate) => {
    setEditingTemplate(template)
    setFormData({
      title: template.title,
      content: template.content,
      category: template.category || '',
    })
    setIsDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingTemplate(null)
    resetForm()
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: '',
    })
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingTemplate(null)
    resetForm()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Mensagens Rápidas</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie templates de mensagens para respostas rápidas
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Editar Template' : 'Novo Template'}
              </DialogTitle>
              <DialogDescription>
                {editingTemplate
                  ? 'Edite as informações do template'
                  : 'Crie um novo template de mensagem rápida'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Ex: Boas-vindas"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="Ex: Atendimento, Vendas, Suporte"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">Conteúdo</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Use {{variavel}} para campos dinâmicos. Ex: Olá {{nome}}!"
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Variáveis disponíveis: {'{{nome}}'}, {'{{telefone}}'}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button
                onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingTemplate ? 'Salvando...' : 'Criando...'}
                  </>
                ) : (
                  <>{editingTemplate ? 'Salvar' : 'Criar'}</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && templates.length === 0 ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-muted/50">
          <p className="text-muted-foreground">Nenhum template criado ainda</p>
          <p className="text-sm text-muted-foreground mt-1">
            Clique em "Novo Template" para criar seu primeiro template
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Conteúdo</TableHead>
                <TableHead>Variáveis</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.title}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">
                      {template.category || 'Sem Categoria'}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="truncate text-sm text-muted-foreground">
                      {template.content}
                    </p>
                  </TableCell>
                  <TableCell>
                    {template.variables.length > 0 ? (
                      <div className="flex gap-1 flex-wrap">
                        {template.variables.map((variable) => (
                          <span
                            key={variable}
                            className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded"
                          >
                            {variable}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(template)}
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTemplate(template.id)}
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
