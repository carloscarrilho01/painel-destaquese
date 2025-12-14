'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Trash2, Send } from 'lucide-react'

type AudioRecorderProps = {
  onSendAudio: (audioBlob: Blob) => void
  onCancel: () => void
  disabled?: boolean
}

export function AudioRecorder({ onSendAudio, onCancel, disabled = false }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Detectar melhor MIME type suportado
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/mp4',
        'audio/mpeg'
      ]

      const supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'audio/webm'

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: supportedMimeType
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: supportedMimeType })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))

        // Parar todas as tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Erro ao acessar microfone:', error)
      alert('Erro ao acessar microfone. Verifique as permissões.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const cancelRecording = () => {
    if (isRecording) {
      stopRecording()
    }

    setAudioBlob(null)
    setAudioUrl(null)
    setRecordingTime(0)
    onCancel()
  }

  const handleSend = () => {
    if (audioBlob) {
      onSendAudio(audioBlob)
      setAudioBlob(null)
      setAudioUrl(null)
      setRecordingTime(0)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Se está gravando
  if (isRecording) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-red-500">Gravando...</span>
          <span className="text-sm text-[var(--muted)] ml-2">{formatTime(recordingTime)}</span>
        </div>

        <button
          onClick={stopRecording}
          className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
          title="Parar gravação"
        >
          <Square size={18} fill="white" />
        </button>

        <button
          onClick={cancelRecording}
          className="bg-[var(--muted)] text-white p-2 rounded-lg hover:opacity-80 transition-opacity"
          title="Cancelar"
        >
          <Trash2 size={18} />
        </button>
      </div>
    )
  }

  // Se tem áudio gravado (preview)
  if (audioBlob && audioUrl) {
    return (
      <div className="flex items-center gap-3 p-4 bg-[var(--card)] border border-[var(--border)] rounded-lg">
        <audio src={audioUrl} controls className="flex-1" />

        <button
          onClick={handleSend}
          disabled={disabled}
          className="bg-[var(--primary)] text-white p-2 rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Enviar áudio"
        >
          <Send size={18} />
        </button>

        <button
          onClick={cancelRecording}
          disabled={disabled}
          className="bg-[var(--muted)] text-white p-2 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          title="Descartar"
        >
          <Trash2 size={18} />
        </button>
      </div>
    )
  }

  // Estado inicial - botão para começar a gravar
  return (
    <button
      onClick={startRecording}
      disabled={disabled}
      className="bg-[var(--primary)] text-white p-2 rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Gravar áudio"
    >
      <Mic size={18} />
    </button>
  )
}
