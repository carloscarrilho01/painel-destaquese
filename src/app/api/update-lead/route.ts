import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { leadId, updates } = body

    if (!leadId) {
      return NextResponse.json(
        { error: 'ID do lead é obrigatório' },
        { status: 400 }
      )
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma atualização fornecida' },
        { status: 400 }
      )
    }

    // Configurar Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase não configurado' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Atualizar lead
    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', leadId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar lead:', error)
      return NextResponse.json(
        { error: 'Falha ao atualizar lead', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      lead: data
    })

  } catch (error) {
    console.error('Erro ao processar atualização:', error)
    return NextResponse.json(
      { error: 'Erro interno ao processar atualização' },
      { status: 500 }
    )
  }
}
