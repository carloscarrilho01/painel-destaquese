import { useEffect, useRef, useState } from 'react'

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isEnabled, setIsEnabled] = useState(true)

  useEffect(() => {
    // Carregar preferência do localStorage
    const saved = localStorage.getItem('notification_sound_enabled')
    if (saved !== null) {
      setIsEnabled(saved === 'true')
    }

    // Criar elemento de áudio usando um som base64 (notificação curta e agradável)
    // Este é um beep suave de notificação
    const audio = new Audio()
    audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTcIGWi77eeeTRAMUKfj8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606OunVRUKRp/g8r5sIQUrgs7y2Yk3CBlou+3nnk0QDFD3+O8='
    audioRef.current = audio

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [])

  const playSound = () => {
    if (!isEnabled || !audioRef.current) return

    try {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch((error) => {
        // Ignorar erros de autoplay (requer interação do usuário primeiro)
        console.debug('Notification sound blocked:', error)
      })
    } catch (error) {
      console.debug('Error playing notification sound:', error)
    }
  }

  const toggleSound = () => {
    const newState = !isEnabled
    setIsEnabled(newState)
    localStorage.setItem('notification_sound_enabled', String(newState))
  }

  return {
    playSound,
    isEnabled,
    toggleSound
  }
}
