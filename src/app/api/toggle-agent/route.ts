import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { telefone, trava } = body

    // Validação
    if (!telefone) {
      return NextResponse.json(
        { error: 'Telefone é obrigatório' },
        { status: 400 }
      )
    }

    if (typeof trava !== 'boolean') {
      return NextResponse.json(
        { error: 'Campo trava deve ser true ou false' },
        { status: 400 }
      )
    }

    // Normalizar telefone (remover caracteres especiais)
    const telefoneNormalizado = telefone.replace(/\D/g, '')

    // Buscar lead pelo telefone (tentar múltiplas variações)
    const { data: leads, error: searchError } = await supabase
      .from('leads')
      .select('*')
      .or(`telefone.eq.${telefone},telefone.eq.${telefoneNormalizado}`)

    if (searchError) {
      console.error('Erro ao buscar lead:', searchError)
      return NextResponse.json(
        { error: 'Erro ao buscar lead no banco de dados' },
        { status: 500 }
      )
    }

    // Se não encontrou, criar novo lead
    if (!leads || leads.length === 0) {
      const { data: newLead, error: insertError } = await supabase
        .from('leads')
        .insert({
          telefone: telefoneNormalizado,
          trava,
          nome: null,
          interessado: false,
          followup: 0
        })
        .select()
        .single()

      if (insertError) {
        console.error('Erro ao criar lead:', insertError)
        return NextResponse.json(
          { error: 'Erro ao criar lead no banco de dados' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: trava ? 'Agente pausado com sucesso' : 'Agente reativado com sucesso',
        lead: newLead,
        created: true
      })
    }

    // Se encontrou, atualizar
    const lead = leads[0]
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update({ trava })
      .eq('id', lead.id)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar lead:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar lead no banco de dados' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: trava ? 'Agente pausado com sucesso' : 'Agente reativado com sucesso',
      lead: updatedLead,
      created: false
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'online',
    endpoint: '/api/toggle-agent',
    methods: ['POST'],
    description: 'Alterna o status de trava do agente para um lead específico'
  })
}
