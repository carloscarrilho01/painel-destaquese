import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Listar todas as mensagens rápidas
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('quick_messages')
      .select('*')
      .eq('ativo', true)
      .order('ordem', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar mensagens rápidas:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Erro ao buscar mensagens rápidas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova mensagem rápida
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { titulo, conteudo, categoria, atalho, ordem } = body

    if (!titulo || !conteudo) {
      return NextResponse.json(
        { error: 'Título e conteúdo são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se atalho já existe (se fornecido)
    if (atalho) {
      const { data: existing } = await supabase
        .from('quick_messages')
        .select('id')
        .eq('atalho', atalho)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: `O atalho "${atalho}" já está em uso` },
          { status: 400 }
        )
      }
    }

    const { data, error } = await supabase
      .from('quick_messages')
      .insert({
        titulo,
        conteudo,
        categoria: categoria || null,
        atalho: atalho || null,
        ordem: ordem || 0,
        ativo: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar mensagem rápida:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar mensagem rápida:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar mensagem rápida
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, titulo, conteudo, categoria, atalho, ordem, ativo } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se atalho já existe em outra mensagem (se fornecido)
    if (atalho) {
      const { data: existing } = await supabase
        .from('quick_messages')
        .select('id')
        .eq('atalho', atalho)
        .neq('id', id)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: `O atalho "${atalho}" já está em uso` },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (titulo !== undefined) updateData.titulo = titulo
    if (conteudo !== undefined) updateData.conteudo = conteudo
    if (categoria !== undefined) updateData.categoria = categoria || null
    if (atalho !== undefined) updateData.atalho = atalho || null
    if (ordem !== undefined) updateData.ordem = ordem
    if (ativo !== undefined) updateData.ativo = ativo

    const { data, error } = await supabase
      .from('quick_messages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar mensagem rápida:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao atualizar mensagem rápida:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Remover mensagem rápida
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('quick_messages')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao excluir mensagem rápida:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir mensagem rápida:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
