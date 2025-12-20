import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { MessageTemplate } from '@/lib/types'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: templates, error } = await supabase
      .from('message_templates')
      .select('*')
      .order('category', { ascending: true })
      .order('title', { ascending: true })

    if (error) {
      console.error('Erro ao buscar templates:', error)
      return NextResponse.json(
        { error: `Erro ao buscar templates: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ templates: templates as MessageTemplate[] })
  } catch (error) {
    console.error('Erro no servidor:', error)
    return NextResponse.json(
      { error: `Erro interno: ${error instanceof Error ? error.message : 'Desconhecido'}` },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { title, content, category } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Título e conteúdo são obrigatórios' },
        { status: 400 }
      )
    }

    // Extrair variáveis do conteúdo ({{variavel}})
    const extractedVariables = content.match(/\{\{(\w+)\}\}/g)?.map((v: string) =>
      v.replace(/\{\{|\}\}/g, '')
    ) || []

    console.log('Tentando inserir template:', { title, content, category, variables: extractedVariables })

    const { data: template, error } = await supabase
      .from('message_templates')
      .insert({
        title,
        content,
        category: category || null,
        variables: extractedVariables
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar template:', error)
      return NextResponse.json(
        { error: `Erro ao criar template: ${error.message}. Código: ${error.code}` },
        { status: 500 }
      )
    }

    console.log('Template criado com sucesso:', template)

    return NextResponse.json({ template: template as MessageTemplate }, { status: 201 })
  } catch (error) {
    console.error('Erro no servidor:', error)
    return NextResponse.json(
      { error: `Erro interno: ${error instanceof Error ? error.message : 'Desconhecido'}` },
      { status: 500 }
    )
  }
}
