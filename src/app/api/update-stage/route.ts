import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { leadId, stage } = body

    // Validação
    if (!leadId) {
      return NextResponse.json(
        { error: 'ID do lead é obrigatório' },
        { status: 400 }
      )
    }

    if (!stage) {
      return NextResponse.json(
        { error: 'Stage é obrigatório' },
        { status: 400 }
      )
    }

    // Validar stages permitidos
    const validStages = ['novo', 'contato', 'interessado', 'negociacao', 'fechado', 'perdido']
    if (!validStages.includes(stage)) {
      return NextResponse.json(
        { error: `Stage inválido. Use um dos seguintes: ${validStages.join(', ')}` },
        { status: 400 }
      )
    }

    // Atualizar stage no banco
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update({ stage })
      .eq('id', leadId)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar stage do lead:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar stage no banco de dados' },
        { status: 500 }
      )
    }

    if (!updatedLead) {
      return NextResponse.json(
        { error: 'Lead não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Lead movido para "${stage}" com sucesso`,
      lead: updatedLead
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
    endpoint: '/api/update-stage',
    methods: ['POST'],
    description: 'Atualiza o estágio (stage) de um lead no CRM Kanban',
    validStages: ['novo', 'contato', 'interessado', 'negociacao', 'fechado', 'perdido']
  })
}
