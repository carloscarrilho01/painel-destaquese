'use client'

import { useRef, useState } from 'react'
import { Paperclip, X, Upload, Image as ImageIcon, FileText, Film } from 'lucide-react'
import type { MessageType } from '@/lib/types'

type MediaUploaderProps = {
  onFileSelect: (file: File, mediaType: MessageType) => void
  onCancel: () => void
  disabled?: boolean
  mediaType?: 'audio' | 'image' | 'document' | 'video'
}

const MEDIA_CONFIG = {
  audio: {
    accept: 'audio/*',
    label: 'Áudio',
    icon: Paperclip,
    extensions: '.ogg,.mp3,.wav,.webm,.mp4,.m4a,.aac,.opus'
  },
  image: {
    accept: 'image/*',
    label: 'Imagem',
    icon: ImageIcon,
    extensions: '.jpg,.jpeg,.png,.gif,.webp,.svg,.bmp'
  },
  document: {
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar',
    label: 'Documento',
    icon: FileText,
    extensions: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar'
  },
  video: {
    accept: 'video/*',
    label: 'Vídeo',
    icon: Film,
    extensions: '.mp4,.webm,.ogg,.mov,.avi,.wmv,.flv,.mkv'
  }
}

export function MediaUploader({
  onFileSelect,
  onCancel,
  disabled = false,
  mediaType = 'image'
}: MediaUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const config = MEDIA_CONFIG[mediaType]
  const Icon = config.icon

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (file) {
      setSelectedFile(file)

      // Criar preview se for áudio, imagem ou vídeo
      if (file.type.startsWith('audio/') || file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file)
        setPreview(url)
      }
    }
  }

  const handleConfirm = () => {
    if (selectedFile) {
      onFileSelect(selectedFile, mediaType)
      resetState()
    }
  }

  const handleCancel = () => {
    resetState()
    onCancel()
  }

  const resetState = () => {
    setSelectedFile(null)
    if (preview) {
      URL.revokeObjectURL(preview)
      setPreview(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  // Se arquivo selecionado, mostrar preview
  if (selectedFile) {
    return (
      <div className="flex flex-col gap-3 p-4 bg-[var(--card)] border border-[var(--border)] rounded-lg">
        <div className="flex items-center gap-3">
          <Icon size={18} className="text-[var(--primary)]" />
          <div className="flex-1">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-[var(--muted)]">{formatFileSize(selectedFile.size)}</p>
          </div>
        </div>

        {/* Preview de imagem */}
        {preview && selectedFile.type.startsWith('image/') && (
          <div className="rounded-lg overflow-hidden bg-black/5">
            <img
              src={preview}
              alt="Preview"
              className="max-h-48 w-auto mx-auto"
            />
          </div>
        )}

        {/* Preview de áudio */}
        {preview && selectedFile.type.startsWith('audio/') && (
          <audio src={preview} controls className="w-full" />
        )}

        {/* Preview de vídeo */}
        {preview && selectedFile.type.startsWith('video/') && (
          <video src={preview} controls className="w-full max-h-48 rounded-lg" />
        )}

        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={disabled}
            className="flex-1 bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Upload size={16} />
            <span>Enviar {config.label.toLowerCase()}</span>
          </button>

          <button
            onClick={handleCancel}
            disabled={disabled}
            className="bg-[var(--muted)] text-white px-4 py-2 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    )
  }

  // Estado inicial - botão para selecionar arquivo
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={config.accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="bg-[var(--primary)] text-white p-2 rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={`Anexar ${config.label.toLowerCase()}`}
      >
        <Icon size={18} />
      </button>
    </>
  )
}
