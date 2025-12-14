import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Nenhum arquivo de áudio fornecido' },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    const validTypes = ['audio/ogg', 'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/mp4']
    if (!validTypes.includes(audioFile.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo inválido. Use OGG, MP3, WAV, WEBM ou MP4' },
        { status: 400 }
      )
    }

    // Validar tamanho (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Tamanho máximo: 10MB' },
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

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(7)
    const extension = audioFile.name.split('.').pop() || 'ogg'
    const fileName = `audio_${timestamp}_${randomId}.${extension}`

    // Converter File para ArrayBuffer e depois para Buffer
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload para Supabase Storage
    const { data, error } = await supabase.storage
      .from('audios')
      .upload(fileName, buffer, {
        contentType: audioFile.type,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Erro ao fazer upload para Supabase:', error)
      return NextResponse.json(
        { error: 'Falha ao fazer upload do áudio', details: error.message },
        { status: 500 }
      )
    }

    // Obter URL pública do arquivo
    const { data: urlData } = supabase.storage
      .from('audios')
      .getPublicUrl(data.path)

    return NextResponse.json({
      success: true,
      audioUrl: urlData.publicUrl,
      fileName: fileName,
      fileSize: audioFile.size,
      mimeType: audioFile.type
    })

  } catch (error) {
    console.error('Erro ao processar upload:', error)
    return NextResponse.json(
      { error: 'Erro interno ao processar upload' },
      { status: 500 }
    )
  }
}
