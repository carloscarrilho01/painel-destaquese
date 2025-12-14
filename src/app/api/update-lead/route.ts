import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Criar novo lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lead } = body

    if (!lead || !lead.telefone) {
      return NextResponse.json(
        { error: 'Telefone é obrigatório' },
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

    // Criar lead com valores padrão
    const newLead = {
      telefone: lead.telefone,
      nome: lead.nome || null,
      interesse: lead.interesse || null,
      followup: lead.followup || 0,
      interessado: lead.interessado || false,
      trava: false,
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('leads')
      .insert([newLead])
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar lead:', error)
      return NextResponse.json(
        { error: 'Falha ao criar lead', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      lead: data
    })

  } catch (error) {
    console.error('Erro ao processar criação:', error)
    return NextResponse.json(
      { error: 'Erro interno ao processar criação' },
      { status: 500 }
    )
  }
}

// Atualizar lead existente
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

// Deletar lead
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('id')

    if (!leadId) {
      return NextResponse.json(
        { error: 'ID do lead é obrigatório' },
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

    // Deletar lead
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId)

    if (error) {
      console.error('Erro ao deletar lead:', error)
      return NextResponse.json(
        { error: 'Falha ao deletar lead', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Lead deletado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao processar deleção:', error)
    return NextResponse.json(
      { error: 'Erro interno ao processar deleção' },
      { status: 500 }
    )
  }
}
