import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { telefone, nome, interesse } = await request.json()

    if (!telefone) {
      return NextResponse.json(
        { error: 'Telefone é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se lead já existe
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .eq('telefone', telefone)
      .single()

    if (existing) {
      return NextResponse.json(
        { message: 'Lead já existe', lead: existing },
        { status: 200 }
      )
    }

    // Criar lead
    const { data, error } = await supabase
      .from('leads')
      .insert({
        telefone,
        nome: nome || null,
        interesse: interesse || null
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ message: 'Lead criado com sucesso', lead: data })
  } catch (error) {
    console.error('Erro ao criar lead:', error)
    return NextResponse.json(
      { error: 'Erro ao criar lead' },
      { status: 500 }
    )
  }
}
