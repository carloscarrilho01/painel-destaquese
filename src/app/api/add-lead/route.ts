import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { telefone, nome, interesse, stage } = body

    // Validação
    if (!telefone) {
      return NextResponse.json(
        { error: 'Telefone é obrigatório' },
        { status: 400 }
      )
    }

    // Normalizar telefone (remover caracteres especiais)
    const telefoneNormalizado = telefone.replace(/\D/g, '')

    // Validar formato de telefone
    if (telefoneNormalizado.length < 10 || telefoneNormalizado.length > 13) {
      return NextResponse.json(
        { error: 'Formato de telefone inválido. Use DDD + número (ex: 11999999999)' },
        { status: 400 }
      )
    }

    // Validar stage se fornecido
    const validStages = ['novo', 'contato', 'interessado', 'negociacao', 'fechado', 'perdido']
    const finalStage = stage && validStages.includes(stage) ? stage : 'novo'

    // Verificar se lead já existe
    const { data: existingLeads, error: searchError } = await supabase
      .from('leads')
      .select('id, telefone, nome')
      .or(`telefone.eq.${telefone},telefone.eq.${telefoneNormalizado}`)

    if (searchError) {
      console.error('Erro ao buscar leads existentes:', searchError)
      return NextResponse.json(
        { error: 'Erro ao verificar leads existentes' },
        { status: 500 }
      )
    }

    // Se já existe, retornar erro
    if (existingLeads && existingLeads.length > 0) {
      const existingLead = existingLeads[0]
      return NextResponse.json(
        {
          error: 'Lead já existe',
          details: `Já existe um lead cadastrado com este telefone${existingLead.nome ? `: ${existingLead.nome}` : ''}`,
          leadId: existingLead.id
        },
        { status: 409 }
      )
    }

    // Criar novo lead
    const { data: newLead, error: insertError } = await supabase
      .from('leads')
      .insert({
        telefone: telefoneNormalizado,
        nome: nome || null,
        interesse: interesse || null,
        stage: finalStage,
        trava: false,
        interessado: finalStage === 'interessado' || finalStage === 'negociacao',
        followup: 0
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao criar lead:', insertError)

      // Verificar se o erro é devido ao campo stage não existir
      if (insertError.message?.includes('column') && insertError.message?.includes('stage')) {
        return NextResponse.json(
          {
            error: 'Campo "stage" não encontrado no banco de dados. Execute o SQL em KANBAN_MIGRATION.sql no Supabase primeiro.',
            details: insertError.message
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        {
          error: 'Erro ao criar lead no banco de dados',
          details: insertError.message
        },
        { status: 500 }
      )
    }

    if (!newLead) {
      return NextResponse.json(
        { error: 'Lead não foi criado' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Lead adicionado com sucesso',
      lead: newLead
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
    endpoint: '/api/add-lead',
    methods: ['POST'],
    description: 'Adiciona um novo lead ao sistema',
    requiredFields: ['telefone'],
    optionalFields: ['nome', 'interesse', 'stage']
  })
}
