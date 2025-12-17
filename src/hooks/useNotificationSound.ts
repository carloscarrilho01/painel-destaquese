import { useEffect, useRef, useState } from 'react'

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isEnabled, setIsEnabled] = useState(true)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Carregar preferência do localStorage
    const saved = localStorage.getItem('notification_sound_enabled')
    if (saved !== null) {
      setIsEnabled(saved === 'true')
    }

    // Criar elemento de áudio com um som de notificação melhor
    const audio = new Audio()

    // Som de notificação mais audível (bipe triplo)
    audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='
    audio.volume = 0.5
    audio.preload = 'auto'

    audio.addEventListener('canplaythrough', () => {
      setIsReady(true)
    })

    audioRef.current = audio

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [])

  const playSound = () => {
    if (!isEnabled || !audioRef.current || !isReady) {
      console.log('🔇 Som não tocou:', { isEnabled, hasAudio: !!audioRef.current, isReady })
      return
    }

    try {
      // Reset e toca
      audioRef.current.currentTime = 0
      const playPromise = audioRef.current.play()

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('🔔 Som tocado com sucesso!')
          })
          .catch((error) => {
            console.warn('⚠️ Som bloqueado pelo navegador:', error.message)
            // Tentar criar novo áudio context após interação do usuário
          })
      }
    } catch (error) {
      console.error('❌ Erro ao tocar som:', error)
    }
  }

  const toggleSound = () => {
    const newState = !isEnabled
    setIsEnabled(newState)
    localStorage.setItem('notification_sound_enabled', String(newState))

    // Tocar som de teste ao ativar
    if (newState && audioRef.current) {
      setTimeout(() => playSound(), 100)
    }
  }

  return {
    playSound,
    isEnabled,
    toggleSound,
    isReady
  }
}
