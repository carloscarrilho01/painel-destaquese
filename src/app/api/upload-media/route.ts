import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Configurações por tipo de mídia
const MEDIA_CONFIG = {
  audio: {
    bucket: 'audios',
    extensions: ['ogg', 'mp3', 'wav', 'webm', 'mp4', 'mpeg', 'm4a', 'aac', 'opus'],
    mimeTypes: ['audio/'],
    maxSize: 10 * 1024 * 1024, // 10MB
    prefix: 'audio_'
  },
  image: {
    bucket: 'images',
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'],
    mimeTypes: ['image/'],
    maxSize: 5 * 1024 * 1024, // 5MB
    prefix: 'image_'
  },
  document: {
    bucket: 'documents',
    extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'zip', 'rar'],
    mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.', 'text/', 'application/zip', 'application/x-rar'],
    maxSize: 20 * 1024 * 1024, // 20MB
    prefix: 'doc_'
  },
  video: {
    bucket: 'videos',
    extensions: ['mp4', 'webm', 'ogg', 'mov', 'avi', 'wmv', 'flv', 'mkv'],
    mimeTypes: ['video/'],
    maxSize: 50 * 1024 * 1024, // 50MB
    prefix: 'video_'
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const mediaType = formData.get('type') as keyof typeof MEDIA_CONFIG || 'document'

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo fornecido' },
        { status: 400 }
      )
    }

    const config = MEDIA_CONFIG[mediaType]
    if (!config) {
      return NextResponse.json(
        { error: `Tipo de mídia inválido: ${mediaType}` },
        { status: 400 }
      )
    }

    // Validar extensão
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const isValidExtension = config.extensions.includes(fileExtension || '')

    // Validar MIME type
    const isValidMimeType = config.mimeTypes.some(mime => file.type.startsWith(mime))

    if (!isValidExtension && !isValidMimeType) {
      return NextResponse.json(
        {
          error: `Tipo de arquivo inválido. Extensões aceitas: ${config.extensions.join(', ')}. Tipo recebido: ${file.type}`,
          acceptedExtensions: config.extensions
        },
        { status: 400 }
      )
    }

    // Validar tamanho
    if (file.size > config.maxSize) {
      const maxSizeMB = config.maxSize / (1024 * 1024)
      return NextResponse.json(
        { error: `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB` },
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
    const fileName = `${config.prefix}${timestamp}_${randomId}.${fileExtension}`

    // Converter File para ArrayBuffer e depois para Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload para Supabase Storage
    const { data, error } = await supabase.storage
      .from(config.bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Erro ao fazer upload para Supabase:', error)
      return NextResponse.json(
        {
          error: `Falha ao fazer upload do arquivo. Verifique se o bucket '${config.bucket}' existe e está configurado corretamente.`,
          details: error.message
        },
        { status: 500 }
      )
    }

    // Obter URL pública do arquivo
    const { data: urlData } = supabase.storage
      .from(config.bucket)
      .getPublicUrl(data.path)

    return NextResponse.json({
      success: true,
      mediaUrl: urlData.publicUrl,
      fileName: fileName,
      fileSize: file.size,
      mimeType: file.type,
      mediaType: mediaType,
      bucket: config.bucket
    })

  } catch (error) {
    console.error('Erro ao processar upload:', error)
    return NextResponse.json(
      { error: 'Erro interno ao processar upload' },
      { status: 500 }
    )
  }
}
