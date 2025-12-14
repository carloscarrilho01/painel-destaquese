import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json(
        { error: 'Supabase não configurado' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { leadId, trava } = body

    // Validações básicas
    if (!leadId || typeof trava !== 'boolean') {
      return NextResponse.json(
        { error: 'leadId e trava (boolean) são obrigatórios' },
        { status: 400 }
      )
    }

    // Atualizar o campo trava no lead
    const { data, error } = await supabase
      .from('leads')
      .update({ trava })
      .eq('id', leadId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar trava:', error)
      return NextResponse.json(
        { error: 'Falha ao atualizar status de trava', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Agente ${trava ? 'pausado' : 'retomado'} com sucesso`,
      lead: data
    })

  } catch (error) {
    console.error('Erro ao processar toggle de trava:', error)
    return NextResponse.json(
      { error: 'Erro interno ao processar requisição' },
      { status: 500 }
    )
  }
}
